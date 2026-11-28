import * as THREE from 'three';
import { rng } from '../../materials/Textures';
import { settings } from '../../core/Settings';

/**
 * Skyline als ein einziges InstancedMesh (ein Draw-Call für hunderte Gebäude).
 * Fensterlichter entstehen im Shader aus der Weltposition: Raster pro Fassade,
 * Hash pro Fenster entscheidet über an/aus und Farbe (warm, cyan, magenta).
 * Dadurch keine Texturen, keine UV-Verzerrung bei skalierten Instanzen.
 */
export const STREET_Y = -16;

export interface SkylineParts {
  group: THREE.Group;
  /** Grundrisse naher Gebäude (für Hologramm-/Schild-Platzierung). */
  tower: THREE.Vector3;
}

function buildingMaterial(): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color: 0x0b0d12, roughness: 0.55, metalness: 0.35, envMapIntensity: 0.5 });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWPos; varying vec3 vWNrm; varying float vSeed;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        mat4 bInst = mat4(1.0);
        #ifdef USE_INSTANCING
          bInst = instanceMatrix;
        #endif
        vWPos = (modelMatrix * bInst * vec4(transformed, 1.0)).xyz;
        vWNrm = normalize(mat3(modelMatrix * bInst) * objectNormal);
        vSeed = fract(bInst[3].x * 0.137 + bInst[3].z * 0.071);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWPos; varying vec3 vWNrm; varying float vSeed;
        float wh(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          vec3 n = normalize(vWNrm);
          if (abs(n.y) < 0.5) {
            vec2 tng = normalize(vec2(-n.z, n.x));
            float u = dot(vWPos.xz, tng);
            vec2 cell = vec2(u / 2.4, (vWPos.y + 16.0) / 3.3);
            vec2 id = floor(cell);
            vec2 f = fract(cell);
            float frame = step(0.14, f.x) * step(f.x, 0.86) * step(0.22, f.y) * step(f.y, 0.8);
            float r = wh(id + vSeed * 91.0);
            // Etagen-Bänder: manche Etagen komplett dunkel
            float floorOn = step(0.18, wh(vec2(id.y, vSeed * 13.0)));
            float lit = step(0.62, r) * floorOn;
            vec3 warm = vec3(1.0, 0.62, 0.32);
            vec3 cyan = vec3(0.25, 0.85, 1.0);
            vec3 mag = vec3(1.0, 0.25, 0.75);
            float k = wh(id * 1.7 + 3.0);
            vec3 wc = k < 0.62 ? warm : (k < 0.85 ? cyan : mag);
            float bright = 0.6 + 0.9 * wh(id + 7.0);
            // sehr selten flackernde Fenster
            // In der Ferne (Zelle kleiner als ~2 Pixel) Mittelwert statt Muster → kein Flimmern
            float fw = max(fwidth(cell.x), fwidth(cell.y));
            float detail = 1.0 - smoothstep(0.25, 0.6, fw);
            float pattern = mix(0.2, frame * lit * bright, detail);
            totalEmissiveRadiance += mix(vec3(1.0, 0.6, 0.4), wc, detail) * pattern * 1.4;
            // matte Glasflächen dunkler Fenster spiegeln schwach
            diffuseColor.rgb *= mix(1.0, 0.6, frame);
          }
        }`);
  };
  return mat;
}

export function buildSkyline(): SkylineParts {
  const g = new THREE.Group();
  g.name = 'Skyline';
  const r = rng(2089);
  const density = settings.preset.skylineDensity;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);

  type B = { x: number; z: number; w: number; d: number; h: number; ry: number };
  const list: B[] = [];

  // 1) Gegenüberliegende Straßenseite: dichte Reihe, 18–26 m entfernt
  for (let x = -70; x < 70;) {
    const w = 7 + r() * 9;
    const d = 10 + r() * 6;
    // Vorderfassade exakt bei z = -21, damit Schilder und Hologramm davor sitzen
    list.push({ x: x + w / 2, z: -21 - d / 2, w, d, h: 20 + r() * 34, ry: 0 });
    x += w + 0.6 + r() * 2;
  }
  // 2) Seitliche Nachbarn auf unserer Straßenseite
  for (const sx of [-1, 1]) {
    list.push({ x: sx * 13, z: 2, w: 12, d: 14, h: 24 + r() * 6, ry: 0 });
    list.push({ x: sx * 27, z: 1, w: 14, d: 14, h: 30 + r() * 20, ry: 0 });
  }
  // 3) Mittlere und ferne Skyline, nach hinten höher (Mittelstadt, Konzernviertel)
  const far = Math.round(420 * density);
  for (let i = 0; i < far; i++) {
    const z = -45 - Math.pow(r(), 0.8) * 420;
    const x = (r() - 0.5) * (260 + -z * 1.6);
    const dist = -z;
    const h = 18 + r() * (25 + dist * 0.35) + (r() < 0.06 ? 120 : 0);
    const w = 10 + r() * 18;
    list.push({ x, z, w, d: 10 + r() * 18, h, ry: (r() - 0.5) * 0.4 });
  }

  const mesh = new THREE.InstancedMesh(geo, buildingMaterial(), list.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  list.forEach((b, i) => {
    q.setFromEuler(new THREE.Euler(0, b.ry, 0));
    m4.compose(new THREE.Vector3(b.x, STREET_Y, b.z), q, new THREE.Vector3(b.w, b.h, b.d));
    mesh.setMatrixAt(i, m4);
  });
  mesh.receiveShadow = false;
  mesh.castShadow = false;
  mesh.computeBoundingSphere();
  g.add(mesh);

  // Rote Flugwarnlichter auf hohen Dächern (Instanced, blinken per Shader-freier Sichtbarkeit)
  const tall = list.filter((b) => b.h > 60);
  const lights = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.6, 6, 4),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 0.4, 0.3) }),
    tall.length,
  );
  tall.forEach((b, i) => {
    m4.makeTranslation(b.x, STREET_Y + b.h + 0.8, b.z);
    lights.setMatrixAt(i, m4);
  });
  lights.name = 'aviation';
  g.add(lights);

  // KORVUS-Wetterturm in der Ferne: höchster Bau, Ring an der Spitze (Vorausdeutung)
  const tower = new THREE.Vector3(60, STREET_Y, -330);
  const tMat = new THREE.MeshStandardMaterial({ color: 0x07080c, roughness: 0.3, metalness: 0.8 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(9, 16, 300, 8), tMat);
  shaft.position.set(tower.x, STREET_Y + 150, tower.z);
  g.add(shaft);
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 4, 70, 6), tMat);
  spire.position.set(tower.x, STREET_Y + 335, tower.z);
  g.add(spire);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(18, 0.9, 6, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 2.2, 3.0) }));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(tower.x, STREET_Y + 300, tower.z);
  ring.name = 'towerRing';
  g.add(ring);

  // Straße: nasser Asphalt mit glänzenden Pfützenflecken
  const street = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 60),
    new THREE.MeshStandardMaterial({ color: 0x07080b, roughness: 0.12, metalness: 0.2, envMapIntensity: 2.2 }),
  );
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, STREET_Y, -14);
  g.add(street);
  // Bürgersteige und Fahrbahnmarkierung
  for (const z of [-6.5, -21.5]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(400, 0.25, 3), new THREE.MeshStandardMaterial({ color: 0x14161b, roughness: 0.3 }));
    curb.position.set(0, STREET_Y + 0.12, z);
    g.add(curb);
  }
  const markGeo = new THREE.PlaneGeometry(3, 0.15);
  const marks = new THREE.InstancedMesh(markGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 0.5, 0.25) }), 40);
  for (let i = 0; i < 40; i++) {
    m4.makeRotationX(-Math.PI / 2).setPosition(-120 + i * 6, STREET_Y + 0.01, -14);
    marks.setMatrixAt(i, m4);
  }
  g.add(marks);

  // Natriumdampf-Straßenlaternen: emissive Köpfe + wenige echte Lichter
  const lampHeads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.8, 0.2, 0.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 2.1, 0.6) }), 14);
  for (let i = 0; i < 14; i++) {
    const x = -52 + i * 8;
    m4.makeTranslation(x, STREET_Y + 7, -20.5);
    lampHeads.setMatrixAt(i, m4);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 7, 6), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    pole.position.set(x, STREET_Y + 3.5, -21);
    g.add(pole);
  }
  g.add(lampHeads);
  for (const x of [-12, 4, 20]) {
    const l = new THREE.PointLight(0xff8a2a, 120, 26, 2);
    l.position.set(x, STREET_Y + 6.5, -19.5);
    g.add(l);
  }

  return { group: g, tower };
}
