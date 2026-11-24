/* =====================================================================
   Word-Erweiterungen: Hoch-/Tiefstellen, Groß-/Kleinschreibung, Formatierungsmarken, Symbole, Datum/Uhrzeit,
   Inhaltsverzeichnis, Ränder-Voreinstellungen, Reiter „Überprüfen“ (Wörter zählen, Rechtschreibung), Zoomvarianten.
   ===================================================================== */
Object.assign(IC, {
  sup: '<path d="M4 18l8-10M12 18L4 8M16 8h5l-5 5h5"/>', sub: '<path d="M4 6l8 10M12 6L4 16M16 16h5l-5 5h5"/>', sizeup: '<path d="M3 19l5-13 5 13M5 14h6M17 8v6M14 11h6"/>', sizedown: '<path d="M3 19l5-13 5 13M5 14h6M14 11h6"/>',
  casechg: '<path d="M2 18l5-12 5 12M4 14h6M14 18v-8c0-2 5-2 5 0v8M14 14h5"/>', marks: '<path d="M14 4H9a4 4 0 000 8h5M14 4v16M18 4v16"/>', symbol: '<path d="M6 19h4v-2.500C7.500 15.500 6 13.500 6 11a6 6 0 0112 0c0 2.500-1.500 4.500-4 5.500V19h4"/>',
  datetime: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4M12 13v3l2 1"/>', toc: '<path d="M4 6h16M4 11h10M4 16h16M4 21h8"/>', margins: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 3v18M16 3v18M4 7h16M4 17h16" stroke-dasharray="2 2"/>',
  wc: '<path d="M4 6h16M4 11h16M4 16h10"/><path d="M17 15l2 2 3-4"/>', spell: '<path d="M3 17l4-11 4 11M4.500 13h5M13 15l3 3 6-7"/>', onepage: '<rect x="7" y="3" width="10" height="18" rx="1"/>', hundred: '<path d="M5 8l2-1v10M11 8h3v9h-3zM17 8h3v9h-3z"/>', pages2: '<rect x="3" y="5" width="8" height="14" rx="1"/><rect x="13" y="5" width="8" height="14" rx="1"/>',
  fontbig: '<path d="M3 19l5-13 5 13M5 14h6M15 19l3-8 3 8M16 17h4"/>', hr: '<path d="M3 12h18M7 8h10M7 16h10" stroke-dasharray="1 0"/>', focus: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'
});
(() => { const st = document.createElement('style'); st.textContent = '#doc.marks p::after,#doc.marks h1::after,#doc.marks h2::after,#doc.marks h3::after,#doc.marks li::after{content:"¶";color:#6a8bd0;font-weight:400;font-style:normal;margin-left:2px;font-size:.85em}#doc.marks .b-pb{outline:1px dashed #6a8bd0}.symgrid{display:grid;grid-template-columns:repeat(8,30px);gap:2px;padding:6px}.symgrid button{width:30px;height:30px;border:1px solid transparent;border-radius:4px;background:none;font-size:16px;cursor:pointer}.symgrid button:hover{background:var(--hov);border-color:var(--bd)}table.wstat td{padding:3px 0}.fitbtn.on{background:#d4d4d4}'; document.head.append(st); })();

