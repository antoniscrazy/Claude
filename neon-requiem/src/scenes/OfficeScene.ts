import * as THREE from 'three';
import type { Engine, Updatable } from '../core/Engine';
import { settings } from '../core/Settings';
import { events } from '../core/Events';
import { CollisionWorld } from '../systems/Collision';
import { buildRoom, ROOM, WINDOW, DOOR } from './office/Room';
import { buildFurniture } from './office/Furniture';
import { buildProps, type PropParts } from './office/Props';
import { WindowGlass } from './office/WindowGlass';
import { Puddle } from './office/Puddle';
import { LightShafts } from './office/LightShafts';
import { Sky } from './city/Sky';
import { buildSkyline } from './city/Skyline';
import { KoiHologram } from './city/Hologram';
import { Spinners } from './city/Spinners';
import { OutdoorRain } from './city/OutdoorRain';
import { buildCityDressing } from './city/CityDressing';
import { Lightning } from './city/Lightning';
import { buildNeonEnvironment } from './city/Environment';

/**
 * Prolog-Schauplatz: Kais Büro + die Stadt vor dem Fenster.
 * Baut alles in Schritten auf (für den Fortschrittsbalken) und verwaltet
 * die Kopplung von Blitz → Himmel/Scheibe/Regen/Bloom und Koi → Lichtkegel.
 */
export class OfficeScene implements Updatable {
  readonly world = new CollisionWorld();
  readonly root = new THREE.Group();
  props!: PropParts;
  door!: THREE.Group;
  glass!: WindowGlass;
  puddle!: Puddle;
  shafts!: LightShafts;
  koi!: KoiHologram;
  lightning!: Lightning;
  sky!: Sky;
  rain!: OutdoorRain;
  private koiSpot!: THREE.SpotLight;
  private bounce!: THREE.SpotLight;
  private hemi!: THREE.HemisphereLight;
  private updatables: Updatable[] = [];
  private doorShake = 0;
  private fanFlicker = 0;
  readonly anchors: Record<string, THREE.Vector3> = {};
  /** Im Menü: Kamerafahrt am Fenster entlang. */
  readonly menuCam = { pos: new THREE.Vector3(-3.7, 1.55, -0.4), look: new THREE.Vector3(1.2, 1.9, -9) };

  constructor(private engine: Engine) {}

