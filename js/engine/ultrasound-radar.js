/**
 * Atomberg HydraOS 3.0 - Acoustic Micro-Reflectometry Scale Radar
 * 
 * Uses 32 kHz high-frequency micro-pulsing of the BLDC motor stator laminations
 * to generate non-invasive ultrasonic acoustic waves through the hydraulic manifold.
 * Measures Time-of-Flight (TOF) echo reflections to detect CaCO3 calcite scale accretion
 * on pipe walls and the RO membrane surface before hydraulic head-loss occurs.
 */

class UltrasoundRadar {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.scaleState = 'nominal'; // 'nominal', 'incipient', 'critical'
    this.scaleThickness = 12.4; // micrometers
    this.tofNs = 420; // nanoseconds time of flight
    this.acousticImpedance = 1.48; // MRayl (water ~1.48, calcite ~17.0)
    this.pulseFrequency = 32.4; // kHz
    this.animationFrame = null;
    this.time = 0;

    this.init();
  }

  init() {
    if (!this.canvas) return;
    this.resizeCanvas();
    this.startRendering();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = (rect.width || 420) * dpr;
    this.canvas.height = (rect.height || 180) * dpr;
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  setScaleState(state) {
    this.scaleState = state;
    if (state === 'nominal') {
      this.scaleThickness = 12.4 + (Math.random() * 4 - 2);
      this.tofNs = 415 + Math.random() * 10;
      this.acousticImpedance = 1.52;
    } else if (state === 'incipient') {
      this.scaleThickness = 68.7 + (Math.random() * 8 - 4);
      this.tofNs = 485 + Math.random() * 15;
      this.acousticImpedance = 4.25;
    } else if (state === 'critical') {
      this.scaleThickness = 194.2 + (Math.random() * 12 - 6);
      this.tofNs = 590 + Math.random() * 20;
      this.acousticImpedance = 11.8;
    }
    this.updateDomReadouts();
  }

  updateDomReadouts() {
    const thickEl = document.getElementById('ultrasound-thickness');
    const tofEl = document.getElementById('ultrasound-tof');
    const statusEl = document.getElementById('ultrasound-status');
    const impEl = document.getElementById('ultrasound-impedance');

    if (thickEl) thickEl.textContent = `${this.scaleThickness.toFixed(1)} µm`;
    if (tofEl) tofEl.textContent = `${Math.round(this.tofNs)} ns`;
    if (impEl) impEl.textContent = `${this.acousticImpedance.toFixed(2)} MRayl`;

    if (statusEl) {
      if (this.scaleThickness < 35) {
        statusEl.textContent = 'NOMINAL LUMEN';
        statusEl.className = 'status-tag status-active';
      } else if (this.scaleThickness < 120) {
        statusEl.textContent = 'INCIPIENT CALCITE';
        statusEl.className = 'status-tag status-warning';
      } else {
        statusEl.textContent = 'HYDRAULIC OCCLUSION';
        statusEl.className = 'status-tag status-danger';
      }
    }
  }

  startRendering() {
    const render = () => {
      this.time += 0.05;
      this.drawAScan();
      this.animationFrame = requestAnimationFrame(render);
    };
    this.animationFrame = requestAnimationFrame(render);
  }

  drawAScan() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || 420;
    const h = rect.height || 180;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // Dark technical background grid
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    const gridCols = 8;
    const gridRows = 4;
    for (let c = 1; c < gridCols; c++) {
      const x = (w / gridCols) * c;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let r = 1; r < gridRows; r++) {
      const y = (h / gridRows) * r;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Zero baseline
    const midY = h * 0.65;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    // Ultrasonic RF A-Scan Waveform:
    // 1. Initial Transmit Pulse (0 - 15% width)
    // 2. Pure water transmission zone (15% - 45%)
    // 3. Pipe wall / membrane echo reflection (45% - 85%) whose amplitude & phase shift depends on scaleThickness
    ctx.strokeStyle = this.scaleThickness > 120 ? '#EF4444' : (this.scaleThickness > 35 ? '#FFB800' : '#10B981');
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    const points = 240;
    for (let i = 0; i <= points; i++) {
      const x = (w / points) * i;
      const progress = i / points;
      let amp = 0;

      // Initial transmit bang (Tx)
      if (progress < 0.12) {
        const envelope = Math.sin((progress / 0.12) * Math.PI);
        amp = Math.sin(progress * 150 + this.time * 2) * 35 * envelope;
      }
      // Water baseline noise
      else if (progress < 0.45) {
        amp = (Math.sin(progress * 300 + this.time * 4) * 1.5) + (Math.random() - 0.5) * 1.2;
      }
      // Calcite Scale Reflection Echo (Rx)
      else if (progress >= 0.45 && progress < 0.85) {
        const echoCenter = 0.50 + (this.tofNs / 1000) * 0.4;
        const dist = Math.abs(progress - echoCenter);
        const width = 0.12;
        if (dist < width) {
          const envelope = Math.cos((dist / width) * (Math.PI / 2));
          const scaleMultiplier = Math.min(2.5, 0.4 + (this.scaleThickness / 80));
          amp = Math.sin((progress - echoCenter) * 120 - this.time * 3) * 45 * envelope * scaleMultiplier;
          // Add secondary multi-path harmonic if heavy scale
          if (this.scaleThickness > 100) {
            amp += Math.sin((progress - echoCenter) * 240) * 12 * envelope;
          }
        }
      }
      // Sensor back-wall echo
      else {
        amp = (Math.random() - 0.5) * 2.0;
      }

      const y = midY - amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Overlay Annotations
    ctx.font = '9px "Inter", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('TX PULSE (32.4 kHz)', 10, 18);
    ctx.fillText('TOF ECHO (Rx)', w * 0.58, 18);

    // Scale Thickness Callout
    ctx.fillStyle = this.scaleThickness > 120 ? '#EF4444' : (this.scaleThickness > 35 ? '#FFB800' : '#10B981');
    ctx.fillText(`∆d = ${this.scaleThickness.toFixed(1)} µm`, w * 0.68, midY - 42);

    // Arrow to echo peak
    const echoPeakX = w * (0.50 + (this.tofNs / 1000) * 0.4);
    ctx.strokeStyle = this.scaleThickness > 120 ? '#EF4444' : (this.scaleThickness > 35 ? '#FFB800' : '#10B981');
    ctx.beginPath();
    ctx.moveTo(echoPeakX, 24);
    ctx.lineTo(echoPeakX, midY - 25);
    ctx.stroke();
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}

window.UltrasoundRadar = UltrasoundRadar;