/* ---- Text in der Auswahl umwandeln (Formatierung bleibt erhalten) ---- */
function mapSelectedText(fn) {
  ensureSel(); const s = getSelection(); if (!s.rangeCount || s.isCollapsed) { toast('Bitte zuerst Text markieren.'); return; }
  const rg = s.getRangeAt(0), root = rg.commonAncestorContainer.nodeType === 3 ? rg.commonAncestorContainer.parentNode : rg.commonAncestorContainer, nodes = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (rg.intersectsNode(n) && docEl().contains(n)) nodes.push(n); }
  if (rg.commonAncestorContainer.nodeType === 3 && !nodes.length) nodes.push(rg.commonAncestorContainer);
  let prevEnd = ' '; const saved = { sc: rg.startContainer, so: rg.startOffset, ec: rg.endContainer, eo: rg.endOffset };
  nodes.forEach(t => { const a = t === saved.sc ? saved.so : 0, b = t === saved.ec ? saved.eo : t.nodeValue.length, v = t.nodeValue; t.nodeValue = v.slice(0, a) + fn(v.slice(a, b), prevEnd) + v.slice(b); prevEnd = v.slice(Math.max(a, b - 1), b) || prevEnd; });
  try { const r2 = document.createRange(); r2.setStart(saved.sc, saved.so); r2.setEnd(saved.ec, saved.eo); s.removeAllRanges(); s.addRange(r2); } catch (e) { }
  saveSel(); onInput(); checkpoint(); paginate();
}
const CASES = {
  up: s => s.toUpperCase(), low: s => s.toLowerCase(),
  sent: (s, prev) => { let cap = /[.!?]\s*$/.test(prev) || /^\s*$/.test(prev); return s.toLowerCase().replace(/(^|[.!?]\s+)(\S)/g, (m, p, c) => p + c.toUpperCase()).replace(/^(\s*)(\S)/, (m, sp, c) => cap ? sp + c.toUpperCase() : m); },
  word: s => s.toLowerCase().replace(/(^|[^a-zäöüßA-ZÄÖÜ0-9])([a-zäöüß])/g, (m, p, c) => p + c.toUpperCase()),
  tog: s => s.replace(/./g, c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())
};
const caseMenu = () => [['sent', 'Erster Buchstabe im Satz groß'], ['low', 'kleinbuchstaben'], ['up', 'GROSSBUCHSTABEN'], ['word', 'Jedes Wort Groß'], ['tog', 'gROSS-/kLEINSCHREIBUNG umkehren']].map(([k, l]) => ({ label: l, fn: () => mapSelectedText(CASES[k]) }));
function bumpFont(d) { const sz = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72], cu = curFontSizePt(); let i = sz.findIndex(x => x >= cu); if (i < 0) i = sz.length - 1; if (sz[i] > cu && d < 0) i = Math.max(0, i); setFontSize(sz[clamp(i + d, 0, sz.length - 1)]); }

