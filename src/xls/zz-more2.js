/* =====================================================================
   Excel, zweite Erweiterung: Tabellenformate, Diagrammtypen, Notizen, Reihen/Zufallszahlen, Formelüberwachung,
   Blattschutz, Datenumwandlung, Ansichtsoptionen – füllt die Menübänder aller Reiter.
   ===================================================================== */
Object.assign(IC, {
  tblfmt: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18" stroke-width="3"/><path d="M3 14h18M9 9v11M15 9v11"/>', hbar: '<path d="M4 4v16M4 7h10M4 12h14M4 17h7"/>', area: '<path d="M3 19l5-8 4 4 5-8 4 6v6z"/>', donut: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.500"/>', swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  note: '<path d="M4 4h16v12h-6l-4 4v-4H4z"/><path d="M8 8h8M8 11h5"/>', notex: '<path d="M4 4h16v12h-6l-4 4v-4H4z"/><path d="M9 7l6 6M15 7l-6 6"/>', today: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/><circle cx="12" cy="15" r="1.500" fill="currentColor"/>', series: '<path d="M4 18l4-4 4 2 4-6 4-4M4 6v12h16" /><path d="M4 21h16" opacity=".4"/>', dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.200" fill="currentColor"/><circle cx="15" cy="15" r="1.200" fill="currentColor"/><circle cx="15" cy="9" r="1.200" fill="currentColor"/><circle cx="9" cy="15" r="1.200" fill="currentColor"/>',
  omega: '<path d="M6 19h4v-2.500C7.500 15.500 6 13.500 6 11a6 6 0 0112 0c0 2.500-1.500 4.500-4 5.500V19h4"/>', bug: '<path d="M12 8a4 4 0 00-4 4v3a4 4 0 008 0v-3a4 4 0 00-4-4zM8 12H4M20 12h-4M8 16l-3 2M16 16l3 2M9 6l2 2M15 6l-2 2"/>', trace: '<circle cx="5" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 12l10-5M7 12l10 5"/>', lock2: '<rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 018 0v3"/>', unlock: '<rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 017.500-2"/>', val: '<path d="M5 12l4 4 10-10"/>', shuffle: '<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3"/>', blankrow: '<path d="M4 6h16M4 18h16M7 10l10 4M17 10L7 14"/>', num: '<path d="M5 8l2-1v10M11 8h3v9h-3zM17 8h3v9h-3z"/>', fbar: '<rect x="3" y="7" width="18" height="10" rx="1"/><path d="M7 12h6"/>', gotoc: '<circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>', widths: '<path d="M4 6v12M20 6v12M4 12h16M7 9l-3 3 3 3M17 9l3 3-3 3"/>', fullscr: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', spell: '<path d="M3 17l4-11 4 11M4.500 13h5M13 15l3 3 6-7"/>', dupes: '<rect x="4" y="4" width="10" height="10" rx="1"/><rect x="10" y="10" width="10" height="10" rx="1"/>'
});
const askX = (title, fields, ok, hint) => ask(title, fields, ok, hint);
const curCell = () => getCell(S.active.r, S.active.c);

/* ---- Tabellenformate ---- */
const TBLSTYLES = [['Grün', '#1f7a45', '#e3f3e9'], ['Blau', '#1f5fbf', '#e1ebfa'], ['Orange', '#d9631e', '#fdeadb'], ['Grau', '#4b5563', '#eceef1'], ['Violett', '#6d3fc0', '#ece4fa'], ['Rot', '#b4232a', '#fbe3e4']];
function formatAsTable(hd, bd) {
  const g = targetRange(), sh = cur(); if (g.r2 <= g.r1) { toast('Bitte einen Datenbereich mit mindestens zwei Zeilen markieren.', true); return; }
  for (let r = g.r1; r <= g.r2; r++) for (let c = g.c1; c <= g.c2; c++) { const k = key(r, c), cell = sh.cells[k] || (sh.cells[k] = { v: null }); const st = cell.st = cell.st || {}; if (r === g.r1) { st.b = 1; st.bg = hd; st.co = '#ffffff'; } else { delete st.b; st.co = st.co === '#ffffff' ? undefined : st.co; if (!st.co) delete st.co; if ((r - g.r1) % 2 === 0) st.bg = bd; else delete st.bg; } }
  S.sel = { r1: g.r1, c1: g.c1, r2: g.r2, c2: g.c2 }; if (!sh.filter) toggleFilter(); else commit('Als Tabelle formatieren');
}
function clearTableFormat() { const g = targetRange(); S.sel = g; clearFormats(); if (cur().filter) toggleFilter(); }

