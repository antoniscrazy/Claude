import * as THREE from 'three';
import type { Input } from '../core/Input';
import type { CollisionWorld } from './Collision';
import type { CameraRig } from './CameraRig';
import { Kai } from '../entities/Kai';

/**
 * Bewegung relativ zur Kamera: Gehen, Sprinten, Ducken. Kai dreht sich weich in
 * Laufrichtung. Beschleunigung/Abbremsen sind gedämpft, damit es nicht "rutschig" wirkt.
 */
export class PlayerController {
  readonly kai = new Kai();
  readonly position = new THREE.Vector3();
  private velocity = new THREE.Vector3();
  private facing = Math.PI;
  crouching = false;
  /** Wenn false, ignoriert der Spieler Eingaben (Menü, Zwischensequenz). */
  active = false;
  readonly radius = 0.3;
  private fwd = new THREE.Vector3();
  private right = new THREE.Vector3();
  private wish = new THREE.Vector3();

  static WALK = 1.75;
  static SPRINT = 3.9;
  static CROUCH = 0.95;

  constructor(private input: Input, private world: CollisionWorld, private rig: CameraRig) {}

  spawn(x: number, z: number, facing: number): void {
    this.position.set(x, 0, z);
    this.facing = facing;
    this.rig.yaw = facing;
    this.kai.root.position.copy(this.position);
    this.kai.root.rotation.y = facing;
  }

  update(dt: number, time: number): void {
    let sprint = false;
    this.wish.set(0, 0, 0);

    if (this.active) {
      if (this.input.pressed('crouch')) this.crouching = !this.crouching;
      const look = this.input.lookDelta(dt);
      this.rig.addLook(look.x, look.y);

      const axis = this.input.moveAxis();
      this.rig.forward(this.fwd);
      this.right.set(-this.fwd.z, 0, this.fwd.x);
      this.wish.addScaledVector(this.fwd, axis.y).addScaledVector(this.right, axis.x);
      sprint = this.input.held('sprint') && axis.y > 0.2 && !this.crouching;
      if (sprint && this.crouching) this.crouching = false;
    }

    const max = this.crouching ? PlayerController.CROUCH : sprint ? PlayerController.SPRINT : PlayerController.WALK;
    const target = this.wish.clone().multiplyScalar(max);
    const accel = target.lengthSq() > 0.001 ? 10 : 12;
    this.velocity.lerp(target, Math.min(1, dt * accel));

    this.position.addScaledVector(this.velocity, dt);
    this.world.resolve(this.position, this.radius);

    // Körper in Bewegungsrichtung drehen
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    if (speed > 0.15) {
      const goal = Math.atan2(this.velocity.x, this.velocity.z);
      let diff = goal - this.facing;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.facing += diff * Math.min(1, dt * 10);
    }

    this.kai.root.position.copy(this.position);
    this.kai.root.rotation.y = this.facing;
    let rel = this.rig.yaw - this.facing;
    rel = Math.atan2(Math.sin(rel), Math.cos(rel));
    this.kai.lookYaw = rel;
    this.kai.update(dt, time, { speed, crouch: this.crouching ? 1 : 0, sprint });
  }

  /** Blickrichtung des Spielers (Körper), für Interaktions-Checks. */
  facingDir(out: THREE.Vector3): THREE.Vector3 {
    return out.set(Math.sin(this.facing), 0, Math.cos(this.facing));
  }
}
