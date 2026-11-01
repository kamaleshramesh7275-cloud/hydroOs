/**
 * Dynamic Energy-Water Nexus Module
 * Synchronizes high-pressure Reverse Osmosis pumping with rooftop solar PV generation
 * and Time-of-Day (ToD) electricity tariffs to minimize domestic energy costs.
 */

class EnergyNexusModule {
  constructor() {
    this.currentMode = 'SOLAR_SYNC'; // 'GRID_STANDARD', 'TOD_OPTIMIZED', 'SOLAR_SYNC'
    
    // 24-Hour Solar & Tariff Curves (0h to 23h)
    this.hourlyData = [];
    for (let h = 0; h < 24; h++) {
      // Solar Bell Curve peaking at 12:30 PM (11 to 14)
      let solarKW = 0;
      if (h >= 6 && h <= 18) {
        solarKW = Number((3.2 * Math.sin(((h - 6) / 12) * Math.PI)).toFixed(2));
      }

      // ToD Electricity Tariff (INR/kWh)
      let tariffINR = 4.50; // Base off-peak
      if (h >= 18 && h <= 22) tariffINR = 9.20; // Peak evening hours
      else if (h >= 6 && h <= 10) tariffINR = 6.80; // Morning medium peak

      // Planned Pumping Dispatch (Watts)
      let pumpWatts = 0;
      if (this.currentMode === 'SOLAR_SYNC' && h >= 11 && h <= 14) {
        pumpWatts = 42; // Fully solar powered
      } else if (this.currentMode === 'TOD_OPTIMIZED' && (h === 2 || h === 3 || h === 13)) {
        pumpWatts = 42;
      } else if (this.currentMode === 'GRID_STANDARD' && (h === 8 || h === 19 || h === 21)) {
        pumpWatts = 42;
      }

      this.hourlyData.push({ hour: h, solarKW, tariffINR, pumpWatts });
    }

    this.costMetrics = {
      GRID_STANDARD: { monthlyCostINR: 185, solarSharePct: 0, desc: "On-demand uncoordinated pumping during evening peak tariffs." },
      TOD_OPTIMIZED: { monthlyCostINR: 112, solarSharePct: 35, desc: "Shifted to non-peak tariff slots (39% energy cost reduction)." },
      SOLAR_SYNC: { monthlyCostINR: 24, solarSharePct: 88, desc: "Synchronized with rooftop solar generation peak (87% energy savings)." }
    };
  }

  setMode(mode) {
    if (this.costMetrics[mode]) {
      this.currentMode = mode;
      return this.costMetrics[mode];
    }
    return this.costMetrics.SOLAR_SYNC;
  }

  renderCanvas(canvasId = 'chart-energy-nexus') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background Grid
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let y = 20; y < h - 25; y += 30) {
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(w - 15, y);
      ctx.stroke();
    }

    // Axes
    ctx.fillStyle = '#64748B';
    ctx.font = '9px monospace';
    ctx.fillText('₹10', 5, 25);
    ctx.fillText('₹5', 5, 75);
    ctx.fillText('₹0', 5, h - 25);
    ctx.fillText('0h', 35, h - 8);
    ctx.fillText('12h (Solar Peak)', w * 0.45, h - 8);
    ctx.fillText('24h', w - 25, h - 8);

    const plotX = (hr) => 35 + (hr / 23) * (w - 55);

    // 1. Draw Solar Generation Bell Curve (Filled Translucent Yellow)
    ctx.fillStyle = 'rgba(255, 184, 0, 0.18)';
    ctx.strokeStyle = '#FFB800';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(plotX(0), h - 25);
    for (let hr = 0; hr < 24; hr++) {
      const sol = this.hourlyData[hr].solarKW;
      const y = h - 25 - (sol / 3.5) * (h - 45);
      ctx.lineTo(plotX(hr), y);
    }
    ctx.lineTo(plotX(23), h - 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Draw Grid Tariff Staircase Curve (Slate Blue Line)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let hr = 0; hr < 24; hr++) {
      const tar = this.hourlyData[hr].tariffINR;
      const y = h - 25 - (tar / 10.0) * (h - 45);
      if (hr === 0) ctx.moveTo(plotX(hr), y);
      else ctx.lineTo(plotX(hr), y);
    }
    ctx.stroke();

    // 3. Draw Scheduled RO Pump Window Bar (Emerald Blocks)
    ctx.fillStyle = '#059669';
    for (let hr = 0; hr < 24; hr++) {
      if ((this.currentMode === 'SOLAR_SYNC' && hr >= 11 && hr <= 14) ||
          (this.currentMode === 'TOD_OPTIMIZED' && (hr === 2 || hr === 3 || hr === 13)) ||
          (this.currentMode === 'GRID_STANDARD' && (hr === 8 || hr === 19 || hr === 21))) {
        const x = plotX(hr) - 5;
        ctx.fillRect(x, h - 45, 10, 18);
      }
    }

    // Legend
    ctx.fillStyle = '#FFB800';
    ctx.fillRect(w - 240, 12, 10, 8);
    ctx.fillStyle = '#334155';
    ctx.fillText('Rooftop Solar PV', w - 225, 18);

    ctx.fillStyle = '#475569';
    ctx.fillRect(w - 140, 12, 10, 8);
    ctx.fillStyle = '#334155';
    ctx.fillText('Grid Tariff (INR)', w - 125, 18);
  }
}

window.energyNexus = new EnergyNexusModule();