/* ---- Diagrammtypen ---- */
function changeChartKind(k) { const ch = cur().charts.find(c => c.id === S.selChart); if (!ch) { toast('Bitte zuerst ein Diagramm anklicken.', true); return; } ch.kind = k; commit('Diagrammtyp'); }
const chartKinds = [['bar', 'Säulen'], ['hbar', 'Balken'], ['line', 'Linien'], ['area', 'Fläche'], ['pie', 'Kreis'], ['donut', 'Ring']];

/* ---- Notizen ---- */
function editNote() { const c = curCell(), k = key(S.active.r, S.active.c), ta = el('textarea', { rows: 4, style: 'width:100%;font:inherit;box-sizing:border-box' }); ta.value = c && c.nt || ''; dialog({ title: 'Notiz zu ' + addr(S.active.r, S.active.c), body: ta, buttons: [{ label: 'Abbrechen' }, { label: 'OK', pri: true, fn: () => { const sh = cur(), t = ta.value.trim().slice(0, 1000); let cell = sh.cells[k]; if (t) { cell = sh.cells[k] = cell || { v: null }; cell.nt = t; } else if (cell) { delete cell.nt; if (cell.v === null && !cell.st && cell.f === undefined) delete sh.cells[k]; } commit('Notiz'); } }] }); ta.focus(); }
function delNotes(all) { const sh = cur(); let n = 0; const g = selRect(); for (const k in sh.cells) { const [r, c] = k.split(',').map(Number); if (!sh.cells[k].nt) continue; if (all || (r >= g.r1 && r <= g.r2 && c >= g.c1 && c <= g.c2)) { delete sh.cells[k].nt; n++; if (sh.cells[k].v === null && !sh.cells[k].st && sh.cells[k].f === undefined) delete sh.cells[k]; } } commit('Notizen löschen'); toast(n + (n === 1 ? ' Notiz gelöscht.' : ' Notizen gelöscht.')); }

/* ---- Einfügen: Datum, Reihe, Zufall, Symbole ---- */
function insertToday(withTime) { const d = new Date(), p = n => String(n).padStart(2, '0'), t = withTime ? p(d.getHours()) + ':' + p(d.getMinutes()) : p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear(); setCellInput(S.active.r, S.active.c, withTime ? "'" + t : t); commit('Datum einfügen'); }
function seriesDialog() { askX('Datenreihe', [{ label: 'Startwert', value: '1' }, { label: 'Schrittweite', value: '1' }, { label: 'Anzahl', type: 'number', value: '10' }, { label: 'Richtung', value: 'v', opts: [['v', 'Nach unten (Spalte)'], ['h', 'Nach rechts (Zeile)']] }], ([a, s, n, d]) => { const A = parseNumberText(a), St = parseNumberText(s), N = clamp(Math.round(+n), 1, 5000); if (A === null || St === null) throw new Error('Start und Schrittweite müssen Zahlen sein.'); for (let i = 0; i < N; i++) { const v = +(A + St * i).toPrecision(12), r = S.active.r + (d === 'v' ? i : 0), c = S.active.c + (d === 'h' ? i : 0); if (r < ROWS && c < COLS) setCellInput(r, c, String(v).replace('.', ',')); } commit('Datenreihe'); }); }
function randomDialog() { askX('Zufallszahlen in die Auswahl', [{ label: 'Minimum', value: '1' }, { label: 'Maximum', value: '100' }, { label: 'Nachkommastellen (0–6)', type: 'number', value: '0' }], ([a, b, dp]) => { const lo = parseNumberText(a), hi = parseNumberText(b), d = clamp(Math.round(+dp) || 0, 0, 6); if (lo === null || hi === null || hi < lo) throw new Error('Bitte gültige Grenzen eingeben.'); const f = Math.pow(10, d); eachSel((r, c) => { setCellInput(r, c, String(Math.round((lo + Math.random() * (hi - lo)) * f) / f).replace('.', ',')); }); commit('Zufallszahlen'); }, 'Die Zahlen werden als feste Werte eingetragen.'); }
const SYMS = '© ® ™ § ° ± × ÷ ≠ ≈ ≤ ≥ ∞ √ π Σ µ ‰ ½ ¼ ¾ ² ³ € £ ¥ → ← ↑ ↓ ✓ ✗ ★ ● ■ ▲ ▼'.split(' ');
const symMenu = () => SYMS.map(ch => ({ label: ch + '   U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'), fn: () => { const c = curCell(); setCellInput(S.active.r, S.active.c, "'" + String(c && c.v !== null && c.v !== undefined && c.f === undefined ? c.v : '') + ch); commit('Symbol'); } }));

