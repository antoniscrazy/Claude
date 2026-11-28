import './ui/style.css';
import * as THREE from 'three';
import { Engine } from './core/Engine';
import { Input } from './core/Input';
import { settings } from './core/Settings';
import { events } from './core/Events';
import { CameraRig } from './systems/CameraRig';
import { PlayerController } from './systems/PlayerController';
import { Interaction, type InteractableDef } from './systems/Interaction';
import { SmokeEmitter } from './systems/Particles';
import { AudioCore } from './systems/audio/AudioCore';
import { SoundBank } from './systems/audio/SoundBank';
import { Music } from './systems/audio/Music';
import { OfficeScene } from './scenes/OfficeScene';
import { WINDOW, DOOR, ROOM } from './scenes/office/Room';
import { IntroSequence } from './gameplay/IntroSequence';
import { gameState } from './gameplay/GameState';
import { HUD } from './ui/HUD';
import { Menus } from './ui/Menus';
import { Subtitles } from './ui/Subtitles';
import { t } from './core/i18n';
import interactables from './data/interactables.json';

/**
 * Einstiegspunkt: verbindet Engine, Szene, Spieler, Audio und UI und steuert
 * die Zustände Menü → Spiel ⇄ Pause.
 */
type State = 'boot' | 'menu' | 'playing' | 'paused';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const uiRoot = document.getElementById('ui') as HTMLElement;

const engine = new Engine(canvas);
const input = new Input(canvas);
const office = new OfficeScene(engine);
const rig = new CameraRig(engine.camera, office.world);
const player = new PlayerController(input, office.world, rig);
const subs = new Subtitles(uiRoot);
const hud = new HUD(uiRoot);
const menus = new Menus(uiRoot);
const interaction = new Interaction(input, engine.camera, subs);
const audio = new AudioCore(engine.camera);
const sound = new SoundBank(audio);
const music = new Music(audio);
const intro = new IntroSequence(uiRoot, subs, rig, office, sound, music);

let state: State = 'boot';
let menuT = 0;
const SPAWN = { x: -1.1, z: -2.9, yaw: Math.PI };

function setState(s: State): void {
  state = s;
  engine.paused = s === 'paused';
  player.active = s === 'playing' && !rig.inCinematic && controlGiven;
  input.enabled = s === 'playing';
  interaction.enabled = s === 'playing' && controlGiven;
  hud.show(s === 'playing' || s === 'paused');
  if (s === 'playing') menus.show('none');
  if (s === 'paused') { menus.show('pause'); input.unlock(); }
  if (s === 'menu') { menus.show('main'); input.unlock(); }
  uiRoot.classList.toggle('in-game', s === 'playing');
}

let controlGiven = false;
intro.onControl = () => {
  controlGiven = true;
  player.active = state === 'playing';
  interaction.enabled = state === 'playing';
  hud.showHint(true);
  setTimeout(() => hud.showHint(false), 9000);
};
interaction.onExamine = () => intro.examined();
interaction.onAction = () => false;

async function boot(): Promise<void> {
  menus.showLoading(true);
  // Schrift laden, bevor Canvas-Texturen mit Text gezeichnet werden
  try { await document.fonts.load('32px "Share Tech Mono"'); } catch { /* Fallback-Monospace */ }
  await office.build((p) => menus.setProgress(p));

  engine.scene.add(player.kai.root);
  player.spawn(SPAWN.x, SPAWN.z, SPAWN.yaw);
  interaction.load(interactables.office as InteractableDef[], office.anchors);

  // Räumliche Klangquellen
  const R = office.root;
  sound.place('window', R, new THREE.Vector3(0, 1.9, WINDOW.z), 2.5, 0.9);
  sound.place('neon', R, new THREE.Vector3(3.3, 2.2, WINDOW.z + 0.1), 0.8, 1.4);
  sound.place('fan', R, new THREE.Vector3(0.3, ROOM.h - 0.4, -0.2), 1.2, 1.2);
  sound.place('fridge', R, new THREE.Vector3(-3.3, 0.5, 3.5), 0.6, 1.4);
  sound.place('puddle', R, new THREE.Vector3(2.5, 0.05, ROOM.minZ + 0.6), 0.8, 1.3);
  sound.place('door', R, new THREE.Vector3(DOOR.x, 1.3, ROOM.maxZ), 2.5, 0.8);
  sound.place('steps', player.kai.root, new THREE.Vector3(0, 0.05, 0), 1.5, 1);
  office.puddle.onDrip = () => sound.drip();
  office.lightning.onThunder = (s, d) => sound.thunder(s, d);
  player.kai.onStep = (i) => sound.step(i);

  engine.add(office);
  engine.add(player);
  // Der Menühintergrund läuft auch in der Pause nicht weiter, aber im Menü schon
  rig.setCinematic(office.menuCam.pos, office.menuCam.look);
  rig.snapCinematic();
  menus.showLoading(false);
  setState('menu');
}

