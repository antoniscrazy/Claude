/* =====================================================================
   4. Projektformat, CSV, XLSX (Export/Import), Beispiel, Menüband, Tastatur, Start
   ===================================================================== */
const AUTOSAVE_KEY = 'webOffice.xls.autosave.v1';
const STYLE_KEYS = { b: 'b', i: 'b', u: 'b', wr: 'b', co: 'c', bg: 'c', al: 'a', nf: 'n', dp: 'd', sz: 'z', bd: 'o' };
function safeColor(c) { c = String(c || ''); return /^#[0-9a-fA-F]{6}$/.test(c) ? c : null; }
function validateWorkbook(p) {
  const fail = m => { throw new Error(m); };
  if (!p || typeof p !== 'object' || Array.isArray(p)) fail('Die Datei enthält keine Arbeitsmappe.');
  if (p.format !== 'WebOffice-Tabelle') fail('Unbekanntes Dateiformat – erwartet wird „WebOffice-Tabelle“.');
  if (typeof p.version !== 'number' || p.version < 1 || p.version > 1) fail('Projektversion ' + p.version + ' wird nicht unterstützt.');
  if (!Array.isArray(p.sheets) || !p.sheets.length || p.sheets.length > 100) fail('Die Arbeitsmappe enthält keine (oder zu viele) Blätter.');
  const names = new Set(), ids = new Set(), sheets = [], num = (v, d, a, b) => { v = +v; return isFinite(v) ? clamp(v, a, b) : d; };
  p.sheets.forEach(s => {
    if (!s || typeof s !== 'object') fail('Beschädigtes Blatt.'); const name = String(s.name || '').trim(); if (!name || name.length > 31 || /[:\\/?*\[\]]/.test(name)) fail('Ungültiger Blattname: „' + name + '“.'); if (names.has(name.toLowerCase())) fail('Doppelter Blattname: „' + name + '“.'); names.add(name.toLowerCase());
    const sh = newSheet(name); if (typeof s.id === 'string' && /^[\w-]{1,40}$/.test(s.id) && !ids.has(s.id)) sh.id = s.id; ids.add(sh.id);
    for (const k in (s.cells || {})) {
      const m = /^(\d{1,4}),(\d{1,3})$/.exec(k); if (!m || +m[1] >= ROWS || +m[2] >= COLS) fail('Ungültige Zelladresse „' + k + '“ in Blatt „' + name + '“.');
      const c = s.cells[k], cell = { v: null }; if (!c || typeof c !== 'object') fail('Beschädigte Zelle ' + k);
      if (c.v === null || typeof c.v === 'number' || typeof c.v === 'string' || typeof c.v === 'boolean') cell.v = typeof c.v === 'string' ? c.v.slice(0, 32767) : c.v; else if (c.v && typeof c.v === 'object') cell.v = null; else fail('Ungültiger Zellwert in ' + k);
      if (typeof cell.v === 'number' && !isFinite(cell.v)) cell.v = 0;
      if (c.f !== undefined) { if (typeof c.f !== 'string' || c.f.length > 8000) fail('Ungültige Formel in Zelle ' + addr(+m[1], +m[2])); try { getAst(c.f); } catch (e) { fail('Formel in Blatt „' + name + '“, Zelle ' + addr(+m[1], +m[2]) + ' ist ungültig: ' + e.message); } cell.f = c.f; }
      if (c.st && typeof c.st === 'object') { const st = {}, q = c.st; ['b', 'i', 'u', 'wr'].forEach(x => { if (q[x]) st[x] = 1; }); if (safeColor(q.co)) st.co = q.co; if (safeColor(q.bg)) st.bg = q.bg; if (['l', 'c', 'r'].includes(q.al)) st.al = q.al; if (['n', 'p', 'c', 'd'].includes(q.nf)) st.nf = q.nf; if (q.dp != null) st.dp = num(q.dp, 2, 0, 10); if (q.sz != null) st.sz = num(q.sz, 11, 6, 72);
        if (q.bd && typeof q.bd === 'object') { const bd = {}; ['t', 'r', 'b', 'l'].forEach(x => { if (q.bd[x]) bd[x] = 1; }); if (Object.keys(bd).length) st.bd = bd; } if (Object.keys(st).length) cell.st = st; }
      sh.cells[k] = cell;
    }
    for (const k in (s.colW || {})) if (/^\d{1,3}$/.test(k) && +k < COLS) sh.colW[k] = num(s.colW[k], DEF_W, 16, 800);
    for (const k in (s.rowH || {})) if (/^\d{1,4}$/.test(k) && +k < ROWS) sh.rowH[k] = num(s.rowH[k], DEF_H, 8, 600);
    for (const k in (s.rowM || {})) if (/^\d{1,4}$/.test(k)) sh.rowM[k] = 1;
    if (s.filter && typeof s.filter === 'object') { const f = s.filter, r1 = num(f.r1, 0, 0, ROWS - 1), r2 = num(f.r2, 0, 0, ROWS - 1), c1 = num(f.c1, 0, 0, COLS - 1), c2 = num(f.c2, 0, 0, COLS - 1); if (r2 > r1) { sh.filter = { r1, c1, r2, c2: Math.max(c1, c2), cols: {} }; for (const k in (f.cols || {})) if (/^\d+$/.test(k) && Array.isArray(f.cols[k])) sh.filter.cols[k] = f.cols[k].map(String).slice(0, 5000); } }
    (Array.isArray(s.charts) ? s.charts : []).forEach(ch => { if (ch && ['bar', 'line', 'pie'].includes(ch.kind) && ch.rng) { const g = { r1: num(ch.rng.r1, 0, 0, ROWS - 1), c1: num(ch.rng.c1, 0, 0, COLS - 1), r2: num(ch.rng.r2, 0, 0, ROWS - 1), c2: num(ch.rng.c2, 0, 0, COLS - 1) }; sh.charts.push({ id: typeof ch.id === 'string' && /^[\w-]{1,40}$/.test(ch.id) ? ch.id : uid('ch'), kind: ch.kind, sh: sh.id, rng: norm(g), x: num(ch.x, 0, 0, 1e6), y: num(ch.y, 0, 0, 1e6), w: num(ch.w, 420, 160, 2000), h: num(ch.h, 280, 120, 2000), title: String(ch.title || '').slice(0, 80) }); } });
    sheets.push(sh);
  });
  const wb = { sheets }; sheets.forEach(sh => { sh.hidden = {}; }); return { wb, title: String(p.title || 'Mappe1').slice(0, 80), active: num(p.active, 0, 0, sheets.length - 1) };
}
function projectJSON() { return JSON.stringify({ format: 'WebOffice-Tabelle', version: 1, title: S.name, active: S.si, sheets: S.wb.sheets.map(sh => Object.assign({}, sh, { hidden: undefined })) }, (k, v) => v instanceof XlErr ? null : v); }
function adopt(res, name) {
  S.wb = res.wb; S.name = name || res.title || 'Mappe1'; $('#docname').value = S.name; S.si = res.active || 0; S.active = { r: 0, c: 0 }; S.anchor = S.active; S.sel = { r1: 0, c1: 0, r2: 0, c2: 0 }; S.editing = null; $('#ed').style.display = 'none'; S.selChart = null; S.clip = null;
  S.wb.sheets.forEach(sh => { if (sh.filter) { const f = sh.filter; sh.hidden = {}; for (let r = f.r1 + 1; r <= f.r2; r++) for (const c in f.cols) { const cell = sh.cells[key(r, +c)], t = cell ? formatValue(cell.v, cell.st) : ''; if (f.cols[c].includes(t)) { sh.hidden[r] = 1; break; } } } });
  recalcAll(S.wb); histReset(); layout(); renderTabs(); $('#viewport').scrollTo(0, 0); render(); updateUndoBtns(); S.dirty = false;
}
/* ---------- Speichern ---------- */
const safeName = () => (S.name || 'Mappe1').replace(/[äÄöÖüÜß]/g, c => ({ 'ä': 'ae', 'Ä': 'Ae', 'ö': 'oe', 'Ö': 'Oe', 'ü': 'ue', 'Ü': 'Ue', 'ß': 'ss' }[c])).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w .-]+/g, '_').trim().slice(0, 80) || 'Mappe1';
function download(blob, name) { const a = el('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
function setSaveStatus() { $('#savestat').textContent = [autoMsg, fileMsg].filter(Boolean).join(' · '); }
function scheduleAutosave() { autoMsg = 'Änderungen noch nicht gesichert …'; setSaveStatus(); clearTimeout(autoT); autoT = setTimeout(() => { try { localStorage.setItem(AUTOSAVE_KEY, projectJSON()); autoMsg = 'Automatisch gesichert ' + new Date().toLocaleTimeString('de-DE'); } catch (e) { autoMsg = 'Automatische Sicherung nicht möglich (' + (e && e.name === 'QuotaExceededError' ? 'Speicher voll' : 'Browser blockiert Speicher') + ') – bitte Datei herunterladen'; } setSaveStatus(); }, 700); }
function saveProject() { if (S.editing && !commitEdit(0, 0)) return; try { download(new Blob([projectJSON()], { type: 'application/json' }), safeName() + '.webxls.json'); S.dirty = false; fileMsg = 'Projektdatei heruntergeladen ' + new Date().toLocaleTimeString('de-DE'); setSaveStatus(); toast('Arbeitsmappe als „' + safeName() + '.webxls.json“ heruntergeladen.'); } catch (e) { toast('Speichern fehlgeschlagen: ' + e.message, true); } }
function confirmLoad(res, name) { const go = () => { adopt(res, name); scheduleAutosave(); }; if (S.dirty) dialog({ title: 'Aktuelle Arbeitsmappe ersetzen?', body: 'Nicht heruntergeladene Änderungen gehen verloren.', buttons: [{ label: 'Abbrechen' }, { label: 'Ersetzen', pri: true, fn: go }] }); else go(); }
function errDialog(title, msg) { dialog({ title, body: el('div', null, el('p', null, msg), el('p', { class: 'hint' }, 'Die aktuell geöffnete Arbeitsmappe wurde nicht verändert.')) }); }
function openPicker() {
  const f = $('#fileIn'); f.value = ''; f.onchange = async () => {
    const file = f.files[0]; if (!file) return; const ext = (file.name.split('.').pop() || '').toLowerCase();
    try {
      if (ext === 'xlsx') { const r = await importXlsx(await file.arrayBuffer()); confirmLoad(r.res, file.name.replace(/\.xlsx$/i, '')); if (r.warnings.length) setTimeout(() => dialog({ title: 'Hinweise zum XLSX-Import', body: el('ul', null, ...r.warnings.map(w => el('li', null, w))) }), 400); }
      else if (ext === 'csv' || ext === 'txt' || ext === 'tsv') csvImportDialog(await file.text(), file.name.replace(/\.\w+$/, ''));
      else { const raw = JSON.parse(await file.text()); confirmLoad(validateWorkbook(raw), null); }
    } catch (e) { errDialog('Datei konnte nicht geöffnet werden', e instanceof SyntaxError ? 'Die Datei ist kein gültiges JSON (beschädigt oder falscher Dateityp).' : e.message); }
  }; f.click();
}

/* ---------- CSV ---------- */
function detectDelim(t) { const head = t.split(/\r?\n/).slice(0, 5).join('\n'); const cnt = d => (head.match(new RegExp(d === '\t' ? '\t' : '\\' + d, 'g')) || []).length; return [[';', cnt(';')], [',', cnt(',')], ['\t', cnt('\t')]].sort((a, b) => b[1] - a[1])[0][0]; }
function csvImportDialog(text, base) {
  const sel = el('select', null, el('option', { value: 'auto' }, 'Automatisch erkennen'), el('option', { value: ';' }, 'Semikolon ;'), el('option', { value: ',' }, 'Komma ,'), el('option', { value: '\t' }, 'Tabulator')), tgt = el('select', null, el('option', { value: 'new' }, 'Neues Blatt'), el('option', { value: 'cur' }, 'Aktuelles Blatt ab A1 (ersetzt Inhalt)'));
  const pv = el('div', { class: 'csvpv' }), upd = () => { const d = sel.value === 'auto' ? detectDelim(text) : sel.value, rows = parseDelimited(text, d); pv.textContent = rows.length + ' Zeilen, ' + Math.max(0, ...rows.map(r => r.length)) + ' Spalten – Trennzeichen: ' + ({ ';': 'Semikolon', ',': 'Komma', '\t': 'Tabulator' }[d]) + '\n' + rows.slice(0, 4).map(r => r.slice(0, 6).join(' | ')).join('\n'); }; sel.onchange = upd; upd();
  dialog({ title: 'CSV importieren', body: el('div', { class: 'form' }, el('label', null, el('span', null, 'Trennzeichen'), sel), el('label', null, el('span', null, 'Ziel'), tgt), pv, el('p', { class: 'hint' }, 'Felder mit Trennzeichen, Anführungszeichen oder Zeilenumbrüchen in „…“ werden korrekt gelesen. Texte mit „=“ am Anfang werden als Text übernommen.')), buttons: [{ label: 'Abbrechen' }, { label: 'Importieren', pri: true, fn: () => { const d = sel.value === 'auto' ? detectDelim(text) : sel.value, rows = parseDelimited(text, d).filter((r, i, a) => !(r.length === 1 && r[0] === '' && i === a.length - 1)); doCsvImport(rows, tgt.value, base); } }] });
}
function doCsvImport(rows, target, base) {
  if (rows.length > ROWS || Math.max(0, ...rows.map(r => r.length)) > COLS) { errDialog('CSV zu groß', 'Maximal ' + ROWS + ' Zeilen und ' + COLS + ' Spalten werden unterstützt.'); return; }
  let sh; if (target === 'new') { sh = newSheet(uniqueName((base || 'CSV').slice(0, 28))); S.wb.sheets.push(sh); S.si = S.wb.sheets.length - 1; renderTabs(); } else { sh = cur(); sh.cells = {}; sh.rowH = {}; sh.rowM = {}; }
  rows.forEach((row, i) => row.forEach((t, j) => { if (t === '') return; try { setCellInput(i, j, t.startsWith('=') ? "'" + t : t, sh); } catch (e) { setCellInput(i, j, "'" + t, sh); } })); S.active = { r: 0, c: 0 }; S.anchor = S.active; S.sel = { r1: 0, c1: 0, r2: 0, c2: 0 }; commit('CSV-Import'); toast('CSV importiert: ' + rows.length + ' Zeilen.');
}
function csvExportDialog() {
  const sel = el('select', null, el('option', { value: ';' }, 'Semikolon ;'), el('option', { value: ',' }, 'Komma ,'), el('option', { value: '\t' }, 'Tabulator')), dec = el('select', null, el('option', { value: ',' }, 'Komma (1,5)'), el('option', { value: '.' }, 'Punkt (1.5)'));
  sel.onchange = () => { dec.value = sel.value === ';' ? ',' : '.'; };
  dialog({ title: 'CSV exportieren: ' + cur().name, body: el('div', { class: 'form' }, el('label', null, el('span', null, 'Trennzeichen'), sel), el('label', null, el('span', null, 'Dezimaltrennzeichen'), dec), el('p', { class: 'hint' }, 'Exportiert werden die berechneten Werte des aktiven Blatts (UTF-8 mit BOM).')), buttons: [{ label: 'Abbrechen' }, { label: 'Exportieren', pri: true, fn: () => exportCsv(sel.value, dec.value) }] });
}
function toCSV(sh, d, dec) {
  const u = usedBounds(sh), out = []; const q = t => /["\n\r]/.test(t) || t.includes(d) ? '"' + t.replace(/"/g, '""') + '"' : t;
  for (let r = 0; r <= u.r2; r++) { const row = []; for (let c = 0; c <= u.c2; c++) { const cell = sh.cells[key(r, c)]; let t = ''; if (cell && cell.v !== null && cell.v !== undefined) { const v = cell.v; if (v instanceof XlErr) t = v.code; else if (typeof v === 'number') t = cell.st && cell.st.nf ? formatValue(v, cell.st) : String(v).replace('.', dec); else t = formatValue(v, cell.st); } row.push(q(t)); } out.push(row.join(d)); }
  return out.join('\r\n');
}
function exportCsv(d, dec) { download(new Blob(['﻿' + toCSV(cur(), d, dec)], { type: 'text/csv;charset=utf-8' }), safeName() + '-' + cur().name.replace(/[^\w-]+/g, '_') + '.csv'); toast('CSV exportiert.'); }

/* ---------- XLSX ---------- */
const XE = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const XHEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
function buildXlsx() {
  const sst = [], sstMap = new Map(), si = t => { if (!sstMap.has(t)) { sstMap.set(t, sst.length); sst.push(t); } return sstMap.get(t); };
  const fonts = [{}], fills = ['none', 'gray125'], borders = [{}], numFmts = [], xfs = [{ nf: 0, f: 0, fi: 0, b: 0, al: null }], xfMap = new Map(), fontKeys = new Map([['{}', 0]]), fillKeys = new Map(), borderKeys = new Map([['{}', 0]]);
  const nfId = st => { if (!st || !st.nf) return 0; const dp = st.dp != null ? st.dp : (st.nf === 'p' ? 0 : 2); let code; if (st.nf === 'd') code = 'dd\\.mm\\.yyyy'; else if (st.nf === 'p') code = dp ? '0.' + '0'.repeat(dp) + '%' : '0%'; else if (st.nf === 'c') code = '#,##0' + (dp ? '.' + '0'.repeat(dp) : '') + '\\ "€"'; else code = '#,##0' + (dp ? '.' + '0'.repeat(dp) : ''); let i = numFmts.indexOf(code); if (i < 0) { numFmts.push(code); i = numFmts.length - 1; } return 164 + i; };
  const xfOf = st => {
    if (!st || !Object.keys(st).length) return 0; const k = JSON.stringify(st); if (xfMap.has(k)) return xfMap.get(k);
    const fo = {}; if (st.b) fo.b = 1; if (st.i) fo.i = 1; if (st.u) fo.u = 1; if (st.co) fo.co = st.co; if (st.sz) fo.sz = st.sz; const fk = JSON.stringify(fo); if (!fontKeys.has(fk)) { fontKeys.set(fk, fonts.length); fonts.push(fo); }
    let fi = 0; if (st.bg) { if (!fillKeys.has(st.bg)) { fillKeys.set(st.bg, fills.length); fills.push(st.bg); } fi = fillKeys.get(st.bg); }
    let bi = 0; if (st.bd) { const bk = JSON.stringify(st.bd); if (!borderKeys.has(bk)) { borderKeys.set(bk, borders.length); borders.push(st.bd); } bi = borderKeys.get(bk); }
    xfs.push({ nf: nfId(st), f: fontKeys.get(fk), fi, b: bi, al: (st.al || st.wr) ? { h: { l: 'left', c: 'center', r: 'right' }[st.al], wr: st.wr } : null }); xfMap.set(k, xfs.length - 1); return xfs.length - 1;
  };
  const files = [], sheetXml = S.wb.sheets.map(sh => {
    const rows = {}; for (const k in sh.cells) { const [r, c] = k.split(',').map(Number); (rows[r] = rows[r] || []).push([c, sh.cells[k]]); }
    const rkeys = Object.keys(rows).map(Number).sort((a, b) => a - b); let body = '';
    const allRows = new Set(rkeys.concat(Object.keys(sh.rowH).map(Number)).concat(Object.keys(sh.hidden).map(Number))); [...allRows].sort((a, b) => a - b).forEach(r => {
      const cells = (rows[r] || []).sort((a, b) => a[0] - b[0]); let cx = '';
      cells.forEach(([c, cell]) => {
        const a = addr(r, c), s = xfOf(cell.st), sa = s ? ` s="${s}"` : '', v = cell.v;
        if (cell.f !== undefined) { let t = '', vv = ''; if (v instanceof XlErr) { t = ' t="e"'; vv = v.code; } else if (typeof v === 'string') { t = ' t="str"'; vv = XE(v); } else if (typeof v === 'boolean') { t = ' t="b"'; vv = v ? 1 : 0; } else vv = v === null || v === undefined ? 0 : v; cx += `<c r="${a}"${sa}${t}><f>${XE(cell.f)}</f><v>${vv}</v></c>`; }
        else if (v === null || v === undefined || v === '') { if (s) cx += `<c r="${a}"${sa}/>`; }
        else if (typeof v === 'number') cx += `<c r="${a}"${sa}><v>${v}</v></c>`; else if (typeof v === 'boolean') cx += `<c r="${a}"${sa} t="b"><v>${v ? 1 : 0}</v></c>`; else cx += `<c r="${a}"${sa} t="s"><v>${si(String(v))}</v></c>`;
      });
      const ht = sh.rowH[r] ? ` ht="${(sh.rowH[r] * .75).toFixed(2)}" customHeight="1"` : '', hd = sh.hidden[r] ? ' hidden="1"' : ''; body += `<row r="${r + 1}"${ht}${hd}>${cx}</row>`;
    });
    const cols = Object.keys(sh.colW).map(Number).sort((a, b) => a - b).map(c => `<col min="${c + 1}" max="${c + 1}" width="${((sh.colW[c] - 5) / 7).toFixed(2)}" customWidth="1"/>`).join('');
    return XHEAD + `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/>${cols ? `<cols>${cols}</cols>` : ''}<sheetData>${body}</sheetData>${sh.filter ? `<autoFilter ref="${rangeStr(sh.filter)}"/>` : ''}</worksheet>`;
  });
  const fontXml = fonts.map(f => `<font>${f.b ? '<b/>' : ''}${f.i ? '<i/>' : ''}${f.u ? '<u/>' : ''}<sz val="${f.sz || 11}"/>${f.co ? `<color rgb="FF${f.co.slice(1).toUpperCase()}"/>` : ''}<name val="Calibri"/><family val="2"/></font>`).join('');
  const fillXml = fills.map((f, i) => i === 0 ? '<fill><patternFill patternType="none"/></fill>' : i === 1 ? '<fill><patternFill patternType="gray125"/></fill>' : `<fill><patternFill patternType="solid"><fgColor rgb="FF${f.slice(1).toUpperCase()}"/><bgColor indexed="64"/></patternFill></fill>`).join('');
  const bd = (b, s) => b && b[s] ? `<${{ t: 'top', r: 'right', b: 'bottom', l: 'left' }[s]} style="thin"><color rgb="FF000000"/></${{ t: 'top', r: 'right', b: 'bottom', l: 'left' }[s]}>` : `<${{ t: 'top', r: 'right', b: 'bottom', l: 'left' }[s]}/>`;
  const borderXml = borders.map(b => `<border>${bd(b, 'l')}${bd(b, 'r')}${bd(b, 't')}${bd(b, 'b')}<diagonal/></border>`).join('');
  const xfXml = xfs.map(x => { const at = `numFmtId="${x.nf}" fontId="${x.f}" fillId="${x.fi}" borderId="${x.b}" xfId="0"${x.nf ? ' applyNumberFormat="1"' : ''}${x.f ? ' applyFont="1"' : ''}${x.fi ? ' applyFill="1"' : ''}${x.b ? ' applyBorder="1"' : ''}${x.al ? ' applyAlignment="1"' : ''}`; return x.al ? `<xf ${at}><alignment${x.al.h ? ` horizontal="${x.al.h}"` : ''}${x.al.wr ? ' wrapText="1"' : ''} vertical="top"/></xf>` : `<xf ${at}/>`; }).join('');
  files.push({ name: '[Content_Types].xml', data: XHEAD + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' + S.wb.sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>' });
  files.push({ name: '_rels/.rels', data: XHEAD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' });
  files.push({ name: 'xl/workbook.xml', data: XHEAD + `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="${S.si}"/></bookViews><sheets>${S.wb.sheets.map((s, i) => `<sheet name="${XE(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` });
  files.push({ name: 'xl/_rels/workbook.xml.rels', data: XHEAD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + S.wb.sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') + `<Relationship Id="rId${S.wb.sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId${S.wb.sheets.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>` });
  files.push({ name: 'xl/styles.xml', data: XHEAD + `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${numFmts.length ? `<numFmts count="${numFmts.length}">${numFmts.map((c, i) => `<numFmt numFmtId="${164 + i}" formatCode="${XE(c)}"/>`).join('')}</numFmts>` : ''}<fonts count="${fonts.length}">${fontXml}</fonts><fills count="${fills.length}">${fillXml}</fills><borders count="${borders.length}">${borderXml}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfXml}</cellXfs><cellStyles count="1"><cellStyle name="Standard" xfId="0" builtinId="0"/></cellStyles></styleSheet>` });
  files.push({ name: 'xl/sharedStrings.xml', data: XHEAD + `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sst.length}" uniqueCount="${sst.length}">${sst.map(t => `<si><t xml:space="preserve">${XE(t).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')}</t></si>`).join('')}</sst>` });
  sheetXml.forEach((x, i) => files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: x }));
  return ZipLib.build(files);
}
function exportXlsx() { if (S.editing && !commitEdit(0, 0)) return; try { download(new Blob([buildXlsx()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), safeName() + '.xlsx'); toast('XLSX exportiert: Werte, Formeln, Formate, Spaltenbreiten, Zeilenhöhen, Filterbereich (Diagramme werden nicht exportiert).'); } catch (e) { console.error(e); toast('XLSX-Export fehlgeschlagen: ' + e.message, true); } }
const L = (n, name) => Array.from(n.getElementsByTagNameNS('*', name));
const A1 = s => parseAddr(s);
async function importXlsx(buf) {
  const z = ZipLib.read(buf), need = n => { if (!z[n]) throw new Error('Datei ist keine gültige XLSX-Arbeitsmappe (Teil „' + n + '“ fehlt).'); return z[n]; }, parse = async n => { const d = new DOMParser().parseFromString(await ZipLib.readText(need(n)), 'application/xml'); if (d.getElementsByTagName('parsererror').length) throw new Error('XML-Teil „' + n + '“ ist beschädigt.'); return d; };
  const warnings = []; const wbx = await parse('xl/workbook.xml'), rels = await parse('xl/_rels/workbook.xml.rels'), relMap = {}; L(rels, 'Relationship').forEach(r => { relMap[r.getAttribute('Id')] = r.getAttribute('Target'); });
  const sst = []; if (z['xl/sharedStrings.xml']) { const d = await parse('xl/sharedStrings.xml'); L(d, 'si').forEach(si => sst.push(L(si, 't').map(t => t.textContent).join(''))); }
  const fonts = [], fills = [], xfs = [], nfm = {};
  if (z['xl/styles.xml']) {
    const d = await parse('xl/styles.xml'); L(d, 'numFmt').forEach(n => { nfm[n.getAttribute('numFmtId')] = n.getAttribute('formatCode'); });
    const fo = L(d, 'fonts')[0]; if (fo) Array.from(fo.children).forEach(f => { const o = {}, g = n => Array.from(f.children).find(x => x.localName === n); if (g('b')) o.b = 1; if (g('i')) o.i = 1; if (g('u')) o.u = 1; const col = g('color'); if (col && /^[0-9A-F]{8}$/i.test(col.getAttribute('rgb') || '')) o.co = '#' + col.getAttribute('rgb').slice(2).toLowerCase(); const sz = g('sz'); if (sz) o.sz = +sz.getAttribute('val'); fonts.push(o); });
    const fl = L(d, 'fills')[0]; if (fl) Array.from(fl.children).forEach(f => { const pf = L(f, 'patternFill')[0], fg = pf && L(pf, 'fgColor')[0]; fills.push(pf && pf.getAttribute('patternType') === 'solid' && fg && /^[0-9A-F]{8}$/i.test(fg.getAttribute('rgb') || '') ? '#' + fg.getAttribute('rgb').slice(2).toLowerCase() : null); });
    const bl = L(d, 'borders')[0], borders = []; if (bl) Array.from(bl.children).forEach(b => { const o = {}; [['left', 'l'], ['right', 'r'], ['top', 't'], ['bottom', 'b']].forEach(([n, k]) => { const e = Array.from(b.children).find(x => x.localName === n); if (e && e.getAttribute('style')) o[k] = 1; }); borders.push(o); });
    const cx = L(d, 'cellXfs')[0]; if (cx) Array.from(cx.children).forEach(x => { const al = Array.from(x.children).find(c => c.localName === 'alignment'); xfs.push({ nf: x.getAttribute('numFmtId'), font: +x.getAttribute('fontId') || 0, fill: +x.getAttribute('fillId') || 0, bd: borders[+x.getAttribute('borderId') || 0] || {}, h: al && al.getAttribute('horizontal'), wr: al && al.getAttribute('wrapText') === '1' }); });
  }
  const stOf = i => {
    const x = xfs[i]; if (!x) return null; const st = {}, f = fonts[x.font] || {}; if (f.b) st.b = 1; if (f.i) st.i = 1; if (f.u) st.u = 1; if (f.co && f.co !== '#000000') st.co = f.co; if (f.sz && f.sz !== 11) st.sz = f.sz; if (fills[x.fill]) st.bg = fills[x.fill];
    if (x.h === 'center') st.al = 'c'; else if (x.h === 'right') st.al = 'r'; else if (x.h === 'left') st.al = 'l'; if (x.wr) st.wr = 1; if (Object.keys(x.bd).length) st.bd = Object.assign({}, x.bd);
    const id = +x.nf, code = nfm[x.nf]; if ([9, 10].includes(id)) { st.nf = 'p'; st.dp = id === 10 ? 2 : 0; } else if (id >= 14 && id <= 22 && id !== 20 && id !== 21 || id === 14) st.nf = 'd'; else if ([1, 2, 3, 4].includes(id)) { st.nf = 'n'; st.dp = id === 1 || id === 3 ? 0 : 2; }
    else if (code) { if (/%/.test(code)) { st.nf = 'p'; st.dp = ((/0\.(0+)/.exec(code) || [0, ''])[1]).length; } else if (/[dy]{2}/i.test(code) && !/[#0]/.test(code.replace(/\\./g, ''))) st.nf = 'd'; else if (/€|\$|EUR/.test(code)) { st.nf = 'c'; st.dp = ((/0\.(0+)/.exec(code) || [0, ''])[1]).length; } else if (/0/.test(code) && /[#0]/.test(code)) { st.nf = 'n'; st.dp = ((/0\.(0+)/.exec(code) || [0, ''])[1]).length; } }
    return Object.keys(st).length ? st : null;
  };
  const sheets = []; let lost = false; for (const s of L(wbx, 'sheet')) {
    const name = s.getAttribute('name'), rid = s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || s.getAttribute('r:id'); let tgt = relMap[rid]; if (!tgt) continue; tgt = tgt.replace(/^\/?(xl\/)?/, 'xl/'); const d = await parse(tgt);
    const sh = newSheet(String(name).slice(0, 31)); if (findSheet({ sheets }, sh.name)) sh.name = uniqueNameIn(sheets, sh.name);
    L(d, 'col').forEach(c => { const w = Math.round(+c.getAttribute('width') * 7 + 5); for (let i = +c.getAttribute('min') - 1; i <= Math.min(+c.getAttribute('max') - 1, COLS - 1); i++) if (w > 16) sh.colW[i] = w; });
    const shared = {};
    L(d, 'row').forEach(rw => { const rr = +rw.getAttribute('r') - 1; if (rr >= ROWS) return; if (rw.getAttribute('ht') && rw.getAttribute('customHeight') === '1') { sh.rowH[rr] = Math.round(+rw.getAttribute('ht') / .75); sh.rowM[rr] = 1; } if (rw.getAttribute('hidden') === '1') sh.hidden[rr] = 1;
      L(rw, 'c').forEach(c => {
        const p = A1(c.getAttribute('r')); if (!p) return; const t = c.getAttribute('t'), vN = L(c, 'v')[0], fN = L(c, 'f')[0], cell = { v: null }; const st = stOf(+c.getAttribute('s') || 0); if (st) cell.st = st;
        let v = vN ? vN.textContent : null; if (t === 's') cell.v = v != null ? sst[+v] : null; else if (t === 'inlineStr') cell.v = L(c, 't').map(x => x.textContent).join(''); else if (t === 'str') cell.v = v; else if (t === 'b') cell.v = v === '1'; else if (t === 'e') cell.v = v; else if (v !== null && v !== '') cell.v = parseFloat(v);
        if (fN) {
          let ft = fN.textContent.trim(); if (fN.getAttribute('t') === 'shared') { const si_ = fN.getAttribute('si'); if (ft) shared[si_] = { f: ft, r: p.r, c: p.c }; else if (shared[si_]) { try { ft = shiftFormula(normalizeFormula(shared[si_].f.replace(/_xlfn\./g, '')), p.r - shared[si_].r, p.c - shared[si_].c); } catch (e) { ft = ''; } } }
          if (ft) { try { const nf_ = (fN.getAttribute('t') === 'shared' && !fN.textContent.trim()) ? ft : normalizeFormula(ft.replace(/_xlfn\./g, '')); getAst(nf_); cell.f = nf_; } catch (e) { warnings.push('Formel in „' + name + '“!' + c.getAttribute('r') + ' (=' + ft.slice(0, 40) + ') wird nicht unterstützt (' + e.message + '); der berechnete Wert wurde übernommen.'); delete cell.f; } }
        }
        if (cell.v !== null || cell.st || cell.f !== undefined) { if (typeof cell.v === 'string' && t === 'e') { cell.v = cell.v; } sh.cells[key(p.r, p.c)] = cell; }
      }); });
    const af = L(d, 'autoFilter')[0]; if (af && af.getAttribute('ref')) { const g = parseRange(af.getAttribute('ref')); if (g && g.r2 > g.r1) sh.filter = { r1: g.r1, c1: g.c1, r2: g.r2, c2: g.c2, cols: {} }; }
    sheets.push(sh);
  }
  if (!sheets.length) throw new Error('Die Arbeitsmappe enthält keine lesbaren Blätter.');
  if (Object.keys(z).some(n => /^xl\/(charts|drawings|media)\//.test(n))) warnings.push('Diagramme, Bilder und Zeichnungen der Datei wurden nicht übernommen.');
  if (Object.keys(z).some(n => /conditionalFormatting|pivot/i.test(n))) warnings.push('Bedingte Formatierung/Pivot-Tabellen werden nicht unterstützt.');
  const wb = { sheets }; sheets.forEach(sh => { if (!sh.hidden) sh.hidden = {}; }); return { res: { wb, title: 'Importierte Mappe', active: 0 }, warnings };
}
function uniqueNameIn(sheets, base) { let n = base, k = 2; while (sheets.some(s => s.name.toLowerCase() === n.toLowerCase())) n = base.slice(0, 27) + ' (' + k++ + ')'; return n; }

/* ---------- Beispielmappe ---------- */
function sampleWorkbook() {
  const wb = { sheets: [newSheet('Verkauf'), newSheet('Auswertung')] }, v = wb.sheets[0], a = wb.sheets[1], put = (sh, ad, t, st) => { const p = parseAddr(ad); setCellInput(p.r, p.c, t, sh); if (st) { const k = key(p.r, p.c), c = sh.cells[k] || (sh.cells[k] = { v: null }); c.st = Object.assign(c.st || {}, st); } };
  const head = { b: 1, bg: '#d6efdf' }; ['Produkt', 'Menge', 'Preis', 'Umsatz', 'Region', 'Brutto'].forEach((h, i) => put(v, colName(i) + '1', h, head));
  const data = [['Äpfel', 120, 0.5, 'Nord'], ['Birnen', 80, 0.75, 'Süd'], ['Kirschen', 45, 2.4, 'Nord'], ['Pflaumen', 60, 1.2, 'West'], ['Trauben', 150, 1.9, 'Süd'], ['Erdbeeren', 90, 3.1, 'West'], ['Himbeeren', 35, 4.5, 'Nord'], ['Melonen', 25, 2.8, 'Süd']];
  data.forEach((d, i) => { const r = i + 2; put(v, 'A' + r, d[0]); put(v, 'B' + r, String(d[1])); put(v, 'C' + r, String(d[2]).replace('.', ',') + ' €'); put(v, 'D' + r, `=B${r}*C${r}`, { nf: 'c', dp: 2 }); put(v, 'E' + r, d[3]); put(v, 'F' + r, `=D${r}*(1+$H$1)`, { nf: 'c', dp: 2 }); });
  put(v, 'G1', 'MwSt', { b: 1 }); put(v, 'H1', '19%'); put(v, 'A11', 'Gesamt', { b: 1 }); put(v, 'B11', '=SUMME(B2:B9)', { b: 1 }); put(v, 'D11', '=SUMME(D2:D9)', { b: 1, nf: 'c', dp: 2 }); put(v, 'F11', '=SUMME(F2:F9)', { b: 1, nf: 'c', dp: 2 });
  v.colW[0] = 110; v.colW[3] = 100; v.colW[5] = 100;
  ['Region', 'Umsatz'].forEach((h, i) => put(a, colName(i) + '1', h, head)); ['Nord', 'Süd', 'West'].forEach((rg, i) => { put(a, 'A' + (i + 2), rg); put(a, 'B' + (i + 2), `=SUMMEWENN(Verkauf!E2:E9;A${i + 2};Verkauf!D2:D9)`, { nf: 'c', dp: 2 }); });
  put(a, 'A5', 'Gesamt', { b: 1 }); put(a, 'B5', '=SUMME(B2:B4)', { b: 1, nf: 'c', dp: 2 }); put(a, 'D1', 'Produkt suchen', head); put(a, 'D2', 'Trauben'); put(a, 'E2', '=WENNFEHLER(SVERWEIS(D2;Verkauf!A2:D9;4;FALSCH);"nicht gefunden")', { nf: 'c', dp: 2 });
  put(a, 'D4', 'Produkte > 100 €', { b: 1 }); put(a, 'E4', '=ZÄHLENWENN(Verkauf!D2:D9;">100")'); put(a, 'D5', 'Bester Umsatz', { b: 1 }); put(a, 'E5', '=MAX(Verkauf!D2:D9)', { nf: 'c', dp: 2 }); a.colW[0] = 100; a.colW[3] = 130; a.colW[4] = 110;
  v.charts.push({ id: uid('ch'), kind: 'bar', sh: v.id, rng: { r1: 0, c1: 0, r2: 8, c2: 1 }, x: 10, y: 11 * DEF_H + 14, w: 460, h: 280, title: 'Menge je Produkt' });
  a.charts.push({ id: uid('ch'), kind: 'pie', sh: a.id, rng: { r1: 0, c1: 0, r2: 3, c2: 1 }, x: 10, y: 7 * DEF_H, w: 360, h: 250, title: 'Umsatz je Region' });
  return { wb, title: 'Beispielmappe', active: 0 };
}
function blankWorkbook() { return { wb: { sheets: [newSheet('Tabelle1')] }, title: 'Mappe1', active: 0 }; }
function newDialog() { dialog({ title: 'Neue Arbeitsmappe', body: 'Leere Mappe oder die integrierte Beispielmappe (Formeln, zwei Blätter, Diagramme) laden?', buttons: [{ label: 'Abbrechen' }, { label: 'Beispielmappe', fn: () => confirmLoad(sampleWorkbook(), 'Beispielmappe') }, { label: 'Leere Mappe', pri: true, fn: () => confirmLoad(blankWorkbook(), 'Mappe1') }] }); }
function helpDialog() {
  const fns = Object.keys(FN_DE).map(k => FN_DE[k] + (FN_DE[k] !== k ? ' / ' + k : '')).join(', ');
  dialog({ title: 'Formelsyntax und Funktionsumfang', wide: true, body: el('div', null, el('p', null, 'Formeln beginnen mit „=“. Argumente trennen Sie mit „;“ (auch „,“ wird akzeptiert), Dezimalzahlen schreiben Sie mit Punkt (1.5); ein Dezimalkomma (1,5) ist erlaubt, sobald die Formel „;“ als Trenner verwendet. In Zellen sind 1,5 und 1.5 erlaubt. Bezüge: A1, $A$1, $A1, A$1, Bereiche A1:B9, andere Blätter Blatt1!A1 oder \'Mein Blatt\'!A1:B2.'), el('p', null, 'Funktionen (deutsch / englisch): ' + fns + '.'), el('p', { class: 'hint' }, 'SVERWEIS: exakte Suche (4. Argument FALSCH) oder Näherung in aufsteigend sortierter erster Spalte. XVERWEIS: exakte Suche in einer Zeile/Spalte mit gleich langem Rückgabebereich und optionalem „Wenn nicht gefunden“. Zirkelbezüge ergeben #ZIRKEL! mit Pfad im Tooltip.'), el('p', { class: 'hint' }, 'XLSX: Werte, Formeln, Zahlenformate (Zahl/Prozent/Währung/Datum), Schrift fett/kursiv/unterstrichen/Farbe/Größe, Füllung, Rahmen, Ausrichtung, Textumbruch, Spaltenbreiten, Zeilenhöhen, mehrere Blätter, Autofilter-Bereich. Nicht enthalten: Diagramme, Bilder, bedingte Formatierung, verbundene Zellen, Matrixformeln.')) });
}

/* ---------- Menüband ---------- */
let ribbonCtl = [];
function B(o) { const b = el('button', { class: 'rb-btn' + (o.sm ? ' sm' : '') + (o.label ? '' : ' ic-only'), title: o.tip || o.label || '', 'aria-label': o.tip || o.label || o.icon, html: icon(o.icon, o.sm ? 18 : 26) + (o.label ? '<span></span>' : '') }); if (o.label) b.lastChild.textContent = o.label; b.addEventListener('mousedown', e => e.preventDefault()); b.addEventListener('click', () => { if (S.editing && !o.keepEdit && !commitEdit(0, 0)) return; if (o.menu) showMenu(b, o.menu()); else o.fn(); }); b._upd = () => { b.disabled = o.en ? !o.en() : false; b.classList.toggle('on', !!(o.on && o.on())); }; ribbonCtl.push(b); return b; }
function F(o) { const w = el('label', { class: 'rb-field' }, o.label || ''); let inp; if (o.type === 'select') inp = el('select', { 'aria-label': o.label || o.tip, title: o.tip || '', onchange: e => { if (S.editing && !commitEdit(0, 0)) return; o.set(e.target.value); } }, ...o.opts.map(([v, t]) => el('option', { value: v }, t))); else inp = el('input', { type: o.type || 'color', title: o.tip || '', 'aria-label': o.label || o.tip, onchange: e => { if (S.editing && !commitEdit(0, 0)) return; o.set(e.target.value); } }); w.append(inp); if (o.after) w.append(o.after); w._upd = () => { const v = o.get ? o.get() : null; if (v != null && document.activeElement !== inp) inp.value = v; }; ribbonCtl.push(w); return w; }
const GR = (name, ...items) => el('div', { class: 'grp' }, el('div', { class: 'items' }, ...items), el('div', { class: 'gn' }, name));
const col = (...c) => el('div', { class: 'rb-col' }, ...c);
const aStyle = () => { const c = getCell(S.active.r, S.active.c); return (c && c.st) || {}; };
const FUNC_LIST = ['SUMME', 'MITTELWERT', 'MIN', 'MAX', 'ANZAHL', 'ANZAHL2', 'RUNDEN', 'WENN', 'UND', 'ODER', 'WENNFEHLER', 'SUMMEWENN', 'ZÄHLENWENN', 'SVERWEIS', 'XVERWEIS', 'INDEX', 'VERGLEICH', 'VERKETTEN', 'HEUTE'];
const RIB = {
  file() { return [GR('Arbeitsmappe', B({ icon: 'new', label: 'Neu', fn: newDialog }), B({ icon: 'open', label: 'Öffnen', tip: 'Projekt (.webxls.json), .xlsx oder .csv öffnen', fn: openPicker }), B({ icon: 'save', label: 'Speichern', tip: 'Projekt herunterladen (Strg+S)', fn: saveProject })), GR('Exportieren', B({ icon: 'xlsx', label: 'Excel (.xlsx)', fn: exportXlsx }), B({ icon: 'csv', label: 'CSV …', fn: csvExportDialog }), B({ icon: 'csv', label: 'CSV importieren …', fn: () => { const f = $('#fileIn'); f.value = ''; f.onchange = async () => { if (f.files[0]) csvImportDialog(await f.files[0].text(), f.files[0].name.replace(/\.\w+$/, '')); }; f.click(); } })), GR('Hilfe', B({ icon: 'help', label: 'Formelsyntax', fn: helpDialog }))]; },
  start() {
    return [GR('Zwischenablage', B({ icon: 'paste', label: 'Einfügen', tip: 'Einfügen (Strg+V)', fn: () => { toast('Einfügen mit Strg+V (Browser-Zwischenablage)'); } }), col(B({ icon: 'cut', sm: 1, label: 'Ausschneiden', fn: () => copySel(true) }), B({ icon: 'copy', sm: 1, label: 'Kopieren', fn: () => copySel(false) }))),
      GR('Schrift', col(el('div', { class: 'rb-field' }, F({ type: 'select', tip: 'Schriftgröße (pt)', opts: [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36].map(n => [n, n]), get: () => aStyle().sz || 11, set: v => setStyle('sz', +v === 11 ? null : +v) }), B({ icon: 'bold', sm: 1, tip: 'Fett (Strg+B)', on: () => !!aStyle().b, fn: () => toggleStyle('b') }), B({ icon: 'italic', sm: 1, tip: 'Kursiv (Strg+I)', on: () => !!aStyle().i, fn: () => toggleStyle('i') }), B({ icon: 'underline', sm: 1, tip: 'Unterstrichen (Strg+U)', on: () => !!aStyle().u, fn: () => toggleStyle('u') })),
        el('div', { class: 'rb-field' }, F({ type: 'color', tip: 'Schriftfarbe', get: () => aStyle().co || '#000000', set: v => setStyle('co', v), after: el('span', { html: icon('fontcolor', 16) }) }), F({ type: 'color', tip: 'Füllfarbe', get: () => aStyle().bg || '#ffffff', set: v => setStyle('bg', v), after: el('span', { html: icon('fill', 16) }) }), B({ icon: 'border', sm: 1, tip: 'Rahmen', menu: () => [{ label: 'Alle Rahmenlinien', fn: () => setBorders('all') }, { label: 'Außenrahmen', fn: () => setBorders('outer') }, { label: 'Unten', fn: () => setBorders('bottom') }, { label: 'Oben', fn: () => setBorders('top') }, { label: 'Kein Rahmen', fn: () => setBorders('none') }] })))),
      GR('Ausrichtung', col(el('div', { class: 'rb-field' }, ...['l', 'c', 'r'].map(a => B({ icon: 'align' + a, sm: 1, tip: { l: 'Linksbündig', c: 'Zentriert', r: 'Rechtsbündig' }[a], on: () => aStyle().al === a, fn: () => { const on = aStyle().al === a; setStyle('al', on ? null : a); } })), B({ icon: 'wrap', sm: 1, tip: 'Textumbruch', on: () => !!aStyle().wr, fn: toggleWrap })))),
      GR('Zahl', col(el('div', { class: 'rb-field' }, F({ type: 'select', tip: 'Zahlenformat', opts: [['g', 'Standard'], ['n', 'Zahl'], ['p', 'Prozent'], ['c', 'Währung (€)'], ['d', 'Datum']], get: () => aStyle().nf || 'g', set: v => setNumFmt(v) })), el('div', { class: 'rb-field' }, B({ icon: 'percent', sm: 1, tip: 'Prozent', fn: () => setNumFmt('p') }), B({ icon: 'euro', sm: 1, tip: 'Währung', fn: () => setNumFmt('c') }), B({ icon: 'decplus', sm: 1, tip: 'Dezimalstelle hinzufügen', fn: () => decDigits(1) }), B({ icon: 'decminus', sm: 1, tip: 'Dezimalstelle löschen', fn: () => decDigits(-1) })))),
      GR('Bearbeiten', B({ icon: 'eraser', label: 'Inhalt löschen', tip: 'Entf', fn: clearSel }), col(B({ icon: 'sortaz', sm: 1, label: 'A→Z', tip: 'Aufsteigend sortieren', fn: () => quickSort(true) }), B({ icon: 'sortza', sm: 1, label: 'Z→A', tip: 'Absteigend sortieren', fn: () => quickSort(false) })), B({ icon: 'filter', label: 'Filter', on: () => !!cur().filter, fn: toggleFilter })),
      GR('Blatt', B({ icon: 'sheetadd', label: 'Neues Blatt', fn: addSheet }), col(B({ icon: 'edit', sm: 1, label: 'Umbenennen', fn: () => renameSheetDialog(S.si) }), B({ icon: 'dup', sm: 1, label: 'Duplizieren', fn: () => duplicateSheet(S.si) }), B({ icon: 'trash', sm: 1, label: 'Löschen', en: () => S.wb.sheets.length > 1, fn: () => deleteSheet(S.si) })))];
  },
  insert() {
    const funcMenu = () => FUNC_LIST.map(n => ({ label: n, fn: () => { startEdit('=' + n + '('); } }));
    return [GR('Diagramme', B({ icon: 'chartbar', label: 'Säulen', fn: () => insertChart('bar') }), B({ icon: 'chartline', label: 'Linien', fn: () => insertChart('line') }), B({ icon: 'chartpie', label: 'Kreis', fn: () => insertChart('pie') })),
      GR('Funktionen', B({ icon: 'fx', label: 'Funktion', tip: 'Funktion in die Zelle schreiben', menu: funcMenu }), B({ icon: 'sum', label: 'Summe', tip: 'Summe einfügen', fn: autoSum }))];
  },
  data() { return [GR('Sortieren und Filtern', B({ icon: 'sortaz', label: 'A→Z', fn: () => quickSort(true) }), B({ icon: 'sortza', label: 'Z→A', fn: () => quickSort(false) }), B({ icon: 'sort', label: 'Sortieren …', fn: sortDialog }), B({ icon: 'filter', label: 'Filter', on: () => !!cur().filter, fn: toggleFilter })), GR('Daten', B({ icon: 'csv', label: 'CSV importieren', fn: () => { const f = $('#fileIn'); f.value = ''; f.onchange = async () => { if (f.files[0]) csvImportDialog(await f.files[0].text(), f.files[0].name.replace(/\.\w+$/, '')); }; f.click(); } }), B({ icon: 'csv', label: 'CSV exportieren', fn: csvExportDialog }), B({ icon: 'xlsx', label: 'XLSX exportieren', fn: exportXlsx }))]; },
  view() { return [GR('Anzeigen', B({ icon: 'grid', label: 'Gitternetz', on: () => !$('#gridwrap').classList.contains('nogrid'), fn: () => { $('#gridwrap').classList.toggle('nogrid'); } }), B({ icon: 'touch', label: 'Auswahl erweitern', tip: 'Touch: Tippen erweitert die Auswahl (wie Umschalt)', on: () => S.extend, fn: () => { S.extend = !S.extend; $('#viewport').classList.toggle('extend', S.extend); } })), GR('Zeilen', B({ icon: 'fit', label: 'Spalte anpassen', tip: 'Breite der aktiven Spalte an den Inhalt anpassen', fn: fitColumn }))]; }
};
function autoSum() { const g = selRect(), sh = cur(); let r = g.r2 + 1, c = g.c1; if (g.r1 === g.r2 && g.c1 === g.c2) { /* über der Zelle summieren */ let rr = g.r1 - 1; while (rr >= 0 && sh.cells[key(rr, g.c1)] && typeof sh.cells[key(rr, g.c1)].v === 'number') rr--; if (rr + 1 >= g.r1) { toast('Keine Zahlen oberhalb gefunden.', true); return; } try { setCellInput(g.r1, g.c1, '=SUMME(' + addr(rr + 1, g.c1) + ':' + addr(g.r1 - 1, g.c1) + ')'); commit('Summe'); } catch (e) { toast(e.message, true); } return; }
  for (let cc = g.c1; cc <= g.c2; cc++) setCellInput(r, cc, '=SUMME(' + addr(g.r1, cc) + ':' + addr(g.r2, cc) + ')'); commit('Summe'); }
function fitColumn() { const sh = cur(), c = S.active.c; let w = 40; for (const k in sh.cells) { const [r, cc] = k.split(',').map(Number); if (cc !== c) continue; const m = $('#measure'); m.style.width = 'auto'; m.style.whiteSpace = 'nowrap'; m.style.fontSize = ((sh.cells[k].st && sh.cells[k].st.sz) || 11) + 'pt'; m.textContent = formatValue(sh.cells[k].v, sh.cells[k].st); w = Math.max(w, m.scrollWidth + 16); m.style.whiteSpace = ''; } sh.colW[c] = Math.min(600, w); commit('Spaltenbreite'); }
const TABS = [['file', 'Datei'], ['start', 'Start'], ['insert', 'Einfügen'], ['data', 'Daten'], ['view', 'Ansicht']]; let curTab = 'start';
function buildRibbon() { ribbonCtl = []; $('#tabs').replaceChildren(...TABS.map(([id, l]) => el('button', { class: 'tab' + (curTab === id ? ' on' : ''), role: 'tab', onclick: () => { curTab = id; buildRibbon(); } }, l))); $('#ribbon').replaceChildren(...RIB[curTab]()); refreshRibbon(); }
function refreshRibbon() { ribbonCtl.forEach(c => c._upd && c._upd()); }
const _render = render; render = function () { _render(); refreshRibbon(); };

/* ---------- Tastatur & Verdrahtung ---------- */
function bindAll() {
  const vp = $('#viewport'); vp.addEventListener('scroll', refreshSoon); vp.addEventListener('pointerdown', onGridDown); vp.addEventListener('pointermove', onGridMove); vp.addEventListener('pointerup', onGridUp); vp.addEventListener('pointercancel', onGridUp);
  const ch = $('#colhead'), rh = $('#rowhead'); ch.addEventListener('pointerdown', e => headDown(e, 'c')); ch.addEventListener('pointermove', e => headMove(e, 'c')); ch.addEventListener('pointerup', e => headUp(e, 'c')); rh.addEventListener('pointerdown', e => headDown(e, 'r')); rh.addEventListener('pointermove', e => headMove(e, 'r')); rh.addEventListener('pointerup', e => headUp(e, 'r'));
  $('#corner').addEventListener('pointerdown', () => { selectAll(); focusGrid(); });
  new ResizeObserver(refreshSoon).observe(vp);
  const fx = $('#fx'), ed = $('#ed');
  fx.addEventListener('focus', () => { if (!S.editing) startEdit(null, true); });
  fx.addEventListener('input', () => { if (S.editing) { ed.value = fx.value; if (ed.style.display === 'none') ed.style.display = 'block'; sizeEditor(); } });
  ed.addEventListener('input', () => { fx.value = ed.value; sizeEditor(); });
  $('#namebox').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); let t = e.target.value.trim(); const g = parseRange(t); if (!g) { toast('Ungültiger Bezug: ' + t, true); return; } S.anchor = { r: g.r1, c: g.c1 }; S.active = { r: g.r1, c: g.c1 }; S.sel = g; reveal(g.r1, g.c1); render(); focusGrid(); } if (e.key === 'Escape') { render(); focusGrid(); } });
  $('#namebox').addEventListener('focus', e => e.target.select());
  $('#clipbox').addEventListener('paste', e => { e.preventDefault(); const t = e.clipboardData.getData('text/plain'); if (t) pasteText(t); setTimeout(focusGrid, 0); });
  document.addEventListener('keydown', onKey);
  $('#docname').addEventListener('change', e => { S.name = e.target.value.trim() || 'Mappe1'; scheduleAutosave(); });
  $('#qSave').onclick = saveProject; $('#qUndo').onclick = undo; $('#qRedo').onclick = redo;
  window.addEventListener('beforeunload', e => { if (S.dirty && fileMsg === '' && false) { e.preventDefault(); } });
}
function onKey(e) {
  const k = e.key, mod = e.ctrlKey || e.metaKey, t = e.target;
  if (dlgStack.length) { if (k === 'Escape') { e.preventDefault(); dlgStack[dlgStack.length - 1].close(); } return; }
  if (menuEl) { if (k === 'Escape') { e.preventDefault(); closeMenu(); focusGrid(); } return; }
  if (mod && (k === 's' || k === 'S')) { e.preventDefault(); saveProject(); return; }
  if (t.id === 'ed' || t.id === 'fx') {
    if (k === 'Enter' && !e.altKey) { e.preventDefault(); commitEdit(e.shiftKey ? -1 : 1, 0); } else if (k === 'Enter' && e.altKey && t.id === 'ed') { e.preventDefault(); const p = t.selectionStart; t.value = t.value.slice(0, p) + '\n' + t.value.slice(p); t.setSelectionRange(p + 1, p + 1); $('#fx').value = t.value; sizeEditor(); }
    else if (k === 'Tab') { e.preventDefault(); commitEdit(0, e.shiftKey ? -1 : 1); } else if (k === 'Escape') { e.preventDefault(); cancelEdit(); }
    return;
  }
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
  if (mod && !e.shiftKey && (k === 'z' || k === 'Z')) { e.preventDefault(); undo(); return; } if (mod && (k === 'y' || k === 'Y' || (e.shiftKey && (k === 'z' || k === 'Z')))) { e.preventDefault(); redo(); return; }
  if (mod && (k === 'c' || k === 'C')) { e.preventDefault(); copySel(false); return; } if (mod && (k === 'x' || k === 'X')) { e.preventDefault(); copySel(true); return; }
  if (mod && (k === 'v' || k === 'V')) { const cb = $('#clipbox'); cb.value = ''; cb.focus(); return; }
  if (mod && (k === 'a' || k === 'A')) { e.preventDefault(); selectAll(); return; } if (mod && (k === 'b' || k === 'B')) { e.preventDefault(); toggleStyle('b'); return; } if (mod && (k === 'i' || k === 'I')) { e.preventDefault(); toggleStyle('i'); return; } if (mod && (k === 'u' || k === 'U')) { e.preventDefault(); toggleStyle('u'); return; }
  if (S.selChart && (k === 'Delete' || k === 'Backspace')) { e.preventDefault(); deleteChart(S.selChart); return; }
  const sh = e.shiftKey;
  if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); const d = { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k]; if (mod) jumpEdge(d[0], d[1], sh); else moveActive(d[0], d[1], sh); return; }
  if (k === 'Enter') { e.preventDefault(); const g = selRect(); if (g.r1 !== g.r2 || g.c1 !== g.c2) { /* innerhalb der Auswahl weiterschalten */ let r = S.active.r + (sh ? -1 : 1), c = S.active.c; if (r > g.r2) { r = g.r1; c++; if (c > g.c2) c = g.c1; } else if (r < g.r1) { r = g.r2; c--; if (c < g.c1) c = g.c2; } S.active = { r, c }; reveal(r, c); render(); } else moveActive(sh ? -1 : 1, 0, false); return; }
  if (k === 'Tab') { e.preventDefault(); moveActive(0, sh ? -1 : 1, false); return; }
  if (k === 'F2') { e.preventDefault(); startEdit(); return; }
  if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); clearSel(); return; }
  if (k === 'Home') { e.preventDefault(); if (mod) selectCell(0, 0); else selectCell(S.active.r, 0, sh); return; }
  if (k === 'PageDown' || k === 'PageUp') { e.preventDefault(); const n = Math.max(1, Math.floor($('#viewport').clientHeight / DEF_H) - 1); moveActive(k === 'PageDown' ? n : -n, 0, sh); return; }
  if (k === 'Escape') { S.selChart = null; if (S.clip) { S.clip = null; } render(); return; }
  if (!mod && !e.altKey && k.length === 1) { e.preventDefault(); startEdit(k); }
}
function init() {
  $('#qSave').innerHTML = icon('save', 20); $('#qUndo').innerHTML = icon('undo', 20); $('#qRedo').innerHTML = icon('redo', 20);
  S.wb = blankWorkbook().wb; layout(); bindAll(); buildRibbon(); let loaded = false;
  try { const raw = localStorage.getItem(AUTOSAVE_KEY); if (raw) { adopt(validateWorkbook(JSON.parse(raw)), null); autoMsg = 'Arbeitsstand aus Autosave wiederhergestellt'; loaded = true; } } catch (e) { console.warn('Autosave nicht ladbar:', e.message); }
  if (!loaded) adopt(sampleWorkbook(), 'Beispielmappe'); setSaveStatus(); focusGrid();
  window.WebXLS = { S, HIST, commit, undo, redo, setCellInput, recalcAll, validateWorkbook, adopt, projectJSON, buildXlsx, importXlsx, toCSV, parseDelimited, parseFormula, shiftFormula, normalizeFormula, displayFormula, sampleWorkbook, blankWorkbook, fillRange, sortRange, XlErr, cellValue, newSheet, renameSheet, addSheet, selectCell, exportCsv, pasteText, getCell, applyFilter, layout, render };
}
window.addEventListener('DOMContentLoaded', init);
