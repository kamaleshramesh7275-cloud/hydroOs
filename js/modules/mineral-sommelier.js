/**
 * Atomberg HydraOS 3.0 - AI Bio-Adaptive Mineral Sommelier
 * 
 * Synchronizes with simulated wearable biometric data (Resting HR, Sleep Stages, Sweat Loss)
 * and commands dual-channel micro-stepper remineralization valves to formulate custom
 * mineral cocktails (Mg2+, Ca2+, K+, HCO3-) tailored to circadian rhythm and athletic strain.
 */

class MineralSommelier {
  constructor() {
    this.currentMode = 'morning_focus'; // 'morning_focus', 'athletic_recovery', 'evening_sleep', 'custom'
    this.biometrics = {
      rhr: 58, // bpm
      hrv: 72, // ms
      sweatLoss: 450, // mL
      circadianPhase: 'Morning Cortisol Peak'
    };
    this.minerals = {
      mg: 32, // ppm (Magnesium)
      ca: 48, // ppm (Calcium)
      k: 18,  // ppm (Potassium)
      hco3: 65 // ppm (Bicarbonate)
    };
    this.totalMineralTds = 163; // ppm
    this.osmolarity = 142; // mOsm/L
    this.tasteProfile = 'Velvety Alkaline & Crisp';

    this.init();
  }

  init() {
    this.updateCalculations();
    this.updateDom();
  }

  setMode(mode) {
    this.currentMode = mode;
    if (mode === 'morning_focus') {
      this.biometrics = {
        rhr: 58,
        hrv: 72,
        sweatLoss: 250,
        circadianPhase: 'Morning Cortisol Peak'
      };
      this.minerals = { mg: 42, ca: 30, k: 15, hco3: 85 };
      this.tasteProfile = 'Silky High-Alkaline (pH 8.2) for Neural Focus';
    } else if (mode === 'athletic_recovery') {
      this.biometrics = {
        rhr: 82,
        hrv: 44,
        sweatLoss: 950,
        circadianPhase: 'Post-Exertion Depletion'
      };
      this.minerals = { mg: 35, ca: 65, k: 45, hco3: 95 };
      this.tasteProfile = 'Crisp Isotonic Mineral (280 mOsm/L)';
    } else if (mode === 'evening_sleep') {
      this.biometrics = {
        rhr: 52,
        hrv: 88,
        sweatLoss: 120,
        circadianPhase: 'Melatonin Secretion Phase'
      };
      this.minerals = { mg: 55, ca: 20, k: 10, hco3: 50 };
      this.tasteProfile = 'Soothing Bio-Magnesium for Restful Sleep';
    }
    this.updateCalculations();
    this.updateDom();
  }

  updateCustomMinerals(mg, ca, k, hco3) {
    this.currentMode = 'custom';
    this.minerals = {
      mg: parseFloat(mg) || 0,
      ca: parseFloat(ca) || 0,
      k: parseFloat(k) || 0,
      hco3: parseFloat(hco3) || 0
    };
    this.tasteProfile = 'Custom Formulated Mineral Balance';
    this.updateCalculations();
    this.updateDom();
  }

  updateCalculations() {
    this.totalMineralTds = Math.round(this.minerals.mg + this.minerals.ca + this.minerals.k + this.minerals.hco3);
    // Osmolarity approximation
    this.osmolarity = Math.round((this.minerals.mg / 24.3 + this.minerals.ca / 40.1 + this.minerals.k / 39.1 + this.minerals.hco3 / 61.0) * 45);
  }

  dispenseCocktail() {
    if (window.hydraAudio) {
      window.hydraAudio.playSommelierDispense();
    }

    const btn = document.getElementById('btn-dispense-sommelier');
    if (btn) {
      btn.textContent = 'MICRO-STEPPERS INJECTING...';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'DISPENSE BIO-COCKTAIL (250 mL)';
        btn.disabled = false;
      }, 1600);
    }

    // Log glass into family intake if family module exists
    if (window.hydraApp && window.hydraApp.modules && window.hydraApp.modules.familyHydration) {
      window.hydraApp.modules.familyHydration.logIntake(250);
    }
  }

  updateDom() {
    const rhrEl = document.getElementById('sommelier-rhr');
    const hrvEl = document.getElementById('sommelier-hrv');
    const sweatEl = document.getElementById('sommelier-sweat');
    const phaseEl = document.getElementById('sommelier-phase');

    const tdsEl = document.getElementById('sommelier-tds');
    const osmoEl = document.getElementById('sommelier-osmo');
    const tasteEl = document.getElementById('sommelier-taste');

    const mgEl = document.getElementById('sommelier-val-mg');
    const caEl = document.getElementById('sommelier-val-ca');
    const kEl = document.getElementById('sommelier-val-k');
    const hco3El = document.getElementById('sommelier-val-hco3');

    const mgSlider = document.getElementById('sommelier-slider-mg');
    const caSlider = document.getElementById('sommelier-slider-ca');
    const kSlider = document.getElementById('sommelier-slider-k');
    const hco3Slider = document.getElementById('sommelier-slider-hco3');

    if (rhrEl) rhrEl.textContent = `${this.biometrics.rhr} bpm`;
    if (hrvEl) hrvEl.textContent = `${this.biometrics.hrv} ms`;
    if (sweatEl) sweatEl.textContent = `${this.biometrics.sweatLoss} mL`;
    if (phaseEl) phaseEl.textContent = this.biometrics.circadianPhase;

    if (tdsEl) tdsEl.textContent = `${this.totalMineralTds} ppm`;
    if (osmoEl) osmoEl.textContent = `${this.osmolarity} mOsm/L`;
    if (tasteEl) tasteEl.textContent = this.tasteProfile;

    if (mgEl) mgEl.textContent = `${this.minerals.mg} ppm`;
    if (caEl) caEl.textContent = `${this.minerals.ca} ppm`;
    if (kEl) kEl.textContent = `${this.minerals.k} ppm`;
    if (hco3El) hco3El.textContent = `${this.minerals.hco3} ppm`;

    if (mgSlider && this.currentMode !== 'custom') mgSlider.value = this.minerals.mg;
    if (caSlider && this.currentMode !== 'custom') caSlider.value = this.minerals.ca;
    if (kSlider && this.currentMode !== 'custom') kSlider.value = this.minerals.k;
    if (hco3Slider && this.currentMode !== 'custom') hco3Slider.value = this.minerals.hco3;
  }
}

window.MineralSommelier = MineralSommelier;
