import * as THREE from 'three';
import type { Updatable } from '../../core/Engine';
import { WINDOW } from './Room';

/**
 * Regen an der Panoramascheibe: prozeduraler Shader mit statischen Perlen,
 * herablaufenden Tropfen samt Spur und einer Schmutzschicht. Die Tropfen
 * "brechen" das Neonlicht der Stadt, indem sie Farben aus einem Gradienten
 * der Außenbeleuchtung aufnehmen. Kein Screen-Space-Pass nötig → billig.
 */
const vert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const frag = /* glsl */ `
  uniform float uTime;
  uniform vec2 uAspect;
  uniform float uFlash;
  uniform vec3 uTintA;
  uniform vec3 uTintB;
  varying vec2 vUv;
  varying vec3 vWorld;

  float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  vec3 h31(float p) { vec3 p3 = fract(vec3(p) * vec3(.1031, .11369, .13787)); p3 += dot(p3, p3.yzx + 19.19); return fract(vec3((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x)); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }

  // Eine Schicht laufender Tropfen. Rückgabe: x = Tropfen, y = Spur
  vec2 drops(vec2 uv, float t) {
    vec2 a = vec2(6., 1.);
    vec2 grid = a * 2.;
    vec2 id = floor(uv * grid);
    float colShift = h21(vec2(id.x, 7.));
    uv.y += colShift;
    id = floor(uv * grid);
    vec3 n = h31(id.x * 35.2 + id.y * 2376.1);
    vec2 st = fract(uv * grid) - vec2(.5, 0);
    float x = n.x - .5;
    float y = uv.y * 20.;
    float wiggle = sin(y + sin(y));
    x += wiggle * (.5 - abs(x)) * (n.z - .5);
    x *= .7;
    float ti = fract(t + n.z);
    y = (smoothstep(0., .85, ti) * smoothstep(1., .85, ti) - .5) * .9 + .5;
    vec2 p = vec2(x, y);
    float d = length((st - p) * a.yx);
    float mainDrop = smoothstep(.4, .0, d);
    float r = sqrt(smoothstep(1., y, st.y));
    float cd = abs(st.x - x);
    float trail = smoothstep(.23 * r, .15 * r * r, cd);
    float trailFront = smoothstep(-.02, .02, st.y - y);
    trail *= trailFront * r * r;
    // Kleine Restperlen entlang der Spur
    y = fract(uv.y * 10.) + (st.y - .5);
    float dd = length(st - vec2(x, y));
    float droplets = smoothstep(.3, 0., dd);
    return vec2(mainDrop + droplets * r * trailFront, trail);
  }

  // Statische Perlen, die kurz aufblitzen und wieder verdunsten
  float staticDrops(vec2 uv, float t) {
    uv *= 40.;
    vec2 id = floor(uv);
    uv = fract(uv) - .5;
    vec3 n = h31(id.x * 107.45 + id.y * 3543.654);
    vec2 p = (n.xy - .5) * .7;
    float d = length(uv - p);
    float fade = smoothstep(0., .025, fract(t * .1 + n.z)) * smoothstep(1., .025, fract(t * .1 + n.z));
    return smoothstep(.3, 0., d) * fract(n.z * 10.) * fade;
  }

  void main() {
    vec2 uv = vUv * uAspect;
    float t = uTime * .18;
    float s = staticDrops(uv, uTime);
    vec2 l1 = drops(uv * .9, t);
    vec2 l2 = drops(uv * 1.6 + 3.1, t * 1.3);
    float c = s + l1.x + l2.x;
    c = smoothstep(.3, 1., c);
    float trails = max(l1.y, l2.y);

    // Schmutz: fleckig, unten dichter
    float dirt = noise(vUv * vec2(18., 9.)) * .6 + noise(vUv * 60.) * .4;
    dirt = smoothstep(.45, .9, dirt) * (0.5 + (1. - vUv.y) * .7);

    // Farbe der Außenwelt, die in den Tropfen gebrochen wird
    float side = smoothstep(.0, 1., vUv.x + sin(vUv.y * 3. + uTime * .2) * .1);
    vec3 neon = mix(uTintA, uTintB, side);
    // Tropfen: dunkler Körper, helle Lichtkante oben (wirkt wie Brechung)
    float body = smoothstep(.0, .5, c);
    float rim = smoothstep(.55, .95, c) * (1. - smoothstep(.95, 1.2, c));
    vec3 col = neon * (body * .35 + rim * .9 + trails * .12) + vec3(.6, .7, .85) * uFlash * body;
    col += vec3(.04, .045, .05) * dirt;
    float alpha = clamp(.05 + body * .22 + rim * .25 + trails * .06 + dirt * .2 + uFlash * .04, 0., .6);
    gl_FragColor = vec4(col, alpha);
  }
`;

export class WindowGlass implements Updatable {
  readonly mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  flash = 0;

  constructor() {
    const w = WINDOW.maxX - WINDOW.minX, h = WINDOW.maxY - WINDOW.minY;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uAspect: { value: new THREE.Vector2(w / h, 1).multiplyScalar(2.4) },
        uFlash: { value: 0 },
        uTintA: { value: new THREE.Color(0xff3cc8) },
        uTintB: { value: new THREE.Color(0x30e8ff) },
      },
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.mat);
    this.mesh.position.set((WINDOW.minX + WINDOW.maxX) / 2, (WINDOW.minY + WINDOW.maxY) / 2, WINDOW.z - 0.01);
    this.mesh.renderOrder = 10;
    this.mesh.name = 'WindowGlass';
  }

  update(_dt: number, time: number): void {
    this.mat.uniforms.uTime.value = time;
    this.mat.uniforms.uFlash.value = this.flash;
  }
}
