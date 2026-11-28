import * as THREE from 'three';
import type { Input } from '../core/Input';
import { events } from '../core/Events';
import { loc, t, type LocText } from '../core/i18n';
import { gameState } from '../gameplay/GameState';
import type { Subtitles } from '../ui/Subtitles';

/**
 * Untersuchen-System: findet das passendste Objekt in Reichweite (Nähe + liegt
 * in Blickrichtung der Kamera), zeigt den Hinweis "[E] Untersuchen: …" und spielt
 * beim Drücken Kais Monolog aus den JSON-Daten ab. Q schaltet den Cyberauge-Scan,
 * der alle Objekte im Umkreis markiert.
 */
export interface InteractableDef {
  id: string;
  anchor: string;
  radius: number;
  label: LocText;
  lines: LocText[];
  repeat?: LocText[];
  flag?: string;
  requiresFlag?: string;
}

export interface Marker { id: string; x: number; y: number; visible: boolean; focused: boolean; label: string }

export class Interaction {
  private items: Array<InteractableDef & { pos: THREE.Vector3 }> = [];
  focused: string | null = null;
  scanActive = false;
  private scanLevel = 0;
  private tmp = new THREE.Vector3();
  private camDir = new THREE.Vector3();
  enabled = false;
  /** Externe Reaktion auf ein Untersuchen (z. B. Intro zählt mit). */
  onExamine?: (id: string, first: boolean) => void;
  /** Spezielle Aktion statt Monolog (z. B. Tür) – gibt true zurück, wenn behandelt. */
  onAction?: (id: string) => boolean;

  constructor(private input: Input, private camera: THREE.PerspectiveCamera, private subs: Subtitles) {}

  load(defs: InteractableDef[], anchors: Record<string, THREE.Vector3>): void {
    this.items = defs
      .filter((d) => anchors[d.anchor])
      .map((d) => ({ ...d, pos: anchors[d.anchor].clone() }));
  }

  /** 0..1 – weich ein-/ausgeblendeter Scan-Zustand für Postprocessing/HUD. */
  get scan(): number {
    return this.scanLevel;
  }

  update(dt: number, player: THREE.Vector3): void {
    if (this.enabled && this.input.pressed('scan')) {
      this.scanActive = !this.scanActive;
      events.emit('scan', { active: this.scanActive });
    }
    this.scanLevel += ((this.scanActive ? 1 : 0) - this.scanLevel) * Math.min(1, dt * 6);

    this.focused = null;
    if (!this.enabled) {
      events.emit('prompt', { text: null });
      return;
    }
    this.camera.getWorldDirection(this.camDir);
    let best = -Infinity;
    for (const it of this.items) {
      if (it.requiresFlag && !gameState.flag(it.requiresFlag)) continue;
      const flat = Math.hypot(it.pos.x - player.x, it.pos.z - player.z);
      if (flat > it.radius) continue;
      this.tmp.copy(it.pos).sub(this.camera.position).normalize();
      const dot = this.tmp.dot(this.camDir);
      if (dot < 0.82) continue;
      const score = dot * 2 - flat / it.radius;
      if (score > best) {
        best = score;
        this.focused = it.id;
      }
    }
    const f = this.items.find((i) => i.id === this.focused);
    events.emit('prompt', { text: f ? `${t('hud.examine')}: ${loc(f.label)}` : null });

    if (f && this.input.pressed('interact') && !this.subs.busy) this.examine(f);
  }

  private examine(it: InteractableDef): void {
    if (this.onAction?.(it.id)) return;
    const first = gameState.markExamined(it.id);
    if (it.flag) gameState.setFlag(it.flag);
    const lines = !first && it.repeat ? it.repeat : it.lines;
    lines.forEach((l) => this.subs.push('Kai', loc(l)));
    this.onExamine?.(it.id, first);
  }

  /** Bildschirmpositionen aller Objekte für die Scan-Marker. */
  markers(player: THREE.Vector3, w: number, h: number): Marker[] {
    const out: Marker[] = [];
    for (const it of this.items) {
      if (it.requiresFlag && !gameState.flag(it.requiresFlag)) continue;
      const d = it.pos.distanceTo(player);
      this.tmp.copy(it.pos).project(this.camera);
      const visible = this.tmp.z < 1 && Math.abs(this.tmp.x) < 1.1 && Math.abs(this.tmp.y) < 1.1 && d < 9;
      out.push({
        id: it.id,
        x: (this.tmp.x * 0.5 + 0.5) * w,
        y: (-this.tmp.y * 0.5 + 0.5) * h,
        visible,
        focused: it.id === this.focused,
        label: loc(it.label),
      });
    }
    return out;
  }
}