/* ---- Formelüberwachung ---- */
function findErrors() { const sh = cur(), errs = []; for (const k in sh.cells) { if (sh.cells[k].v instanceof XlErr) { const [r, c] = k.split(',').map(Number); errs.push([r, c, sh.cells[k].v.code]); } } if (!errs.length) { toast('Keine Fehlerwerte im Blatt gefunden.'); return; } errs.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const [r, c] = errs[0]; S.active = { r, c }; S.anchor = { r, c }; S.sel = { r1: r, c1: c, r2: r, c2: c }; render(); toast(errs.length + ' Fehlerwert(e): ' + errs.slice(0, 5).map(e => addr(e[0], e[1]) + ' ' + e[2]).join(', ') + (errs.length > 5 ? ' …' : '')); }
function showPrecedents() { const c = curCell(); if (!c || c.f === undefined) { toast('Die aktive Zelle enthält keine Formel.'); return; } const refs = []; try { mapRefs(c.f, n => { const a = n.t === 'ref' ? addr(n.r, n.c) : addr(n.r1, n.c1) + ':' + addr(n.r2, n.c2); refs.push((n.sh ? n.sh + '!' : '') + a); }); } catch (e) { } toast('Vorgänger von ' + addr(S.active.r, S.active.c) + ': ' + (refs.join(', ') || '–')); }
function showDependents() { const sh = cur(), a = S.active, out = []; for (const k in sh.cells) { const cell = sh.cells[k]; if (cell.f === undefined) continue; try { let hit = false; mapRefs(cell.f, n => { if (n.sh) return; if (n.t === 'ref' ? (n.r === a.r && n.c === a.c) : (a.r >= n.r1 && a.r <= n.r2 && a.c >= n.c1 && a.c <= n.c2)) hit = true; }); if (hit) { const [r, c] = k.split(',').map(Number); out.push(addr(r, c)); } } catch (e) { } } toast('Nachfolger von ' + addr(a.r, a.c) + ': ' + (out.slice(0, 12).join(', ') || '–') + (out.length > 12 ? ' …' : '')); }
function toggleShowF() { S.showF = !S.showF; render(); refreshRibbon(); }

/* ---- Blattschutz ---- */
['startEdit', 'clearSel', 'pasteText', 'fillRange', 'styleSel', 'insertRows', 'insertCols', 'deleteRows', 'deleteCols', 'quickSort', 'sortRange', 'cleanText', 'removeDuplicates', 'textToColumns', 'transposeSel', 'seriesDialog', 'randomDialog', 'insertToday', 'formatAsTable', 'clearFormats', 'cfAdd'].forEach(n => { try { const f = eval(n); if (typeof f !== 'function') return; const w = function () { if (cur().prot) { toast('Das Blatt ist geschützt (Überprüfen › Blattschutz aufheben).', true); return; } return f.apply(this, arguments); }; eval(n + ' = w'); } catch (e) { } });
function toggleProt() { const sh = cur(); sh.prot = !sh.prot; commit(sh.prot ? 'Blatt geschützt' : 'Schutz aufgehoben'); refreshRibbon(); toast(sh.prot ? 'Blatt geschützt: Eingaben und Änderungen sind gesperrt.' : 'Blattschutz aufgehoben.'); }
(() => { const orig = validateWorkbook; validateWorkbook = function (p) { const wb = orig(p); p.sheets.forEach((s, i) => { const sh = wb.wb.sheets[i]; if (s.prot === true) sh.prot = true; for (const k in (s.cells || {})) { const nt = s.cells[k] && s.cells[k].nt; if (typeof nt === 'string' && nt && sh.cells[k]) sh.cells[k].nt = nt.slice(0, 1000); else if (typeof nt === 'string' && nt && /^\d{1,4},\d{1,3}$/.test(k)) sh.cells[k] = { v: null, nt: nt.slice(0, 1000) }; } }); return wb; }; })();

