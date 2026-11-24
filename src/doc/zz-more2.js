/* =====================================================================
   Word, zweite Erweiterung: Deckblatt, Schnelltabellen, Blindtext, Zitate, Seitenformate, Rand-/Absatzfelder,
   Lesbarkeit, häufige/doppelte Wörter, Bereinigen, Gehe zu Seite, Fokus/Vollbild – füllt alle Menübänder.
   ===================================================================== */
Object.assign(IC, {
  cover: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M8 8h8M8 11h5M8 17h8"/>', blank: '<rect x="5" y="3" width="14" height="18" rx="1" stroke-dasharray="2 2"/>', tblq: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14h18M9 4v16M15 4v16"/>', lorem: '<path d="M4 6h16M4 10h16M4 14h10M4 18h13"/>',
  quote: '<path d="M6 17c-1-4 0-8 4-10M14 17c-1-4 0-8 4-10"/>', rule: '<path d="M3 12h18M7 7h10M7 17h10" opacity=".5"/>', paper: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>', read: '<path d="M3 5h7a3 3 0 013 3v12a2 2 0 00-2-2H3zM21 5h-7a3 3 0 00-3 3v12a2 2 0 012-2h8z"/>', freq: '<path d="M5 20V10M10 20V4M15 20v-7M20 20v-4"/>', dupw: '<path d="M4 8h7M4 12h7M13 8h7M13 12h7"/><path d="M4 17l16 0" opacity=".4"/>', clean: '<path d="M4 20l8-8M13 5l6 6-4 4-6-6zM15 3l6 6"/>', gopage: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 12h6M12 9l3 3-3 3"/>',
  focus: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', fullscr: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', ribbonmin: '<rect x="3" y="4" width="18" height="6" rx="1"/><path d="M8 16l4-3 4 3"/>', indent2: '<path d="M4 6h16M10 10h10M10 14h10M4 18h16M4 9l4 3-4 3z"/>', spc: '<path d="M4 4v16M20 4v16M8 8h8M8 16h8M12 5v14"/>', lhi: '<path d="M10 6h10M10 12h10M10 18h10M5 4v16M3 6l2-2 2 2M3 18l2 2 2-2"/>'
});
const textNodes = () => { const out = [], w = document.createTreeWalker(docEl(), NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (!n.parentNode.closest('.hf,.spacer,.b-pb')) out.push(n); } return out; };
const docText = () => docEl().innerText.replace(/​/g, '');
const mkP = (html, style, cls) => { const p = document.createElement('p'); p.innerHTML = html || '<br>'; if (style) p.style.cssText = style; if (cls) p.className = cls; return p; };
const afterInsert = msg => { onInput(); checkpoint(); paginate(); if (msg) toast(msg); };

