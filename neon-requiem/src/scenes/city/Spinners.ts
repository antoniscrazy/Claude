import * as THREE from 'three';
import type { Updatable } from '../../core/Engine';
import { settings } from '../../core/Settings';
import { rng } from '../../materials/Textures';

/**
 * Fliegende Fahrzeuge ("Spinner") auf geschlossenen Spline-Bahnen durch die Skyline.
 * Jedes Fahrzeug: kantiger Rumpf, Cockpit-Glow, Scheinwerfer (Sprite-Kegel),
 * rote Hecklichter und ein blinkendes Positionslicht. Ausrichtung entlang der Tangente.
 */
interface Craft { obj: THREE.Group; curve: THREE.CatmullRomCurve3; t: number; speed: number; blink: THREE.Mesh }

const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.3, metalness: 0.8 });
const headMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 4, 3.6) });
const tailMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 0.2, 0.2) });
const blinkMats = [
  new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 3, 4) }),
  new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.4, 3) }),
];
const beamMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(0.35, 0.35, 0.3), transparent: true, opacity: 0.18,
  blending: THREE.AdditiveBlending, depthWrite: false,
});

function makeCraft(i: number): { obj: THREE.Group; blink: THREE.Mesh } {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => {
    const me = new THREE.Mesh(geo, m);
    me.position.set(x, y, z);
    g.add(me);
    return me;
  };
  // Vorne = +Z
  add(new THREE.BoxGeometry(2.2, 0.7, 4.8), bodyMat, 0, 0, 0);
  add(new THREE.BoxGeometry(1.7, 0.5, 2), bodyMat, 0, 0.55, -0.3);
  add(new THREE.BoxGeometry(1.5, 0.35, 1.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.9, 1.2) }), 0, 0.6, 0.75);
  for (const s of [-1, 1]) {
    add(new THREE.BoxGeometry(0.9, 0.35, 1.6), bodyMat, s * 1.45, -0.15, -1.2);
    add(new THREE.BoxGeometry(0.35, 0.12, 0.08), headMat, s * 0.7, 0, 2.42);
    add(new THREE.BoxGeometry(0.5, 0.12, 0.06), tailMat, s * 0.75, 0.05, -2.42);
  }
  const blink = add(new THREE.SphereGeometry(0.14, 6, 4), blinkMats[i % 2], 0, -0.4, 0);
  // Scheinwerferkegel nach vorn
  const beamGeo = new THREE.ConeGeometry(2.4, 16, 12, 1, true);
  beamGeo.translate(0, -8, 0);
  beamGeo.rotateX(-Math.PI / 2);
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(0, -0.1, 2.5);
  g.add(beam);
  return { obj: g, blink };
}

export class Spinners implements Updatable {
  readonly group = new THREE.Group();
  private crafts: Craft[] = [];

  constructor() {
    const r = rng(77);
    const n = settings.preset.spinners;
    for (let i = 0; i < n; i++) {
      // Bahnen: elliptische Schleifen in verschiedenen Höhen, manche dicht am Fenster vorbei
      const near = i < 2;
      const cz = near ? -14 : -60 - r() * 200;
      const rx = near ? 90 : 60 + r() * 120;
      const rz = near ? 3 : 20 + r() * 60;
      const y = near ? 3 + r() * 6 : 10 + r() * 60;
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * rx + (r() - 0.5) * 10, y + (r() - 0.5) * 8, cz + Math.sin(a) * rz));
      }
      const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
      const { obj, blink } = makeCraft(i);
      this.group.add(obj);
      const len = curve.getLength();
      this.crafts.push({ obj, curve, t: r(), speed: (near ? 22 : 14 + r() * 16) / len, blink });
    }
  }

  private p = new THREE.Vector3();
  private tan = new THREE.Vector3();

  update(dt: number, time: number): void {
    this.crafts.forEach((c, i) => {
      c.t = (c.t + c.speed * dt) % 1;
      c.curve.getPointAt(c.t, this.p);
      c.curve.getTangentAt(c.t, this.tan);
      c.obj.position.copy(this.p);
      c.obj.lookAt(this.p.x + this.tan.x, this.p.y + this.tan.y, this.p.z + this.tan.z);
      // Leichte Schräglage in Kurven
      c.obj.rotateZ(Math.sin(c.t * Math.PI * 4) * 0.12);
      c.blink.visible = Math.sin(time * 4 + i) > 0.6;
    });
  }
}