/* ---- Datenumwandlung ---- */
function formulasToValues() { let n = 0; eachSel((r, c, sh) => { const cell = sh.cells[key(r, c)]; if (cell && cell.f !== undefined) { delete cell.f; n++; } }); commit('Formeln in Werte'); toast(n + ' Formel(n) in feste Werte umgewandelt.'); }
function textToNumbers() { let n = 0; eachSel((r, c, sh) => { const cell = sh.cells[key(r, c)]; if (cell && cell.f === undefined && typeof cell.v === 'string') { const x = parseNumberText(cell.v.trim()); if (x !== null) { cell.v = x; n++; } } }); commit('Text in Zahlen'); toast(n + ' Zelle(n) in Zahlen umgewandelt.'); }
function numbersToText() { let n = 0; eachSel((r, c, sh) => { const cell = sh.cells[key(r, c)]; if (cell && cell.f === undefined && typeof cell.v === 'number') { cell.v = formatValue(cell.v, cell.st); delete cell.st; n++; } }); commit('Zahlen in Text'); toast(n + ' Zelle(n) in Text umgewandelt.'); }
function shuffleRows() { const g = targetRange(), sh = cur(), hdr = guessHeader(g), r0 = g.r1 + (hdr ? 1 : 0), rows = []; for (let r = r0; r <= g.r2; r++) { const row = []; for (let c = g.c1; c <= g.c2; c++) row.push(sh.cells[key(r, c)] || null); rows.push(row); } for (let i = rows.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rows[i], rows[j]] = [rows[j], rows[i]]; } rows.forEach((row, i) => row.forEach((cell, j) => { const k = key(r0 + i, g.c1 + j); if (cell) sh.cells[k] = cell; else delete sh.cells[k]; })); commit('Zeilen mischen'); }
function deleteBlankRows() { const g = targetRange(), sh = cur(); const keep = []; for (let r = g.r1; r <= g.r2; r++) { let any = false; for (let c = g.c1; c <= g.c2; c++) { const x = sh.cells[key(r, c)]; if (x && ((x.v !== null && x.v !== undefined && x.v !== '') || x.f !== undefined)) any = true; } if (any) keep.push(r); } if (keep.length === g.r2 - g.r1 + 1) { toast('Keine leeren Zeilen im Bereich.'); return; } const buf = keep.map(r => { const row = []; for (let c = g.c1; c <= g.c2; c++) row.push(sh.cells[key(r, c)] || null); return row; }); for (let r = g.r1; r <= g.r2; r++) for (let c = g.c1; c <= g.c2; c++) delete sh.cells[key(r, c)]; buf.forEach((row, i) => row.forEach((cell, j) => { if (cell) sh.cells[key(g.r1 + i, g.c1 + j)] = cell; })); commit('Leere Zeilen löschen'); toast((g.r2 - g.r1 + 1 - keep.length) + ' leere Zeile(n) entfernt.'); }
function markDuplicates() { cfAdd({ type: 'dup', fmt: CF_PRESETS.rot }); }

/* ---- Ansicht ---- */
function fitAllColumns() { const keep = S.active.c, u = usedBounds(cur()); for (let c = 0; c <= Math.max(0, u.c2); c++) { S.active.c = c; fitColumn(); } S.active.c = keep; }
function gotoCell() { askX('Gehe zu', [{ label: 'Zelle oder Bereich (z. B. D12)', value: '' }], ([v]) => { const nb = $('#namebox'); nb.value = v.trim(); nb.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); }); }
function toggleEl(sel, label) { const e = $(sel); e.style.display = e.style.display === 'none' ? '' : 'none'; refreshRibbon(); layout(); render(); }

