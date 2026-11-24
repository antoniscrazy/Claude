/* =====================================================================
   1. Datenmodell, Zellbezüge, Formel-Parser und -Auswertung (ohne eval / new Function)
   Formelsyntax (dokumentiert): Zahlen mit Punkt (1.5), Texte in "…", Argumente mit ; oder ,
   Operatoren + - * / ^ & = <> < > <= >= %, Klammern, Bezüge A1 $A$1 $A1 A$1, Bereiche A1:B9, Blattbezüge Blatt1!A1 / 'Mein Blatt'!A1:B2.
   Funktionen deutsch oder englisch (siehe FN-Tabelle). Gespeichert wird die englische Schreibweise, angezeigt die deutsche.
   ===================================================================== */
const ROWS = 5000, COLS = 104;
const colName = c => { let s = ''; c++; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; };
const colIdx = s => { let n = 0; for (const ch of s.toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
const addr = (r, c) => colName(c) + (r + 1);
const key = (r, c) => r + ',' + c;
function parseAddr(s) { const m = /^\$?([A-Za-z]{1,3})\$?(\d{1,7})$/.exec(String(s).trim()); if (!m) return null; const c = colIdx(m[1]), r = +m[2] - 1; return c < COLS && r < ROWS && r >= 0 ? { r, c } : null; }
function parseRange(s) { const p = String(s).trim().split(':'); if (p.length > 2) return null; const a = parseAddr(p[0]), b = parseAddr(p[p.length - 1]); if (!a || !b) return null; return { r1: Math.min(a.r, b.r), c1: Math.min(a.c, b.c), r2: Math.max(a.r, b.r), c2: Math.max(a.c, b.c) }; }
const rangeStr = g => g.r1 === g.r2 && g.c1 === g.c2 ? addr(g.r1, g.c1) : addr(g.r1, g.c1) + ':' + addr(g.r2, g.c2);

class XlErr { constructor(code, msg) { this.code = code; this.msg = msg || ''; } toString() { return this.code; } }
const E = { DIV0: () => new XlErr('#DIV/0!', 'Division durch 0'), VAL: m => new XlErr('#WERT!', m || 'Falscher Datentyp'), REF: m => new XlErr('#BEZUG!', m || 'Ungültiger Bezug'), NAME: m => new XlErr('#NAME?', m || 'Unbekannter Name'), NA: () => new XlErr('#NV', 'Wert nicht gefunden'), NUM: () => new XlErr('#ZAHL!', 'Ungültige Zahl'), CYC: m => new XlErr('#ZIRKEL!', m || 'Zirkelbezug') };

/* ---------- Tokenizer ---------- */
const BOOLS = { TRUE: true, WAHR: true, FALSE: false, FALSCH: false };
function tokenize(src) {
  const T = []; let i = 0; const n = src.length, de = src.includes(';'); // Dezimalkomma nur, wenn ';' als Argumenttrenner genutzt wird
  const cellRe = /^\$?[A-Za-z]{1,3}\$?\d+$/;
  while (i < n) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(src[i + 1] || ''))) { const m = (de ? /^(\d+[.,]?\d*|[.,]\d+)([eE][+-]?\d+)?/ : /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/).exec(src.slice(i)); T.push({ t: 'num', v: parseFloat(m[0].replace(',', '.')) }); i += m[0].length; continue; }
    if (ch === '"') { let s = '', j = i + 1; for (;;) { if (j >= n) throw new Error('Text nicht abgeschlossen'); if (src[j] === '"') { if (src[j + 1] === '"') { s += '"'; j += 2; continue; } break; } s += src[j++]; } T.push({ t: 'str', v: s }); i = j + 1; continue; }
    let sheet = null;
    if (ch === "'") { let s = '', j = i + 1; for (;;) { if (j >= n) throw new Error('Blattname nicht abgeschlossen'); if (src[j] === "'") { if (src[j + 1] === "'") { s += "'"; j += 2; continue; } break; } s += src[j++]; } if (src[j + 1] !== '!') throw new Error('Nach Blattname fehlt "!"'); sheet = s; i = j + 2; }
    else if (/[A-Za-z_$ÄÖÜäöüß]/.test(ch)) {
      const m = /^[A-Za-z0-9_$.ÄÖÜäöüß]+/.exec(src.slice(i)); let id = m[0];
      if (src[i + id.length] === '!') { sheet = id; i += id.length + 1; }
      else {
        if (cellRe.test(id)) { // Zelle oder Bereich
          let j = i + id.length, end = null;
          if (src[j] === ':') { const m2 = /^\$?[A-Za-z]{1,3}\$?\d+/.exec(src.slice(j + 1)); if (m2) { end = m2[0]; j += 1 + end.length; } }
          T.push(end ? { t: 'rng', a: id, b: end, sh: null } : { t: 'ref', a: id, sh: null }); i = j; continue;
        }
        if (src[i + id.length] === '(') { T.push({ t: 'fn', v: id.toUpperCase() }); i += id.length; continue; }
        if (BOOLS.hasOwnProperty(id.toUpperCase())) { T.push({ t: 'bool', v: BOOLS[id.toUpperCase()] }); i += id.length; continue; }
        throw new Error('Unbekannter Name „' + id + '“'); }
    }
    if (sheet !== null) { // Blattbezug: danach Zelle/Bereich
      const m = /^\$?[A-Za-z]{1,3}\$?\d+/.exec(src.slice(i)); if (!m) throw new Error('Nach Blattname fehlt ein Zellbezug'); let j = i + m[0].length, end = null;
      if (src[j] === ':') { const m2 = /^\$?[A-Za-z]{1,3}\$?\d+/.exec(src.slice(j + 1)); if (m2) { end = m2[0]; j += 1 + end.length; } }
      T.push(end ? { t: 'rng', a: m[0], b: end, sh: sheet } : { t: 'ref', a: m[0], sh: sheet }); i = j; continue;
    }
    const two = src.substr(i, 2);
    if (two === '<=' || two === '>=' || two === '<>') { T.push({ t: 'op', v: two }); i += 2; continue; }
    if ('+-*/^&=<>(),;%'.includes(ch)) { T.push({ t: 'op', v: ch }); i++; continue; }
    throw new Error('Unerwartetes Zeichen „' + ch + '“');
  }
  return T;
}
function refNode(a, sh) { const m = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)$/.exec(a); const c = colIdx(m[2]), r = +m[4] - 1; if (c >= COLS || r >= ROWS || r < 0) return { t: 'err', code: '#BEZUG!' }; return { t: 'ref', sh, r, c, ac: !!m[1], ar: !!m[3] }; }
/* ---------- Parser (rekursiver Abstieg) ---------- */
function parseFormula(src) {
  const T = tokenize(src); let p = 0; const peek = () => T[p], isOp = v => T[p] && T[p].t === 'op' && T[p].v === v;
  function expr() { return cmp(); }
  function cmp() { let a = concat(); while (T[p] && T[p].t === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(T[p].v)) { const op = T[p++].v; a = { t: 'bin', op, a, b: concat() }; } return a; }
  function concat() { let a = add(); while (isOp('&')) { p++; a = { t: 'bin', op: '&', a, b: add() }; } return a; }
  function add() { let a = mul(); while (isOp('+') || isOp('-')) { const op = T[p++].v; a = { t: 'bin', op, a, b: mul() }; } return a; }
  function mul() { let a = pow(); while (isOp('*') || isOp('/')) { const op = T[p++].v; a = { t: 'bin', op, a, b: pow() }; } return a; }
  function pow() { let a = unary(); while (isOp('^')) { p++; a = { t: 'bin', op: '^', a, b: unary() }; } return a; }
  function unary() { if (isOp('-') || isOp('+')) { const op = T[p++].v; return { t: 'un', op, a: unary() }; } return post(); }
  function post() { let a = primary(); while (isOp('%')) { p++; a = { t: 'pct', a }; } return a; }
  function primary() {
    const k = T[p++]; if (!k) throw new Error('Formel unvollständig');
    if (k.t === 'num') return { t: 'num', v: k.v }; if (k.t === 'str') return { t: 'str', v: k.v }; if (k.t === 'bool') return { t: 'bool', v: k.v };
    if (k.t === 'ref') return refNode(k.a, k.sh);
    if (k.t === 'rng') { const a = refNode(k.a, k.sh), b = refNode(k.b, k.sh); if (a.t === 'err' || b.t === 'err') return { t: 'err', code: '#BEZUG!' }; return { t: 'rng', sh: k.sh, r1: a.r, c1: a.c, r2: b.r, c2: b.c, ar1: a.ar, ac1: a.ac, ar2: b.ar, ac2: b.ac }; }
    if (k.t === 'fn') {
      if (!isOp('(')) throw new Error('Klammer fehlt'); p++; const args = [];
      if (isOp(')')) { p++; return { t: 'fn', name: k.v, args }; }
      for (;;) { if (isOp(';') || isOp(',') || isOp(')')) args.push({ t: 'empty' }); else args.push(expr()); if (isOp(';') || isOp(',')) { p++; continue; } if (isOp(')')) { p++; break; } throw new Error('Erwartet ; oder )'); }
      return { t: 'fn', name: k.v, args };
    }
    if (k.t === 'op' && k.v === '(') { const e = expr(); if (!isOp(')')) throw new Error('Schließende Klammer fehlt'); p++; return e; }
    throw new Error('Unerwartetes Element „' + (k.v !== undefined ? k.v : k.t) + '“');
  }
  const ast = expr(); if (p < T.length) throw new Error('Unerwartetes Element nach dem Ausdruck'); return ast;
}
const astCache = new Map();
function getAst(f) { let a = astCache.get(f); if (!a) { a = parseFormula(f); if (astCache.size > 20000) astCache.clear(); astCache.set(f, a); } return a; }

