import { events } from '../core/Events';
import { settings } from '../core/Settings';
import { t } from '../core/i18n';
import type { Marker } from '../systems/Interaction';

/**
 * Minimalistisches HUD: dünne Neonbalken (Gesundheit/Stress), Ziel oben links,
 * Interaktionshinweis mittig, Uhrzeit, FPS (optional), Scan-Marker des Cyberauges.
 */
export class HUD {
  readonly el: HTMLElement;
  private objective: HTMLElement;
  private prompt: HTMLElement;
  private fps: HTMLElement;
  private clock: HTMLElement;
  private health: HTMLElement;
  private stress: HTMLElement;
  private scanLabel: HTMLElement;
  private markerLayer: HTMLElement;
  private markerEls = new Map<string, HTMLElement>();
  private hint: HTMLElement;
  private clickToPlay: HTMLElement;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'hud hidden';
    this.el.innerHTML = `
      <div class="hud-objective"><span class="obj-tag" data-i18n="hud.objective"></span><span class="obj-text"></span></div>
      <div class="hud-bars">
        <div class="bar"><label data-i18n="hud.health"></label><div class="track"><div class="fill health"></div></div></div>
        <div class="bar"><label data-i18n="hud.stress"></label><div class="track"><div class="fill stress"></div></div></div>
      </div>
      <div class="hud-clock">02:47</div>
      <div class="hud-fps"></div>
      <div class="hud-prompt"><kbd>E</kbd><span></span></div>
      <div class="hud-scan"></div>
      <div class="hud-markers"></div>
      <div class="hud-hint"></div>
      <div class="hud-click"></div>
    `;
    root.appendChild(this.el);
    const q = <T extends HTMLElement>(s: string) => this.el.querySelector(s) as T;
    this.objective = q('.obj-text');
    this.prompt = q('.hud-prompt');
    this.fps = q('.hud-fps');
    this.clock = q('.hud-clock');
    this.health = q('.fill.health');
    this.stress = q('.fill.stress');
    this.scanLabel = q('.hud-scan');
    this.markerLayer = q('.hud-markers');
    this.hint = q('.hud-hint');
    this.clickToPlay = q('.hud-click');

    events.on('objective', ({ text }) => {
      this.objective.textContent = text;
      this.objective.parentElement!.classList.remove('flash');
      void this.objective.offsetWidth; // Animation neu starten
      this.objective.parentElement!.classList.add('flash');
    });
    events.on('prompt', ({ text }) => {
      this.prompt.classList.toggle('visible', !!text);
      if (text) (this.prompt.lastElementChild as HTMLElement).textContent = text;
    });
    events.on('scan', ({ active }) => this.el.classList.toggle('scanning', active));
    events.on('settings:changed', () => this.translate());
    this.translate();
  }

  translate(): void {
    this.el.querySelectorAll<HTMLElement>('[data-i18n]').forEach((e) => (e.textContent = t(e.dataset.i18n!)));
    this.scanLabel.textContent = t('hud.scan');
    this.hint.textContent = t('controls.hint');
    this.clickToPlay.textContent = t('hud.clickToPlay');
    this.el.classList.toggle('colorblind', settings.data.colorblind);
    const key = settings.data.bindings.interact.replace('Key', '');
    (this.prompt.firstElementChild as HTMLElement).textContent = key;
  }

  show(v: boolean): void {
    this.el.classList.toggle('hidden', !v);
  }

  showHint(v: boolean): void {
    this.hint.classList.toggle('visible', v);
  }

  /** "Klicken zum Spielen", wenn die Maus nicht gefangen ist. */
  showClickToPlay(v: boolean): void {
    this.clickToPlay.classList.toggle('visible', v);
  }

  setStats(health: number, stress: number): void {
    this.health.style.width = `${health}%`;
    this.stress.style.width = `${stress}%`;
  }

  setClock(minutes: number): void {
    const h = Math.floor(minutes / 60) % 24, m = Math.floor(minutes % 60);
    this.clock.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  setFps(fps: number): void {
    this.fps.style.display = settings.data.showFps ? 'block' : 'none';
    if (settings.data.showFps) this.fps.textContent = `${fps.toFixed(0)} FPS`;
  }

  setMarkers(markers: Marker[], scan: number): void {
    this.markerLayer.style.opacity = String(scan);
    if (scan < 0.02) return;
    for (const mk of markers) {
      let el = this.markerEls.get(mk.id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'marker';
        el.innerHTML = '<i></i><span></span>';
        this.markerLayer.appendChild(el);
        this.markerEls.set(mk.id, el);
      }
      el.style.display = mk.visible ? 'block' : 'none';
      el.style.transform = `translate(${mk.x}px, ${mk.y}px)`;
      el.classList.toggle('focused', mk.focused);
      (el.lastElementChild as HTMLElement).textContent = mk.label;
    }
  }
}
