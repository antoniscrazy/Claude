import * as THREE from 'three';

/**
 * Kai Brandt als prozedurale Gelenk-Figur (Platzhalter in guter Qualität).
 * Aufbau als Knochen-Hierarchie (Hüfte → Oberschenkel → Knie …), animiert per Code:
 * Idle-Atmung, Gehen, Sprinten, Ducken. Ein echtes Skinned-GLB kann später über
 * assets.json eingehängt werden (siehe AssetRegistry) – die Schnittstelle bleibt gleich.
 */
export type Gait = { speed: number; crouch: number; sprint: boolean };

const mat = {
  coat: new THREE.MeshStandardMaterial({ color: 0x3d3329, roughness: 0.82 }),
  coatDark: new THREE.MeshStandardMaterial({ color: 0x2a231c, roughness: 0.85, side: THREE.DoubleSide }),
  skin: new THREE.MeshStandardMaterial({ color: 0xb88c72, roughness: 0.62 }),
  pants: new THREE.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.8 }),
  shoe: new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.28, metalness: 0.1 }),
  hat: new THREE.MeshStandardMaterial({ color: 0x24201c, roughness: 0.75 }),
  band: new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.5 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.9 }),
  eye: new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x38f6ff, emissiveIntensity: 6 }),
  implant: new THREE.MeshStandardMaterial({ color: 0x5a6470, roughness: 0.25, metalness: 0.9 }),
};

function mesh(geo: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0): THREE.Mesh {
  const me = new THREE.Mesh(geo, m);
  me.position.set(x, y, z);
  me.castShadow = true;
  me.receiveShadow = true;
  parent.add(me);
  return me;
}