/* ---- Menüband ---- */
(() => {
  const wrap = (name, add) => { const base = RIB[name]; RIB[name] = () => add(base()); };
  const grp = (g, n) => g.find(x => (x.querySelector('.gn') || {}).textContent === n);
  wrap('insert', g => { g.unshift(GR('Tabellen', B({ icon: 'tblfmt', label: 'Als Tabelle formatieren', tip: 'Kopfzeile, Streifen und Filter', menu: () => [...TBLSTYLES.map(([n, h, b]) => ({ label: n, fn: () => formatAsTable(h, b) })), '-', { label: 'Tabellenformat entfernen', fn: clearTableFormat }] })));
    const dg = grp(g, 'Diagramme'); if (dg) dg.querySelector('.items').append(B({ icon: 'hbar', label: 'Balken', fn: () => insertChart('hbar') }), B({ icon: 'area', label: 'Fläche', fn: () => insertChart('area') }), B({ icon: 'donut', label: 'Ring', fn: () => insertChart('donut') }), B({ icon: 'swap', label: 'Typ ändern', tip: 'Typ des markierten Diagramms ändern', menu: () => chartKinds.map(([k, l]) => ({ label: l, fn: () => changeChartKind(k) })) }));
    g.push(GR('Notizen', B({ icon: 'note', label: 'Notiz', tip: 'Notiz zur aktiven Zelle', fn: editNote }), B({ icon: 'notex', label: 'Notiz löschen', fn: () => delNotes(false) })),
      GR('Einfügen', B({ icon: 'today', label: 'Heute', tip: 'Heutiges Datum in die Zelle', fn: () => insertToday(false) }), B({ icon: 'clock', label: 'Uhrzeit', fn: () => insertToday(true) }), B({ icon: 'series', label: 'Datenreihe …', fn: seriesDialog }), B({ icon: 'dice', label: 'Zufallszahlen …', fn: randomDialog }), B({ icon: 'omega', label: 'Symbol', menu: symMenu }))); return g; });
  wrap('formulas', g => { g.push(GR('Beliebte Funktionen', ...['SUMME', 'MITTELWERT', 'WENN', 'SVERWEIS', 'ZÄHLENWENN', 'RUNDEN'].map(n => B({ icon: 'fx', label: n, tip: '=' + n + '( in die Zelle schreiben', fn: () => startEdit('=' + n + '(') }))),
      GR('Formelüberwachung', B({ icon: 'showf', label: 'Formeln anzeigen', on: () => !!S.showF, fn: toggleShowF }), B({ icon: 'trace', label: 'Vorgänger', tip: 'Zellen, auf die die Formel zugreift', fn: showPrecedents }), B({ icon: 'trace', label: 'Nachfolger', tip: 'Formeln, die die aktive Zelle verwenden', fn: showDependents }), B({ icon: 'bug', label: 'Fehler suchen', fn: findErrors }))); return g; });
  wrap('data', g => { g.push(GR('Umwandeln', B({ icon: 'val', label: 'Formeln in Werte', fn: formulasToValues }), B({ icon: 'num', label: 'Text in Zahlen', fn: textToNumbers }), B({ icon: 'text', label: 'Zahlen in Text', fn: numbersToText })), GR('Aufräumen', B({ icon: 'shuffle', label: 'Zeilen mischen', fn: shuffleRows }), B({ icon: 'blankrow', label: 'Leere Zeilen löschen', fn: deleteBlankRows }), B({ icon: 'dupes', label: 'Duplikate markieren', fn: markDuplicates }))); return g; });
  wrap('review', g => { g.push(GR('Notizen', B({ icon: 'note', label: 'Neue Notiz', fn: editNote }), B({ icon: 'notex', label: 'Notiz löschen', fn: () => delNotes(false) }), B({ icon: 'notex', label: 'Alle Notizen löschen', fn: () => delNotes(true) })), GR('Prüfen', B({ icon: 'spell', label: 'Rechtschreibung', tip: 'Rechtschreibprüfung im Eingabefeld', on: () => $('#ed').spellcheck !== false, fn: () => { $('#ed').spellcheck = $('#ed').spellcheck === false; refreshRibbon(); } }), B({ icon: 'bug', label: 'Fehler suchen', fn: findErrors }), B({ icon: 'dupes', label: 'Duplikate markieren', fn: markDuplicates })), GR('Schutz', B({ icon: 'lock2', label: 'Blatt schützen', on: () => !!cur().prot, tip: 'Sperrt Eingaben und Änderungen im Blatt', fn: toggleProt }))); return g; });
  wrap('view', g => { g.push(GR('Fenster', B({ icon: 'fbar', label: 'Formelleiste', on: () => $('#fbar').style.display !== 'none', fn: () => toggleEl('#fbar') }), B({ icon: 'showf', label: 'Formeln anzeigen', on: () => !!S.showF, fn: toggleShowF }), B({ icon: 'fullscr', label: 'Vollbild', fn: () => { const d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (d.requestFullscreen) d.requestFullscreen(); } })), GR('Navigation', B({ icon: 'gotoc', label: 'Gehe zu …', tip: 'Zelle oder Bereich ansteuern', fn: gotoCell }), B({ icon: 'widths', label: 'Alle Spalten anpassen', fn: fitAllColumns }), B({ icon: 'cellfmt', label: 'Standardbreiten', tip: 'Spaltenbreiten und Zeilenhöhen zurücksetzen', fn: () => { const sh = cur(); sh.colW = {}; sh.rowH = {}; sh.rowM = {}; commit('Standardbreiten'); } }))); return g; });
  const st = document.createElement('style'); st.textContent = '.cell.hasnote::after{content:"";position:absolute;right:0;top:0;border:5px solid transparent;border-top-color:#d00;border-right-color:#d00}'; document.head.append(st);
})();