/* ---- Einfügen ---- */
function coverDialog() {
  const t = el('input', { value: S.name || 'Titel', style: 'width:100%' }), s = el('input', { value: 'Untertitel', style: 'width:100%' }), a = el('input', { value: '', placeholder: 'Autor/in', style: 'width:100%' });
  dialog({ title: 'Deckblatt einfügen', body: el('div', { class: 'form col' }, el('label', null, el('span', null, 'Titel'), t), el('label', null, el('span', null, 'Untertitel'), s), el('label', null, el('span', null, 'Autor/in'), a)), buttons: [{ label: 'Abbrechen' }, { label: 'Einfügen', pri: true, fn: () => {
    const d = docEl(), first = d.firstChild, date = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }), nodes = [mkP('<br>', ''), mkP('<br>', ''), mkP('<br>', ''), mkP(escHtml(t.value), 'text-align:center', 's-title'), mkP(escHtml(s.value), 'text-align:center', 's-subtitle'), mkP('<br>', ''), mkP(escHtml(a.value), 'text-align:center'), mkP(escHtml(date), 'text-align:center'), pbEl()];
    nodes.forEach(n => d.insertBefore(n, first)); afterInsert('Deckblatt eingefügt.'); } }] });
}
function blankPage() { insertPageBreak(); }
const quickTables = () => [[2, 2], [3, 3], [4, 3], [5, 4], [8, 3]].map(([r, c]) => ({ label: r + ' × ' + c + ' Tabelle (mit Kopfzeile)', fn: () => insertTable(r, c, true) })).concat([{ label: 'Eigene Größe …', fn: insertTableDialog }]);
const BLINDTXT = ['Ein Textverarbeitungsprogramm im Browser muss mehr können als Text darstellen: Es muss Seiten, Ränder, Formatvorlagen und Druck zuverlässig zusammenbringen.', 'Dieser Absatz dient als Platzhalter für längeren Fließtext. Er zeigt, wie Zeilen umbrechen, wie der Zeilenabstand wirkt und wie sich Absätze über mehrere Seiten verteilen.', 'Beim Bearbeiten wird die Seitenaufteilung laufend neu berechnet. Blöcke, die nicht mehr auf eine Seite passen, rücken auf die nächste Seite; Tabellenzeilen und Listenpunkte werden einzeln verteilt.', 'Kopf- und Fußzeilen sowie Seitenzahlen beruhen auf derselben Paginierung wie die Druckansicht, sodass Editor, Vorschau und PDF-Druck übereinstimmen.', 'Formatvorlagen, Listen, Tabellen und Bilder lassen sich frei kombinieren; beim Export nach DOCX bleiben Absätze, Zeichenformate und Seitenformat erhalten.'];
function loremDialog() { const n = el('input', { type: 'number', min: 1, max: 40, value: 3, style: 'width:80px' }); dialog({ title: 'Blindtext einfügen', body: el('label', null, 'Anzahl Absätze ', n), buttons: [{ label: 'Abbrechen' }, { label: 'Einfügen', pri: true, fn: () => { const k = clamp(Math.round(+n.value) || 3, 1, 40); for (let i = 0; i < k; i++) { const p = mkP(escHtml(BLINDTXT[i % BLINDTXT.length])); insertAfterCaret(p); caretTo(p, true); saveSel(); } afterInsert(k + ' Absätze eingefügt.'); } }] }); }
function insertQuote() { const p = mkP('<i>Zitat hier eingeben …</i>', 'margin-left:12mm;text-align:left'); insertAfterCaret(p); caretTo(p); saveSel(); afterInsert(); }
function insertRule() { const p = mkP('<span style="color:#9aa3b2;">' + '─'.repeat(38) + '</span>', 'text-align:center'); insertAfterCaret(p); ensureTrailingPara(p); afterInsert(); }

/* ---- Layout ---- */
const setMargin = (k, v) => { const m = Object.assign({}, S.doc.page.m); m[k] = clamp(+v || 25, 5, 60); const probe = { page: { size: S.doc.page.size, orient: S.doc.page.orient, m } }, g = pageGeom(probe); if (g.cw < 120 || g.ch < 120) { toast('Die Ränder sind zu groß für das Papierformat.', true); return; } checkpoint(); S.doc.page.m = m; applyGeometry(); paginate(); checkpoint(); };
const setPaper = k => { checkpoint(); S.doc.page.size = k; applyGeometry(); paginate(); checkpoint(); toast('Papierformat: ' + k + ' (' + S.pages.length + ' Seite[n])'); };
const firstBlock = () => topBlocks()[0];

