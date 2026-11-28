import * as THREE from 'three';

/**
 * Leichte Kollision ohne Physik-Engine: Der Spieler ist ein Kreis in der XZ-Ebene,
 * die Welt besteht aus achsenparallelen Boxen. Für einen Innenraum und Straßenblöcke
 * reicht das völlig und ist deutlich billiger als Rapier. Kamera-Kollision nutzt
 * Raycasts gegen eine separate Liste von "Occluder"-Meshes.
 */
export interface Box2 {
  minX: number; maxX: number; minZ: number; maxZ: number;
  /** Höhe der Oberkante – Boxen unter Hüfthöhe blockieren trotzdem. */
  top: number;
  tag?: string;
}

export class CollisionWorld {
  boxes: Box2[] = [];
  occluders: THREE.Object3D[] = [];
  private ray = new THREE.Raycaster();

  addBox(cx: number, cz: number, sx: number, sz: number, top = 3, tag?: string): Box2 {
    const b = { minX: cx - sx / 2, maxX: cx + sx / 2, minZ: cz - sz / 2, maxZ: cz + sz / 2, top, tag };
    this.boxes.push(b);
    return b;
  }

  /** Box aus der Bounding-Box eines Objekts (Welt-Koordinaten) ableiten. */
  addFromObject(obj: THREE.Object3D, pad = 0, tag?: string): Box2 {
    obj.updateWorldMatrix(true, true);
    const bb = new THREE.Box3().setFromObject(obj);
    const b = { minX: bb.min.x - pad, maxX: bb.max.x + pad, minZ: bb.min.z - pad, maxZ: bb.max.z + pad, top: bb.max.y, tag };
    this.boxes.push(b);
    return b;
  }

  addOccluder(obj: THREE.Object3D): void {
    this.occluders.push(obj);
  }

  /**
   * Schiebt einen Kreis (Position p, Radius r) aus allen Boxen heraus.
   * Mehrere Iterationen, damit Ecken sauber aufgelöst werden.
   */
  resolve(p: THREE.Vector3, r: number): void {
    for (let iter = 0; iter < 3; iter++) {
      let moved = false;
      for (const b of this.boxes) {
        const cx = Math.max(b.minX, Math.min(p.x, b.maxX));
        const cz = Math.max(b.minZ, Math.min(p.z, b.maxZ));
        const dx = p.x - cx, dz = p.z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        if (d2 > 1e-8) {
          const d = Math.sqrt(d2);
          p.x = cx + (dx / d) * r;
          p.z = cz + (dz / d) * r;
        } else {
          // Mittelpunkt liegt in der Box: entlang der kürzesten Achse hinausschieben.
          const pen = [p.x - b.minX, b.maxX - p.x, p.z - b.minZ, b.maxZ - p.z];
          const i = pen.indexOf(Math.min(...pen));
          if (i === 0) p.x = b.minX - r;
          else if (i === 1) p.x = b.maxX + r;
          else if (i === 2) p.z = b.minZ - r;
          else p.z = b.maxZ + r;
        }
        moved = true;
      }
      if (!moved) break;
    }
  }

  /** Abstand bis zum ersten Occluder entlang des Strahls (für die Schulterkamera). */
  castDistance(from: THREE.Vector3, dir: THREE.Vector3, max: number): number {
    this.ray.set(from, dir);
    this.ray.far = max;
    const hits = this.ray.intersectObjects(this.occluders, true);
    return hits.length ? hits[0].distance : max;
  }
}
