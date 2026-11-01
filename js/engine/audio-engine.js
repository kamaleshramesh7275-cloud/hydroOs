/**
 * Industrial Web Audio API Sound Synthesizer
 * Generates realistic cyber-physical acoustic feedback using pure procedural synthesis.
 * Zero external audio dependencies.
 */

class HydraAudioEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.bldcOsc = null;
    this.bldcGain = null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch (e) {
      console.log('Web Audio API not supported on this platform');
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Solenoid Valve Mechanical Clack (High-Speed Snap)
  playSolenoidClick(isOpen = true) {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isOpen ? 640 : 420, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.05);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Realistic Water Pouring Stream (Bandpassed Modulated Noise)
  playDispensePour(durationSec = 2.0) {
    this.ensureContext();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * durationSec;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate Pink/Brownish Noise
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.96 * b1 + white * 0.11;
      b2 = 0.86 * b2 + white * 0.25;
      data[i] = (b0 + b1 + b2) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Dual resonant bandpass filter simulating turbulent fluid spout
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.15);
    gain.gain.setValueAtTime(0.22, t + durationSec - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + durationSec);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + durationSec);
  }

  // Critical Hazard Interlock Dual-Tone Beep
  playHazardAlarm() {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [0, 0.12].forEach((offset) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t + offset);

      gain.gain.setValueAtTime(0.25, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.08);
    });
  }

  // High-Pressure Reverse Flush Whoosh Sound
  playFlushWhoosh(durationSec = 2.5) {
    this.ensureContext();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * durationSec;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 0.8);
    filter.frequency.exponentialRampToValueAtTime(250, this.ctx.currentTime + durationSec);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + durationSec);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + durationSec);
  }

  // Ultrasonic Sonar Micro-Pulse Chirp (3.2 kHz -> 7.8 kHz Sweep)
  playUltrasoundChirp() {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(3200, t);
    osc.frequency.exponentialRampToValueAtTime(7800, t + 0.08);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Cavitation Reverse-Torque Hydraulic Shockwave (Pulsed Hammer Cleaning)
  playCavitationShockwave(durationSec = 2.0) {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // 10 Hz motor reverse pulse modulation
    const modOsc = this.ctx.createOscillator();
    modOsc.frequency.setValueAtTime(10, t); // 10 Hz pulse rate

    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(25, t);

    const carrierOsc = this.ctx.createOscillator();
    carrierOsc.type = 'triangle';
    carrierOsc.frequency.setValueAtTime(95, t);
    carrierOsc.frequency.exponentialRampToValueAtTime(45, t + durationSec);

    modOsc.connect(carrierOsc.frequency);

    const mainGain = this.ctx.createGain();
    mainGain.gain.setValueAtTime(0.01, t);
    mainGain.gain.linearRampToValueAtTime(0.24, t + 0.15);
    mainGain.gain.exponentialRampToValueAtTime(0.001, t + durationSec);

    carrierOsc.connect(mainGain);
    mainGain.connect(this.ctx.destination);

    modOsc.start(t);
    carrierOsc.start(t);
    modOsc.stop(t + durationSec);
    carrierOsc.stop(t + durationSec);
  }

  // Bio-Adaptive Mineral Micro-Metering Chime (Solfeggio Harmonic)
  playSommelierDispense() {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = [528, 660, 792];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.12, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.35);
    });
  }
}

window.hydraAudio = new HydraAudioEngine();
