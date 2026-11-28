import { settings } from '../core/Settings';

/**
 * Untertitel-Warteschlange (immer an). Optional liest die Web Speech API Kais
 * Monolog vor; dann richtet sich die Anzeigedauer nach dem Ende der Sprachausgabe.
 */
interface Line { speaker: string; text: string }

export class Subtitles {
  private queue: Line[] = [];
  private current: Line | null = null;
  private remaining = 0;
  private speaking = false;
  private el: HTMLElement;
  private speakerEl: HTMLElement;
  private textEl: HTMLElement;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'subtitles';
    this.el.setAttribute('aria-live', 'polite');
    this.speakerEl = document.createElement('span');
    this.speakerEl.className = 'sub-speaker';
    this.textEl = document.createElement('span');
    this.textEl.className = 'sub-text';
    this.el.append(this.speakerEl, this.textEl);
    root.appendChild(this.el);
  }

  get busy(): boolean {
    return !!this.current || this.queue.length > 0;
  }

  push(speaker: string, text: string): void {
    this.queue.push({ speaker, text });
  }

  clear(): void {
    this.queue = [];
    this.current = null;
    this.hide();
    try { window.speechSynthesis?.cancel(); } catch { /* nicht verfügbar */ }
  }

  /** Zeile per Taste überspringen. */
  skip(): void {
    if (!this.current) return;
    this.remaining = 0;
    this.speaking = false;
    try { window.speechSynthesis?.cancel(); } catch { /* */ }
  }

  private show(l: Line): void {
    this.speakerEl.textContent = l.speaker ? l.speaker.toUpperCase() : '';
    this.textEl.textContent = l.text;
    this.el.style.setProperty('--sub-scale', String(settings.data.subtitleSize));
    this.el.classList.add('visible');
  }

  private hide(): void {
    this.el.classList.remove('visible');
  }

  private speak(text: string): void {
    const synth = window.speechSynthesis;
    if (!settings.data.tts || !synth) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      const lang = settings.data.language === 'en' ? 'en' : 'de';
      u.lang = lang === 'en' ? 'en-GB' : 'de-DE';
      const voice = synth.getVoices().find((v) => v.lang.startsWith(lang) && /male|mann|daniel|markus|hans/i.test(v.name))
        ?? synth.getVoices().find((v) => v.lang.startsWith(lang));
      if (voice) u.voice = voice;
      u.rate = 0.92;
      u.pitch = 0.75;
      u.volume = settings.data.volVoice * settings.data.volMaster;
      this.speaking = true;
      u.onend = () => (this.speaking = false);
      u.onerror = () => (this.speaking = false);
      synth.speak(u);
    } catch {
      this.speaking = false;
    }
  }

  update(dt: number): void {
    if (this.current) {
      this.remaining -= dt;
      if (this.remaining <= 0 && !this.speaking) {
        this.current = null;
        this.hide();
        this.remaining = 0.35; // kurze Pause zwischen Zeilen
      }
      return;
    }
    if (this.remaining > 0) {
      this.remaining -= dt;
      return;
    }
    const next = this.queue.shift();
    if (!next) return;
    this.current = next;
    this.remaining = Math.min(9, Math.max(2.6, 1.4 + next.text.length * 0.058));
    this.show(next);
    this.speak(next.text);
  }
}
