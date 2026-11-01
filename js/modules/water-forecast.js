/**
 * Water Forecast & Pop-In Regional Filtration Pack Module
 * Combines Hydra Grid historical baseline, seasonal monsoon precipitation,
 * and municipal reservoir gate schedules to generate 24-48h tap water quality forecasts.
 */

class WaterForecastModule {
  constructor() {
    this.forecastData = [
      { day: "Today (T+0)", source: "Cauvery Municipal", expectedTurbidity: 0.35, expectedTDS: 110, riskLevel: "LOW", recommendation: "Nominal operation. UF/UV Eco-Bypass active." },
      { day: "Tomorrow (T+1)", source: "Monsoon Surge / Rain Influx", expectedTurbidity: 4.8, expectedTDS: 185, riskLevel: "ELEVATED", recommendation: "Turbidity increase expected. Pre-conditioning stages and storing 8L reserve advised." },
      { day: "Thursday (T+2)", source: "Secondary Tanker Blend", expectedTurbidity: 1.2, expectedTDS: 680, riskLevel: "MODERATE", recommendation: "Elevated mineral hardness. 75 GPD RO stage will automatically engage." }
    ];

    // Pop-In Regional Add-On Packs
    this.regionalPacks = {
      NONE: { name: "Standard Universal Pack", region: "General Urban", target: "Standard Particulates & Chlorine", active: true },
      FLUORIDE: { name: "Fluoride Selective Adsorption Pack", region: "Rajasthan, Gujarat, Andhra", target: "Bone & dental fluorosis prevention (Activated Alumina)", active: false },
      ARSENIC: { name: "Arsenic Chelating Media Pack", region: "Bengal Basin, Bihar, Eastern UP", target: "Inorganic As(III)/As(V) removal (< 10 ppb)", active: false },
      IRON: { name: "Heavy Iron Catalytic Pack", region: "Assam, Odisha, Jharkhand", target: "Ferrous & ferric iron precipitation (< 0.3 mg/L)", active: false }
    };

    this.activePack = 'NONE';
  }

  setRegionalPack(packKey) {
    if (this.regionalPacks[packKey]) {
      Object.keys(this.regionalPacks).forEach(k => this.regionalPacks[k].active = (k === packKey));
      this.activePack = packKey;
      return this.regionalPacks[packKey];
    }
  }

  renderForecastTable(tableBodyId = 'forecast-table-body') {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;

    tbody.innerHTML = this.forecastData.map(f => `
      <tr>
        <td style="font-weight:700;">${f.day}</td>
        <td>${f.source}</td>
        <td>${f.expectedTurbidity} NTU</td>
        <td>${f.expectedTDS} ppm</td>
        <td>
          <span style="font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:4px; ${
            f.riskLevel === 'LOW' ? 'background:#ECFDF5; color:#059669;' :
            f.riskLevel === 'MODERATE' ? 'background:#FFFBEB; color:#D97706;' :
            'background:#FEF2F2; color:#DC2626;'
          }">${f.riskLevel}</span>
        </td>
        <td style="font-size:0.75rem; color:#475569;">${f.recommendation}</td>
      </tr>
    `).join('');
  }
}

window.waterForecast = new WaterForecastModule();
