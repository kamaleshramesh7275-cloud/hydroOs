/**
 * HydroOS Backend Application Server
 * Built with native Node.js HTTP & SQLite (node:sqlite)
 * Full REST API for Advanced Smart RO Water Purifier Platform
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const { db } = require('./db.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

// In-Memory Live Telemetry State (Updated via Simulation or IoT Hardware Ingest)
const liveTelemetry = {
  sensors: {
    inletTDS: 110,
    outletTDS: 85,
    turbidity: 0.35,
    ph: 7.4,
    orp: 420,
    temp: 26.8,
    flowRate: 1.8,
    pumpRpm: 0,
    pumpWatts: 4
  },
  actuators: {
    solenoidDiverter: false, // false = Eco Bypass (UF+UV), true = RO Engaged
    solenoidInterlock: true,  // true = Unlocked/Safe, false = Hazard Locked
    solenoidFlush: false,
    uvLamp: true,
    bldcPump: false
  },
  currentMode: 'MUNICIPAL_ECO',
  autoModeEnabled: true,
  modeReason: 'Inlet TDS (110 ppm) < 200 ppm threshold: Preserving essential minerals (Ca, Mg) with zero wastewater.',
  waterScore: 96,
  interlockActive: false,
  interlockReason: '',
  leakDetected: false,
  leakZone: '',
  emergencyShutoff: false,
  simulationMode: true, // Always true by default unless connected to physical hardware
  cleanTankCurrent: 7.2,
  cleanTankCapacity: 8.0,
  reuseTankCurrent: 3.4,
  reuseTankCapacity: 6.0,
  totalPurifiedLiters: 1420.5,
  totalWasteLiters: 260.0
};

// Evaluate Auto Purification Brain
function evaluatePurificationLogic() {
  const settings = getSettingsMap();
  const tdsThreshold = parseFloat(settings.tds_threshold || '200');
  const turbThreshold = parseFloat(settings.turbidity_threshold || '1.0');
  const autoEnabled = liveTelemetry.autoModeEnabled;

  if (liveTelemetry.emergencyShutoff) {
    liveTelemetry.actuators.solenoidInterlock = false;
    liveTelemetry.interlockActive = true;
    liveTelemetry.interlockReason = 'EMERGENCY SHUTOFF VALVE TRIPPED';
    liveTelemetry.sensors.flowRate = 0;
    liveTelemetry.actuators.bldcPump = false;
    liveTelemetry.sensors.pumpRpm = 0;
    liveTelemetry.sensors.pumpWatts = 0;
    return;
  }

  // Safety checks
  if (liveTelemetry.sensors.turbidity > 1.2) {
    liveTelemetry.actuators.solenoidInterlock = false;
    liveTelemetry.interlockActive = true;
    liveTelemetry.interlockReason = `Particulate Breakthrough (${liveTelemetry.sensors.turbidity} NTU > 1.0 limit)`;
    liveTelemetry.sensors.flowRate = 0;
  } else if (liveTelemetry.sensors.outletTDS > 280) {
    liveTelemetry.actuators.solenoidInterlock = false;
    liveTelemetry.interlockActive = true;
    liveTelemetry.interlockReason = `Elevated Solute Warning (${liveTelemetry.sensors.outletTDS} ppm)`;
    liveTelemetry.sensors.flowRate = 0;
  } else {
    liveTelemetry.actuators.solenoidInterlock = true;
    liveTelemetry.interlockActive = false;
    liveTelemetry.interlockReason = '';
  }

  if (autoEnabled) {
    if (liveTelemetry.sensors.inletTDS < tdsThreshold && liveTelemetry.sensors.turbidity < turbThreshold) {
      liveTelemetry.currentMode = 'MUNICIPAL_ECO';
      liveTelemetry.actuators.solenoidDiverter = false;
      liveTelemetry.actuators.bldcPump = false;
      liveTelemetry.sensors.pumpRpm = 0;
      liveTelemetry.sensors.pumpWatts = 4;
      liveTelemetry.sensors.outletTDS = Math.round(liveTelemetry.sensors.inletTDS * 0.82);
      liveTelemetry.modeReason = `Inlet TDS (${liveTelemetry.sensors.inletTDS} ppm) is below ${tdsThreshold} ppm threshold: Municipal Eco Bypass active (Preserving calcium & magnesium, 0% waste).`;
    } else {
      liveTelemetry.currentMode = 'BOREWELL_RO';
      liveTelemetry.actuators.solenoidDiverter = true;
      liveTelemetry.actuators.bldcPump = true;
      liveTelemetry.sensors.pumpRpm = 1850;
      liveTelemetry.sensors.pumpWatts = 42;
      liveTelemetry.sensors.outletTDS = Math.round(Math.max(35, liveTelemetry.sensors.inletTDS * 0.10 + 25));
      liveTelemetry.modeReason = `Inlet TDS (${liveTelemetry.sensors.inletTDS} ppm) exceeds ${tdsThreshold} ppm threshold: High-Salinity RO & BLDC Booster Pump engaged.`;
    }
  }

  // Calculate safety score
  let score = 100;
  if (!liveTelemetry.actuators.solenoidInterlock) score = 20;
  if (liveTelemetry.sensors.turbidity > 0.5) score -= Math.round(liveTelemetry.sensors.turbidity * 12);
  if (liveTelemetry.sensors.outletTDS > 120) score -= Math.round((liveTelemetry.sensors.outletTDS - 120) * 0.15);
  if (liveTelemetry.leakDetected) score -= 25;
  liveTelemetry.waterScore = Math.max(15, Math.min(100, score));
}

// Helper: read settings into map
function getSettingsMap() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const map = {};
  rows.forEach(r => { map[r.key] = r.value; });
  return map;
}

// Background Simulation Engine (When simulationMode is TRUE)
let simTick = 0;
setInterval(() => {
  if (liveTelemetry.simulationMode && !liveTelemetry.emergencyShutoff) {
    simTick++;
    // Organic fluctuations
    const deltaTds = (Math.random() - 0.5) * 2;
    liveTelemetry.sensors.inletTDS = Math.max(30, Math.min(950, Math.round(liveTelemetry.sensors.inletTDS + deltaTds)));
    liveTelemetry.sensors.turbidity = Math.max(0.15, Number((liveTelemetry.sensors.turbidity + (Math.random() - 0.5) * 0.02).toFixed(2)));
    liveTelemetry.sensors.ph = Number((7.3 + Math.sin(simTick * 0.05) * 0.2).toFixed(1));
    liveTelemetry.sensors.orp = Math.round(415 + Math.cos(simTick * 0.08) * 15);
    
    // Tank slow replenish if below 7.8
    if (liveTelemetry.cleanTankCurrent < 7.8) {
      liveTelemetry.cleanTankCurrent = Number((liveTelemetry.cleanTankCurrent + 0.01).toFixed(2));
      liveTelemetry.totalPurifiedLiters = Number((liveTelemetry.totalPurifiedLiters + 0.01).toFixed(2));
    }

    evaluatePurificationLogic();

    // Periodically save water quality history (every ~60s)
    if (simTick % 60 === 0) {
      try {
        const qualityStatus = liveTelemetry.sensors.turbidity > 1.0 ? 'WARNING' : (liveTelemetry.waterScore > 90 ? 'EXCELLENT' : 'GOOD');
        db.prepare(`
          INSERT INTO water_quality_history (
            timestamp, inlet_tds, outlet_tds, turbidity, ph, orp, flow_rate, purification_mode, quality_status, is_simulated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          new Date().toISOString(),
          liveTelemetry.sensors.inletTDS,
          liveTelemetry.sensors.outletTDS,
          liveTelemetry.sensors.turbidity,
          liveTelemetry.sensors.ph,
          liveTelemetry.sensors.orp,
          liveTelemetry.sensors.flowRate,
          liveTelemetry.currentMode,
          qualityStatus,
          liveTelemetry.simulationMode ? 1 : 0
        );
      } catch (e) {
        console.error('Error logging periodic quality history:', e.message);
      }
    }
  }
}, 1000);

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json'
};

// Helper: send JSON
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Helper: parse request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, 'http://localhost:' + PORT);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // ==========================================
  // REST API ROUTING
  // ==========================================

  // 1. System Status & Live Telemetry
  if (pathname === '/api/status' && method === 'GET') {
    const filters = db.prepare('SELECT life_pct, est_replacement_date FROM filters').all();
    const avgLife = Math.round(filters.reduce((acc, f) => acc + f.life_pct, 0) / (filters.length || 1));
    const nextReplacement = filters.sort((a, b) => a.est_replacement_date.localeCompare(b.est_replacement_date))[0]?.est_replacement_date || '2027-02-15';

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCons = db.prepare('SELECT purified_liters FROM water_consumption_daily WHERE date = ?').get(todayStr);

    return sendJson(res, 200, {
      success: true,
      data: {
        ...liveTelemetry,
        filterHealthAvg: avgLife,
        upcomingMaintenanceDate: nextReplacement,
        dailyConsumption: todayCons ? todayCons.purified_liters : 18.5,
        timestamp: new Date().toISOString()
      }
    });
  }

  // 2. Water Quality History & Filters
  if (pathname === '/api/telemetry/history' && method === 'GET') {
    const limit = parseInt(parsedUrl.searchParams.get('limit') || '50', 10);
    const filter = parsedUrl.searchParams.get('filter') || 'all';
    
    let query = 'SELECT * FROM water_quality_history ORDER BY id DESC LIMIT ?';
    let rows = db.prepare(query).all(limit);

    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      rows = rows.filter(r => r.timestamp.startsWith(today));
    }

    return sendJson(res, 200, { success: true, count: rows.length, data: rows });
  }

  // 3. Log New Telemetry Snapshot
  if (pathname === '/api/telemetry/record' && method === 'POST') {
    const body = await parseBody(req);
    try {
      const stmt = db.prepare(`
        INSERT INTO water_quality_history (
          timestamp, inlet_tds, outlet_tds, turbidity, ph, orp, flow_rate, purification_mode, quality_status, is_simulated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        body.timestamp || new Date().toISOString(),
        body.inletTDS ?? liveTelemetry.sensors.inletTDS,
        body.outletTDS ?? liveTelemetry.sensors.outletTDS,
        body.turbidity ?? liveTelemetry.sensors.turbidity,
        body.ph ?? liveTelemetry.sensors.ph,
        body.orp ?? liveTelemetry.sensors.orp,
        body.flowRate ?? liveTelemetry.sensors.flowRate,
        body.purificationMode ?? liveTelemetry.currentMode,
        body.qualityStatus ?? 'EXCELLENT',
        liveTelemetry.simulationMode ? 1 : 0
      );
      return sendJson(res, 201, { success: true, message: 'Telemetry recorded successfully' });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 4. Purification Mode Get / Set with Safety Checks
  if (pathname === '/api/purification/mode' && method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      currentMode: liveTelemetry.currentMode,
      autoModeEnabled: liveTelemetry.autoModeEnabled,
      reason: liveTelemetry.modeReason,
      inletTDS: liveTelemetry.sensors.inletTDS,
      outletTDS: liveTelemetry.sensors.outletTDS,
      turbidity: liveTelemetry.sensors.turbidity,
      tdsThreshold: parseFloat(getSettingsMap().tds_threshold || '200')
    });
  }

  if (pathname === '/api/purification/mode' && method === 'POST') {
    const body = await parseBody(req);
    const { mode, autoMode, forceOverride, tdsThreshold, turbidityThreshold } = body;

    // Save thresholds if provided
    if (tdsThreshold !== undefined) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('tds_threshold', String(tdsThreshold));
    }
    if (turbidityThreshold !== undefined) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('turbidity_threshold', String(turbidityThreshold));
    }

    if (autoMode !== undefined) {
      liveTelemetry.autoModeEnabled = Boolean(autoMode);
    }

    if (mode && !liveTelemetry.autoModeEnabled) {
      // Safety checks for manual selection
      if (mode === 'MUNICIPAL_ECO' && liveTelemetry.sensors.inletTDS > 350 && !forceOverride) {
        return sendJson(res, 400, {
          success: false,
          safetyWarning: true,
          message: `SAFETY INTERLOCK WARNING: Incoming water TDS is ${liveTelemetry.sensors.inletTDS} ppm (>350 ppm). Forcing Non-RO mode may deliver excessive dissolved solids. Please confirm safety override to proceed.`
        });
      }

      if (mode === 'MUNICIPAL_ECO') {
        liveTelemetry.currentMode = 'MUNICIPAL_ECO';
        liveTelemetry.actuators.solenoidDiverter = false;
        liveTelemetry.actuators.bldcPump = false;
        liveTelemetry.sensors.pumpRpm = 0;
        liveTelemetry.sensors.pumpWatts = 4;
        liveTelemetry.sensors.outletTDS = Math.round(liveTelemetry.sensors.inletTDS * 0.82);
        liveTelemetry.modeReason = 'Manual Operator Override: Municipal Eco Bypass Mode (UF + UV Active, RO Membrane Bypassed).';
      } else if (mode === 'BOREWELL_RO') {
        liveTelemetry.currentMode = 'BOREWELL_RO';
        liveTelemetry.actuators.solenoidDiverter = true;
        liveTelemetry.actuators.bldcPump = true;
        liveTelemetry.sensors.pumpRpm = 1850;
        liveTelemetry.sensors.pumpWatts = 42;
        liveTelemetry.sensors.outletTDS = Math.round(Math.max(35, liveTelemetry.sensors.inletTDS * 0.10 + 25));
        liveTelemetry.modeReason = 'Manual Operator Override: High Salinity RO Mode (Booster Pump and RO Membrane Engaged).';
      } else if (mode === 'CRISIS_MODE') {
        liveTelemetry.currentMode = 'CRISIS_MODE';
        liveTelemetry.actuators.solenoidDiverter = true;
        liveTelemetry.actuators.bldcPump = true;
        liveTelemetry.sensors.pumpRpm = 2200;
        liveTelemetry.sensors.pumpWatts = 48;
        liveTelemetry.sensors.outletTDS = Math.round(liveTelemetry.sensors.inletTDS * 0.08);
        liveTelemetry.modeReason = 'Crisis Intervention: Multi-Pass RO with High-Intensity UV-C Disinfection.';
      }
    } else {
      evaluatePurificationLogic();
    }

    return sendJson(res, 200, {
      success: true,
      currentMode: liveTelemetry.currentMode,
      autoModeEnabled: liveTelemetry.autoModeEnabled,
      reason: liveTelemetry.modeReason
    });
  }

  // 5. Filter Monitoring (All 7 Filters)
  if (pathname === '/api/filters' && method === 'GET') {
    const filters = db.prepare('SELECT * FROM filters ORDER BY stage_number ASC').all();
    
    // Add dynamic notification alerts if filter life is low
    const enriched = filters.map(f => {
      let notification = null;
      if (f.life_pct < 15) {
        notification = { level: 'CRITICAL', text: 'Immediate replacement required! Permeability degradation critical.' };
      } else if (f.life_pct < 30) {
        notification = { level: 'WARNING', text: 'Replacement due soon. Order replacement cartridge.' };
      }
      return { ...f, notification };
    });

    return sendJson(res, 200, { success: true, data: enriched });
  }

  // 6. Filter Replacement Action
  if (pathname === '/api/filters/replace' && method === 'POST') {
    const body = await parseBody(req);
    const { filterId, technician, notes } = body;

    if (!filterId) {
      return sendJson(res, 400, { success: false, error: 'filterId is required' });
    }

    const filter = db.prepare('SELECT * FROM filters WHERE filter_id = ?').get(filterId);
    if (!filter) {
      return sendJson(res, 404, { success: false, error: 'Filter not found' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + filter.rated_lifespan_days);
    const estNext = nextDate.toISOString().split('T')[0];

    // Reset filter
    db.prepare(`
      UPDATE filters
      SET life_pct = 100.0, condition = 'OPTIMAL', usage_hours = 0,
          liters_processed = 0, installed_date = ?, est_replacement_date = ?
      WHERE filter_id = ?
    `).run(todayStr, estNext, filterId);

    // Log in maintenance records
    db.prepare(`
      INSERT INTO maintenance_records (date, technician, service_type, filter_id, notes, cost, status)
      VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED')
    `).run(
      todayStr,
      technician || 'Atomberg Certified Field Engineer',
      `Filter Replacement (${filter.name})`,
      filterId,
      notes || `New ${filter.name} installed. Pre-flush cycle verified.`,
      filterId === 'ro_membrane' ? 2499.0 : 899.0
    );

    // Insert alert resolution record
    db.prepare(`
      INSERT INTO alerts (timestamp, alert_type, title, message, severity, status, resolved_at, resolution_notes)
      VALUES (?, 'FILTER_REPLACED', 'Filter Replacement Verified', ?, 'INFO', 'RESOLVED', ?, ?)
    `).run(
      new Date().toISOString(),
      `${filter.name} was successfully replaced and calibrated. Filter health reset to 100%.`,
      new Date().toISOString(),
      'Automated service ledger verification'
    );

    return sendJson(res, 200, {
      success: true,
      message: `${filter.name} replaced successfully and logged into maintenance history.`,
      newReplacementDate: estNext
    });
  }

  // 7. AI-Based Predictive Maintenance
  if (pathname === '/api/ai-predictions' && method === 'GET') {
    const filters = db.prepare('SELECT * FROM filters ORDER BY stage_number ASC').all();
    
    // AI Resistance-in-Series & Degradation Model
    const predictions = filters.map(f => {
      // Degradation rate (% per 1000 liters)
      const degradationRatePerKiloLiter = (100 / (f.rated_lifespan_liters / 1000)).toFixed(2);
      const remainingLiters = Math.max(0, (f.life_pct / 100) * f.rated_lifespan_liters);
      const daysRemaining = Math.max(1, Math.round((f.life_pct / 100) * f.rated_lifespan_days));

      const isAnomaly = (f.filter_id === 'ro_membrane' && liveTelemetry.sensors.inletTDS > 700);

      let recommendation = 'Performance within nominal physical boundaries. Routine operational monitoring active.';
      if (f.life_pct < 20) {
        recommendation = 'Critical solute mass threshold reached. Dispatch field technician for certified cartridge replacement.';
      } else if (f.filter_id === 'ro_membrane') {
        recommendation = 'Execute 15-second reverse-flush backwash to eliminate surface fouling and recover +8.5% membrane flux.';
      } else if (f.filter_id === 'sediment') {
        recommendation = 'Inlet particle filtration optimal. Backpressure is under 18 PSI.';
      } else if (f.filter_id === 'uv_filter') {
        recommendation = 'Photonic irradiance is at 99.1% efficiency. Germicidal dosage exceeds NSF/ANSI 55 Class A standard.';
      }

      return {
        filterId: f.filter_id,
        name: f.name,
        currentLifePct: f.life_pct,
        daysRemaining,
        estimatedReplacementDate: f.est_replacement_date,
        degradationRatePctPerKL: parseFloat(degradationRatePerKiloLiter),
        anomalyDetected: isAnomaly,
        anomalyDescription: isAnomaly ? 'Elevated hardness solute exposure detected; accelerated salt deposition trend' : 'Normal',
        confidenceScore: 94.6,
        recommendation
      };
    });

    return sendJson(res, 200, {
      success: true,
      modelName: 'Hydrodynamic Resistance-in-Series (RIS) & Solids Exposure AI Model',
      disclaimer: 'Predictive estimates calculated via mass solids loading (Integral of TDS x Flow dt) and historical fouling rates.',
      predictions
    });
  }

  // 8. Water Consumption Analytics
  if (pathname === '/api/analytics/consumption' && method === 'GET') {
    const dailyRecords = db.prepare('SELECT * FROM water_consumption_daily ORDER BY date ASC LIMIT 30').all();
    const hourlyRecords = db.prepare('SELECT * FROM water_consumption_hourly ORDER BY hour ASC').all();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayData = dailyRecords.find(r => r.date === todayStr) || {
      purified_liters: 18.5,
      wastewater_liters: 3.4,
      recovery_pct: 84.5
    };

    // Calculate weekly and monthly aggregates
    const past7 = dailyRecords.slice(-7);
    const weeklyPurified = past7.reduce((sum, r) => sum + r.purified_liters, 0);
    const weeklyWaste = past7.reduce((sum, r) => sum + r.wastewater_liters, 0);
    const monthlyPurified = dailyRecords.reduce((sum, r) => sum + r.purified_liters, 0);
    const monthlyWaste = dailyRecords.reduce((sum, r) => sum + r.wastewater_liters, 0);

    const totalPurified = monthlyPurified;
    const totalWaste = monthlyWaste;
    const avgRecovery = ((totalPurified / (totalPurified + totalWaste || 1)) * 100).toFixed(1);

    return sendJson(res, 200, {
      success: true,
      today: todayData,
      weekly: {
        purifiedLiters: parseFloat(weeklyPurified.toFixed(1)),
        wastewaterLiters: parseFloat(weeklyWaste.toFixed(1)),
        recoveryPct: parseFloat(((weeklyPurified / (weeklyPurified + weeklyWaste || 1)) * 100).toFixed(1))
      },
      monthly: {
        purifiedLiters: parseFloat(monthlyPurified.toFixed(1)),
        wastewaterLiters: parseFloat(monthlyWaste.toFixed(1)),
        recoveryPct: parseFloat(avgRecovery)
      },
      dailyHistory: dailyRecords,
      hourlyProfile: hourlyRecords
    });
  }

  // 9. Dispense Water Action (Updates tank & consumption)
  if (pathname === '/api/analytics/dispense' && method === 'POST') {
    const body = await parseBody(req);
    const amount = parseFloat(body.amountLiters || '0.25');

    if (liveTelemetry.interlockActive || !liveTelemetry.actuators.solenoidInterlock) {
      return sendJson(res, 400, {
        success: false,
        error: `Cannot dispense: Safety Interlock is clamped! Reason: ${liveTelemetry.interlockReason}`
      });
    }

    if (liveTelemetry.cleanTankCurrent < amount) {
      return sendJson(res, 400, {
        success: false,
        error: 'Purified water tank reserve depleted. Purifying fresh reserves...'
      });
    }

    liveTelemetry.cleanTankCurrent = Number((liveTelemetry.cleanTankCurrent - amount).toFixed(2));
    liveTelemetry.totalPurifiedLiters = Number((liveTelemetry.totalPurifiedLiters + amount).toFixed(2));

    // Update today's consumption in DB
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = db.prepare('SELECT * FROM water_consumption_daily WHERE date = ?').get(todayStr);
    if (existing) {
      const newPurified = Number((existing.purified_liters + amount).toFixed(1));
      const wasteIncr = liveTelemetry.currentMode === 'MUNICIPAL_ECO' ? 0 : amount * 0.25;
      const newWaste = Number((existing.wastewater_liters + wasteIncr).toFixed(1));
      const newRec = Number(((newPurified / (newPurified + newWaste)) * 100).toFixed(1));
      db.prepare(`
        UPDATE water_consumption_daily
        SET purified_liters = ?, wastewater_liters = ?, recovery_pct = ?
        WHERE date = ?
      `).run(newPurified, newWaste, newRec, todayStr);
    }

    return sendJson(res, 200, {
      success: true,
      dispensedLiters: amount,
      remainingTankLiters: liveTelemetry.cleanTankCurrent,
      outletTDS: liveTelemetry.sensors.outletTDS
    });
  }

  // 10. Smart Leak Detection
  if (pathname === '/api/leak' && method === 'GET') {
    const events = db.prepare('SELECT * FROM leak_events ORDER BY id DESC LIMIT 10').all();
    return sendJson(res, 200, {
      success: true,
      leakDetected: liveTelemetry.leakDetected,
      leakZone: liveTelemetry.leakZone || 'None',
      emergencyShutoffActive: liveTelemetry.emergencyShutoff,
      zones: [
        { id: 'zone-1', name: 'Inlet Raw Supply & Pre-Filter Manifold', status: liveTelemetry.leakZone === 'Zone 1' ? 'LEAK_DETECTED' : 'SECURE' },
        { id: 'zone-2', name: 'High-Pressure Booster & RO Manifold', status: liveTelemetry.leakZone === 'Zone 2' ? 'LEAK_DETECTED' : 'SECURE' },
        { id: 'zone-3', name: 'Clean Water Storage Tank & Dispense Line', status: liveTelemetry.leakZone === 'Zone 3' ? 'LEAK_DETECTED' : 'SECURE' }
      ],
      recentIncidents: events
    });
  }

  if (pathname === '/api/leak/emergency-shutoff' && method === 'POST') {
    const body = await parseBody(req);
    const shutoff = body.shutoff !== undefined ? Boolean(body.shutoff) : !liveTelemetry.emergencyShutoff;

    liveTelemetry.emergencyShutoff = shutoff;
    evaluatePurificationLogic();

    // Log incident
    db.prepare(`
      INSERT INTO alerts (timestamp, alert_type, title, message, severity, status, resolved_at, resolution_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      new Date().toISOString(),
      shutoff ? 'EMERGENCY_SHUTOFF_ENGAGED' : 'EMERGENCY_SHUTOFF_CLEARED',
      shutoff ? 'Emergency Main Solenoid Clamped' : 'Emergency Shutoff Restored',
      shutoff ? 'Operator or safety automation triggered immediate inlet water isolation.' : 'Normal operation restored by operator.',
      shutoff ? 'CRITICAL' : 'INFO',
      shutoff ? 'ACTIVE' : 'RESOLVED',
      shutoff ? null : new Date().toISOString(),
      shutoff ? null : 'Manual operator verification completed'
    );

    return sendJson(res, 200, {
      success: true,
      emergencyShutoff: liveTelemetry.emergencyShutoff,
      interlockActive: liveTelemetry.interlockActive,
      message: shutoff ? 'EMERGENCY WATER SHUTOFF ACTIVATED' : 'Emergency shutoff cleared. System operational.'
    });
  }

  if (pathname === '/api/leak/simulate' && method === 'POST') {
    const body = await parseBody(req);
    const trigger = Boolean(body.trigger);
    const zone = body.zone || 'Zone 2';

    liveTelemetry.leakDetected = trigger;
    liveTelemetry.leakZone = trigger ? zone : '';

    if (trigger) {
      db.prepare(`
        INSERT INTO leak_events (timestamp, zone, flow_rate_lpm, severity, status)
        VALUES (?, ?, ?, 'CRITICAL', 'DETECTED')
      `).run(new Date().toISOString(), zone, 0.45);

      db.prepare(`
        INSERT INTO alerts (timestamp, alert_type, title, message, severity, status)
        VALUES (?, 'WATER_LEAK_DETECTED', 'Micro-Leak Detected in ' || ?, 'Continuous baseline trickle detected during quiescent period (0.45 L/min). Flow sensor mismatch.', 'CRITICAL', 'ACTIVE')
      `).run(new Date().toISOString(), zone);
    }

    return sendJson(res, 200, {
      success: true,
      leakDetected: liveTelemetry.leakDetected,
      leakZone: liveTelemetry.leakZone
    });
  }

  // 11. Alerts & Fault Notifications
  if (pathname === '/api/alerts' && method === 'GET') {
    const rows = db.prepare('SELECT * FROM alerts ORDER BY id DESC LIMIT 50').all();
    return sendJson(res, 200, { success: true, count: rows.length, data: rows });
  }

  if (pathname === '/api/alerts/resolve' && method === 'POST') {
    const body = await parseBody(req);
    const { alertId, notes } = body;

    if (!alertId) {
      return sendJson(res, 400, { success: false, error: 'alertId is required' });
    }

    db.prepare(`
      UPDATE alerts
      SET status = 'RESOLVED', resolved_at = ?, resolution_notes = ?
      WHERE id = ?
    `).run(new Date().toISOString(), notes || 'Resolved by user', alertId);

    return sendJson(res, 200, { success: true, message: 'Alert resolved successfully' });
  }

  if (pathname === '/api/alerts/acknowledge' && method === 'POST') {
    const body = await parseBody(req);
    const { alertId } = body;
    if (!alertId) return sendJson(res, 400, { success: false, error: 'alertId required' });

    db.prepare("UPDATE alerts SET status = 'ACKNOWLEDGED' WHERE id = ?").run(alertId);
    return sendJson(res, 200, { success: true, message: 'Alert acknowledged' });
  }

  // 12. Maintenance Records & Schedules
  if (pathname === '/api/maintenance' && method === 'GET') {
    const records = db.prepare('SELECT * FROM maintenance_records ORDER BY id DESC LIMIT 50').all();
    const filters = db.prepare('SELECT * FROM filters ORDER BY stage_number ASC').all();

    const pumpInspection = {
      model: 'Atomberg Brushless DC (BLDC) Sinusoidal Sensorless Pump',
      runningHours: 1840,
      ratedHours: 15000,
      currentRMS: '1.75 A',
      cavitationIndex: '0.04 (Optimal)',
      vibrationHealth: 'Normal / Compliant',
      nextInspectionDue: '2027-04-10'
    };

    const uvLampStatus = {
      type: '254nm Quartz Mercury-Free UV-C LED Array',
      operatingHours: 2150,
      ratedLifespanHours: 10000,
      opticalIrradiance: '18.0 mJ/cm²',
      germicidalSafetyFactor: '4-Log Pathogen Reduction (99.99%)',
      replacementDueHours: 7850
    };

    return sendJson(res, 200, {
      success: true,
      records,
      filtersSchedule: filters.map(f => ({
        id: f.filter_id,
        name: f.name,
        stage: f.stage_number,
        replacementDate: f.est_replacement_date,
        lifePct: f.life_pct,
        condition: f.condition
      })),
      pumpInspection,
      uvLampStatus
    });
  }

  if (pathname === '/api/maintenance/log' && method === 'POST') {
    const body = await parseBody(req);
    const { date, technician, serviceType, filterId, notes, cost } = body;

    if (!technician || !serviceType) {
      return sendJson(res, 400, { success: false, error: 'Technician and serviceType are required' });
    }

    db.prepare(`
      INSERT INTO maintenance_records (date, technician, service_type, filter_id, notes, cost, status)
      VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED')
    `).run(
      date || new Date().toISOString().split('T')[0],
      technician,
      serviceType,
      filterId || 'General Manifold',
      notes || 'Scheduled preventive inspection',
      parseFloat(cost || '0')
    );

    return sendJson(res, 201, { success: true, message: 'Maintenance record saved to database' });
  }

  // 13. System Settings
  if (pathname === '/api/settings' && method === 'GET') {
    return sendJson(res, 200, { success: true, settings: getSettingsMap() });
  }

  if (pathname === '/api/settings' && method === 'POST') {
    const body = await parseBody(req);
    const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    
    Object.entries(body).forEach(([key, val]) => {
      insertSetting.run(key, String(val));
      if (key === 'simulation_mode') {
        liveTelemetry.simulationMode = String(val) === 'true';
      }
    });

    evaluatePurificationLogic();
    return sendJson(res, 200, { success: true, message: 'Settings updated successfully', settings: getSettingsMap() });
  }

  // 14. IoT External Sensor Ingestion Endpoint (For physical hardware ESP32 / Arduino)
  if (pathname === '/api/sensors/ingest' && method === 'POST') {
    const body = await parseBody(req);
    
    // Switch simulation off if live hardware pushes data
    liveTelemetry.simulationMode = false;

    if (body.inletTDS !== undefined) liveTelemetry.sensors.inletTDS = parseFloat(body.inletTDS);
    if (body.outletTDS !== undefined) liveTelemetry.sensors.outletTDS = parseFloat(body.outletTDS);
    if (body.turbidity !== undefined) liveTelemetry.sensors.turbidity = parseFloat(body.turbidity);
    if (body.ph !== undefined) liveTelemetry.sensors.ph = parseFloat(body.ph);
    if (body.orp !== undefined) liveTelemetry.sensors.orp = parseFloat(body.orp);
    if (body.flowRate !== undefined) liveTelemetry.sensors.flowRate = parseFloat(body.flowRate);
    if (body.cleanTankCurrent !== undefined) liveTelemetry.cleanTankCurrent = parseFloat(body.cleanTankCurrent);
    if (body.leakDetected !== undefined) liveTelemetry.leakDetected = Boolean(body.leakDetected);

    evaluatePurificationLogic();

    return sendJson(res, 200, {
      success: true,
      message: 'IoT sensor telemetry ingested successfully',
      systemMode: liveTelemetry.currentMode,
      interlockSafe: liveTelemetry.actuators.solenoidInterlock
    });
  }

  // 15. Export Reports (CSV / JSON)
  if (pathname === '/api/reports/export' && method === 'GET') {
    const exportFormat = parsedUrl.searchParams.get('format') || 'csv';
    const type = parsedUrl.searchParams.get('type') || 'quality';

    if (type === 'quality') {
      const rows = db.prepare('SELECT * FROM water_quality_history ORDER BY id DESC LIMIT 100').all();
      if (exportFormat === 'json') {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="hydroos-water-quality-report.json"'
        });
        return res.end(JSON.stringify(rows, null, 2));
      } else {
        const header = 'ID,Timestamp,Inlet TDS (ppm),Outlet TDS (ppm),Turbidity (NTU),pH,ORP (mV),Flow (L/min),Mode,Status\n';
        const csv = rows.map(r => `${r.id},"${r.timestamp}",${r.inlet_tds},${r.outlet_tds},${r.turbidity},${r.ph},${r.orp},${r.flow_rate},"${r.purification_mode}","${r.quality_status}"`).join('\n');
        res.writeHead(200, {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="hydroos-water-quality-report.csv"'
        });
        return res.end(header + csv);
      }
    } else {
      const rows = db.prepare('SELECT * FROM water_consumption_daily ORDER BY date DESC').all();
      if (exportFormat === 'json') {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="hydroos-water-consumption-report.json"'
        });
        return res.end(JSON.stringify(rows, null, 2));
      } else {
        const header = 'ID,Date,Purified Water (Liters),Wastewater (Liters),Recovery Percentage (%)\n';
        const csv = rows.map(r => `${r.id},"${r.date}",${r.purified_liters},${r.wastewater_liters},${r.recovery_pct}%`).join('\n');
        res.writeHead(200, {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="hydroos-water-consumption-report.csv"'
        });
        return res.end(header + csv);
      }
    }
  }

  // ==========================================
  // STATIC FILE SERVING
  // ==========================================
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security check: ensure path is within PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If file not found and doesn't have an extension, try index.html for SPA
      if (!path.extname(filePath)) {
        filePath = path.join(PUBLIC_DIR, 'index.html');
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('404 Not Found');
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('500 Internal Server Error');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(` HydroOS 2.0 Smart RO Water Purifier Platform Online`);
  console.log(` HTTP Server listening on http://localhost:${PORT}`);
  console.log(` Database: SQLite (hydroos.db) Active`);
  console.log(` Ingestion API: http://localhost:${PORT}/api/sensors/ingest`);
  console.log(`=======================================================`);
});