function startAudio(): void {
  void audio.resume().then(() => {
    sound.startAmbience();
    music.start();
  });
}

menus.onNewGame = () => {
  startAudio();
  gameState.reset();
  menus.showLoading(true);
  menus.setProgress(1);
  subs.clear();
  controlGiven = false;
  player.spawn(SPAWN.x, SPAWN.z, SPAWN.yaw);
  player.crouching = false;
  setTimeout(() => {
    menus.showLoading(false);
    setState('playing');
    intro.start();
    hud.setStats(gameState.data.health, gameState.data.stress);
    input.lock();
  }, 1600);
};
menus.onResume = () => {
  setState('playing');
  input.lock();
};
menus.onQuit = () => {
  subs.clear();
  intro.running = false;
  controlGiven = false;
  music.setLayer('silent', 2);
  rig.setCinematic(office.menuCam.pos, office.menuCam.look);
  setState('menu');
};

// Erster Klick irgendwo startet das Audio (Browser-Autoplay-Regeln)
window.addEventListener('pointerdown', () => startAudio(), { once: true });

// Pointer Lock verloren (Esc) → Pause
document.addEventListener('pointerlockchange', () => {
  if (!input.locked && state === 'playing' && controlGiven) setState('paused');
});
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Escape') return;
  if (menus.escape()) return;
  if (state === 'paused') setState('playing');
  else if (state === 'playing') setState('paused');
});

let clockMinutes = 2 * 60 + 47;

engine.start((dt) => {
  input.poll();
  if (input.padStartPressed()) {
    if (state === 'playing') setState('paused');
    else if (state === 'paused') setState('playing');
  }

  if (state === 'menu') {
    // Langsame Kamerafahrt am Fenster entlang
    menuT += dt;
    const p = office.menuCam.pos.clone().add(new THREE.Vector3(Math.sin(menuT * 0.07) * 1.6, Math.sin(menuT * 0.11) * 0.15, Math.cos(menuT * 0.05) * 0.5));
    rig.setCinematic(p, office.menuCam.look);
  }

  if (state === 'playing') {
    intro.update(dt);
    player.active = controlGiven && !rig.inCinematic;
    if (input.pressedCode('Space')) subs.skip();
    interaction.update(dt, player.position);
    gameState.data.playTime += dt;
    clockMinutes += dt / 10;
    hud.setClock(clockMinutes);
    hud.showClickToPlay(controlGiven && !input.locked);
  }

  if (state !== 'paused') {
    rig.update(dt, player.position, player.crouching ? 1 : 0);
    player.kai.setFade(rig.currentDistance > 0.55 || rig.inCinematic ? 1 : 0);
    subs.update(dt);
    sound.update(dt);
    music.update(dt);
  }

  engine.post.scan = interaction.scan;
  hud.setMarkers(interaction.markers(player.position, window.innerWidth, window.innerHeight), interaction.scan);
  hud.setFps(engine.fps);
  SmokeEmitter.viewportHeight = engine.renderer.domElement.height;
  input.endFrame();
});

events.on('preset:changed', () => menus.flash(`${t('opt.preset')}: ${t('opt.' + settings.data.preset)}`));

// Nur im Dev-Server: Zugriff für Konsole und automatisierte Tests
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__nr = {
    engine, player, rig, office, interaction, gameState, intro,
    get state() { return state; },
    get control() { return controlGiven; },
  };
}

boot().catch((err) => {
  console.error(err);
  uiRoot.innerHTML = `<div class="fatal">Start fehlgeschlagen: ${String(err?.message ?? err)}</div>`;
});
