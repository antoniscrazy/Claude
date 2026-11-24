/* =====================================================================
   1. Zustand, Hilfsfunktionen, Dokumentmodell, Sanitizer, Modell <-> DOM
   Das Dokumentmodell (S.doc.blocks) speichert Absätze (inkl. Überschriften und Listenpunkte), Tabellen, Bilder und Seitenumbrüche.
   Bearbeitet wird im DOM (#doc, contenteditable); vor Speichern/Verlauf wird das Modell aus dem DOM abgeleitet.
   ===================================================================== */
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const k in (attrs || {})) { const v = attrs[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'style') e.style.cssText = v; else e.setAttribute(k, v === true ? '' : v); }
  kids.flat().forEach(c => { if (c != null) e.append(c.nodeType ? c : document.createTextNode(c)); }); return e;
}
let _uc = 0; const uid = p => p + (Math.random() * 1e9 | 0).toString(36) + (++_uc).toString(36);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const MM = 96 / 25.4, PT = 96 / 72;
const PAPER = { A4: { w: 210, h: 297 }, Letter: { w: 215.9, h: 279.4 }, A3: { w: 297, h: 420 }, A5: { w: 148, h: 210 }, Legal: { w: 215.9, h: 355.6 } };
const GAP = 24;
const S = { doc: null, zoom: 1, navOn: true, tab: 'start', name: 'Dokument', dirty: false, selRange: null, pages: [], unitPage: new Map(), curImg: null, findOn: false };
const FONTS = [['"Segoe UI",Calibri,Arial,sans-serif', 'Segoe UI'], ['Arial,Helvetica,sans-serif', 'Arial'], ['"Times New Roman",Times,serif', 'Times New Roman'], ['Georgia,serif', 'Georgia'], ['Verdana,sans-serif', 'Verdana'], ['"Courier New",monospace', 'Courier New'], ['"Trebuchet MS",sans-serif', 'Trebuchet MS']];
const STYLES = { normal: 'Fließtext', title: 'Titel', subtitle: 'Untertitel', h1: 'Überschrift 1', h2: 'Überschrift 2', h3: 'Überschrift 3' };
function pageGeom(d) { d = d || S.doc; const p = PAPER[d.page.size]; let w = p.w, h = p.h; if (d.page.orient === 'landscape') [w, h] = [h, w]; const m = d.page.m; return { W: w * MM, H: h * MM, mt: m.t * MM, mr: m.r * MM, mb: m.b * MM, ml: m.l * MM, cw: (w - m.l - m.r) * MM, ch: (h - m.t - m.b) * MM, wmm: w, hmm: h }; }

