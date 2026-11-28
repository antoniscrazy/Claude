import * as THREE from 'three';
import { M, box, cyl } from '../../materials/Materials';
import { rng } from '../../materials/Textures';
import type { CollisionWorld } from '../../systems/Collision';

/**
 * Großes Mobiliar: Schreibtisch, Stühle, Ledercouch, Aktenschränke, Regal,
 * Garderobe, Kochnische, Umzugskartons. Jedes Stück registriert seine Kollisionsbox.
 */
export const DESK = { x: 0.4, z: -2.35, w: 1.9, d: 0.9, h: 0.77 };

export function buildFurniture(world: CollisionWorld): THREE.Group {
  const g = new THREE.Group();
  g.name = 'Furniture';
  const m = M();

  // --- Schreibtisch (massiv, alt, Front zur Tür) ---
  const desk = new THREE.Group();
  desk.position.set(DESK.x, 0, DESK.z);
  box(desk, DESK.w, 0.05, DESK.d, m.deskTop, 0, DESK.h - 0.025, 0);
  box(desk, 0.5, DESK.h - 0.05, DESK.d - 0.06, m.darkWood, -DESK.w / 2 + 0.27, (DESK.h - 0.05) / 2, 0);
  box(desk, 0.5, DESK.h - 0.05, DESK.d - 0.06, m.darkWood, DESK.w / 2 - 0.27, (DESK.h - 0.05) / 2, 0);
  box(desk, DESK.w - 1.04, 0.5, 0.03, m.darkWood, 0, 0.45, DESK.d / 2 - 0.05); // Blende vorn
  for (let i = 0; i < 3; i++) {
    for (const sx of [-1, 1]) {
      const y = 0.15 + i * 0.22;
      box(desk, 0.44, 0.18, 0.01, m.darkWood, sx * (DESK.w / 2 - 0.27), y, -DESK.d / 2 + 0.025);
      box(desk, 0.1, 0.015, 0.02, m.chrome, sx * (DESK.w / 2 - 0.27), y + 0.04, -DESK.d / 2 + 0.01);
    }
  }
  g.add(desk);
  world.addFromObject(desk, 0.02, 'desk');
  world.addOccluder(desk);

  // --- Kais Bürostuhl (hinter dem Schreibtisch, zum Fenster gedreht) ---
  const chair = officeChair(m);
  chair.position.set(DESK.x - 0.25, 0, DESK.z - 0.85);
  chair.rotation.y = 0.5;
  g.add(chair);
  world.addBox(chair.position.x, chair.position.z, 0.5, 0.5, 1.1, 'chair');

  // --- Besucherstuhl ---
  const visitor = woodenChair(m);
  visitor.position.set(DESK.x + 0.2, 0, DESK.z + 1.05);
  visitor.rotation.y = Math.PI + 0.2;
  g.add(visitor);
  world.addBox(visitor.position.x, visitor.position.z, 0.46, 0.46, 0.9, 'chair');

  // --- Teppich ---
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), m.rug);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(DESK.x, 0.004, DESK.z + 0.6);
  rug.receiveShadow = true;
  g.add(rug);

  // --- Ledercouch an der Ostwand ---
  const couch = new THREE.Group();
  couch.position.set(4.45, 0, 0.6);
  couch.rotation.y = -Math.PI / 2;
  box(couch, 2.2, 0.42, 0.85, m.leather, 0, 0.25, 0);
  box(couch, 2.2, 0.55, 0.2, m.leather, 0, 0.65, -0.34);
  box(couch, 0.2, 0.62, 0.85, m.leather, -1.1, 0.36, 0);
  box(couch, 0.2, 0.62, 0.85, m.leather, 1.1, 0.36, 0);
  for (const x of [-0.5, 0.5]) box(couch, 0.95, 0.12, 0.65, m.leather, x, 0.52, 0.05);
  // zerknülltes Kissen und Decke
  const pillow = box(couch, 0.45, 0.14, 0.32, m.beigePlastic, -0.75, 0.64, 0.05);
  pillow.rotation.set(0.2, 0.4, 0.15);
  g.add(couch);
  world.addFromObject(couch, 0, 'couch');
  world.addOccluder(couch);

  // --- Aktenschränke an der Westwand ---
  for (let i = 0; i < 2; i++) {
    const cab = new THREE.Group();
    cab.position.set(-4.72, 0, -2.8 + i * 0.62);
    cab.rotation.y = Math.PI / 2;
    box(cab, 0.56, 1.36, 0.6, m.olive, 0, 0.68, 0);
    for (let k = 0; k < 4; k++) {
      box(cab, 0.5, 0.29, 0.015, m.olive, 0, 0.18 + k * 0.33, 0.3);
      box(cab, 0.14, 0.025, 0.03, m.chrome, 0, 0.26 + k * 0.33, 0.315);
      box(cab, 0.08, 0.04, 0.005, m.paper, 0, 0.3 + k * 0.33, 0.31, { cast: false });
    }
    if (i === 1) {
      // halb offene Schublade mit Akten
      box(cab, 0.48, 0.24, 0.35, m.olive, 0, 0.84, 0.45);
      for (let f = 0; f < 6; f++) box(cab, 0.42, 0.22, 0.01, m.paper, 0, 0.9, 0.32 + f * 0.05);
    }
    g.add(cab);
  }
  world.addBox(-4.72, -2.49, 0.62, 1.26, 1.4, 'cabinet');

  // --- Bücherregal ---
  const shelf = new THREE.Group();
  shelf.position.set(-4.8, 0, 0.8);
  shelf.rotation.y = Math.PI / 2;
  box(shelf, 1.6, 0.04, 0.36, m.darkWood, 0, 2.1, 0);
  for (const x of [-0.8, 0.8]) box(shelf, 0.04, 2.12, 0.36, m.darkWood, x, 1.06, 0);
  const r = rng(99);
  const bookColors = [0x5b1e1e, 0x1e2f4a, 0x2c3b23, 0x4a3a1c, 0x222222, 0x6a5a40];
  for (let s = 0; s < 5; s++) {
    const y = 0.05 + s * 0.42;
    box(shelf, 1.56, 0.03, 0.34, m.darkWood, 0, y, 0);
    let x = -0.76;
    while (x < 0.7) {
      const bw = 0.03 + r() * 0.05, bh = 0.24 + r() * 0.12;
      if (r() < 0.12) { x += 0.12; continue; } // Lücke
      const book = box(shelf, bw, bh, 0.24, new THREE.MeshStandardMaterial({
        color: bookColors[Math.floor(r() * bookColors.length)], roughness: 0.8,
      }), x + bw / 2, y + 0.015 + bh / 2, 0.02, { cast: false });
      if (r() < 0.1) book.rotation.z = 0.25;
      x += bw + 0.004;
    }
  }
  g.add(shelf);
  world.addBox(-4.8, 0.8, 0.4, 1.66, 2.1, 'shelf');
  world.addOccluder(shelf);

  // --- Garderobe mit Trenchcoat-Ersatz und Hut ---
  const rack = new THREE.Group();
  rack.position.set(2.1, 0, 3.55);
  cyl(rack, 0.02, 0.02, 1.8, m.darkWood, 0, 0.9, 0, 8);
  cyl(rack, 0.22, 0.25, 0.04, m.darkWood, 0, 0.02, 0, 12);
  for (let k = 0; k < 4; k++) {
    const hook = cyl(rack, 0.01, 0.01, 0.22, m.darkWood, 0, 1.72, 0, 6);
    hook.rotation.set(0.9, (k * Math.PI) / 2, 0);
  }
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.26, 1.0, 10, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x2c3138, roughness: 0.85, side: THREE.DoubleSide }));
  coat.position.set(0.1, 1.18, 0.05);
  coat.rotation.z = 0.08;
  coat.castShadow = true;
  rack.add(coat);
  g.add(rack);
  world.addBox(2.1, 3.55, 0.45, 0.45, 1.8, 'rack');

  // --- Kochnische in der Südwest-Ecke ---
  const kit = new THREE.Group();
  kit.position.set(-4.3, 0, 3.55);
  box(kit, 1.3, 0.9, 0.6, m.metal, 0, 0.45, 0);
  box(kit, 1.34, 0.04, 0.64, m.chrome, 0, 0.92, 0);
  box(kit, 0.6, 0.85, 0.6, m.beigePlastic, 0.97, 0.43, 0); // Kühlschrank
  box(kit, 0.02, 0.3, 0.02, m.chrome, 0.72, 0.6, 0.31);
  cyl(kit, 0.09, 0.11, 0.2, m.chrome, -0.3, 1.04, 0, 14); // Wasserkocher
  box(kit, 0.4, 0.04, 0.35, m.blackPlastic, 0.2, 0.96, 0); // Kochplatte
  // Stapel Ramen-Becher
  for (let k = 0; k < 4; k++) cyl(kit, 0.06, 0.05, 0.1, m.paper, 0.35 + (k % 2) * 0.13, 0.99 + Math.floor(k / 2) * 0.1, -0.1, 10);
  g.add(kit);
  world.addFromObject(kit, 0, 'kitchen');
  world.addOccluder(kit);

  // --- Umzugskartons (nie ausgepackt) ---
  const boxes = new THREE.Group();
  boxes.position.set(-2.6, 0, 3.5);
  box(boxes, 0.6, 0.45, 0.45, m.cardboard, 0, 0.225, 0);
  box(boxes, 0.55, 0.4, 0.42, m.cardboard, 0.05, 0.65, 0.02).rotation.y = 0.2;
  box(boxes, 0.5, 0.35, 0.4, m.cardboard, 0.65, 0.175, -0.05).rotation.y = -0.15;
  g.add(boxes);
  world.addFromObject(boxes, 0, 'boxes');

  // --- Papierkorb, überquellend ---
  const bin = cyl(g, 0.16, 0.13, 0.34, m.metal, DESK.x + 1.25, 0.17, DESK.z + 0.1, 12);
  bin.name = 'bin';
  for (let k = 0; k < 5; k++) {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 0), m.paper);
    p.position.set(DESK.x + 1.25 + (r() - 0.5) * 0.18, 0.36 + r() * 0.05, DESK.z + 0.1 + (r() - 0.5) * 0.18);
    g.add(p);
  }
  for (let k = 0; k < 3; k++) {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045, 0), m.paper);
    p.position.set(DESK.x + 1.55 + r() * 0.3, 0.04, DESK.z + 0.3 + r() * 0.4);
    g.add(p);
  }
  return g;
}

