import type { AudioCore } from './AudioCore';

/**
 * Dynamische Ambient-Musik aus Synthesizer-Schichten, die je nach Situation
 * ineinander überblenden:
 *  - explore: dunkle Pads (verstimmte Sägezähne, Tiefpass), Sub-Bass, vereinzelte
 *             E-Piano-Töne – Noir-Moll (Am – F – Dm – E).
 *  - tension: pulsierender Bass in Achteln + dumpfer Herzschlag.
 *  - chase:   vorbereitet (gleiches Prinzip, schneller) – wird ab M3/M4 genutzt.
 */
export type MusicLayer = 'silent' | 'explore' | 'tension' | 'chase';

const CHORDS = [
  [45, 48, 52, 57], // Am
  [41, 45, 48, 53], // F
  [38, 41, 45, 50], // Dm
  [40, 44, 47, 52], // E
];
const SCALE = [57, 60, 62, 64, 65, 67, 69, 72]; // A-Moll, eine Oktave höher für das Piano

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class Music {
  private explore: GainNode;
  private tension: GainNode;
  private padFilter: BiquadFilterNode;
  private voices: OscillatorNode[] = [];
  private bass: OscillatorNode | null = null;
  private chord = 0;
  private chordTimer = 0;
  private noteTimer = 3;
  private pulseTimer = 0;
  private pulseStep = 0;
  private running = false;
  layer: MusicLayer = 'silent';

  constructor(private core: AudioCore) {
    const { ctx } = core;
    this.explore = ctx.createGain();
    this.tension = ctx.createGain();
    this.explore.gain.value = 0;
    this.tension.gain.value = 0;
    // Hall-Ersatz: zwei Feedback-Delays geben den Pads Raum
    const delayL = ctx.createDelay(2);
    delayL.delayTime.value = 0.43;
    const fb = ctx.createGain();
    fb.gain.value = 0.42;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 700;
    this.padFilter.Q.value = 2;
    this.padFilter.connect(this.explore);
    this.explore.connect(core.music);
    this.explore.connect(delayL).connect(fb).connect(delayL);
    fb.connect(wet).connect(core.music);
    const tensionLp = ctx.createBiquadFilter();
    tensionLp.type = 'lowpass';
    tensionLp.frequency.value = 480;
    this.tension.connect(tensionLp).connect(core.music);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const { ctx } = this.core;
    // 4 Stimmen à 2 verstimmte Oszillatoren
    for (let i = 0; i < 8; i++) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.detune.value = (i % 2 ? 1 : -1) * (6 + Math.random() * 5);
      const g = ctx.createGain();
      g.gain.value = 0.045;
      o.connect(g).connect(this.padFilter);
      o.start();
      this.voices.push(o);
    }
    this.bass = ctx.createOscillator();
    this.bass.type = 'sine';
    const bg = ctx.createGain();
    bg.gain.value = 0.16;
    this.bass.connect(bg).connect(this.explore);
    this.bass.start();
    // Langsames "Atmen" des Filters
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 0.05;
    lfoG.gain.value = 320;
    lfo.connect(lfoG).connect(this.padFilter.frequency);
    lfo.start();
    this.setChord(0, 0.01);
  }

  private setChord(i: number, glide = 2.5): void {
    const t = this.core.now;
    const notes = CHORDS[i];
    this.voices.forEach((o, k) => o.frequency.setTargetAtTime(mtof(notes[k >> 1]), t, glide / 3));
    this.bass?.frequency.setTargetAtTime(mtof(notes[0] - 12), t, glide / 3);
  }

  setLayer(layer: MusicLayer, fade = 3): void {
    this.layer = layer;
    const t = this.core.now;
    const ex = layer === 'explore' ? 1 : layer === 'tension' ? 0.55 : layer === 'chase' ? 0.3 : 0;
    const te = layer === 'tension' ? 1 : layer === 'chase' ? 1 : 0;
    this.explore.gain.setTargetAtTime(ex, t, fade / 3);
    this.tension.gain.setTargetAtTime(te, t, fade / 3);
  }

  update(dt: number): void {
    if (!this.running) return;
    this.chordTimer += dt;
    if (this.chordTimer > 9) {
      this.chordTimer = 0;
      this.chord = (this.chord + 1) % CHORDS.length;
      this.setChord(this.chord);
    }
    // Vereinzelte E-Piano-Töne (Sinus + Oberton, langes Ausklingen)
    this.noteTimer -= dt;
    if (this.noteTimer <= 0 && this.layer === 'explore') {
      this.noteTimer = 2.5 + Math.random() * 5;
      const n = SCALE[Math.floor(Math.random() * SCALE.length)];
      this.core.tone(this.explore, { from: mtof(n), to: mtof(n) * 0.998, gain: 0.05, decay: 3.5 });
      this.core.tone(this.explore, { type: 'triangle', from: mtof(n + 12), to: mtof(n + 12), gain: 0.012, decay: 1.2 });
    }
    // Spannungsschicht: Achtel-Bass bei 92 BPM und Herzschlag
    if (this.layer === 'tension' || this.layer === 'chase') {
      const stepLen = this.layer === 'chase' ? 60 / 140 / 2 : 60 / 92 / 2;
      this.pulseTimer -= dt;
      if (this.pulseTimer <= 0) {
        this.pulseTimer += stepLen;
        const root = CHORDS[this.chord][0] - 12;
        const when = this.core.now + 0.02;
        this.core.tone(this.tension, { type: 'sawtooth', from: mtof(root), to: mtof(root) * 0.99, gain: 0.07, decay: stepLen * 0.9, when });
        if (this.pulseStep % 4 === 0) this.core.tone(this.tension, { from: 70, to: 38, gain: 0.5, decay: 0.25, when });
        if (this.pulseStep % 4 === 1) this.core.tone(this.tension, { from: 60, to: 35, gain: 0.3, decay: 0.2, when });
        this.pulseStep++;
      }
    }
  }
}
