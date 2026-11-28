import * as THREE from 'three';
import {
  EffectComposer, RenderPass, EffectPass, BloomEffect, ChromaticAberrationEffect,
  NoiseEffect, VignetteEffect, SMAAEffect, SMAAPreset, ToneMappingEffect, ToneMappingMode,
  BlendFunction, SSAOEffect, NormalPass, type Pass,
} from 'postprocessing';
import { settings } from './Settings';

/**
 * Postprocessing-Kette: Bloom für Neon, Tonemapping (AgX), chromatische Aberration,
 * SMAA, Vignette und Filmkorn. SSAO optional (nur wenn in den Optionen aktiv).
 * Wird beim Preset-Wechsel komplett neu aufgebaut – das ist günstig und vermeidet Zustandsfehler.
 */
export class PostFX {
  composer: EffectComposer;
  private bloom?: BloomEffect;
  private chroma?: ChromaticAberrationEffect;
  private vignette?: VignetteEffect;
  private noise?: NoiseEffect;
  /** Zusätzlicher Bloom-Schub (z. B. bei Blitzen). */
  flash = 0;
  /** 0..1: Stärke des Cyberauge-Scans (färbt Vignette und erhöht Aberration). */
  scan = 0;

  constructor(renderer: THREE.WebGLRenderer, private scene: THREE.Scene, private camera: THREE.PerspectiveCamera) {
    this.composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
    this.rebuild();
  }

  rebuild(): void {
    const p = settings.preset;
    this.composer.removeAllPasses();
    const passes: Pass[] = [new RenderPass(this.scene, this.camera)];

    if (settings.data.ssao && settings.data.preset !== 'low') {
      const normalPass = new NormalPass(this.scene, this.camera);
      const ssao = new SSAOEffect(this.camera, normalPass.texture, {
        blendFunction: BlendFunction.MULTIPLY,
        samples: 11, rings: 4, radius: 0.08, intensity: 1.6,
        luminanceInfluence: 0.6, resolutionScale: 0.5, bias: 0.03, fade: 0.02,
        worldDistanceThreshold: 30, worldDistanceFalloff: 5,
        worldProximityThreshold: 0.6, worldProximityFalloff: 0.3,
      });
      passes.push(normalPass, new EffectPass(this.camera, ssao));
    }

    this.bloom = new BloomEffect({
      intensity: 1.35, luminanceThreshold: 0.62, luminanceSmoothing: 0.25,
      mipmapBlur: p.bloomMips, radius: 0.72, levels: p.bloomMips ? 7 : 4,
    });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.AGX });
    passes.push(new EffectPass(this.camera, this.bloom, tone));

    if (p.chromatic) {
      this.chroma = new ChromaticAberrationEffect({
        offset: new THREE.Vector2(0.0009, 0.0006), radialModulation: true, modulationOffset: 0.3,
      });
      passes.push(new EffectPass(this.camera, this.chroma));
    } else {
      this.chroma = undefined;
    }

    this.vignette = new VignetteEffect({ darkness: 0.62, offset: 0.28 });
    this.noise = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: false });
    this.noise.blendMode.opacity.value = p.grain ? 0.13 : 0;
    const finals = p.smaa
      ? [new SMAAEffect({ preset: SMAAPreset.MEDIUM }), this.vignette, this.noise]
      : [this.vignette, this.noise];
    passes.push(new EffectPass(this.camera, ...finals));

    passes.forEach((pass) => this.composer.addPass(pass));
  }

  setSize(w: number, h: number): void {
    this.composer.setSize(w, h, false);
  }

  render(dt: number): void {
    if (this.bloom) this.bloom.intensity = 1.35 + this.flash * 1.2 + this.scan * 0.4;
    if (this.chroma) {
      const k = 1 + this.scan * 2.5;
      this.chroma.offset.set(0.0009 * k, 0.0006 * k);
    }
    if (this.vignette) this.vignette.darkness = 0.62 + this.scan * 0.2;
    this.composer.render(dt);
  }

  dispose(): void {
    this.composer.dispose();
  }
}