function joint(parent: THREE.Object3D, x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

interface Limb { upper: THREE.Group; lower: THREE.Group; end?: THREE.Object3D }

export class Kai {
  readonly root = new THREE.Group();
  private hips: THREE.Group;
  private torso: THREE.Group;
  private head: THREE.Group;
  private skirt: THREE.Mesh;
  private legs: Limb[] = [];
  private arms: Limb[] = [];
  private phase = 0;
  private lastStepSign = 1;
  private crouchS = 0;
  private speedS = 0;
  /** Wird bei jedem Fußaufsatz aufgerufen (für Schrittgeräusche). */
  onStep?: (intensity: number) => void;
  /** Kopf blickt leicht in Kamerarichtung (Yaw relativ zum Körper). */
  lookYaw = 0;

  constructor() {
    this.root.name = 'Kai';
    this.hips = joint(this.root, 0, 0.98, 0);

    // --- Beine ---
    for (const side of [-1, 1]) {
      const upper = joint(this.hips, side * 0.1, -0.02, 0);
      mesh(new THREE.CapsuleGeometry(0.075, 0.32, 4, 10), mat.pants, upper, 0, -0.22, 0);
      const lower = joint(upper, 0, -0.45, 0);
      mesh(new THREE.CapsuleGeometry(0.062, 0.34, 4, 10), mat.pants, lower, 0, -0.21, 0);
      const foot = mesh(new THREE.BoxGeometry(0.11, 0.08, 0.27), mat.shoe, lower, 0, -0.47, 0.05);
      this.legs.push({ upper, lower, end: foot });
    }

    // --- Mantelschoß: offener Kegel, schwingt mit den Beinen ---
    this.skirt = mesh(new THREE.CylinderGeometry(0.2, 0.31, 0.62, 14, 1, true), mat.coatDark, this.hips, 0, -0.29, 0);
    this.skirt.scale.z = 0.78;

    // --- Oberkörper ---
    this.torso = joint(this.hips, 0, 0.02, 0);
    const chest = mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.6, 14), mat.coat, this.torso, 0, 0.3, 0);
    chest.scale.z = 0.66;
    const shoulders = mesh(new THREE.CapsuleGeometry(0.09, 0.36, 4, 10), mat.coat, this.torso, 0, 0.56, 0);
    shoulders.rotation.z = Math.PI / 2;
    shoulders.scale.set(1, 1, 0.9);
    // Hochgeschlagener Kragen
    const collar = mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.16, 12, 1, true), mat.coatDark, this.torso, 0, 0.66, -0.01);
    collar.scale.z = 0.8;
    // Gürtel
    const belt = mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.05, 14), mat.band, this.torso, 0, 0.04, 0);
    belt.scale.z = 0.67;
    mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 8), mat.skin, this.torso, 0, 0.7, 0);

    // --- Kopf mit Hut und Cyberauge ---
    this.head = joint(this.torso, 0, 0.78, 0.01);
    const skull = mesh(new THREE.SphereGeometry(0.11, 18, 14), mat.skin, this.head, 0, 0.06, 0);
    skull.scale.set(0.95, 1.15, 1.05);
    mesh(new THREE.SphereGeometry(0.112, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat.hair, this.head, 0, 0.075, -0.012);
    const nose = mesh(new THREE.ConeGeometry(0.018, 0.05, 6), mat.skin, this.head, 0, 0.05, 0.115);
    nose.rotation.x = Math.PI / 2;
    // Echtes Auge links, billiges Cyberauge rechts (mit Metallfassung)
    mesh(new THREE.SphereGeometry(0.012, 8, 6), mat.band, this.head, 0.04, 0.085, 0.1);
    mesh(new THREE.TorusGeometry(0.02, 0.006, 6, 14), mat.implant, this.head, -0.04, 0.085, 0.102);
    mesh(new THREE.SphereGeometry(0.013, 10, 8), mat.eye, this.head, -0.04, 0.085, 0.104);
    const hatG = joint(this.head, 0, 0.17, -0.005);
    hatG.rotation.x = -0.08;
    mesh(new THREE.CylinderGeometry(0.1, 0.118, 0.13, 16), mat.hat, hatG, 0, 0.04, 0);
    mesh(new THREE.CylinderGeometry(0.119, 0.119, 0.03, 16), mat.band, hatG, 0, -0.005, 0);
    const brim = mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.012, 22), mat.hat, hatG, 0, -0.02, 0.01);
    brim.scale.z = 0.92;

    // --- Arme ---
    for (const side of [-1, 1]) {
      const upper = joint(this.torso, side * 0.27, 0.55, 0);
      mesh(new THREE.CapsuleGeometry(0.068, 0.26, 4, 10), mat.coat, upper, 0, -0.17, 0);
      const lower = joint(upper, 0, -0.33, 0);
      mesh(new THREE.CapsuleGeometry(0.056, 0.24, 4, 10), mat.coat, lower, 0, -0.14, 0);
      const hand = mesh(new THREE.SphereGeometry(0.05, 10, 8), mat.skin, lower, 0, -0.32, 0.01);
      hand.scale.set(0.8, 1.1, 0.7);
      upper.rotation.z = side * 0.08;
      this.arms.push({ upper, lower, end: hand });
    }
  }

  /** Setzt die Figur halbtransparent, wenn die Kamera sehr nah kommt. */
  setFade(alpha: number): void {
    this.root.visible = alpha > 0.05;
  }

  update(dt: number, time: number, gait: Gait): void {
    // Geglättete Eingangswerte, damit Übergänge weich sind
    this.speedS += (gait.speed - this.speedS) * Math.min(1, dt * 8);
    this.crouchS += (gait.crouch - this.crouchS) * Math.min(1, dt * 7);
    const s = this.speedS;
    const moving = Math.min(1, s / 1.5);
    const stride = gait.sprint ? 1.25 : 1;

    // Schrittfrequenz proportional zur Geschwindigkeit
    this.phase += dt * (s * 2.3 + (s > 0.05 ? 1.2 : 0));
    const sw = Math.sin(this.phase);
    const cw = Math.cos(this.phase);
    const c = this.crouchS;

    // Beine
    this.legs.forEach((leg, i) => {
      const dir = i === 0 ? 1 : -1;
      const swing = sw * dir * 0.55 * moving * stride;
      leg.upper.rotation.x = -swing - c * 0.95;
      const bend = Math.max(0, cw * dir) * 0.9 * moving * stride;
      leg.lower.rotation.x = bend + c * 1.6;
      if (leg.end) leg.end.rotation.x = -c * 0.6;
    });

    // Arme schwingen gegenläufig, im Idle leicht angewinkelt
    const breathe = Math.sin(time * 1.6);
    this.arms.forEach((arm, i) => {
      const dir = i === 0 ? -1 : 1;
      arm.upper.rotation.x = sw * dir * 0.5 * moving * stride - c * 0.3;
      arm.lower.rotation.x = -0.25 - moving * 0.35 * stride - c * 0.5 + breathe * 0.02;
    });

    // Hüfte: Wippen beim Gehen, abgesenkt beim Ducken
    const bob = Math.abs(cw) * 0.045 * moving * stride;
    this.hips.position.y = 0.98 - bob - c * 0.34;
    this.hips.rotation.y = sw * 0.06 * moving;
    this.torso.rotation.x = 0.06 * moving * stride + c * 0.35;
    this.torso.rotation.y = -sw * 0.08 * moving;
    this.torso.scale.set(1 + breathe * 0.006, 1 + breathe * 0.01, 1 + breathe * 0.008);
    this.skirt.rotation.x = -0.08 * moving * stride - c * 0.5;
    this.skirt.rotation.z = sw * 0.05 * moving;

    // Kopf folgt der Blickrichtung ein Stück, gleicht Torso-Neigung aus
    const yaw = THREE.MathUtils.clamp(this.lookYaw, -0.9, 0.9) * 0.5;
    this.head.rotation.y += (yaw - this.head.rotation.y) * Math.min(1, dt * 5);
    this.head.rotation.x = -this.torso.rotation.x * 0.6 + Math.sin(time * 0.7) * 0.02;

    // Fußaufsatz-Ereignis beim Vorzeichenwechsel der Schwingung
    const sign = Math.sign(sw);
    if (moving > 0.3 && sign !== this.lastStepSign && sign !== 0) {
      this.onStep?.(gait.sprint ? 1 : c > 0.5 ? 0.35 : 0.65);
    }
    this.lastStepSign = sign || this.lastStepSign;
  }
}
