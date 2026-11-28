import { loadJSON, saveJSON } from './Storage';
import { events } from './Events';

export type PresetName = 'low' | 'medium' | 'high';
export type Lang = 'de' | 'en';

/** Technische Parameter, die ein Grafik-Preset festlegt. */
export interface GraphicsPreset {
  pixelRatio: number;      // Obergrenze für devicePixelRatio
  renderScale: number;     // zusätzlicher Faktor (Low rendert unter nativer Auflösung)
  shadows: boolean;
  shadowMapSize: number;
  outdoorShadow: boolean;  // Schatten der Jalousien durch das Außenlicht
  rainDrops: number;       // Regenstreifen draußen
  particles: number;       // Multiplikator für Dampf/Rauch
  bloom: boolean;
  bloomMips: boolean;
  chromatic: boolean;
  grain: boolean;
  smaa: boolean;
  skylineDensity: number;  // 0..1
  spinners: number;
  volumetrics: boolean;    // Lichtkegel
}

export const PRESETS: Record<PresetName, GraphicsPreset> = {
  low: {
    pixelRatio: 1, renderScale: 0.8, shadows: false, shadowMapSize: 512, outdoorShadow: false,
    rainDrops: 2500, particles: 0.4, bloom: true, bloomMips: false, chromatic: false, grain: true,
    smaa: false, skylineDensity: 0.5, spinners: 4, volumetrics: false,
  },
  medium: {
    pixelRatio: 1.25, renderScale: 1, shadows: true, shadowMapSize: 1024, outdoorShadow: false,
    rainDrops: 7000, particles: 0.75, bloom: true, bloomMips: true, chromatic: true, grain: true,
    smaa: true, skylineDensity: 0.8, spinners: 8, volumetrics: true,
  },
  high: {
    pixelRatio: 2, renderScale: 1, shadows: true, shadowMapSize: 2048, outdoorShadow: true,
    rainDrops: 14000, particles: 1, bloom: true, bloomMips: true, chromatic: true, grain: true,
    smaa: true, skylineDensity: 1, spinners: 12, volumetrics: true,
  },
};

export type Action =
  | 'forward' | 'back' | 'left' | 'right' | 'sprint' | 'crouch'
  | 'interact' | 'inventory' | 'journal' | 'scan';

export interface SettingsData {
  preset: PresetName;
  ssao: boolean;
  showFps: boolean;
  volMaster: number;
  volMusic: number;
  volSfx: number;
  volVoice: number;
  mouseSensitivity: number;
  invertY: boolean;
  subtitleSize: number;   // 0.8 .. 1.6
  language: Lang;
  tts: boolean;           // Kais Monolog über Web Speech API
  colorblind: boolean;    // Markierungen zusätzlich mit Form statt nur Farbe
  bindings: Record<Action, string>;
}

const DEFAULTS: SettingsData = {
  preset: 'medium',
  ssao: false,
  showFps: false,
  volMaster: 0.8,
  volMusic: 0.6,
  volSfx: 0.8,
  volVoice: 0.8,
  mouseSensitivity: 1,
  invertY: false,
  subtitleSize: 1,
  language: 'de',
  tts: false,
  colorblind: false,
  bindings: {
    forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD',
    sprint: 'ShiftLeft', crouch: 'KeyC', interact: 'KeyE',
    inventory: 'Tab', journal: 'KeyJ', scan: 'KeyQ',
  },
};

class SettingsStore {
  data: SettingsData;

  constructor() {
    const loaded = loadJSON<SettingsData>('settings', DEFAULTS);
    // Bindings separat zusammenführen, damit neue Aktionen nicht fehlen.
    loaded.bindings = { ...DEFAULTS.bindings, ...(loaded.bindings ?? {}) };
    if (!(loaded.preset in PRESETS)) loaded.preset = DEFAULTS.preset;
    this.data = loaded;
  }

  get preset(): GraphicsPreset {
    return PRESETS[this.data.preset];
  }

  set<K extends keyof SettingsData>(key: K, value: SettingsData[K]): void {
    this.data[key] = value;
    saveJSON('settings', this.data);
    events.emit('settings:changed');
    if (key === 'preset' || key === 'ssao') events.emit('preset:changed');
  }

  resetBindings(): void {
    this.set('bindings', { ...DEFAULTS.bindings });
  }
}

export const settings = new SettingsStore();
