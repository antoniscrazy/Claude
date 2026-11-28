import * as THREE from 'three';
import { M, box, glow } from '../../materials/Materials';
import { doorGlass } from '../../materials/Textures';
import type { CollisionWorld } from '../../systems/Collision';

/**
 * Raumhülle von Kais Büro: 10 × 8 m, 3,2 m hoch. Nordwand (z = -4) mit
 * Panoramafenster zur Skyline, Südwand mit Milchglastür, Jalousie am linken Fensterflügel.
 */
export const ROOM = { minX: -5, maxX: 5, minZ: -4, maxZ: 4, h: 3.2 };
export const WINDOW = { minX: -4.3, maxX: 4.3, minY: 0.85, maxY: 2.85, z: -4 };
export const DOOR = { x: 3.2, w: 1.0, h: 2.2 };

export interface RoomParts {
  group: THREE.Group;
  door: THREE.Group;
  blinds: THREE.InstancedMesh;
}

export function buildRoom(world: CollisionWorld): RoomParts {
  const g = new THREE.Group();
  g.name = 'Room';
  const m = M();
  const { minX, maxX, minZ, maxZ, h } = ROOM;
  const W = maxX - minX, D = maxZ - minZ, T = 0.2;

  // Boden und Decke
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), m.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  g.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), m.ceiling);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = h;
  g.add(ceil);

  const wall = (w: number, hh: number, d: number, x: number, y: number, z: number) => {
    const me = box(g, w, hh, d, m.wall, x, y, z);
    world.addOccluder(me);
    return me;
  };

  // Nordwand mit Fensteröffnung (aus vier Teilen)
  const wz = minZ - T / 2;
  wall(W + 2 * T, WINDOW.minY, T, 0, WINDOW.minY / 2, wz);
  wall(W + 2 * T, h - WINDOW.maxY, T, 0, (h + WINDOW.maxY) / 2, wz);
  const sideW = WINDOW.minX - minX;
  wall(sideW + T, WINDOW.maxY - WINDOW.minY, T, minX + sideW / 2 - T / 2, (WINDOW.minY + WINDOW.maxY) / 2, wz);
  wall(sideW + T, WINDOW.maxY - WINDOW.minY, T, maxX - sideW / 2 + T / 2, (WINDOW.minY + WINDOW.maxY) / 2, wz);
  // Ost- und Westwand
  wall(T, h, D, maxX + T / 2, h / 2, 0);
  wall(T, h, D, minX - T / 2, h / 2, 0);
  // Südwand mit Türöffnung
  const sz = maxZ + T / 2;
  const leftW = DOOR.x - DOOR.w / 2 - minX;
  wall(leftW + T, h, T, minX + leftW / 2 - T / 2, h / 2, sz);
  const rightW = maxX - (DOOR.x + DOOR.w / 2);
  wall(rightW + T, h, T, maxX - rightW / 2 + T / 2, h / 2, sz);
  wall(DOOR.w, h - DOOR.h, T, DOOR.x, (h + DOOR.h) / 2, sz);

  // Kollision: Raumgrenzen als dicke Boxen
  world.addBox(0, minZ - 0.5, W + 2, 1, h, 'wall');
  world.addBox(0, maxZ + 0.5, W + 2, 1, h, 'wall');
  world.addBox(minX - 0.5, 0, 1, D + 2, h, 'wall');
  world.addBox(maxX + 0.5, 0, 1, D + 2, h, 'wall');

  // Unsichtbare Kamera-Sperre vor Scheibe und Jalousie (Raycasts treffen auch unsichtbare Meshes)
  const camStop = box(g, WINDOW.maxX - WINDOW.minX, WINDOW.maxY - WINDOW.minY, 0.02, m.wall,
    0, (WINDOW.minY + WINDOW.maxY) / 2, minZ + 0.2, { cast: false, receive: false });
  camStop.visible = false;
  world.addOccluder(camStop);

  // Fensterrahmen, Sprossen, Fensterbank
  const fr = m.windowFrame;
  const ww = WINDOW.maxX - WINDOW.minX, wh = WINDOW.maxY - WINDOW.minY;
  const cy = (WINDOW.minY + WINDOW.maxY) / 2;
  box(g, ww + 0.1, 0.08, 0.16, fr, 0, WINDOW.maxY, minZ - 0.02);
  box(g, ww + 0.1, 0.08, 0.16, fr, 0, WINDOW.minY, minZ - 0.02);
  for (const x of [WINDOW.minX, -1.45, 1.45, WINDOW.maxX]) box(g, 0.08, wh, 0.16, fr, x, cy, minZ - 0.02);
  box(g, ww * 0.5, 0.05, 0.12, fr, 2.9, cy + 0.35, minZ - 0.04); // Querstrebe rechts (Kippfenster)
  box(g, W, 0.05, 0.32, m.darkWood, 0, WINDOW.minY - 0.03, minZ + 0.12);

  // Heizkörper unter dem Fenster
  for (let i = 0; i < 14; i++) box(g, 0.06, 0.5, 0.08, m.metal, -1.2 + i * 0.12, 0.42, minZ + 0.08);

  // Sockelleisten
  box(g, W, 0.1, 0.02, m.darkWood, 0, 0.05, maxZ - 0.01, { cast: false });
  box(g, 0.02, 0.1, D, m.darkWood, minX + 0.01, 0.05, 0, { cast: false });
  box(g, 0.02, 0.1, D, m.darkWood, maxX - 0.01, 0.05, 0, { cast: false });

  // --- Tür (eigene Gruppe, damit sie beim Hämmern wackeln kann) ---
  const door = new THREE.Group();
  door.position.set(DOOR.x, 0, maxZ);
  const doorMat = m.darkWood;
  box(door, DOOR.w - 0.04, DOOR.h * 0.42, 0.06, doorMat, 0, DOOR.h * 0.21, 0);
  box(door, DOOR.w - 0.04, 0.16, 0.06, doorMat, 0, DOOR.h - 0.08, 0);
  box(door, 0.14, DOOR.h * 0.5, 0.06, doorMat, -DOOR.w / 2 + 0.09, DOOR.h * 0.67, 0);
  box(door, 0.14, DOOR.h * 0.5, 0.06, doorMat, DOOR.w / 2 - 0.09, DOOR.h * 0.67, 0);
  const glassMat = new THREE.MeshStandardMaterial({
    map: doorGlass(), roughness: 0.6, emissive: 0xffb070, emissiveMap: doorGlass(), emissiveIntensity: 0.25,
  });
  box(door, DOOR.w - 0.3, DOOR.h * 0.5, 0.02, glassMat, 0, DOOR.h * 0.67, 0);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), m.chrome);
  knob.position.set(-DOOR.w / 2 + 0.12, 1.0, -0.07);
  door.add(knob);
  // Lichtschlitz unter der Tür (Flurlicht)
  const slit = box(door, DOOR.w - 0.1, 0.012, 0.02, glow(0xffa860, 2.2), 0, 0.006, 0.05, { cast: false });
  slit.name = 'doorSlit';
  g.add(door);
  // Türrahmen
  box(g, 0.08, DOOR.h + 0.08, 0.24, fr, DOOR.x - DOOR.w / 2 - 0.04, DOOR.h / 2, maxZ);
  box(g, 0.08, DOOR.h + 0.08, 0.24, fr, DOOR.x + DOOR.w / 2 + 0.04, DOOR.h / 2, maxZ);
  box(g, DOOR.w + 0.16, 0.08, 0.24, fr, DOOR.x, DOOR.h + 0.04, maxZ);

  // --- Jalousie am linken Flügel, halb heruntergelassen, Lamellen gekippt ---
  const slatCount = 26;
  const slatGeo = new THREE.BoxGeometry(-1.45 - WINDOW.minX - 0.1, 0.004, 0.05);
  const blinds = new THREE.InstancedMesh(slatGeo, new THREE.MeshStandardMaterial({ color: 0xb8b2a2, roughness: 0.6 }), slatCount);
  const mtx = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.55, 0, 0));
  for (let i = 0; i < slatCount; i++) {
    const y = WINDOW.maxY - 0.06 - i * 0.045;
    mtx.compose(new THREE.Vector3((WINDOW.minX - 1.45) / 2, y, minZ + 0.09), q, new THREE.Vector3(1, 1, 1));
    blinds.setMatrixAt(i, mtx);
  }
  blinds.castShadow = true;
  blinds.receiveShadow = true;
  g.add(blinds);
  box(g, -1.45 - WINDOW.minX, 0.05, 0.07, m.beigePlastic, (WINDOW.minX - 1.45) / 2, WINDOW.maxY - 0.03, minZ + 0.09);

  return { group: g, door, blinds };
}
