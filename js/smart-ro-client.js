/**
 * HydroOS 2.0 - Smart RO Water Purifier Frontend Controller
 * Connects UI to REST Backend APIs & Coordinates All 10 Pages + Engineering Lab
 */

(function () {
  'use strict';

  // State Container
  const state = {
    activePage: 'dashboard',
    telemetry: null,
    filters: [],
    predictions: [],
    consumption: null,
    alerts: [],
    maintenance: null,
    settings: {},
    leak: null,
    history: [],
    isOffline: false,
    audioEnabled: true
  };

  // Base API URL
  const API_BASE = window.location.origin;

  // Audio helper
  function playBeep(type) {
    if (!state.audioEnabled) return;
    try {
      if (window.hydraAudio) {
        if (type === 'hazard') window.hydraAudio.playHazardAlarm();
        else if (type === 'click') window.hydraAudio.playSolenoidClick(true);
        else if (type === 'dispense') window.hydraAudio.playDispensePour(2.0);
        else if (type === 'flush') window.hydraAudio.playFlushWhoosh(3.0);
      }
    } catch (e) {
      // Audio fallback silent
    }
  }

  // Generic Fetch Helper
  async function api(endpoint, options = {}) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn(`API call ${endpoint} failed:`, err.message);
      state.isOffline = true;
      return null;
    }
  }

  // ============================================================
  // NAVIGATION CONTROLLER
  // ============================================================
  function initNavigation() {
    const navButtons = document.querySelectorAll('.sidebar-nav-btn');
    const pages = document.querySelectorAll('.smart-page');
    const mobileToggle = document.getElementById('btn-mobile-menu');
    const sidebar = document.getElementById('smart-sidebar');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPage = btn.getAttribute('data-target-page');
        if (!targetPage) return;

        state.activePage = targetPage;

        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        pages.forEach(p => {
          if (p.id === `page-${targetPage}`) {
            p.classList.add('active');
          } else {
            p.classList.remove('active');
          }
        });

        // Close sidebar on mobile after selection
        if (sidebar && sidebar.classList.contains('mobile-open')) {
          sidebar.classList.remove('mobile-open');
        }

        playBeep('click');

        // Page specific refreshes
        if (targetPage === 'quality') fetchQualityHistory();
        if (targetPage === 'filters') fetchFilters();
        if (targetPage === 'predictions') fetchPredictions();
        if (targetPage === 'analytics') fetchConsumption();
        if (targetPage === 'alerts') fetchAlerts();
        if (targetPage === 'maintenance') fetchMaintenance();
        if (targetPage === 'leak') fetchLeakStatus();
        if (targetPage === 'settings') fetchSettings();
        if (targetPage === 'dashboard') {
          if (window.sceneManager) {
            window.sceneManager.setContainer('canvas-container');
          }
        }
        if (targetPage === 'engineering') {
          if (window.sceneManager) {
            window.sceneManager.setContainer('lab-canvas-container');
          }
          // If Hydra Grid map is present, resize
          if (window.hydraGrid && window.hydraGrid.map) {
            setTimeout(() => window.hydraGrid.map.invalidateSize(), 200);
          }
        }
      });
    });

    if (mobileToggle && sidebar) {
      mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
    }
  }

  // ============================================================
  // 1. DASHBOARD & LIVE TELEMETRY
  // ============================================================
  async function pollStatus() {
    const res = await api('/api/status');
    if (res && res.success) {
      state.telemetry = res.data;
      state.isOffline = false;
      renderDashboard();
      renderTopRibbon();
    } else {
      // Fallback to client simulation engine if backend unreachable
      if (window.hydraSimulation) {
        const clientState = window.hydraSimulation.getState();
        state.telemetry = {
          sensors: clientState.sensors,
          actuators: clientState.actuators,
          currentMode: clientState.currentMode,
          waterScore: clientState.waterScore,
          cleanTankCurrent: clientState.waterTwin.cleanTankCurrent,
          cleanTankCapacity: clientState.waterTwin.cleanTankCapacity,
          reuseTankCurrent: clientState.waterTwin.reuseTankCurrent,
          reuseTankCapacity: clientState.waterTwin.reuseTankCapacity,
          totalPurifiedLiters: 1420.5 + clientState.waterTwin.waterSavedLitres,
          filterHealthAvg: clientState.waterTwin.membraneHealth,
          upcomingMaintenanceDate: '2027-02-15',
          dailyConsumption: 18.5,
          leakDetected: clientState.waterTwin.leakDetected,
          emergencyShutoff: false,
          simulationMode: true,
          modeReason: clientState.waterDNA.characteristics
        };
        renderDashboard();
        renderTopRibbon();
      }
    }
  }

  function renderTopRibbon() {
    const data = state.telemetry;
    if (!data) return;

    // Safety Score
    const scoreVal = document.getElementById('top-safety-score');
    if (scoreVal) scoreVal.textContent = data.waterScore;

    // Mode Pill
    const modePill = document.getElementById('top-mode-pill');
    if (modePill) {
      if (data.currentMode === 'MUNICIPAL_ECO') {
        modePill.textContent = 'MUNICIPAL ECO BYPASS';
        modePill.style.color = 'var(--cyan-bright)';
      } else if (data.currentMode === 'BOREWELL_RO') {
        modePill.textContent = 'HIGH-SALINITY FULL RO';
        modePill.style.color = 'var(--amber-warn)';
      } else {
        modePill.textContent = 'CRISIS MULTI-PASS';
        modePill.style.color = 'var(--rose-danger)';
      }
    }

    // Simulation / Live IoT Badge
    const simBadge = document.getElementById('top-sim-badge');
    if (simBadge) {
      if (data.simulationMode) {
        simBadge.className = 'simulation-pill';
        simBadge.innerHTML = '<span class="live-dot" style="color:var(--amber-warn);"></span> DEMO / SIMULATED';
        simBadge.title = 'Sensor data generated by realistic mathematical fluidics simulation.';
      } else {
        simBadge.className = 'simulation-pill live-iot';
        simBadge.innerHTML = '<span class="live-dot" style="color:var(--cyan-bright);"></span> LIVE IOT SENSORS';
        simBadge.title = 'Live physical IoT hardware sensor telemetry connected.';
      }
    }

    // Emergency Shutoff quick status
    const shutoffBtn = document.getElementById('btn-top-emergency-shutoff');
    if (shutoffBtn) {
      if (data.emergencyShutoff) {
        shutoffBtn.className = 'btn-danger-shutoff active-tripped';
        shutoffBtn.innerHTML = '⚠️ EMERGENCY SHUTOFF ACTIVE (TAP LOCKED)';
      } else {
        shutoffBtn.className = 'btn-outline';
        shutoffBtn.innerHTML = '🛑 Emergency Shutoff';
      }
    }
  }

  function renderDashboard() {
    const data = state.telemetry;
    if (!data) return;

    // 1. Live Input Water TDS
    const inTds = document.getElementById('dash-inlet-tds');
    if (inTds) inTds.textContent = data.sensors.inletTDS;

    // 2. Purified Water TDS
    const outTds = document.getElementById('dash-outlet-tds');
    if (outTds) outTds.textContent = data.sensors.outletTDS;

    // 3. Water Quality Status
    const qualityStatus = document.getElementById('dash-quality-status');
    const qualityStatusBadge = document.getElementById('dash-quality-badge');
    if (qualityStatus) {
      const isGood = data.sensors.turbidity <= 1.0 && data.sensors.outletTDS <= 150;
      qualityStatus.textContent = isGood ? 'EXCELLENT' : (data.sensors.turbidity > 1.2 ? 'HAZARDOUS' : 'ACCEPTABLE');
      qualityStatus.className = `metric-val-num ${isGood ? 'safe' : (data.sensors.turbidity > 1.2 ? 'hazard' : 'warn')}`;
    }
    if (qualityStatusBadge) {
      qualityStatusBadge.textContent = `WQI Index: ${data.waterScore}/100`;
    }

    // 4. Current Purification Mode
    const modeVal = document.getElementById('dash-mode-val');
    const modeDesc = document.getElementById('dash-mode-desc');
    if (modeVal) {
      modeVal.textContent = data.currentMode === 'MUNICIPAL_ECO' ? 'Eco Bypass (Non-RO)' : (data.currentMode === 'BOREWELL_RO' ? 'Full RO Mode' : 'Crisis Multi-Pass');
      modeVal.className = `metric-val-num ${data.currentMode === 'MUNICIPAL_ECO' ? 'cyan' : 'warn'}`;
    }
    if (modeDesc) {
      modeDesc.textContent = data.currentMode === 'MUNICIPAL_ECO' ? 'UF + UV-C Active • 0% Reject Waste' : '75 GPD Membrane + BLDC Booster Active';
    }

    // 5. Filter Health Percentage
    const filterHealth = document.getElementById('dash-filter-health');
    const filterHealthFill = document.getElementById('dash-filter-health-fill');
    if (filterHealth) filterHealth.textContent = `${data.filterHealthAvg || 88}%`;
    if (filterHealthFill) {
      filterHealthFill.style.width = `${data.filterHealthAvg || 88}%`;
      filterHealthFill.className = `progress-bar-fill ${data.filterHealthAvg > 70 ? 'safe' : (data.filterHealthAvg > 40 ? 'warn' : 'hazard')}`;
    }

    // 6. Water Tank Level
    const tankLiters = document.getElementById('dash-tank-liters');
    const tankPct = document.getElementById('dash-tank-pct');
    const tankFillVisual = document.getElementById('dash-tank-water-level');
    const fillPercent = Math.min(100, Math.round((data.cleanTankCurrent / data.cleanTankCapacity) * 100));
    if (tankLiters) tankLiters.textContent = `${data.cleanTankCurrent.toFixed(1)} / ${data.cleanTankCapacity.toFixed(1)} L`;
    if (tankPct) tankPct.textContent = `${fillPercent}% Full`;
    if (tankFillVisual) tankFillVisual.style.height = `${fillPercent}%`;

    // 7. Daily Water Consumption
    const dailyCons = document.getElementById('dash-daily-consumption');
    if (dailyCons) dailyCons.textContent = `${data.dailyConsumption ? data.dailyConsumption.toFixed(1) : '18.5'}`;

    // 8. System Operating Status
    const sysStatus = document.getElementById('dash-system-status');
    if (sysStatus) {
      if (data.emergencyShutoff || data.interlockActive) {
        sysStatus.textContent = 'INTERLOCK CLAMPED';
        sysStatus.className = 'metric-val-num hazard';
      } else if (data.sensors.flowRate > 0.5) {
        sysStatus.textContent = 'PURIFYING & DISPENSING';
        sysStatus.className = 'metric-val-num safe';
      } else {
        sysStatus.textContent = 'STANDBY (PRESSURIZED)';
        sysStatus.className = 'metric-val-num cyan';
      }
    }

    // 9. Total Water Purified
    const totalPur = document.getElementById('dash-total-purified');
    if (totalPur) totalPur.textContent = `${Math.round(data.totalPurifiedLiters).toLocaleString()} L`;

    // 10. Upcoming Maintenance Date
    const nextMaint = document.getElementById('dash-upcoming-maintenance');
    if (nextMaint) nextMaint.textContent = data.upcomingMaintenanceDate || '15 Feb 2027';

    // Mode Reason Banner
    const reasonBanner = document.getElementById('dash-mode-reason');
    if (reasonBanner) {
      reasonBanner.textContent = data.modeReason || 'Automated hydrodynamic analysis continuously optimising mineral retention.';
    }

    // Secondary Reuse Tank
    const reuseVol = document.getElementById('dash-reuse-tank-vol');
    const reuseFill = document.getElementById('dash-reuse-tank-fill');
    if (reuseVol) reuseVol.textContent = `${data.reuseTankCurrent.toFixed(1)} / ${data.reuseTankCapacity.toFixed(1)} L`;
    if (reuseFill) reuseFill.style.width = `${Math.round((data.reuseTankCurrent / data.reuseTankCapacity) * 100)}%`;

    // Update real-time mini graph
    updateMiniTrendChart(data.sensors.inletTDS, data.sensors.outletTDS);
  }

  // Real-Time Mini Trend Canvas Chart
  const trendHistory = [];
  function updateMiniTrendChart(inlet, outlet) {
    const canvas = document.getElementById('dash-mini-trend-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    trendHistory.push({ in: inlet, out: outlet });
    if (trendHistory.length > 30) trendHistory.shift();

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.25); ctx.lineTo(w, h * 0.25);
    ctx.moveTo(0, h * 0.5); ctx.lineTo(w, h * 0.5);
    ctx.moveTo(0, h * 0.75); ctx.lineTo(w, h * 0.75);
    ctx.stroke();

    if (trendHistory.length < 2) return;

    const maxVal = Math.max(...trendHistory.map(d => Math.max(d.in, d.out, 300)));
    const stepX = w / (trendHistory.length - 1);

    // Inlet TDS Line (Yellow/Orange)
    ctx.beginPath();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    trendHistory.forEach((d, i) => {
      const x = i * stepX;
      const y = h - (d.in / maxVal) * (h - 20) - 10;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Outlet TDS Line (Cyan)
    ctx.beginPath();
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2.5;
    trendHistory.forEach((d, i) => {
      const x = i * stepX;
      const y = h - (d.out / maxVal) * (h - 20) - 10;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Glow effect for latest points
    const lastX = (trendHistory.length - 1) * stepX;
    const lastInY = h - (trendHistory[trendHistory.length - 1].in / maxVal) * (h - 20) - 10;
    const lastOutY = h - (trendHistory[trendHistory.length - 1].out / maxVal) * (h - 20) - 10;

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath(); ctx.arc(lastX, lastInY, 4, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#00E5FF';
    ctx.beginPath(); ctx.arc(lastX, lastOutY, 4.5, 0, Math.PI * 2); ctx.fill();
  }

  // ============================================================
  // QUICK ACTIONS: DISPENSE, AUTO-FLUSH, EMERGENCY SHUTOFF
  // ============================================================
  function initQuickActions() {
    // Dispense Water Buttons (250ml, 500ml, 1000ml)
    document.querySelectorAll('.btn-action-dispense').forEach(btn => {
      btn.addEventListener('click', async () => {
        const amount = parseFloat(btn.getAttribute('data-amount') || '0.25');
        btn.disabled = true;
        btn.textContent = `Dispensing ${amount * 1000} ml...`;
        playBeep('dispense');

        const res = await api('/api/analytics/dispense', {
          method: 'POST',
          body: JSON.stringify({ amountLiters: amount })
        });

        if (res && res.success) {
          if (window.hydraSimulation && window.hydraSimulation.dispenseWater) {
            window.hydraSimulation.dispenseWater();
          }
          setTimeout(() => {
            btn.disabled = false;
            btn.textContent = `Dispense (${amount * 1000} ml)`;
            pollStatus();
          }, 1500);
        } else {
          alert(res ? res.error : 'Dispense blocked! Check safety interlock.');
          btn.disabled = false;
          btn.textContent = `Dispense (${amount * 1000} ml)`;
        }
      });
    });

    // Auto-Flush / Reverse-Cleanse Button
    const btnFlush = document.getElementById('btn-action-flush');
    if (btnFlush) {
      btnFlush.addEventListener('click', () => {
        playBeep('flush');
        btnFlush.disabled = true;
        btnFlush.textContent = 'Reverse-Flush Active (15s)...';
        if (window.hydraSimulation) window.hydraSimulation.triggerSelfHealing();

        setTimeout(() => {
          btnFlush.disabled = false;
          btnFlush.textContent = '⚡ Trigger Auto-Flush';
          alert('Membrane Auto-Flush cycle complete! Transmembrane flux restored.');
          pollStatus();
        }, 15000);
      });
    }

    // Emergency Shutoff Buttons (Header & Dashboard)
    const toggleEmergencyShutoff = async () => {
      const current = state.telemetry ? state.telemetry.emergencyShutoff : false;
      const res = await api('/api/leak/emergency-shutoff', {
        method: 'POST',
        body: JSON.stringify({ shutoff: !current })
      });
      if (res && res.success) {
        playBeep('hazard');
        alert(res.message);
        pollStatus();
      }
    };

    const btnTopShutoff = document.getElementById('btn-top-emergency-shutoff');
    const btnDashShutoff = document.getElementById('btn-dash-emergency-shutoff');
    if (btnTopShutoff) btnTopShutoff.addEventListener('click', toggleEmergencyShutoff);
    if (btnDashShutoff) btnDashShutoff.addEventListener('click', toggleEmergencyShutoff);
  }

  // ============================================================
  // 2. WATER QUALITY PAGE
  // ============================================================
  async function fetchQualityHistory() {
    const filter = document.getElementById('filter-history-range')?.value || 'all';
    const res = await api(`/api/telemetry/history?limit=40&filter=${filter}`);
    if (res && res.success) {
      state.history = res.data;
      renderQualityTable(res.data);
    }
  }

  function renderQualityTable(rows) {
    const tbody = document.getElementById('table-quality-history-body');
    if (!tbody) return;

    if (!rows || rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--white-muted); padding:20px;">No historical telemetry records found.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(r => {
      const d = new Date(r.timestamp);
      const timeStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const statusClass = r.quality_status === 'EXCELLENT' ? 'safe' : (r.quality_status === 'WARNING' ? 'warn' : 'hazard');
      return `
        <tr>
          <td style="font-family:var(--font-mono); font-size:0.75rem;">${timeStr}</td>
          <td style="font-weight:700; font-family:var(--font-mono); color:var(--amber-warn);">${r.inlet_tds} ppm</td>
          <td style="font-weight:700; font-family:var(--font-mono); color:var(--cyan-bright);">${r.outlet_tds} ppm</td>
          <td>${r.turbidity} NTU</td>
          <td>${r.ph}</td>
          <td>${r.orp} mV</td>
          <td style="font-size:0.75rem;">${r.purification_mode === 'MUNICIPAL_ECO' ? 'Eco Bypass' : 'Full RO'}</td>
          <td><span class="filter-condition-badge ${statusClass}">${r.quality_status}</span></td>
        </tr>
      `;
    }).join('');
  }

  function initQualityControls() {
    const rangeSelect = document.getElementById('filter-history-range');
    if (rangeSelect) {
      rangeSelect.addEventListener('change', fetchQualityHistory);
    }

    // Export Buttons
    const btnExportCSV = document.getElementById('btn-export-quality-csv');
    const btnExportJSON = document.getElementById('btn-export-quality-json');

    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', () => {
        window.open(`${API_BASE}/api/reports/export?format=csv&type=quality`, '_blank');
      });
    }
    if (btnExportJSON) {
      btnExportJSON.addEventListener('click', () => {
        window.open(`${API_BASE}/api/reports/export?format=json&type=quality`, '_blank');
      });
    }
  }

  // ============================================================
  // 3. INTELLIGENT PURIFICATION CONTROL PAGE
  // ============================================================
  function initPurificationPage() {
    const toggleAuto = document.getElementById('switch-auto-mode');
    const sliderTDS = document.getElementById('slider-threshold-tds');
    const sliderTurb = document.getElementById('slider-threshold-turb');
    const labelTDS = document.getElementById('val-threshold-tds');
    const labelTurb = document.getElementById('val-threshold-turb');
    const btnSaveThresholds = document.getElementById('btn-save-thresholds');

    if (sliderTDS && labelTDS) {
      sliderTDS.addEventListener('input', () => {
        labelTDS.textContent = `${sliderTDS.value} ppm`;
      });
    }

    if (sliderTurb && labelTurb) {
      sliderTurb.addEventListener('input', () => {
        labelTurb.textContent = `${parseFloat(sliderTurb.value).toFixed(1)} NTU`;
      });
    }

    if (btnSaveThresholds) {
      btnSaveThresholds.addEventListener('click', async () => {
        const tdsVal = parseFloat(sliderTDS.value);
        const turbVal = parseFloat(sliderTurb.value);
        const res = await api('/api/purification/mode', {
          method: 'POST',
          body: JSON.stringify({
            tdsThreshold: tdsVal,
            turbidityThreshold: turbVal
          })
        });
        if (res && res.success) {
          alert(`Purification thresholds calibrated: TDS Threshold: ${tdsVal} ppm, Turbidity Threshold: ${turbVal} NTU.`);
          pollStatus();
        }
      });
    }

    if (toggleAuto) {
      toggleAuto.addEventListener('change', async () => {
        const isAuto = toggleAuto.checked;
        const res = await api('/api/purification/mode', {
          method: 'POST',
          body: JSON.stringify({ autoMode: isAuto })
        });
        if (res && res.success) {
          alert(`Purification Mode: ${isAuto ? 'Automatic Mode Engaged' : 'Manual Mode Engaged'}`);
          pollStatus();
        }
      });
    }

    // Manual Mode Option Selection Cards
    document.querySelectorAll('.mode-option-card').forEach(card => {
      card.addEventListener('click', async () => {
        const mode = card.getAttribute('data-mode');
        if (!mode) return;

        // Check if inlet TDS is dangerously high for Eco Non-RO
        const currentInlet = state.telemetry ? state.telemetry.sensors.inletTDS : 110;
        let force = false;

        if (mode === 'MUNICIPAL_ECO' && currentInlet > 350) {
          const confirmOverride = confirm(
            `SAFETY WARNING:\nIncoming water TDS is ${currentInlet} ppm (>350 ppm).\nForcing Non-RO Eco Bypass mode may deliver excess dissolved salts without reverse osmosis.\n\nDo you want to override safety and force Eco Bypass?`
          );
          if (!confirmOverride) return;
          force = true;
        }

        const res = await api('/api/purification/mode', {
          method: 'POST',
          body: JSON.stringify({
            mode,
            autoMode: false,
            forceOverride: force
          })
        });

        if (res && res.success) {
          playBeep('click');
          document.querySelectorAll('.mode-option-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          if (toggleAuto) toggleAuto.checked = false;
          pollStatus();
        } else if (res && res.safetyWarning) {
          alert(res.message);
        }
      });
    });
  }

  // ============================================================
  // 4. FILTER LIFE MONITORING (7 FILTERS)
  // ============================================================
  async function fetchFilters() {
    const res = await api('/api/filters');
    if (res && res.success) {
      state.filters = res.data;
      renderFiltersGrid(res.data);
    }
  }

  function renderFiltersGrid(filters) {
    const grid = document.getElementById('filters-grid-container');
    if (!grid) return;

    if (!filters || filters.length === 0) {
      grid.innerHTML = '<p style="color:var(--white-muted);">Loading filter data...</p>';
      return;
    }

    grid.innerHTML = filters.map(f => {
      const colorClass = f.life_pct > 60 ? 'safe' : (f.life_pct > 30 ? 'warn' : 'hazard');
      const badgeClass = f.condition.toLowerCase();

      return `
        <div class="filter-item-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span class="filter-stage-pill">STAGE ${f.stage_number}</span>
            <span class="filter-condition-badge ${badgeClass}">${f.condition}</span>
          </div>

          <div style="font-size:1.05rem; font-weight:800; color:var(--white-pure); margin-bottom:4px;">
            ${f.name}
          </div>
          <div style="font-size:0.75rem; color:var(--cyan-bright); font-family:var(--font-mono); margin-bottom:12px;">
            Pore: ${f.pore_size}
          </div>

          <div style="margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:700; margin-bottom:6px;">
              <span>Remaining Life:</span>
              <span style="font-family:var(--font-mono); font-size:0.9rem;" class="${colorClass}">${f.life_pct.toFixed(1)}%</span>
            </div>
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill ${colorClass}" style="width:${f.life_pct}%"></div>
            </div>
          </div>

          <div class="filter-metrics-grid">
            <div>
              <div class="item-lbl">Usage Hours</div>
              <div class="item-val">${f.usage_hours.toLocaleString()} hrs</div>
            </div>
            <div>
              <div class="item-lbl">Treated Volume</div>
              <div class="item-val">${f.liters_processed.toLocaleString()} L</div>
            </div>
            <div>
              <div class="item-lbl">Installed</div>
              <div class="item-val">${f.installed_date}</div>
            </div>
            <div>
              <div class="item-lbl">Replace By</div>
              <div class="item-val">${f.est_replacement_date}</div>
            </div>
          </div>

          ${f.notification ? `
            <div style="padding:6px 10px; font-size:0.72rem; border-radius:4px; margin-bottom:12px; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:var(--rose-danger);">
              ⚠️ ${f.notification.text}
            </div>
          ` : ''}

          <button class="btn-outline btn-replace-filter" data-id="${f.filter_id}" data-name="${f.name}" style="width:100%; font-size:0.75rem; padding:8px;">
            🔄 Replace & Reset Filter
          </button>
        </div>
      `;
    }).join('');

    // Wire Replace Filter Buttons
    grid.querySelectorAll('.btn-replace-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        openReplaceFilterModal(id, name);
      });
    });
  }

  function openReplaceFilterModal(filterId, filterName) {
    const modal = document.getElementById('modal-replace-filter');
    const title = document.getElementById('modal-replace-filter-title');
    const inputId = document.getElementById('modal-replace-filter-id');

    if (modal && title && inputId) {
      title.textContent = `Replace ${filterName}`;
      inputId.value = filterId;
      modal.style.display = 'flex';
    }
  }

  function initFilterModals() {
    const modal = document.getElementById('modal-replace-filter');
    const btnClose = document.getElementById('btn-close-replace-modal');
    const form = document.getElementById('form-replace-filter');

    if (btnClose && modal) {
      btnClose.addEventListener('click', () => { modal.style.display = 'none'; });
    }

    if (form && modal) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const filterId = document.getElementById('modal-replace-filter-id').value;
        const technician = document.getElementById('modal-replace-tech').value;
        const notes = document.getElementById('modal-replace-notes').value;

        const res = await api('/api/filters/replace', {
          method: 'POST',
          body: JSON.stringify({ filterId, technician, notes })
        });

        if (res && res.success) {
          alert(res.message);
          modal.style.display = 'none';
          fetchFilters();
          pollStatus();
        } else {
          alert('Failed to replace filter. Please try again.');
        }
      });
    }
  }

  // ============================================================
  // 5. AI-BASED FILTER LIFE PREDICTION
  // ============================================================
  async function fetchPredictions() {
    const res = await api('/api/ai-predictions');
    if (res && res.success) {
      state.predictions = res.predictions;
      renderPredictions(res);
    }
  }

  function renderPredictions(data) {
    const tbody = document.getElementById('table-predictions-body');
    if (!tbody || !data.predictions) return;

    tbody.innerHTML = data.predictions.map(p => {
      return `
        <tr>
          <td style="font-weight:700;">${p.name}</td>
          <td style="font-family:var(--font-mono); font-weight:700; color:var(--cyan-bright);">${p.currentLifePct.toFixed(1)}%</td>
          <td style="font-family:var(--font-mono);">${p.daysRemaining} Days</td>
          <td style="font-family:var(--font-mono); font-weight:700;">${p.estimatedReplacementDate}</td>
          <td>
            <span class="filter-condition-badge ${p.anomalyDetected ? 'critical' : 'optimal'}">
              ${p.anomalyDetected ? '⚠️ ANOMALY' : 'NORMAL'}
            </span>
          </td>
          <td style="font-size:0.75rem; color:var(--white-muted); line-height:1.4;">${p.recommendation}</td>
        </tr>
      `;
    }).join('');

    renderPredictionChart(data.predictions);
  }

  function renderPredictionChart(predictions) {
    const canvas = document.getElementById('chart-predictions-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw comparison bars for days remaining
    const padding = 40;
    const barWidth = (w - padding * 2) / predictions.length - 15;
    const maxDays = 750;

    predictions.forEach((p, i) => {
      const x = padding + i * (barWidth + 15);
      const barH = (p.daysRemaining / maxDays) * (h - 60);
      const y = h - barH - 30;

      // Bar gradient
      const grad = ctx.createLinearGradient(x, y, x, h - 30);
      grad.addColorStop(0, '#00E5FF');
      grad.addColorStop(1, '#0284C7');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth, barH);

      // Label
      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      const shortName = p.name.split(' ')[0];
      ctx.fillText(shortName, x + barWidth / 2, h - 14);

      // Days val
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.fillText(`${p.daysRemaining}d`, x + barWidth / 2, y - 6);
    });
  }

  // ============================================================
  // 6. WATER CONSUMPTION ANALYTICS
  // ============================================================
  async function fetchConsumption() {
    const res = await api('/api/analytics/consumption');
    if (res && res.success) {
      state.consumption = res;
      renderConsumption(res);
    }
  }

  function renderConsumption(data) {
    // Metric cards
    const dailyP = document.getElementById('cons-daily-purified');
    const dailyW = document.getElementById('cons-daily-waste');
    const dailyRec = document.getElementById('cons-daily-recovery');
    const weeklyP = document.getElementById('cons-weekly-purified');
    const monthlyP = document.getElementById('cons-monthly-purified');

    if (dailyP) dailyP.textContent = `${data.today.purified_liters} L`;
    if (dailyW) dailyW.textContent = `${data.today.wastewater_liters} L`;
    if (dailyRec) dailyRec.textContent = `${data.today.recovery_pct}%`;
    if (weeklyP) weeklyP.textContent = `${data.weekly.purifiedLiters} L`;
    if (monthlyP) monthlyP.textContent = `${data.monthly.purifiedLiters} L`;

    // Render 7-day Bar Chart
    renderWeeklyBarChart(data.dailyHistory.slice(-7));

    // Render 24-hr Hourly Profile
    renderHourlyCanvas(data.hourlyProfile);
  }

  function renderWeeklyBarChart(days) {
    const canvas = document.getElementById('chart-weekly-consumption');
    if (!canvas || !days || days.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padding = 30;
    const groupWidth = (w - padding * 2) / days.length;
    const barWidth = 14;
    const maxVal = Math.max(...days.map(d => Math.max(d.purified_liters, d.wastewater_liters, 25)));

    days.forEach((d, i) => {
      const groupX = padding + i * groupWidth + (groupWidth - barWidth * 2 - 4) / 2;

      // Purified Bar (Cyan)
      const purH = (d.purified_liters / maxVal) * (h - 50);
      const purY = h - purH - 24;
      ctx.fillStyle = '#00E5FF';
      ctx.fillRect(groupX, purY, barWidth, purH);

      // Waste Bar (Amber)
      const wasteH = (d.wastewater_liters / maxVal) * (h - 50);
      const wasteY = h - wasteH - 24;
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(groupX + barWidth + 4, wasteY, barWidth, wasteH);

      // Date Label
      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      const dayLabel = d.date.slice(5); // MM-DD
      ctx.fillText(dayLabel, groupX + barWidth + 2, h - 8);
    });
  }

  function renderHourlyCanvas(hours) {
    const canvas = document.getElementById('chart-hourly-consumption');
    if (!canvas || !hours || hours.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padding = 20;
    const stepX = (w - padding * 2) / (hours.length - 1);
    const maxLiters = Math.max(...hours.map(h => h.liters), 3.5);

    // Fill Gradient
    ctx.beginPath();
    hours.forEach((item, i) => {
      const x = padding + i * stepX;
      const y = h - (item.liters / maxLiters) * (h - 40) - 20;
      if (i === 0) {
        ctx.moveTo(x, h - 20);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(padding + (hours.length - 1) * stepX, h - 20);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0.45)');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Top Stroke Line
    ctx.beginPath();
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2.5;
    hours.forEach((item, i) => {
      const x = padding + i * stepX;
      const y = h - (item.liters / maxLiters) * (h - 40) - 20;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  // ============================================================
  // 7. SMART LEAK DETECTION
  // ============================================================
  async function fetchLeakStatus() {
    const res = await api('/api/leak');
    if (res && res.success) {
      state.leak = res;
      renderLeakStatus(res);
    }
  }

  function renderLeakStatus(data) {
    const banner = document.getElementById('leak-status-banner');
    const bannerTitle = document.getElementById('leak-banner-title');
    const bannerDesc = document.getElementById('leak-banner-desc');

    if (banner && bannerTitle && bannerDesc) {
      if (data.leakDetected) {
        banner.style.background = 'rgba(239, 68, 68, 0.18)';
        banner.style.borderColor = 'var(--rose-danger)';
        bannerTitle.innerHTML = '🚨 LEAKAGE DETECTED IN PURIFIER HYDRAULIC CIRCUIT';
        bannerTitle.style.color = 'var(--rose-danger)';
        bannerDesc.textContent = `Continuous abnormal flow trip detected in ${data.leakZone}. Recommend emergency isolation or technician inspection.`;
      } else {
        banner.style.background = 'rgba(16, 185, 129, 0.12)';
        banner.style.borderColor = 'var(--emerald-safe)';
        bannerTitle.innerHTML = '🛡️ SYSTEM SECURE — ZERO LEAKAGE DETECTED';
        bannerTitle.style.color = 'var(--emerald-safe)';
        bannerDesc.textContent = 'All 3 ultrasonic and flow differential sensors report nominal pressure gradients. Hydraulic integrity 100%.';
      }
    }

    // Render Zones
    const zonesContainer = document.getElementById('leak-zones-grid');
    if (zonesContainer && data.zones) {
      zonesContainer.innerHTML = data.zones.map(z => {
        const isHazard = z.status === 'LEAK_DETECTED';
        return `
          <div style="background:var(--navy-card); border:1px solid ${isHazard ? 'var(--rose-danger)' : 'var(--navy-border)'}; border-radius:var(--radius-sm); padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-weight:800; font-size:0.85rem;">${z.name}</span>
              <span class="filter-condition-badge ${isHazard ? 'critical' : 'optimal'}">
                ${isHazard ? '⚠️ LEAK TRIP' : 'SECURE'}
              </span>
            </div>
            <div style="font-size:0.75rem; color:var(--white-muted);">
              ${isHazard ? 'Abnormal pressure drop and micro-flow detected.' : 'Pressure gradient stable. Moisture sensor dry.'}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function initLeakControls() {
    const btnSimulateLeak = document.getElementById('btn-simulate-leak');
    const btnClearLeak = document.getElementById('btn-clear-leak');

    if (btnSimulateLeak) {
      btnSimulateLeak.addEventListener('click', async () => {
        playBeep('hazard');
        const res = await api('/api/leak/simulate', {
          method: 'POST',
          body: JSON.stringify({ trigger: true, zone: 'Zone 2 (RO Manifold)' })
        });
        if (res && res.success) {
          alert('Simulated leak event injected in Zone 2! Emergency alerts dispatched.');
          fetchLeakStatus();
          pollStatus();
        }
      });
    }

    if (btnClearLeak) {
      btnClearLeak.addEventListener('click', async () => {
        const res = await api('/api/leak/simulate', {
          method: 'POST',
          body: JSON.stringify({ trigger: false })
        });
        if (res && res.success) {
          alert('Leak condition cleared. Baseline sensors restored.');
          fetchLeakStatus();
          pollStatus();
        }
      });
    }
  }

  // ============================================================
  // 8. FAULT DETECTION & ALERTS
  // ============================================================
  async function fetchAlerts() {
    const res = await api('/api/alerts');
    if (res && res.success) {
      state.alerts = res.data;
      renderAlerts(res.data);
    }
  }

  function renderAlerts(alerts) {
    const tbody = document.getElementById('table-alerts-body');
    const badgeActive = document.getElementById('badge-active-alerts-count');

    if (!tbody) return;

    const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;
    if (badgeActive) {
      badgeActive.textContent = `${activeCount} ACTIVE`;
      badgeActive.className = `sidebar-badge ${activeCount > 0 ? 'danger' : ''}`;
    }

    if (!alerts || alerts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--white-muted);">No alerts logged. System is operating safely.</td></tr>';
      return;
    }

    tbody.innerHTML = alerts.map(a => {
      const d = new Date(a.timestamp);
      const timeStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const isResolved = a.status === 'RESOLVED';
      const sevClass = a.severity === 'CRITICAL' ? 'hazard' : (a.severity === 'WARNING' ? 'warn' : 'cyan');

      return `
        <tr>
          <td style="font-family:var(--font-mono); font-size:0.75rem;">${timeStr}</td>
          <td><span class="filter-condition-badge ${sevClass}">${a.severity}</span></td>
          <td style="font-weight:700;">${a.title}</td>
          <td style="font-size:0.78rem; color:var(--white-muted); line-height:1.4;">${a.message}</td>
          <td>
            <span class="filter-condition-badge ${isResolved ? 'optimal' : 'critical'}">
              ${a.status}
            </span>
          </td>
          <td>
            ${!isResolved ? `
              <button class="btn-outline btn-resolve-alert" data-id="${a.id}" style="padding:4px 8px; font-size:0.72rem;">
                ✓ Resolve
              </button>
            ` : '<span style="color:var(--white-faint); font-size:0.72rem;">Done</span>'}
          </td>
        </tr>
      `;
    }).join('');

    // Wire Resolve Buttons
    tbody.querySelectorAll('.btn-resolve-alert').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const notes = prompt('Enter resolution summary / action taken:');
        if (notes === null) return;

        const res = await api('/api/alerts/resolve', {
          method: 'POST',
          body: JSON.stringify({ alertId: parseInt(id, 10), notes: notes || 'Resolved via technician interface' })
        });
        if (res && res.success) {
          fetchAlerts();
        }
      });
    });
  }

  // ============================================================
  // 9. MAINTENANCE MANAGEMENT
  // ============================================================
  async function fetchMaintenance() {
    const res = await api('/api/maintenance');
    if (res && res.success) {
      state.maintenance = res;
      renderMaintenance(res);
    }
  }

  function renderMaintenance(data) {
    // Schedule Table
    const scheduleTbody = document.getElementById('table-maint-schedule-body');
    if (scheduleTbody && data.filtersSchedule) {
      scheduleTbody.innerHTML = data.filtersSchedule.map(s => `
        <tr>
          <td style="font-weight:700;">${s.name}</td>
          <td style="font-family:var(--font-mono);">Stage ${s.stage}</td>
          <td style="font-family:var(--font-mono); font-weight:700; color:var(--cyan-bright);">${s.replacementDate}</td>
          <td>${s.lifePct}%</td>
          <td><span class="filter-condition-badge ${s.condition.toLowerCase()}">${s.condition}</span></td>
        </tr>
      `).join('');
    }

    // Service History Table
    const histTbody = document.getElementById('table-maint-history-body');
    if (histTbody && data.records) {
      histTbody.innerHTML = data.records.map(r => `
        <tr>
          <td style="font-family:var(--font-mono); font-size:0.75rem;">${r.date}</td>
          <td style="font-weight:700;">${r.service_type}</td>
          <td>${r.technician}</td>
          <td style="font-size:0.75rem; color:var(--white-muted);">${r.notes}</td>
          <td style="font-family:var(--font-mono);">₹${r.cost}</td>
          <td><span class="filter-condition-badge optimal">${r.status}</span></td>
        </tr>
      `).join('');
    }

    // Pump Inspection Card
    if (data.pumpInspection) {
      const p = data.pumpInspection;
      const pumpInfo = document.getElementById('maint-pump-info');
      if (pumpInfo) {
        pumpInfo.innerHTML = `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.8rem;">
            <div>Running Hours: <strong style="font-family:var(--font-mono); color:var(--cyan-bright);">${p.runningHours} / ${p.ratedHours} hrs</strong></div>
            <div>Phase Stator Current: <strong style="font-family:var(--font-mono);">${p.currentRMS}</strong></div>
            <div>Cavitation Index: <strong style="color:var(--emerald-safe);">${p.cavitationIndex}</strong></div>
            <div>Next Inspection: <strong style="font-family:var(--font-mono);">${p.nextInspectionDue}</strong></div>
          </div>
        `;
      }
    }

    // UV Lamp Status Card
    if (data.uvLampStatus) {
      const uv = data.uvLampStatus;
      const uvInfo = document.getElementById('maint-uv-info');
      if (uvInfo) {
        uvInfo.innerHTML = `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.8rem;">
            <div>Operating Hours: <strong style="font-family:var(--font-mono); color:var(--cyan-bright);">${uv.operatingHours} / ${uv.ratedLifespanHours} hrs</strong></div>
            <div>Irradiance: <strong style="font-family:var(--font-mono);">${uv.opticalIrradiance}</strong></div>
            <div>Disinfection Efficacy: <strong style="color:var(--emerald-safe);">${uv.germicidalSafetyFactor}</strong></div>
            <div>Life Remaining: <strong style="font-family:var(--font-mono);">${uv.replacementDueHours} hrs</strong></div>
          </div>
        `;
      }
    }
  }

  function initMaintenanceModals() {
    const btnLogService = document.getElementById('btn-open-log-service-modal');
    const modal = document.getElementById('modal-log-service');
    const btnClose = document.getElementById('btn-close-service-modal');
    const form = document.getElementById('form-log-service');

    if (btnLogService && modal) {
      btnLogService.addEventListener('click', () => { modal.style.display = 'flex'; });
    }
    if (btnClose && modal) {
      btnClose.addEventListener('click', () => { modal.style.display = 'none'; });
    }
    if (form && modal) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const technician = document.getElementById('service-input-tech').value;
        const serviceType = document.getElementById('service-input-type').value;
        const cost = document.getElementById('service-input-cost').value;
        const notes = document.getElementById('service-input-notes').value;

        const res = await api('/api/maintenance/log', {
          method: 'POST',
          body: JSON.stringify({ technician, serviceType, cost, notes })
        });
        if (res && res.success) {
          alert('Maintenance service record added to SQLite database.');
          modal.style.display = 'none';
          fetchMaintenance();
        }
      });
    }
  }

  // ============================================================
  // 10. SETTINGS & HARDWARE INTEGRATION
  // ============================================================
  async function fetchSettings() {
    const res = await api('/api/settings');
    if (res && res.success) {
      state.settings = res.settings;
      renderSettings(res.settings);
    }
  }

  function renderSettings(settings) {
    const inTds = document.getElementById('setting-tds-threshold');
    const inTurb = document.getElementById('setting-turb-threshold');
    const switchSim = document.getElementById('setting-sim-toggle');
    const switchSound = document.getElementById('setting-sound-toggle');
    const deviceId = document.getElementById('setting-device-id');

    if (inTds) inTds.value = settings.tds_threshold || '200';
    if (inTurb) inTurb.value = settings.turbidity_threshold || '1.0';
    if (switchSim) switchSim.checked = settings.simulation_mode === 'true';
    if (deviceId) deviceId.textContent = settings.device_id || 'HYDRA-2026-BLR-0038';
  }

  function initSettingsHandlers() {
    const btnSave = document.getElementById('btn-save-settings');
    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        const tds = document.getElementById('setting-tds-threshold').value;
        const turb = document.getElementById('setting-turb-threshold').value;
        const sim = document.getElementById('setting-sim-toggle').checked;
        const sound = document.getElementById('setting-sound-toggle').checked;

        state.audioEnabled = sound;

        const res = await api('/api/settings', {
          method: 'POST',
          body: JSON.stringify({
            tds_threshold: tds,
            turbidity_threshold: turb,
            simulation_mode: String(sim),
            audio_alerts: String(sound)
          })
        });

        if (res && res.success) {
          alert('Settings updated successfully.');
          pollStatus();
        }
      });
    }

    // Push notification permission request
    const btnPush = document.getElementById('btn-req-push-notify');
    if (btnPush) {
      btnPush.addEventListener('click', () => {
        if ('Notification' in window) {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              alert('Push notifications enabled for HydroOS!');
              new Notification('HydroOS 2.0 Water Safety Alert', {
                body: 'Continuous water quality and leak monitoring notifications active.'
              });
            } else {
              alert('Notification permission denied.');
            }
          });
        } else {
          alert('Web notifications are not supported in this browser.');
        }
      });
    }
  }

  // ============================================================
  // INITIALIZATION ON DOM READY
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initQuickActions();
    initQualityControls();
    initPurificationPage();
    initFilterModals();
    initLeakControls();
    initMaintenanceModals();
    initSettingsHandlers();

    // Start background telemetry polling
    pollStatus();
    setInterval(pollStatus, 1500);

    // Initial background loads
    fetchFilters();
    fetchAlerts();
  });

  // Export controller to window
  window.smartROClient = {
    state,
    pollStatus,
    fetchFilters,
    fetchAlerts,
    openReplaceFilterModal
  };

})();

