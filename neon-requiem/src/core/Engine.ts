import * as THREE from 'three';
import { PostFX } from './PostFX';
import { settings } from './Settings';
import { events } from './Events';

/** Alles, was pro Frame aktualisiert wird, implementiert dieses Interface. */
export interface Updatable {
  update(dt: number, time: number): void;
}

/**
 * Renderer, Kamera, Hauptschleife, Größenanpassung und Preset-Anwendung.
 * Der Render-Loop läuft immer (auch im Menü), die Spiellogik kann pausiert werden.
 */
export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly post: PostFX;
  private timer = new THREE.Timer();
  private updatables = new Set<Updatable>();
  private elapsed = 0;
  /** Wenn true, bekommen nur 'always'-Objekte Updates (Pause-Menü). */
  paused = false;
  private alwaysUpdate = new Set<Updatable>();
  fps = 60;
  private fpsAcc = 0;
  private fpsFrames = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, stencil: false, depth: true,
      powerPreference: 'high-performance',
    });
    // Tonemapping übernimmt die Postprocessing-Kette.
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.05, 900);
    this.post = new PostFX(this.renderer, this.scene, this.camera);

    window.addEventListener('resize', () => this.resize());
    events.on('preset:changed', () => this.applyPreset());
    this.applyPreset();
  }

  /** Überträgt das aktive Grafik-Preset auf den Renderer. */
  applyPreset(): void {
    const p = settings.preset;
    this.renderer.shadowMap.enabled = p.shadows;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, p.pixelRatio) * p.renderScale);
    this.post.rebuild();
    // Schatten-Materialien müssen neu kompiliert werden, wenn sich shadowMap.enabled ändert.
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (!m) return;
      (Array.isArray(m) ? m : [m]).forEach((mat) => (mat.needsUpdate = true));
    });
    this.resize();
  }

  resize(): void {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.post.setSize(w, h);
  }

  add(u: Updatable, always = false): void {
    (always ? this.alwaysUpdate : this.updatables).add(u);
  }

  remove(u: Updatable): void {
    this.updatables.delete(u);
    this.alwaysUpdate.delete(u);
  }

  start(onFrame?: (dt: number) => void): void {
    this.renderer.setAnimationLoop((timestamp) => {
      this.timer.update(timestamp);
      // Begrenzen, damit ein Tab-Wechsel keine riesigen Sprünge erzeugt.
      const dt = Math.min(this.timer.getDelta(), 0.05);
      this.elapsed += dt;
      this.alwaysUpdate.forEach((u) => u.update(dt, this.elapsed));
      if (!this.paused) this.updatables.forEach((u) => u.update(dt, this.elapsed));
      onFrame?.(dt);
      this.post.render(dt);
      this.measure(dt);
    });
  }

  private measure(dt: number): void {
    this.fpsAcc += dt;
    this.fpsFrames++;
    if (this.fpsAcc >= 0.5) {
      this.fps = this.fpsFrames / this.fpsAcc;
      this.fpsAcc = 0;
      this.fpsFrames = 0;
    }
  }

  get time(): number {
    return this.elapsed;
  }
}
