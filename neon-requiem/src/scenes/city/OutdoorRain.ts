import * as THREE from 'three';
import type { Updatable } from '../../core/Engine';
import { settings } from '../../core/Settings';

/**
 * GPU-Regen: tausende Streifen als instanzierte Quads. Die komplette Bewegung
 * (Fallen, Wind, Wiederholung per mod) passiert im Vertex-Shader, die CPU
 * tut pro Frame nur ein Uniform-Update. Zylindrisches Billboarding zur Kamera.
 */
const vert = /* glsl */ `
  attribute vec4 aOffset;      // xyz = Startposition, w = Zufallswert
  uniform float uTime;
  uniform vec3 uBoxMin;
  uniform vec3 uBoxSize;
  uniform vec3 uCam;
  uniform vec2 uWind;
  varying float vAlpha;
  varying float vV;
  varying vec3 vWorld;
  void main() {
    float speed = 11.0 + aOffset.w * 5.0;
    float y = uBoxMin.y + mod(aOffset.y - uTime * speed, uBoxSize.y);
    float fall = (uBoxMin.y + uBoxSize.y - y);
    vec3 base = vec3(aOffset.x + uWind.x * fall * 0.06, y, aOffset.z + uWind.y * fall * 0.06);
    base.xz = uBoxMin.xz + mod(base.xz - uBoxMin.xz, uBoxSize.xz);
    vec3 toCam = uCam - base;
    vec3 right = normalize(vec3(toCam.z, 0.0, -toCam.x));
    float len = 0.45 + aOffset.w * 0.5;
    vec3 dir = normalize(vec3(uWind.x * 0.06, -1.0, uWind.y * 0.06));
    vec3 p = base + right * position.x * 0.012 * (1.0 + length(toCam) * 0.02) - dir * position.y * len;
    float dist = length(toCam);
    vAlpha = smoothstep(1.2, 4.0, dist) * (1.0 - smoothstep(30.0, 60.0, dist));
    vV = position.y;
    vWorld = p;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`;

const frag = /* glsl */ `
  uniform float uFlash;
  varying float vAlpha;
  varying float vV;
  varying vec3 vWorld;
  void main() {
    float streak = sin(vV * 3.14159);
    // Neon-Einfärbung: links Magenta (Koi), rechts Cyan, unten Natriumorange
    vec3 tint = mix(vec3(1.0, 0.45, 0.85), vec3(0.5, 0.9, 1.0), smoothstep(-15.0, 15.0, vWorld.x));
    tint = mix(vec3(1.0, 0.7, 0.4), tint, smoothstep(-14.0, -4.0, vWorld.y));
    vec3 col = tint * 0.9 + vec3(1.2) * uFlash;
    gl_FragColor = vec4(col, streak * vAlpha * (0.22 + uFlash * 0.4));
  }
`;

export class OutdoorRain implements Updatable {
  readonly mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  flash = 0;

  constructor(private camera: THREE.Camera, boxMin = new THREE.Vector3(-35, -16, -45), boxSize = new THREE.Vector3(70, 42, 40.4)) {
    const count = settings.preset.rainDrops;
    const quad = new THREE.PlaneGeometry(1, 1, 1, 1);
    quad.translate(0, 0.5, 0);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = quad.index;
    geo.setAttribute('position', quad.attributes.position);
    const offsets = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      offsets[i * 4] = boxMin.x + Math.random() * boxSize.x;
      offsets[i * 4 + 1] = boxMin.y + Math.random() * boxSize.y;
      offsets[i * 4 + 2] = boxMin.z + Math.random() * boxSize.z;
      offsets[i * 4 + 3] = Math.random();
    }
    geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 4));
    geo.instanceCount = count;

    this.mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uBoxMin: { value: boxMin },
        uBoxSize: { value: boxSize },
        uCam: { value: new THREE.Vector3() },
        uWind: { value: new THREE.Vector2(-1.5, 0.6) },
        uFlash: { value: 0 },
      },
    });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 4;
  }

  update(_dt: number, time: number): void {
    this.mat.uniforms.uTime.value = time;
    this.mat.uniforms.uCam.value.copy(this.camera.position);
    this.mat.uniforms.uFlash.value = this.flash;
    this.mat.uniforms.uWind.value.set(-1.5 + Math.sin(time * 0.3) * 0.8, 0.6);
  }
}
