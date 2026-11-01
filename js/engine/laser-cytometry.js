/**
 * Atomberg HydraOS 3.0 - Optical Laser Micro-Cytometry Pathogen Scatter Classifier
 * 
 * Simulates a 405nm optical laser flow chamber measuring Forward Scatter (FSC, particle size)
 * and Side Scatter (SSC, internal refractive index / organelle granularity).
 * Distinguishes viable bacterial pathogens (E. coli, Cryptosporidium) from inert mineral colloids
 * and dead cellular fragments to verify 6-log microbial kill assurance in real time.
 */

class LaserCytometry {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.cytometryMode = 'sterilized'; // 'sterilized', 'turbid_shadow', 'pathogen_spike'
    this.lrv = 6.24; // Log Reduction Value (6-log kill = 99.9999%)
    this.pathogenCountPerMl = 0;
    this.totalEventsPerSec = 1420;
    this.particles = [];
    this.animationFrame = null;
    this.time = 0;

    this.init();
  }

  init() {
    if (!this.canvas) return;
    this.resizeCanvas();
    this.generateParticles();
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

  setCytometryMode(mode) {
    this.cytometryMode = mode;
    if (mode === 'sterilized') {
      this.lrv = 6.24 + Math.random() * 0.15;
      this.pathogenCountPerMl = 0;
      this.totalEventsPerSec = 1420 + Math.floor(Math.random() * 60);
    } else if (mode === 'turbid_shadow') {
      this.lrv = 4.12 - Math.random() * 0.3;
      this.pathogenCountPerMl = 8 + Math.floor(Math.random() * 5);
      this.totalEventsPerSec = 3850 + Math.floor(Math.random() * 200);
    } else if (mode === 'pathogen_spike') {
      this.lrv = 2.18 - Math.random() * 0.2;
      this.pathogenCountPerMl = 64 + Math.floor(Math.random() * 15);
      this.totalEventsPerSec = 6120 + Math.floor(Math.random() * 300);
    }
    this.generateParticles();
    this.updateDomReadouts();
  }

  generateParticles() {
    this.particles = [];
    const count = 180;
    for (let i = 0; i < count; i++) {
      let type = 'colloid'; // colloid, debris, pathogen
      let fsc = 0;
      let ssc = 0;

      const rand = Math.random();
      if (this.cytometryMode === 'sterilized') {
        if (rand < 0.75) {
          type = 'colloid'; // Low FSC, Low SSC
          fsc = 0.10 + Math.random() * 0.25;
          ssc = 0.08 + Math.random() * 0.22;
        } else {
          type = 'debris'; // Medium FSC, Low SSC (inactivated lysed fragments)
          fsc = 0.35 + Math.random() * 0.30;
          ssc = 0.12 + Math.random() * 0.20;
        }
      } else if (this.cytometryMode === 'turbid_shadow') {
        if (rand < 0.60) {
          type = 'colloid';
          fsc = 0.15 + Math.random() * 0.35;
          ssc = 0.10 + Math.random() * 0.35;
        } else if (rand < 0.88) {
          type = 'debris';
          fsc = 0.40 + Math.random() * 0.25;
          ssc = 0.15 + Math.random() * 0.25;
        } else {
          type = 'pathogen'; // High FSC, High SSC
          fsc = 0.65 + Math.random() * 0.25;
          ssc = 0.60 + Math.random() * 0.30;
        }
      } else {
        // Pathogen spike
        if (rand < 0.35) {
          type = 'colloid';
          fsc = 0.15 + Math.random() * 0.30;
          ssc = 0.10 + Math.random() * 0.30;
        } else if (rand < 0.55) {
          type = 'debris';
          fsc = 0.40 + Math.random() * 0.25;
          ssc = 0.15 + Math.random() * 0.25;
        } else {
          type = 'pathogen';
          fsc = 0.60 + Math.random() * 0.35;
          ssc = 0.55 + Math.random() * 0.40;
        }
      }

      this.particles.push({
        fsc,
        ssc,
        type,
        pulseOffset: Math.random() * Math.PI * 2,
        speed: 0.002 + Math.random() * 0.004
      });
    }
  }

  updateDomReadouts() {
    const lrvEl = document.getElementById('cytometry-lrv');
    const pathEl = document.getElementById('cytometry-pathogens');
    const eventsEl = document.getElementById('cytometry-events');
    const statusEl = document.getElementById('cytometry-status');

    if (lrvEl) lrvEl.textContent = `${this.lrv.toFixed(2)} Log`;
    if (pathEl) pathEl.textContent = `${this.pathogenCountPerMl} CFU/mL`;
    if (eventsEl) eventsEl.textContent = `${this.totalEventsPerSec} evt/s`;

    if (statusEl) {
      if (this.lrv >= 6.0) {
        statusEl.textContent = '6-LOG STERILE (99.9999%)';
        statusEl.className = 'status-tag status-active';
      } else if (this.lrv >= 4.0) {
        statusEl.textContent = 'SHADOWING DETECTED';
        statusEl.className = 'status-tag status-warning';
      } else {
        statusEl.textContent = 'PATHOGEN RISK: RE-CYCLE UV';
        statusEl.className = 'status-tag status-danger';
      }
    }
  }

  startRendering() {
    const render = () => {
      this.time += 0.03;
      this.drawScatterPlot();
      this.animationFrame = requestAnimationFrame(render);
    };
    this.animationFrame = requestAnimationFrame(render);
  }

  drawScatterPlot() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || 420;
    const h = rect.height || 180;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // Dark backdrop
    ctx.fillStyle = '#0B1329';
    ctx.fillRect(0, 0, w, h);

    // Cytometry Gate boundaries (G1: Colloids, G2: Cellular Debris, G3: Viable Pathogens)
    const pad = 24;
    const plotW = w - pad * 2;
    const plotH = h - pad * 2;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const gx = pad + (plotW / 4) * i;
      ctx.beginPath();
      ctx.moveTo(gx, pad);
      ctx.lineTo(gx, pad + plotH);
      ctx.stroke();

      const gy = pad + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad, gy);
      ctx.lineTo(pad + plotW, gy);
      ctx.stroke();
    }

    // Pathogen Hazard Gate Zone (High FSC > 0.55, High SSC > 0.50)
    const gateX = pad + plotW * 0.55;
    const gateY = pad + plotH * (1 - 0.90);
    const gateW = plotW * 0.45;
    const gateH = plotH * 0.45;

    ctx.fillStyle = this.cytometryMode === 'pathogen_spike' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)';
    ctx.strokeStyle = this.cytometryMode === 'pathogen_spike' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(gateX, gateY, gateW, gateH);
    ctx.fillRect(gateX, gateY, gateW, gateH);
    ctx.setLineDash([]);

    ctx.font = '8px "Inter", sans-serif';
    ctx.fillStyle = this.cytometryMode === 'pathogen_spike' ? '#EF4444' : 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('PATHOGEN GATE (E. COLI)', gateX + 6, gateY + 12);

    // Plot Particles
    this.particles.forEach((p) => {
      // Micro-jitter to simulate continuous fluid flow
      const px = pad + (p.fsc + Math.sin(this.time + p.pulseOffset) * 0.015) * plotW;
      const py = pad + plotH - (p.ssc + Math.cos(this.time + p.pulseOffset) * 0.015) * plotH;

      ctx.beginPath();
      let color = '#10B981'; // Green for inert colloids
      let radius = 2.0;

      if (p.type === 'debris') {
        color = '#FFB800'; // Amber for dead fragments
        radius = 2.5;
      } else if (p.type === 'pathogen') {
        color = '#EF4444'; // Red for viable pathogens
        radius = 3.5;
      }

      ctx.fillStyle = color;
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Axis Labels
    ctx.font = '9px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('FORWARD SCATTER (FSC - CELL VOLUME) →', pad, h - 8);

    ctx.save();
    ctx.translate(12, pad + plotH);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('SIDE SCATTER (SSC - GRANULARITY) →', 0, 0);
    ctx.restore();
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}

window.LaserCytometry = LaserCytometry;
