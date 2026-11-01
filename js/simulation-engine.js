/**
 * HydraOS Simulation Engine
 * Models the cyber-physical state of the Atomberg Water Purifier 2.0
 */

class HydraOSSimulationEngine {
  constructor() {
    // Physical Sensors (Live Readings)
    this.sensors = {
      inletTDS: 110,         // ppm
      outletTDS: 85,          // ppm
      turbidity: 0.35,        // NTU (optical)
      ph: 7.4,               // pH
      orp: 420,              // mV (Active chlorine / disinfection potential)
      temp: 27.5,            // Celsius
      flowRate: 1.8,         // Litres/min
      pumpRpm: 0,            // BLDC Pump RPM
      pumpWatts: 0           // BLDC Power consumption
    };

    // Hardware Actuator States
    this.actuators = {
      solenoidDiverter: false,    // false = Bypass RO (Eco), true = Engage RO
      solenoidInterlock: true,    // true = UNLOCKED (Safe), false = LOCKED (Hazard)
      solenoidFlush: false,       // true = Auto-Flush active
      uvLamp: true,               // true = UV-C LED Active
      bldcPump: false             // true = Pump Running
    };

    // Operational Modes: 'MUNICIPAL_ECO', 'BOREWELL_RO', 'CRISIS_MODE', 'SELF_HEALING'
    this.currentMode = 'MUNICIPAL_ECO';
    this.interlockReason = '';
    
    // Water DNA Classification
    this.waterDNA = {
      label: 'Municipal Treated (Cauvery/DJB)',
      confidence: 97,
      isHazard: false,
      characteristics: 'Balanced TDS, low turbidity, optimal disinfection potential.'
    };

    // Home Water Twin (Tank & Hydraulics)
    this.waterTwin = {
      cleanTankCapacity: 8.0,      // Litres
      cleanTankCurrent: 7.2,       // Litres
      reuseTankCapacity: 6.0,      // Litres
      reuseTankCurrent: 3.4,       // Litres
      leakDetected: false,
      membraneHealth: 94,          // %
      waterSavedLitres: 142.5,     // Cumulative litres saved vs standard RO
      powerCutSurvivalHours: 9.6   // What-if estimate
    };

    // Active Profile (Lakshmi, Dadi, Aarav - Athlete, Baby Ananya)
    this.activeProfile = 'LAKSHMI';
    this.profiles = {
      LAKSHMI: { name: 'Lakshmi (General)', targetTDS: 85, ca: 30, mg: 15, na: 'Standard', desc: 'Balanced mineral hydration for general wellness.' },
      DADI: { name: 'Dadi (Elders)', targetTDS: 110, ca: 45, mg: 25, na: 'Low Sodium', desc: 'Enhanced calcium & magnesium for bone & cardiovascular support.' },
      AARAV: { name: 'Aarav (Athlete)', targetTDS: 140, ca: 35, mg: 40, na: 'Electrolyte+', desc: 'High magnesium and potassium for muscle recovery.' },
      ANANYA: { name: 'Baby Ananya (Infant)', targetTDS: 55, ca: 15, mg: 8, na: 'Ultra Low', desc: 'Ultra-low solute load tuned for infant kidneys & formula prep.' }
    };

    // State change callbacks
    this.listeners = [];
    this.isSelfHealing = false;
    this.healingTimer = 0;

    // Start background physics tick
    this.startPhysicsLoop();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.getState());
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach(cb => cb(state));
  }

  getState() {
    return {
      sensors: { ...this.sensors },
      actuators: { ...this.actuators },
      currentMode: this.currentMode,
      interlockReason: this.interlockReason,
      waterDNA: { ...this.waterDNA },
      waterTwin: { ...this.waterTwin },
      activeProfile: this.profiles[this.activeProfile],
      isSelfHealing: this.isSelfHealing,
      healingProgress: this.isSelfHealing ? Math.round((1 - this.healingTimer / 15) * 100) : 100,
      waterScore: this.calculateWaterScore()
    };
  }

  // Physics & Adaptive Decision Loop (runs every 1 sec)
  startPhysicsLoop() {
    setInterval(() => {
      this.tickPhysics();
      this.evaluateAdaptiveBrain();
      this.evaluateSafetyInterlock();
      this.classifyWaterDNA();
      this.updateWaterTwin();
      this.notify();
    }, 1000);
  }

  tickPhysics() {
    // Add micro-noise to make sensor graphs look organic
    if (!this.isFrozen) {
      const noise = (Math.random() - 0.5) * 1.5;
      this.sensors.inletTDS = Math.max(10, Math.round(this.sensors.inletTDS + noise));
      this.sensors.turbidity = Math.max(0.1, Number((this.sensors.turbidity + (Math.random() - 0.5) * 0.04).toFixed(2)));
      this.sensors.orp = Math.max(100, Math.round(this.sensors.orp + (Math.random() - 0.5) * 3));
    }

    // Handle Self-Healing countdown if running
    if (this.isSelfHealing) {
      this.healingTimer--;
      this.actuators.solenoidFlush = true;
      if (this.healingTimer <= 0) {
        this.isSelfHealing = false;
        this.actuators.solenoidFlush = false;
        this.waterTwin.membraneHealth = Math.min(100, this.waterTwin.membraneHealth + 12);
        this.sensors.flowRate = 1.8;
      }
    }
  }

  // The Adaptive Brain (Atomberg 2.0 Core)
  evaluateAdaptiveBrain() {
    if (this.currentMode === 'CRISIS_MODE') {
      this.actuators.solenoidDiverter = true; // Full RO
      this.actuators.bldcPump = true;
      this.sensors.pumpRpm = 2200;
      this.sensors.pumpWatts = 48;
      this.sensors.outletTDS = Math.round(this.sensors.inletTDS * 0.12);
      return;
    }

    // Adaptive Bypass vs RO Decision Matrix
    if (this.sensors.inletTDS < 200 && this.sensors.turbidity < 1.0) {
      // Municipal Eco Bypass Mode: UF + UV only (Bypasses RO)
      this.currentMode = 'MUNICIPAL_ECO';
      this.actuators.solenoidDiverter = false; // Closed RO solenoid
      this.actuators.bldcPump = false;         // Zero pump energy
      this.sensors.pumpRpm = 0;
      this.sensors.pumpWatts = 4;              // Only UV + controller power
      this.sensors.outletTDS = Math.round(this.sensors.inletTDS * 0.85); // Preserves minerals
      this.waterTwin.waterSavedLitres += 0.03; // Accumulates water savings
    } else {
      // High TDS / Tanker / Borewell Mode: Engages RO + BLDC Pump
      this.currentMode = 'BOREWELL_RO';
      this.actuators.solenoidDiverter = true;
      this.actuators.bldcPump = true;
      this.sensors.pumpRpm = 1850;
      this.sensors.pumpWatts = 42;
      // RO reduces TDS down, then alkaliser tunes it according to profile
      const rawPostRO = this.sensors.inletTDS * 0.08;
      const targetTDS = this.profiles[this.activeProfile].targetTDS;
      this.sensors.outletTDS = Math.round(Math.max(rawPostRO + 30, targetTDS));
      
      // Zero-Reject Loop: Divert reject water into reuse tank
      if (this.waterTwin.reuseTankCurrent < this.waterTwin.reuseTankCapacity) {
        this.waterTwin.reuseTankCurrent = Math.min(this.waterTwin.reuseTankCapacity, Number((this.waterTwin.reuseTankCurrent + 0.02).toFixed(2)));
      }
    }
  }

  // The Safety Interlock Logic (Sub-second Lockout)
  evaluateSafetyInterlock() {
    let shouldLock = false;
    let reason = '';

    // Hazard Threshold 1: Mud / High Turbidity Breakthrough
    if (this.sensors.turbidity > 1.2) {
      shouldLock = true;
      reason = `High Turbidity Breakthrough (${this.sensors.turbidity} NTU > 1.0 safe limit). Suspended particulate / mud risk.`;
    }
    // Hazard Threshold 2: Microbial Risk (Low ORP + elevated turbidity)
    else if (this.sensors.orp < 220 && this.sensors.turbidity > 0.8) {
      shouldLock = true;
      reason = `Disinfection Potential Compromised (ORP ${this.sensors.orp} mV). Pathogen breakthrough risk.`;
    }
    // Hazard Threshold 3: Dangerous pH Shift
    else if (this.sensors.ph < 6.4 || this.sensors.ph > 8.8) {
      shouldLock = true;
      reason = `Abnormal pH detected (${this.sensors.ph}). Chemical pipe contamination risk.`;
    }
    // Hazard Threshold 4: Saline Shock
    else if (this.sensors.outletTDS > 300) {
      shouldLock = true;
      reason = `Unacceptable Solute Load (${this.sensors.outletTDS} ppm). RO membrane breach suspected.`;
    }

    if (shouldLock) {
      this.actuators.solenoidInterlock = false; // PHYSICAL LOCK
      this.interlockReason = reason;
      this.sensors.flowRate = 0;
    } else {
      this.actuators.solenoidInterlock = true; // UNLOCKED
      this.interlockReason = '';
      if (!this.actuators.bldcPump && this.currentMode === 'MUNICIPAL_ECO') {
        this.sensors.flowRate = 1.6;
      } else {
        this.sensors.flowRate = 1.9;
      }
    }
  }

  // Water DNA Fingerprint Classifier
  classifyWaterDNA() {
    const { inletTDS, turbidity, ph, orp } = this.sensors;

    if (turbidity > 10) {
      this.waterDNA = {
        label: 'Pipe Burst / Muddy Intrusion',
        confidence: 99,
        isHazard: true,
        characteristics: 'Extreme turbidity with organic matter. Typical of post-repair pipe fracture or monsoon sewage line cross-contamination.'
      };
    } else if (inletTDS > 600) {
      this.waterDNA = {
        label: 'Deep Borewell / Commercial Tanker',
        confidence: 94,
        isHazard: false,
        characteristics: 'High carbonate hardness, elevated calcium/magnesium salts. Full RO stage automatically engaged.'
      };
    } else if (ph < 6.5 && orp < 250) {
      this.waterDNA = {
        label: 'Acidic / Stagnant Runoff Risk',
        confidence: 91,
        isHazard: true,
        characteristics: 'Depleted chlorine, sub-normal pH indicating stagnant distribution pipe stagnation.'
      };
    } else if (inletTDS < 180 && turbidity < 0.6) {
      this.waterDNA = {
        label: 'Municipal Surface Supply (Cauvery / DJB)',
        confidence: 98,
        isHazard: false,
        characteristics: 'Treated municipal river water. Perfect for zero-reject Eco bypass mode.'
      };
    } else {
      this.waterDNA = {
        label: 'Mixed Intermediate Blend',
        confidence: 88,
        isHazard: false,
        characteristics: 'Blended overhead tank water. Monitored continuously.'
      };
    }
  }

  // Home Water Twin update (Tank levels, leak detection, power cut)
  updateWaterTwin() {
    // Calculate survival hours in 6-hour power cut
    // Assuming family average consumption is ~0.8 L/hour
    this.waterTwin.powerCutSurvivalHours = Number((this.waterTwin.cleanTankCurrent / 0.8).toFixed(1));

    // Simulate minor membrane wear over time
    if (this.sensors.inletTDS > 500 && Math.random() < 0.05) {
      this.waterTwin.membraneHealth = Math.max(40, this.waterTwin.membraneHealth - 0.1);
    }
  }

  // Daily Water Score (0 - 100)
  calculateWaterScore() {
    let score = 100;
    if (!this.actuators.solenoidInterlock) return 18; // Hazard locked
    if (this.sensors.turbidity > 0.5) score -= (this.sensors.turbidity * 15);
    if (this.sensors.outletTDS > 150) score -= ((this.sensors.outletTDS - 150) * 0.2);
    if (this.sensors.orp < 300) score -= 10;
    if (this.waterTwin.membraneHealth < 70) score -= 10;
    return Math.max(20, Math.min(100, Math.round(score)));
  }

  // User Action: Dispense a Glass of Water (250 ml)
  dispenseWater() {
    if (!this.actuators.solenoidInterlock) {
      return { success: false, reason: this.interlockReason };
    }
    if (this.waterTwin.cleanTankCurrent < 0.25) {
      return { success: false, reason: 'Clean tank empty! Purifying fresh reserve...' };
    }

    this.waterTwin.cleanTankCurrent = Number((this.waterTwin.cleanTankCurrent - 0.25).toFixed(2));
    this.notify();
    return { 
      success: true, 
      profile: this.profiles[this.activeProfile].name,
      tds: this.sensors.outletTDS, 
      minerals: `Ca: ${this.profiles[this.activeProfile].ca}mg, Mg: ${this.profiles[this.activeProfile].mg}mg` 
    };
  }

  // Trigger Self-Healing Flush Cycle
  triggerSelfHealing() {
    this.isSelfHealing = true;
    this.healingTimer = 15; // 15-second simulation cycle
    this.notify();
  }

  // Switch Hydration Profile
  setProfile(profileKey) {
    if (this.profiles[profileKey]) {
      this.activeProfile = profileKey;
      this.evaluateAdaptiveBrain();
      this.notify();
    }
  }

  // --- CHAOS & SCENARIO INJECTOR METHODS (For Live Demos) ---
  injectScenario(scenarioName) {
    switch (scenarioName) {
      case 'MUNICIPAL_NORMAL':
        this.currentMode = 'MUNICIPAL_ECO';
        this.sensors.inletTDS = 110;
        this.sensors.turbidity = 0.35;
        this.sensors.ph = 7.4;
        this.sensors.orp = 430;
        this.waterTwin.leakDetected = false;
        break;

      case 'PIPE_BURST':
        // Sudden muddy surge
        this.sensors.turbidity = 18.5; // High NTU
        this.sensors.inletTDS = 240;
        this.sensors.orp = 180;
        this.sensors.ph = 7.1;
        break;

      case 'HARD_TANKER':
        // Borewell / Tanker TDS swing
        this.sensors.inletTDS = 840;
        this.sensors.turbidity = 0.8;
        this.sensors.ph = 8.1;
        this.sensors.orp = 280;
        break;

      case 'SCALING_BIOFILM':
        // Membrane scaling
        this.waterTwin.membraneHealth = 48;
        this.sensors.flowRate = 0.9; // 50% flow drop
        this.sensors.turbidity = 0.6;
        break;

      case 'NIGHT_LEAK':
        // Micro-leak in pipes
        this.waterTwin.leakDetected = true;
        this.sensors.flowRate = 0.2;
        break;

      case 'CRISIS_MODE':
        // Flood / Boil water advisory
        this.currentMode = 'CRISIS_MODE';
        this.sensors.inletTDS = 350;
        this.sensors.turbidity = 4.5;
        this.sensors.orp = 220;
        break;
    }
    this.evaluateAdaptiveBrain();
    this.evaluateSafetyInterlock();
    this.classifyWaterDNA();
    this.notify();
  }

  // Manual Slider Tweaks
  setManualSensor(param, value) {
    if (this.sensors[param] !== undefined) {
      this.sensors[param] = Number(value);
      this.evaluateAdaptiveBrain();
      this.evaluateSafetyInterlock();
      this.classifyWaterDNA();
      this.notify();
    }
  }
}

// Export singleton instance
window.hydraSimulation = new HydraOSSimulationEngine();
