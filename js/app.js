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

    // 3D Component Inspector Raycasting Callback
    sceneManager.setComponentClickListener((partData) => {
      const modal = document.getElementById('component-inspector-modal');
      const content = document.getElementById('inspector-content');
      if (modal && content) {
        content.innerHTML = `
          <div style="font-size:0.92rem; font-weight:800; color:#0F172A; margin-bottom:6px;">
            ${partData.name}
          </div>
          <div style="font-family:var(--font-mono); font-size:0.75rem; color:#0284C7; font-weight:700; margin-bottom:10px;">
            SKU: ${partData.sku}
          </div>
          <div style="font-size:0.78rem; color:#334155; line-height:1.5; margin-bottom:12px;">
            ${partData.function}
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.75rem; background:#F8FAFC; padding:10px; border-radius:4px; margin-bottom:12px;">
            <div>Pore / Spec: <strong style="color:#0F172A;">${partData.poreSize || partData.wavelength || partData.capacity || 'N/A'}</strong></div>
            <div>Rated Pressure: <strong style="color:#0F172A;">${partData.ratedPressure || partData.ratedSpeed || partData.responseTime || 'Compliant'}</strong></div>
            <div>Health Index: <strong style="color:#059669;">${partData.health}%</strong></div>
            <div>Material: <strong style="color:#0F172A;">${partData.material ? partData.material.split(' ')[0] : 'Polymer'}</strong></div>
          </div>
          <button onclick="document.getElementById('component-inspector-modal').style.display='none'" style="width:100%; background:#0F172A; color:#FFF; font-weight:700; font-size:0.75rem; padding:8px; border:none; border-radius:4px; cursor:pointer;">
            Close Inspector
          </button>
        `;
        modal.style.display = 'block';
        if (audio) audio.playSolenoidClick(true);
      }
    });

  } catch (err) {
    console.error('Failed to initialize Three.js 3D pipeline:', err);
  }

  // Close Component Inspector Modal
  const btnCloseInspector = document.getElementById('btn-close-inspector');
  if (btnCloseInspector) {
    btnCloseInspector.addEventListener('click', () => {
      const modal = document.getElementById('component-inspector-modal');
      if (modal) modal.style.display = 'none';
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
        chassisModel.update(delta, sim.getState());
      }

      sceneManager.renderer.render(sceneManager.scene, sceneManager.camera);
    }
  }
  animate();

  // 3. 3D Viewport Controls
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
      setHudBtnActive(btnViewExplode);
      if (audio) audio.playSolenoidClick(true);
    });
  }
  if (btnResetCam) {
    btnResetCam.addEventListener('click', () => {
      if (sceneManager) sceneManager.resetCamera();
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