/* ---------- Inline-Sanitizer (Whitelist) ---------- */
function sanitizeInline(html) {
  const doc = new DOMParser().parseFromString('<body>' + String(html) + '</body>', 'text/html'); let out = '';
  const col = c => { c = String(c || '').trim(); const m = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(c); if (m) return '#' + [m[1], m[2], m[3]].map(n => (+n).toString(16).padStart(2, '0')).join(''); return /^#[0-9a-f]{3,8}$/i.test(c) ? c : null; };
  const walk = n => {
    if (n.nodeType === 3) { out += escHtml(n.nodeValue.replace(/ /g, ' ').replace(/[\r\n\t]+/g, ' ')); return; } if (n.nodeType !== 1) return;
    const t = n.tagName; if (/^(SCRIPT|STYLE|TEMPLATE|IFRAME|OBJECT|EMBED|SVG|MATH|IMG|INPUT|BUTTON|SELECT|TEXTAREA)$/.test(t)) return;
    if (t === 'BR') { out += '<br>'; return; }
    const map = { B: 'b', STRONG: 'b', I: 'i', EM: 'i', U: 'u', S: 's', STRIKE: 's', DEL: 's', SUB: 'sub', SUP: 'sup' }; let open = '', close = '';
    if (map[t]) { open += '<' + map[t] + '>'; close = '</' + map[t] + '>' + close; }
    const st = n.style || {}; let css = '';
    const c1 = t === 'FONT' && n.getAttribute('color') ? col(n.getAttribute('color')) : col(st.color); if (c1) css += 'color:' + c1 + ';';
    const bg = col(st.backgroundColor); if (bg && st.backgroundColor !== 'transparent') css += 'background-color:' + bg + ';';
    const fs = /^([\d.]+)px$/.exec(st.fontSize || ''); if (fs && +fs[1] >= 6 && +fs[1] <= 200) css += 'font-size:' + Math.round(+fs[1] * 10) / 10 + 'px;';
    if (st.fontFamily && /^[\w\s,"'-]{1,80}$/.test(st.fontFamily)) css += 'font-family:' + st.fontFamily.replace(/"/g, "'") + ';';
    if (css) { open += '<span style="' + css + '">'; close = '</span>' + close; }
    if (+st.fontWeight >= 600 || st.fontWeight === 'bold') { open += '<b>'; close = '</b>' + close; } if (st.fontStyle === 'italic') { open += '<i>'; close = '</i>' + close; }
    const td = st.textDecorationLine || st.textDecoration || ''; if (td.includes('underline')) { open += '<u>'; close = '</u>' + close; } if (td.includes('line-through')) { open += '<s>'; close = '</s>' + close; }
    out += open; n.childNodes.forEach(walk); out += close;
  };
  doc.body.childNodes.forEach(walk); return out;
}
const textOf = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; };

/* ---------- Modell -> DOM ---------- */
const STYLE_TAG = { normal: 'p', title: 'p', subtitle: 'p', h1: 'h1', h2: 'h2', h3: 'h3' };
function applyPara(e, b) {
  if (b.al && b.al !== 'left') e.style.textAlign = b.al; if (b.lh) e.style.lineHeight = String(b.lh); if (b.sb != null) e.style.paddingTop = b.sb + 'pt'; if (b.sa != null) e.style.paddingBottom = b.sa + 'pt'; if (b.ind) e.style.marginLeft = b.ind + 'mm';
}
function paraEl(b) { const e = document.createElement(b.list ? 'li' : STYLE_TAG[b.st] || 'p'); if (!b.list && b.st === 'title') e.className = 's-title'; if (!b.list && b.st === 'subtitle') e.className = 's-subtitle'; e.innerHTML = b.html || '<br>'; applyPara(e, b); return e; }
function blocksToDOM(blocks, assets) {
  const frag = document.createDocumentFragment(); let list = null;
  blocks.forEach(b => {
    if (b.t === 'p' && b.list) { if (!list || list.tagName.toLowerCase() !== b.list) { list = document.createElement(b.list); frag.append(list); } list.append(paraEl(b)); return; }
    list = null;
    if (b.t === 'p') frag.append(paraEl(b));
    else if (b.t === 'table') {
      const t = document.createElement('table'); t.className = 'b-tbl'; if (b.hdr) t.dataset.hdr = '1'; const tb = document.createElement('tbody'); t.append(tb);
      b.rows.forEach((r, i) => { const tr = document.createElement('tr'); r.forEach(c => { const td = document.createElement(b.hdr && i === 0 ? 'th' : 'td'); td.innerHTML = c || '<br>'; tr.append(td); }); tb.append(tr); }); frag.append(t);
    } else if (b.t === 'img') { frag.append(imgFigure(b.src, assets[b.src], b.w, b.al)); }
    else if (b.t === 'pb') frag.append(pbEl());
  });
  return frag;
}
function imgFigure(id, src, w, al) { const f = document.createElement('figure'); f.className = 'b-img'; f.contentEditable = 'false'; f.dataset.asset = id; if (al && al !== 'left') f.style.textAlign = al; const i = document.createElement('img'); i.src = src || ''; i.alt = 'Bild'; i.draggable = false; i.style.width = Math.round(w) + 'px'; f.append(i); return f; }
function pbEl() { const d = document.createElement('div'); d.className = 'b-pb'; d.contentEditable = 'false'; d.append(el('span', null, 'Seitenumbruch')); return d; }

/* ---------- DOM -> Modell ---------- */
function paraProps(e, b) {
  if (e.style.textAlign && e.style.textAlign !== 'left') b.al = e.style.textAlign; if (e.style.lineHeight) b.lh = parseFloat(e.style.lineHeight) || undefined;
  if (/pt$/.test(e.style.paddingTop)) b.sb = parseFloat(e.style.paddingTop); if (/pt$/.test(e.style.paddingBottom)) b.sa = parseFloat(e.style.paddingBottom); if (/mm$/.test(e.style.marginLeft)) b.ind = parseFloat(e.style.marginLeft);
  Object.keys(b).forEach(k => b[k] === undefined && delete b[k]); return b;
}
function elToBlocks(e, out) {
  if (e.nodeType === 3) { const t = e.nodeValue.trim(); if (t) out.push({ t: 'p', st: 'normal', html: escHtml(e.nodeValue.replace(/ /g, ' ')) }); return; }
  if (e.nodeType !== 1 || e.classList.contains('spacer')) return; const tag = e.tagName;
  if (tag === 'TABLE') { const rows = []; Array.from(e.rows).forEach(r => { if (r.classList.contains('spacer')) return; rows.push(Array.from(r.cells).map(c => sanitizeInline(c.innerHTML).replace(/^<br>$/, ''))); }); if (rows.length) { const nc = Math.max(...rows.map(r => r.length)); rows.forEach(r => { while (r.length < nc) r.push(''); }); out.push({ t: 'table', hdr: e.dataset.hdr === '1', rows }); } return; }
  if (tag === 'FIGURE' && e.classList.contains('b-img')) { const im = e.querySelector('img'); out.push(paraProps(e, { t: 'img', src: e.dataset.asset, w: Math.round(parseFloat(im.style.width) || im.naturalWidth || 300), al: e.style.textAlign || undefined })); return; }
  if (e.classList.contains('b-pb')) { out.push({ t: 'pb' }); return; }
  if (tag === 'UL' || tag === 'OL') { Array.from(e.children).forEach(li => { if (li.tagName === 'LI' && !li.classList.contains('spacer')) out.push(paraProps(li, { t: 'p', st: 'normal', list: tag.toLowerCase(), html: sanitizeInline(li.innerHTML).replace(/^<br>$/, '') })); }); return; }
  if (/^(P|H1|H2|H3|H4|H5|H6|DIV|BLOCKQUOTE|PRE)$/.test(tag)) {
    if (tag === 'DIV' && Array.from(e.children).some(c => /^(P|DIV|H\d|UL|OL|TABLE)$/.test(c.tagName))) { Array.from(e.childNodes).forEach(c => elToBlocks(c, out)); return; }
    let st = { H1: 'h1', H2: 'h2', H3: 'h3', H4: 'h3', H5: 'h3', H6: 'h3' }[tag] || (e.classList.contains('s-title') ? 'title' : e.classList.contains('s-subtitle') ? 'subtitle' : 'normal');
    out.push(paraProps(e, { t: 'p', st, html: sanitizeInline(e.innerHTML).replace(/^<br>$/, '') })); return;
  }
  const h = sanitizeInline(e.outerHTML); if (textOf(h).trim()) out.push({ t: 'p', st: 'normal', html: h });
}
function domToBlocks(root) { const out = []; Array.from(root.childNodes).forEach(n => elToBlocks(n, out)); if (!out.length) out.push({ t: 'p', st: 'normal', html: '' }); return out; }

/* ---------- Validierung (Projekt importieren) ---------- */
function validateDoc(p) {
  const fail = m => { throw new Error(m); }; const num = (v, d, a, b) => { v = +v; return isFinite(v) ? clamp(v, a, b) : d; };
  if (!p || typeof p !== 'object' || Array.isArray(p)) fail('Die Datei enthält kein Dokument.');
  if (p.format !== 'WebOffice-Dokument') fail('Unbekanntes Dateiformat – erwartet wird „WebOffice-Dokument“.');
  if (typeof p.version !== 'number' || p.version < 1 || p.version > 1) fail('Dokumentversion ' + p.version + ' wird nicht unterstützt.');
  if (!Array.isArray(p.blocks) || !p.blocks.length || p.blocks.length > 20000) fail('Das Dokument enthält keine (oder zu viele) Blöcke.');
  const pg = p.page || {}, m = pg.m || {}, assets = {};
  const page = { size: PAPER[pg.size] ? pg.size : 'A4', orient: pg.orient === 'landscape' ? 'landscape' : 'portrait', m: { t: num(m.t, 25, 5, 60), r: num(m.r, 25, 5, 60), b: num(m.b, 25, 5, 60), l: num(m.l, 25, 5, 60) } };
  if (p.assets && typeof p.assets === 'object') for (const k in p.assets) if (/^[\w-]{1,60}$/.test(k) && typeof p.assets[k] === 'string' && /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(p.assets[k])) assets[k] = p.assets[k];
  const blocks = p.blocks.map((b, i) => {
    if (!b || typeof b !== 'object') fail('Beschädigter Block ' + (i + 1));
    if (b.t === 'p') { if (typeof b.html !== 'string') fail('Absatz ' + (i + 1) + ' ohne Text.'); const r = { t: 'p', st: STYLES[b.st] ? b.st : 'normal', html: sanitizeInline(b.html.slice(0, 200000)) }; if (b.list === 'ul' || b.list === 'ol') r.list = b.list; if (['center', 'right', 'justify'].includes(b.al)) r.al = b.al; if (b.lh) r.lh = num(b.lh, 1.15, .8, 4); if (b.sb != null) r.sb = num(b.sb, 0, 0, 200); if (b.sa != null) r.sa = num(b.sa, 0, 0, 200); if (b.ind) r.ind = num(b.ind, 0, 0, 150); return r; }
    if (b.t === 'table') { if (!Array.isArray(b.rows) || !b.rows.length || b.rows.length > 500 || !Array.isArray(b.rows[0]) || !b.rows[0].length || b.rows[0].length > 30) fail('Tabelle ' + (i + 1) + ' ist ungültig.'); const nc = b.rows[0].length; return { t: 'table', hdr: !!b.hdr, rows: b.rows.map(r => { if (!Array.isArray(r)) fail('Tabelle ' + (i + 1) + ' ist ungültig.'); const x = []; for (let c = 0; c < nc; c++) x.push(sanitizeInline(String(r[c] == null ? '' : r[c]).slice(0, 20000))); return x; }) }; }
    if (b.t === 'img') { if (!assets[b.src]) fail('Bild in Block ' + (i + 1) + ' hat keine Bilddaten.'); const r = { t: 'img', src: b.src, w: num(b.w, 300, 20, 2000) }; if (['center', 'right'].includes(b.al)) r.al = b.al; return r; }
    if (b.t === 'pb') return { t: 'pb' };
    fail('Unbekannter Blocktyp „' + b.t + '“ (Block ' + (i + 1) + ').');
  });
  const hf = p.hf || {}; const str = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';
  return { format: 'WebOffice-Dokument', version: 1, title: str(p.title, 80) || 'Dokument', page, hf: { header: str(hf.header, 200), footer: str(hf.footer, 200), pn: ['none', 'footer-center', 'footer-right', 'header-right'].includes(hf.pn) ? hf.pn : 'footer-center', pnFmt: hf.pnFmt === 'of' ? 'of' : 'plain' }, blocks, assets };
}

/* ---------- Beispieldokument ---------- */
function makeSampleImage() { const c = document.createElement('canvas'); c.width = 600; c.height = 300; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 600, 300); gr.addColorStop(0, '#3b82f6'); gr.addColorStop(1, '#1e3a8a'); g.fillStyle = gr; g.fillRect(0, 0, 600, 300); g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.arc(450, 100, 80, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.9)'; g.font = 'bold 34px Arial'; g.fillText('Beispielbild', 30, 160); return c.toDataURL('image/png'); }
const LOREM = ['Ein Textverarbeitungsprogramm im Browser muss mehr können als Text darstellen: Es muss Seiten, Ränder, Formatvorlagen und Druck zuverlässig zusammenbringen.', 'Dieser Absatz dient als Platzhalter für längeren Fließtext. Er zeigt, wie Zeilen umbrechen, wie der Zeilenabstand wirkt und wie sich Absätze über mehrere Seiten verteilen, ohne dass Inhalt abgeschnitten wird.', 'Beim Bearbeiten wird die Seitenaufteilung laufend neu berechnet. Blöcke, die nicht mehr auf eine Seite passen, rücken auf die nächste Seite; Tabellenzeilen und Listenpunkte werden einzeln verteilt.', 'Kopf- und Fußzeilen sowie Seitenzahlen beruhen auf derselben Paginierung wie die Druckansicht. Dadurch stimmen die Seitenzahlen im Editor, in der Druckansicht und im PDF-Druck überein.'];
function sampleDoc() {
  const assets = { img1: makeSampleImage() }, B = [];
  const p = (html, extra) => B.push(Object.assign({ t: 'p', st: 'normal', html }, extra || {}));
  B.push({ t: 'p', st: 'title', html: 'Projektbericht Beispiel' }); B.push({ t: 'p', st: 'subtitle', html: 'Ein Beispieldokument für die Textverarbeitung' });
  p('Dieses Dokument zeigt <b>fette</b>, <i>kursive</i>, <u>unterstrichene</u> und <span style="color:#c0392b">farbige</span> Textstellen. Das Wort <b>Platzhalter</b> kommt mehrfach vor und eignet sich zum Testen von „Suchen und Ersetzen“.');
  B.push({ t: 'p', st: 'h1', html: 'Einleitung' }); LOREM.forEach(t => p(t));
  B.push({ t: 'p', st: 'h2', html: 'Ziele' }); ['Seitenorientierte Bearbeitung mit sichtbaren Rändern', 'Formatvorlagen und Navigationsbereich aus echten Überschriften', 'Export als DOCX, HTML und TXT sowie Druckansicht'].forEach(t => p(t, { list: 'ul' }));
  B.push({ t: 'p', st: 'h2', html: 'Vorgehen' }); ['Anforderungen sammeln', 'Entwurf erstellen', 'Platzhalter ersetzen', 'Dokument prüfen und exportieren'].forEach(t => p(t, { list: 'ol' }));
  B.push({ t: 'img', src: 'img1', w: 420, al: 'center' }); p('Abbildung 1: Ein lokal gespeichertes Beispielbild (die Bilddaten gehören zum Projekt).', { al: 'center' });
  B.push({ t: 'p', st: 'h1', html: 'Ergebnisse' });
  B.push({ t: 'table', hdr: true, rows: [['Quartal', 'Umsatz', 'Veränderung'], ['Q1', '120.000 €', '+4 %'], ['Q2', '134.500 €', '+12 %'], ['Q3', '128.900 €', '−4 %'], ['Q4', '151.200 €', '+17 %']] });
  p('');
  for (let i = 0; i < 5; i++) LOREM.forEach(t => p(t + ' Der Platzhalter in diesem Satz zeigt Treffer beim Suchen.'));
  B.push({ t: 'pb' }); B.push({ t: 'p', st: 'h1', html: 'Anhang nach Seitenumbruch' }); p('Dieser Abschnitt beginnt durch einen manuellen Seitenumbruch auf einer neuen Seite.'); LOREM.forEach(t => p(t));
  return { format: 'WebOffice-Dokument', version: 1, title: 'Projektbericht', page: { size: 'A4', orient: 'portrait', m: { t: 25, r: 25, b: 25, l: 25 } }, hf: { header: 'Projektbericht Beispiel', footer: 'WebOffice Textverarbeitung', pn: 'footer-right', pnFmt: 'of' }, blocks: B, assets };
}
function blankDoc() { return { format: 'WebOffice-Dokument', version: 1, title: 'Dokument', page: { size: 'A4', orient: 'portrait', m: { t: 25, r: 25, b: 25, l: 25 } }, hf: { header: '', footer: '', pn: 'footer-center', pnFmt: 'plain' }, blocks: [{ t: 'p', st: 'normal', html: '' }], assets: {} }; }
