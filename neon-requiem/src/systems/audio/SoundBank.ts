import * as THREE from 'three';
import type { AudioCore } from './AudioCore';

/**
 * Konkrete, synthetisierte Klänge des Büros:
 * Regenteppich (gedämpft), Regen auf Glas (räumlich, mit Einzeltropfen),
 * Neonsummen, Ventilator, Kühlschrank, Tropfen in die Pfütze, Schritte auf Holz,
 * Donner, entfernte Sirenen und das Hämmern an der Tür.
 */
export class SoundBank {
  private emitters = new Map<string, { audio: THREE.PositionalAudio; input: GainNode }>();
  private tickTimer = 0;
  private sirenTimer = 25;
  private started = false;

  constructor(private core: AudioCore) {}

  /** Erstellt einen räumlichen Emitter und hängt ihn an ein Objekt / eine Position. */
  place(name: string, parent: THREE.Object3D, pos: THREE.Vector3, ref = 1.5, roll = 1.2): GainNode {
    const e = this.core.emitter(ref, roll);
    e.audio.position.copy(pos);
    parent.add(e.audio);
    this.emitters.set(name, e);
    return e.input;
  }

  input(name: string): GainNode | undefined {
    return this.emitters.get(name)?.input;
  }

  /** Startet alle Dauer-Klänge. Aufruf nach Nutzergeste. */
  startAmbience(): void {
    if (this.started) return;
    this.started = true;
    const { ctx } = this.core;

    // 1) Gedämpfter Regenteppich (nicht räumlich): braunes + rosa Rauschen, Tiefpass
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.22;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    this.core.loopNoise('brown').connect(lp);
    const pinkBed = ctx.createGain();
    pinkBed.gain.value = 0.35;
    this.core.loopNoise('pink').connect(pinkBed).connect(lp);
    lp.connect(bedGain).connect(this.core.sfx);

    // 2) Regen am Glas (räumlich am Fenster): helleres Rauschen mit langsamem Schwanken
    const glass = this.input('window');
    if (glass) {
      const hp = ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.value = 2400;
      hp.Q.value = 0.5;
      const g = ctx.createGain();
      g.gain.value = 0.32;
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      lfo.frequency.value = 0.13;
      lfoG.gain.value = 0.08;
      lfo.connect(lfoG).connect(g.gain);
      lfo.start();
      this.core.loopNoise('pink').connect(hp).connect(g).connect(glass);
    }

    // 3) Neon-Summen (Schild "OFFEN" im Fenster)
    const hum = this.input('neon');
    if (hum) {
      const g = ctx.createGain();
      g.gain.value = 0.028;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 520;
      for (const [freq, type] of [[100, 'sawtooth'], [50, 'sine'], [200.6, 'square']] as const) {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = freq;
        o.connect(f);
        o.start();
      }
      f.connect(g).connect(hum);
    }

    // 4) Ventilator: tiefes Rauschen, rhythmisch durch die Blätter moduliert
    const fan = this.input('fan');
    if (fan) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 260;
      const g = ctx.createGain();
      g.gain.value = 0.22;
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      lfo.frequency.value = (1.6 * 4) / (Math.PI * 2); // 4 Blätter bei 1,6 rad/s ≈ 1 Hz
      lfoG.gain.value = 0.1;
      lfo.connect(lfoG).connect(g.gain);
      lfo.start();
      this.core.loopNoise('brown').connect(f).connect(g).connect(fan);
    }

