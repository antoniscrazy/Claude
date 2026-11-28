import * as THREE from 'three';
import type { Updatable } from '../../core/Engine';

/**
 * Das riesige Hologramm-Koi gegenüber dem Büro. Geometrie: deformierte Kugel
 * (Körper) + Schwanz- und Seitenflossen. Vertex-Shader lässt den Fisch schwimmen
 * (Wellenbewegung zum Schwanz hin) und erzeugt Glitch-Versätze; Fragment-Shader:
 * Fresnel-Rand, Scanlines, Koi-Musterflecken, Flackern, additive Transparenz.
 */
const vert = /* glsl */ `
  uniform float uTime;
  uniform float uGlitch;
  varying vec3 vNrm;
  varying vec3 vView;
  varying vec3 vLocal;
  varying float vWorldY;
  float h(float x) { return fract(sin(x * 91.7) * 43758.5); }
  void main() {
    vec3 p = position;
    // x = Kopf (+) bis Schwanz (-). Wellenamplitude wächst zum Schwanz hin.
    float tail = smoothstep(0.6, -1.4, p.x);
    p.z += sin(p.x * 2.2 - uTime * 2.6) * 0.38 * tail;
    p.y += sin(uTime * 0.9) * 0.05;
    // Glitch: horizontale Bänder springen seitlich
    float band = floor((p.y + uTime * 3.0) * 6.0);
    p.x += (h(band + floor(uTime * 12.0)) - 0.5) * uGlitch * 0.8;
    vLocal = position;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWorldY = wp.y;
    vec4 mv = viewMatrix * wp;
    vView = normalize(-mv.xyz);
    vNrm = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  uniform float uTime;
  uniform float uFlicker;
  uniform vec3 uColA;
  uniform vec3 uColB;
  varying vec3 vNrm;
  varying vec3 vView;
  varying vec3 vLocal;
  varying float vWorldY;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vNrm), normalize(vView))), 2.2);
    float scan = 0.65 + 0.35 * sin(vWorldY * 9.0 - uTime * 6.0);
    float fine = 0.85 + 0.15 * sin(vWorldY * 60.0);
    // Koi-Flecken: wo das Rauschen hoch ist, kippt die Farbe zu Cyan/Weiß
    float spots = smoothstep(0.55, 0.7, n3(vLocal * 2.2 + 3.0));
    vec3 col = mix(uColA, uColB, spots * 0.7);
    col = mix(col, vec3(1.0, 0.9, 1.0), smoothstep(0.75, 1.0, fres) * 0.5);
    float a = (0.16 + fres * 0.9) * scan * fine * uFlicker;
    gl_FragColor = vec4(col * (1.2 + fres * 2.5), a);
  }
`;

export class KoiHologram implements Updatable {
  readonly group = new THREE.Group();
  readonly light: THREE.PointLight;
  private mat: THREE.ShaderMaterial;
  private fish = new THREE.Group();
  private glitchTimer = 3;
  private glitch = 0;
  private flicker = 1;

