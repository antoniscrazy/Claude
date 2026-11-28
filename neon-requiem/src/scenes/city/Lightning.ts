import * as THREE from 'three';
import type { Updatable } from '../../core/Engine';
import { events } from '../../core/Events';

/**
 * Gewitter: in zufälligen Abständen ein Blitz mit typischer Doppel-/Dreifach-Pulsung.
 * Ein gezackter Blitzkanal wird kurz sichtbar, ein gerichtetes Licht erhellt die
 * Stadt und das Büro, der Donner folgt verzögert je nach Entfernung.
 * Andere Systeme lesen `flash` (0..1) für Sky, Scheibe, Regen und Bloom.
 */
export class Lightning implements Updatable {
  readonly group = new THREE.Group();
  readonly light: THREE.DirectionalLight;
  flash = 0;
  dir = new THREE.Vector2(0, -1);
  private timer = 8;
  private pulses: number[] = [];
  private t = 0;
  private bolt: THREE.Line | null = null;
  private boltMat = new THREE.LineBasicMaterial({ color: new THREE.Color(6, 6, 9), transparent: true });
  /** Donner-Callback: Stärke 0..1, Verzögerung in Sekunden. */
  onThunder?: (strength: number, delay: number) => void;

  constructor() {
    this.light = new THREE.DirectionalLight(0xb8c8ff, 0);
    this.light.position.set(-30, 80, -120);
    this.light.target.position.set(0, 0, 0);
    this.group.add(this.light, this.light.target);
  }

  /** Erzwingt einen Blitz (z. B. für die Inszenierung des Intros). */
  strike(strength = 1): void {
    const now = this.t;
    this.pulses = [now, now + 0.09 + Math.random() * 0.05, now + 0.25 + Math.random() * 0.15];
    if (Math.random() < 0.5) this.pulses.pop();

    // Blitzkanal irgendwo über der Skyline
    const x = (Math.random() - 0.5) * 400, z = -180 - Math.random() * 200;
    this.dir.set(x, z).normalize();
    this.light.position.set(x * 0.3, 90, z * 0.3);
    if (this.bolt) this.group.remove(this.bolt);
    const pts: THREE.Vector3[] = [];
    let px = x, py = 180;
    while (py > 10) {
      pts.push(new THREE.Vector3(px, py, z));
      px += (Math.random() - 0.5) * 18;
      py -= 6 + Math.random() * 14;
    }
    this.bolt = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), this.boltMat);
    this.group.add(this.bolt);

    const dist = Math.hypot(x, z);
    this.onThunder?.(strength * THREE.MathUtils.clamp(260 / dist, 0.4, 1), dist / 340 + 0.3);
    events.emit('lightning', { strength });
  }

  update(dt: number, _time: number): void {
    this.t += dt;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.strike(0.6 + Math.random() * 0.4);
      this.timer = 14 + Math.random() * 26;
    }
    // Summe der abklingenden Pulse
    let f = 0;
    for (const p of this.pulses) {
      const a = this.t - p;
      if (a >= 0 && a < 0.6) f = Math.max(f, Math.exp(-a * 14));
    }
    this.flash = f;
    this.light.intensity = f * 6;
    if (this.bolt) {
      this.boltMat.opacity = f > 0.15 ? 1 : 0;
      this.bolt.visible = f > 0.15;
    }
  }
}
