import { settings, type SettingsData, type Action, type PresetName, type Lang } from '../core/Settings';
import { t } from '../core/i18n';

/**
 * Optionsmenü, deklarativ aus einer Liste von Einträgen gebaut.
 * Jede Änderung wird sofort gespeichert und angewendet (Preset baut Postprocessing neu).
 */
type Entry =
  | { kind: 'section'; label: string }
  | { kind: 'select'; key: 'preset' | 'language'; label: string; options: Array<[string, string]> }
  | { kind: 'toggle'; key: keyof SettingsData; label: string }
  | { kind: 'slider'; key: keyof SettingsData; label: string; min: number; max: number; step: number; pct?: boolean }
  | { kind: 'bindings' };

const ACTIONS: Action[] = ['forward', 'back', 'left', 'right', 'sprint', 'crouch', 'interact', 'scan', 'inventory', 'journal'];

function keyName(code: string): string {
  return code.replace(/^Key/, '').replace(/^Digit/, '').replace('Left', ' L').replace('Right', ' R');
}

export class OptionsMenu {
  readonly el: HTMLElement;
  private body: HTMLElement;
  private listening: { action: Action; btn: HTMLButtonElement } | null = null;
  onBack?: () => void;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'panel options hidden';
    this.el.setAttribute('role', 'dialog');
    root.appendChild(this.el);
    this.body = document.createElement('div');
    window.addEventListener('keydown', (e) => this.captureKey(e), true);
  }

  private entries(): Entry[] {
    return [
      { kind: 'section', label: t('opt.graphics') },
      { kind: 'select', key: 'preset', label: t('opt.preset'), options: [['low', t('opt.low')], ['medium', t('opt.medium')], ['high', t('opt.high')]] },
      { kind: 'toggle', key: 'ssao', label: t('opt.ssao') },
      { kind: 'toggle', key: 'showFps', label: t('opt.fps') },
      { kind: 'section', label: t('opt.audio') },
      { kind: 'slider', key: 'volMaster', label: t('opt.master'), min: 0, max: 1, step: 0.05, pct: true },
      { kind: 'slider', key: 'volMusic', label: t('opt.music'), min: 0, max: 1, step: 0.05, pct: true },
      { kind: 'slider', key: 'volSfx', label: t('opt.sfx'), min: 0, max: 1, step: 0.05, pct: true },
      { kind: 'slider', key: 'volVoice', label: t('opt.voice'), min: 0, max: 1, step: 0.05, pct: true },
      { kind: 'toggle', key: 'tts', label: t('opt.tts') },
      { kind: 'section', label: t('opt.controls') },
      { kind: 'slider', key: 'mouseSensitivity', label: t('opt.sens'), min: 0.2, max: 3, step: 0.05 },
      { kind: 'toggle', key: 'invertY', label: t('opt.invert') },
      { kind: 'bindings' },
      { kind: 'section', label: t('opt.access') },
      { kind: 'slider', key: 'subtitleSize', label: t('opt.subSize'), min: 0.8, max: 1.6, step: 0.05, pct: true },
      { kind: 'toggle', key: 'colorblind', label: t('opt.colorblind') },
      { kind: 'select', key: 'language', label: t('opt.lang'), options: [['de', 'Deutsch'], ['en', 'English']] },
    ];
  }

  open(): void {
    this.render();
    this.el.classList.remove('hidden');
    (this.el.querySelector('select, input, button') as HTMLElement | null)?.focus();
  }

  close(): void {
    this.el.classList.add('hidden');
    this.listening = null;
  }

  get isOpen(): boolean {
    return !this.el.classList.contains('hidden');
  }

  private render(): void {
    this.el.innerHTML = `<h2>${t('opt.title')}</h2>`;
    this.body = document.createElement('div');
    this.body.className = 'opt-body';
    this.el.appendChild(this.body);
    for (const e of this.entries()) this.body.appendChild(this.row(e));
    const back = document.createElement('button');
    back.className = 'btn';
    back.textContent = t('opt.back');
    back.onclick = () => this.onBack?.();
    this.el.appendChild(back);
  }

  private row(e: Entry): HTMLElement {
    const row = document.createElement('div');
    row.className = 'opt-row';
    const d = settings.data;
    if (e.kind === 'section') {
      row.className = 'opt-section';
      row.textContent = e.label;
    } else if (e.kind === 'select') {
      row.innerHTML = `<label>${e.label}</label>`;
      const sel = document.createElement('select');
      e.options.forEach(([v, l]) => sel.add(new Option(l, v, false, d[e.key] === v)));
      sel.onchange = () => {
        if (e.key === 'preset') settings.set('preset', sel.value as PresetName);
        else {
          settings.set('language', sel.value as Lang);
          this.render(); // Texte neu übersetzen
        }
      };
      row.appendChild(sel);
    } else if (e.kind === 'toggle') {
      row.innerHTML = `<label>${e.label}</label>`;
      const inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.checked = !!d[e.key];
      inp.onchange = () => settings.set(e.key, inp.checked as never);
      row.appendChild(inp);
    } else if (e.kind === 'slider') {
      row.innerHTML = `<label>${e.label}</label>`;
      const wrap = document.createElement('div');
      wrap.className = 'slider';
      const inp = document.createElement('input');
      inp.type = 'range';
      inp.min = String(e.min);
      inp.max = String(e.max);
      inp.step = String(e.step);
      inp.value = String(d[e.key]);
      const out = document.createElement('output');
      const fmt = () => (out.textContent = e.pct ? `${Math.round(Number(inp.value) * 100)}%` : Number(inp.value).toFixed(2));
      fmt();
      inp.oninput = () => {
        fmt();
        settings.set(e.key, Number(inp.value) as never);
      };
      wrap.append(inp, out);
      row.appendChild(wrap);
    } else {
      row.className = 'opt-bindings';
      row.innerHTML = `<div class="opt-sub">${t('opt.bindings')}</div>`;
      const grid = document.createElement('div');
      grid.className = 'bind-grid';
      for (const a of ACTIONS) {
        const l = document.createElement('span');
        l.textContent = t('act.' + a);
        const b = document.createElement('button');
        b.className = 'key';
        b.textContent = keyName(d.bindings[a]);
        b.onclick = () => {
          this.listening = { action: a, btn: b };
          b.textContent = t('opt.pressKey');
          b.classList.add('listening');
        };
        grid.append(l, b);
      }
      const reset = document.createElement('button');
      reset.className = 'btn small';
      reset.textContent = t('opt.resetKeys');
      reset.onclick = () => {
        settings.resetBindings();
        this.render();
      };
      row.append(grid, reset);
    }
    return row;
  }

  private captureKey(ev: KeyboardEvent): void {
    if (!this.listening) return;
    ev.preventDefault();
    ev.stopPropagation();
    const { action, btn } = this.listening;
    this.listening = null;
    btn.classList.remove('listening');
    if (ev.code === 'Escape') {
      btn.textContent = keyName(settings.data.bindings[action]);
      return;
    }
    settings.set('bindings', { ...settings.data.bindings, [action]: ev.code });
    btn.textContent = keyName(ev.code);
  }
}
