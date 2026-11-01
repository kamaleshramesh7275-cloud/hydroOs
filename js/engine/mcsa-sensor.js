/**
 * Motor Current Signature Analysis (MCSA) Virtual Sensor
 * Utilizes FOC BLDC motor stator currents to detect pump cavitation, airlocks,
 * and hydraulic load variations with zero fluid-contact sensors.
 */

class MCSAVirtualSensor {
  constructor() {
    this.fundamentalFreq = 30.8; // Hz at 1850 RPM
    this.bladePassFreq = 185.0;  // 6 impeller blades * f0
    this.statorCurrentRMS = 1.75; // Amperes Iq
    this.virtualCavitationIndex = 0.04; // 0.0 to 1.0 (Normal < 0.25)
    this.mode = 'NOMINAL'; // 'NOMINAL', 'CAVITATION', 'AIRLOCK', 'FOULING'

    // Spectral Peak Data Points
    this.spectrum = this.generateBaseSpectrum();
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'CAVITATION') {
      this.virtualCavitationIndex = 0.78;
      this.statorCurrentRMS = 2.15;
    } else if (mode === 'AIRLOCK') {
      this.virtualCavitationIndex = 0.12;
      this.statorCurrentRMS = 0.65;
    } else if (mode === 'FOULING') {
      this.virtualCavitationIndex = 0.32;
      this.statorCurrentRMS = 2.45;
    } else {
      this.virtualCavitationIndex = 0.04;
      this.statorCurrentRMS = 1.75;
    }
    this.spectrum = this.generateBaseSpectrum();
  }

  generateBaseSpectrum() {
    const points = [];
    for (let f = 0; f <= 400; f += 4) {
      let amp = 0.05 + Math.random() * 0.04; // Floor noise

      // Fundamental Peak at 30.8 Hz
      if (Math.abs(f - this.fundamentalFreq) < 8) {
        amp += 0.85;
      }
      // Blade Pass Frequency Peak at 185 Hz
      if (Math.abs(f - this.bladePassFreq) < 8) {
        amp += 0.65;
        if (this.mode === 'CAVITATION') {
          amp += 0.95; // Violent harmonic increase
        }
      }
      // Cavitation Turbulent Noise Band (140 - 240 Hz)
      if (this.mode === 'CAVITATION' && f >= 130 && f <= 250) {
        amp += 0.35 + Math.random() * 0.45;
      }
      // Fouling Heavy Load 2nd Harmonic (61.6 Hz)
      if (this.mode === 'FOULING' && Math.abs(f - 61.6) < 8) {
        amp += 0.72;
      }

      points.push({ freq: f, amp: Math.min(1.0, amp) });
    }
    return points;
  }

  renderCanvas(canvasId = 'canvas-mcsa-spectrum') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background Grid
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let y = 20; y < h - 20; y += 30) {
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();
    }

    // Axes
    ctx.fillStyle = '#64748B';
    ctx.font = '9px monospace';
    ctx.fillText('1.0 A', 5, 24);
    ctx.fillText('0.5 A', 5, 74);
    ctx.fillText('0.0 A', 5, h - 22);
    ctx.fillText('0 Hz', 35, h - 6);
    ctx.fillText('185 Hz (BPF)', w * 0.46, h - 6);
    ctx.fillText('400 Hz', w - 45, h - 6);

    // Plot Frequency Spectrum Curve
    ctx.strokeStyle = this.mode === 'CAVITATION' ? '#DC2626' : (this.mode === 'AIRLOCK' ? '#D97706' : '#FFB800');
    ctx.lineWidth = 2;
    ctx.beginPath();

    const maxFreq = 400;
    const plotX = (f) => 35 + (f / maxFreq) * (w - 45);
    const plotY = (a) => h - 20 - a * (h - 44);

    this.spectrum.forEach((pt, idx) => {
      const x = plotX(pt.freq);
      const y = plotY(pt.amp);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill Area under curve
    ctx.lineTo(w - 10, h - 20);
    ctx.lineTo(35, h - 20);
    ctx.fillStyle = this.mode === 'CAVITATION' ? 'rgba(220, 38, 38, 0.12)' : 'rgba(255, 184, 0, 0.12)';
    ctx.fill();
  }
}

window.mcsaSensor = new MCSAVirtualSensor();
