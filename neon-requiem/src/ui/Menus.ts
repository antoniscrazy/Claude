import { t, loc } from '../core/i18n';
import { events } from '../core/Events';
import { OptionsMenu } from './OptionsMenu';
import quotes from '../data/quotes.json';

/**
 * Hauptmenü (über der animierten 3D-Szene), Pausemenü, Credits und
 * Ladebildschirm mit Noir-Zitat und Fortschrittsbalken.
 */
export type MenuScreen = 'main' | 'pause' | 'options' | 'credits' | 'none';

const CREDITS_HTML = `
  <p><b>NEON REQUIEM – Neo-Berlin 2089</b><br>Meilenstein 1 · Fundament</p>
  <p>Engine: three.js (MIT) · Postprocessing: pmndrs/postprocessing (Zlib) · Build: Vite (MIT), TypeScript (Apache-2.0)</p>
  <p>Alle 3D-Modelle, Texturen, Shader, Klänge und Musik in diesem Build sind prozedural im Code erzeugt.
  Externe Assets werden in <code>CREDITS.md</code> mit Quelle und Lizenz geführt.</p>
  <p>Schrift: „Share Tech Mono“ von Carrois Apostrophe (SIL Open Font License) via Google Fonts.</p>
  <p>Alle Figuren, Firmen und Orte sind frei erfunden.</p>
`;

export class Menus {
  private root: HTMLElement;
  private main: HTMLElement;
  private pause: HTMLElement;
  private credits: HTMLElement;
  private loading: HTMLElement;
  private toast: HTMLElement;
  readonly options: OptionsMenu;
  screen: MenuScreen = 'main';
  private back: MenuScreen = 'main';
  onNewGame?: () => void;
  onResume?: () => void;
  onQuit?: () => void;

  constructor(root: HTMLElement) {
    this.root = root;
    this.main = this.make('menu-main', `
      <div class="logo" data-text="NEON REQUIEM">NEON REQUIEM</div>
      <div class="tagline" data-i18n="menu.tagline"></div>
      <nav>
        <button class="btn" data-act="new" data-i18n="menu.new"></button>
        <button class="btn" data-act="load" data-i18n="menu.load"></button>
        <button class="btn" data-act="options" data-i18n="menu.options"></button>
        <button class="btn" data-act="credits" data-i18n="menu.credits"></button>
      </nav>
      <div class="version" data-i18n="menu.version"></div>
    `);
    this.pause = this.make('panel menu-pause hidden', `
      <h2 data-i18n="pause.title"></h2>
      <button class="btn" data-act="resume" data-i18n="pause.resume"></button>
      <button class="btn" data-act="options" data-i18n="menu.options"></button>
      <button class="btn" data-act="quit" data-i18n="pause.menu"></button>
    `);
    this.credits = this.make('panel credits hidden', `
      <h2 data-i18n="credits.title"></h2><div class="credits-body">${CREDITS_HTML}</div>
      <button class="btn" data-act="closeCredits" data-i18n="credits.close"></button>
    `);
    this.loading = this.make('loading hidden', `
      <div class="quote"></div><div class="progress"><div class="progress-fill"></div></div>
      <div class="load-label" data-i18n="load.title"></div>
    `);
    this.toast = this.make('toast', '');
    this.options = new OptionsMenu(root);
    this.options.onBack = () => this.show(this.back);

    root.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
      if (act) this.action(act);
    });
    events.on('settings:changed', () => this.translate());
    this.translate();
  }

  private make(cls: string, html: string): HTMLElement {
    const el = document.createElement('div');
    el.className = cls;
    el.innerHTML = html;
    this.root.appendChild(el);
    return el;
  }

  private translate(): void {
    this.root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((e) => {
      if (!e.closest('.hud')) e.textContent = t(e.dataset.i18n!);
    });
  }

  private action(act: string): void {
    switch (act) {
      case 'new': this.onNewGame?.(); break;
      case 'load': this.flash(t('menu.loadSoon')); break;
      case 'options':
        this.back = this.screen === 'pause' ? 'pause' : 'main';
        this.show('options');
        break;
      case 'credits': this.show('credits'); break;
      case 'closeCredits': this.show('main'); break;
      case 'resume': this.onResume?.(); break;
      case 'quit': this.onQuit?.(); break;
    }
  }

  show(s: MenuScreen): void {
    this.screen = s;
    this.main.classList.toggle('hidden', s !== 'main' && s !== 'credits' && !(s === 'options' && this.back === 'main'));
    this.main.classList.toggle('dimmed', s !== 'main');
    this.pause.classList.toggle('hidden', s !== 'pause');
    this.credits.classList.toggle('hidden', s !== 'credits');
    if (s === 'options') this.options.open();
    else this.options.close();
    this.root.classList.toggle('menu-open', s !== 'none');
    const first = (s === 'main' ? this.main : s === 'pause' ? this.pause : null)?.querySelector<HTMLElement>('button');
    first?.focus({ preventScroll: true });
  }

  /** Escape innerhalb der Menüs: eine Ebene zurück. */
  escape(): boolean {
    if (this.screen === 'options') { this.show(this.back); return true; }
    if (this.screen === 'credits') { this.show('main'); return true; }
    return false;
  }

  flash(msg: string): void {
    this.toast.textContent = msg;
    this.toast.classList.remove('show');
    void this.toast.offsetWidth;
    this.toast.classList.add('show');
  }

  /** Ladebildschirm: zufälliges Kai-Zitat; Fortschritt 0..1. */
  showLoading(v: boolean): void {
    if (v) {
      const q = quotes[Math.floor(Math.random() * quotes.length)];
      (this.loading.querySelector('.quote') as HTMLElement).textContent = `„${loc(q)}“ — Kai Brandt`;
      this.setProgress(0);
    }
    this.loading.classList.toggle('hidden', !v);
  }

  setProgress(p: number): void {
    (this.loading.querySelector('.progress-fill') as HTMLElement).style.width = `${Math.round(p * 100)}%`;
  }
}
