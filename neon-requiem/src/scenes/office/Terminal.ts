import * as THREE from 'three';
import { M, box } from '../../materials/Materials';
import type { Updatable } from '../../core/Engine';

/**
 * Röhrenterminal auf Kais Schreibtisch. Der Bildschirm ist eine Canvas-Textur,
 * die zweimal pro Sekunde neu gezeichnet wird (blinkender Cursor, Statuszeilen).
 * Später wird hier das Hacking-Minispiel bzw. das Speicher-Terminal andocken.
 */
const LINES = [
  'KORVUS-NETZ // ZUGANG K.BRANDT',
  '> STATUS ............ GESPERRT',
  '> GRUND ............. ENTLASSEN',
  '',
  'WETTERDIENST NEO-BERLIN',
  'NIEDERSCHLAG TAG 41 / 41',
  'NETZSTÖRUNG: "IN BEARBEITUNG"',
  '',
  'KONTO: 34 CR   SCHULDEN: JA',
  '',
];

export class Terminal implements Updatable {
  readonly group = new THREE.Group();
  private ctx: CanvasRenderingContext2D;
  private tex: THREE.CanvasTexture;
  private acc = 0;
  private blink = false;
  private glowLight: THREE.PointLight;

  constructor() {
    const m = M();
    const g = this.group;
    // Gehäuse: tiefer Röhrenmonitor in vergilbtem Beige
    box(g, 0.44, 0.36, 0.38, m.beigePlastic, 0, 0.24, -0.05);
    box(g, 0.3, 0.26, 0.2, m.beigePlastic, 0, 0.22, -0.3);
    box(g, 0.22, 0.04, 0.2, m.beigePlastic, 0, 0.02, -0.05);
    box(g, 0.08, 0.04, 0.08, m.beigePlastic, 0, 0.05, -0.05);
    // Tastatur
    const kb = box(g, 0.42, 0.025, 0.15, m.beigePlastic, 0.02, 0.013, 0.26);
    kb.rotation.x = 0.06;
    for (let r = 0; r < 4; r++) {
      box(g, 0.38, 0.008, 0.025, m.blackPlastic, 0.02, 0.03, 0.21 + r * 0.032, { cast: false });
    }

    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 384;
    this.ctx = c.getContext('2d')!;
    this.tex = new THREE.CanvasTexture(c);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.36, 0.27),
      new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: this.tex, emissiveIntensity: 1.6, roughness: 0.15 }),
    );
    screen.position.set(0, 0.245, 0.141);
    g.add(screen);
    // Leichte Wölbung des Glases simuliert ein zweites, glänzendes Layer
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.37, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x0a1410, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.12, envMapIntensity: 2 }),
    );
    glass.position.set(0, 0.245, 0.143);
    g.add(glass);

    this.glowLight = new THREE.PointLight(0x40ff9a, 0.6, 1.6, 2);
    this.glowLight.position.set(0, 0.25, 0.35);
    g.add(this.glowLight);
    this.draw();
  }

  private draw(): void {
    const { ctx } = this;
    const w = 512, h = 384;
    ctx.fillStyle = '#021208';
    ctx.fillRect(0, 0, w, h);
    ctx.font = '22px "Share Tech Mono", monospace';
    ctx.fillStyle = '#4dff9a';
    ctx.shadowColor = '#4dff9a';
    ctx.shadowBlur = 8;
    LINES.forEach((l, i) => ctx.fillText(l, 22, 40 + i * 30));
    if (this.blink) ctx.fillRect(22, 40 + LINES.length * 30 - 18, 14, 22);
    ctx.shadowBlur = 0;
    // Scanlines und Vignette direkt in die Textur gemalt
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    this.tex.needsUpdate = true;
  }

  update(dt: number, time: number): void {
    this.acc += dt;
    if (this.acc > 0.5) {
      this.acc = 0;
      this.blink = !this.blink;
      this.draw();
    }
    this.glowLight.intensity = 0.55 + Math.sin(time * 60) * 0.03;
  }
}