  /** Baut die Szene in Etappen; `progress` wird mit 0..1 aufgerufen. */
  async build(progress: (p: number) => void): Promise<void> {
    const { scene, renderer, camera } = this.engine;
    const step = async (p: number) => {
      progress(p);
      await new Promise((r) => setTimeout(r, 0)); // UI atmen lassen
    };

    scene.fog = new THREE.FogExp2(0x0b0a18, 0.0058);
    scene.background = new THREE.Color(0x020308);
    scene.environment = buildNeonEnvironment(renderer);
    scene.environmentIntensity = 0.55;
    scene.add(this.root);
    await step(0.1);

    // --- Innenraum ---
    const room = buildRoom(this.world);
    this.door = room.door;
    this.root.add(room.group, buildFurniture(this.world));
    this.props = buildProps();
    this.root.add(this.props.group);
    this.updatables.push(...this.props.updatables);
    Object.assign(this.anchors, this.props.anchors);
    await step(0.3);

    this.glass = new WindowGlass();
    this.root.add(this.glass.mesh);
    const puddleCenter = new THREE.Vector3(2.4, 0.006, ROOM.minZ + 0.75);
    this.puddle = new Puddle(puddleCenter, new THREE.Vector3(2.55, WINDOW.minY - 0.05, ROOM.minZ + 0.25), 0.55);
    this.root.add(this.puddle.group);
    this.anchors.puddle = puddleCenter.clone().setY(0.2);
    this.anchors.door = new THREE.Vector3(DOOR.x, 1.1, ROOM.maxZ - 0.2);
    this.shafts = new LightShafts();
    this.root.add(this.shafts.group);
    this.updatables.push(this.glass, this.puddle, this.shafts);
    await step(0.45);

    // --- Stadt ---
    this.sky = new Sky();
    const skyline = buildSkyline();
    const dressing = buildCityDressing();
    this.root.add(this.sky.mesh, skyline.group, dressing.group);
    this.updatables.push(this.sky, ...dressing.updatables);
    await step(0.65);

    this.koi = new KoiHologram(new THREE.Vector3(0, 3.5, -15), 7);
    const spinners = new Spinners();
    this.rain = new OutdoorRain(camera);
    this.lightning = new Lightning();
    this.root.add(this.koi.group, spinners.group, this.rain.mesh, this.lightning.group);
    this.updatables.push(this.koi, spinners, this.rain, this.lightning);
    const ring = skyline.group.getObjectByName('towerRing') as THREE.Mesh;
    const aviation = skyline.group.getObjectByName('aviation') as THREE.Mesh;
    this.updatables.push({
      update: (_dt, t) => {
        // Der Wetterturm pulsiert in einem langsamen, unnatürlich regelmäßigen Takt
        const pulse = 0.4 + Math.pow(Math.max(0, Math.sin(t * 0.8)), 8) * 2.2;
        (ring.material as THREE.MeshBasicMaterial).color.setRGB(0.25 * pulse, 1.4 * pulse, 2.0 * pulse);
        aviation.visible = Math.sin(t * 2.2) > -0.2;
      },
    });
    await step(0.8);

    // --- Licht ---
    this.hemi = new THREE.HemisphereLight(0x1c2238, 0x0c0806, 0.45);
    this.root.add(this.hemi);
    // Magentalicht des Koi fällt durchs Fenster (auf "Hoch" mit Jalousie-Schatten)
    this.koiSpot = new THREE.SpotLight(0xff2aa8, 70, 40, 0.5, 0.7, 1.2);
    this.koiSpot.position.set(0, 3.5, -15);
    this.koiSpot.target.position.set(0, 0.4, -1);
    this.root.add(this.koiSpot, this.koiSpot.target);
    // Cyan-Streulicht der Straße von unten an die Decke
    this.bounce = new THREE.SpotLight(0x30d8ff, 90, 30, 0.6, 0.9, 1.2);
    this.bounce.position.set(8, -6, -14);
    this.bounce.target.position.set(-1, 3.2, 1);
    this.root.add(this.bounce, this.bounce.target);
    this.applyPreset();
    events.on('preset:changed', () => this.applyPreset());
    await step(0.92);

    // Kopplung: Blitz → alles, was aufleuchten soll; Donner via Sound (siehe main)
    this.updatables.push({
      update: () => {
        const f = this.lightning.flash;
        this.sky.setFlash(f, this.lightning.dir);
        this.glass.flash = f;
        this.rain.flash = f;
        this.engine.post.flash = f;
        this.hemi.intensity = 0.45 + f * 2.5;
      },
    });

    // Shader vorkompilieren, damit der erste Frame nicht ruckelt
    try {
      await renderer.compileAsync(scene, camera);
    } catch { /* ältere Browser: dann eben beim ersten Frame */ }
    await step(1);
  }

  applyPreset(): void {
    const p = settings.preset;
    this.shafts.setEnabled(p.volumetrics);
    const lamp = this.props.deskLamp;
    lamp.castShadow = p.shadows;
    lamp.shadow.mapSize.setScalar(p.shadowMapSize);
    lamp.shadow.map?.dispose();
    lamp.shadow.map = null;
    this.koiSpot.castShadow = p.outdoorShadow;
    if (p.outdoorShadow) {
      this.koiSpot.shadow.mapSize.setScalar(1024);
      this.koiSpot.shadow.camera.near = 8;
      this.koiSpot.shadow.camera.far = 25;
      this.koiSpot.shadow.bias = -0.0005;
      this.koiSpot.shadow.map?.dispose();
      this.koiSpot.shadow.map = null;
    }
  }

  /** Tür beim Hämmern erzittern lassen. */
  shakeDoor(amount = 1): void {
    this.doorShake = Math.min(1.5, this.doorShake + amount);
    this.fanFlicker = 0.6;
  }

  private koiPos = new THREE.Vector3();

  update(dt: number, time: number): void {
    for (const u of this.updatables) u.update(dt, time);

    // Koi-Spot folgt dem Fisch, Intensität flackert mit dem Hologramm
    this.koi.worldPos(this.koiPos);
    this.koiSpot.position.copy(this.koiPos);
    const koiLevel = this.koi.light.intensity / 380;
    this.koiSpot.intensity = 70 * koiLevel;
    this.shafts.koiLevel = koiLevel;

    // Tür zittert, Ventilatorlicht flackert beim Klopfen
    if (this.doorShake > 0.001) {
      this.door.position.z = ROOM.maxZ + Math.sin(time * 90) * 0.006 * this.doorShake;
      this.door.rotation.y = Math.sin(time * 70) * 0.004 * this.doorShake;
      this.doorShake *= Math.exp(-dt * 6);
    }
    this.fanFlicker = Math.max(0, this.fanFlicker - dt);
    const baseFan = Math.sin(time * 0.37) * Math.sin(time * 2.9) > 0.97 ? 0.4 : 1; // alte Birne
    this.props.fanLight.intensity = 3.2 * (this.fanFlicker > 0 ? (Math.random() > 0.5 ? 0.3 : 1) : baseFan);
  }
}