/* ---- Überprüfen ---- */
const sylls = w => Math.max(1, (w.toLowerCase().match(/[aeiouyäöü]+/g) || []).length);
function readability() {
  const t = docText(), words = t.match(/[A-Za-zÄÖÜäöüß]+/g) || [], sent = Math.max(1, (t.match(/[.!?]+(\s|$)/g) || []).length); if (words.length < 20) { toast('Für die Lesbarkeitsanalyse werden mindestens 20 Wörter benötigt.'); return; }
  const asl = words.length / sent, asw = words.reduce((a, w) => a + sylls(w), 0) / words.length, fre = Math.round((180 - asl - 58.5 * asw) * 10) / 10;
  const lvl = fre >= 90 ? 'sehr leicht' : fre >= 80 ? 'leicht' : fre >= 70 ? 'ziemlich leicht' : fre >= 60 ? 'mittel' : fre >= 50 ? 'ziemlich schwer' : fre >= 30 ? 'schwer' : 'sehr schwer';
  const rows = [['Lesbarkeitsindex (Flesch, deutsch)', fre], ['Einstufung', lvl], ['Wörter pro Satz', asl.toFixed(1).replace('.', ',')], ['Silben pro Wort', asw.toFixed(2).replace('.', ',')], ['Wörter', words.length], ['Sätze (ca.)', sent]];
  dialog({ title: 'Lesbarkeit', body: el('table', null, ...rows.map(([a, b]) => el('tr', null, el('td', null, a), el('td', { style: 'text-align:right;font-weight:600;padding-left:32px' }, String(b))))) });
}
const STOP = new Set('der die das und oder aber ist sind war ein eine einen einem einer eines nicht mit von für auf den dem des zu im in an als auch wie wird werden bei nach aus dass sich dieser dieses diese durch über unter noch nur kann können ohne sowie dann wenn mehr sehr hat haben wurde'.split(' '));
function topWords() {
  const m = new Map(); (docText().toLowerCase().match(/[a-zäöüß]{4,}/g) || []).forEach(w => { if (!STOP.has(w)) m.set(w, (m.get(w) || 0) + 1); }); const top = [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 15);
  dialog({ title: 'Häufigste Wörter', body: top.length ? el('table', null, ...top.map(([w, n]) => el('tr', null, el('td', null, w), el('td', { style: 'text-align:right;font-weight:600;padding-left:32px' }, n + '×')))) : el('p', null, 'Zu wenig Text.') });
}
function dupWords() {
  const re = /(^|[^\p{L}])(\p{L}{2,})\s+\2(?![\p{L}])/giu, hits = []; textNodes().forEach(n => { let m; re.lastIndex = 0; while ((m = re.exec(n.nodeValue))) hits.push(m[2]); });
  if (!hits.length) { toast('Keine doppelten Wörter gefunden.'); return; }
  dialog({ title: 'Doppelte Wörter', body: el('div', null, el('p', null, hits.length + ' Treffer: ' + [...new Set(hits)].slice(0, 12).join(', ') + (hits.length > 12 ? ' …' : '')), el('p', { class: 'hint' }, 'Die Auswahl entfernt jeweils die Wiederholung innerhalb eines Textstücks.')), buttons: [{ label: 'Schließen' }, { label: 'Alle entfernen', pri: true, fn: () => { checkpoint(); let n = 0; textNodes().forEach(t => { const v = t.nodeValue.replace(re, (m, p, w) => { n++; return p + w; }); if (v !== t.nodeValue) t.nodeValue = v; }); afterInsert(n + ' Wiederholung(en) entfernt.'); } }] });
}
function cleanSpaces() { checkpoint(); let n = 0; textNodes().forEach(t => { const v = t.nodeValue.replace(/ {2,}/g, () => { n++; return ' '; }); if (v !== t.nodeValue) t.nodeValue = v; }); afterInsert(n ? n + ' doppelte Leerzeichen bereinigt.' : 'Keine doppelten Leerzeichen gefunden.'); }
function gotoPage() { const n = el('input', { type: 'number', min: 1, max: S.pages.length, value: currentPage() + 1, style: 'width:90px' }); dialog({ title: 'Gehe zu Seite', body: el('label', null, 'Seite (1–' + S.pages.length + ') ', n), buttons: [{ label: 'Abbrechen' }, { label: 'Gehen', pri: true, fn: () => { const k = clamp(Math.round(+n.value) || 1, 1, S.pages.length), sh = $('#sheets').children[k - 1]; if (sh) sh.scrollIntoView({ block: 'start', behavior: 'auto' }); } }] }); }

