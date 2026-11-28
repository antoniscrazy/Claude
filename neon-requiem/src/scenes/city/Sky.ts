import * as THREE from 'three';
import type { Updatable } from '../../core/Engine';

/**
 * Himmelskuppel: blauschwarz oben, Lichtverschmutzung (Magenta/Natriumorange)
 * am Horizont, ziehende Wolkendecke. Blitze hellen die Wolken von innen auf.
 */
const vert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww; // immer auf der Fernebene
  }
`;

const frag = /* glsl */ `
  uniform float uTime;
  uniform float uFlash;
  uniform vec2 uFlashDir;
  varying vec3 vDir;
  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p) { float v = 0., a = .5; for (int i = 0; i < 5; i++) { v += a * n(p); p *= 2.03; a *= .5; } return v; }
  void main() {
    vec3 d = normalize(vDir);
    float up = clamp(d.y, -0.2, 1.0);
    vec3 top = vec3(0.008, 0.01, 0.025);
    vec3 horizon = vec3(0.11, 0.035, 0.09);
    vec3 sodium = vec3(0.16, 0.07, 0.02);
    vec3 col = mix(horizon, top, smoothstep(0.0, 0.55, up));
    col += sodium * exp(-max(up, 0.) * 14.);
    // Wolken: Projektion auf eine Ebene über der Stadt
    vec2 cuv = d.xz / max(d.y + 0.08, 0.05) * 1.6;
    float cl = fbm(cuv + vec2(uTime * 0.012, uTime * 0.004));
    float dense = smoothstep(0.35, 0.85, cl);
    vec3 cloudCol = mix(vec3(0.05, 0.02, 0.05), vec3(0.16, 0.06, 0.12), smoothstep(0.3, 0.0, up));
    col = mix(col, cloudCol, dense * smoothstep(-0.05, 0.25, up) * 0.85);
    // Blitz: von innen beleuchtete Wolken nahe der Blitzrichtung
    float near = exp(-length(d.xz - uFlashDir) * 2.2);
    col += vec3(0.55, 0.6, 0.85) * uFlash * (dense * 0.9 + 0.15) * (0.4 + near * 1.6);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export class Sky implements Updatable {
  readonly mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;

  constructor() {
    this.mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uFlash: { value: 0 }, uFlashDir: { value: new THREE.Vector2(0, -1) } },
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), this.mat);
    this.mesh.renderOrder = -10;
    this.mesh.frustumCulled = false;
  }

  setFlash(v: number, dir?: THREE.Vector2): void {
    this.mat.uniforms.uFlash.value = v;
    if (dir) this.mat.uniforms.uFlashDir.value.copy(dir);
  }

  update(_dt: number, time: number): void {
    this.mat.uniforms.uTime.value = time;
  }
}
