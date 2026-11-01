/**
 * Atomberg HydraOS 3.0 - Autonomous Reverse-Torque Pulsed Backwash
 * 
 * Uses 10 Hz bidirectional BLDC motor torque transients coupled with fast-exhaust solenoids
 * to create micro-pressure shockwaves that dislodge colloidal cake foulants from the RO membrane.
 * Directly restores hydraulic permeate flux without manual chemical maintenance.
 */

class PulsedBackwash {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.isCleaning = false;
    this.cleaningProgress = 0; // 0 to 1
    this.recoveryPercentage = 91.8;
    this.preFluxLmh = 11.4;
    this.postFluxLmh = 24.6;
    this.currentResistance = 5.84; // x 10^12 m^-1
    this.targetResistance = 2.18; // x 10^12 m^-1

    this.init();
  }

  init() {
    this.resizeCanvas();
    this.drawChart();
    this.updateDom();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = (rect.width || 420) * dpr;
    this.canvas.height = (rect.height || 160) * dpr;
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  executeCleanse() {
    if (this.isCleaning) return;
    this.isCleaning = true;
    this.cleaningProgress = 0;

    if (window.hydraAudio) {
      window.hydraAudio.playCavitationShockwave(3.5);
    }

    const btn = document.getElementById('btn-execute-backwash');
    if (btn) {
      btn.textContent = 'EXECUTING 10Hz CAVITATION CLEANSE...';
      btn.disabled = true;
    }

    const statusEl = document.getElementById('backwash-status');
    if (statusEl) {
      statusEl.textContent = 'PULSED SHOCKWAVE ACTIVE';
      statusEl.className = 'status-tag status-danger';
    }

    const startTime = performance.now();
    const duration = 3500; // 3.5 seconds

    const animate = (now) => {
      const elapsed = now - startTime;
      this.cleaningProgress = Math.min(1.0, elapsed / duration);

      // Lerp resistance and flux
      this.currentResistance = 5.84 - (5.84 - this.targetResistance) * this.cleaningProgress;
      const currentFlux = this.preFluxLmh + (this.postFluxLmh - this.preFluxLmh) * this.cleaningProgress;

      this.drawChart();
      this.updateDom(currentFlux);

      if (this.cleaningProgress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        this.isCleaning = false;
        if (btn) {
          btn.textContent = 'PULSE CYCLE COMPLETED (91.8% RECOVERED)';
          setTimeout(() => {
            btn.textContent = 'EXECUTE PULSED CAVITATION CLEANSE';
            btn.disabled = false;
          }, 2500);
        }
        if (statusEl) {
          statusEl.textContent = 'MEMBRANE RESTORED (FLUX +115%)';
          statusEl.className = 'status-tag status-active';
        }
      }
    };

    requestAnimationFrame(animate);
  }

  drawChart() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || 420;
    const h = rect.height || 160;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // Dark canvas background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    const pad = 24;
    const chartW = w - pad * 2;
    const chartH = h - pad * 2;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const gy = pad + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad, gy);
      ctx.lineTo(pad + chartW, gy);
      ctx.stroke();
    }

    // Resistance Recovery Curve
    ctx.strokeStyle = '#FFB800';
    ctx.lineWidth = 2.2;
    ctx.beginPath();

    const points = 100;
    for (let i = 0; i <= points; i++) {
      const x = pad + (chartW / points) * i;
      const progress = i / points;

      let rNorm = 0;
      if (progress < 0.25) {
        rNorm = 0.85; // High initial resistance
      } else if (progress < 0.70) {
        // Shockwave transients
        const decay = (progress - 0.25) / 0.45;
        const transient = Math.sin(progress * 80) * 0.15 * (1 - decay);
        rNorm = 0.85 - (0.85 - 0.28) * decay + transient;
      } else {
        rNorm = 0.28; // Clean recovered state
      }

      const y = pad + chartH * (1 - rNorm);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill area under curve
    ctx.lineTo(pad + chartW, pad + chartH);
    ctx.lineTo(pad, pad + chartH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 184, 0, 0.12)';
    ctx.fill();

    // Callout labels
    ctx.font = '9px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('FOULED CAKE (5.84×10¹² m⁻¹)', pad + 6, pad + 16);
    ctx.fillStyle = '#10B981';
    ctx.fillText('RECOVERED FLUX (24.6 LMH)', pad + chartW - 140, pad + chartH - 8);
  }

  updateDom(flux = this.postFluxLmh) {
    const resEl = document.getElementById('backwash-resistance');
    const fluxEl = document.getElementById('backwash-flux');
    const recEl = document.getElementById('backwash-recovery');

    if (resEl) resEl.textContent = `${this.currentResistance.toFixed(2)} × 10¹² m⁻¹`;
    if (fluxEl) fluxEl.textContent = `${flux.toFixed(1)} LMH`;
    if (recEl) recEl.textContent = `${this.recoveryPercentage.toFixed(1)}%`;
  }
}

window.PulsedBackwash = PulsedBackwash;
