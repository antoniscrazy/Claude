import * as THREE from 'three';
import { softSprite } from '../materials/Textures';
import { settings } from '../core/Settings';

/**
 * Kleiner Partikel-Emitter für Dampf und Rauch (Kaffee, Aschenbecher, Gullis,
 * Abluft der Ramen-Bar). Wenige hundert Partikel, CPU-simuliert, als Points gerendert.
 * Die Anzahl skaliert mit dem Grafik-Preset.
 */
export interface EmitterOpts {
  origin: THREE.Vector3;
  count: number;
  life: number;          // Sekunden
  rise: number;          // m/s nach oben
  spread: number;        // Startradius
  drift: THREE.Vector3;  // Wind
  size: [number, number];// Start- und Endgröße (Welt-Einheiten)
  color: THREE.ColorRepresentation;
  opacity: number;
  additive?: boolean;
}

const vert = /* glsl */ `
  attribute float aAge;
  attribute float aSize;
  varying float vAge;
  uniform float uScale;
  void main() {
    vAge = aAge;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAge;
  void main() {
    vec4 t = texture2D(uMap, gl_PointCoord);
    // Einblenden am Anfang, Ausblenden am Ende der Lebenszeit
    float a = smoothstep(0.0, 0.15, vAge) * (1.0 - smoothstep(0.55, 1.0, vAge));
    gl_FragColor = vec4(uColor, t.a * a * uOpacity);
    if (gl_FragColor.a < 0.003) discard;
  }
`;

export class SmokeEmitter {
  /** Höhe des Zeichenpuffers in Pixeln (vom Engine-Resize gesetzt) für korrekte Punktgröße. */
  static viewportHeight = 800;
  readonly points: THREE.Points;
  private pos: Float32Array;
  private vel: Float32Array;
  private age: Float32Array;
  private size: Float32Array;
  private seeds: Float32Array;
  private n: number;
  private mat: THREE.ShaderMaterial;

  constructor(private o: EmitterOpts) {
    this.n = Math.max(4, Math.round(o.count * settings.preset.particles));
    this.pos = new Float32Array(this.n * 3);
    this.vel = new Float32Array(this.n * 3);
    this.age = new Float32Array(this.n);
    this.size = new Float32Array(this.n);
    this.seeds = new Float32Array(this.n);
    for (let i = 0; i < this.n; i++) {
      this.seeds[i] = Math.random();
      this.respawn(i);
      this.age[i] = Math.random(); // vorgewärmt, damit nicht alle gleichzeitig starten
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('aAge', new THREE.BufferAttribute(this.age, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    this.mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: {
        uMap: { value: softSprite() },
        uColor: { value: new THREE.Color(o.color) },
        uOpacity: { value: o.opacity },
        uScale: { value: SmokeEmitter.viewportHeight },
      },
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
  }

  private respawn(i: number): void {
    const a = Math.random() * Math.PI * 2, r = Math.random() * this.o.spread;
    this.pos[i * 3] = this.o.origin.x + Math.cos(a) * r;
    this.pos[i * 3 + 1] = this.o.origin.y;
    this.pos[i * 3 + 2] = this.o.origin.z + Math.sin(a) * r;
    this.vel[i * 3] = (Math.random() - 0.5) * 0.05;
    this.vel[i * 3 + 1] = this.o.rise * (0.7 + Math.random() * 0.6);
    this.vel[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    this.age[i] = 0;
  }

  update(dt: number, time: number): void {
    const { life, drift, size } = this.o;
    this.mat.uniforms.uScale.value = SmokeEmitter.viewportHeight;
    for (let i = 0; i < this.n; i++) {
      this.age[i] += dt / life;
      if (this.age[i] >= 1) this.respawn(i);
      const s = this.seeds[i];
      // Leichte Verwirbelung, damit der Dampf "lebt"
      const curl = Math.sin(time * 1.3 + s * 40 + this.age[i] * 6) * 0.06;
      this.pos[i * 3] += (this.vel[i * 3] + drift.x + curl) * dt;
      this.pos[i * 3 + 1] += (this.vel[i * 3 + 1] + drift.y) * dt;
      this.pos[i * 3 + 2] += (this.vel[i * 3 + 2] + drift.z + curl * 0.6) * dt;
      this.size[i] = THREE.MathUtils.lerp(size[0], size[1], this.age[i]);
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aAge.needsUpdate = true;
    g.attributes.aSize.needsUpdate = true;
  }
}
