/* =====================================================================
   PP-Laufzeit: Datenmodell-Helfer, Rendering, Zeitplan, Animations-Engine,
   Übergänge und Präsentationsplayer. Wird vom Editor (Vorschau/Präsentation)
   und von der exportierten Standalone-Präsentation GEMEINSAM verwendet.
   ===================================================================== */
const PP = (() => {
'use strict';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = { lin: t => t, out: t => 1 - Math.pow(1 - t, 3), in: t => t * t * t, inout: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 };
const px = n => (Math.round(n * 100) / 100) + 'px';
let _uc = 0;
const uid = p => p + '_' + (Math.random() * 1e9 | 0).toString(36) + (++_uc).toString(36);
const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const SHAPES = { rect: 'Rechteck', round: 'Abgerundetes Rechteck', ellipse: 'Ellipse', triangle: 'Dreieck', diamond: 'Raute', star: 'Stern', arrow: 'Blockpfeil', hexagon: 'Sechseck', rtriangle: 'Rechtwinkliges Dreieck', pentagon: 'Fünfeck', octagon: 'Achteck', parallelogram: 'Parallelogramm', trapezoid: 'Trapez', chevron: 'Chevron', plus: 'Kreuz', heart: 'Herz', donut: 'Ring', cloud: 'Wolke', callout: 'Sprechblase', larrow: 'Pfeil links', uarrow: 'Pfeil oben', darrow: 'Pfeil unten', lrarrow: 'Doppelpfeil', frame: 'Rahmen' };
const SHAPE_GROUPS = [['Grundformen', ['rect', 'round', 'ellipse', 'triangle', 'rtriangle', 'diamond', 'pentagon', 'hexagon', 'octagon', 'parallelogram', 'trapezoid', 'frame', 'donut']], ['Pfeile', ['arrow', 'larrow', 'uarrow', 'darrow', 'lrarrow', 'chevron']], ['Sonstige', ['star', 'plus', 'heart', 'cloud', 'callout']]];
const LAYOUTS = { title: 'Titelfolie', content: 'Titel und Inhalt', two: 'Zwei Spalten', section: 'Abschnittstitel', blank: 'Leer' };
const TYPES = ['shape', 'text', 'image', 'line', 'table', 'chart', 'group'];

/* ---------- Farben ---------- */
function safeColor(c) {
  c = String(c == null ? '' : c).trim();
  if (/^#[0-9a-f]{3,8}$/i.test(c) || /^@(a[1-6]|bg|tx|tt)$/.test(c) || /^rgba?\(\s*[\d.\s,%]+\)$/i.test(c) || c === 'transparent' || c === 'none') return c;
  return null;
}
function rc(m, c) {
  if (!c || c === 'none') return 'transparent';
  if (c[0] === '@') { const k = c.slice(1); if (k === 'bg') return m.bg; if (k === 'tx') return m.textColor; if (k === 'tt') return m.titleColor; return m.accents[+k.slice(1) - 1] || '#888'; }
  return c;
}

/* ---------- Text-Sanitizer: Whitelist, jede Zeile = <div> ---------- */
function sanitizeHTML(html) {
  const doc = new DOMParser().parseFromString('<body>' + String(html) + '</body>', 'text/html'); // inert: kein Skript, keine Ladevorgänge
  const out = { lines: [], cur: '', has: false, stack: [] };
  const flush = () => {
    let s = out.cur; for (let i = out.stack.length - 1; i >= 0; i--) s += out.stack[i].close;
    out.lines.push(out.has ? s : '<br>'); out.cur = out.stack.map(x => x.open).join(''); out.has = false;
  };
  const styleOf = n => {
    const st = n.style || {}; let css = '';
    const col = n.tagName === 'FONT' && n.getAttribute('color') ? n.getAttribute('color') : st.color;
    const sc = col && /^(#[0-9a-f]{3,8}|rgba?\([\d.\s,%]+\))$/i.test(col.trim()) ? col.trim() : null;
    if (sc) css += 'color:' + sc + ';';
    const fs = st.fontSize && /^([\d.]+)px$/.test(st.fontSize) ? parseFloat(st.fontSize) : 0;
    if (fs >= 6 && fs <= 400) css += 'font-size:' + Math.round(fs) + 'px;';
    const ff = st.fontFamily; if (ff && /^[\w\s,"'-]{1,80}$/.test(ff)) css += 'font-family:' + ff.replace(/"/g, "'") + ';';
    return css;
  };
  const walk = n => {
    if (n.nodeType === 3) { const t = n.nodeValue.replace(/[ \r\n\t]/g, ' '); if (t) { out.cur += escHtml(t); if (t.trim() || true) out.has = true; } return; }
    if (n.nodeType !== 1) return;
    const tag = n.tagName;
    if (tag === 'BR') { flush(); return; }
    if (/^(SCRIPT|STYLE|TEMPLATE|IFRAME|OBJECT|EMBED|SVG|MATH)$/.test(tag)) return;
    const block = /^(DIV|P|LI|H[1-6]|UL|OL|TR|TABLE|BLOCKQUOTE|PRE)$/.test(tag);
    if (block && out.has) flush();
    const map = { B: 'b', STRONG: 'b', I: 'i', EM: 'i', U: 'u', S: 's', STRIKE: 's', SUB: 'sub', SUP: 'sup' };
    let open = '', close = '';
    if (map[tag]) { open = '<' + map[tag] + '>'; close = '</' + map[tag] + '>'; }
    const css = styleOf(n);
    if (css) { open += '<span style="' + css + '">'; close = '</span>' + close; }
    const st = n.style || {};
    if (st.fontWeight === 'bold' || +st.fontWeight >= 600) { open += '<b>'; close = '</b>' + close; }
    if (st.fontStyle === 'italic') { open += '<i>'; close = '</i>' + close; }
    if ((st.textDecorationLine || st.textDecoration || '').includes('underline')) { open += '<u>'; close = '</u>' + close; }
    if ((st.textDecorationLine || st.textDecoration || '').includes('line-through')) { open += '<s>'; close = '</s>' + close; }
    if (open) { out.cur += open; out.stack.push({ open, close }); }
    n.childNodes.forEach(walk);
    if (open) { out.cur += close; out.stack.pop(); }
    if (block && out.has) flush();
  };
  doc.body.childNodes.forEach(walk);
  if (out.has || out.cur.replace(/<[^>]+>/g, '')) flush();
  while (out.lines.length && out.lines[out.lines.length - 1] === '<br>') out.lines.pop();
  return out.lines.map(l => '<div>' + l + '</div>').join('');
}
const plainText = html => { const d = document.createElement('div'); d.innerHTML = html || ''; return Array.from(d.children).map(c => c.textContent).join('\n'); };

/* ---------- Vorlagen (Master) ---------- */
let _dc = 0;
const mkShape = (x, y, w, h, fill, kind, extra) => Object.assign({ id: 'dec' + (_dc++), type: 'shape', kind: kind || 'rect', x, y, w, h, rot: 0, fill, stroke: 'none', sw: 0 }, extra || {});
const TEMPLATES = {
  aurora: { name: 'Aurora', desc: 'Hell, klare Akzentleiste', bg: '#ffffff', titleColor: '#1b2a41', textColor: '#3a4660',
    accents: ['#e8553d', '#ff9f1c', '#2ec4b6', '#3a86ff', '#8338ec', '#6c757d'], titleFont: '"Segoe UI Semibold","Segoe UI",Arial,sans-serif', bodyFont: '"Segoe UI",Arial,sans-serif',
    decor(W, H, k) {
      if (k === 'title') return [mkShape(0, 0, W * .035, H, '@a1'), mkShape(W * .035, 0, W * .012, H, '@a2'), mkShape(W * .74, H * .56, W * .34, W * .34, '@a3', 'ellipse', { opacity: .2 }), mkShape(W * .86, H * .1, W * .1, W * .1, '@a4', 'ellipse', { opacity: .25 })];
      if (k === 'section') return [mkShape(0, H * .82, W, H * .18, '@a1'), mkShape(W * .08, H * .3, W * .06, 6, '@a2')];
      return [mkShape(0, 0, W, H * .02, '@a1'), mkShape(W * .06, H * .925, W * .88, 2, '#d7dce5')];
    } },
  ocean: { name: 'Ozean', desc: 'Dunkles Marineblau mit Cyan', bg: '#0b1e3a', titleColor: '#ffffff', textColor: '#cfe0f5',
    accents: ['#4cc9f0', '#4895ef', '#f72585', '#b5179e', '#7209b7', '#90e0ef'], titleFont: '"Segoe UI Semibold","Segoe UI",Arial,sans-serif', bodyFont: '"Segoe UI",Arial,sans-serif',
    decor(W, H, k) {
      if (k === 'title') return [mkShape(W * .55, -H * .25, W * .7, W * .7, '@a2', 'ellipse', { opacity: .22 }), mkShape(W * .62, H * .2, W * .45, W * .45, '@a1', 'ellipse', { opacity: .18 }), mkShape(W * .1, H * .74, W * .2, 5, '@a1')];
      if (k === 'section') return [mkShape(0, 0, W * .06, H, '@a3'), mkShape(W * .7, H * .5, W * .5, W * .5, '@a4', 'ellipse', { opacity: .2 })];
      return [mkShape(W * .06, H * .17, W * .08, 4, '@a1'), mkShape(W * .93, H * .92, W * .02, W * .02, '@a3', 'ellipse')];
    } },
  sand: { name: 'Sandstein', desc: 'Warm, mit Serifenüberschriften', bg: '#fbf5ec', titleColor: '#5b3a29', textColor: '#4a4036',
    accents: ['#d1495b', '#edae49', '#00798c', '#30638e', '#003d5b', '#8d6a9f'], titleFont: 'Georgia,"Times New Roman",serif', bodyFont: '"Segoe UI",Arial,sans-serif',
    decor(W, H, k) {
      if (k === 'title') return [mkShape(0, 0, W * .3, H, '@a2'), mkShape(W * .3, 0, W * .012, H, '@a1'), mkShape(W * .06, H * .08, W * .18, W * .18, '@bg', 'ellipse', { opacity: .35 })];
      if (k === 'section') return [mkShape(0, H * .64, W, H * .36, '@a3'), mkShape(W * .08, H * .62, W * .12, 8, '@a2')];
      return [mkShape(0, 0, W * .02, H, '@a1'), mkShape(W * .02, 0, W * .006, H, '@a2')];
    } }
};
function newMaster(tpl) {
  const t = TEMPLATES[tpl] || TEMPLATES.aurora;
  return { tpl: TEMPLATES[tpl] ? tpl : 'aurora', bg: t.bg, titleColor: t.titleColor, textColor: t.textColor, accents: t.accents.slice(), titleFont: t.titleFont, bodyFont: t.bodyFont, titleSize: 40, bodySize: 22 };
}

/* ---------- Layouts ---------- */
function layoutPh(layout, W, H) {
  const r = (ph, x, y, w, h) => ({ ph, x: x * W, y: y * H, w: w * W, h: h * H });
  switch (layout) {
    case 'title': return [r('title', .1, .28, .8, .22), r('subtitle', .1, .53, .8, .13)];
    case 'content': return [r('title', .07, .06, .86, .16), r('body', .07, .27, .86, .62)];
    case 'two': return [r('title', .07, .06, .86, .16), r('body', .07, .27, .41, .62), r('body2', .52, .27, .41, .62)];
    case 'section': return [r('title', .1, .36, .8, .2), r('subtitle', .1, .58, .8, .1)];
    default: return [];
  }
}
function newPlaceholders(layout, W, H) {
  return layoutPh(layout, W, H).map(p => ({ id: uid('o'), type: 'text', ph: p.ph, name: { title: 'Titel', subtitle: 'Untertitel', body: 'Inhalt', body2: 'Inhalt 2' }[p.ph], x: p.x, y: p.y, w: p.w, h: p.h, rot: 0, html: '', st: {} }));
}
function textStyle(o, m, slide) {
  const lay = slide && slide.layout; let b;
  if (o.ph === 'title') b = { font: m.titleFont, size: m.titleSize || 40, color: '@tt', bold: false, align: lay === 'title' ? 'center' : 'left', valign: 'middle' };
  else if (o.ph === 'subtitle') b = { font: m.bodyFont, size: Math.round((m.bodySize || 22) * 1.1), color: '@tx', align: lay === 'title' ? 'center' : 'left', valign: 'top' };
  else if (o.ph) b = { font: m.bodyFont, size: m.bodySize || 22, color: '@tx', align: 'left', valign: 'top', bullets: true };
  else b = { font: m.bodyFont, size: 20, color: '@tx', align: 'left', valign: o.type === 'shape' ? 'middle' : 'top' };
  return Object.assign(b, o.st || {});
}

/* ---------- Rendering ---------- */
const SVGNS = 'http://www.w3.org/2000/svg';
const svgEl = (t, a) => { const e = document.createElementNS(SVGNS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
function shapeNode(o, w, h) {
  const k = o.kind || 'rect', pts = a => a.map(p => p[0] + ',' + p[1]).join(' ');
  switch (k) {
    case 'ellipse': return svgEl('ellipse', { cx: w / 2, cy: h / 2, rx: w / 2, ry: h / 2 });
    case 'round': { const r = o.radius != null ? o.radius : Math.min(w, h) * .18; return svgEl('rect', { x: 0, y: 0, width: w, height: h, rx: r, ry: r }); }
    case 'triangle': return svgEl('polygon', { points: pts([[w / 2, 0], [w, h], [0, h]]) });
    case 'diamond': return svgEl('polygon', { points: pts([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]]) });
    case 'arrow': return svgEl('polygon', { points: pts([[0, h * .3], [w * .6, h * .3], [w * .6, 0], [w, h / 2], [w * .6, h], [w * .6, h * .7], [0, h * .7]]) });
    case 'hexagon': return svgEl('polygon', { points: pts([[w * .25, 0], [w * .75, 0], [w, h / 2], [w * .75, h], [w * .25, h], [0, h / 2]]) });
    case 'star': { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .4 : 1; p.push([w / 2 + Math.cos(a) * r * w / 2, h / 2 + Math.sin(a) * r * h / 2]); } return svgEl('polygon', { points: pts(p) }); }
    case 'rtriangle': return svgEl('polygon', { points: pts([[0, 0], [0, h], [w, h]]) });
    case 'pentagon': return svgEl('polygon', { points: pts([[w / 2, 0], [w, h * .38], [w * .81, h], [w * .19, h], [0, h * .38]]) });
    case 'octagon': { const c = .29; return svgEl('polygon', { points: pts([[c * w, 0], [(1 - c) * w, 0], [w, c * h], [w, (1 - c) * h], [(1 - c) * w, h], [c * w, h], [0, (1 - c) * h], [0, c * h]]) }); }
    case 'parallelogram': return svgEl('polygon', { points: pts([[w * .25, 0], [w, 0], [w * .75, h], [0, h]]) });
    case 'trapezoid': return svgEl('polygon', { points: pts([[w * .2, 0], [w * .8, 0], [w, h], [0, h]]) });
    case 'chevron': return svgEl('polygon', { points: pts([[0, 0], [w * .7, 0], [w, h / 2], [w * .7, h], [0, h], [w * .3, h / 2]]) });
    case 'plus': { const t = .33; return svgEl('polygon', { points: pts([[t * w, 0], [(1 - t) * w, 0], [(1 - t) * w, t * h], [w, t * h], [w, (1 - t) * h], [(1 - t) * w, (1 - t) * h], [(1 - t) * w, h], [t * w, h], [t * w, (1 - t) * h], [0, (1 - t) * h], [0, t * h], [t * w, t * h]]) }); }
    case 'larrow': return svgEl('polygon', { points: pts([[w, h * .3], [w * .4, h * .3], [w * .4, 0], [0, h / 2], [w * .4, h], [w * .4, h * .7], [w, h * .7]]) });
    case 'uarrow': return svgEl('polygon', { points: pts([[w * .3, h], [w * .3, h * .4], [0, h * .4], [w / 2, 0], [w, h * .4], [w * .7, h * .4], [w * .7, h]]) });
    case 'darrow': return svgEl('polygon', { points: pts([[w * .3, 0], [w * .7, 0], [w * .7, h * .6], [w, h * .6], [w / 2, h], [0, h * .6], [w * .3, h * .6]]) });
    case 'lrarrow': return svgEl('polygon', { points: pts([[0, h / 2], [w * .25, 0], [w * .25, h * .3], [w * .75, h * .3], [w * .75, 0], [w, h / 2], [w * .75, h], [w * .75, h * .7], [w * .25, h * .7], [w * .25, h]]) });
    case 'heart': return svgEl('path', { d: `M${w / 2} ${h} C${-w * .1} ${h * .45} ${w * .2} ${-h * .05} ${w / 2} ${h * .28} C${w * .8} ${-h * .05} ${w * 1.1} ${h * .45} ${w / 2} ${h} Z` });
    case 'donut': return svgEl('path', { d: `M0 ${h / 2} a${w / 2} ${h / 2} 0 1 0 ${w} 0 a${w / 2} ${h / 2} 0 1 0 ${-w} 0 Z M${w * .25} ${h / 2} a${w * .25} ${h * .25} 0 1 0 ${w * .5} 0 a${w * .25} ${h * .25} 0 1 0 ${-w * .5} 0 Z`, 'fill-rule': 'evenodd' });
    case 'frame': return svgEl('path', { d: `M0 0H${w}V${h}H0Z M${w * .12} ${h * .12}V${h * .88}H${w * .88}V${h * .12}Z`, 'fill-rule': 'evenodd' });
    case 'cloud': return svgEl('path', { d: `M${w * .25} ${h * .8} C${-w * .05} ${h * .8} ${-w * .05} ${h * .4} ${w * .22} ${h * .42} C${w * .2} ${h * .1} ${w * .55} ${h * .05} ${w * .6} ${h * .3} C${w * .8} ${h * .1} ${w * 1.05} ${h * .35} ${w * .85} ${h * .55} C${w * 1.05} ${h * .8} ${w * .85} ${h * .95} ${w * .72} ${h * .8} Z` });
    case 'callout': return svgEl('path', { d: `M0 0H${w}V${h * .78}H${w * .4}L${w * .2} ${h}L${w * .22} ${h * .78}H0Z`, 'stroke-linejoin': 'round' });
    default: return svgEl('rect', { x: 0, y: 0, width: w, height: h });
  }
}
let gradSeq = 0;
function applyGrad(svg, node, o, m) {
  if (!o.grad || o.type !== 'shape') return;
  const id = 'pg' + (++gradSeq), defs = svgEl('defs', {}), g = svgEl('linearGradient', { id, x1: 0, y1: .5, x2: 1, y2: .5, gradientTransform: 'rotate(' + (o.grad.ang || 0) + ' .5 .5)' });
  g.appendChild(svgEl('stop', { offset: 0, 'stop-color': rc(m, o.fill || '@a1') })); g.appendChild(svgEl('stop', { offset: 1, 'stop-color': rc(m, o.grad.c2 || '@a2') }));
  defs.appendChild(g); svg.appendChild(defs); node.setAttribute('fill', 'url(#' + id + ')');
}
function fillStroke(node, o, m) {
  node.setAttribute('fill', o.fill && o.fill !== 'none' ? rc(m, o.fill) : 'none');
  if (o.stroke && o.stroke !== 'none' && o.sw > 0) { node.setAttribute('stroke', rc(m, o.stroke)); node.setAttribute('stroke-width', o.sw); node.setAttribute('stroke-linejoin', 'round'); } else node.setAttribute('stroke', 'none');
}
function appendText(el, o, ctx) {
  const st = textStyle(o, ctx.master, ctx.slide), html = o.html || '';
  if (!html && ctx.mode !== 'edit') return;
  const wrap = document.createElement('div'); wrap.className = 'pp-tw' + (st.bullets ? ' bul' : '');
  wrap.style.justifyContent = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[st.valign || 'top'];
  const t = document.createElement('div'); t.className = 'pp-txt'; t.innerHTML = html;
  t.style.fontFamily = st.font; t.style.fontSize = px(st.size * 4 / 3); t.style.color = rc(ctx.master, st.color); t.style.textAlign = st.align || 'left';
  t.style.fontWeight = st.bold ? '700' : '400'; t.style.fontStyle = st.italic ? 'italic' : 'normal';
  const deco = []; if (st.underline) deco.push('underline'); if (st.strike) deco.push('line-through'); t.style.textDecoration = deco.join(' ') || 'none';
  t.style.lineHeight = st.lineH || 1.2;
  if (!html) t.dataset.ph = { title: 'Titel hinzufügen', subtitle: 'Untertitel hinzufügen', body: 'Text hinzufügen', body2: 'Text hinzufügen' }[o.ph] || 'Text eingeben';
  wrap.appendChild(t); el.appendChild(wrap);
}
function chartSVG(o, w, h, m) {
  const c = o.chart || { kind: 'bar', labels: [], series: [] }, svg = svgEl('svg', { viewBox: `0 0 ${w} ${h}`, width: '100%', height: '100%', class: 'pp-chart' });
  svg.style.fontFamily = m.bodyFont; svg.style.position = 'absolute'; svg.style.left = 0; svg.style.top = 0;
  const T = (x, y, s, a, size, col) => { const t = svgEl('text', { x, y, 'text-anchor': a || 'middle', 'font-size': size || 14, fill: col || rc(m, '@tx') }); t.textContent = s; return t; };
  const S = c.series.filter(s => s.values.length), n = c.labels.length;
  const legendH = S.length > 1 || c.kind === 'pie' ? 26 : 0;
  if (c.kind === 'pie') {
    const vals = (S[0] ? S[0].values : []).map(v => Math.max(0, +v || 0)), tot = vals.reduce((a, b) => a + b, 0) || 1;
    const r = Math.min(w, h - 10) * .36, cx = w * .36, cy = h / 2; let a0 = -Math.PI / 2;
    vals.forEach((v, i) => {
      const a1 = a0 + v / tot * Math.PI * 2, large = a1 - a0 > Math.PI ? 1 : 0;
      if (v / tot > .9999) svg.appendChild(svgEl('circle', { cx, cy, r, fill: rc(m, '@a' + (i % 6 + 1)) }));
      else svg.appendChild(svgEl('path', { d: `M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`, fill: rc(m, '@a' + (i % 6 + 1)), stroke: rc(m, '@bg'), 'stroke-width': 2 }));
      const am = (a0 + a1) / 2; if (v / tot > .06) svg.appendChild(T(cx + r * .62 * Math.cos(am), cy + r * .62 * Math.sin(am) + 5, Math.round(v / tot * 100) + '%', 'middle', 15, '#fff'));
      a0 = a1;
    });
    c.labels.forEach((l, i) => { svg.appendChild(svgEl('rect', { x: w * .72, y: h / 2 - c.labels.length * 12 + i * 24, width: 14, height: 14, fill: rc(m, '@a' + (i % 6 + 1)) })); svg.appendChild(T(w * .72 + 22, h / 2 - c.labels.length * 12 + i * 24 + 12, l, 'start', 14)); });
    return svg;
  }
  const L = 46, R = 12, Tp = 14, B = 34 + legendH, pw = w - L - R, ph = h - Tp - B;
  let max = 0; S.forEach(s => s.values.forEach(v => { max = Math.max(max, +v || 0); })); const step = niceStep(max / 4 || 1); max = Math.ceil(max / step) * step || 1;
  for (let i = 0; i <= max / step + 1e-9; i++) { const y = Tp + ph - i * step / max * ph; svg.appendChild(svgEl('line', { x1: L, x2: w - R, y1: y, y2: y, stroke: '#00000022' })); svg.appendChild(T(L - 6, y + 4, String(+(i * step).toFixed(2)), 'end', 12)); }
  const gw = pw / Math.max(1, n);
  c.labels.forEach((l, i) => svg.appendChild(T(L + gw * (i + .5), Tp + ph + 18, l, 'middle', 13)));
  if (c.kind === 'line') {
    S.forEach((s, si) => {
      const col = rc(m, '@a' + (si % 6 + 1)), pts = s.values.map((v, i) => [L + gw * (i + .5), Tp + ph - (+v || 0) / max * ph]);
      svg.appendChild(svgEl('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
      pts.forEach(p => svg.appendChild(svgEl('circle', { cx: p[0], cy: p[1], r: 4.5, fill: col })));
    });
  } else {
    const bw = gw * .7 / Math.max(1, S.length);
    S.forEach((s, si) => s.values.forEach((v, i) => { const bh = (+v || 0) / max * ph; svg.appendChild(svgEl('rect', { x: L + gw * i + gw * .15 + si * bw, y: Tp + ph - bh, width: bw - 2, height: bh, fill: rc(m, '@a' + (si % 6 + 1)), rx: 2 })); }));
  }
  if (legendH) S.forEach((s, si) => { const x = L + si * 130; svg.appendChild(svgEl('rect', { x, y: h - 18, width: 12, height: 12, fill: rc(m, '@a' + (si % 6 + 1)) })); svg.appendChild(T(x + 18, h - 8, s.name, 'start', 13)); });
  return svg;
}
function niceStep(raw) { const e = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e; }

function setGeom(el, o) {
  el.style.left = px(o.x); el.style.top = px(o.y); el.style.width = px(o.w); el.style.height = px(o.h);
  el.style.transform = o.rot ? `rotate(${o.rot}deg)` : '';
}
function renderObj(o, ctx) {
  const m = ctx.master, el = document.createElement('div');
  el.className = 'pp-o'; el.dataset.oid = o.id; el.dataset.type = o.type; el._o = o;
  setGeom(el, o);
  const op = o.opacity == null ? 1 : o.opacity; el._op = op; el.style.opacity = op;
  if (o.shadow) el.style.filter = 'drop-shadow(0 6px 10px rgba(0,0,0,.3))';
  switch (o.type) {
    case 'shape': case 'text': {
      if (o.type === 'shape' || (o.fill && o.fill !== 'none') || (o.stroke && o.stroke !== 'none' && o.sw > 0)) {
        const svg = svgEl('svg', { class: 'pp-svg', viewBox: `0 0 ${o.w} ${o.h}`, preserveAspectRatio: 'none' });
        const node = o.type === 'shape' ? shapeNode(o, o.w, o.h) : svgEl('rect', { x: 0, y: 0, width: o.w, height: o.h });
        fillStroke(node, o, m); applyGrad(svg, node, o, m); svg.appendChild(node); el.appendChild(svg);
      }
      appendText(el, o, ctx); break;
    }
    case 'image': {
      el.classList.add('pp-img'); const src = ctx.assets && ctx.assets[o.src];
      if (src) {
        const cr = o.crop || { l: 0, t: 0, r: 0, b: 0 }, fw = 1 - cr.l - cr.r, fh = 1 - cr.t - cr.b, img = document.createElement('img');
        img.src = src; img.draggable = false; img.alt = o.name || '';
        img.style.width = (100 / fw) + '%'; img.style.height = (100 / fh) + '%'; img.style.left = (-cr.l / fw * 100) + '%'; img.style.top = (-cr.t / fh * 100) + '%';
        el.appendChild(img);
      } else { el.style.background = '#e4e6ea'; el.textContent = ''; }
      if (o.stroke && o.stroke !== 'none' && o.sw > 0) el.style.outline = o.sw + 'px solid ' + rc(m, o.stroke);
      break;
    }
    case 'line': {
      const svg = svgEl('svg', { class: 'pp-svg', viewBox: `0 0 ${o.w} ${o.h}`, preserveAspectRatio: 'none' });
      const col = rc(m, o.stroke && o.stroke !== 'none' ? o.stroke : '@a1'), sw = o.sw || 4, y = o.h / 2, hd = Math.max(10, sw * 3.5);
      svg.appendChild(svgEl('line', { x1: 0, y1: y, x2: o.arrow ? o.w - hd * .6 : o.w, y2: y, stroke: col, 'stroke-width': sw, 'stroke-linecap': 'round' }));
      if (o.arrow) svg.appendChild(svgEl('polygon', { points: `${o.w},${y} ${o.w - hd},${y - hd / 2} ${o.w - hd},${y + hd / 2}`, fill: col }));
      el.appendChild(svg); break;
    }
    case 'table': {
      const t = document.createElement('table'); t.className = 'pp-table';
      const rows = o.rows || [['']], nr = rows.length, nc = rows[0].length;
      t.style.fontFamily = m.bodyFont; t.style.fontSize = px((o.fs || 16) * 4 / 3);
      rows.forEach((r, ri) => {
        const tr = t.insertRow(); tr.style.height = (100 / nr) + '%';
        for (let ci = 0; ci < nc; ci++) {
          const td = tr.insertCell(); td.textContent = r[ci] == null ? '' : r[ci]; td.dataset.r = ri; td.dataset.c = ci;
          if (o.header && ri === 0) { td.style.background = rc(m, '@a1'); td.style.color = '#fff'; td.style.fontWeight = '700'; }
          else { td.style.background = ri % 2 ? 'rgba(127,127,127,.10)' : 'rgba(127,127,127,.03)'; td.style.color = rc(m, '@tx'); }
        }
      });
      el.appendChild(t); break;
    }
    case 'chart': el.appendChild(chartSVG(o, o.w, o.h, m)); break;
    case 'group': {
      const inner = document.createElement('div'); inner.className = 'pp-gin';
      inner.style.cssText = `position:absolute;left:0;top:0;width:${o.ow}px;height:${o.oh}px;transform-origin:0 0;transform:scale(${o.w / o.ow},${o.h / o.oh})`;
      (o.children || []).forEach(c => { if (!c.hidden) inner.appendChild(renderObj(c, ctx)); });
      el.appendChild(inner); break;
    }
  }
  if (ctx.mode === 'edit') { if (o.hidden) el.classList.add('pp-ghost'); if (o.locked) el.classList.add('pp-locked'); if (o.ph && !o.html) el.classList.add('pp-ph-empty'); }
  return el;
}
/** mode: 'edit' | 'show' (Präsentation, Vorschau, Miniatur, Export) */
function renderSlide(slide, proj, mode) {
  const W = proj.size.w, H = proj.size.h, m = proj.master, ctx = { master: m, mode, assets: proj.assets, slide };
  const root = document.createElement('div'); root.className = 'pp-layer'; root.style.width = W + 'px'; root.style.height = H + 'px'; root.dataset.sid = slide.id;
  const bg = document.createElement('div'); bg.className = 'pp-bg'; bg.style.background = rc(m, slide.bg || m.bg);
  const dec = document.createElement('div'); dec.className = 'pp-decor';
  const t = TEMPLATES[m.tpl]; if (t) t.decor(W, H, slide.layout === 'title' ? 'title' : slide.layout === 'section' ? 'section' : 'content').forEach(d => dec.appendChild(renderObj(d, { master: m, mode: 'show', assets: {} })));
  bg.appendChild(dec); root.appendChild(bg);
  const objs = document.createElement('div'); objs.className = 'pp-objs';
  for (const o of slide.objects) {
    if (o.hidden && mode !== 'edit') continue;
    if (mode !== 'edit' && o.type === 'text' && o.ph && !plainText(o.html).trim()) continue;
    objs.appendChild(renderObj(o, ctx));
  }
  root.appendChild(objs); return root;
}

/* ---------- Animationskatalog ---------- */
const FX = {
  entrance: { appear: { n: 'Erscheinen', dur: 0 }, fade: { n: 'Verblassen', dur: .5 }, fly: { n: 'Einfliegen', dur: .6, dir: 'left' }, zoom: { n: 'Vergrößern', dur: .5 } },
  emphasis: { pulse: { n: 'Pulsieren', dur: .6 }, spin: { n: 'Drehen', dur: 1, amount: 360 }, grow: { n: 'Größe ändern', dur: .6, amount: 1.5 } },
  exit: { disappear: { n: 'Verschwinden', dur: 0 }, fade: { n: 'Verblassen', dur: .5 }, fly: { n: 'Herausfliegen', dur: .6, dir: 'right' } },
  path: { line: { n: 'Gerader Pfad', dur: 1 }, arc: { n: 'Bogen', dur: 1 }, scurve: { n: 'S-Kurve', dur: 1 } }
};
const CAT_NAMES = { entrance: 'Eingang', emphasis: 'Hervorhebung', exit: 'Ausgang', path: 'Bewegungspfade' };
const START_NAMES = { click: 'Beim Klicken', with: 'Mit vorheriger', after: 'Nach vorheriger' };
const DIR_NAMES = { left: 'Von links', right: 'Von rechts', top: 'Von oben', bottom: 'Von unten' };

/** Zeitplan. Basis: Klick → 0 (Beginn der Klickgruppe); Mit vorheriger → Basis des Vorgängers (Beginn seiner
    Verzögerungsphase); Nach vorheriger → Ende des Vorgängers (inkl. dessen Verzögerung). begin = Basis + Verzögerung. */
function buildSchedule(effects) {
  const groups = [], items = []; let g = null, prev = null;
  for (const e of effects) {
    if (e.start === 'click' || !g) { g = { auto: e.start !== 'click', items: [], length: 0 }; groups.push(g); prev = null; }
    let base = 0;
    if (prev) base = e.start === 'with' ? prev.base : e.start === 'after' ? prev.end : 0;
    const it = { e, g: groups.length - 1, base, begin: base + (e.delay || 0), end: base + (e.delay || 0) + (e.dur || 0) };
    g.items.push(it); items.push(it); g.length = Math.max(g.length, it.end); prev = it;
  }
  return { groups, items };
}
function flyOffset(dir, o, W, H) {
  switch (dir) { case 'right': return { x: W - o.x, y: 0 }; case 'top': return { x: 0, y: -(o.y + o.h) }; case 'bottom': return { x: 0, y: H - o.y }; default: return { x: -(o.x + o.w), y: 0 }; }
}
function pathPoint(e, p) {
  const P = e.path || { dx: 200, dy: 0 }, dx = P.dx, dy = P.dy;
  if (e.kind === 'arc') { const cx = P.cx != null ? P.cx : dx / 2 - dy * .5, cy = P.cy != null ? P.cy : dy / 2 + dx * .5, u = 1 - p; return { x: 2 * u * p * cx + p * p * dx, y: 2 * u * p * cy + p * p * dy }; }
  if (e.kind === 'scurve') { const nx = -dy, ny = dx, c1x = dx / 3 + nx * .4, c1y = dy / 3 + ny * .4, c2x = 2 * dx / 3 - nx * .4, c2y = 2 * dy / 3 - ny * .4, u = 1 - p; return { x: 3 * u * u * p * c1x + 3 * u * p * p * c2x + p * p * p * dx, y: 3 * u * u * p * c1y + 3 * u * p * p * c2y + p * p * p * dy }; }
  return { x: dx * p, y: dy * p };
}
function contrib(e, p, o, W, H, S) {
  switch (e.cat) {
    case 'entrance':
      if (p <= 0) break; S.vis = true; if (p >= 1) break;
      if (e.kind === 'fade') S.op *= p;
      else if (e.kind === 'fly') { const f = flyOffset(e.dir, o, W, H), k = 1 - ease.out(p); S.tx += f.x * k; S.ty += f.y * k; }
      else if (e.kind === 'zoom') { S.sc *= Math.max(.001, ease.out(p)); S.op *= Math.min(1, p * 2); }
      break;
    case 'exit':
      if (p <= 0) break; if (p >= 1) { S.vis = false; break; } S.vis = true;
      if (e.kind === 'fade') S.op *= 1 - p;
      else if (e.kind === 'fly') { const f = flyOffset(e.dir, o, W, H), k = ease.in(p); S.tx += f.x * k; S.ty += f.y * k; }
      break;
    case 'emphasis':
      if (p <= 0) break;
      if (e.kind === 'pulse') { if (p < 1) S.sc *= 1 + .18 * Math.sin(Math.PI * p); }
      else if (e.kind === 'spin') S.rot += (e.amount || 360) * ease.inout(p);
      else if (e.kind === 'grow') S.sc *= 1 + ((e.amount || 1.5) - 1) * ease.inout(p);
      break;
    case 'path': if (p > 0) { const q = pathPoint(e, ease.inout(p)); S.tx += q.x; S.ty += q.y; } break;
  }
}
/** Zustände aller animierten Objekte; pOf(item) liefert Fortschritt 0..1 */
function objStates(slide, sched, pOf, W, H) {
  const per = {}; sched.items.forEach(it => (per[it.e.objId] = per[it.e.objId] || []).push(it));
  const out = {};
  for (const id in per) {
    const o = slide.objects.find(x => x.id === id); if (!o) continue;
    const S = { vis: per[id][0].e.cat !== 'entrance', op: 1, tx: 0, ty: 0, sc: 1, rot: 0 };
    per[id].forEach(it => contrib(it.e, pOf(it), o, W, H, S)); out[id] = S;
  }
  return out;
}
const visibleSet = (slide, proj, at) => {
  const sc = buildSchedule(slide.effects || []), st = objStates(slide, sc, () => at === 'end' ? 1 : 0, proj.size.w, proj.size.h), set = {};
  slide.objects.forEach(o => { set[o.id] = !o.hidden && (st[o.id] ? st[o.id].vis : true); }); return set;
};

class AnimEngine {
  constructor(slide, root, proj, opts) {
    this.slide = slide; this.root = root; this.W = proj.size.w; this.H = proj.size.h; this.o = opts || {};
    this.sched = buildSchedule(slide.effects || []); this.starts = this.sched.groups.map(() => null);
    this.els = {}; root.querySelectorAll(':scope > .pp-objs > .pp-o').forEach(el => { this.els[el.dataset.oid] = el; });
    this.raf = 0; this.log = []; this.autoplay = null; this.t0 = 0;
    this.now = () => (this.o.now ? this.o.now() : performance.now());
  }
  get groupCount() { return this.sched.groups.length; }
  hasPending() { return this.starts.some((s, i) => s == null && !this.sched.groups[i].auto); }
  startedClickGroups() { return this.starts.filter((s, i) => s != null && !this.sched.groups[i].auto).length; }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; this.autoplay = null; }
  reset() { this.stop(); this.starts = this.sched.groups.map(() => null); this.log = []; this.evaluate(this.now()); }
  begin() { this.reset(); this.t0 = this.now(); if (this.sched.groups[0] && this.sched.groups[0].auto) { this.starts[0] = this.now(); this._kick(); } }
  next() { const i = this.starts.findIndex((s, k) => s == null && !this.sched.groups[k].auto); if (i < 0) return false; this.starts[i] = this.now(); this._kick(); return true; }
  finish() { this.stop(); this.starts = this.starts.map(() => -1e12); this.evaluate(this.now()); }
  /** letzte Klickgruppe zurücknehmen: Zustand vor dieser Gruppe (frühere Gruppen abgeschlossen) */
  rewindOne() {
    this.stop(); let last = -1; this.starts.forEach((s, i) => { if (s != null && !this.sched.groups[i].auto) last = i; });
    if (last < 0) return false;
    this.starts = this.starts.map((s, i) => i < last ? (s == null ? null : -1e12) : (this.sched.groups[i].auto ? -1e12 : null)); this.evaluate(this.now()); return true;
  }
  /** Vorschau der ganzen Folie: Klickgruppen laufen automatisch nacheinander */
  playAll(done) {
    this.begin(); this.autoplay = { done, gapUntil: 0 }; this._kick();
  }
  _kick() { if (!this.raf) this.raf = requestAnimationFrame(() => this._tick()); }
  _tick() {
    this.raf = 0; const now = this.now(), running = this.evaluate(now);
    if (this.autoplay) {
      const busy = running || this.starts.some((s, i) => s != null && now < s + this.sched.groups[i].length * 1000 - 1);
      if (!busy) {
        if (this.hasPending()) { if (!this.autoplay.gapUntil) this.autoplay.gapUntil = now + 350; if (now >= this.autoplay.gapUntil) { this.autoplay.gapUntil = 0; this.next(); } }
        else { const d = this.autoplay.done; this.autoplay = null; if (d) d(); return; }
      }
      this._kick(); return;
    }
    if (running) this._kick();
  }
  progress(it, now) {
    const s = this.starts[it.g]; if (s == null) return 0;
    const t = now - s - it.begin * 1000, d = it.e.dur * 1000;
    return d > 0 ? clamp(t / d, 0, 1) : (t >= 0 ? 1 : 0);
  }
  /** wendet den Zustand zum Zeitpunkt now an; true, solange noch etwas läuft */
  evaluate(now) {
    const ps = new Map(); let running = false;
    this.sched.items.forEach(it => {
      const p = this.progress(it, now); ps.set(it, p);
      const s = this.starts[it.g], t0 = s == null ? null : s + it.begin * 1000;
      if (s != null && s > -1e11) {
        if (p > 0 && !it._st) { it._st = 1; this.log.push({ id: it.e.id, ev: 'start', t: now - this.t0 }); }
        if (p >= 1 && !it._en) { it._en = 1; this.log.push({ id: it.e.id, ev: 'end', t: now - this.t0 }); }
        if (p < 1) running = true;
      }
      if (s == null) { it._st = 0; it._en = 0; }
      void t0;
    });
    const st = objStates(this.slide, this.sched, it => ps.get(it), this.W, this.H);
    for (const id in st) {
      const el = this.els[id]; if (!el) continue; const S = st[id], o = el._o;
      el.style.visibility = S.vis ? '' : 'hidden';
      el.style.opacity = String(el._op * S.op);
      const rot = (o.rot || 0) + S.rot, tf = (S.tx || S.ty ? `translate(${px(S.tx)},${px(S.ty)}) ` : '') + (rot ? `rotate(${rot}deg) ` : '') + (S.sc !== 1 ? `scale(${S.sc})` : '');
      el.style.transform = tf.trim();
    }
    return running;
  }
}

/* ---------- Übergänge ---------- */
const TRANS = {
  none: { n: 'Kein Übergang' }, fade: { n: 'Überblenden' },
  push: { n: 'Schieben', dirs: ['left', 'right', 'top', 'bottom'] }, wipe: { n: 'Wischen', dirs: ['left', 'right', 'top', 'bottom'] },
  split: { n: 'Teilen', dirs: ['horizontal', 'vertical'] }, dim: { n: 'Abdunkeln' }, zoom: { n: 'Zoom' }, morph: { n: 'Morph' }
};
const TDIR_NAMES = { left: 'Von links', right: 'Von rechts', top: 'Von oben', bottom: 'Von unten', horizontal: 'Horizontal', vertical: 'Vertikal' };
function matchPairs(A, B, visA, visB) {
  const used = new Set(), pairs = [];
  B.objects.forEach(b => {
    if (b.hidden || !visB[b.id]) return;
    const a = A.objects.find(x => !used.has(x.id) && !x.hidden && visA[x.id] && x.type === b.type && ((x.mid && x.mid === b.mid) || (/^!!/.test(b.name || '') && x.name === b.name)));
    if (a) { used.add(a.id); pairs.push([a, b]); }
  });
  return pairs;
}
function playTransition(stage, layA, layB, tr, proj, A, B, done) {
  const W = proj.size.w, H = proj.size.h, dur = Math.max(.05, tr.dur || .7) * 1000, type = tr.type || 'fade', dir = tr.dir || 'left';
  layA.style.zIndex = 1; layB.style.zIndex = 2;
  let dim = null, pairs = [], bgB = layB.querySelector('.pp-bg'), els = {};
  if (type === 'dim') { dim = document.createElement('div'); dim.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;background:#000;z-index:3;opacity:0`; stage.appendChild(dim); }
  if (type === 'morph') {
    pairs = matchPairs(A, B, visibleSet(A, proj, 'end'), visibleSet(B, proj, 'start'));
    layA.querySelectorAll('.pp-objs > .pp-o').forEach(e => { els['a' + e.dataset.oid] = e; }); layB.querySelectorAll('.pp-objs > .pp-o').forEach(e => { els['b' + e.dataset.oid] = e; });
  }
  const pa = new Set(pairs.map(p => p[0].id)), pb = new Set(pairs.map(p => p[1].id));
  const clip = (inset) => { layB.style.clipPath = inset; };
  function apply(p) {
    switch (type) {
      case 'fade': layB.style.opacity = p; break;
      case 'push': {
        const v = { left: [W, 0, -W, 0], right: [-W, 0, W, 0], top: [0, H, 0, -H], bottom: [0, -H, 0, H] }[dir] || [W, 0, -W, 0];
        layA.style.transform = `translate(${v[0] * p}px,${v[1] * p}px)`; layB.style.transform = `translate(${v[2] * (1 - p)}px,${v[3] * (1 - p)}px)`; break; }
      case 'wipe': { const q = (1 - p) * 100; clip({ left: `inset(0 ${q}% 0 0)`, right: `inset(0 0 0 ${q}%)`, top: `inset(0 0 ${q}% 0)`, bottom: `inset(${q}% 0 0 0)` }[dir] || `inset(0 ${q}% 0 0)`); break; }
      case 'split': { const q = (1 - p) * 50; clip(dir === 'vertical' ? `inset(0 ${q}% 0 ${q}%)` : `inset(${q}% 0 ${q}% 0)`); break; }
      case 'dim': if (p < .5) { dim.style.opacity = p * 2; layB.style.opacity = 0; } else { dim.style.opacity = (1 - p) * 2; layB.style.opacity = 1; layA.style.opacity = 0; } break;
      case 'zoom': layB.style.opacity = p; layB.style.transform = `scale(${.6 + .4 * p})`; layB.style.transformOrigin = '50% 50%'; layA.style.opacity = 1 - p * .6; break;
      case 'morph': {
        if (bgB) bgB.style.opacity = p;
        layA.querySelectorAll('.pp-objs > .pp-o').forEach(e => { e.style.opacity = pa.has(e.dataset.oid) ? 0 : e._op * (1 - p); });
        layB.querySelectorAll('.pp-objs > .pp-o').forEach(e => { if (!pb.has(e.dataset.oid)) e.style.opacity = e._op * p; });
        pairs.forEach(([a, b]) => {
          const e = els['b' + b.id]; if (!e) return; const L = (u, v) => u + (v - u) * p, dr = ((b.rot || 0) - (a.rot || 0) + 540) % 360 - 180;
          e.style.left = px(L(a.x, b.x)); e.style.top = px(L(a.y, b.y)); e.style.width = px(L(a.w, b.w)); e.style.height = px(L(a.h, b.h)); e.style.transform = `rotate(${(a.rot || 0) + dr * p}deg)`;
          const svg = e.querySelector(':scope > .pp-svg'); if (svg) svg.setAttribute('viewBox', `0 0 ${b.w} ${b.h}`);
        });
        break; }
    }
  }
  let fin = false, raf = 0, t0 = null;
  function finish() {
    if (fin) return; fin = true; cancelAnimationFrame(raf);
    layB.style.cssText = layB.style.cssText.replace(/(opacity|transform|clip-path|z-index|transform-origin)[^;]*;?/g, '');
    layB.style.width = W + 'px'; layB.style.height = H + 'px';
    if (bgB) bgB.style.opacity = '';
    if (type === 'morph') pairs.concat([]).forEach(([, b]) => { const e = els['b' + b.id]; if (e) { setGeom(e, b); const svg = e.querySelector(':scope > .pp-svg'); if (svg) svg.setAttribute('viewBox', `0 0 ${b.w} ${b.h}`); } });
    layB.querySelectorAll('.pp-objs > .pp-o').forEach(e => { e.style.opacity = e._op; });
    layA.remove(); if (dim) dim.remove(); if (done) done();
  }
  function step(ts) { if (t0 == null) t0 = ts; const p = clamp((ts - t0) / dur, 0, 1); apply(ease.inout(p)); if (p >= 1) finish(); else raf = requestAnimationFrame(step); }
  if (type === 'none') { finish(); return { finish() {}, cancel() {} }; }
  apply(0); raf = requestAnimationFrame(step);
  return { finish, cancel: finish };
}

/* ---------- Präsentationsplayer ---------- */
class Player {
  constructor(host, proj, opts) {
    this.host = host; this.proj = proj; this.o = opts || {}; this.idx = 0; this.eng = null; this.layer = null; this.trans = null; this.timer = 0; this.presenter = !!this.o.presenter; this.keyBuf = ''; this.closed = false; this.atEnd = false; this.tickIv = 0;
    this.W = proj.size.w; this.H = proj.size.h; this.seen = [];
    const d = (c, p) => { const e = document.createElement('div'); e.className = c; if (p) p.appendChild(e); return e; };
    host.innerHTML = ''; host.classList.add('pp-player'); host.style.display = 'flex';
    this.main = d('pp-main', host); this.stage = d('pp-stage', this.main); this.stage.style.width = this.W + 'px'; this.stage.style.height = this.H + 'px';
    this.endEl = d('pp-end', this.main); this.endEl.textContent = 'Ende der Präsentation – Klicken oder Esc zum Beenden.';
    this.toast = d('pp-toast', this.main);
    this.hud = d('pp-hud', this.main);
    const btn = (t, f) => { const b = document.createElement('button'); b.className = 'pp-btn'; b.textContent = t; b.addEventListener('click', e => { e.stopPropagation(); f(); b.blur(); }); b.addEventListener('pointerdown', e => e.stopPropagation()); this.hud.appendChild(b); return b; };
    btn('Zurück', () => this.back()); btn('Weiter', () => this.forward(false)); btn('Referentenansicht', () => this.togglePresenter()); btn('Vollbild', () => this.toggleFullscreen()); btn('Beenden', () => this.exit());
    this.side = d('pp-side', host);
    const clock = d('pp-clock', this.side); this.elTimer = document.createElement('b'); this.elTimer.textContent = '00:00'; this.elClock = document.createElement('span'); this.elInfo = document.createElement('span'); clock.append(this.elTimer, this.elClock, this.elInfo);
    const h1 = document.createElement('h4'); h1.textContent = 'Nächste Folie'; this.side.appendChild(h1); this.nextBox = d('pp-next', this.side);
    const h2 = document.createElement('h4'); h2.textContent = 'Notizen'; this.side.appendChild(h2); this.notesEl = d('pp-notes', this.side);
    const sb = d('pp-sidebtns', this.side);
    [['Zurück', () => this.back()], ['Weiter', () => this.forward(false)], ['Timer zurücksetzen', () => { this.t0 = Date.now(); }], ['Beenden', () => this.exit()]].forEach(([t, f]) => { const b = document.createElement('button'); b.className = 'pp-btn'; b.textContent = t; b.addEventListener('click', e => { e.stopPropagation(); f(); b.blur(); }); sb.appendChild(b); });
    this.main.addEventListener('pointerdown', e => { if (e.button === 0 && !e.target.closest('.pp-hud')) { e.preventDefault(); this.forward(true); } });
    this._key = e => this.onKey(e); window.addEventListener('keydown', this._key, true);
    this._ro = new ResizeObserver(() => this.fit()); this._ro.observe(host);
    this.t0 = Date.now(); this.tickIv = setInterval(() => this.tickClock(), 500);
    this.host.classList.toggle('presenter', this.presenter);
  }
  fit() {
    const r = this.main.getBoundingClientRect(); if (!r.width) return;
    const s = Math.min(r.width / this.W, r.height / this.H), x = (r.width - this.W * s) / 2, y = (r.height - this.H * s) / 2;
    this.stage.style.transform = `translate(${x}px,${y}px) scale(${s})`; this.scale = s;
    if (this.nextLayer) { const bw = this.nextBox.clientWidth; this.nextBox.style.height = (bw * this.H / this.W) + 'px'; this.nextLayer.style.transform = `scale(${bw / this.W})`; }
  }
  tickClock() { const s = Math.floor((Date.now() - this.t0) / 1000); this.elTimer.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); this.elClock.textContent = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); }
  say(t) { this.toast.textContent = t; this.toast.style.display = 'block'; clearTimeout(this._tt); this._tt = setTimeout(() => { this.toast.style.display = 'none'; }, 1800); }
  nextIdx(i) { for (let j = i + 1; j < this.proj.slides.length; j++) if (!this.proj.slides[j].hidden) return j; return -1; }
  prevIdx(i) { for (let j = i - 1; j >= 0; j--) if (!this.proj.slides[j].hidden) return j; return -1; }
  start(i) { this.show(i || 0, { state: 'start', trans: false }); this.fit(); }
  cancelPending() { clearTimeout(this.timer); this.timer = 0; if (this.eng) this.eng.stop(); if (this.trans) { const t = this.trans; this.trans = null; t.finish(); } }
  /** state: 'start' (Anfangszustand, auto-Effekte laufen) | 'end' (alle Effekte abgeschlossen) */
  show(i, o) {
    this.cancelPending(); this.atEnd = false; this.endEl.style.display = 'none';
    const slide = this.proj.slides[i], old = this.layer, oldSlide = this.proj.slides[this.idx], oldEng = this.eng;
    const lay = renderSlide(slide, this.proj, 'show'), eng = new AnimEngine(slide, lay, this.proj);
    if (o.state === 'end') eng.finish(); else eng.reset();
    this.stage.appendChild(lay); this.layer = lay; this.eng = eng; this.idx = i;
    const after = () => { this.trans = null; if (o.state === 'start') eng.begin(); this.armTimer(); };
    if (o.trans && old && old.parentNode && o.state === 'start') {
      if (oldEng) oldEng.finish();
      const tr = slide.transition || { type: 'none' };
      this.trans = playTransition(this.stage, old, lay, tr, this.proj, oldSlide, slide, after);
    } else { if (old) old.remove(); after(); }
    this.updateSide(); this.fit();
  }
  armTimer() {
    clearTimeout(this.timer); const s = this.proj.slides[this.idx], i = this.idx;
    if (s.advTime != null && s.advTime >= 0) this.timer = setTimeout(() => { if (this.idx === i && !this.closed) { this.eng.finish(); this.advance(); } }, s.advTime * 1000);
  }
  updateSide() {
    const s = this.proj.slides[this.idx]; this.notesEl.textContent = s.notes || '(keine Notizen)'; this.elInfo.textContent = `Folie ${this.idx + 1} / ${this.proj.slides.length}`;
    this.nextBox.innerHTML = ''; this.nextLayer = null; const n = this.nextIdx(this.idx);
    if (n >= 0) { const l = renderSlide(this.proj.slides[n], this.proj, 'show'); const e = new AnimEngine(this.proj.slides[n], l, this.proj); e.finish(); l.style.position = 'absolute'; this.nextBox.appendChild(l); this.nextLayer = l; }
    else { this.nextBox.style.height = '60px'; this.nextBox.textContent = 'Ende der Präsentation'; }
    this.tickClock();
  }
  advance() { const n = this.nextIdx(this.idx); if (n < 0) { this.showEnd(); return; } this.show(n, { state: 'start', trans: true }); }
  showEnd() { this.cancelPending(); this.atEnd = true; this.endEl.style.display = 'flex'; }
  /** fromClick: Mausklick beachtet "Weiter bei Klick"; Tastatur wechselt immer */
  forward(fromClick) {
    if (this.closed) return;
    if (this.atEnd) { this.exit(); return; }
    if (this.trans) { const t = this.trans; this.trans = null; t.finish(); return; }
    if (this.eng.next()) return;
    const s = this.proj.slides[this.idx];
    if (fromClick && s.advClick === false) return;
    this.eng.finish(); this.advance();
  }
  back() {
    if (this.closed) return;
    if (this.atEnd) { this.show(this.idx, { state: 'end', trans: false }); return; }
    if (this.trans) { const t = this.trans; this.trans = null; t.finish(); }
    if (this.eng.rewindOne()) return;
    const p = this.prevIdx(this.idx);
    if (p >= 0) this.show(p, { state: 'end', trans: false });           // Rücksprung: Endzustand der vorherigen Folie
    else this.show(this.idx, { state: 'start', trans: false });
  }
  goto(n) { const i = clamp(n - 1, 0, this.proj.slides.length - 1); this.show(i, { state: 'start', trans: false }); this.say('Folie ' + (i + 1)); }
  togglePresenter() { this.presenter = !this.presenter; this.host.classList.toggle('presenter', this.presenter); this.updateSide(); setTimeout(() => this.fit(), 0); this.fit(); }
  toggleFullscreen() { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else if (this.host.requestFullscreen) this.host.requestFullscreen().catch(() => this.say('Vollbild nicht verfügbar – Fenstermodus')); else this.say('Vollbild nicht verfügbar – Fenstermodus'); }
  onKey(e) {
    if (this.closed) return;
    const k = e.key; let handled = true;
    if (/^[0-9]$/.test(k)) this.keyBuf += k;
    else if (k === 'Enter' && this.keyBuf) { this.goto(+this.keyBuf); this.keyBuf = ''; }
    else if (k === 'ArrowRight' || k === ' ' || k === 'Enter' || k === 'PageDown' || k === 'ArrowDown' || k === 'n' || k === 'N') this.forward(false);
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'ArrowUp' || k === 'Backspace') this.back();
    else if (k === 'Escape') this.exit();
    else if (k === 'Home') this.goto(1); else if (k === 'End') this.goto(this.proj.slides.length);
    else if (k === 'p' || k === 'P') this.togglePresenter();
    else if (k === 'f' || k === 'F') this.toggleFullscreen();
    else handled = false;
    if (k !== 'Enter' && !/^[0-9]$/.test(k)) this.keyBuf = '';
    if (handled || e.target === document.body) { e.preventDefault(); e.stopPropagation(); } else e.stopPropagation();
  }
  exit() {
    if (this.closed) return; this.closed = true; this.cancelPending(); clearInterval(this.tickIv); window.removeEventListener('keydown', this._key, true); this._ro.disconnect();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    this.host.innerHTML = ''; this.host.classList.remove('pp-player', 'presenter'); if (this.o.onExit) this.o.onExit(this.idx);
  }
}

/* ---------- Projekt-Validierung ---------- */
const EFFECT_STARTS = ['click', 'with', 'after'];
const DIRS = ['left', 'right', 'top', 'bottom'];
function validateProject(p) {
  const fail = m => { throw new Error(m); };
  const num = (v, d, a, b) => { v = +v; if (!isFinite(v)) return d; return clamp(v, a, b); };
  const str = (v, d, max) => typeof v === 'string' ? v.slice(0, max || 500) : d;
  if (!p || typeof p !== 'object' || Array.isArray(p)) fail('Die Datei enthält kein Präsentationsprojekt.');
  if (p.format !== 'WebOffice-Praesentation') fail('Unbekanntes Dateiformat – erwartet wird „WebOffice-Praesentation“.');
  if (typeof p.version !== 'number' || p.version < 1 || p.version > 1) fail('Projektversion ' + p.version + ' wird von dieser Anwendung nicht unterstützt.');
  const sz = p.size || {}; const size = { w: num(sz.w, 0, 320, 4000), h: num(sz.h, 0, 240, 4000) }; if (!size.w || !size.h) fail('Ungültige Foliengröße.');
  const mm = p.master || {}, base = newMaster(TEMPLATES[mm.tpl] ? mm.tpl : 'aurora');
  const master = Object.assign(base, { bg: safeColor(mm.bg) || base.bg, titleColor: safeColor(mm.titleColor) || base.titleColor, textColor: safeColor(mm.textColor) || base.textColor,
    titleFont: /^[\w\s,"'-]{1,120}$/.test(mm.titleFont || '') ? mm.titleFont : base.titleFont, bodyFont: /^[\w\s,"'-]{1,120}$/.test(mm.bodyFont || '') ? mm.bodyFont : base.bodyFont,
    titleSize: num(mm.titleSize, 40, 10, 200), bodySize: num(mm.bodySize, 22, 8, 120) });
  if (Array.isArray(mm.accents)) master.accents = base.accents.map((a, i) => safeColor(mm.accents[i]) || a);
  const assets = {}; if (p.assets && typeof p.assets === 'object') for (const k in p.assets) { const v = p.assets[k]; if (/^[\w-]{1,60}$/.test(k) && typeof v === 'string' && /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(v)) assets[k] = v; }
  if (!Array.isArray(p.slides) || !p.slides.length) fail('Das Projekt enthält keine Folien.');
  const ids = new Set(), chk = id => { if (typeof id !== 'string' || !/^[\w-]{1,60}$/.test(id)) fail('Ungültige Objekt-ID im Projekt.'); if (ids.has(id)) fail('Doppelte ID „' + id + '“ im Projekt.'); ids.add(id); return id; };
  const cleanObj = (o, depth) => {
    if (!o || typeof o !== 'object' || !TYPES.includes(o.type)) fail('Unbekannter Objekttyp: ' + (o && o.type));
    if (depth > 6) fail('Gruppen sind zu tief verschachtelt.');
    const r = { id: chk(o.id), type: o.type, name: str(o.name, o.type, 120), x: num(o.x, 0, -1e5, 1e5), y: num(o.y, 0, -1e5, 1e5), w: num(o.w, 100, 1, 1e5), h: num(o.h, 100, 1, 1e5), rot: num(o.rot, 0, -3600, 3600) };
    if (o.hidden) r.hidden = true; if (o.locked) r.locked = true; if (o.lockRatio) r.lockRatio = true; if (o.shadow) r.shadow = true;
    if (o.grad && typeof o.grad === 'object') { const c2 = safeColor(o.grad.c2); if (c2) r.grad = { c2, ang: num(o.grad.ang, 0, 0, 359) }; }
    if (typeof o.mid === 'string' && /^[\w-]{1,60}$/.test(o.mid)) r.mid = o.mid;
    if (['title', 'subtitle', 'body', 'body2'].includes(o.ph)) r.ph = o.ph;
    if (o.opacity != null) r.opacity = num(o.opacity, 1, 0, 1);
    for (const k of ['fill', 'stroke']) if (o[k] != null) r[k] = safeColor(o[k]) || 'none';
    if (o.sw != null) r.sw = num(o.sw, 0, 0, 100);
    if (o.radius != null) r.radius = num(o.radius, 0, 0, 1000);
    if (o.kind != null) r.kind = SHAPES[o.kind] ? o.kind : 'rect';
    if (o.arrow) r.arrow = true;
    if (o.html != null) r.html = sanitizeHTML(str(o.html, '', 200000));
    if (o.st && typeof o.st === 'object') { const s = {}, q = o.st;
      if (typeof q.font === 'string' && /^[\w\s,"'-]{1,120}$/.test(q.font)) s.font = q.font; if (q.size != null) s.size = num(q.size, 20, 4, 400);
      if (q.color != null) s.color = safeColor(q.color) || '@tx'; ['bold', 'italic', 'underline', 'strike', 'bullets'].forEach(k => { if (q[k] != null) s[k] = !!q[k]; });
      if (['left', 'center', 'right', 'justify'].includes(q.align)) s.align = q.align; if (['top', 'middle', 'bottom'].includes(q.valign)) s.valign = q.valign; if (q.lineH != null) s.lineH = num(q.lineH, 1.2, .8, 3);
      r.st = s; } else if (o.type === 'text' || o.type === 'shape') r.st = {};
    if (o.type === 'image') { r.src = typeof o.src === 'string' && assets[o.src] ? o.src : null; const c = o.crop || {}; r.crop = { l: num(c.l, 0, 0, .9), t: num(c.t, 0, 0, .9), r: num(c.r, 0, 0, .9), b: num(c.b, 0, 0, .9) }; if (r.crop.l + r.crop.r > .95) r.crop.l = r.crop.r = 0; if (r.crop.t + r.crop.b > .95) r.crop.t = r.crop.b = 0; }
    if (o.type === 'table') { if (!Array.isArray(o.rows) || !o.rows.length || o.rows.length > 60 || !Array.isArray(o.rows[0]) || !o.rows[0].length || o.rows[0].length > 20) fail('Ungültige Tabelle.'); const nc = o.rows[0].length; r.rows = o.rows.map(rw => { if (!Array.isArray(rw)) fail('Ungültige Tabelle.'); const x = []; for (let i = 0; i < nc; i++) x.push(str(rw[i], '', 500)); return x; }); r.header = o.header !== false; r.fs = num(o.fs, 16, 6, 100); }
    if (o.type === 'chart') { const c = o.chart || {}; if (!['bar', 'line', 'pie'].includes(c.kind) || !Array.isArray(c.labels) || !Array.isArray(c.series)) fail('Ungültiges Diagramm.'); r.chart = { kind: c.kind, labels: c.labels.slice(0, 60).map(x => str(String(x), '', 60)), series: c.series.slice(0, 12).map(s => ({ name: str(s && s.name, 'Reihe', 60), values: (Array.isArray(s && s.values) ? s.values : []).slice(0, 60).map(v => num(v, 0, -1e12, 1e12)) })) }; }
    if (o.type === 'group') { if (!Array.isArray(o.children)) fail('Gruppe ohne Inhalt.'); r.ow = num(o.ow, r.w, 1, 1e5); r.oh = num(o.oh, r.h, 1, 1e5); r.children = o.children.map(c => cleanObj(c, depth + 1)); }
    return r;
  };
  const slides = p.slides.map(s => {
    if (!s || typeof s !== 'object') fail('Beschädigte Folie.');
    const sid = chk(s.id), tr = s.transition || {}, objects = (Array.isArray(s.objects) ? s.objects : []).map(o => cleanObj(o, 0)), top = new Set(objects.map(o => o.id));
    const effects = (Array.isArray(s.effects) ? s.effects : []).filter(e => e && FX[e.cat] && FX[e.cat][e.kind] && top.has(e.objId)).map(e => {
      const r = { id: chk(e.id), objId: e.objId, cat: e.cat, kind: e.kind, start: EFFECT_STARTS.includes(e.start) ? e.start : 'click', dur: num(e.dur, FX[e.cat][e.kind].dur, 0, 60), delay: num(e.delay, 0, 0, 60) };
      if (DIRS.includes(e.dir)) r.dir = e.dir; if (e.amount != null) r.amount = num(e.amount, 1, -3600, 3600);
      if (e.cat === 'path') { const q = e.path || {}; r.path = { dx: num(q.dx, 200, -1e5, 1e5), dy: num(q.dy, 0, -1e5, 1e5) }; if (q.cx != null) { r.path.cx = num(q.cx, 0, -1e5, 1e5); r.path.cy = num(q.cy, 0, -1e5, 1e5); } }
      return r; });
    return { id: sid, layout: LAYOUTS[s.layout] ? s.layout : 'blank', hidden: !!s.hidden, bg: s.bg != null ? safeColor(s.bg) : null, notes: str(s.notes, '', 20000), objects, effects,
      transition: { type: TRANS[tr.type] ? tr.type : 'none', dur: num(tr.dur, .7, .1, 10), dir: tr.dir || 'left' }, advClick: s.advClick !== false, advTime: s.advTime == null ? null : num(s.advTime, 5, 0, 3600) };
  });
  return { format: 'WebOffice-Praesentation', version: 1, title: str(p.title, 'Präsentation', 120), size, master, slides, assets };
}

return { uid, clamp, ease, sanitizeHTML, plainText, safeColor, rc, TEMPLATES, newMaster, LAYOUTS, SHAPES, SHAPE_GROUPS, layoutPh, newPlaceholders, textStyle, renderObj, renderSlide, setGeom,
  FX, CAT_NAMES, START_NAMES, DIR_NAMES, TRANS, TDIR_NAMES, buildSchedule, AnimEngine, objStates, visibleSet, matchPairs, playTransition, Player, validateProject, pathPoint, chartSVG, px, escHtml, shapeNode };
})();
