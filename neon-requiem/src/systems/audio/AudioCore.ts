import * as THREE from 'three';
import { settings } from '../../core/Settings';
import { events } from '../../core/Events';

/**
 * Audio-Grundgerüst: THREE.AudioListener an der Kamera, Busse für Musik/Effekte/Stimme,
 * Rauschpuffer und "Emitter" (PositionalAudio mit Eingangsknoten), in die beliebig
 * viele synthetisierte Klänge eingespeist werden können.
 */
export type NoiseColor = 'white' | 'pink' | 'brown';

export class AudioCore {
  readonly listener: THREE.AudioListener;
  readonly ctx: AudioContext;
  readonly music: GainNode;
  readonly sfx: GainNode;
  readonly voice: GainNode;
  private noise = new Map<NoiseColor, AudioBuffer>();

  constructor(camera: THREE.Camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    this.ctx = this.listener.context;
    const out = this.listener.getInput();
    this.music = this.ctx.createGain();
    this.sfx = this.ctx.createGain();
    this.voice = this.ctx.createGain();
    // Sanfter Limiter am Ende, damit Donner + Musik nicht übersteuern
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.ratio.value = 6;
    [this.music, this.sfx, this.voice].forEach((b) => b.connect(comp));
    comp.connect(out);
    this.applyVolumes();
    events.on('settings:changed', () => this.applyVolumes());
  }

  applyVolumes(): void {
    const s = settings.data;
    this.listener.setMasterVolume(s.volMaster);
    const t = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(s.volMusic, t, 0.1);
    this.sfx.gain.setTargetAtTime(s.volSfx, t, 0.1);
    this.voice.gain.setTargetAtTime(s.volVoice, t, 0.1);
  }

  /** Browser verlangen eine Nutzergeste, bevor Audio starten darf. */
  async resume(): Promise<void> {
    try {
      if (this.ctx.state !== 'running') await this.ctx.resume();
    } catch { /* ignorieren: dann eben ohne Ton */ }
  }

  get now(): number {
    return this.ctx.currentTime;
  }

  noiseBuffer(color: NoiseColor, seconds = 4): AudioBuffer {
    const hit = this.noise.get(color);
    if (hit) return hit;
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (color === 'white') d[i] = w * 0.5;
      else if (color === 'pink') {
        b0 = 0.997 * b0 + w * 0.029591;
        b1 = 0.985 * b1 + w * 0.032534;
        b2 = 0.95 * b2 + w * 0.048056;
        d[i] = (b0 + b1 + b2 + w * 0.05) * 1.6;
      } else {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    }
    this.noise.set(color, buf);
    return buf;
  }

  /** Endlos laufende Rauschquelle. */
  loopNoise(color: NoiseColor): AudioBufferSourceNode {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer(color);
    src.loop = true;
    src.loopStart = Math.random();
    src.start(0, Math.random() * 3);
    return src;
  }

  /** Räumlicher Emitter: Szene-Objekt, dessen `input` man beliebig speisen kann. */
  emitter(refDistance = 1.5, rolloff = 1.2, maxDistance = 40): { audio: THREE.PositionalAudio; input: GainNode } {
    const audio = new THREE.PositionalAudio(this.listener);
    const input = this.ctx.createGain();
    audio.setNodeSource(input as unknown as AudioBufferSourceNode);
    audio.setRefDistance(refDistance);
    audio.setRolloffFactor(rolloff);
    audio.setMaxDistance(maxDistance);
    audio.setDistanceModel('inverse');
    // Auf den SFX-Bus umleiten statt direkt auf den Listener
    audio.gain.disconnect();
    audio.gain.connect(this.sfx);
    return { audio, input };
  }

  /** Kurzer Rauschimpuls mit Filter und Hüllkurve (Basis für Klopfen, Schritte, Tropfen). */
  burst(dest: AudioNode, opts: { color?: NoiseColor; type?: BiquadFilterType; freq: number; q?: number; gain: number; attack?: number; decay: number; when?: number }): void {
    const t = (opts.when ?? this.now);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer(opts.color ?? 'white');
    const f = this.ctx.createBiquadFilter();
    f.type = opts.type ?? 'lowpass';
    f.frequency.value = opts.freq;
    f.Q.value = opts.q ?? 0.8;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(opts.gain, t + (opts.attack ?? 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + (opts.attack ?? 0.004) + opts.decay);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 2);
    src.stop(t + opts.decay + 0.1);
  }

  /** Kurzer Ton mit Tonhöhen-Sweep (Tropfen, Dumpfer Schlag). */
  tone(dest: AudioNode, opts: { type?: OscillatorType; from: number; to: number; gain: number; decay: number; when?: number }): void {
    const t = opts.when ?? this.now;
    const o = this.ctx.createOscillator();
    o.type = opts.type ?? 'sine';
    o.frequency.setValueAtTime(opts.from, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, opts.to), t + opts.decay);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(opts.gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.decay);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + opts.decay + 0.05);
  }
}