/* ---- Einfügen ---- */
const SYMBOLS = '© ® ™ § ¶ † ‡ • … – — « » „ “ ‚ ‘ € £ ¥ ¢ ° ± × ÷ ≠ ≈ ≤ ≥ ∞ √ ∑ π Ω µ ‰ ¼ ½ ¾ ² ³ ¹ → ← ↑ ↓ ↔ ⇒ ⇔ ✓ ✗ ★ ☆ ♥ ♦ ♣ ♠ ☎ ✉ ☀ ☂ ♪ α β γ δ λ σ Δ Σ'.split(' ');
function insertSymbolMenu() { const g = el('div', { class: 'symgrid' }, ...SYMBOLS.map(ch => { const b = el('button', { title: 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') }, ch); b.addEventListener('mousedown', e => e.preventDefault()); b.addEventListener('click', () => { closeMenu(); ensureSel(); document.execCommand('insertText', false, ch); onInput(); }); return b; })); return [{ node: g }]; }
function dateMenu() {
  const d = new Date(), p = n => String(n).padStart(2, '0'), mon = d.toLocaleDateString('de-DE', { month: 'long' }), wdn = d.toLocaleDateString('de-DE', { weekday: 'long' });
  const f = [p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear(), d.getDate() + '. ' + mon + ' ' + d.getFullYear(), wdn + ', ' + d.getDate() + '. ' + mon + ' ' + d.getFullYear(), d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()), p(d.getHours()) + ':' + p(d.getMinutes()) + ' Uhr', p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear() + ', ' + p(d.getHours()) + ':' + p(d.getMinutes())];
  return f.map(t => ({ label: t, fn: () => { ensureSel(); document.execCommand('insertText', false, t); onInput(); } }));
}
function insertToc() {
  const hs = $$('#doc h1,#doc h2,#doc h3,#doc .s-title').filter(h => !h.dataset.toc); if (!hs.length) { toast('Keine Überschriften im Dokument. Weisen Sie Absätzen „Überschrift 1–3“ zu.', true); return; }
  const entries = hs.map(h => ({ lvl: h.tagName === 'H1' || h.classList.contains('s-title') ? 0 : h.tagName === 'H2' ? 1 : 2, t: h.textContent.trim(), pg: (S.unitPage.get(h) ?? 0) + 1 })).filter(e => e.t);
  const head = document.createElement('p'); head.innerHTML = '<b>Inhaltsverzeichnis</b>'; head.style.paddingBottom = '6pt'; let last = insertAfterCaret(head);
  entries.forEach(e => { const p = document.createElement('p'); p.textContent = e.t + '   ·   Seite ' + e.pg; if (e.lvl) p.style.marginLeft = (e.lvl * 8) + 'mm'; p.style.paddingBottom = '2pt'; last.after(p); last = p; });
  const sp = document.createElement('p'); sp.innerHTML = '<br>'; last.after(sp); caretTo(sp); saveSel(); onInput(); checkpoint(); paginate(); toast('Inhaltsverzeichnis eingefügt (Seitenzahlen zum Zeitpunkt des Einfügens).');
}

/* ---- Layout ---- */
function setMargins(t, b, l, r, name) { checkpoint(); S.doc.page.m = { t, b, l, r }; applyGeometry(); paginate(); checkpoint(); toast('Ränder: ' + name); }
const marginMenu = () => [['Normal (25 mm)', 25, 25, 25, 25], ['Schmal (12,7 mm)', 12.7, 12.7, 12.7, 12.7], ['Mittel (19 mm)', 25.4, 25.4, 19, 19], ['Breit (38 mm)', 25.4, 25.4, 38, 38], ['Gespiegelt-ähnlich (Links 32 mm)', 25, 25, 32, 20]].map(([n, t, b, l, r]) => ({ label: n, fn: () => setMargins(t, b, l, r, n) }));

/* ---- Überprüfen ---- */
function wordStats() {
  syncModel(); const d = docEl(), txt = d.innerText.replace(/​/g, ''), words = (txt.trim().match(/\S+/g) || []).length, chars = txt.replace(/[\r\n]/g, '').length, noSp = txt.replace(/\s/g, '').length;
  const paras = $$('#doc p,#doc h1,#doc h2,#doc h3,#doc li').filter(e => e.textContent.replace(/​/g, '').trim()).length, sent = (txt.match(/[^.!?]+[.!?]+/g) || []).length, imgs = $$('#doc figure').length, tbls = $$('#doc table').length;
  const min = words / 200, rt = min < 1 ? 'unter 1 Minute' : Math.round(min) + ' Minute' + (Math.round(min) === 1 ? '' : 'n');
  const rows = [['Seiten', S.pages.length], ['Wörter', words], ['Zeichen (mit Leerzeichen)', chars], ['Zeichen (ohne Leerzeichen)', noSp], ['Absätze', paras], ['Sätze (ca.)', sent], ['Tabellen', tbls], ['Bilder', imgs], ['Lesezeit (ca.)', rt]];
  dialog({ title: 'Wörter zählen', body: el('table', { class: 'wstat' }, ...rows.map(([a, b]) => el('tr', null, el('td', null, a), el('td', { style: 'text-align:right;font-weight:600;padding-left:32px' }, String(b))))) });
}
const toggleSpell = () => { const d = docEl(); d.spellcheck = !d.spellcheck; d.blur(); d.focus(); refreshRibbon(); toast('Rechtschreibprüfung ' + (d.spellcheck ? 'ein' : 'aus')); };
const toggleMarks = () => { docEl().classList.toggle('marks'); refreshRibbon(); };
function zoomPage() { const s = $('#scroller'), g = pageGeom(), z = clamp(Math.min((s.clientWidth - 48) / g.W, (s.clientHeight - 40) / g.H), .3, 2); S.zoomMode = 'num'; setZoom(Math.round(z * 100) / 100); }

/* ---- Menüband ---- */
(() => {
  const startBase = RIB.start;
  RIB.start = () => {
    const g = startBase(), fnt = g.find(x => (x.querySelector('.gn') || {}).textContent === 'Schriftart');
    if (fnt) { const row = fnt.querySelector('.rb-col').children[1]; row.append(B({ icon: 'sub', sm: 1, tip: 'Tiefgestellt', on: () => queryState('subscript'), fn: () => exec('subscript') }), B({ icon: 'sup', sm: 1, tip: 'Hochgestellt', on: () => queryState('superscript'), fn: () => exec('superscript') }), B({ icon: 'sizeup', sm: 1, tip: 'Schrift vergrößern', fn: () => bumpFont(1) }), B({ icon: 'sizedown', sm: 1, tip: 'Schrift verkleinern', fn: () => bumpFont(-1) }), B({ icon: 'casechg', sm: 1, tip: 'Groß-/Kleinschreibung', menu: caseMenu })); }
    const par = g.find(x => (x.querySelector('.gn') || {}).textContent === 'Absatz'); if (par) par.querySelector('.rb-field').append(B({ icon: 'marks', sm: 1, tip: 'Formatierungszeichen anzeigen (Strg+Umschalt+8)', on: () => docEl().classList.contains('marks'), fn: toggleMarks }));
    return g;
  };
  const insBase = RIB.insert;
  RIB.insert = () => { const g = insBase(); g.splice(3, 0, GR('Verweise', B({ icon: 'toc', label: 'Inhaltsverzeichnis', tip: 'Aus den Überschriften erzeugen', fn: insertToc }))); g.push(GR('Symbole', B({ icon: 'symbol', label: 'Symbol', menu: insertSymbolMenu }), B({ icon: 'datetime', label: 'Datum und Uhrzeit', menu: dateMenu }))); return g; };
  const layBase = RIB.layout;
  RIB.layout = () => { const g = layBase(); g.splice(1, 0, GR('Ränder', B({ icon: 'margins', label: 'Ränder', menu: marginMenu }), B({ icon: 'page', label: 'Seite einrichten …', fn: pageDialog }))); return g; };
  RIB.review = () => [GR('Dokumentprüfung', B({ icon: 'spell', label: 'Rechtschreibung', tip: 'Rechtschreibprüfung des Browsers ein-/ausschalten', on: () => docEl().spellcheck, fn: toggleSpell }), B({ icon: 'wc', label: 'Wörter zählen', fn: wordStats })), GR('Suchen', B({ icon: 'search', label: 'Suchen / Ersetzen', tip: 'Strg+F / Strg+H', fn: () => openFind(false) }))];
  const viewBase = RIB.view;
  RIB.view = () => { const g = viewBase(); g.splice(1, 0, GR('Anzeigen', B({ icon: 'marks', label: 'Formatierungszeichen', on: () => docEl().classList.contains('marks'), fn: toggleMarks }))); const zg = g.find(x => (x.querySelector('.gn') || {}).textContent === 'Zoom'); if (zg) zg.querySelector('.items').append(B({ icon: 'hundred', label: '100 %', fn: () => { S.zoomMode = 'num'; setZoom(1); } }), B({ icon: 'onepage', label: 'Ganze Seite', fn: zoomPage }), B({ icon: 'pages2', label: 'Seitenbreite', fn: () => { S.zoomMode = 'fit'; setZoom('fit'); } })); return g; };
  TABS.splice(4, 0, ['review', 'Überprüfen']);
})();
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === '*' || e.key === '8' || e.code === 'Digit8')) { e.preventDefault(); toggleMarks(); } });
