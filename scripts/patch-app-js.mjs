import fs from 'fs';
import path from 'path';

const appJsPath = path.join(process.cwd(), 'js', 'app.js');
let content = fs.readFileSync(appJsPath, 'utf8');

// Target to replace starts from "// 3D Component Inspector Raycasting Callback" to "// Initial Render of MCSA Canvas Spectrum"
const startIndex = content.indexOf('    // 3D Component Inspector Raycasting Callback');
const endIndex = content.indexOf('  // Initial Render of MCSA Canvas Spectrum');

if (startIndex === -1 || endIndex === -1) {
  console.error('Indices not found!', { startIndex, endIndex });
  process.exit(1);
}

const replacement = `    window.sceneManager = sceneManager;
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

      openModalWithContent(\`
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
              <span style="font-size:1.6rem; font-weight:900; font-family:var(--font-mono); color:var(--amber-warn);">\${inTDS}</span>
              <span style="font-size:0.75rem; color:var(--white-muted);">ppm</span>
            </div>
            <div style="font-size:0.7rem; color:var(--white-muted); margin-top:4px;">Inlet sensor conductivity</div>
          </div>

          <div style="background:rgba(0,229,255,0.08); border:1px solid rgba(0,229,255,0.3); border-radius:8px; padding:12px;">
            <div style="font-size:0.68rem; font-weight:800; text-transform:uppercase; color:var(--cyan-bright); letter-spacing:0.5px;">Purified Water TDS</div>
            <div style="display:flex; align-items:baseline; gap:4px; margin-top:4px;">
              <span style="font-size:1.6rem; font-weight:900; font-family:var(--font-mono); color:var(--cyan-bright);">\${outTDS}</span>
              <span style="font-size:0.75rem; color:var(--white-muted);">ppm</span>
            </div>
            <div style="font-size:0.7rem; color:var(--emerald-safe); margin-top:4px;">Optimal potable mineral balance</div>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:12px; margin-bottom:14px; font-size:0.75rem; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div>Salt Rejection Efficiency: <strong style="color:var(--emerald-safe); font-family:var(--font-mono);">\${rejection}%</strong></div>
          <div>Water Quality Score: <strong style="color:var(--emerald-safe);">EXCELLENT (96%)</strong></div>
          <div>Operating Mode: <strong style="color:var(--cyan-bright);">\${isRO ? 'Full Reverse Osmosis (RO)' : 'Municipal Eco Bypass'}</strong></div>
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
      \`);

      const btnQuality = document.getElementById('modal-btn-view-quality');
      if (btnQuality) {
        btnQuality.addEventListener('click', () => {
          document.getElementById('component-inspector-modal').style.display = 'none';
          document.querySelector('[data-target-page="quality"]')?.click();
        });
      }
    }

    function showFilterModal() {
      openModalWithContent(\`
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
      \`);

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

      openModalWithContent(\`
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
            <div style="font-size:1.4rem; font-weight:900; font-family:var(--font-mono); color:\${isSafe ? 'var(--emerald-safe)' : 'var(--rose-danger)'}; margin-top:4px;">
              \${isSafe ? 'ACTIVE (OPEN)' : 'LOCKED (HAZARD)'}
            </div>
            <div style="font-size:0.7rem; color:var(--white-muted); margin-top:2px;">Zero backflow risk</div>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:12px; margin-bottom:16px; font-size:0.75rem; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div>Purification Mode: <strong style="color:var(--cyan-bright);">\${isRO ? 'Reverse Osmosis Active' : 'Eco Bypass Active'}</strong></div>
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
      \`);

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
      openModalWithContent(\`
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px; margin-bottom:12px;">
          <span style="font-size:0.85rem; font-weight:800; text-transform:uppercase; color:var(--white-pure);">Component Diagnostics</span>
          <button onclick="document.getElementById('component-inspector-modal').style.display='none'" style="background:none; border:none; font-weight:800; cursor:pointer; color:var(--white-muted); font-size:1.2rem;">✕</button>
        </div>
        <div style="font-size:0.95rem; font-weight:800; color:var(--white-pure); margin-bottom:4px;">
          \${partData.name || 'HydroOS Core Component'}
        </div>
        <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--cyan-bright); font-weight:700; margin-bottom:10px;">
          SKU: \${partData.sku || 'ATMB-RO-GENERIC'}
        </div>
        <div style="font-size:0.78rem; color:var(--white-dim); line-height:1.5; margin-bottom:14px;">
          \${partData.function || partData.info || 'Essential cyber-physical filtration component.'}
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.75rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:10px; border-radius:6px; margin-bottom:14px;">
          <div>Pore / Spec: <strong style="color:var(--white-pure);">\${partData.poreSize || partData.wavelength || partData.capacity || 'Calibrated'}</strong></div>
          <div>Rated Pressure: <strong style="color:var(--white-pure);">\${partData.ratedPressure || partData.ratedSpeed || 'Compliant'}</strong></div>
          <div>Health Index: <strong style="color:var(--emerald-safe);">\${partData.health || 95}%</strong></div>
          <div>Material: <strong style="color:var(--white-pure);">\${partData.material ? partData.material.split(' ')[0] : 'Polymer'}</strong></div>
        </div>
        <button onclick="document.getElementById('component-inspector-modal').style.display='none'" class="btn-primary" style="width:100%; font-weight:700; font-size:0.75rem; padding:8px;">
          Close Inspector
        </button>
      \`);
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
    const btnDashViewExplode = document.getElementById('btn-dash-view-explode');
    const btnDashAutorotate = document.getElementById('btn-dash-autorotate');
    const btnDashResetCam = document.getElementById('btn-dash-resetcam');
    const btn3dDispense = document.getElementById('btn-3d-dispense');

    if (btnDashViewAssembled) {
      btnDashViewAssembled.addEventListener('click', () => {
        chassisModel.setExplodedView(false);
        sceneManager.setViewMode('DEFAULT');
        btnDashViewAssembled.classList.remove('btn-outline');
        btnDashViewAssembled.classList.add('btn-primary');
        if (btnDashViewExplode) {
          btnDashViewExplode.classList.remove('btn-primary');
          btnDashViewExplode.classList.add('btn-outline');
        }
        if (audio) audio.playSolenoidClick(true);
      });
    }

    if (btnDashViewExplode) {
      btnDashViewExplode.addEventListener('click', () => {
        chassisModel.setExplodedView(true);
        sceneManager.setViewMode('EXPLODED');
        btnDashViewExplode.classList.remove('btn-outline');
        btnDashViewExplode.classList.add('btn-primary');
        if (btnDashViewAssembled) {
          btnDashViewAssembled.classList.remove('btn-primary');
          btnDashViewAssembled.classList.add('btn-outline');
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
        if (chassisModel) chassisModel.setExplodedView(false);
        if (btnDashViewAssembled) {
          btnDashViewAssembled.classList.remove('btn-outline');
          btnDashViewAssembled.classList.add('btn-primary');
        }
        if (btnDashViewExplode) {
          btnDashViewExplode.classList.remove('btn-primary');
          btnDashViewExplode.classList.add('btn-outline');
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
  const btnViewExplode = document.getElementById('btn-view-explode');
  const btnResetCam = document.getElementById('btn-reset-cam');

  const hudBtns = [btnViewDefault, btnViewCutaway, btnViewExplode];
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
      setHudBtnActive(btnViewCutaway);
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

`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(appJsPath, newContent, 'utf8');
console.log('Successfully patched js/app.js!');