function officeChair(m: ReturnType<typeof M>): THREE.Group {
  const c = new THREE.Group();
  box(c, 0.5, 0.1, 0.48, m.leather, 0, 0.5, 0);
  const back = box(c, 0.48, 0.62, 0.08, m.leather, 0, 0.88, -0.24);
  back.rotation.x = -0.12;
  cyl(c, 0.025, 0.025, 0.36, m.chrome, 0, 0.3, 0, 8);
  for (let k = 0; k < 5; k++) {
    const leg = box(c, 0.03, 0.03, 0.3, m.chrome, 0, 0.07, 0);
    leg.rotation.y = (k / 5) * Math.PI * 2;
    leg.translateZ(0.15);
  }
  for (const sx of [-1, 1]) box(c, 0.05, 0.04, 0.32, m.blackPlastic, sx * 0.27, 0.7, -0.02);
  return c;
}

function woodenChair(m: ReturnType<typeof M>): THREE.Group {
  const c = new THREE.Group();
  box(c, 0.44, 0.04, 0.42, m.darkWood, 0, 0.46, 0);
  for (const [x, z] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) {
    box(c, 0.035, 0.46, 0.035, m.darkWood, x, 0.23, z);
  }
  for (const x of [-0.19, 0.19]) box(c, 0.035, 0.45, 0.035, m.darkWood, x, 0.7, -0.18);
  box(c, 0.42, 0.12, 0.025, m.darkWood, 0, 0.85, -0.18);
  return c;
}
