/**
 * HydroOS SQLite Database Persistence Layer
 * Powered by Node.js built-in node:sqlite (Zero external dependencies)
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const DB_PATH = path.join(__dirname, 'hydroos.db');
const db = new DatabaseSync(DB_PATH);

// Initialize Tables
function initDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    -- System Current State (Singleton)
    CREATE TABLE IF NOT EXISTS system_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_mode TEXT NOT NULL DEFAULT 'MUNICIPAL_ECO',
      auto_mode_enabled INTEGER NOT NULL DEFAULT 1,
      tds_threshold REAL NOT NULL DEFAULT 200.0,
      turbidity_threshold REAL NOT NULL DEFAULT 1.0,
      emergency_shutoff INTEGER NOT NULL DEFAULT 0,
      simulation_mode INTEGER NOT NULL DEFAULT 1,
      clean_tank_current REAL NOT NULL DEFAULT 7.2,
      clean_tank_capacity REAL NOT NULL DEFAULT 8.0,
      reuse_tank_current REAL NOT NULL DEFAULT 3.4,
      reuse_tank_capacity REAL NOT NULL DEFAULT 6.0,
      total_purified_liters REAL NOT NULL DEFAULT 1420.5,
      total_waste_liters REAL NOT NULL DEFAULT 260.0,
      safety_score INTEGER NOT NULL DEFAULT 96,
      interlock_active INTEGER NOT NULL DEFAULT 0,
      interlock_reason TEXT DEFAULT '',
      last_updated TEXT NOT NULL
    );

    -- 7 Individual Water Purification Filters
    CREATE TABLE IF NOT EXISTS filters (
      filter_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      stage_number INTEGER NOT NULL,
      pore_size TEXT NOT NULL,
      material TEXT NOT NULL,
      life_pct REAL NOT NULL,
      condition TEXT NOT NULL,
      usage_hours REAL NOT NULL,
      liters_processed REAL NOT NULL,
      installed_date TEXT NOT NULL,
      est_replacement_date TEXT NOT NULL,
      rated_lifespan_liters REAL NOT NULL,
      rated_lifespan_days INTEGER NOT NULL
    );

    -- Historical Water Quality Snapshots
    CREATE TABLE IF NOT EXISTS water_quality_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      inlet_tds REAL NOT NULL,
      outlet_tds REAL NOT NULL,
      turbidity REAL NOT NULL,
      ph REAL NOT NULL,
      orp REAL NOT NULL,
      flow_rate REAL NOT NULL,
      purification_mode TEXT NOT NULL,
      quality_status TEXT NOT NULL,
      is_simulated INTEGER NOT NULL DEFAULT 1
    );

    -- Daily Water Consumption
    CREATE TABLE IF NOT EXISTS water_consumption_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      purified_liters REAL NOT NULL,
      wastewater_liters REAL NOT NULL,
      recovery_pct REAL NOT NULL
    );

    -- Hourly Water Consumption (Last 24 Hours)
    CREATE TABLE IF NOT EXISTS water_consumption_hourly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      hour INTEGER NOT NULL,
      liters REAL NOT NULL,
      UNIQUE(date, hour)
    );

    -- Alerts & Fault Notifications
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      alert_type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL, -- CRITICAL, WARNING, INFO
      status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, RESOLVED
      resolved_at TEXT,
      resolution_notes TEXT
    );

    -- Maintenance & Service Records
    CREATE TABLE IF NOT EXISTS maintenance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      technician TEXT NOT NULL,
      service_type TEXT NOT NULL,
      filter_id TEXT,
      notes TEXT NOT NULL,
      cost REAL NOT NULL DEFAULT 0.0,
      status TEXT NOT NULL DEFAULT 'COMPLETED'
    );

    -- Leak Incident Events
    CREATE TABLE IF NOT EXISTS leak_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      zone TEXT NOT NULL,
      flow_rate_lpm REAL NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DETECTED',
      resolved_at TEXT,
      action_taken TEXT
    );

    -- System Configuration Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default system state if not exists
  const stateRow = db.prepare('SELECT id FROM system_state WHERE id = 1').get();
  if (!stateRow) {
    const nowIso = new Date().toISOString();
    db.prepare(`
      INSERT INTO system_state (
        id, current_mode, auto_mode_enabled, tds_threshold, turbidity_threshold,
        emergency_shutoff, simulation_mode, clean_tank_current, clean_tank_capacity,
        reuse_tank_current, reuse_tank_capacity, total_purified_liters, total_waste_liters,
        safety_score, interlock_active, interlock_reason, last_updated
      ) VALUES (
        1, 'MUNICIPAL_ECO', 1, 200.0, 1.0,
        0, 1, 7.2, 8.0,
        3.4, 6.0, 1420.5, 260.0,
        96, 0, '', ?
      )
    `).run(nowIso);
  }

  // Seed 7 Filters if table is empty
  const filterCount = db.prepare('SELECT COUNT(*) as count FROM filters').get().count;
  if (filterCount === 0) {
    const filtersSeed = [
      {
        id: 'sediment',
        name: 'Sediment Filter',
        stage: 1,
        pore: '5 Micron',
        material: 'Spun Polypropylene Gradient Density',
        life: 82.5,
        condition: 'HEALTHY',
        hours: 1420,
        liters: 2850,
        installed: '2026-08-15',
        replacement: '2027-02-15',
        ratedLiters: 6000,
        ratedDays: 180
      },
      {
        id: 'pre_carbon',
        name: 'Pre-Carbon Filter',
        stage: 2,
        pore: '10 Micron',
        material: 'High-Adsorption Activated Coconut Shell Carbon',
        life: 78.0,
        condition: 'HEALTHY',
        hours: 1420,
        liters: 2850,
        installed: '2026-08-15',
        replacement: '2027-02-15',
        ratedLiters: 6000,
        ratedDays: 180
      },
      {
        id: 'ro_membrane',
        name: 'RO Membrane',
        stage: 3,
        pore: '0.0001 Micron',
        material: '75 GPD Thin-Film Composite (TFC) Polyamide',
        life: 91.5,
        condition: 'OPTIMAL',
        hours: 980,
        liters: 1960,
        installed: '2026-05-10',
        replacement: '2027-05-10',
        ratedLiters: 12000,
        ratedDays: 365
      },
      {
        id: 'post_carbon',
        name: 'Post-Carbon Filter',
        stage: 4,
        pore: '5 Micron',
        material: 'Bacteriostatic Silver-Impregnated Carbon Block',
        life: 85.0,
        condition: 'HEALTHY',
        hours: 1420,
        liters: 2850,
        installed: '2026-08-15',
        replacement: '2027-02-15',
        ratedLiters: 6000,
        ratedDays: 180
      },
      {
        id: 'uf_filter',
        name: 'UF Filter',
        stage: 5,
        pore: '0.01 Micron',
        material: 'Hollow Fiber Hydrophilic Polysulfone Membrane',
        life: 88.0,
        condition: 'HEALTHY',
        hours: 1420,
        liters: 2850,
        installed: '2026-07-01',
        replacement: '2027-04-01',
        ratedLiters: 8000,
        ratedDays: 270
      },
      {
        id: 'uv_filter',
        name: 'UV Filter',
        stage: 6,
        pore: '254 nm Photonic Chamber',
        material: 'High-Output Quartz Mercury-Free UV-C LED Chamber',
        life: 96.0,
        condition: 'OPTIMAL',
        hours: 2150,
        liters: 4200,
        installed: '2026-01-10',
        replacement: '2028-01-10',
        ratedLiters: 25000,
        ratedDays: 730
      },
      {
        id: 'mineral_cartridge',
        name: 'Mineral Cartridge',
        stage: 7,
        pore: 'Active Remineralizer',
        material: 'Bioceramic Alkaline, Calcite, Maifan Stone & Electrolytes',
        life: 84.0,
        condition: 'HEALTHY',
        hours: 1300,
        liters: 2600,
        installed: '2026-08-15',
        replacement: '2027-02-15',
        ratedLiters: 6000,
        ratedDays: 180
      }
    ];

    const insertFilter = db.prepare(`
      INSERT INTO filters (
        filter_id, name, stage_number, pore_size, material, life_pct,
        condition, usage_hours, liters_processed, installed_date,
        est_replacement_date, rated_lifespan_liters, rated_lifespan_days
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    filtersSeed.forEach(f => {
      insertFilter.run(
        f.id, f.name, f.stage, f.pore, f.material, f.life,
        f.condition, f.hours, f.liters, f.installed,
        f.replacement, f.ratedLiters, f.ratedDays
      );
    });
  }

  // Seed Water Quality History if empty
  const historyCount = db.prepare('SELECT COUNT(*) as count FROM water_quality_history').get().count;
  if (historyCount === 0) {
    const insertHistory = db.prepare(`
      INSERT INTO water_quality_history (
        timestamp, inlet_tds, outlet_tds, turbidity, ph, orp, flow_rate, purification_mode, quality_status, is_simulated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const now = Date.now();
    for (let i = 48; i >= 0; i--) {
      const time = new Date(now - i * 3600 * 1000).toISOString();
      const inletTds = Math.round(110 + Math.sin(i * 0.4) * 35 + (Math.random() - 0.5) * 10);
      const outletTds = Math.round(inletTds < 200 ? inletTds * 0.82 : 38 + Math.random() * 20);
      const turbidity = Number((0.32 + Math.cos(i * 0.3) * 0.12).toFixed(2));
      const ph = Number((7.35 + Math.sin(i * 0.2) * 0.2).toFixed(1));
      const orp = Math.round(410 + Math.cos(i * 0.5) * 30);
      const flow = Number((1.7 + (Math.random() - 0.5) * 0.3).toFixed(1));
      const mode = inletTds < 200 ? 'MUNICIPAL_ECO' : 'BOREWELL_RO';
      const status = turbidity > 1.0 ? 'WARNING' : 'EXCELLENT';

      insertHistory.run(time, inletTds, outletTds, turbidity, ph, orp, flow, mode, status);
    }
  }

  // Seed Water Consumption Daily if empty
  const dailyCount = db.prepare('SELECT COUNT(*) as count FROM water_consumption_daily').get().count;
  if (dailyCount === 0) {
    const insertDaily = db.prepare(`
      INSERT INTO water_consumption_daily (date, purified_liters, wastewater_liters, recovery_pct)
      VALUES (?, ?, ?, ?)
    `);

    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const purified = Number((18.5 + Math.sin(i * 0.5) * 4.5 + (Math.random() - 0.5) * 2).toFixed(1));
      const waste = Number((purified * 0.18 + (Math.random() * 0.5)).toFixed(1)); // Eco mode gives high recovery
      const recovery = Number(((purified / (purified + waste)) * 100).toFixed(1));

      insertDaily.run(dateStr, purified, waste, recovery);
    }
  }

  // Seed Hourly Consumption if empty
  const hourlyCount = db.prepare('SELECT COUNT(*) as count FROM water_consumption_hourly').get().count;
  if (hourlyCount === 0) {
    const insertHourly = db.prepare(`
      INSERT OR REPLACE INTO water_consumption_hourly (date, hour, liters)
      VALUES (?, ?, ?)
    `);
    const todayStr = new Date().toISOString().split('T')[0];
    const hourProfile = [
      0.1, 0.0, 0.0, 0.0, 0.0, 0.4, 1.8, 3.2, 2.4, 1.5,
      1.1, 1.4, 2.2, 1.9, 0.8, 0.6, 0.9, 1.6, 2.5, 2.8,
      2.1, 1.3, 0.8, 0.3
    ];
    hourProfile.forEach((liters, hour) => {
      insertHourly.run(todayStr, hour, liters);
    });
  }

  // Seed Alerts if empty
  const alertCount = db.prepare('SELECT COUNT(*) as count FROM alerts').get().count;
  if (alertCount === 0) {
    const insertAlert = db.prepare(`
      INSERT INTO alerts (timestamp, alert_type, title, message, severity, status, resolved_at, resolution_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const nowIso = new Date().toISOString();
    const past1 = new Date(Date.now() - 36 * 3600 * 1000).toISOString();
    const past2 = new Date(Date.now() - 72 * 3600 * 1000).toISOString();

    insertAlert.run(
      nowIso,
      'FILTER_HEALTH_NOTICE',
      'Pre-Carbon Cartridge Periodic Check Due',
      'Pre-Carbon filter has achieved 78% remaining life threshold. Scheduled inspection recommended within 30 days.',
      'INFO',
      'ACTIVE',
      null,
      null
    );

    insertAlert.run(
      past1,
      'PRESSURE_VARIANCE',
      'Transient Low Inlet Pressure Detected',
      'Inlet municipal pressure dipped to 0.45 bar for 12 seconds during morning peak. Self-stabilized without cavitation.',
      'WARNING',
      'RESOLVED',
      new Date(Date.now() - 35 * 3600 * 1000).toISOString(),
      'Pressure restored to 1.8 bar normal baseline. System verified safe.'
    );

    insertAlert.run(
      past2,
      'AUTO_CLEANSE_SUCCESS',
      'Membrane Auto-Flush Completed',
      'Automated 15-second high-velocity reverse pulse flush executed. Transmembrane flux restored by +8.2%.',
      'INFO',
      'RESOLVED',
      new Date(Date.now() - 71 * 3600 * 1000).toISOString(),
      'Automated schedule maintenance cycle.'
    );
  }

  // Seed Maintenance Records if empty
  const maintCount = db.prepare('SELECT COUNT(*) as count FROM maintenance_records').get().count;
  if (maintCount === 0) {
    const insertMaint = db.prepare(`
      INSERT INTO maintenance_records (date, technician, service_type, filter_id, notes, cost, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertMaint.run(
      '2026-08-15',
      'Suresh M. (Atomberg Authorized #482)',
      'Scheduled 6-Month Filter Service',
      'sediment, pre_carbon, post_carbon',
      'Replaced 5-Micron Spun Sediment and Activated Carbon blocks. Sanitzed manifold housing.',
      1499.0,
      'COMPLETED'
    );

    insertMaint.run(
      '2026-05-10',
      'Pooja R. (Certified Field Technician #109)',
      'RO Membrane & BLDC Pump Inspection',
      'ro_membrane',
      'Installed 75 GPD Thin-Film Polyamide membrane. Calibrated BLDC motor drive and verified cavitation index at 0.04.',
      2899.0,
      'COMPLETED'
    );

    insertMaint.run(
      '2026-01-10',
      'Deepak K. (Lead Diagnostics Engineer #024)',
      'Annual Full System Commissioning',
      'uv_filter, mineral_cartridge',
      'Commissioned 254nm Quartz UV photonic chamber and remineralizer cartridge. Replaced O-rings and checked solenoid seal integrity.',
      1999.0,
      'COMPLETED'
    );
  }

  // Seed Settings if empty
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
  if (settingsCount === 0) {
    const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('tds_threshold', '200');
    insertSetting.run('turbidity_threshold', '1.0');
    insertSetting.run('auto_purification', 'true');
    insertSetting.run('audio_alerts', 'true');
    insertSetting.run('push_notifications', 'true');
    insertSetting.run('simulation_mode', 'true');
    insertSetting.run('device_id', 'HYDRA-2026-BLR-0038');
    insertSetting.run('device_name', 'Atomberg HydraOS Smart Purifier');
    insertSetting.run('location', 'HAL 2nd Stage, Indiranagar, Bengaluru');
    insertSetting.run('firmware_version', 'v2.4.8-PROD');
  }
}

// Run initialization
initDatabase();

module.exports = {
  db,
  initDatabase
};

