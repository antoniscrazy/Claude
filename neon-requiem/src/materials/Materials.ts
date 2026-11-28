import * as THREE from 'three';
import { woodFloor, plasterWall, ceiling, leather, scratchedMetal } from './Textures';

/**
 * Gemeinsame Materialien und Bauhelfer für prozedurale Objekte.
 * Materialien werden lazily erzeugt und geteilt (weniger Draw-State-Wechsel).
 */
let lib: ReturnType<typeof build> | null = null;

function build() {
  const wood = woodFloor();
  wood.map.repeat.set(2.5, 2.5);
  wood.rough.repeat.set(2.5, 2.5);
  const plaster = plasterWall();
  plaster.repeat.set(2, 1);
  const ceil = ceiling();
  ceil.repeat.set(3, 3);
  return {
    floor: new THREE.MeshStandardMaterial({ map: wood.map, roughnessMap: wood.rough, roughness: 0.75, envMapIntensity: 0.6 }),
    wall: new THREE.MeshStandardMaterial({ map: plaster, roughness: 0.92, envMapIntensity: 0.25 }),
    ceiling: new THREE.MeshStandardMaterial({ map: ceil, roughness: 0.95 }),
    darkWood: new THREE.MeshStandardMaterial({ color: 0x3a2416, roughness: 0.55, envMapIntensity: 0.7 }),
    deskTop: new THREE.MeshStandardMaterial({ color: 0x24160e, roughness: 0.32, envMapIntensity: 1.0 }),
    leather: new THREE.MeshStandardMaterial({ map: leather(), roughness: 0.55, envMapIntensity: 0.6 }),
    metal: new THREE.MeshStandardMaterial({ map: scratchedMetal(), roughness: 0.45, metalness: 0.75 }),
    olive: new THREE.MeshStandardMaterial({ map: scratchedMetal('#3b4232'), roughness: 0.5, metalness: 0.6 }),
    blackPlastic: new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.4 }),
    beigePlastic: new THREE.MeshStandardMaterial({ color: 0x8c8574, roughness: 0.55 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xcfd6dc, roughness: 0.15, metalness: 1 }),
    ceramic: new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.25 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xc9c2ae, roughness: 0.9 }),
    cardboard: new THREE.MeshStandardMaterial({ color: 0x6b5238, roughness: 0.95 }),
    rug: new THREE.MeshStandardMaterial({ color: 0x3d0f14, roughness: 1 }),
    windowFrame: new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 0.35, metalness: 0.6 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.6 }),
    glassBottle: new THREE.MeshPhysicalMaterial({
      color: 0x6a3a10, roughness: 0.08, transmission: 0, transparent: true, opacity: 0.75, envMapIntensity: 1.5,
    }),
  };
}

export function M() {
  if (!lib) lib = build();
  return lib;
}

/** Emissives Material, das über den Bloom-Schwellwert leuchtet. */
export function glow(color: THREE.ColorRepresentation, intensity = 3): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity, roughness: 1 });
}

export interface BoxOpts {
  cast?: boolean;
  receive?: boolean;
}

/** Box-Mesh an Position (Mittelpunkt) in Parent einhängen. */
export function box(parent: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0, o: BoxOpts = {}): THREE.Mesh {
  const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  me.position.set(x, y, z);
  me.castShadow = o.cast ?? true;
  me.receiveShadow = o.receive ?? true;
  parent.add(me);
  return me;
}

export function cyl(parent: THREE.Object3D, rt: number, rb: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 16): THREE.Mesh {
  const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  me.position.set(x, y, z);
  me.castShadow = true;
  me.receiveShadow = true;
  parent.add(me);
  return me;
}