  constructor(private anchor: THREE.Vector3, scale = 7) {
    this.mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uGlitch: { value: 0 },
        uFlicker: { value: 1 },
        uColA: { value: new THREE.Color(1.0, 0.12, 0.62) },
        uColB: { value: new THREE.Color(0.35, 0.95, 1.0) },
      },
    });

    // Körper: Kugel strecken und zum Schwanz verjüngen
    const body = new THREE.SphereGeometry(1, 40, 24);
    const pos = body.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      x *= 1.6;
      const t = THREE.MathUtils.smoothstep(x, -1.6, 1.2); // 0 am Schwanz, 1 am Kopf
      const girth = 0.18 + 0.82 * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.62 + 0.25);
      y *= 0.55 * girth;
      z *= 0.4 * girth;
      if (y > 0) y *= 1.15; // Rücken höher
      pos.setXYZ(i, x, y, z);
    }
    body.computeVertexNormals();
    this.fish.add(new THREE.Mesh(body, this.mat));

    // Schwanzflosse: geschwungene Fläche, in Unterteilungen (für die Welle)
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0);
    tailShape.quadraticCurveTo(-0.9, 0.9, -1.5, 1.1);
    tailShape.quadraticCurveTo(-1.1, 0, -1.5, -1.1);
    tailShape.quadraticCurveTo(-0.9, -0.9, 0, 0);
    const tailGeo = new THREE.ShapeGeometry(tailShape, 16);
    tailGeo.translate(-1.45, 0, 0);
    this.fish.add(new THREE.Mesh(tailGeo, this.mat));

    // Seitenflossen und Rückenflosse
    const fin = new THREE.Shape();
    fin.moveTo(0, 0);
    fin.quadraticCurveTo(-0.3, -0.7, -0.8, -0.8);
    fin.quadraticCurveTo(-0.5, -0.2, 0, 0);
    const finGeo = new THREE.ShapeGeometry(fin, 8);
    for (const s of [-1, 1]) {
      const f = new THREE.Mesh(finGeo, this.mat);
      f.position.set(0.55, -0.22, s * 0.3);
      f.rotation.x = s * 0.9;
      this.fish.add(f);
    }
    const dorsal = new THREE.Mesh(finGeo, this.mat);
    dorsal.position.set(0.3, 0.6, 0);
    dorsal.rotation.z = Math.PI;
    dorsal.scale.set(1.3, 0.6, 1);
    this.fish.add(dorsal);
    // Barteln
    for (const s of [-1, 1]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.55, -0.05, s * 0.12), new THREE.Vector3(1.75, -0.2, s * 0.25), new THREE.Vector3(1.85, -0.45, s * 0.3),
      ]);
      this.fish.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.02, 4), this.mat));
    }

    this.fish.scale.setScalar(scale);
    this.group.add(this.fish);
    this.group.position.copy(anchor);

    // Projektor-Lichtkegel vom Sims zum Fisch
    const beamGeo = new THREE.ConeGeometry(scale * 1.2, scale * 2.2, 24, 1, true);
    beamGeo.translate(0, -scale * 1.1, 0);
    const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.25, 0.03, 0.15), transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide,
    }));
    beam.position.set(0, -scale * 1.4, -1);
    beam.rotation.x = Math.PI;
    this.group.add(beam);

    this.light = new THREE.PointLight(0xff2aa8, 380, 60, 1.7);
    this.light.position.set(0, 0, 4);
    this.group.add(this.light);
  }

  update(dt: number, time: number): void {
    // Langsame Schwimmbahn: Acht-Figur vor der Fassade
    const t = time * 0.12;
    const x = Math.sin(t) * 14;
    const y = Math.sin(t * 2) * 3;
    this.fish.position.set(x, y, Math.cos(t) * 2);
    const dx = Math.cos(t) * 14, dy = Math.cos(t * 2) * 6;
    this.fish.rotation.y = dx >= 0 ? 0 : Math.PI;
    this.fish.rotation.z = Math.atan2(dy, Math.abs(dx)) * 0.6;

    // Glitch-Ereignisse in unregelmäßigen Abständen
    this.glitchTimer -= dt;
    if (this.glitchTimer <= 0) {
      this.glitch = 1;
      this.glitchTimer = 2 + Math.random() * 6;
    }
    this.glitch = Math.max(0, this.glitch - dt * 4);
    this.flicker = 0.85 + Math.sin(time * 31) * 0.05 + (this.glitch > 0.5 ? -0.5 : 0);
    this.mat.uniforms.uTime.value = time;
    this.mat.uniforms.uGlitch.value = this.glitch;
    this.mat.uniforms.uFlicker.value = this.flicker;
    this.light.position.set(x, y, 4);
    this.light.intensity = 380 * this.flicker;
  }

  /** Weltposition des Fisches (für das Licht, das ins Büro fällt). */
  worldPos(out: THREE.Vector3): THREE.Vector3 {
    return out.copy(this.fish.position).add(this.anchor);
  }
}