/* ---- Menüband ---- */
(() => {
  const wrap = (name, add) => { const base = RIB[name]; RIB[name] = () => add(base()); };
  const grp = (g, n) => g.find(x => (x.querySelector('.gn') || {}).textContent === n);
  wrap('insert', g => { const pg = grp(g, 'Seiten'); if (pg) pg.querySelector('.items').prepend(B({ icon: 'cover', label: 'Deckblatt', fn: coverDialog }), B({ icon: 'blank', label: 'Leere Seite', fn: blankPage }));
    const tb = grp(g, 'Tabellen'); if (tb) tb.querySelector('.items').append(B({ icon: 'tblq', label: 'Schnelltabelle', menu: quickTables }));
    g.push(GR('Text', B({ icon: 'lorem', label: 'Blindtext', fn: loremDialog }), B({ icon: 'quote', label: 'Zitat', fn: insertQuote }), B({ icon: 'rule', label: 'Trennlinie', fn: insertRule }))); return g; });
  wrap('layout', g => { const ps = grp(g, 'Seite einrichten'); if (ps) ps.querySelector('.items').append(B({ icon: 'paper', label: 'Papierformat', menu: () => Object.keys(PAPER).map(k => ({ label: k + ' (' + PAPER[k].w + ' × ' + PAPER[k].h + ' mm)', fn: () => setPaper(k) })) }));
    const mg = grp(g, 'Ränder'); if (mg) mg.querySelector('.items').append(col(...[['t', 'Oben'], ['b', 'Unten']].map(([k, l]) => F({ type: 'number', label: l + ' (mm)', min: 5, max: 60, step: .5, get: () => S.doc.page.m[k], set: v => setMargin(k, v) }))), col(...[['l', 'Links'], ['r', 'Rechts']].map(([k, l]) => F({ type: 'number', label: l + ' (mm)', min: 5, max: 60, step: .5, get: () => S.doc.page.m[k], set: v => setMargin(k, v) }))));
    g.splice(g.length - 1, 0, GR('Absatz', col(F({ type: 'number', label: 'Einzug links (mm)', min: 0, max: 100, step: 1, get: () => { const b = firstBlock(); return b ? Math.round(parseFloat(b.style.marginLeft) || 0) : 0; }, set: v => paraSet(e => { e.style.marginLeft = clamp(v, 0, 100) ? clamp(v, 0, 100) + 'mm' : ''; }) }), F({ type: 'number', label: 'Abstand davor (pt)', min: 0, max: 100, step: 1, get: () => { const b = firstBlock(); return b ? Math.round(parseFloat(getComputedStyle(b).paddingTop) * 72 / 96) : 0; }, set: v => setSpace('paddingTop', clamp(v, 0, 100)) }), F({ type: 'number', label: 'Abstand danach (pt)', min: 0, max: 100, step: 1, get: () => { const b = firstBlock(); return b ? Math.round(parseFloat(getComputedStyle(b).paddingBottom) * 72 / 96) : 0; }, set: v => setSpace('paddingBottom', clamp(v, 0, 100)) }))),
      GR('Ausrichtung', ...[['left', 'Links', 'alignl'], ['center', 'Zentriert', 'alignc'], ['right', 'Rechts', 'alignr'], ['justify', 'Blocksatz', 'alignj']].map(([a, l, ic]) => B({ icon: ic, label: l, fn: () => setAlign(a) }))),
      GR('Zeilenabstand', B({ icon: 'lhi', label: 'Zeilenabstand', menu: () => [['1', '1,0'], ['1.15', '1,15'], ['1.5', '1,5'], ['2', '2,0'], ['2.5', '2,5'], ['3', '3,0']].map(([v, l]) => ({ label: l, fn: () => setLineH(v) })) }), B({ icon: 'indent2', label: 'Einzug +', fn: () => setIndent(10) }), B({ icon: 'outdent', label: 'Einzug −', fn: () => setIndent(-10) }))); return g; });
  wrap('review', g => { g.push(GR('Textanalyse', B({ icon: 'read', label: 'Lesbarkeit', fn: readability }), B({ icon: 'freq', label: 'Häufige Wörter', fn: topWords }), B({ icon: 'dupw', label: 'Doppelte Wörter', fn: dupWords })), GR('Bereinigen', B({ icon: 'clean', label: 'Doppelte Leerzeichen', fn: cleanSpaces }), B({ icon: 'clear', label: 'Formatierung löschen', fn: clearFormat })), GR('Navigieren', B({ icon: 'gopage', label: 'Gehe zu Seite …', fn: gotoPage }))); return g; });
  wrap('view', g => { g.push(GR('Fenster', B({ icon: 'ribbonmin', label: 'Menüband einklappen', tip: 'Doppelklick auf einen Reiter oder Strg+F1', on: () => $('#app').classList.contains('rbmin'), fn: () => { toggleRibbonMin(); refreshRibbon(); } }), B({ icon: 'focus', label: 'Fokus', tip: 'Navigation und Menüband ausblenden', fn: () => { const on = !$('#app').classList.contains('rbmin'); if (on !== $('#app').classList.contains('rbmin')) toggleRibbonMin(); S.navOn = !on; $('#nav').style.display = S.navOn ? 'flex' : 'none'; setZoom(S.zoomMode === 'fit' ? 'fit' : S.zoom); refreshRibbon(); } }), B({ icon: 'fullscr', label: 'Vollbild', fn: () => { const d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (d.requestFullscreen) d.requestFullscreen(); } })), GR('Gehe zu', B({ icon: 'gopage', label: 'Gehe zu Seite …', fn: gotoPage }))); return g; });
})();

/* =====================================================================
   Word: Schriftgruppe im Office-Stil (Schriftart-/Größenfeld, Farbpaletten, Format übertragen, echtes Einfügen)
   ===================================================================== */