/* ---------- Funktionsnamen (EN <-> DE) ---------- */
const FN_DE = { SUM: 'SUMME', AVERAGE: 'MITTELWERT', MIN: 'MIN', MAX: 'MAX', COUNT: 'ANZAHL', COUNTA: 'ANZAHL2', ROUND: 'RUNDEN', IF: 'WENN', AND: 'UND', OR: 'ODER', NOT: 'NICHT', IFERROR: 'WENNFEHLER', SUMIF: 'SUMMEWENN', COUNTIF: 'ZÄHLENWENN', VLOOKUP: 'SVERWEIS', XLOOKUP: 'XVERWEIS',
  ABS: 'ABS', SQRT: 'WURZEL', POWER: 'POTENZ', INT: 'GANZZAHL', MOD: 'REST', CONCATENATE: 'VERKETTEN', LEFT: 'LINKS', RIGHT: 'RECHTS', MID: 'TEIL', LEN: 'LÄNGE', UPPER: 'GROSS', LOWER: 'KLEIN', TODAY: 'HEUTE', NOW: 'JETZT', MEDIAN: 'MEDIAN', ROUNDUP: 'AUFRUNDEN', ROUNDDOWN: 'ABRUNDEN', ISNUMBER: 'ISTZAHL', ISERROR: 'ISTFEHLER', ISBLANK: 'ISTLEER', INDEX: 'INDEX', MATCH: 'VERGLEICH', PRODUCT: 'PRODUKT', TRIM: 'GLÄTTEN', TEXT: 'TEXT' };
