// Procedural Web Audio API sound synthesizer — zero external audio dependencies
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('arcade9_muted') === '1';
  }

  ensure() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('arcade9_muted', this.muted ? '1' : '0');
    if (!this.muted) this.click();
    return this.muted;
  }

  tone(freq, duration = 0.12, type = 'sine', volume = 0.12, slideTo = null) {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  noise(duration = 0.14, volume = 0.12, filterFreq = 1200) {
    const ctx = this.ensure();
    if (!ctx) return;
    const sampleCount = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  hover() {
    this.tone(540, 0.045, 'triangle', 0.045, 680);
  }

  click() {
    this.tone(420, 0.07, 'triangle', 0.09, 640);
  }

  flip() {
    this.tone(240, 0.11, 'sine', 0.11, 560);
  }

  slice(combo = 1) {
    const base = 360 + Math.min(combo, 10) * 65;
    this.noise(0.09, 0.09, 2600);
    this.tone(base, 0.11, 'sawtooth', 0.06, base * 1.7);
  }

  collect(step = 0) {
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
    const freq = pentatonic[step % pentatonic.length];
    this.tone(freq, 0.14, 'triangle', 0.11, freq * 1.08);
  }

  portal() {
    this.tone(320, 0.18, 'sine', 0.1, 880);
    setTimeout(() => this.tone(660, 0.14, 'triangle', 0.08, 440), 50);
  }

  bounce(pitch = 1) {
    this.tone(300 * pitch, 0.075, 'triangle', 0.1, 180 * pitch);
  }

  shoot() {
    this.tone(760, 0.07, 'square', 0.045, 220);
  }

  emp() {
    this.tone(180, 0.35, 'sawtooth', 0.11, 45);
    this.noise(0.28, 0.12, 600);
  }

  explode() {
    this.tone(130, 0.25, 'sawtooth', 0.13, 38);
    this.noise(0.22, 0.14, 500);
  }

  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      setTimeout(() => this.tone(f, 0.2, 'triangle', 0.11), idx * 75);
    });
  }

  fail() {
    const notes = [330, 262, 196];
    notes.forEach((f, idx) => {
      setTimeout(() => this.tone(f, 0.18, 'sawtooth', 0.075, f * 0.85), idx * 95);
    });
  }

  note(freq, duration = 0.18, type = 'triangle', volume = 0.12) {
    this.tone(freq, duration, type, volume);
  }
}

export const sound = new SoundEngine();
