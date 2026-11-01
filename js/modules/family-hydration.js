/**
 * Family Hydration & Zero-Reject Circularity Module
 * Manages demographic profiles, custom profile creation, daily intake tracking,
 * and zero-reject domestic utility distribution (plants, mopping, flushing).
 */

class FamilyHydrationModule {
  constructor() {
    this.profiles = {
      STANDARD: {
        id: 'STANDARD',
        name: 'Standard Adult (Balanced)',
        targetTDS: 85,
        calciumMgL: 30,
        magnesiumMgL: 15,
        sodiumType: 'Nominal (12 mg/L)',
        purpose: 'Everyday cellular hydration and balanced taste profile.'
      },
      SENIOR: {
        id: 'SENIOR',
        name: 'Senior Care (Cardio & Skeletal)',
        targetTDS: 110,
        calciumMgL: 45,
        magnesiumMgL: 25,
        sodiumType: 'Low Sodium (< 4 mg/L)',
        purpose: 'Optimized calcium uptake for bone density and reduced vascular stress.'
      },
      ATHLETE: {
        id: 'ATHLETE',
        name: 'Athletic Recovery (Electrolytes)',
        targetTDS: 145,
        calciumMgL: 35,
        magnesiumMgL: 40,
        sodiumType: 'Potassium / Electrolyte Enhanced',
        purpose: 'Rapid rehydration and muscle cramping prevention.'
      },
      INFANT: {
        id: 'INFANT',
        name: 'Infant Nutrition (Pediatric Care)',
        targetTDS: 45,
        calciumMgL: 12,
        magnesiumMgL: 6,
        sodiumType: 'Ultra-Low (< 2 mg/L)',
        purpose: 'Ultra-low renal solute load tuned for neonatal formula preparation.'
      }
    };

    this.activeProfileKey = 'STANDARD';

    // Daily Intake Tracking State
    this.dailyHydrationGoalL = 3.0; // 3 Litres target
    this.intakeConsumedL = 1.75;    // 1.75 L consumed so far
    this.intakeGlassesCount = 7;     // 7 glasses (250ml each)
  }

  setProfile(profileKey) {
    if (this.profiles[profileKey]) {
      this.activeProfileKey = profileKey;
      return this.profiles[profileKey];
    }
    return this.profiles.STANDARD;
  }

  getActiveProfile() {
    return this.profiles[this.activeProfileKey];
  }

  addCustomProfile(name, tds, ca, mg) {
    const id = 'CUSTOM_' + Date.now();
    this.profiles[id] = {
      id: id,
      name: name || 'Custom Blend',
      targetTDS: Number(tds) || 90,
      calciumMgL: Number(ca) || 30,
      magnesiumMgL: Number(mg) || 20,
      sodiumType: 'Custom Tuned',
      purpose: 'User-calibrated demographic mineral formulation.'
    };
    this.activeProfileKey = id;
    return this.profiles[id];
  }

  logConsumptionGlass() {
    this.intakeGlassesCount++;
    this.intakeConsumedL = Number((this.intakeConsumedL + 0.25).toFixed(2));
    return {
      glasses: this.intakeGlassesCount,
      consumedL: this.intakeConsumedL,
      goalL: this.dailyHydrationGoalL,
      progressPct: Math.min(100, Math.round((this.intakeConsumedL / this.dailyHydrationGoalL) * 100))
    };
  }

  // Actuate Zero-Reject Domestic Distribution
  utilizeRejectWater(purpose, volumeL) {
    const sim = window.hydraSimulation;
    if (!sim) return { success: false, reason: "Simulation engine not active" };

    if (sim.waterTwin.reuseTankCurrent < volumeL) {
      return { 
        success: false, 
        reason: `Insufficient secondary utility reserve. Required ${volumeL}L, available ${sim.waterTwin.reuseTankCurrent.toFixed(1)}L.` 
      };
    }

    sim.waterTwin.reuseTankCurrent = Number((sim.waterTwin.reuseTankCurrent - volumeL).toFixed(2));
    sim.waterTwin.waterSavedLitres += volumeL;
    sim.notify();

    if (window.hydraAudio) {
      window.hydraAudio.playDispensePour(1.5);
    }

    return {
      success: true,
      purpose: purpose,
      dispensedL: volumeL,
      remainingL: sim.waterTwin.reuseTankCurrent
    };
  }
}

window.familyHydration = new FamilyHydrationModule();
