import * as THREE from 'three';
import { M, box, cyl, glow } from '../../materials/Materials';
import { poster, neonText, canvasTexture } from '../../materials/Textures';
import { SmokeEmitter } from '../../systems/Particles';
import type { Updatable } from '../../core/Engine';
import { settings } from '../../core/Settings';
import { DESK } from './Furniture';
import { ROOM, WINDOW } from './Room';
import { Terminal } from './Terminal';

/**
 * Kleine Requisiten und Innenlichter: Terminal, kalter Kaffee (dampft trotzdem),
 * Aschenbecher, Bankerlampe, Whisky, Telefon, Wanduhr (02:47), Deckenventilator,
 * Plakat, Neon-"OFFEN" im Fenster. Liefert Ankerpunkte für Interaktionen.
 */
export interface PropParts {
  group: THREE.Group;
  updatables: Updatable[];
  anchors: Record<string, THREE.Vector3>;
  fanLight: THREE.PointLight;
  deskLamp: THREE.SpotLight;
}

export function buildProps(): PropParts {
  const g = new THREE.Group();
  g.name = 'Props';
  const m = M();
  const ups: Updatable[] = [];
  const top = DESK.h;
  const dx = DESK.x, dz = DESK.z;
  const anchors: Record<string, THREE.Vector3> = {};

  // --- Terminal (Röhrenmonitor + Tastatur) ---
  const term = new Terminal();
  term.group.position.set(dx - 0.45, top, dz - 0.05);
  term.group.rotation.y = 0.35;
  g.add(term.group);
  ups.push(term);
  anchors.terminal = new THREE.Vector3(dx - 0.45, top + 0.25, dz - 0.05);

  // --- Kaffeebecher mit Dampf ---
  const mug = new THREE.Group();
  mug.position.set(dx + 0.25, top, dz + 0.18);
  cyl(mug, 0.045, 0.04, 0.1, m.ceramic, 0, 0.05, 0, 16);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.04, 16), new THREE.MeshStandardMaterial({ color: 0x140a05, roughness: 0.05 }));
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.088;
  mug.add(coffee);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.007, 6, 12, Math.PI), m.ceramic);
  handle.position.set(0.048, 0.05, 0);
  handle.rotation.z = -Math.PI / 2;
  mug.add(handle);
  g.add(mug);
  const steam = new SmokeEmitter({
    origin: new THREE.Vector3(dx + 0.25, top + 0.1, dz + 0.18), count: 40, life: 2.4, rise: 0.09,
    spread: 0.02, drift: new THREE.Vector3(0.01, 0, 0.005), size: [0.04, 0.16], color: 0xc8d4dc, opacity: 0.16,
  });
  g.add(steam.points);
  ups.push(steam);
  anchors.coffee = new THREE.Vector3(dx + 0.25, top + 0.1, dz + 0.18);

  // --- Überquellender Aschenbecher mit glimmender Kippe ---
  const ash = new THREE.Group();
  ash.position.set(dx + 0.62, top, dz - 0.12);
  cyl(ash, 0.08, 0.07, 0.03, new THREE.MeshStandardMaterial({ color: 0x2a3a40, roughness: 0.1, metalness: 0.3 }), 0, 0.015, 0, 18);
  const ashPile = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x4a4744, roughness: 1 }));
  ashPile.scale.y = 0.35;
  ashPile.position.y = 0.025;
  ash.add(ashPile);
  const butt = new THREE.MeshStandardMaterial({ color: 0xd9c9a0, roughness: 0.9 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const c = cyl(ash, 0.006, 0.006, 0.045, butt, Math.cos(a) * 0.045, 0.04, Math.sin(a) * 0.045, 6);
    c.rotation.set(Math.PI / 2 - 0.3, 0, a + Math.PI / 2);
  }
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 4), glow(0xff5a1a, 8));
  ember.position.set(0.085, 0.045, 0.01);
  ash.add(ember);
  g.add(ash);
  const smoke = new SmokeEmitter({
    origin: new THREE.Vector3(dx + 0.705, top + 0.05, dz - 0.11), count: 50, life: 4.5, rise: 0.12,
    spread: 0.005, drift: new THREE.Vector3(0.02, 0, 0.03), size: [0.02, 0.22], color: 0x9aa6b0, opacity: 0.2,
  });
  g.add(smoke.points);
  ups.push(smoke);
  ups.push({ update: (_dt, t) => { (ember.material as THREE.MeshStandardMaterial).emissiveIntensity = 5 + Math.sin(t * 2.1) * 2 + Math.sin(t * 7.3) * 1; } });
  anchors.ashtray = new THREE.Vector3(dx + 0.62, top + 0.05, dz - 0.12);

  // --- Bankerlampe (grüner Schirm) mit Spot und Schatten ---
  const lamp = new THREE.Group();
  lamp.position.set(dx + 0.7, top, dz - 0.3);
  cyl(lamp, 0.08, 0.09, 0.02, m.chrome, 0, 0.01, 0, 16);
  cyl(lamp, 0.008, 0.008, 0.32, m.chrome, 0, 0.17, 0, 6);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.09, 16, 1, true, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x0d4a2a, emissive: 0x1a8a4a, emissiveIntensity: 0.6, roughness: 0.2, side: THREE.DoubleSide }));
  shade.position.set(0, 0.34, 0.02);
  shade.rotation.set(Math.PI / 2, 0, 0);
  shade.rotation.order = 'YXZ';
  shade.rotation.y = -0.5;
  lamp.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), glow(0xffd9a0, 6));
  bulb.position.set(0, 0.31, 0.02);
  lamp.add(bulb);
  g.add(lamp);
  const deskLamp = new THREE.SpotLight(0xffc98a, 9, 4.5, 0.95, 0.6, 1.6);
  deskLamp.position.set(dx + 0.7, top + 0.31, dz - 0.28);
  deskLamp.target.position.set(dx + 0.1, 0, dz + 0.2);
  deskLamp.castShadow = settings.preset.shadows;
  deskLamp.shadow.mapSize.setScalar(settings.preset.shadowMapSize);
  deskLamp.shadow.bias = -0.0008;
  deskLamp.shadow.normalBias = 0.02;
  g.add(deskLamp, deskLamp.target);

  // --- Papierchaos, Whisky, Telefon, Foto ---
  for (let i = 0; i < 7; i++) {
    const p = box(g, 0.21, 0.002, 0.297, m.paper, dx - 0.1 + Math.sin(i * 2.1) * 0.25, top + 0.002 + i * 0.002, dz + 0.15 + Math.cos(i * 1.7) * 0.12, { cast: false });
    p.rotation.y = Math.sin(i * 3.3) * 0.6;
  }
  const bottle = new THREE.Group();
  bottle.position.set(dx - 0.85, top, dz + 0.25);
  cyl(bottle, 0.04, 0.045, 0.2, m.glassBottle, 0, 0.1, 0, 14);
  cyl(bottle, 0.014, 0.025, 0.07, m.glassBottle, 0, 0.235, 0, 10);
  cyl(bottle, 0.015, 0.015, 0.02, m.blackPlastic, 0, 0.28, 0, 8);
  box(bottle, 0.07, 0.07, 0.002, m.paper, 0, 0.1, 0.046, { cast: false });
  g.add(bottle);
  const glass = cyl(g, 0.032, 0.028, 0.08, new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.3 }), dx - 0.72, top + 0.04, dz + 0.32, 12);
  glass.castShadow = false;
  anchors.bottle = new THREE.Vector3(dx - 0.85, top + 0.15, dz + 0.25);

  const phone = new THREE.Group();
  phone.position.set(dx + 0.15, top, dz - 0.3);
  phone.rotation.y = -0.2;
  box(phone, 0.2, 0.06, 0.16, m.blackPlastic, 0, 0.03, 0);
  const receiver = box(phone, 0.22, 0.04, 0.05, m.blackPlastic, 0, 0.08, -0.03);
  receiver.rotation.z = 0.05;
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 4), glow(0xff2040, 5));
  led.position.set(0.07, 0.062, 0.06);
  phone.add(led);
  g.add(phone);
  ups.push({ update: (_dt, t) => { led.visible = Math.sin(t * 3) > 0.2; } }); // ungehörte Nachricht
  anchors.phone = new THREE.Vector3(dx + 0.15, top + 0.08, dz - 0.3);

  const frame = new THREE.Group();
  frame.position.set(dx - 0.8, top, dz - 0.3);
  frame.rotation.set(0, 0.5, 0);
  box(frame, 0.14, 0.18, 0.012, m.chrome, 0, 0.09, 0).rotation.x = -0.25;
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.15), new THREE.MeshStandardMaterial({ color: 0x6a7480, roughness: 0.4 }));
  photo.position.set(0, 0.09, 0.008);
  photo.rotation.x = -0.25;
  frame.add(photo);
  g.add(frame);
  anchors.photo = new THREE.Vector3(dx - 0.8, top + 0.1, dz - 0.3);

  // --- Wanduhr an der Südwand: 02:47 ---
  const clock = new THREE.Group();
  clock.position.set(0.2, 2.35, ROOM.maxZ - 0.03);
  clock.rotation.y = Math.PI;
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.22, 32), new THREE.MeshStandardMaterial({ map: clockFace(), roughness: 0.3 }));
  clock.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.02, 8, 32), m.blackPlastic);
  clock.add(rim);
  const hourHand = box(clock, 0.016, 0.12, 0.005, m.blackPlastic, 0, 0, 0.01, { cast: false });
  hourHand.geometry.translate(0, 0.05, 0);
  const minHand = box(clock, 0.01, 0.18, 0.005, m.blackPlastic, 0, 0, 0.015, { cast: false });
  minHand.geometry.translate(0, 0.08, 0);
  g.add(clock);
  anchors.clock = new THREE.Vector3(0.2, 2.35, ROOM.maxZ - 0.1);
  // Spielzeit startet 02:47; eine Spielminute = 10 Sekunden Echtzeit
  const clockState = { minutes: 2 * 60 + 47 };
  ups.push({
    update: (dt) => {
      clockState.minutes += dt / 10;
      const mm = clockState.minutes % 60, hh = (clockState.minutes / 60) % 12;
      minHand.rotation.z = -(mm / 60) * Math.PI * 2;
      hourHand.rotation.z = -(hh / 12) * Math.PI * 2;
    },
  });

  // --- Deckenventilator mit flackernder Glühbirne ---
  const fan = new THREE.Group();
  fan.position.set(0.3, ROOM.h, -0.2);
  cyl(fan, 0.015, 0.015, 0.35, m.metal, 0, -0.17, 0, 6);
  cyl(fan, 0.12, 0.1, 0.12, m.metal, 0, -0.38, 0, 14);
  const blades = new THREE.Group();
  blades.position.y = -0.43;
  for (let k = 0; k < 4; k++) {
    const b = box(blades, 0.62, 0.012, 0.13, m.darkWood, 0.36, 0, 0);
    const holder = new THREE.Group();
    holder.rotation.y = (k * Math.PI) / 2;
    holder.add(b);
    blades.add(holder);
  }
  fan.add(blades);
  const fanBulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), glow(0xffcc88, 3));
  fanBulb.position.y = -0.5;
  fan.add(fanBulb);
  g.add(fan);
  const fanLight = new THREE.PointLight(0xffb070, 3.2, 7, 1.8);
  fanLight.position.set(0.3, ROOM.h - 0.6, -0.2);
  g.add(fanLight);
  ups.push({ update: (dt) => { blades.rotation.y += dt * 1.6; } });
  anchors.fan = new THREE.Vector3(0.3, ROOM.h - 0.5, -0.2);

  // --- Plakat an der Ostwand ---
  const post = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.05), new THREE.MeshStandardMaterial({ map: poster(), roughness: 0.7 }));
  post.position.set(ROOM.maxX - 0.02, 1.75, -1.9);
  post.rotation.y = -Math.PI / 2;
  g.add(post);
  anchors.poster = post.position.clone().add(new THREE.Vector3(-0.1, 0, 0));

  // --- Neon "OFFEN" hängt im Fenster, Schrift zeigt nach außen ---
  const open = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.2),
    new THREE.MeshBasicMaterial({ map: neonText('OFFEN', '#ff3d6e'), transparent: true, color: new THREE.Color(2.5, 2.5, 2.5), depthWrite: false, side: THREE.DoubleSide }));
  open.position.set(3.3, 2.2, WINDOW.z + 0.12);
  open.rotation.y = Math.PI; // von innen spiegelverkehrt sichtbar
  g.add(open);
  const openLight = new THREE.PointLight(0xff2d5a, 1.2, 3, 2);
  openLight.position.set(3.3, 2.2, WINDOW.z + 0.4);
  g.add(openLight);
  // Fehlerhafter Transformator: das Schild flackert unregelmäßig
  ups.push({
    update: (_dt, t) => {
      const f = Math.sin(t * 13) * Math.sin(t * 7.7) > 0.93 ? 0.15 : 1;
      (open.material as THREE.MeshBasicMaterial).color.setScalar(2.5 * f);
      openLight.intensity = 1.2 * f;
    },
  });

  anchors.window = new THREE.Vector3(0, 1.8, WINDOW.z + 0.2);
  anchors.cabinet = new THREE.Vector3(-4.5, 1.0, -2.2);
  anchors.couch = new THREE.Vector3(4.2, 0.6, 0.6);
  anchors.shelf = new THREE.Vector3(-4.6, 1.3, 0.8);
  anchors.kitchen = new THREE.Vector3(-4.3, 1.0, 3.3);

  return { group: g, updatables: ups, anchors, fanLight, deskLamp };
}

function clockFace(): THREE.Texture {
  return canvasTexture('clockFace', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d9d2bf';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b1b1b';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.save();
      ctx.translate(w / 2 + Math.sin(a) * 105, h / 2 - Math.cos(a) * 105);
      ctx.rotate(a);
      ctx.fillRect(-3, -10, 6, 20);
      ctx.restore();
    }
    ctx.font = '16px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VOLKSZEIT', w / 2, h * 0.68);
    const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(60,40,10,0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}