/* =====================================================================
   Excel: Schriftgruppe im Office-Stil (Schriftart, Größenfeld, Farbpaletten, Durchgestrichen)
   ===================================================================== */
const XFONTS = ['Calibri', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Segoe UI', 'Tahoma', 'Trebuchet MS', 'Consolas', 'Cambria', 'Comic Sans MS'];
function xSizeCombo() {
  const dl = el('datalist', { id: 'xszlist' }, ...[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72].map(n => el('option', { value: String(n) })));
  const inp = el('input', { type: 'text', list: 'xszlist', class: 'szin', title: 'Schriftgrad (pt)', 'aria-label': 'Schriftgrad', size: 3, inputmode: 'numeric' });
  const apply = () => { const v = parseFloat(inp.value.replace(',', '.')); if (!isFinite(v) || v < 6 || v > 72) { toast('Bitte eine Größe zwischen 6 und 72 pt eingeben.', true); inp.value = String(aStyle().sz || 11); return; } setStyle('sz', v === 11 ? null : v); focusGrid(); };
  inp.addEventListener('change', apply); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
  const w = el('label', { class: 'rb-field' }, inp, dl); w._upd = () => { if (document.activeElement !== inp) inp.value = String(aStyle().sz || 11); }; ribbonCtl.push(w); return w;
}
function xFontCombo() {
  const sel = el('select', { class: 'fontsel', title: 'Schriftart', 'aria-label': 'Schriftart', onchange: e => { setStyle('fn', e.target.value === 'Calibri' ? null : e.target.value); focusGrid(); } }, ...XFONTS.map(n => el('option', { value: n, style: 'font-family:"' + n + '"' }, n)));
  const w = el('label', { class: 'rb-field' }, sel); w._upd = () => { if (document.activeElement !== sel) sel.value = aStyle().fn || 'Calibri'; }; ribbonCtl.push(w); return w;
}
(() => {
  const st = document.createElement('style'); st.textContent = '.fontsel{width:140px}.szin{width:46px;height:26px;border:1px solid #b8b8b8;border-radius:3px;padding:0 4px;text-align:center}'; document.head.append(st);
  const base = RIB.start;
  RIB.start = () => {
    const g = base(), i = g.findIndex(x => (x.querySelector('.gn') || {}).textContent === 'Schrift');
    if (i >= 0) g[i] = GR('Schrift', col(el('div', { class: 'rb-field' }, xFontCombo(), xSizeCombo(), B({ icon: 'sizeup', sm: 1, tip: 'Schrift vergrößern', fn: () => bumpSize(1) }), B({ icon: 'sizedown', sm: 1, tip: 'Schrift verkleinern', fn: () => bumpSize(-1) })),
      el('div', { class: 'rb-field' }, B({ icon: 'bold', sm: 1, tip: 'Fett (Strg+B)', on: () => !!aStyle().b, fn: () => toggleStyle('b') }), B({ icon: 'italic', sm: 1, tip: 'Kursiv (Strg+I)', on: () => !!aStyle().i, fn: () => toggleStyle('i') }), B({ icon: 'underline', sm: 1, tip: 'Unterstrichen (Strg+U)', on: () => !!aStyle().u, fn: () => toggleStyle('u') }), B({ icon: 'strike', sm: 1, tip: 'Durchgestrichen', on: () => !!aStyle().s, fn: () => toggleStyle('s') }),
        B({ icon: 'border', sm: 1, tip: 'Rahmen', menu: () => [{ label: 'Alle Rahmenlinien', fn: () => setBorders('all') }, { label: 'Außenrahmen', fn: () => setBorders('outer') }, { label: 'Unten', fn: () => setBorders('bottom') }, { label: 'Oben', fn: () => setBorders('top') }, { label: 'Kein Rahmen', fn: () => setBorders('none') }] }),
        colorSplit({ id: 'xfill', icon: 'fill', tip: 'Füllfarbe', none: 'Keine Füllung', reg: ribbonCtl, apply: c => setStyle('bg', c) }), colorSplit({ id: 'xfont', icon: 'fontcolor', tip: 'Schriftfarbe', none: 'Automatisch', reg: ribbonCtl, apply: c => setStyle('co', c) }))));
    return g;
  };
  if (!IC.strike) IC.strike = '<path d="M5 12h14M8 7c1-2 7-3 8 0M16 17c-1 2-7 3-8 0"/>';
  if (!IC.underline) IC.underline = '<path d="M7 4v7a5 5 0 0010 0V4M5 20h14"/>';
})();

/* Excel: Einfügen-Schaltfläche liest die Zwischenablage wirklich */
async function pasteButton() {
  try { const t = await navigator.clipboard.readText(); if (!t) { toast('Die Zwischenablage ist leer.'); return; } pasteText(t); }
  catch (e) { if (S.clip) { pasteText(S.clip.tsv); } else toast('Der Browser erlaubt den Zugriff auf die Zwischenablage nicht – bitte Strg+V verwenden.', true); }
}
(() => { const base = RIB.start; RIB.start = () => { const g = base(), cb = g.find(x => (x.querySelector('.gn') || {}).textContent === 'Zwischenablage'); if (cb) { const first = cb.querySelector('.rb-btn'); if (first) first.replaceWith(B({ icon: 'paste', label: 'Einfügen', tip: 'Einfügen (Strg+V)', fn: pasteButton })); } return g; }; })();

(() => { const base = RIB.file; RIB.file = () => { const g = base(); g.push(GR('Einstellungen', B({ icon: 'gear', label: 'Einstellungen', tip: 'Design, Dunkelmodus, Touch und mehr', fn: openSettings }))); return g; }; IC.gear = '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M5.600 18.400l2.100-2.100M16.300 7.700l2.100-2.100"/>'; })();

/* Touch: Umschalter „Auswählen / Verschieben“ in der Statusleiste und im Reiter Ansicht */
S.panMode = false;
function togglePan() { S.panMode = !S.panMode; $('#viewport').classList.toggle('panmode', S.panMode); const b = $('#panbtn'); if (b) { b.classList.toggle('on', S.panMode); b.textContent = S.panMode ? '✋ Verschieben' : '👆 Auswählen'; b.title = S.panMode ? 'Ein Finger verschiebt die Tabelle (zwei Finger verschieben immer)' : 'Ein Finger wählt Zellen aus (zwei Finger verschieben die Tabelle)'; } refreshRibbon(); }
(() => {
  const st = document.createElement('style'); st.textContent = '#panbtn{border:1px solid var(--rbd,#ccc);background:transparent;color:inherit;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:12px}#panbtn.on{background:var(--ac);border-color:var(--ac);color:#fff}#viewport.panmode{cursor:grab}'; document.head.append(st);
  window.addEventListener('DOMContentLoaded', () => { const stt = $('#status'); if (stt && !$('#panbtn')) { const b = el('button', { id: 'panbtn', type: 'button', onclick: togglePan }); b.textContent = '👆 Auswählen'; b.title = 'Ein Finger wählt Zellen aus (zwei Finger verschieben die Tabelle)'; stt.insertBefore(b, stt.querySelector('.sp') || null); } });
  const base = RIB.view; RIB.view = () => { const g = base(); g.push(GR('Touch', B({ icon: 'touch', label: S.panMode ? 'Verschieben aktiv' : 'Auswählen aktiv', tip: 'Umschalten: ein Finger wählt aus oder verschiebt (zwei Finger verschieben immer)', on: () => S.panMode, fn: togglePan }))); return g; };
})();
