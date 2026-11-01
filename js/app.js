/**
 * Atomberg HydraOS 2.0 - Central Application Orchestrator
 * Coordinates Three.js 3D WebGL engine, 5-portal navigation, simulation kernel, and all 6 innovations
 */

document.addEventListener('DOMContentLoaded', () => {
  const sim = window.hydraSimulation;
  const grid = window.hydraGrid;
  const forecast = window.waterForecast;
  const fleet = window.fleetManagement;
  const hydration = window.familyHydration;
  const consoleModule = window.jalMitraConsole;
  const audio = window.hydraAudio;

  // New Innovation Modules
  const mcsa = window.mcsaSensor;
  const suva = window.suvaSpectral;
  const gnn = window.gnnAttribution;
  const zkp = window.zkpPrivacy;
  const energy = window.energyNexus;
  const pinn = window.pinnTwin;

  // 1. Initialize 3D WebGL Pipeline
  let sceneManager = null;
  let chassisModel = null;

  try {
    sceneManager = new HydraSceneManager('canvas-container');
    chassisModel = new AtombergChassisModel(sceneManager);

    window.sceneManager = sceneManager;
    window.chassisModel = chassisModel;

    // Helper functions for 3D Smart Feature Information Modals
    function openModalWithContent(html) {
      const modal = document.getElementById('component-inspector-modal');
      const content = document.getElementById('inspector-content');
      if (modal && content) {
        content.innerHTML = html;
        modal.style.display = 'flex';
        if (audio) audio.playSolenoidClick(true);
      }
    }

    function showDisplayModal() {
      const currentSim = sim ? sim.getState() : {};
      const inTDS = currentSim.sensors ? currentSim.sensors.inletTDS : 450;
      const outTDS = currentSim.sensors ? currentSim.sensors.outletTDS : 45;
      const isRO = currentSim.currentMode !== 'MUNICIPAL_ECO';
      const rejection = inTDS > 0 ? (((inTDS - outTDS) / inTDS) * 100).toFixed(1) : '90.0';

      openModalWithContent(`
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(0,229,255,0.25); padding-bottom:12px; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:36px; height:36px; border-radius:8px; background:rgba(0,229,255,0.12); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">📱</div>
            <div>
              <div style="font-size:0.95rem; font-weight:800; color:#FFFFFF;">Smart AMOLED Digital Touchscreen HMI</div>
              <div style="font-size:0.72rem; color:var(--cyan-bright); font-family:var(--font-mono);">SKU: ATMB-DSP-OLED-01 • Active Purity Telemetry</div>
            </div>
          </div>
          <button onclick="document.getElementById('component-inspector-modal').style.display='none'" style="background:none; border:none; color:var(--white-muted); font-size:1.3rem; cursor:pointer;">✕</button>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
          <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:12px;">
            <div style="font-size:0.68rem; font-weight:800; text-transform:uppercase; color:var(--amber-warn); letter-spacing:0.5px;">Input Water TDS (Raw Feed)</div>
            <div style="display:flex; align-items:baseline; gap:4px; margin-top:4px;">
              <span style="font-size:1.6rem; font-weight:900; font-family:var(--font-mono); color:var(--amber-warn);">${inTDS}</span>
              <span style="font-size:0.75rem; color:var(--white-muted);">ppm</span>
            </div>
            <div style="font-size:0.7rem; color:var(--white-muted); margin-top:4px;">Inlet sensor conductivity</div>
          </div>

          <div style="background:rgba(0,229,255,0.08); border:1px solid rgba(0,229,255,0.3); border-radius:8px; padding:12px;">
            <div style="font-size:0.68rem; font-weight:800; text-transform:uppercase; color:var(--cyan-bright); letter-spacing:0.5px;">Purified Water TDS</div>
            <div style="display:flex; align-items:baseline; gap:4px; margin-top:4px;">
              <span style="font-size:1.6rem; font-weight:900; font-family:var(--font-mono); color:var(--cyan-bright);">${outTDS}</span>
              <span style="font-size:0.75rem; color:var(--white-muted);">ppm</span>
            </div>
            <div style="font-size:0.7rem; color:var(--emerald-safe); margin-top:4px;">Optimal potable mineral balance</div>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:12px; margin-bottom:14px; font-size:0.75rem; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div>Salt Rejection Efficiency: <strong style="color:var(--emerald-safe); font-family:var(--font-mono);">${rejection}%</strong></div>
          <div>Water Quality Score: <strong style="color:var(--emerald-safe);">EXCELLENT (96%)</strong></div>
          <div>Operating Mode: <strong style="color:var(--cyan-bright);">${isRO ? 'Full Reverse Osmosis (RO)' : 'Municipal Eco Bypass'}</strong></div>
          <div>TDS Threshold: <strong style="color:var(--white-pure); font-family:var(--font-mono);">200 ppm</strong></div>
          <div>Turbidity (860nm): <strong style="color:var(--emerald-safe); font-family:var(--font-mono);">0.35 NTU</strong></div>
          <div>System Operating Status: <strong style="color:var(--emerald-safe);">● Running &amp; Safe</strong></div>
        </div>

        <div style="font-size:0.72rem; color:var(--white-muted); margin-bottom:16px; line-height:1.4;">
          💡 <strong>Intelligent Purification:</strong> Automatic mode switching selects RO for raw TDS &gt; 200 ppm and switches to Eco UF bypass below 200 ppm to eliminate wastewater and retain essential minerals.
        </div>

        <div style="display:flex; gap:10px;">
          <button id="modal-btn-view-quality" class="btn-primary" style="flex:1; font-size:0.75rem; padding:9px;">
            📊 View Water Quality History
          </button>
          <button onclick="document.getElementById('component-inspector-modal').style.display='none'" class="btn-outline" style="font-size:0.75rem; padding:9px 18px;">
            Close
          </button>
        </div>
      `);

      const btnQuality = document.getElementById('modal-btn-view-quality');
      if (btnQuality) {
        btnQuality.addEventListener('click', () => {
          document.getElementById('component-inspector-modal').style.display = 'none';
          document.querySelector('[data-target-page="quality"]')?.click();
        });
      }
    }

    function showFilterModal() {
      openModalWithContent(`
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(16,185,129,0.25); padding-bottom:12px; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:36px; height:36px; border-radius:8px; background:rgba(16,185,129,0.12); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">🧪</div>
            <div>
              <div style="font-size:0.95rem; font-weight:800; color:#FFFFFF;">7-Stage Core Filtration Matrix &amp; AI Predictions</div>
              <div style="font-size:0.72rem; color:var(--emerald-safe); font-family:var(--font-mono);">Aggregate Filter Health: 92% • Predictive Maintenance Active</div>
            </div>
          </div>
          <button onclick="document.getElementById('component-inspector-modal').style.display='none'" style="background:none; border:none; color:var(--white-muted); font-size:1.3rem; cursor:pointer;">✕</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; max-height:230px; overflow-y:auto; padding-right:4px; margin-bottom:14px;">
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:8px 10px;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;">
              <span style="font-weight:700; color:var(--white-pure);">1. Sediment Pre-Filter (5µm Spun PP)</span>
              <span style="font-family:var(--font-mono); color:var(--emerald-safe); font-weight:800;">82.5%</span>
            </div>
            <div style="width:100%; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
              <div style="width:82.5%; height:100%; background:var(--emerald-safe);"></div>
            </div>
            <div style="font-size:0.68rem; color:var(--white-muted); margin-top:3px;">Est. Replacement: 142 days (22 Mar 2027) • Condition: Good</div>
          </div>

          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:8px 10px;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;">
              <span style="font-weight:700; color:var(--white-pure);">2. Activated Carbon Pre-Filter (10µm)</span>
              <span style="font-family:var(--font-mono); color:var(--amber-warn); font-weight:800;">78.0%</span>
            </div>
            <div style="width:100%; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
              <div style="width:78%; height:100%; background:var(--amber-warn);"></div>
            </div>
            <div style="font-size:0.68rem; color:var(--white-muted); margin-top:3px;">Est. Replacement: 106 days (15 Feb 2027) • Chlorine Adsorption: Normal</div>
          </div>

          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:8px 10px;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;">
              <span style="font-weight:700; color:var(--white-pure);">3. Thin-Film RO Membrane (0.0001µm)</span>
              <span style="font-family:var(--font-mono); color:var(--emerald-safe); font-weight:800;">91.5%</span>
            </div>
            <div style="width:100%; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
              <div style="width:91.5%; height:100%; background:var(--emerald-safe);"></div>
            </div>
            <div style="font-size:0.68rem; color:var(--white-muted); margin-top:3px;">Est. Replacement: 380 days (18 Nov 2027) • Heavy metals &amp; salinity rejection: 99.2%</div>
          </div>

          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:8px 10px;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;">
              <span style="font-weight:700; color:var(--white-pure);">4. Hollow-Fiber UF Filter (0.01µm)</span>
              <span style="font-family:var(--font-mono); color:var(--emerald-safe); font-weight:800;">88.0%</span>
            </div>
            <div style="width:100%; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
              <div style="width:88%; height:100%; background:var(--emerald-safe);"></div>
            </div>
            <div style="font-size:0.68rem; color:var(--white-muted); margin-top:3px;">Est. Replacement: 220 days (08 Jun 2027) • Eco bypass bacterial barrier</div>
          </div>

          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:8px 10px;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;">
              <span style="font-weight:700; color:var(--white-pure);">5. Bioceramic Mineralizer (Alkaline)</span>
              <span style="font-family:var(--font-mono); color:var(--emerald-safe); font-weight:800;">84.0%</span>
            </div>
            <div style="width:100%; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
              <div style="width:84%; height:100%; background:var(--emerald-safe);"></div>
            </div>
            <div style="font-size:0.68rem; color:var(--white-muted); margin-top:3px;">Est. Replacement: 180 days (28 Apr 2027) • Remineralization pH 7.4</div>
          </div>

          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:8px 10px;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;">
              <span style="font-weight:700; color:var(--white-pure);">6. Quartz UV-C LED Chamber (254nm)</span>
              <span style="font-family:var(--font-mono); color:var(--emerald-safe); font-weight:800;">96.0%</span>
            </div>
            <div style="width:100%; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
              <div style="width:96%; height:100%; background:var(--violet-uv);"></div>
            </div>
            <div style="font-size:0.68rem; color:var(--white-muted); margin-top:3px;">Est. Replacement: 510 days (25 Mar 2028) • Continuous germicidal sterilization</div>
          </div>

          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:8px 10px;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;">
              <span style="font-weight:700; color:var(--white-pure);">7. Food-Grade Storage Reservoir (8.0 L)</span>
              <span style="font-family:var(--font-mono); color:var(--emerald-safe); font-weight:800;">98.0%</span>
            </div>
            <div style="width:100%; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
              <div style="width:98%; height:100%; background:var(--cyan-bright);"></div>
            </div>
            <div style="font-size:0.68rem; color:var(--white-muted); margin-top:3px;">Sanitization Due: 240 days • Hermetic diaphragm intact</div>
          </div>
        </div>

        <div style="background:rgba(16,185,129,0.06); border-left:3px solid var(--emerald-safe); padding:10px 12px; border-radius:4px; font-size:0.72rem; color:var(--white-dim); margin-bottom:16px; line-height:1.4;">
          🤖 <strong>AI Predictive Maintenance Engine:</strong> Hydrodynamic degradation curves indicate uniform differential pressure (ΔP = 1.2 PSI). No early fouling or scale accumulation detected. Next scheduled inspection is Stage 2 Pre-Carbon filter on 15 Feb 2027.
        </div>

        <div style="display:flex; gap:10px;">
          <button id="modal-btn-view-filters" class="btn-primary" style="flex:1; font-size:0.75rem; padding:9px;">
            🧪 Open Filter Monitoring &amp; Maintenance
          </button>
          <button onclick="document.getElementById('component-inspector-modal').style.display='none'" class="btn-outline" style="font-size:0.75rem; padding:9px 18px;">
            Close
          </button>
        </div>
      `);

      const btnFilters = document.getElementById('modal-btn-view-filters');
      if (btnFilters) {
        btnFilters.addEventListener('click', () => {
          document.getElementById('component-inspector-modal').style.display = 'none';
          document.querySelector('[data-target-page="filters"]')?.click();
        });
      }
    }

    function showOutletModal() {
      const currentSim = sim ? sim.getState() : {};
      const isSafe = !currentSim.actuators || currentSim.actuators.solenoidInterlock;
      const isRO = currentSim.currentMode !== 'MUNICIPAL_ECO';

      openModalWithContent(`
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(0,229,255,0.25); padding-bottom:12px; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:36px; height:36px; border-radius:8px; background:rgba(0,229,255,0.12); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">🚰</div>
            <div>
              <div style="font-size:0.95rem; font-weight:800; color:#FFFFFF;">Water Dispenser Faucet &amp; Solenoid Status</div>
              <div style="font-size:0.72rem; color:var(--cyan-bright); font-family:var(--font-mono);">SKU: ATMB-TAP-CHROME-01 • Lead-Free Solid Brass</div>
            </div>
          </div>
          <button onclick="document.getElementById('component-inspector-modal').style.display='none'" style="background:none; border:none; color:var(--white-muted); font-size:1.3rem; cursor:pointer;">✕</button>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
          <div style="background:rgba(0,229,255,0.06); border:1px solid rgba(0,229,255,0.2); border-radius:8px; padding:12px;">
            <div style="font-size:0.68rem; font-weight:800; text-transform:uppercase; color:var(--cyan-bright);">Dispenser Flow Rate</div>
            <div style="font-size:1.4rem; font-weight:900; font-family:var(--font-mono); color:var(--white-pure); margin-top:4px;">1.8 L/min</div>
            <div style="font-size:0.7rem; color:var(--emerald-safe); margin-top:2px;">Aerated laminar stream</div>
          </div>

          <div style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2); border-radius:8px; padding:12px;">
            <div style="font-size:0.68rem; font-weight:800; text-transform:uppercase; color:var(--emerald-safe);">Solenoid Interlock</div>
            <div style="font-size:1.4rem; font-weight:900; font-family:var(--font-mono); color:${isSafe ? 'var(--emerald-safe)' : 'var(--rose-danger)'}; margin-top:4px;">
              ${isSafe ? 'ACTIVE (OPEN)' : 'LOCKED (HAZARD)'}
            </div>
            <div style="font-size:0.7rem; color:var(--white-muted); margin-top:2px;">Zero backflow risk</div>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:12px; margin-bottom:16px; font-size:0.75rem; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div>Purification Mode: <strong style="color:var(--cyan-bright);">${isRO ? 'Reverse Osmosis Active' : 'Eco Bypass Active'}</strong></div>
          <div>Halo LED Feedback: <strong style="color:var(--cyan-bright);">Electric Cyan (Purity Confirmed)</strong></div>
          <div>Clean Tank Storage: <strong style="color:var(--white-pure); font-family:var(--font-mono);">6.8 / 8.0 L (85% Ready)</strong></div>
          <div>Dispense Tap Seal: <strong style="color:var(--emerald-safe);">EPDM Zero Weepage</strong></div>
        </div>

        <div style="background:rgba(0,229,255,0.08); border:1px solid var(--cyan-bright); border-radius:8px; padding:14px; text-align:center; margin-bottom:16px;">
          <div style="font-size:0.8rem; font-weight:700; color:var(--white-pure); margin-bottom:4px;">Instant Aliquot Pour Trigger</div>
          <div style="font-size:0.72rem; color:var(--white-muted); margin-bottom:12px;">Pours animated water stream from chrome spout into drip tray</div>
          <button id="modal-btn-dispense" class="btn-primary" style="padding:10px 24px; font-size:0.85rem; font-weight:800;">
            🥛 Dispense Glass (250 ml)
          </button>
        </div>

        <div style="display:flex; gap:10px;">
          <button id="modal-btn-view-purification" class="btn-outline" style="flex:1; font-size:0.75rem; padding:9px;">
            ⚙️ Mode &amp; Solenoid Settings
          </button>
          <button onclick="document.getElementById('component-inspector-modal').style.display='none'" class="btn-outline" style="font-size:0.75rem; padding:9px 18px;">
            Close
          </button>
        </div>
      `);

      const btnDispense = document.getElementById('modal-btn-dispense');
      if (btnDispense) {
        btnDispense.addEventListener('click', () => {
          if (chassisModel) chassisModel.triggerDispenseVisual(2.5);
          if (audio) audio.playDispensePour(2.5);
          fetch('/api/analytics/dispense', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 0.25 })
          }).catch(() => {});
        });
      }

      const btnMode = document.getElementById('modal-btn-view-purification');
      if (btnMode) {
        btnMode.addEventListener('click', () => {
          document.getElementById('component-inspector-modal').style.display = 'none';
          document.querySelector('[data-target-page="purification"]')?.click();
        });
      }
    }

    function showComponentDetailModal(partData) {
      openModalWithContent(`
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px; margin-bottom:12px;">
          <span style="font-size:0.85rem; font-weight:800; text-transform:uppercase; color:var(--white-pure);">Component Diagnostics</span>
          <button onclick="document.getElementById('component-inspector-modal').style.display='none'" style="background:none; border:none; font-weight:800; cursor:pointer; color:var(--white-muted); font-size:1.2rem;">✕</button>
        </div>
        <div style="font-size:0.95rem; font-weight:800; color:var(--white-pure); margin-bottom:4px;">
          ${partData.name || 'HydroOS Core Component'}
        </div>
        <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--cyan-bright); font-weight:700; margin-bottom:10px;">
          SKU: ${partData.sku || 'ATMB-RO-GENERIC'}
        </div>
        <div style="font-size:0.78rem; color:var(--white-dim); line-height:1.5; margin-bottom:14px;">
          ${partData.function || partData.info || 'Essential cyber-physical filtration component.'}
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.75rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:10px; border-radius:6px; margin-bottom:14px;">
          <div>Pore / Spec: <strong style="color:var(--white-pure);">${partData.poreSize || partData.wavelength || partData.capacity || 'Calibrated'}</strong></div>
          <div>Rated Pressure: <strong style="color:var(--white-pure);">${partData.ratedPressure || partData.ratedSpeed || 'Compliant'}</strong></div>
          <div>Health Index: <strong style="color:var(--emerald-safe);">${partData.health || 95}%</strong></div>
          <div>Material: <strong style="color:var(--white-pure);">${partData.material ? partData.material.split(' ')[0] : 'Polymer'}</strong></div>
        </div>
        <button onclick="document.getElementById('component-inspector-modal').style.display='none'" class="btn-primary" style="width:100%; font-weight:700; font-size:0.75rem; padding:8px;">
          Close Inspector
        </button>
      `);
    }

    // 3D Raycasting Inspection Router
    sceneManager.setComponentClickListener((partData) => {
      if (!partData) return;
      if (partData.featureId === 'display') {
        showDisplayModal();
      } else if (partData.featureId === 'filter') {
        showFilterModal();
      } else if (partData.featureId === 'outlet') {
        showOutletModal();
      } else {
        showComponentDetailModal(partData);
      }
    });

    // Expose modal openers globally for button shortcuts
    window.show3DDisplayModal = showDisplayModal;
    window.show3DFilterModal = showFilterModal;
    window.show3DOutletModal = showOutletModal;

    // Hotspot Action Button Listeners
    const btnHotspotDisplay = document.getElementById('btn-hotspot-display');
    if (btnHotspotDisplay) btnHotspotDisplay.addEventListener('click', showDisplayModal);

    const btnHotspotFilter = document.getElementById('btn-hotspot-filter');
    if (btnHotspotFilter) btnHotspotFilter.addEventListener('click', showFilterModal);

    const btnHotspotOutlet = document.getElementById('btn-hotspot-outlet');
    if (btnHotspotOutlet) btnHotspotOutlet.addEventListener('click', showOutletModal);

    // Dashboard 3D Viewport Controls
    const btnDashViewAssembled = document.getElementById('btn-dash-view-assembled');
    const btnDashViewXray = document.getElementById('btn-dash-view-xray');
    const btnDashViewExplode = document.getElementById('btn-dash-view-explode');
    const btnDashAutorotate = document.getElementById('btn-dash-autorotate');
    const btnDashResetCam = document.getElementById('btn-dash-resetcam');
    const btn3dDispense = document.getElementById('btn-3d-dispense');
    const selectPartIsolate = document.getElementById('select-part-isolate');
    const partInspectHint = document.getElementById('part-inspect-hint');

    function updateViewButtons(active) {
      const allBtns = [
        { el: btnDashViewAssembled, key: 'assembled' },
        { el: btnDashViewXray, key: 'xray' },
        { el: btnDashViewExplode, key: 'explode' }
      ];
      allBtns.forEach(b => {
        if (!b.el) return;
        if (b.key === active) {
          b.el.classList.remove('btn-outline');
          b.el.classList.add('btn-primary');
        } else {
          b.el.classList.remove('btn-primary');
          b.el.classList.add('btn-outline');
        }
      });
    }

    if (btnDashViewAssembled) {
      btnDashViewAssembled.addEventListener('click', () => {
        if (chassisModel) chassisModel.setAssembledView();
        if (sceneManager) sceneManager.setViewMode('DEFAULT');
        if (selectPartIsolate) selectPartIsolate.value = 'all';
        if (partInspectHint) {
          partInspectHint.innerHTML = '💡 <em>Full assembled view active. Select any part below to isolate in 3D.</em>';
        }
        updateViewButtons('assembled');
        if (audio) audio.playSolenoidClick(true);
      });
    }

    if (btnDashViewXray) {
      btnDashViewXray.addEventListener('click', () => {
        if (!chassisModel) return;
        chassisModel.setExplodedView(false);
        chassisModel.isolatePart('all');
        const isX = chassisModel.toggleXRayMode();
        if (isX) {
          updateViewButtons('xray');
          if (partInspectHint) {
            partInspectHint.innerHTML = '💎 <span style="color:#00e5ff; font-weight:700;">X-Ray Cutaway Active:</span> Translucent casing reveals illuminated 7-stage filter cores &amp; spiral RO membrane.';
          }
        } else {
          updateViewButtons('assembled');
        }
        if (audio) audio.playSolenoidClick(true);
      });
    }

    if (btnDashViewExplode) {
      btnDashViewExplode.addEventListener('click', () => {
        if (!chassisModel) return;
        chassisModel.setXRayMode(false);
        chassisModel.isolatePart('all');
        const isExp = chassisModel.toggleExplodedView();
        if (isExp) {
          if (sceneManager) sceneManager.setViewMode('EXPLODED');
          updateViewButtons('explode');
          if (partInspectHint) {
            partInspectHint.innerHTML = '🔧 <span style="color:#00e5ff; font-weight:700;">Exploded Disassembly Active:</span> All components separated in 3D space with PURITECH-style callout labels.';
          }
        } else {
          if (sceneManager) sceneManager.setViewMode('DEFAULT');
          updateViewButtons('assembled');
        }
        if (audio) audio.playSolenoidClick(true);
      });
    }

    if (selectPartIsolate) {
      selectPartIsolate.addEventListener('change', (e) => {
        const partKey = e.target.value;
        if (!chassisModel) return;
        chassisModel.isolatePart(partKey);
        if (partKey === 'all') {
          updateViewButtons('assembled');
          if (partInspectHint) {
            partInspectHint.innerHTML = '📦 <em>All components visible in standard assembly.</em>';
          }
        } else {
          const selectedLabel = e.target.options[e.target.selectedIndex].text;
          if (partInspectHint) {
            partInspectHint.innerHTML = '🔍 <span style="color:#00e5ff; font-weight:700;">Isolated:</span> ' + selectedLabel + ' (other chassis parts ghosted at 10% opacity)';
          }
        }
        if (audio) audio.playSolenoidClick(true);
      });
    }

    if (btnDashAutorotate) {
      btnDashAutorotate.addEventListener('click', () => {
        const active = chassisModel.toggleAutoRotate();
        btnDashAutorotate.textContent = active ? '🔄 Auto-Rotate: ON' : '🔄 Auto-Rotate: OFF';
        if (active) {
          btnDashAutorotate.classList.add('btn-primary');
          btnDashAutorotate.classList.remove('btn-outline');
        } else {
          btnDashAutorotate.classList.add('btn-outline');
          btnDashAutorotate.classList.remove('btn-primary');
        }
        if (audio) audio.playSolenoidClick(true);
      });
    }

    if (btnDashResetCam) {
      btnDashResetCam.addEventListener('click', () => {
        sceneManager.resetCamera();
        if (chassisModel) chassisModel.setAssembledView();
        if (selectPartIsolate) selectPartIsolate.value = 'all';
        updateViewButtons('assembled');
        if (partInspectHint) {
          partInspectHint.innerHTML = '💡 <em>Camera reset. Select any separate part above or click in 3D to zoom in.</em>';
        }
      });
    }

    if (btn3dDispense) {
      btn3dDispense.addEventListener('click', () => {
        if (chassisModel) chassisModel.triggerDispenseVisual(2.5);
        if (audio) audio.playDispensePour(2.5);
        fetch('/api/analytics/dispense', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 0.25 })
        }).catch(() => {});
      });
    }

  } catch (err) {
    console.error('Failed to initialize Three.js 3D pipeline:', err);
  }

  // Backdrop modal dismiss
  const componentModal = document.getElementById('component-inspector-modal');
  if (componentModal) {
    componentModal.addEventListener('click', (e) => {
      if (e.target === componentModal) {
        componentModal.style.display = 'none';
      }
    });
  }

  // 2. Start 60 FPS Three.js Render Loop
  function animate() {
    requestAnimationFrame(animate);

    if (sceneManager && sceneManager.renderer && sceneManager.scene && sceneManager.camera) {
      const delta = sceneManager.clock.getDelta();
      sceneManager.updateExplodeInterpolation(delta);

      if (sceneManager.controls) {
        sceneManager.controls.update();
      }

      if (chassisModel) {
        chassisModel.update(delta, sim ? sim.getState() : null);
      }

      sceneManager.renderer.render(sceneManager.scene, sceneManager.camera);
    }
  }
  animate();

  // 3. 3D Viewport Controls (Engineering Lab Portal)
  const btnViewDefault = document.getElementById('btn-view-default');
  const btnViewCutaway = document.getElementById('btn-view-cutaway');
  const btnViewXray = document.getElementById('btn-view-xray');
  const btnViewExplode = document.getElementById('btn-view-explode');
  const btnResetCam = document.getElementById('btn-reset-cam');

  const hudBtns = [btnViewDefault, btnViewCutaway, btnViewXray, btnViewExplode];
  function setHudBtnActive(activeBtn) {
    hudBtns.forEach(b => { if (b) b.classList.remove('active'); });
    if (activeBtn) activeBtn.classList.add('active');
  }

  if (btnViewDefault) {
    btnViewDefault.addEventListener('click', () => {
      if (sceneManager) sceneManager.setViewMode('DEFAULT');
      if (chassisModel) chassisModel.setExplodedView(false);
      setHudBtnActive(btnViewDefault);
      if (audio) audio.playSolenoidClick(true);
    });
  }
  if (btnViewCutaway) {
    btnViewCutaway.addEventListener('click', () => {
      if (sceneManager) sceneManager.setViewMode('CUTAWAY');
      if (chassisModel) chassisModel.setXRayMode(true);
      setHudBtnActive(btnViewCutaway);
      if (audio) audio.playSolenoidClick(true);
    });
  }
  if (btnViewXray) {
    btnViewXray.addEventListener('click', () => {
      if (chassisModel) {
        chassisModel.setExplodedView(false);
        chassisModel.setXRayMode(true);
      }
      setHudBtnActive(btnViewXray);
      if (audio) audio.playSolenoidClick(true);
    });
  }
  if (btnViewExplode) {
    btnViewExplode.addEventListener('click', () => {
      if (sceneManager) sceneManager.setViewMode('EXPLODED');
      if (chassisModel) chassisModel.setExplodedView(true);
      setHudBtnActive(btnViewExplode);
      if (audio) audio.playSolenoidClick(true);
    });
  }
  if (btnResetCam) {
    btnResetCam.addEventListener('click', () => {
      if (sceneManager) sceneManager.resetCamera();
      if (chassisModel) chassisModel.setExplodedView(false);
      setHudBtnActive(btnViewDefault);
    });
  }

  // Initial Render of MCSA Canvas Spectrum
  if (mcsa) {
    mcsa.renderCanvas('canvas-mcsa-spectrum');
  }

  // 4. Portal Navigation Tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  const portalPages = document.querySelectorAll('.portal-page');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const portalId = tab.getAttribute('data-portal');
      
      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      portalPages.forEach(p => p.classList.remove('active-page'));
      const targetPage = document.getElementById(portalId);
      if (targetPage) targetPage.classList.add('active-page');

      // Portal 2 map initialization & forecast table
      if (portalId === 'portal-grid') {
        grid.initMap('hydra-map-canvas');
        if (grid.map) {
          setTimeout(() => grid.map.invalidateSize(), 200);
        }
        forecast.renderForecastTable('forecast-table-body');
      }

      // Portal 3 Energy Nexus canvas
      if (portalId === 'portal-hydration') {
        if (energy) energy.renderCanvas('chart-energy-nexus');
      }

      // Portal 4 fleet tables & PINN resistance chart
      if (portalId === 'portal-fleet') {
        fleet.renderSkuTable('sku-table-body');
        fleet.renderRwaTable('rwa-table-body');
        if (pinn) pinn.renderCanvas('chart-pinn-resistance');
      }
    });
  });

  // 5. Scenario & Fault Injector Bench
  const scenarioActions = {
    'btn-scen-nominal': 'MUNICIPAL_NORMAL',
    'btn-scen-rupture': 'PIPE_BURST',
    'btn-scen-tanker': 'HARD_TANKER',
    'btn-scen-fouling': 'SCALING_BIOFILM',
    'btn-scen-leak': 'NIGHT_LEAK',
    'btn-scen-outage': 'CRISIS_MODE'
  };

  const scenBtns = document.querySelectorAll('.btn-scenario');
  Object.entries(scenarioActions).forEach(([btnId, scenarioName]) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', () => {
        scenBtns.forEach(b => {
          b.classList.remove('active');
          b.classList.remove('active-hazard');
        });

        if (scenarioName === 'PIPE_BURST') {
          btn.classList.add('active-hazard');
          if (audio) audio.playHazardAlarm();
          if (gnn && grid.map) {
            gnn.highlightRuptureLocation(grid.map);
          }
        } else {
          btn.classList.add('active');
          if (audio) audio.playSolenoidClick(true);
        }

        sim.injectScenario(scenarioName);
      });
    }
  });

  // 6. Manual Sensor Tuning Sliders
  const sliderTDS = document.getElementById('slider-inlet-tds');
  const sliderTurb = document.getElementById('slider-turbidity');
  const sliderValTDS = document.getElementById('slider-val-tds');
  const sliderValTurb = document.getElementById('slider-val-turb');

  if (sliderTDS) {
    sliderTDS.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      if (sliderValTDS) sliderValTDS.textContent = `${val} ppm`;
      sim.setManualSensor('inletTDS', val);
    });
  }

  if (sliderTurb) {
    sliderTurb.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      if (sliderValTurb) sliderValTurb.textContent = `${val.toFixed(2)} NTU`;
      sim.setManualSensor('turbidity', val);
      if (val > 1.2 && audio) {
        audio.playHazardAlarm();
      }
    });
  }

  // 7. Dispense Action Button
  const btnDispense = document.getElementById('btn-dispense-glass');
  if (btnDispense) {
    btnDispense.addEventListener('click', () => {
      const res = sim.dispenseWater();
      if (res.success) {
        if (chassisModel) chassisModel.triggerDispenseVisual(2);
        if (audio) audio.playDispensePour(2.0);

        btnDispense.disabled = true;
        btnDispense.textContent = `Dispensing (${res.tds} ppm)...`;
        setTimeout(() => {
          btnDispense.disabled = false;
          btnDispense.textContent = 'Dispense Aliquot (250 ml)';
        }, 2000);
      }
    });
  }

  // 8. Reactive Telemetry & State Binding (Including SUVA & MCSA)
  const headerStatusIndicator = document.getElementById('header-status-indicator');
  const headerStatusText = document.getElementById('header-status-text');
  const headerSafetyScore = document.getElementById('header-safety-score');
  const hudOperationalMode = document.getElementById('hud-operational-mode');
  const interlockStatusLabel = document.getElementById('interlock-status-label');

  const valInletTDS = document.getElementById('val-inlet-tds');
  const valOutletTDS = document.getElementById('val-outlet-tds');
  const valTurbidity = document.getElementById('val-turbidity');
  const valPH = document.getElementById('val-ph');
  const valORP = document.getElementById('val-orp');
  const valFlow = document.getElementById('val-flow');

  const cardTurbidity = document.getElementById('card-turbidity');
  const cardOutletTDS = document.getElementById('card-outlet-tds');

  const dnaClassificationLabel = document.getElementById('dna-classification-label');
  const dnaClassificationDesc = document.getElementById('dna-classification-desc');
  const dnaConfidencePill = document.getElementById('dna-confidence-pill');

  const actuatorBldcVal = document.getElementById('actuator-bldc-val');
  const actuatorDiverterVal = document.getElementById('actuator-diverter-val');
  const actuatorUvVal = document.getElementById('actuator-uv-val');

  // SUVA elements
  const valSuva = document.getElementById('val-suva');
  const suvaThmLabel = document.getElementById('suva-thm-label');
  const cardSuva = document.getElementById('card-suva');

  // Secondary Tank & ESG
  const hydReuseTankVol = document.getElementById('hyd-reuse-tank-vol');
  const hydReuseTankFill = document.getElementById('hyd-reuse-tank-fill');
  const hydEsgWater = document.getElementById('hyd-esg-water');

  let wasInterlocked = false;

  sim.subscribe((state) => {
    if (headerSafetyScore) headerSafetyScore.textContent = state.waterScore;

    // Safety Interlock Handling
    if (!state.actuators.solenoidInterlock) {
      if (headerStatusIndicator) {
        headerStatusIndicator.className = 'telemetry-indicator active-hazard';
        headerStatusText.textContent = 'INTERLOCK CLAMPED (HAZARD SHUTDOWN)';
      }
      if (interlockStatusLabel) {
        interlockStatusLabel.textContent = `LOCKED: ${state.interlockReason}`;
        interlockStatusLabel.style.color = 'var(--status-hazard)';
      }
      if (btnDispense) {
        btnDispense.disabled = true;
        btnDispense.className = 'btn-dispense locked';
        btnDispense.textContent = 'Safety Interlock Clamped';
      }
      if (!wasInterlocked && audio) {
        audio.playSolenoidClick(false);
      }
      wasInterlocked = true;
    } else {
      if (headerStatusIndicator) {
        headerStatusIndicator.className = 'telemetry-indicator active-safe';
        headerStatusText.textContent = 'TAP SAFE & DISPENSING';
      }
      if (interlockStatusLabel) {
        interlockStatusLabel.textContent = 'UNLOCKED (RESPONSE LATENCY < 400 MS)';
        interlockStatusLabel.style.color = 'var(--status-safe)';
      }
      if (btnDispense) {
        btnDispense.disabled = false;
        btnDispense.className = 'btn-dispense';
        btnDispense.textContent = 'Dispense Aliquot (250 ml)';
      }
      wasInterlocked = false;
    }

    // Operational Mode Badge
    if (hudOperationalMode) {
      if (state.currentMode === 'MUNICIPAL_ECO') {
        hudOperationalMode.textContent = 'MUNICIPAL ECO BYPASS (RO INACTIVE • 0% WASTE)';
        hudOperationalMode.style.color = 'var(--status-hydro)';
      } else if (state.currentMode === 'BOREWELL_RO') {
        hudOperationalMode.textContent = 'HIGH SALINITY TANKER (FULL RO ACTIVE)';
        hudOperationalMode.style.color = 'var(--atmb-yellow-dark)';
      } else {
        hudOperationalMode.textContent = 'CRISIS MODE (MULTI-PASS DISINFECTION)';
        hudOperationalMode.style.color = 'var(--status-hazard)';
      }
    }

    // Gauges
    if (valInletTDS) valInletTDS.textContent = state.sensors.inletTDS;
    if (valOutletTDS) valOutletTDS.textContent = state.sensors.outletTDS;
    if (valTurbidity) valTurbidity.textContent = state.sensors.turbidity.toFixed(2);
    if (valPH) valPH.textContent = state.sensors.ph.toFixed(1);
    if (valORP) valORP.textContent = state.sensors.orp;
    if (valFlow) valFlow.textContent = state.sensors.flowRate.toFixed(1);

    if (cardTurbidity) {
      cardTurbidity.className = state.sensors.turbidity > 1.2 ? 'gauge-card hazard' : 'gauge-card safe';
    }
    if (cardOutletTDS) {
      cardOutletTDS.className = state.sensors.outletTDS > 200 ? 'gauge-card warn' : 'gauge-card safe';
    }

    // INNOVATION 6: Evaluate Optical SUVA Spectral Dosing
    if (suva) {
      const suvaResult = suva.evaluate(state.sensors.turbidity, state.sensors.inletTDS);
      if (valSuva) valSuva.textContent = suvaResult.suva.toFixed(2);
      if (suvaThmLabel) {
        suvaThmLabel.textContent = `THM Risk: ${suvaResult.thmRisk} (${suvaResult.doc} mg/L DOC)`;
      }
      if (cardSuva) {
        cardSuva.className = suvaResult.thmRisk === 'CRITICAL' ? 'gauge-card hazard' : (suvaResult.thmRisk === 'ELEVATED' ? 'gauge-card warn' : 'gauge-card safe');
      }
      if (actuatorUvVal) {
        actuatorUvVal.textContent = `${suvaResult.uvDose.toFixed(1)} mJ/cm² (${suvaResult.thmRisk} Dosing)`;
      }
    }

    // Water DNA
    if (dnaClassificationLabel) dnaClassificationLabel.textContent = state.waterDNA.label;
    if (dnaClassificationDesc) dnaClassificationDesc.textContent = state.waterDNA.characteristics;
    if (dnaConfidencePill) dnaConfidencePill.textContent = `${state.waterDNA.confidence}% CONFIDENCE`;

    // Actuators
    if (actuatorBldcVal) {
      actuatorBldcVal.textContent = `${state.sensors.pumpRpm} RPM (${state.sensors.pumpWatts} Watts)`;
    }
    if (actuatorDiverterVal) {
      actuatorDiverterVal.textContent = state.actuators.solenoidDiverter ? 'OPEN (Routing to RO)' : 'CLOSED (UF Bypass Engaged)';
    }

    // Secondary Tank & ESG
    if (hydReuseTankVol) hydReuseTankVol.textContent = `${state.waterTwin.reuseTankCurrent.toFixed(1)} / 6.0 L`;
    if (hydReuseTankFill) hydReuseTankFill.style.width = `${(state.waterTwin.reuseTankCurrent / 6.0) * 100}%`;
    if (hydEsgWater) hydEsgWater.textContent = `${state.waterTwin.waterSavedLitres.toFixed(1)} L`;
  });

  // 9. Innovation 1: MCSA Mode Toggles
  const mcsaBtns = document.querySelectorAll('.btn-mcsa-mode');
  const mcsaCurrentRMS = document.getElementById('mcsa-current-rms');
  const mcsaCavitationIdx = document.getElementById('mcsa-cavitation-idx');

  mcsaBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      mcsaBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const mode = btn.getAttribute('data-mode');
      if (mcsa) {
        mcsa.setMode(mode);
        mcsa.renderCanvas('canvas-mcsa-spectrum');
        if (mcsaCurrentRMS) mcsaCurrentRMS.textContent = `${mcsa.statorCurrentRMS} A`;
        if (mcsaCavitationIdx) {
          mcsaCavitationIdx.textContent = `${mcsa.virtualCavitationIndex} (${mode === 'CAVITATION' ? 'Severe Cavitation Risk' : (mode === 'AIRLOCK' ? 'Air-Lock Hunting' : 'Normal')})`;
          mcsaCavitationIdx.style.color = mode === 'CAVITATION' ? '#DC2626' : (mode === 'AIRLOCK' ? '#D97706' : '#059669');
        }
      }
    });
  });

  // 10. Innovation 3: GNN Pipeline Map Toggle
  const btnToggleGnn = document.getElementById('btn-toggle-gnn-pipeline');
  if (btnToggleGnn) {
    btnToggleGnn.addEventListener('click', () => {
      if (gnn && grid.map) {
        const isActive = gnn.togglePipelineLayer(grid.map);
        btnToggleGnn.style.background = isActive ? '#0284C7' : '#0F172A';
        btnToggleGnn.textContent = isActive ? 'GNN Pipeline Active (Click to Hide)' : 'Innovation 3: Toggle GNN Pipeline Map';
      }
    });
  }

  // 11. Innovation 4: zk-SNARK Proof Generator
  const btnGenZKP = document.getElementById('btn-generate-zkp');
  const zkpHashDisplay = document.getElementById('zkp-hash-display');
  const zkpCommitDisplay = document.getElementById('zkp-commit-display');

  if (btnGenZKP) {
    btnGenZKP.addEventListener('click', () => {
      if (zkp) {
        const proof = zkp.generateZkProof(true, 18.5);
        if (zkpHashDisplay) zkpHashDisplay.textContent = proof.proofHash;
        if (zkpCommitDisplay) zkpCommitDisplay.textContent = proof.commitmentRoot;
        alert(`zk-SNARK Validity Proof Generated!\n\nProof Hash: ${proof.proofHash}\nVerification Key: ${proof.verificationKey}\nGuarantee: ${proof.privacyGuarantee}`);
      }
    });
  }

  // 12. Innovation 5: Energy Nexus Mode Toggles
  const energyBtns = document.querySelectorAll('.btn-energy-mode');
  const energyCostDisplay = document.getElementById('energy-cost-display');
  const energyShareDisplay = document.getElementById('energy-share-display');

  energyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      energyBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const mode = btn.getAttribute('data-mode');
      if (energy) {
        const costData = energy.setMode(mode);
        energy.renderCanvas('chart-energy-nexus');
        if (energyCostDisplay) energyCostDisplay.textContent = `₹${costData.monthlyCostINR} / month`;
        if (energyShareDisplay) energyShareDisplay.textContent = `${costData.solarSharePct}% Solar-Powered`;
      }
    });
  });

  // 13. Hydration Demographic Profiles Selector & Custom Form
  const profileBtns = document.querySelectorAll('[data-profile]');
  const profileDetailName = document.getElementById('profile-detail-name');
  const profileDetailPurpose = document.getElementById('profile-detail-purpose');
  const profileDetailTDS = document.getElementById('profile-detail-tds');
  const profileDetailCa = document.getElementById('profile-detail-ca');
  const profileDetailMg = document.getElementById('profile-detail-mg');

  profileBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      profileBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const pKey = btn.getAttribute('data-profile');
      const pData = hydration.setProfile(pKey);

      if (profileDetailName) profileDetailName.textContent = pData.name;
      if (profileDetailPurpose) profileDetailPurpose.textContent = pData.purpose;
      if (profileDetailTDS) profileDetailTDS.textContent = `${pData.targetTDS} ppm`;
      if (profileDetailCa) profileDetailCa.textContent = `${pData.calciumMgL} mg/L`;
      if (profileDetailMg) profileDetailMg.textContent = `${pData.magnesiumMgL} mg/L`;

      sim.setProfile(pKey === 'STANDARD' ? 'LAKSHMI' : (pKey === 'SENIOR' ? 'DADI' : (pKey === 'ATHLETE' ? 'AARAV' : 'ANANYA')));
    });
  });

  const formCustomProfile = document.getElementById('form-custom-profile');
  if (formCustomProfile) {
    formCustomProfile.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('cust-prof-name').value;
      const tds = document.getElementById('cust-prof-tds').value;
      const ca = document.getElementById('cust-prof-ca').value;
      const mg = document.getElementById('cust-prof-mg').value;

      const pData = hydration.addCustomProfile(name, tds, ca, mg);
      if (profileDetailName) profileDetailName.textContent = pData.name;
      if (profileDetailPurpose) profileDetailPurpose.textContent = pData.purpose;
      if (profileDetailTDS) profileDetailTDS.textContent = `${pData.targetTDS} ppm`;
      if (profileDetailCa) profileDetailCa.textContent = `${pData.calciumMgL} mg/L`;
      if (profileDetailMg) profileDetailMg.textContent = `${pData.magnesiumMgL} mg/L`;

      alert(`Custom profile '${name}' calibrated and activated.`);
    });
  }

  // Zero-Reject Utility Distribution Actions
  document.querySelectorAll('.btn-utilize-reject').forEach(btn => {
    btn.addEventListener('click', () => {
      const purpose = btn.getAttribute('data-purpose');
      const vol = Number(btn.getAttribute('data-vol'));
      const res = hydration.utilizeRejectWater(purpose, vol);
      if (res.success) {
        alert(`Dispatched ${res.dispensedL}L of reject water for ${res.purpose}. Remaining utility buffer: ${res.remainingL}L.`);
      } else {
        alert(res.reason);
      }
    });
  });

  // 14. Manual Reverse-Flush Cycle Button (Portal 4) & PINN Flush Reset
  const btnManualFlush = document.getElementById('btn-manual-reverse-flush');
  if (btnManualFlush) {
    btnManualFlush.addEventListener('click', () => {
      sim.triggerSelfHealing();
      if (audio) audio.playFlushWhoosh(3.0);
      if (pinn) {
        pinn.triggerFlushReset();
        pinn.renderCanvas('chart-pinn-resistance');
      }
      btnManualFlush.disabled = true;
      btnManualFlush.textContent = 'Reverse-Flush Active (15s)...';
      setTimeout(() => {
        btnManualFlush.disabled = false;
        btnManualFlush.textContent = 'Trigger Reverse-Flush Cycle';
        fleet.renderSkuTable('sku-table-body');
      }, 15000);
    });
  }

  // 15. Generate Field Service Work-Order Modal (Portal 4)
  const btnGenWO = document.getElementById('btn-generate-work-order');
  const woModal = document.getElementById('work-order-modal');
  const woContent = document.getElementById('wo-ticket-content');
  const btnCloseWO = document.getElementById('btn-close-wo');

  if (btnGenWO && woModal && woContent) {
    btnGenWO.addEventListener('click', () => {
      const ticket = fleet.generateWorkOrder();
      woContent.innerHTML = `
        <div style="background:#F8FAFC; padding:12px; border-radius:4px; margin-bottom:12px; border:1px solid #E2E8F0;">
          <div>Work-Order ID: <strong style="font-family:var(--font-mono); color:#0F172A;">${ticket.workOrderNumber}</strong></div>
          <div>Date Generated: <strong>${ticket.issuedDate}</strong></div>
          <div>Location: <strong>${ticket.customerName}</strong></div>
        </div>
        <div style="margin-bottom:10px;">
          <div>Assigned Technician: <strong>${ticket.assignedEngineer}</strong></div>
          <div>Scheduled Window: <strong style="color:#059669;">${ticket.dispatchWindow}</strong></div>
          <div>Required Part SKU: <strong style="font-family:var(--font-mono);">${ticket.partSku} (${ticket.partDescription})</strong></div>
          <div>Circular Return Barcode: <strong style="font-family:var(--font-mono); color:#64748B;">${ticket.recyclingBarcode}</strong></div>
        </div>
        <div style="font-size:0.75rem; color:#64748B; margin-top:8px;">
          Automated SLA Dispatch triggered via predictive membrane permeability curve threshold. Cartridge take-back scheduled upon completion.
        </div>
      `;
      woModal.style.display = 'block';
    });
  }

  if (btnCloseWO && woModal) {
    btnCloseWO.addEventListener('click', () => {
      woModal.style.display = 'none';
    });
  }

  // 16. Jal Mitra Technical Console Form, Audio & Speech Input
  const consoleForm = document.getElementById('console-form');
  const consoleInput = document.getElementById('console-input');
  const consoleFeed = document.getElementById('console-feed');
  const consoleLangSelect = document.getElementById('console-lang-select');
  const btnMicInput = document.getElementById('btn-mic-input');

  if (consoleLangSelect) {
    consoleLangSelect.addEventListener('change', (e) => {
      consoleModule.setLanguage(e.target.value);
    });
  }

  if (btnMicInput) {
    btnMicInput.addEventListener('click', () => {
      consoleModule.toggleVoiceRecognition();
    });
  }

  function appendConsoleMsg(type, text) {
    if (!consoleFeed) return;
    const msg = document.createElement('div');
    msg.className = `console-msg ${type}`;
    msg.textContent = text;
    consoleFeed.appendChild(msg);
    consoleFeed.scrollTop = consoleFeed.scrollHeight;
  }

  function executeQuery(qText) {
    if (!qText) return;
    appendConsoleMsg('query', qText);
    setTimeout(() => {
      const response = consoleModule.processDiagnosticQuery(qText, sim.getState());
      appendConsoleMsg('system', response);
      consoleModule.speakResponse(response);
    }, 250);
  }

  if (consoleForm) {
    consoleForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = consoleInput.value.trim();
      if (!q) return;
      consoleInput.value = '';
      executeQuery(q);
    });
  }

  document.querySelectorAll('.quick-query-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-query');
      executeQuery(q);
    });
  });
});
