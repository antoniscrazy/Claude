import { settings, type Action } from './Settings';

/**
 * Vereinheitlichte Eingabe: Tastatur (über konfigurierbare Belegung), Maus mit
 * Pointer Lock und Gamepad (Standard-Mapping). Systeme lesen nur Achsen/Aktionen.
 */
export class Input {
  private down = new Set<string>();
  private pressedOnce = new Set<string>();
  private mouseDX = 0;
  private mouseDY = 0;
  private padPressed = new Set<number>();
  private padPrev = new Set<number>();
  enabled = false;

  /** Wird beim Klick auf das Canvas aufgerufen, um Pointer Lock anzufordern. */
  constructor(private canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      if (this.enabled && (e.code === 'Tab' || e.code === 'Space')) e.preventDefault();
      if (!e.repeat) this.pressedOnce.add(e.code);
      this.down.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    });
    canvas.addEventListener('click', () => {
      if (this.enabled && !this.locked) this.lock();
    });
  }

  get locked(): boolean {
    return document.pointerLockElement === this.canvas;
  }

  lock(): void {
    try {
      const p = this.canvas.requestPointerLock() as unknown as Promise<void> | undefined;
      p?.catch?.(() => undefined);
    } catch { /* Pointer Lock nicht verfügbar (z. B. iframe ohne Erlaubnis) */ }
  }

  unlock(): void {
    if (this.locked) document.exitPointerLock();
  }

  private key(action: Action): string {
    return settings.data.bindings[action];
  }

  /** Gedrückt gehalten? (Tastatur oder Gamepad) */
  held(action: Action): boolean {
    const k = this.key(action);
    if (this.down.has(k)) return true;
    if (action === 'sprint' && (this.down.has('ShiftRight') || this.padDown(10) || this.padDown(7))) return true;
    if (action === 'crouch' && (this.down.has('ControlLeft') || this.padDown(1))) return true;
    return false;
  }

  /** Genau in diesem Frame neu gedrückt? */
  pressed(action: Action): boolean {
    const k = this.key(action);
    if (this.pressedOnce.has(k)) return true;
    const padMap: Partial<Record<Action, number>> = { interact: 0, scan: 3, inventory: 2, journal: 8 };
    const b = padMap[action];
    return b !== undefined && this.padPressed.has(b) && !this.padPrev.has(b);
  }

  pressedCode(code: string): boolean {
    return this.pressedOnce.has(code);
  }

  /** Bewegungsachsen in [-1, 1]: x = rechts, y = vorwärts. */
  moveAxis(): { x: number; y: number } {
    let x = 0, y = 0;
    if (this.held('forward')) y += 1;
    if (this.held('back')) y -= 1;
    if (this.held('right')) x += 1;
    if (this.held('left')) x -= 1;
    const pad = this.pad();
    if (pad) {
      const dz = (v: number) => (Math.abs(v) < 0.15 ? 0 : v);
      x += dz(pad.axes[0] ?? 0);
      y -= dz(pad.axes[1] ?? 0);
    }
    const len = Math.hypot(x, y);
    return len > 1 ? { x: x / len, y: y / len } : { x, y };
  }

  /** Blickänderung in Pixel-Äquivalent seit letztem Frame. */
  lookDelta(dt: number): { x: number; y: number } {
    let x = this.mouseDX, y = this.mouseDY;
    const pad = this.pad();
    if (pad) {
      const dz = (v: number) => (Math.abs(v) < 0.12 ? 0 : v);
      x += dz(pad.axes[2] ?? 0) * 900 * dt;
      y += dz(pad.axes[3] ?? 0) * 600 * dt;
    }
    const s = settings.data.mouseSensitivity;
    return { x: x * s, y: y * s * (settings.data.invertY ? -1 : 1) };
  }

  private pad(): Gamepad | null {
    if (!navigator.getGamepads) return null;
    for (const p of navigator.getGamepads()) if (p && p.connected) return p;
    return null;
  }

  private padDown(i: number): boolean {
    return this.padPressed.has(i);
  }

  /** Am Frame-Anfang: Gamepad-Status lesen. */
  poll(): void {
    this.padPrev = new Set(this.padPressed);
    this.padPressed.clear();
    const pad = this.pad();
    pad?.buttons.forEach((b, i) => { if (b.pressed) this.padPressed.add(i); });
  }

  /** Am Frame-Ende: Einmal-Ereignisse und Maus-Deltas zurücksetzen. */
  endFrame(): void {
    this.pressedOnce.clear();
    this.mouseDX = 0;
    this.mouseDY = 0;
  }

  /** Pause-Taste vom Gamepad (Start). */
  padStartPressed(): boolean {
    return this.padPressed.has(9) && !this.padPrev.has(9);
  }
}
