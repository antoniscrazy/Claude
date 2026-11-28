import * as THREE from 'three';
import type { CollisionWorld } from './Collision';

/**
 * Third-Person-Schulterkamera mit Federarm. Die Kamera sitzt rechts hinter Kai,
 * zieht sich bei Wänden per Raycast heran und kann für Zwischensequenzen
 * weich auf eine feste Pose überblenden ("cinematic").
 */
export class CameraRig {
  yaw = Math.PI;      // Blick Richtung -Z (zum Fenster)
  pitch = -0.08;
  private crouchS = 0;
  private dist = 2.1;
  private shake = 0;
  private shakeT = 0;
  private cine: { pos: THREE.Vector3; look: THREE.Vector3 } | null = null;
  /** 0 = Spielerkamera, 1 = Kino-Pose; dazwischen wird interpoliert. */
  private cineBlend = 0;
  private pivot = new THREE.Vector3();
  private desired = new THREE.Vector3();
  private lookAt = new THREE.Vector3();
  private tmp = new THREE.Vector3();
  private smoothedPos = new THREE.Vector3();
  private initialized = false;
  /** Abstand Kamera–Kopf; die Szene blendet Kai bei sehr kleinem Wert aus. */
  currentDistance = 2;

  constructor(private camera: THREE.PerspectiveCamera, private world: CollisionWorld) {}

  addLook(dx: number, dy: number): void {
    this.yaw -= dx * 0.0022;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.0022, -1.1, 0.75);
  }

  addShake(amount: number): void {
    this.shake = Math.min(1.5, this.shake + amount);
  }

  setCinematic(pos: THREE.Vector3 | null, look?: THREE.Vector3): void {
    this.cine = pos && look ? { pos: pos.clone(), look: look.clone() } : null;
  }

  /** Springt ohne Überblendung in die Kino-Pose (z. B. Menü beim Start). */
  snapCinematic(): void {
    this.cineBlend = 1;
  }

  get inCinematic(): boolean {
    // Steuerung schon während der Rückblende freigeben, damit es nicht träge wirkt
    return this.cineBlend > 0.35;
  }

  /** Vorwärtsrichtung der Kamera in der Ebene (für die Bewegungssteuerung). */
  forward(out: THREE.Vector3): THREE.Vector3 {
    return out.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
  }

  update(dt: number, target: THREE.Vector3, crouch: number): void {
    this.crouchS += (crouch - this.crouchS) * Math.min(1, dt * 6);

    // Drehpunkt auf Schulterhöhe, leicht nach rechts versetzt
    const right = this.tmp.set(-Math.cos(this.yaw), 0, Math.sin(this.yaw));
    this.pivot.copy(target).addScaledVector(right, 0.42);
    this.pivot.y += 1.6 - this.crouchS * 0.45;

    // Wunschposition hinter dem Drehpunkt entlang des Blickstrahls
    const cp = Math.cos(this.pitch);
    const back = new THREE.Vector3(-Math.sin(this.yaw) * cp, -Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
    const hit = this.world.castDistance(this.pivot, back, this.dist + 0.3);
    const d = Math.max(0.25, Math.min(this.dist, hit - 0.25));
    this.currentDistance = d;
    this.desired.copy(this.pivot).addScaledVector(back, d);
    this.lookAt.copy(this.pivot).addScaledVector(back, -6);

    // Weiche Verfolgung (nur zum Heranziehen sofort, damit nichts durch Wände ragt)
    if (!this.initialized) {
      this.smoothedPos.copy(this.desired);
      this.initialized = true;
    }
    this.smoothedPos.lerp(this.desired, Math.min(1, dt * 18));

    // Kino-Überblendung
    const goal = this.cine ? 1 : 0;
    this.cineBlend += (goal - this.cineBlend) * Math.min(1, dt * (goal ? 1.6 : 2.4));
    const pos = this.smoothedPos.clone();
    const look = this.lookAt.clone();
    if (this.cine && this.cineBlend > 0.001) {
      const k = THREE.MathUtils.smootherstep(this.cineBlend, 0, 1);
      pos.lerp(this.cine.pos, k);
      look.lerp(this.cine.look, k);
    } else if (!this.cine && this.cineBlend > 0.001 && this.lastCine) {
      const k = THREE.MathUtils.smootherstep(this.cineBlend, 0, 1);
      pos.lerp(this.lastCine.pos, k);
      look.lerp(this.lastCine.look, k);
    }
    if (this.cine) this.lastCine = this.cine;

    // Kamerawackeln (Klopfen, Blitz)
    this.shakeT += dt * 38;
    if (this.shake > 0.001) {
      const s = this.shake * 0.03;
      pos.x += Math.sin(this.shakeT * 1.3) * s;
      pos.y += Math.sin(this.shakeT * 1.7 + 1) * s;
      this.shake *= Math.exp(-dt * 5);
    }

    this.camera.position.copy(pos);
    this.camera.lookAt(look);
  }

  private lastCine: { pos: THREE.Vector3; look: THREE.Vector3 } | null = null;
}
