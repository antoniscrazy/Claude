import * as THREE from 'three';
import type { Updatable } from '../../core/Engine';
import { neonText } from '../../materials/Textures';
import { SmokeEmitter } from '../../systems/Particles';
import { STREET_Y } from './Skyline';

/**
 * Straßenausstattung vor dem Fenster: Neonschilder (mit individuellem Flackern),
 * durchhängende Kabelbündel zwischen den Fassaden und Dampf aus Gullis und der
 * Abluft der Ramen-Bar, der am Fenster vorbeizieht.
 */
interface SignDef {
  text: string; color: string; pos: [number, number, number]; size: [number, number];
  rotY?: number; flicker?: 'stable' | 'buzz' | 'dying'; light?: number;
  font?: string; vertical?: boolean;
}

const SIGNS: SignDef[] = [
  { text: 'RAMEN · ラーメン', color: '#ff7a1a', pos: [-6.4, -2.6, -5.9], size: [4.6, 1.15], rotY: Math.PI / 2, flicker: 'buzz', light: 40 },
  { text: 'CLUB SYNAPSE', color: '#36f0ff', pos: [-22, -6, -20.8], size: [10, 2.5], flicker: 'stable', light: 80 },
  { text: 'KORVUS · SICHERHEIT IST WETTER', color: '#e8f4ff', pos: [24, 14, -20.8], size: [16, 2], flicker: 'stable', light: 0 },
  { text: 'HOTEL', color: '#ff2fa0', pos: [10, 4, -20.6], size: [1.6, 6], flicker: 'dying', light: 50, vertical: true },
  { text: 'DOC V. · REPARATUR', color: '#7dff5a', pos: [-38, -11, -20.6], size: [8, 1.6], flicker: 'buzz', light: 30 },
  { text: '24H', color: '#ffd23a', pos: [4, -11.5, -20.6], size: [2.5, 1.2], flicker: 'stable', light: 20 },
];

class Sign implements Updatable {
  readonly group = new THREE.Group();
  private mat: THREE.MeshBasicMaterial;
  private light?: THREE.PointLight;
  private base: number;
  private seed = Math.random() * 100;

  constructor(private d: SignDef) {
    const tex = d.vertical
      ? neonText(d.text.split('').join('\n'), d.color, 256, 1024, 'bold 180px "Share Tech Mono", monospace')
      : neonText(d.text, d.color, 1024, 256, `bold ${Math.min(150, Math.floor(1700 / d.text.length))}px "Share Tech Mono", monospace`);
    if (d.vertical) this.redrawVertical(tex as THREE.CanvasTexture, d.text, d.color);
    this.base = d.text.startsWith('KORVUS') ? 1.6 : 2.6;
    this.mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthWrite: false, color: new THREE.Color().setScalar(this.base), side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(d.size[0], d.size[1]), this.mat);
    this.group.add(plane);
    // dunkler Kasten hinter der Schrift
    const backing = new THREE.Mesh(
      new THREE.BoxGeometry(d.size[0] * 1.04, d.size[1] * 1.1, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x08090c, roughness: 0.4, metalness: 0.6 }),
    );
    backing.position.z = -0.12;
    this.group.add(backing);
    this.group.position.set(...d.pos);
    this.group.rotation.y = d.rotY ?? 0;
    if (d.light) {
      this.light = new THREE.PointLight(new THREE.Color(d.color), d.light, Math.max(d.size[0], d.size[1]) * 2.5, 1.8);
      this.light.position.set(0, 0, 1.2);
      this.group.add(this.light);
    }
  }

  /** Vertikale Schilder: Buchstaben untereinander (Canvas-fillText kennt kein \n). */
  private redrawVertical(tex: THREE.CanvasTexture, text: string, color: string): void {
    const c = tex.image as HTMLCanvasElement;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.font = 'bold 170px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const step = c.height / text.length;
    [...text].forEach((ch, i) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = 30;
      ctx.fillStyle = color;
      ctx.fillText(ch, c.width / 2, step * (i + 0.5));
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.85;
      ctx.fillText(ch, c.width / 2, step * (i + 0.5));
      ctx.globalAlpha = 1;
    });
    tex.needsUpdate = true;
  }

  update(_dt: number, time: number): void {
    const t = time + this.seed;
    let k = 1;
    if (this.d.flicker === 'buzz') k = Math.sin(t * 17) * Math.sin(t * 5.3) > 0.96 ? 0.3 : 0.95 + Math.sin(t * 120) * 0.05;
    else if (this.d.flicker === 'dying') k = Math.sin(t * 2.1) + Math.sin(t * 9.7) * 0.6 > 1.1 ? 0.08 : 1;
    this.mat.color.setScalar(this.base * k);
    if (this.light && this.d.light) this.light.intensity = this.d.light * k;
  }
}

export function buildCityDressing(): { group: THREE.Group; updatables: Updatable[] } {
  const g = new THREE.Group();
  g.name = 'CityDressing';
  const ups: Updatable[] = [];

  SIGNS.forEach((d) => {
    const s = new Sign(d);
    g.add(s.group);
    ups.push(s);
  });

  // Kabelbündel: Kettenlinien zwischen unserer Fassade und der gegenüberliegenden
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.5, metalness: 0.3 });
  const cable = (a: THREE.Vector3, b: THREE.Vector3, sag: number, r: number) => {
    const mid = a.clone().lerp(b, 0.5);
    mid.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, r, 5), cableMat));
  };
  for (let i = 0; i < 9; i++) {
    const x0 = -20 + i * 5 + Math.sin(i * 3.1) * 2;
    const y0 = 3.5 + Math.sin(i * 1.7) * 2.5;
    cable(new THREE.Vector3(x0, y0, -4.6), new THREE.Vector3(x0 + Math.sin(i) * 6, y0 + Math.cos(i * 2) * 3, -20.8), 2 + (i % 3), 0.03 + (i % 2) * 0.02);
  }
  for (let i = 0; i < 4; i++) {
    cable(new THREE.Vector3(-40, 8 + i * 1.5, -20.6), new THREE.Vector3(40, 9 + i, -20.6), 3 + i, 0.04);
  }

  // Dampf: Gullis auf der Straße + Abluft der Ramen-Bar direkt unter dem Fenster
  const vents: Array<[number, number, number, number]> = [[-6, STREET_Y, -12, 1], [14, STREET_Y, -16, 1], [-28, STREET_Y, -10, 0.8]];
  vents.forEach(([x, y, z, s]) => {
    const e = new SmokeEmitter({
      origin: new THREE.Vector3(x, y, z), count: 60, life: 6, rise: 1.4, spread: 0.8,
      drift: new THREE.Vector3(-0.3, 0, 0.1), size: [1.5 * s, 6 * s], color: 0x8c6a7a, opacity: 0.18,
    });
    g.add(e.points);
    ups.push(e);
  });
  const exhaust = new SmokeEmitter({
    origin: new THREE.Vector3(1.5, -5, -5.4), count: 70, life: 7, rise: 1.2, spread: 0.4,
    drift: new THREE.Vector3(-0.25, 0, -0.15), size: [0.8, 4.5], color: 0xb09aa8, opacity: 0.12,
  });
  g.add(exhaust.points);
  ups.push(exhaust);

  return { group: g, updatables: ups };
}
