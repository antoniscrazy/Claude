import * as THREE from 'three';
import type { Updatable } from '../../core/Engine';
import { canvasTexture, rng } from '../../materials/Textures';

/**
 * Das Fenster ist undicht: Unter dem Sims sammelt sich eine Pfütze.
 * Ein Tropfen fällt in unregelmäßigem Takt, beim Aufprall entstehen Ringwellen,
 * die als Normalen-Störung in ein glänzendes Standard-Material injiziert werden
 * (spiegelt so die Environment-Map mit dem Neonlicht).
 */
const SLOTS = 6;

export class Puddle implements Updatable {
  readonly group = new THREE.Group();
  private uniforms = {
    uTime: { value: 0 },
    uDrops: { value: Array.from({ length: SLOTS }, () => new THREE.Vector3(0, 0, -100)) },
  };
  private slot = 0;
  private drip: THREE.Mesh;
  private dripY = 0;
  private dripWait = 0.5;
  private dripFalling = false;
  private time = 0;
  /** Aufprall-Callback für Sound (Weltposition). */
  onDrip?: (pos: THREE.Vector3) => void;

  constructor(private center: THREE.Vector3, private dripFrom: THREE.Vector3, private radius = 0.7) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x05070a, roughness: 0.03, metalness: 0.1, envMapIntensity: 1.8,
      transparent: true, alphaMap: puddleMask(), depthWrite: false,
    });
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vLocal;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position.xy;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec2 vLocal;
          uniform float uTime;
          uniform vec3 uDrops[${SLOTS}];`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          vec2 grad = vec2(0.0);
          for (int i = 0; i < ${SLOTS}; i++) {
            vec2 c = uDrops[i].xy;
            float age = uTime - uDrops[i].z;
            if (age < 0.0 || age > 2.5) continue;
            vec2 dv = vLocal - c;
            float d = length(dv) + 1e-4;
            float r = age * 0.32;
            float x = d - r;
            float wave = sin(x * 70.0) * exp(-abs(x) * 28.0) * exp(-age * 2.2);
            grad += (dv / d) * wave * 0.35;
          }
          // lokale XY → Welt-XZ (Ebene liegt flach), dann in View-Space
          normal = normalize(normal + mat3(viewMatrix) * vec3(grad.x, 0.0, -grad.y));`);
    };
    const geo = new THREE.CircleGeometry(radius, 40);
    const puddle = new THREE.Mesh(geo, mat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.scale.set(1.25, 0.75, 1);
    puddle.position.copy(center);
    puddle.receiveShadow = true;
    puddle.renderOrder = 2;
    this.group.add(puddle);

    this.drip = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xaad8ff, roughness: 0, emissive: 0x335577, emissiveIntensity: 0.6 }),
    );
    this.drip.scale.y = 1.8;
    this.drip.visible = false;
    this.group.add(this.drip);
  }

  /** Ripple an lokaler Position (in Pfützen-Koordinaten, ungeskaliert) auslösen. */
  private ripple(x: number, y: number): void {
    this.uniforms.uDrops.value[this.slot].set(x, y, this.time);
    this.slot = (this.slot + 1) % SLOTS;
  }

  update(dt: number, time: number): void {
    this.time = time;
    this.uniforms.uTime.value = time;

    if (!this.dripFalling) {
      this.dripWait -= dt;
      if (this.dripWait <= 0) {
        this.dripFalling = true;
        this.dripY = this.dripFrom.y;
        this.drip.visible = true;
      }
    } else {
      this.dripY -= dt * 4.2;
      this.drip.position.set(this.dripFrom.x, this.dripY, this.dripFrom.z);
      if (this.dripY <= this.center.y) {
        this.dripFalling = false;
        this.drip.visible = false;
        this.dripWait = 0.9 + Math.random() * 1.1;
        const lx = (this.dripFrom.x - this.center.x) / 1.25;
        const ly = -(this.dripFrom.z - this.center.z) / 0.75;
        this.ripple(lx, ly);
        this.onDrip?.(this.drip.position);
        // Gelegentlich ein Nachtropfen an anderer Stelle
        if (Math.random() < 0.3) {
          setTimeout(() => this.ripple((Math.random() - 0.5) * this.radius, (Math.random() - 0.5) * this.radius), 250);
        }
      }
    }
  }
}

/** Unregelmäßiger Rand der Pfütze als Alpha-Maske. */
function puddleMask(): THREE.Texture {
  return canvasTexture('puddleMask', 256, 256, (ctx, w, h) => {
    const r = rng(42);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) {
      const x = w / 2 + (r() - 0.5) * w * 0.5, y = h / 2 + (r() - 0.5) * h * 0.5;
      const rad = w * (0.15 + r() * 0.22);
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.7, 'rgba(255,255,255,0.9)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  }, false);
}