    // 5) Kühlschrank-Brummen
    const fridge = this.input('fridge');
    if (fridge) {
      const o = ctx.createOscillator();
      o.frequency.value = 55;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      o.connect(g).connect(fridge);
      o.start();
    }
  }

  /** Pro Frame: einzelne Tropfen am Glas, gelegentlich eine Sirene in der Ferne. */
  update(dt: number): void {
    if (!this.started) return;
    const glass = this.input('window');
    this.tickTimer -= dt;
    if (glass && this.tickTimer <= 0) {
      this.tickTimer = 0.03 + Math.random() * 0.12;
      this.core.burst(glass, { type: 'bandpass', freq: 2500 + Math.random() * 3500, q: 6, gain: 0.04 + Math.random() * 0.06, decay: 0.025 });
    }
    this.sirenTimer -= dt;
    if (this.sirenTimer <= 0) {
      this.sirenTimer = 45 + Math.random() * 60;
      this.siren();
    }
  }

  drip(): void {
    const d = this.input('puddle');
    if (!d) return;
    this.core.tone(d, { from: 1400 + Math.random() * 500, to: 380, gain: 0.12, decay: 0.07 });
    this.core.burst(d, { type: 'highpass', freq: 3000, gain: 0.05, decay: 0.03 });
  }

  step(intensity: number): void {
    const s = this.input('steps');
    if (!s) return;
    this.core.burst(s, { color: 'pink', freq: 900 + intensity * 900, gain: 0.25 * intensity + 0.05, decay: 0.09 });
    this.core.tone(s, { from: 140, to: 70, gain: 0.12 * intensity, decay: 0.08 });
    // alte Dielen knarzen manchmal
    if (Math.random() < 0.12) {
      this.core.tone(s, { type: 'sawtooth', from: 220 + Math.random() * 80, to: 160, gain: 0.015, decay: 0.35, when: this.core.now + 0.05 });
    }
  }

  /** Donner: Krachen (falls nah) und langes Grollen; Verzögerung = Entfernung. */
  thunder(strength: number, delay: number): void {
    const { ctx } = this.core;
    const t = this.core.now + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.core.noiseBuffer('brown');
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(900 * strength + 200, t);
    f.frequency.exponentialRampToValueAtTime(90, t + 4.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.9 * strength, t + 0.08);
    g.gain.setTargetAtTime(0.5 * strength, t + 0.3, 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 6);
    src.connect(f).connect(g).connect(this.core.sfx);
    src.start(t);
    src.stop(t + 6.2);
    if (strength > 0.75) this.core.burst(this.core.sfx, { color: 'white', freq: 2500, gain: 0.25 * strength, decay: 0.35, when: t });
  }

  private siren(): void {
    const { ctx } = this.core;
    const t = this.core.now;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    const pan = ctx.createStereoPanner();
    pan.pan.setValueAtTime(Math.random() * 2 - 1, t);
    pan.pan.linearRampToValueAtTime(Math.random() * 2 - 1, t + 9);
    for (let i = 0; i < 9; i++) {
      o.frequency.setValueAtTime(640, t + i);
      o.frequency.linearRampToValueAtTime(880, t + i + 0.5);
      o.frequency.linearRampToValueAtTime(640, t + i + 1);
    }
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.03, t + 2);
    g.gain.linearRampToValueAtTime(0, t + 9);
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.32;
    const fb = ctx.createGain();
    fb.gain.value = 0.35;
    o.connect(f).connect(g).connect(pan);
    pan.connect(this.core.sfx);
    pan.connect(delay).connect(fb).connect(delay);
    fb.connect(this.core.sfx);
    o.start(t);
    o.stop(t + 9.2);
  }

  /** Schweres Hämmern an der Tür: Muster aus Schlaggruppen. */
  knock(pattern: number[] = [0, 0.32, 0.62, 1.6, 1.85, 2.1, 2.35]): void {
    const d = this.input('door');
    if (!d) return;
    const t0 = this.core.now;
    pattern.forEach((dt, i) => {
      const when = t0 + dt;
      const k = i > 2 ? 1 : 0.85;
      this.core.burst(d, { color: 'brown', freq: 320, gain: 1.1 * k, decay: 0.22, when });
      this.core.tone(d, { from: 95, to: 48, gain: 0.7 * k, decay: 0.2, when });
      this.core.burst(d, { type: 'bandpass', freq: 900, q: 3, gain: 0.25 * k, decay: 0.12, when: when + 0.01 }); // Türblatt rasselt
    });
  }
}
