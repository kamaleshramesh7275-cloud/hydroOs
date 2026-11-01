/**
 * Optical Specific UV Absorbance (SUVA) Spectral Disinfection Module
 * Calculates Dissolved Organic Carbon (DOC) and Trihalomethane (THM) risk
 * to modulate UV-C irradiance dynamically.
 */

class SUVASpectralEngine {
  constructor() {
    this.uv254Absorbance = 0.045; // cm^-1
    this.docMgL = 2.4;           // Dissolved Organic Carbon in mg/L
    this.suvaIndex = 1.88;       // L/(mg*m)
    this.thmRisk = 'LOW';        // 'LOW', 'ELEVATED', 'CRITICAL'
    this.uvDoseMJCm2 = 18.0;     // mJ/cm^2
  }

  evaluate(inletTurbidity, inletTDS) {
    // If turbidity spikes (e.g. mud / organic runoff), UV-254 absorbance increases
    if (inletTurbidity > 2.0) {
      this.uv254Absorbance = Number((0.045 + (inletTurbidity * 0.025)).toFixed(3));
      this.docMgL = Number((2.4 + (inletTurbidity * 0.45)).toFixed(2));
      this.suvaIndex = Number(((this.uv254Absorbance / this.docMgL) * 100).toFixed(2));
    } else {
      this.uv254Absorbance = 0.045;
      this.docMgL = 2.4;
      this.suvaIndex = 1.88;
    }

    // Determine THM Formation Potential & Required UV Irradiance Dosing
    if (this.suvaIndex > 4.0) {
      this.thmRisk = 'CRITICAL';
      this.uvDoseMJCm2 = 45.0; // Maximum germicidal irradiance
    } else if (this.suvaIndex > 2.5) {
      this.thmRisk = 'ELEVATED';
      this.uvDoseMJCm2 = 32.0; // Stepped up dose
    } else {
      this.thmRisk = 'LOW';
      this.uvDoseMJCm2 = 18.0; // Nominal energy-saving dose
    }

    return {
      uv254: this.uv254Absorbance,
      doc: this.docMgL,
      suva: this.suvaIndex,
      thmRisk: this.thmRisk,
      uvDose: this.uvDoseMJCm2
    };
  }
}

window.suvaSpectral = new SUVASpectralEngine();