const FN_ALIAS = {}; for (const en in FN_DE) { FN_ALIAS[en] = en; FN_ALIAS[FN_DE[en]] = en; } FN_ALIAS.ZAEHLENWENN = 'COUNTIF'; FN_ALIAS.LAENGE = 'LEN'; FN_ALIAS.GLAETTEN = 'TRIM'; FN_ALIAS.MITTELWERT = 'AVERAGE'; FN_ALIAS.AVG = 'AVERAGE';
const quoteSheet = n => /^[A-Za-z_][A-Za-z0-9_]*$/.test(n) ? n : "'" + n.replace(/'/g, "''") + "'";
const numStr = v => { let s = String(v); return s; };
function toStr(n, lang) {
  const sep = lang === 'de' ? ';' : ',';
  switch (n.t) {
    case 'num': return numStr(n.v); case 'str': return '"' + n.v.replace(/"/g, '""') + '"'; case 'bool': return lang === 'de' ? (n.v ? 'WAHR' : 'FALSCH') : (n.v ? 'TRUE' : 'FALSE'); case 'empty': return '';
    case 'err': return n.code;
    case 'ref': return (n.sh != null ? quoteSheet(n.sh) + '!' : '') + (n.ac ? '$' : '') + colName(n.c) + (n.ar ? '$' : '') + (n.r + 1);
    case 'rng': return (n.sh != null ? quoteSheet(n.sh) + '!' : '') + (n.ac1 ? '$' : '') + colName(n.c1) + (n.ar1 ? '$' : '') + (n.r1 + 1) + ':' + (n.ac2 ? '$' : '') + colName(n.c2) + (n.ar2 ? '$' : '') + (n.r2 + 1);
    case 'un': return n.op + toStr(n.a, lang); case 'pct': return paren(n.a, lang) + '%';
    case 'bin': return paren(n.a, lang, n) + n.op + paren(n.b, lang, n, true);
    case 'fn': return (lang === 'de' ? FN_DE[n.name] || n.name : n.name) + '(' + n.args.map(a => toStr(a, lang)).join(sep) + ')';
  } return '';
}
const PREC = { '=': 1, '<>': 1, '<': 1, '>': 1, '<=': 1, '>=': 1, '&': 2, '+': 3, '-': 3, '*': 4, '/': 4, '^': 5 };
function paren(n, lang, parent, right) { const s = toStr(n, lang); if (n.t === 'bin' && parent && (PREC[n.op] < PREC[parent.op] || (right && PREC[n.op] === PREC[parent.op]))) return '(' + s + ')'; if ((n.t === 'un' || n.t === 'bin') && !parent) return '(' + s + ')'; if (n.t === 'un' && parent) return '(' + s + ')'; return s; }
/** Formeltext des Anwenders (de/en) -> kanonische englische Schreibweise */
function normalizeFormula(text) { const ast = parseFormula(text); const fix = n => { if (n.t === 'fn') { const en = FN_ALIAS[n.name] || (FN_ALIAS[n.name.replace('Ä', 'AE')]); if (!en) throw new Error('Unbekannte Funktion „' + n.name + '“'); n.name = en; n.args.forEach(fix); } else if (n.t === 'bin') { fix(n.a); fix(n.b); } else if (n.t === 'un' || n.t === 'pct') fix(n.a); }; fix(ast); return toStr(ast, 'en'); }
function displayFormula(f) { try { return toStr(getAst(f), 'de'); } catch (e) { return f; } }
function mapRefs(f, fn) { const ast = JSON.parse(JSON.stringify(getAst(f))); const walk = n => { if (n.t === 'ref' || n.t === 'rng') fn(n); else if (n.t === 'bin') { walk(n.a); walk(n.b); } else if (n.t === 'un' || n.t === 'pct') walk(n.a); else if (n.t === 'fn') n.args.forEach(walk); }; walk(ast); return toStr(ast, 'en'); }
/** relative Bezüge verschieben (Kopieren, Ausfüllen, Sortieren) */
function shiftFormula(f, dr, dc) {
  const ast = JSON.parse(JSON.stringify(getAst(f))); let bad = false;
  const walk = n => {
    if (n.t === 'ref') { if (!n.ar) n.r += dr; if (!n.ac) n.c += dc; if (n.r < 0 || n.c < 0 || n.r >= ROWS || n.c >= COLS) { n.t = 'err'; n.code = '#BEZUG!'; } }
    else if (n.t === 'rng') { if (!n.ar1) n.r1 += dr; if (!n.ar2) n.r2 += dr; if (!n.ac1) n.c1 += dc; if (!n.ac2) n.c2 += dc; if (n.r1 < 0 || n.c1 < 0 || n.r2 >= ROWS || n.c2 >= COLS || n.r2 < 0 || n.c2 < 0) { n.t = 'err'; n.code = '#BEZUG!'; } }
    else if (n.t === 'bin') { walk(n.a); walk(n.b); } else if (n.t === 'un' || n.t === 'pct') walk(n.a); else if (n.t === 'fn') n.args.forEach(walk);
  };
  walk(ast); return toStr(ast, 'en');
}
function renameSheetRefs(wb, oldName, newName) {
  wb.sheets.forEach(sh => { for (const k in sh.cells) { const c = sh.cells[k]; if (c.f === undefined) continue; try { c.f = mapRefs(c.f, n => { if (n.sh != null && n.sh.toLowerCase() === oldName.toLowerCase()) n.sh = newName; }); } catch (e) { } } });
  wb.sheets.forEach(sh => (sh.charts || []).forEach(ch => { /* Diagramme referenzieren Blatt-IDs */ }));
}

/* ---------- Auswertung ---------- */
const calc = { pass: 0, state: new WeakMap(), stack: [] };
const findSheet = (wb, name) => wb.sheets.find(s => s.name.toLowerCase() === String(name).toLowerCase());
function cellValue(wb, sh, r, c) {
  const cell = sh.cells[key(r, c)]; if (!cell) return null;
  if (cell.f !== undefined) evalCell(wb, sh, r, c, cell);
  if (cell.v instanceof XlErr) throw cell.v; return cell.v === undefined ? null : cell.v;
}
function evalCell(wb, sh, r, c, cell) {
  const st = calc.state.get(cell);
  if (st && st.pass === calc.pass) { if (st.busy) { const path = calc.stack.slice(calc.stack.indexOf(sh.name + '!' + addr(r, c))).concat(sh.name + '!' + addr(r, c)).map(x => x.replace(/^[^!]*!/, '')).join(' → '); throw E.CYC('Zirkelbezug: ' + path); } return; }
  const me = { pass: calc.pass, busy: true }; calc.state.set(cell, me); calc.stack.push(sh.name + '!' + addr(r, c));
  try { const v = evalNode(getAst(cell.f), { wb, sh }); cell.v = (v && v.rng) ? (() => { throw E.VAL('Bereich statt Einzelwert'); })() : (v === null ? 0 : v); }
  catch (e) { if (e instanceof XlErr) cell.v = e; else { cell.v = new XlErr('#WERT!', e.message); } }
  finally { calc.stack.pop(); me.busy = false; }
}
function recalcAll(wb) { calc.pass++; calc.stack = []; wb.sheets.forEach(sh => { for (const k in sh.cells) { const c = sh.cells[k]; if (c.f !== undefined) { const [r, cc] = k.split(',').map(Number); evalCell(wb, sh, r, cc, c); } } }); }
const num = v => { if (v instanceof XlErr) throw v; if (v === null || v === undefined || v === '') return 0; if (typeof v === 'number') return v; if (typeof v === 'boolean') return v ? 1 : 0; const x = parseNumberText(String(v)); if (x === null) throw E.VAL('Text kann nicht in eine Zahl umgewandelt werden: „' + v + '“'); return x; };
const txt = v => v === null || v === undefined ? '' : typeof v === 'boolean' ? (v ? 'WAHR' : 'FALSCH') : typeof v === 'number' ? fmtGeneral(v) : String(v);
const truthy = v => { if (typeof v === 'string') { const u = v.toUpperCase(); if (u === 'WAHR' || u === 'TRUE') return true; if (u === 'FALSCH' || u === 'FALSE') return false; throw E.VAL(); } return !!num(v); };
function parseNumberText(s) {
  s = s.trim(); if (s === '') return null;
  if (/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(s)) return parseFloat(s);
  if (/^[+-]?\d+,\d+$/.test(s)) return parseFloat(s.replace(',', '.'));
  if (/^[+-]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) return parseFloat(s.replace(/,/g, ''));
  return null;
}
function getRange(n, ctx) { // -> {sh, r1,c1,r2,c2}
  const sh = n.sh != null ? findSheet(ctx.wb, n.sh) : ctx.sh; if (!sh) throw E.REF('Blatt „' + n.sh + '“ existiert nicht');
  return { rng: true, sh, r1: Math.min(n.r1, n.r2), c1: Math.min(n.c1, n.c2), r2: Math.max(n.r1, n.r2), c2: Math.max(n.c1, n.c2), wb: ctx.wb };
}
function rangeCells(g, fn) { for (let r = g.r1; r <= g.r2; r++) for (let c = g.c1; c <= g.c2; c++) fn(cellValueSafe(g, r, c), r, c); }
function cellValueSafe(g, r, c) { const cell = g.sh.cells[key(r, c)]; if (!cell) return null; if (cell.f !== undefined) evalCell(g.wb, g.sh, r, c, cell); return cell.v === undefined ? null : cell.v; }
function evalNode(n, ctx) {
  switch (n.t) {
    case 'num': case 'str': case 'bool': return n.v;
    case 'empty': return null;
    case 'err': throw new XlErr(n.code);
    case 'ref': { const sh = n.sh != null ? findSheet(ctx.wb, n.sh) : ctx.sh; if (!sh) throw E.REF('Blatt „' + n.sh + '“ existiert nicht'); return cellValue(ctx.wb, sh, n.r, n.c); }
    case 'rng': return getRange(n, ctx);
    case 'un': { const v = evalScalar(n.a, ctx); return n.op === '-' ? -num(v) : num(v); }
    case 'pct': return num(evalScalar(n.a, ctx)) / 100;
    case 'bin': {
      const a = evalScalar(n.a, ctx), b = evalScalar(n.b, ctx);
      switch (n.op) {
        case '+': return num(a) + num(b); case '-': return num(a) - num(b); case '*': return num(a) * num(b);
        case '/': { const d = num(b); if (d === 0) throw E.DIV0(); return num(a) / d; }
        case '^': { const x = Math.pow(num(a), num(b)); if (!isFinite(x)) throw E.NUM(); return x; }
        case '&': return txt(a) + txt(b);
        default: return compare(a, b, n.op);
      }
    }
    case 'fn': { const f = FN[n.name]; if (!f) throw E.NAME('Unbekannte Funktion ' + n.name); if (n.args.length < f.min || n.args.length > f.max) throw E.VAL('Falsche Argumentanzahl bei ' + (FN_DE[n.name] || n.name)); return f.lazy ? f.f(n.args, ctx) : f.f(n.args.map(a => evalNode(a, ctx)), ctx); }
  }
  throw E.VAL();
}
function evalScalar(n, ctx) { const v = evalNode(n, ctx); if (v && v.rng) { if (v.r1 === v.r2 && v.c1 === v.c2) return cellValueSafe(v, v.r1, v.c1); throw E.VAL('Bereich in Einzelwert-Kontext'); } return v; }
function cmpVals(a, b) { // Excel-Reihenfolge: Zahl < Text < Wahrheitswert; leer wie 0/""
  const rank = v => v === null ? 0 : typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : 2;
  if (a === null) a = typeof b === 'string' ? '' : typeof b === 'boolean' ? false : 0; if (b === null) b = typeof a === 'string' ? '' : typeof a === 'boolean' ? false : 0;
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  if (typeof a === 'string') return a.toLowerCase().localeCompare(b.toLowerCase(), 'de'); return (a > b) - (a < b);
}
function compare(a, b, op) { const c = cmpVals(a, b); switch (op) { case '=': return c === 0; case '<>': return c !== 0; case '<': return c < 0; case '>': return c > 0; case '<=': return c <= 0; case '>=': return c >= 0; } }
function flatNums(args, strict) { // Zahlen aus Argumenten (Bereiche ignorieren Text)
  const out = [];
  for (const a of args) { if (a && a.rng) rangeCells(a, v => { if (v instanceof XlErr) throw v; if (typeof v === 'number') out.push(v); }); else { if (a instanceof XlErr) throw a; if (a === null) continue; out.push(num(a)); } }
  return out;
}
function mkCrit(c) {
  if (c instanceof XlErr) throw c; if (typeof c === 'number') return v => typeof v === 'number' && v === c; if (typeof c === 'boolean') return v => v === c;
  const m = /^(<=|>=|<>|<|>|=)?([\s\S]*)$/.exec(String(c === null ? '' : c)); const op = m[1] || '=', rhs = m[2], n = parseNumberText(rhs);
  if (n !== null && rhs.trim() !== '') return v => { const x = typeof v === 'number' ? v : (typeof v === 'string' ? parseNumberText(v) : null); if (x === null) return op === '<>'; return compare(x, n, op); };
  const hasWild = /[*?]/.test(rhs), re = hasWild ? new RegExp('^' + rhs.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i') : null;
  return v => { const s = v === null ? '' : String(v); const eq = re ? re.test(s) : s.toLowerCase() === rhs.toLowerCase(); if (op === '=') return eq; if (op === '<>') return !eq; if (v === null) return false; return compare(s, rhs, op); };
}
const rd = (x, d) => { const f = Math.pow(10, d); return Math.round((x + Math.sign(x) * 1e-12) * f) / f; };
const FN = {
  SUM: { min: 1, max: 255, f: a => flatNums(a).reduce((x, y) => x + y, 0) },
  AVERAGE: { min: 1, max: 255, f: a => { const n = flatNums(a); if (!n.length) throw E.DIV0(); return n.reduce((x, y) => x + y, 0) / n.length; } },
  MIN: { min: 1, max: 255, f: a => { const n = flatNums(a); return n.length ? Math.min(...n) : 0; } }, MAX: { min: 1, max: 255, f: a => { const n = flatNums(a); return n.length ? Math.max(...n) : 0; } },
  PRODUCT: { min: 1, max: 255, f: a => flatNums(a).reduce((x, y) => x * y, 1) },
  MEDIAN: { min: 1, max: 255, f: a => { const n = flatNums(a).sort((x, y) => x - y); if (!n.length) throw E.NUM(); const m = n.length >> 1; return n.length % 2 ? n[m] : (n[m - 1] + n[m]) / 2; } },
  COUNT: { min: 1, max: 255, f: a => { let k = 0; a.forEach(x => { if (x && x.rng) rangeCells(x, v => { if (typeof v === 'number') k++; }); else if (typeof x === 'number' || (typeof x === 'string' && parseNumberText(x) !== null)) k++; }); return k; } },
  COUNTA: { min: 1, max: 255, f: a => { let k = 0; a.forEach(x => { if (x && x.rng) rangeCells(x, v => { if (v !== null && v !== '') k++; }); else if (x !== null) k++; }); return k; } },
  ROUND: { min: 2, max: 2, f: a => rd(num(a[0]), num(a[1])) }, ROUNDUP: { min: 2, max: 2, f: a => { const f = Math.pow(10, num(a[1])), x = num(a[0]); return Math.sign(x) * Math.ceil(Math.abs(x) * f - 1e-12) / f; } }, ROUNDDOWN: { min: 2, max: 2, f: a => { const f = Math.pow(10, num(a[1])), x = num(a[0]); return Math.sign(x) * Math.floor(Math.abs(x) * f + 1e-12) / f; } },
  ABS: { min: 1, max: 1, f: a => Math.abs(num(a[0])) }, SQRT: { min: 1, max: 1, f: a => { const x = num(a[0]); if (x < 0) throw E.NUM(); return Math.sqrt(x); } }, POWER: { min: 2, max: 2, f: a => Math.pow(num(a[0]), num(a[1])) }, INT: { min: 1, max: 1, f: a => Math.floor(num(a[0])) },
  MOD: { min: 2, max: 2, f: a => { const d = num(a[1]); if (d === 0) throw E.DIV0(); const x = num(a[0]); return x - d * Math.floor(x / d); } },
  IF: { min: 2, max: 3, lazy: true, f: (a, ctx) => { const c = evalScalar(a[0], ctx); if (truthy(c)) return evalScalar(a[1], ctx); return a.length > 2 ? evalScalar(a[2], ctx) : false; } },
  IFERROR: { min: 2, max: 2, lazy: true, f: (a, ctx) => { try { const v = evalScalar(a[0], ctx); return v; } catch (e) { if (e instanceof XlErr) return evalScalar(a[1], ctx); throw e; } } },
  AND: { min: 1, max: 255, f: a => { let r = true; a.forEach(x => { if (x && x.rng) rangeCells(x, v => { if (v !== null && v !== '') r = r && truthy(v); }); else r = r && truthy(x); }); return r; } },
  OR: { min: 1, max: 255, f: a => { let r = false; a.forEach(x => { if (x && x.rng) rangeCells(x, v => { if (v !== null && v !== '') r = r || truthy(v); }); else r = r || truthy(x); }); return r; } },
  NOT: { min: 1, max: 1, f: a => !truthy(a[0]) },
  SUMIF: { min: 2, max: 3, f: a => { const g = a[0]; if (!g.rng) throw E.VAL(); const crit = mkCrit(a[1] && a[1].rng ? cellValueSafe(a[1], a[1].r1, a[1].c1) : a[1]), sg = a[2] || g; let s = 0; for (let r = g.r1; r <= g.r2; r++) for (let c = g.c1; c <= g.c2; c++) { const v = cellValueSafe(g, r, c); if (v instanceof XlErr) throw v; if (crit(v)) { const t = sg.rng ? cellValueSafe(sg, sg.r1 + r - g.r1, sg.c1 + c - g.c1) : sg; if (t instanceof XlErr) throw t; if (typeof t === 'number') s += t; } } return s; } },
  COUNTIF: { min: 2, max: 2, f: a => { const g = a[0]; if (!g.rng) throw E.VAL(); const crit = mkCrit(a[1] && a[1].rng ? cellValueSafe(a[1], a[1].r1, a[1].c1) : a[1]); let k = 0; rangeCells(g, v => { if (v instanceof XlErr) throw v; if (crit(v)) k++; }); return k; } },
  VLOOKUP: { min: 3, max: 4, f: a => { // Umfang: exakte Suche (4. Argument FALSCH/0) oder Näherung in aufsteigend sortierter erster Spalte
    const key = a[0] && a[0].rng ? cellValueSafe(a[0], a[0].r1, a[0].c1) : a[0], g = a[1]; if (!g.rng) throw E.VAL(); const ci = num(a[2]) - 1; if (ci < 0 || g.c1 + ci > g.c2) throw E.REF('Spaltenindex außerhalb der Matrix');
    const approx = a.length < 4 || a[3] === null ? true : truthy(a[3]); let hit = -1;
    for (let r = g.r1; r <= g.r2; r++) { const v = cellValueSafe(g, r, g.c1); if (v instanceof XlErr) continue; if (approx) { if (v !== null && cmpVals(v, key) <= 0) hit = r; else if (v !== null && cmpVals(v, key) > 0) break; } else if (v !== null && cmpVals(v, key) === 0) { hit = r; break; } }
    if (hit < 0) throw E.NA(); const out = cellValueSafe(g, hit, g.c1 + ci); if (out instanceof XlErr) throw out; return out; } },
  XLOOKUP: { min: 3, max: 4, f: a => { // Umfang: exakte Suche in einer Zeile/Spalte, Rückgabe aus gleich langem Bereich, optional Wenn-nicht-gefunden
    const key = a[0] && a[0].rng ? cellValueSafe(a[0], a[0].r1, a[0].c1) : a[0], L = a[1], R = a[2]; if (!L.rng || !R.rng) throw E.VAL(); const n = Math.max(L.r2 - L.r1, L.c2 - L.c1) + 1, vert = L.c1 === L.c2;
    for (let i = 0; i < n; i++) { const v = vert ? cellValueSafe(L, L.r1 + i, L.c1) : cellValueSafe(L, L.r1, L.c1 + i); if (v !== null && !(v instanceof XlErr) && cmpVals(v, key) === 0) { const out = vert ? cellValueSafe(R, R.r1 + i, R.c1) : cellValueSafe(R, R.r1, R.c1 + i); if (out instanceof XlErr) throw out; return out; } }
    if (a.length > 3 && a[3] !== null) return a[3]; throw E.NA(); } },
  INDEX: { min: 2, max: 3, f: a => { const g = a[0]; if (!g.rng) throw E.VAL(); const r = num(a[1]) - 1, c = a.length > 2 ? num(a[2]) - 1 : 0; if (r < 0 || c < 0 || g.r1 + r > g.r2 || g.c1 + c > g.c2) throw E.REF(); const v = cellValueSafe(g, g.r1 + r, g.c1 + c); if (v instanceof XlErr) throw v; return v; } },
  MATCH: { min: 2, max: 3, f: a => { const key = a[0] && a[0].rng ? cellValueSafe(a[0], a[0].r1, a[0].c1) : a[0], g = a[1]; if (!g.rng) throw E.VAL(); const t = a.length > 2 ? num(a[2]) : 1, vals = []; rangeCells(g, v => vals.push(v)); let hit = -1; for (let i = 0; i < vals.length; i++) { const v = vals[i]; if (v === null || v instanceof XlErr) continue; const c = cmpVals(v, key); if (t === 0) { if (c === 0) { hit = i; break; } } else if (c <= 0) hit = i; else break; } if (hit < 0) throw E.NA(); return hit + 1; } },
  CONCATENATE: { min: 1, max: 255, f: a => a.map(x => x && x.rng ? (() => { let s = ''; rangeCells(x, v => { s += txt(v); }); return s; })() : txt(x)).join('') },
  LEFT: { min: 1, max: 2, f: a => txt(a[0]).slice(0, a.length > 1 ? num(a[1]) : 1) }, RIGHT: { min: 1, max: 2, f: a => { const s = txt(a[0]), n = a.length > 1 ? num(a[1]) : 1; return n <= 0 ? '' : s.slice(-n); } }, MID: { min: 3, max: 3, f: a => txt(a[0]).substr(num(a[1]) - 1, num(a[2])) },
  LEN: { min: 1, max: 1, f: a => txt(a[0]).length }, UPPER: { min: 1, max: 1, f: a => txt(a[0]).toUpperCase() }, LOWER: { min: 1, max: 1, f: a => txt(a[0]).toLowerCase() }, TRIM: { min: 1, max: 1, f: a => txt(a[0]).trim().replace(/\s+/g, ' ') },
  TEXT: { min: 2, max: 2, f: a => { const f = txt(a[1]), x = num(a[0]); const dp = (/0[.,](0+)/.exec(f) || [0, ''])[1].length; if (/%/.test(f)) return fmtNumber(x * 100, dp) + '%'; if (/[dyDYmM]{2}/.test(f)) return fmtDate(x); return fmtNumber(x, dp); } },
  TODAY: { min: 0, max: 0, f: () => Math.floor(Date.now() / 86400000) + 25569 }, NOW: { min: 0, max: 0, f: () => Date.now() / 86400000 + 25569 },
  ISNUMBER: { min: 1, max: 1, f: a => typeof (a[0] && a[0].rng ? cellValueSafe(a[0], a[0].r1, a[0].c1) : a[0]) === 'number' }, ISBLANK: { min: 1, max: 1, f: a => (a[0] && a[0].rng ? cellValueSafe(a[0], a[0].r1, a[0].c1) : a[0]) === null },
  ISERROR: { min: 1, max: 1, lazy: true, f: (a, ctx) => { try { evalScalar(a[0], ctx); return false; } catch (e) { if (e instanceof XlErr) return true; throw e; } } }
};

/* ---------- Anzeigeformate ---------- */
function fmtGeneral(v) { if (!isFinite(v)) return '#ZAHL!'; if (Number.isInteger(v) && Math.abs(v) < 1e15) return String(v); let s = String(+v.toPrecision(10)); if (/e/.test(s)) return s.replace('.', ',').replace('e+', 'E+'); return s.replace('.', ','); }
const fmtNumber = (v, dp) => v.toLocaleString('de-DE', { minimumFractionDigits: dp, maximumFractionDigits: dp });
function fmtDate(serial) { const d = new Date(Math.round((serial - 25569) * 86400000)); if (isNaN(d)) return '#ZAHL!'; return String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0') + '.' + d.getUTCFullYear(); }
function dateToSerial(d, m, y) { return Math.round(Date.UTC(y, m - 1, d) / 86400000) + 25569; }
function formatValue(v, st) {
  if (v === null || v === undefined) return ''; if (v instanceof XlErr) return v.code; if (typeof v === 'boolean') return v ? 'WAHR' : 'FALSCH'; if (typeof v === 'string') return v;
  const nf = st && st.nf || 'g', dp = st && st.dp != null ? st.dp : (nf === 'c' ? 2 : nf === 'p' ? 0 : 2);
  switch (nf) { case 'n': return fmtNumber(v, dp); case 'p': return fmtNumber(v * 100, dp) + ' %'; case 'c': return fmtNumber(v, dp) + ' €'; case 'd': return fmtDate(v); default: return fmtGeneral(v); }
}
/** Eingabe -> Zellinhalt {v, f?, nf?} */
function parseInput(text) {
  if (text === '' || text == null) return null; if (text[0] === "'") return { v: text.slice(1) };
  if (text[0] === '=' && text.length > 1) { try { return { f: normalizeFormula(text.slice(1)), v: 0 }; } catch (e) { const er = new Error(e.message); er.formula = true; throw er; } }
  const t = text.trim(); if (/^(wahr|true)$/i.test(t)) return { v: true }; if (/^(falsch|false)$/i.test(t)) return { v: false };
  let m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(t); if (m && +m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31) return { v: dateToSerial(+m[1], +m[2], +m[3]), nf: 'd' };
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t); if (m) return { v: dateToSerial(+m[3], +m[2], +m[1]), nf: 'd' };
  m = /^([+-]?[\d.,]+)\s*%$/.exec(t); if (m) { const x = parseNumberText(m[1]); if (x !== null) return { v: x / 100, nf: 'p', dp: (/[.,](\d+)/.exec(m[1]) || [0, ''])[1].length }; }
  m = /^([+-]?[\d.,]+)\s*(€|EUR)$/.exec(t); if (m) { const x = parseNumberText(m[1]); if (x !== null) return { v: x, nf: 'c' }; }
  const x = parseNumberText(t); if (x !== null) return { v: x };
  return { v: text };
}
