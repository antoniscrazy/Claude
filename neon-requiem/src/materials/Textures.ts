import * as THREE from 'three';

/**
 * Prozedurale Canvas-Texturen. Alles wird einmal erzeugt und gecacht,
 * damit keine Bilddateien nötig sind. Austausch gegen echte Texturen: siehe AssetRegistry.
 */
const cache = new Map<string, THREE.Texture>();

/** Deterministischer Zufall, damit die Texturen bei jedem Start gleich aussehen. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

export function canvasTexture(key: string, w: number, h: number, draw: Draw, srgb = true): THREE.CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit as THREE.CanvasTexture;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

/** Streut weiche Flecken – Grundbaustein für Schmutz und Wasserschäden. */
function blotches(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, color: string, r: () => number, maxR: number): void {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = (0.2 + r()) * maxR;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}

export function woodFloor(): { map: THREE.Texture; rough: THREE.Texture } {
  const draw = (rough: boolean): Draw => (ctx, w, h) => {
    const r = rng(7);
    const rows = 8;
    const ph = h / rows;
    for (let i = 0; i < rows; i++) {
      let x = -r() * 300;
      while (x < w) {
        const len = 220 + r() * 260;
        const l = rough ? 120 + r() * 60 : 34 + r() * 22;
        ctx.fillStyle = rough ? `rgb(${l},${l},${l})` : `rgb(${l + 18},${l + 6},${l - 6})`;
        ctx.fillRect(x, i * ph, len, ph);
        // Maserung
        ctx.strokeStyle = rough ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.25)';
        for (let k = 0; k < 7; k++) {
          ctx.beginPath();
          const y0 = i * ph + r() * ph;
          ctx.moveTo(x, y0);
          ctx.bezierCurveTo(x + len * 0.3, y0 + (r() - 0.5) * 8, x + len * 0.6, y0 + (r() - 0.5) * 8, x + len, y0);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x, i * ph, 2, ph);
        x += len;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, i * ph, w, 2);
    }
    // Abgelaufene Laufwege und Flecken: matter bzw. glänzender
    blotches(ctx, w, h, 30, rough ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.25)', r, 120);
  };
  const map = canvasTexture('wood', 1024, 1024, draw(false));
  const rough = canvasTexture('woodR', 512, 512, draw(true), false);
  return { map, rough };
}

export function plasterWall(): THREE.Texture {
  return canvasTexture('plaster', 1024, 512, (ctx, w, h) => {
    const r = rng(11);
    ctx.fillStyle = '#2a3138';
    ctx.fillRect(0, 0, w, h);
    blotches(ctx, w, h, 160, 'rgba(60,72,80,0.35)', r, 60);
    blotches(ctx, w, h, 90, 'rgba(10,12,16,0.35)', r, 50);
    // Wasserschaden: Laufspuren von oben
    for (let i = 0; i < 26; i++) {
      const x = r() * w, len = 40 + r() * 220;
      const g = ctx.createLinearGradient(0, 0, 0, len);
      g.addColorStop(0, 'rgba(40,30,18,0.55)');
      g.addColorStop(1, 'rgba(40,30,18,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, 2 + r() * 6, len);
    }
    // Sockelleiste dunkel
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, h - 26, w, 26);
  });
}

export function ceiling(): THREE.Texture {
  return canvasTexture('ceiling', 512, 512, (ctx, w, h) => {
    const r = rng(3);
    ctx.fillStyle = '#1c2024';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(i * w / 4, 0); ctx.lineTo(i * w / 4, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * h / 4); ctx.lineTo(w, i * h / 4); ctx.stroke();
    }
    blotches(ctx, w, h, 12, 'rgba(70,50,20,0.35)', r, 90);
  });
}

export function leather(): THREE.Texture {
  return canvasTexture('leather', 512, 512, (ctx, w, h) => {
    const r = rng(5);
    ctx.fillStyle = '#3a1d16';
    ctx.fillRect(0, 0, w, h);
    blotches(ctx, w, h, 120, 'rgba(0,0,0,0.3)', r, 40);
    ctx.strokeStyle = 'rgba(200,160,130,0.18)';
    for (let i = 0; i < 160; i++) {
      ctx.beginPath();
      const x = r() * w, y = r() * h;
      ctx.moveTo(x, y);
      ctx.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 30);
      ctx.stroke();
    }
  });
}

export function scratchedMetal(base = '#4a5258'): THREE.Texture {
  return canvasTexture('metal' + base, 512, 512, (ctx, w, h) => {
    const r = rng(13);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    for (let i = 0; i < 400; i++) {
      ctx.beginPath();
      const x = r() * w, y = r() * h;
      ctx.moveTo(x, y);
      ctx.lineTo(x + (r() - 0.5) * 60, y + (r() - 0.5) * 8);
      ctx.stroke();
    }
    blotches(ctx, w, h, 40, 'rgba(90,50,20,0.3)', r, 30);
  });
}

/** Milchglas der Bürotür; von innen gesehen ist die Beschriftung spiegelverkehrt. */
export function doorGlass(): THREE.Texture {
  return canvasTexture('doorGlass', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#8a9aa0';
    ctx.fillRect(0, 0, w, h);
    blotches(ctx, w, h, 60, 'rgba(40,50,55,0.25)', rng(17), 80);
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.fillStyle = 'rgba(20,20,22,0.85)';
    ctx.textAlign = 'center';
    ctx.font = 'bold 54px "Share Tech Mono", monospace';
    ctx.fillText('K. BRANDT', w / 2, h * 0.38);
    ctx.font = '30px "Share Tech Mono", monospace';
    ctx.fillText('PRIVATERMITTLUNGEN', w / 2, h * 0.5);
    ctx.font = '22px "Share Tech Mono", monospace';
    ctx.fillText('KEINE KORVUS-AUFTRÄGE', w / 2, h * 0.6);
    ctx.restore();
  });
}

/** Weicher runder Partikel-Sprite für Dampf und Rauch. */
export function softSprite(): THREE.Texture {
  return canvasTexture('soft', 128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

/** Leuchtschrift für Neonschilder: Text mit Glow auf transparentem Grund. */
export function neonText(text: string, color: string, w = 1024, h = 256, font = 'bold 150px "Share Tech Mono", monospace'): THREE.Texture {
  return canvasTexture('neon' + text + color, w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h);
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = 30;
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.85;
    ctx.fillText(text, w / 2, h / 2);
  });
}

/** Film-Noir-Plakat für die Bürowand (eigene Erfindung). */
export function poster(): THREE.Texture {
  return canvasTexture('poster', 512, 768, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#2a0a24');
    g.addColorStop(1, '#05060c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff3fa4';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.38, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#05060c';
    // Silhouette mit Hut
    ctx.fillRect(w / 2 - 60, h * 0.38 - 20, 120, 300);
    ctx.fillRect(w / 2 - 110, h * 0.38 - 70, 220, 22);
    ctx.fillRect(w / 2 - 55, h * 0.38 - 150, 110, 90);
    ctx.fillStyle = '#e8d9c0';
    ctx.textAlign = 'center';
    ctx.font = 'bold 64px "Share Tech Mono", monospace';
    ctx.fillText('DER LETZTE', w / 2, h * 0.82);
    ctx.fillText('SOMMER', w / 2, h * 0.9);
    ctx.font = '20px "Share Tech Mono", monospace';
    ctx.fillText('LICHTSPIELE NEUKÖLLN · 2061', w / 2, h * 0.96);
    blotches(ctx, w, h, 30, 'rgba(0,0,0,0.35)', rng(21), 90);
  });
}
