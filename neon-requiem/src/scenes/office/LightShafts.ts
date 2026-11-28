import * as THREE from 'three';
import type { Updatable } from '../../core/Engine';
import { settings } from '../../core/Settings';
import { WINDOW } from './Room';

/**
 * Volumetrische Lichtkegel durch das Fenster (Fake-Volumen): offene Kegelstümpfe
 * mit additivem Shader, der zu den Rändern (über die Blickrichtung) und zum Ende
 * hin ausblendet, plus wandernder Staub-Noise. Dazu Staubpartikel im Licht.
 * Auf "Niedrig" abgeschaltet.
 */
const vert = /* glsl */ `
  varying float vLen;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    vLen = uv.y;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vec4 mv = viewMatrix * w;
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uIntensity;
  varying float vLen;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  float h(vec3 p) { return fract(sin(dot(p, vec3(17.1, 31.7, 11.3))) * 43758.5); }
  void main() {
    float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
    // uv.y = 1 am Fenster, 0 am Boden: stark am Fenster, weich auslaufend
    float along = smoothstep(0.0, 0.7, vLen) * smoothstep(1.0, 0.92, vLen);
    float dust = 0.75 + 0.25 * sin(vW.x * 3.1 + vW.y * 2.3 + uTime * 0.4) * sin(vW.z * 2.7 - uTime * 0.3);
    gl_FragColor = vec4(uColor * edge * along * dust * uIntensity, 1.0);
  }
`;

interface Shaft { mesh: THREE.Mesh; mat: THREE.ShaderMaterial; base: number; flicker: number }

export class LightShafts implements Updatable {
  readonly group = new THREE.Group();
  private shafts: Shaft[] = [];
  private dust: THREE.Points;
  /** Wird vom Koi-Flackern gesteuert. */
  koiLevel = 1;

  constructor() {
    const cy = (WINDOW.minY + WINDOW.maxY) / 2;
    // Magenta vom Koi (schräg von links oben), Cyan vom Club-Schild (flach von rechts)
    this.add(new THREE.Vector3(-0.8, cy + 0.6, WINDOW.z), new THREE.Vector3(0.6, 0.0, -0.6), 1.3, 2.6, 0xff2aa8, 0.06, 1);
    this.add(new THREE.Vector3(2.9, cy, WINDOW.z), new THREE.Vector3(1.6, 0.2, 0.5), 1.0, 2.0, 0x30d8ff, 0.05, 0);
    this.add(new THREE.Vector3(-2.9, cy + 0.2, WINDOW.z), new THREE.Vector3(-3.4, 0.0, -1.5), 0.9, 1.7, 0xff4ab8, 0.035, 1);

    // Staubpartikel, die langsam im Licht schweben
    const n = Math.round(260 * settings.preset.particles);
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 1] = Math.random() * 2.8;
      pos[i * 3 + 2] = -3.9 + Math.random() * 3.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(geo, new THREE.PointsMaterial({
      color: new THREE.Color(1.2, 0.8, 1.1), size: 0.012, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.group.add(this.dust);
    this.group.visible = settings.preset.volumetrics;
  }

  private add(from: THREE.Vector3, to: THREE.Vector3, r0: number, r1: number, color: number, intensity: number, flicker: number): void {
    const len = from.distanceTo(to);
    const geo = new THREE.CylinderGeometry(r0, r1, len, 4, 1, true);
    geo.rotateY(Math.PI / 4);
    geo.translate(0, -len / 2, 0);
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uIntensity: { value: intensity } },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(from);
    // Zylinderachse (-Y nach translate) zum Ziel ausrichten
    const dir = to.clone().sub(from).normalize();
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
    mesh.renderOrder = 6;
    this.group.add(mesh);
    this.shafts.push({ mesh, mat, base: intensity, flicker });
  }

  setEnabled(on: boolean): void {
    this.group.visible = on;
  }

  update(dt: number, time: number): void {
    if (!this.group.visible) return;
    for (const s of this.shafts) {
      s.mat.uniforms.uTime.value = time;
      s.mat.uniforms.uIntensity.value = s.base * (s.flicker ? this.koiLevel : 1);
    }
    const p = this.dust.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) + Math.sin(time * 0.3 + i) * dt * 0.02 - dt * 0.01;
      if (y < 0) y = 2.8;
      p.setY(i, y);
      p.setX(i, p.getX(i) + Math.cos(time * 0.2 + i * 0.7) * dt * 0.015);
    }
    p.needsUpdate = true;
  }
}