['Arial Black', 'Calibri', 'Cambria', 'Candara', 'Comic Sans MS', 'Consolas', 'Impact', 'Palatino Linotype', 'Tahoma', 'Century Gothic', 'Garamond', 'Lucida Console'].forEach(n => { if (!FONTS.some(f => f[1] === n)) FONTS.push(['"' + n + '",sans-serif', n]); });
function sizeCombo() {
  const dl = el('datalist', { id: 'szlist' }, ...[8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72].map(n => el('option', { value: String(n).replace('.', ',') })));
  const inp = el('input', { type: 'text', list: 'szlist', class: 'szin', title: 'Schriftgrad (pt)', 'aria-label': 'Schriftgrad', size: 3, inputmode: 'decimal', onmousedown: saveSel, onfocus: saveSel });
  const apply = () => { const v = parseFloat(inp.value.replace(',', '.')); if (!isFinite(v) || v < 1 || v > 400) { toast('Bitte eine Größe zwischen 1 und 400 pt eingeben.', true); inp.value = String(curFontSizePt()).replace('.', ','); return; } restoreSel(); setFontSize(v); };
  inp.addEventListener('change', apply); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
  const w = el('label', { class: 'rb-field szw' }, inp, dl); w._upd = () => { if (document.activeElement !== inp) inp.value = String(curFontSizePt()).replace('.', ','); }; ribCtl.push(w); return w;
}
function fontCombo() {
  const sel = el('select', { class: 'fontsel', title: 'Schriftart', 'aria-label': 'Schriftart', onmousedown: saveSel, onchange: e => { restoreSel(); if (e.target.value) exec('fontName', e.target.value.replace(/"/g, ''), true); } }, el('option', { value: '' }, '–'), ...FONTS.map(([v, t]) => el('option', { value: v, style: 'font-family:' + v }, t)));
  const w = el('label', { class: 'rb-field' }, sel); w._upd = () => { if (document.activeElement !== sel) sel.value = curFontFamily() || ''; }; ribCtl.push(w); return w;
}
/* Format übertragen */
let painter = null;
function grabFormat() { ensureSel(); const s = getSelection(); if (!s.rangeCount) return null; let n = s.getRangeAt(0).startContainer; if (n.nodeType === 3) n = n.parentNode; if (!docEl().contains(n)) return null; const cs = getComputedStyle(n); return { pt: curFontSizePt(), fam: curFontFamily(), color: cs.color, bold: +cs.fontWeight >= 600, italic: cs.fontStyle === 'italic', ul: (cs.textDecorationLine || '').includes('underline'), st: (cs.textDecorationLine || '').includes('line-through') }; }
function applyFormat(f) { setFontSize(f.pt); if (f.fam) exec('fontName', f.fam.replace(/"/g, ''), true); exec('foreColor', f.color, true); [['bold', 'bold'], ['italic', 'italic'], ['underline', 'ul'], ['strikeThrough', 'st']].forEach(([c, k]) => { if (queryState(c) !== !!f[k]) exec(c); }); }
function togglePainter() { if (painter) { painter = null; docEl().classList.remove('painting'); refreshRibbon(); return; } painter = grabFormat(); if (!painter) { toast('Bitte zuerst in formatierten Text klicken.'); return; } docEl().classList.add('painting'); toast('Format aufgenommen – jetzt Text markieren.'); refreshRibbon(); }
document.addEventListener('mouseup', () => { if (!painter) return; setTimeout(() => { const s = getSelection(); if (s.rangeCount && !s.isCollapsed && docEl().contains(s.anchorNode)) { saveSel(); applyFormat(painter); painter = null; docEl().classList.remove('painting'); refreshRibbon(); } }, 0); });
/* Einfügen aus der Zwischenablage (Schaltfläche) */
async function pasteFromClipboard() {
  docEl().focus(); restoreSel();
  try { if (navigator.clipboard && navigator.clipboard.read) { const items = await navigator.clipboard.read(); for (const it of items) { if (it.types.includes('text/html')) { const html = await (await it.getType('text/html')).text(); document.execCommand('insertHTML', false, sanitizeInline(html)); onInput(); return; } } } const t = await navigator.clipboard.readText(); document.execCommand('insertText', false, t); onInput(); }
  catch (e) { toast('Der Browser erlaubt den Zugriff auf die Zwischenablage nicht – bitte Strg+V verwenden.', true); }
}
(() => {
  const st = document.createElement('style'); st.textContent = '.rb-split{display:inline-flex}.rb-split .cmain{min-width:30px;padding:2px 4px;position:relative;border-radius:3px 0 0 3px}.rb-split .carr{min-width:14px;padding:0 3px;font-size:9px;border-radius:0 3px 3px 0}.cbar{position:absolute;left:5px;right:5px;bottom:1px;height:3px;border-radius:1px}.fontsel{width:150px}.szin{width:46px;height:26px;border:1px solid #b8b8b8;border-radius:3px;padding:0 4px;text-align:center}.palette{padding:6px;width:236px}.palette .pl{font-size:11px;color:#555;margin:4px 0 3px}.palette .pg{display:grid;grid-template-columns:repeat(10,1fr);gap:2px;margin-bottom:2px}.palette .sw{height:20px;border:1px solid rgba(0,0,0,.2);border-radius:2px;cursor:pointer;padding:0}.palette .sw:hover{outline:2px solid #1b6ef3;z-index:1}.palette .pa{display:block;width:100%;text-align:left;border:0;background:none;padding:6px 4px;cursor:pointer;margin-top:3px;border-radius:3px}.palette .pa:hover{background:var(--hov)}#doc.painting{cursor:copy}'; document.head.append(st);
  const startBase = RIB.start;
  RIB.start = () => {
    const g = startBase(), i = g.findIndex(x => (x.querySelector('.gn') || {}).textContent === 'Schriftart');
    if (i >= 0) g[i] = GR('Schriftart', col(el('div', { class: 'rb-field' }, fontCombo(), sizeCombo(), B({ icon: 'sizeup', sm: 1, tip: 'Schrift vergrößern (Strg+>)', fn: () => bumpFont(1) }), B({ icon: 'sizedown', sm: 1, tip: 'Schrift verkleinern (Strg+<)', fn: () => bumpFont(-1) }), B({ icon: 'casechg', sm: 1, tip: 'Groß-/Kleinschreibung', menu: caseMenu }), B({ icon: 'clear', sm: 1, tip: 'Alle Formatierungen löschen', fn: clearFormat })),
      el('div', { class: 'rb-field' }, B({ icon: 'bold', sm: 1, tip: 'Fett (Strg+B)', on: () => queryState('bold'), fn: () => exec('bold') }), B({ icon: 'italic', sm: 1, tip: 'Kursiv (Strg+I)', on: () => queryState('italic'), fn: () => exec('italic') }), B({ icon: 'underline', sm: 1, tip: 'Unterstrichen (Strg+U)', on: () => queryState('underline'), fn: () => exec('underline') }), B({ icon: 'strike', sm: 1, tip: 'Durchgestrichen', on: () => queryState('strikeThrough'), fn: () => exec('strikeThrough') }), B({ icon: 'sub', sm: 1, tip: 'Tiefgestellt', on: () => queryState('subscript'), fn: () => exec('subscript') }), B({ icon: 'sup', sm: 1, tip: 'Hochgestellt', on: () => queryState('superscript'), fn: () => exec('superscript') }),
        colorSplit({ id: 'hi', icon: 'highlight', tip: 'Texthervorhebungsfarbe', none: 'Keine Farbe', apply: c => exec('hiliteColor', c || 'transparent', true) }), colorSplit({ id: 'font', icon: 'fontcolor', tip: 'Schriftfarbe', none: 'Automatisch', apply: c => exec('foreColor', c || '#1d2330', true) }))));
    const cb = g.find(x => (x.querySelector('.gn') || {}).textContent === 'Zwischenablage'); if (cb) { const first = cb.querySelector('.rb-btn'); if (first) { const nb = B({ icon: 'paste', label: 'Einfügen', tip: 'Einfügen (Strg+V)', fn: pasteFromClipboard }); first.replaceWith(nb); } cb.querySelector('.items').append(B({ icon: 'painter', label: 'Format übertragen', tip: 'Format übernehmen und auf Text anwenden', on: () => !!painter, fn: togglePainter })); }
    return g;
  };
  IC.painter = '<path d="M5 4h10v5H5zM15 6h3v6h-8v3M10 15v5h2v-5"/>';
})();

(() => { const base = RIB.file; RIB.file = () => { const g = base(); g.push(GR('Einstellungen', B({ icon: 'gear', label: 'Einstellungen', tip: 'Design, Dunkelmodus, Touch und mehr', fn: openSettings }))); return g; }; IC.gear = '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M5.600 18.400l2.100-2.100M16.300 7.700l2.100-2.100"/>'; })();
