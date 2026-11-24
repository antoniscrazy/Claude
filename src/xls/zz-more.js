/* =====================================================================
   Excel-Erweiterungen: weitere Funktionen, Zeilen/Spalten einfügen/löschen, bedingte Formatierung,
   Datenwerkzeuge, Reiter „Formeln“ und „Überprüfen“.
   ===================================================================== */
Object.assign(IC, {
  insrow: '<path d="M3 5h18v6H3zM3 16h8M17 14v6M14 17h6"/>', delrow: '<path d="M3 5h18v6H3zM3 17h18M9 14l6 6M15 14l-6 6"/>',
  inscol: '<path d="M4 3h6v18H4zM15 8v8M11 12h8"/>', delcol: '<path d="M4 3h6v18H4zM14 9l6 6M20 9l-6 6"/>',
  cellfmt: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 10h16M10 10v10"/>', cf: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14h18M9 4v16M15 4v16"/><path d="M4 10h4v3H4zM16 15h4v4h-4z" fill="currentColor"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M8 16h2M12 16h2"/>', lib: '<path d="M4 5h4v14H4zM10 5h4v14h-4zM16 6l4 1-3 13-4-1z"/>',
  stat: '<path d="M5 20V10M11 20V4M17 20v-7M3 20h18"/>', dedupe: '<rect x="4" y="4" width="10" height="10" rx="1"/><rect x="10" y="10" width="10" height="10" rx="1"/>',
  textcols: '<path d="M3 5h18M3 19h18M12 5v14M6 10h3M15 10h3M6 14h3M15 14h3"/>', clean: '<path d="M4 20l8-8M13 5l6 6-4 4-6-6zM15 3l6 6"/>',
  filldown: '<path d="M12 4v13M6 12l6 6 6-6M5 21h14"/>', fillright: '<path d="M4 12h13M12 6l6 6-6 6M21 5v14"/>', sigma: '<path d="M18 5H6l7 7-7 7h12"/>',
  hiderow: '<path d="M3 12s3.500-6 9-6 9 6 9 6-3.500 6-9 6-9-6-9-6z"/><path d="M4 20L20 4"/>', sizeup: '<path d="M3 19l5-13 5 13M5 14h6M17 8v6M14 11h6"/>', sizedown: '<path d="M3 19l5-13 5 13M5 14h6M14 11h6"/>',
  recalc: '<path d="M20 12a8 8 0 10-3 6.200M20 5v7h-7"/>', showf: '<path d="M5 6h8M9 6v12M7 12h5M16 10l4 4M20 10l-4 4"/>', transp: '<path d="M4 4h10v10H4zM14 14h6v6h-6zM8 17l3 3M4 17l4 3"/>',
  clearfmt: '<path d="M5 5h14M12 5v6M8 19l8-8M4 20h6"/>', tabcell: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18"/>', zoomxl: '<circle cx="10" cy="10" r="6"/><path d="M15 15l6 6M7 10h6M10 7v6"/>'
});

/* ---------- Weitere Funktionen ---------- */
(() => {
  const D2 = { SUMIFS: 'SUMMEWENNS', COUNTIFS: 'ZÄHLENWENNS', AVERAGEIF: 'MITTELWERTWENN', AVERAGEIFS: 'MITTELWERTWENNS', MAXIFS: 'MAXWENNS', MINIFS: 'MINWENNS', SUMPRODUCT: 'SUMMENPRODUKT', SUMSQ: 'QUADRATESUMME', TRUNC: 'KÜRZEN', SIGN: 'VORZEICHEN', EXP: 'EXP', LN: 'LN', LOG: 'LOG', LOG10: 'LOG10', PI: 'PI', SIN: 'SIN', COS: 'COS', TAN: 'TAN', ASIN: 'ARCSIN', ACOS: 'ARCCOS', ATAN: 'ARCTAN', ATAN2: 'ARCTAN2', RADIANS: 'BOGENMASS', DEGREES: 'GRAD', FACT: 'FAKULTÄT', COMBIN: 'KOMBINATIONEN', GCD: 'GGT', LCM: 'KGV', RAND: 'ZUFALLSZAHL', RANDBETWEEN: 'ZUFALLSBEREICH', ISEVEN: 'ISTGERADE', ISODD: 'ISTUNGERADE', CEILING: 'OBERGRENZE', FLOOR: 'UNTERGRENZE', MROUND: 'VRUNDEN', LARGE: 'KGRÖSSTE', SMALL: 'KKLEINSTE', RANK: 'RANG', STDEV: 'STABW', STDEVP: 'STABWN', VAR: 'VARIANZ', VARP: 'VARIANZEN', COUNTBLANK: 'ANZAHLLEEREZELLEN', CHOOSE: 'WAHL', XOR: 'XODER', IFNA: 'WENNNV', ISNA: 'ISTNV', NA: 'NV', IFS: 'WENNS', SWITCH: 'ERSTERWERT', PROPER: 'GROSS2', SUBSTITUTE: 'WECHSELN', REPLACE: 'ERSETZEN', FIND: 'FINDEN', SEARCH: 'SUCHEN', REPT: 'WIEDERHOLEN', EXACT: 'IDENTISCH', VALUE: 'WERT', CONCAT: 'TEXTKETTE', TEXTJOIN: 'TEXTVERKETTEN', ISTEXT: 'ISTTEXT', ISLOGICAL: 'ISTLOGIK', ISNONTEXT: 'ISTKEINTEXT', CHAR: 'ZEICHEN', CODE: 'CODE', N: 'N', DATE: 'DATUM', YEAR: 'JAHR', MONTH: 'MONAT', DAY: 'TAG', WEEKDAY: 'WOCHENTAG', DAYS: 'TAGE', EDATE: 'EDATUM', EOMONTH: 'MONATSENDE', HOUR: 'STUNDE', MINUTE: 'MINUTE', SECOND: 'SEKUNDE', WEEKNUM: 'KALENDERWOCHE', ISOWEEKNUM: 'ISOKALENDERWOCHE', NETWORKDAYS: 'NETTOARBEITSTAGE', DATEDIF: 'DATEDIF', ROW: 'ZEILE', COLUMN: 'SPALTE', ROWS: 'ZEILEN', COLUMNS: 'SPALTEN', PMT: 'RMZ', FV: 'ZW', PV: 'BW', NPER: 'ZZR', NPV: 'NBW' };
  for (const en in D2) { FN_DE[en] = D2[en]; FN_ALIAS[en] = en; FN_ALIAS[D2[en]] = en; FN_ALIAS[D2[en].replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE')] = en; }
  const critArg = x => x && x.rng ? cellValueSafe(x, x.r1, x.c1) : x;
  const dims = g => [g.r2 - g.r1, g.c2 - g.c1];
  const multi = (base, pairs, fn) => {
    if (!base || !base.rng) throw E.VAL(); const [h, w] = dims(base);
    for (const [g] of pairs) { if (!g || !g.rng || dims(g)[0] !== h || dims(g)[1] !== w) throw E.VAL('Bereiche haben unterschiedliche Größe'); }
    for (let r = 0; r <= h; r++) for (let c = 0; c <= w; c++) {
      let ok = true; for (const [g, crit] of pairs) { const v = cellValueSafe(g, g.r1 + r, g.c1 + c); if (v instanceof XlErr) throw v; if (!crit(v)) { ok = false; break; } }
      if (ok) { const v = cellValueSafe(base, base.r1 + r, base.c1 + c); if (v instanceof XlErr) throw v; fn(v); }
    }
  };
  const pairs = (a, from) => { const p = []; for (let i = from; i + 1 < a.length; i += 2) p.push([a[i], mkCrit(critArg(a[i + 1]))]); return p; };
  const nums = a => flatNums(a), one = x => x && x.rng ? cellValueSafe(x, x.r1, x.c1) : x;
  const S1 = (name, f) => ({ min: 1, max: 1, f: a => f(num(a[0])) });
  const serial = v => Math.floor(num(v));
  const dt = v => new Date((serial(v) - 25569) * 86400000);
  const ser = (y, m, d) => Math.round(Date.UTC(y, m, d) / 86400000) + 25569;
  const eom = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const wd = v => dt(v).getUTCDay();
  const isoWeek = v => { const d = dt(v), t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); const dn = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - dn); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y0) / 86400000 + 1) / 7); };
  const fin = { pmt: (r, n, pv, fv, t) => r === 0 ? -(pv + fv) / n : -(r * (pv * Math.pow(1 + r, n) + fv)) / ((1 + r * t) * (Math.pow(1 + r, n) - 1)) };
  const stdev = (a, pop) => { const n = nums(a); const k = n.length - (pop ? 0 : 1); if (k <= 0) throw E.DIV0(); const m = n.reduce((x, y) => x + y, 0) / n.length; return n.reduce((s, x) => s + (x - m) * (x - m), 0) / k; };
  const gcd = (x, y) => { x = Math.abs(x); y = Math.abs(y); while (y) [x, y] = [y, x % y]; return x; };
  Object.assign(FN, {
    SUMIFS: { min: 3, max: 255, f: a => { let s = 0; multi(a[0], pairs(a, 1), v => { if (typeof v === 'number') s += v; }); return s; } },
    COUNTIFS: { min: 2, max: 255, f: a => { let k = 0; multi(a[0], pairs(a, 0), () => k++); return k; } },
    AVERAGEIF: { min: 2, max: 3, f: a => { let s = 0, k = 0; multi(a[2] || a[0], [[a[0], mkCrit(critArg(a[1]))]], v => { if (typeof v === 'number') { s += v; k++; } }); if (!k) throw E.DIV0(); return s / k; } },
    AVERAGEIFS: { min: 3, max: 255, f: a => { let s = 0, k = 0; multi(a[0], pairs(a, 1), v => { if (typeof v === 'number') { s += v; k++; } }); if (!k) throw E.DIV0(); return s / k; } },
    MAXIFS: { min: 3, max: 255, f: a => { let m = null; multi(a[0], pairs(a, 1), v => { if (typeof v === 'number' && (m === null || v > m)) m = v; }); return m === null ? 0 : m; } },
    MINIFS: { min: 3, max: 255, f: a => { let m = null; multi(a[0], pairs(a, 1), v => { if (typeof v === 'number' && (m === null || v < m)) m = v; }); return m === null ? 0 : m; } },
    SUMPRODUCT: { min: 1, max: 30, f: a => { const g = a.map(x => { if (!x.rng) throw E.VAL(); return x; }); const [h, w] = dims(g[0]); g.forEach(x => { if (dims(x)[0] !== h || dims(x)[1] !== w) throw E.VAL(); }); let s = 0; for (let r = 0; r <= h; r++) for (let c = 0; c <= w; c++) { let p = 1; for (const x of g) { const v = cellValueSafe(x, x.r1 + r, x.c1 + c); if (v instanceof XlErr) throw v; p *= typeof v === 'number' ? v : 0; } s += p; } return s; } },
    SUMSQ: { min: 1, max: 255, f: a => nums(a).reduce((s, x) => s + x * x, 0) },
    TRUNC: { min: 1, max: 2, f: a => { const f = Math.pow(10, a.length > 1 ? num(a[1]) : 0), x = num(a[0]); return Math.trunc(x * f) / f; } },
    SIGN: S1('SIGN', Math.sign), EXP: S1('EXP', Math.exp), PI: { min: 0, max: 0, f: () => Math.PI },
    LN: S1('LN', x => { if (x <= 0) throw E.NUM(); return Math.log(x); }), LOG10: S1('LOG10', x => { if (x <= 0) throw E.NUM(); return Math.log10(x); }),
    LOG: { min: 1, max: 2, f: a => { const x = num(a[0]), b = a.length > 1 ? num(a[1]) : 10; if (x <= 0 || b <= 0 || b === 1) throw E.NUM(); return Math.log(x) / Math.log(b); } },
    SIN: S1('SIN', Math.sin), COS: S1('COS', Math.cos), TAN: S1('TAN', Math.tan), ASIN: S1('ASIN', x => { if (Math.abs(x) > 1) throw E.NUM(); return Math.asin(x); }), ACOS: S1('ACOS', x => { if (Math.abs(x) > 1) throw E.NUM(); return Math.acos(x); }), ATAN: S1('ATAN', Math.atan),
    ATAN2: { min: 2, max: 2, f: a => Math.atan2(num(a[1]), num(a[0])) }, RADIANS: S1('RADIANS', x => x * Math.PI / 180), DEGREES: S1('DEGREES', x => x * 180 / Math.PI),
    FACT: S1('FACT', x => { x = Math.floor(x); if (x < 0 || x > 170) throw E.NUM(); let r = 1; for (let i = 2; i <= x; i++) r *= i; return r; }),
    COMBIN: { min: 2, max: 2, f: a => { const n = Math.floor(num(a[0])), k = Math.floor(num(a[1])); if (n < 0 || k < 0 || k > n) throw E.NUM(); let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); } },
    GCD: { min: 1, max: 255, f: a => nums(a).reduce((x, y) => gcd(x, y), 0) }, LCM: { min: 1, max: 255, f: a => nums(a).reduce((x, y) => (x && y) ? Math.abs(x * y) / gcd(x, y) : 0, 1) },
    RAND: { min: 0, max: 0, f: () => Math.random() }, RANDBETWEEN: { min: 2, max: 2, f: a => { const lo = Math.ceil(num(a[0])), hi = Math.floor(num(a[1])); if (hi < lo) throw E.NUM(); return lo + Math.floor(Math.random() * (hi - lo + 1)); } },
    ISEVEN: { min: 1, max: 1, f: a => Math.floor(Math.abs(num(a[0]))) % 2 === 0 }, ISODD: { min: 1, max: 1, f: a => Math.floor(Math.abs(num(a[0]))) % 2 === 1 },
    CEILING: { min: 2, max: 2, f: a => { const s = num(a[1]), x = num(a[0]); return s === 0 ? 0 : Math.ceil(x / s - 1e-12) * s; } }, FLOOR: { min: 2, max: 2, f: a => { const s = num(a[1]), x = num(a[0]); return s === 0 ? 0 : Math.floor(x / s + 1e-12) * s; } },
    MROUND: { min: 2, max: 2, f: a => { const s = num(a[1]), x = num(a[0]); return s === 0 ? 0 : Math.round(x / s) * s; } },
    LARGE: { min: 2, max: 2, f: a => { const n = nums([a[0]]).sort((x, y) => y - x), k = Math.floor(num(a[1])); if (k < 1 || k > n.length) throw E.NUM(); return n[k - 1]; } },
    SMALL: { min: 2, max: 2, f: a => { const n = nums([a[0]]).sort((x, y) => x - y), k = Math.floor(num(a[1])); if (k < 1 || k > n.length) throw E.NUM(); return n[k - 1]; } },
    RANK: { min: 2, max: 3, f: a => { const x = num(a[0]), n = nums([a[1]]), asc = a.length > 2 && num(a[2]) !== 0; if (!n.includes(x)) throw E.NA(); return 1 + n.filter(v => asc ? v < x : v > x).length; } },
    STDEV: { min: 1, max: 255, f: a => Math.sqrt(stdev(a, false)) }, STDEVP: { min: 1, max: 255, f: a => Math.sqrt(stdev(a, true)) }, VAR: { min: 1, max: 255, f: a => stdev(a, false) }, VARP: { min: 1, max: 255, f: a => stdev(a, true) },
    COUNTBLANK: { min: 1, max: 1, f: a => { let k = 0; if (!a[0].rng) return one(a[0]) === null || one(a[0]) === '' ? 1 : 0; rangeCells(a[0], v => { if (v === null || v === '') k++; }); return k; } },
    CHOOSE: { min: 2, max: 255, f: a => { const i = Math.floor(num(a[0])); if (i < 1 || i >= a.length) throw E.VAL(); return one(a[i]); } },
    XOR: { min: 1, max: 255, f: a => { let k = 0; a.forEach(x => { if (x && x.rng) rangeCells(x, v => { if (v !== null && v !== '' && truthy(v)) k++; }); else if (truthy(x)) k++; }); return k % 2 === 1; } },
    IFNA: { min: 2, max: 2, lazy: true, f: (a, ctx) => { try { return evalScalar(a[0], ctx); } catch (e) { if (e instanceof XlErr && e.code === '#NV') return evalScalar(a[1], ctx); throw e; } } },
    ISNA: { min: 1, max: 1, lazy: true, f: (a, ctx) => { try { evalScalar(a[0], ctx); return false; } catch (e) { if (e instanceof XlErr) return e.code === '#NV'; throw e; } } },
    NA: { min: 0, max: 0, f: () => { throw E.NA(); } },
    IFS: { min: 2, max: 254, lazy: true, f: (a, ctx) => { for (let i = 0; i + 1 < a.length; i += 2) if (truthy(evalScalar(a[i], ctx))) return evalScalar(a[i + 1], ctx); throw E.NA(); } },
    SWITCH: { min: 3, max: 255, lazy: true, f: (a, ctx) => { const x = evalScalar(a[0], ctx); let i = 1; for (; i + 1 < a.length; i += 2) if (cmpVals(x, evalScalar(a[i], ctx)) === 0) return evalScalar(a[i + 1], ctx); if (i < a.length) return evalScalar(a[i], ctx); throw E.NA(); } },
    PROPER: { min: 1, max: 1, f: a => txt(a[0]).toLowerCase().replace(/(^|[^a-zäöüß])([a-zäöüß])/g, (m, p, c) => p + c.toUpperCase()) },
    SUBSTITUTE: { min: 3, max: 4, f: a => { const s = txt(a[0]), o = txt(a[1]), n = txt(a[2]); if (!o) return s; if (a.length < 4) return s.split(o).join(n); let k = 0, inst = Math.floor(num(a[3])); if (inst < 1) throw E.VAL(); let out = '', i = 0; for (;;) { const j = s.indexOf(o, i); if (j < 0) { out += s.slice(i); break; } k++; out += s.slice(i, j) + (k === inst ? n : o); i = j + o.length; } return out; } },
    REPLACE: { min: 4, max: 4, f: a => { const s = txt(a[0]), st = Math.floor(num(a[1])) - 1, n = Math.floor(num(a[2])); if (st < 0 || n < 0) throw E.VAL(); return s.slice(0, st) + txt(a[3]) + s.slice(st + n); } },
    FIND: { min: 2, max: 3, f: a => { const i = txt(a[1]).indexOf(txt(a[0]), a.length > 2 ? num(a[2]) - 1 : 0); if (i < 0) throw E.VAL('Text nicht gefunden'); return i + 1; } },
    SEARCH: { min: 2, max: 3, f: a => { const i = txt(a[1]).toLowerCase().indexOf(txt(a[0]).toLowerCase(), a.length > 2 ? num(a[2]) - 1 : 0); if (i < 0) throw E.VAL('Text nicht gefunden'); return i + 1; } },
    REPT: { min: 2, max: 2, f: a => { const n = Math.floor(num(a[1])); if (n < 0 || n * txt(a[0]).length > 32000) throw E.VAL(); return txt(a[0]).repeat(n); } },
    EXACT: { min: 2, max: 2, f: a => txt(a[0]) === txt(a[1]) }, VALUE: { min: 1, max: 1, f: a => num(one(a[0])) },
    CONCAT: { min: 1, max: 255, f: a => a.map(x => x && x.rng ? (() => { let s = ''; rangeCells(x, v => { s += txt(v); }); return s; })() : txt(x)).join('') },
    TEXTJOIN: { min: 3, max: 255, f: a => { const d = txt(a[0]), skip = truthy(a[1]), parts = []; a.slice(2).forEach(x => { if (x && x.rng) rangeCells(x, v => { if (!(skip && (v === null || v === ''))) parts.push(txt(v)); }); else if (!(skip && (x === null || x === ''))) parts.push(txt(x)); }); return parts.join(d); } },
    ISTEXT: { min: 1, max: 1, f: a => typeof one(a[0]) === 'string' }, ISNONTEXT: { min: 1, max: 1, f: a => typeof one(a[0]) !== 'string' }, ISLOGICAL: { min: 1, max: 1, f: a => typeof one(a[0]) === 'boolean' },
    CHAR: { min: 1, max: 1, f: a => { const n = Math.floor(num(a[0])); if (n < 1 || n > 255) throw E.VAL(); return String.fromCharCode(n); } }, CODE: { min: 1, max: 1, f: a => { const s = txt(a[0]); if (!s) throw E.VAL(); return s.charCodeAt(0); } },
    N: { min: 1, max: 1, f: a => { const v = one(a[0]); return typeof v === 'number' ? v : typeof v === 'boolean' ? +v : 0; } },
    DATE: { min: 3, max: 3, f: a => { let y = Math.floor(num(a[0])); if (y >= 0 && y < 100) y += 1900; return ser(y, Math.floor(num(a[1])) - 1, Math.floor(num(a[2]))); } },
    YEAR: { min: 1, max: 1, f: a => dt(a[0]).getUTCFullYear() }, MONTH: { min: 1, max: 1, f: a => dt(a[0]).getUTCMonth() + 1 }, DAY: { min: 1, max: 1, f: a => dt(a[0]).getUTCDate() },
    WEEKDAY: { min: 1, max: 2, f: a => { const t = a.length > 1 ? num(a[1]) : 1, w = wd(a[0]); return t === 2 ? (w + 6) % 7 + 1 : t === 3 ? (w + 6) % 7 : w + 1; } },
    DAYS: { min: 2, max: 2, f: a => serial(a[0]) - serial(a[1]) },
    EDATE: { min: 2, max: 2, f: a => { const d = dt(a[0]), m = d.getUTCMonth() + Math.floor(num(a[1])), y = d.getUTCFullYear() + Math.floor(m / 12), mm = ((m % 12) + 12) % 12; return ser(y, mm, Math.min(d.getUTCDate(), eom(y, mm))); } },
    EOMONTH: { min: 2, max: 2, f: a => { const d = dt(a[0]), m = d.getUTCMonth() + Math.floor(num(a[1])), y = d.getUTCFullYear() + Math.floor(m / 12), mm = ((m % 12) + 12) % 12; return ser(y, mm, eom(y, mm)); } },
    HOUR: { min: 1, max: 1, f: a => Math.floor(((num(a[0]) % 1) + 1) % 1 * 24 + 1e-9) }, MINUTE: { min: 1, max: 1, f: a => Math.floor(((num(a[0]) * 24 % 1) + 1) % 1 * 60 + 1e-9) }, SECOND: { min: 1, max: 1, f: a => Math.floor(((num(a[0]) * 1440 % 1) + 1) % 1 * 60 + 1e-6) },
    WEEKNUM: { min: 1, max: 2, f: a => { if (a.length > 1 && num(a[1]) === 21) return isoWeek(a[0]); const d = dt(a[0]), j1 = ser(d.getUTCFullYear(), 0, 1), w1 = wd(j1), doy = serial(a[0]) - j1; return Math.floor((doy + w1) / 7) + 1; } },
    ISOWEEKNUM: { min: 1, max: 1, f: a => isoWeek(a[0]) },
    NETWORKDAYS: { min: 2, max: 2, f: a => { let s = serial(a[0]), e = serial(a[1]), sg = 1; if (e < s) { [s, e] = [e, s]; sg = -1; } let k = 0; for (let d = s; d <= e; d++) { const w = wd(d); if (w !== 0 && w !== 6) k++; } return sg * k; } },
    DATEDIF: { min: 3, max: 3, f: a => { const s = dt(a[0]), e = dt(a[1]), u = txt(a[2]).toUpperCase(); if (e < s) throw E.NUM(); let m = (e.getUTCFullYear() - s.getUTCFullYear()) * 12 + e.getUTCMonth() - s.getUTCMonth(); if (e.getUTCDate() < s.getUTCDate()) m--; if (u === 'Y') return Math.floor(m / 12); if (u === 'M') return m; if (u === 'D') return serial(a[1]) - serial(a[0]); throw E.NUM(); } },
    ROW: { min: 1, max: 1, f: a => { if (!a[0].rng) throw E.VAL(); return a[0].r1 + 1; } }, COLUMN: { min: 1, max: 1, f: a => { if (!a[0].rng) throw E.VAL(); return a[0].c1 + 1; } },
    ROWS: { min: 1, max: 1, f: a => { if (!a[0].rng) return 1; return a[0].r2 - a[0].r1 + 1; } }, COLUMNS: { min: 1, max: 1, f: a => { if (!a[0].rng) return 1; return a[0].c2 - a[0].c1 + 1; } },
    PMT: { min: 3, max: 5, f: a => fin.pmt(num(a[0]), num(a[1]), num(a[2]), a.length > 3 ? num(a[3]) : 0, a.length > 4 ? num(a[4]) : 0) },
    FV: { min: 3, max: 5, f: a => { const r = num(a[0]), n = num(a[1]), p = num(a[2]), pv = a.length > 3 ? num(a[3]) : 0, t = a.length > 4 ? num(a[4]) : 0; return r === 0 ? -(pv + p * n) : -(pv * Math.pow(1 + r, n) + p * (1 + r * t) * (Math.pow(1 + r, n) - 1) / r); } },
    PV: { min: 3, max: 5, f: a => { const r = num(a[0]), n = num(a[1]), p = num(a[2]), fv = a.length > 3 ? num(a[3]) : 0, t = a.length > 4 ? num(a[4]) : 0; return r === 0 ? -(fv + p * n) : -(fv + p * (1 + r * t) * (Math.pow(1 + r, n) - 1) / r) / Math.pow(1 + r, n); } },
    NPER: { min: 3, max: 5, f: a => { const r = num(a[0]), p = num(a[1]), pv = num(a[2]), fv = a.length > 3 ? num(a[3]) : 0, t = a.length > 4 ? num(a[4]) : 0; if (r === 0) { if (p === 0) throw E.NUM(); return -(pv + fv) / p; } const x = (p * (1 + r * t) - fv * r) / (p * (1 + r * t) + pv * r); if (x <= 0) throw E.NUM(); return Math.log(x) / Math.log(1 + r); } },
    NPV: { min: 2, max: 255, f: a => { const r = num(a[0]); return nums(a.slice(1)).reduce((s, v, i) => s + v / Math.pow(1 + r, i + 1), 0); } }
  });
})();

/* Funktionskatalog je Kategorie (deutsche Namen) für den Reiter „Formeln“ */
const FUNC_CATS = [
  ['Mathematik', 'math', ['SUMME', 'SUMMEWENN', 'SUMMEWENNS', 'SUMMENPRODUKT', 'PRODUKT', 'QUADRATESUMME', 'RUNDEN', 'AUFRUNDEN', 'ABRUNDEN', 'KÜRZEN', 'OBERGRENZE', 'UNTERGRENZE', 'VRUNDEN', 'ABS', 'VORZEICHEN', 'WURZEL', 'POTENZ', 'EXP', 'LN', 'LOG', 'LOG10', 'REST', 'GANZZAHL', 'FAKULTÄT', 'KOMBINATIONEN', 'GGT', 'KGV', 'ISTGERADE', 'ISTUNGERADE', 'PI', 'SIN', 'COS', 'TAN', 'ZUFALLSZAHL', 'ZUFALLSBEREICH']],
  ['Statistik', 'stat', ['MITTELWERT', 'MITTELWERTWENN', 'MITTELWERTWENNS', 'MEDIAN', 'MIN', 'MAX', 'MINWENNS', 'MAXWENNS', 'ANZAHL', 'ANZAHL2', 'ANZAHLLEEREZELLEN', 'ZÄHLENWENN', 'ZÄHLENWENNS', 'KGRÖSSTE', 'KKLEINSTE', 'RANG', 'STABW', 'STABWN', 'VARIANZ', 'VARIANZEN']],
  ['Logik', 'cf', ['WENN', 'WENNS', 'ERSTERWERT', 'UND', 'ODER', 'NICHT', 'XODER', 'WENNFEHLER', 'WENNNV']],
  ['Text', 'text', ['LINKS', 'RECHTS', 'TEIL', 'LÄNGE', 'GROSS', 'KLEIN', 'GROSS2', 'GLÄTTEN', 'VERKETTEN', 'TEXTKETTE', 'TEXTVERKETTEN', 'WECHSELN', 'ERSETZEN', 'FINDEN', 'SUCHEN', 'WIEDERHOLEN', 'IDENTISCH', 'WERT', 'TEXT', 'ZEICHEN', 'CODE']],
  ['Datum und Zeit', 'clock', ['HEUTE', 'JETZT', 'DATUM', 'JAHR', 'MONAT', 'TAG', 'WOCHENTAG', 'KALENDERWOCHE', 'ISOKALENDERWOCHE', 'TAGE', 'EDATUM', 'MONATSENDE', 'NETTOARBEITSTAGE', 'DATEDIF', 'STUNDE', 'MINUTE', 'SEKUNDE']],
  ['Nachschlagen', 'search', ['SVERWEIS', 'XVERWEIS', 'INDEX', 'VERGLEICH', 'WAHL', 'ZEILE', 'SPALTE', 'ZEILEN', 'SPALTEN']],
  ['Finanzen', 'euro', ['RMZ', 'ZW', 'BW', 'ZZR', 'NBW']],
  ['Informationen', 'help', ['ISTZAHL', 'ISTTEXT', 'ISTKEINTEXT', 'ISTLOGIK', 'ISTLEER', 'ISTFEHLER', 'ISTNV', 'NV', 'N']]
];

/* ---------- Zeilen und Spalten einfügen / löschen ---------- */
function refShift(dim, at, n, tgt) { // n > 0: einfügen, n < 0: löschen (|n| Zeilen/Spalten)
  const cnt = -n, bad = nd => { nd.t = 'err'; nd.code = '#BEZUG!'; };
  const one = (v) => (n > 0 ? (v >= at ? v + n : v) : (v >= at + cnt ? v - cnt : v));
  S.wb.sheets.forEach(sh => {
    for (const k in sh.cells) {
      const c = sh.cells[k]; if (c.f === undefined) continue;
      try {
        c.f = mapRefs(c.f, nd => {
          const target = nd.sh == null ? sh : findSheet(S.wb, nd.sh); if (target !== tgt) return;
          if (nd.t === 'ref') { const v = dim === 'r' ? nd.r : nd.c; if (n < 0 && v >= at && v < at + cnt) { bad(nd); return; } if (dim === 'r') nd.r = one(nd.r); else nd.c = one(nd.c); }
          else { const a = dim === 'r' ? 'r1' : 'c1', b = dim === 'r' ? 'r2' : 'c2'; if (n > 0) { nd[a] = one(nd[a]); nd[b] = one(nd[b]); } else { if (nd[a] >= at && nd[b] < at + cnt) { bad(nd); return; } nd[a] = nd[a] >= at + cnt ? nd[a] - cnt : (nd[a] >= at ? at : nd[a]); nd[b] = nd[b] >= at + cnt ? nd[b] - cnt : (nd[b] >= at ? at - 1 : nd[b]); } }
        });
      } catch (e) { }
    }
  });
}
function shiftSheet(dim, at, n) {
  const sh = cur(), lim = dim === 'r' ? ROWS : COLS, cnt = -n, map = v => (n > 0 ? (v >= at ? v + n : v) : (v >= at && v < at + cnt ? -1 : (v >= at + cnt ? v - cnt : v)));
  refShift(dim, at, n, sh);
  const cells = {}; for (const k in sh.cells) { let [r, c] = k.split(',').map(Number); const v = map(dim === 'r' ? r : c); if (v < 0 || v >= lim) continue; if (dim === 'r') r = v; else c = v; cells[key(r, c)] = sh.cells[k]; } sh.cells = cells;
  const mapObj = o => { const out = {}; for (const k in o) { const v = map(+k); if (v >= 0 && v < lim) out[v] = o[k]; } return out; };
  if (dim === 'r') { sh.rowH = mapObj(sh.rowH); sh.hidden = mapObj(sh.hidden); sh.rowM = mapObj(sh.rowM || {}); } else sh.colW = mapObj(sh.colW);
  if (sh.cf) sh.cf.forEach(x => { const a = dim === 'r' ? 'r1' : 'c1', b = dim === 'r' ? 'r2' : 'c2'; if (n > 0) { x[a] = x[a] >= at ? x[a] + n : x[a]; x[b] = x[b] >= at ? x[b] + n : x[b]; } else { x[a] = x[a] >= at + cnt ? x[a] - cnt : Math.min(x[a], at); x[b] = x[b] >= at + cnt ? x[b] - cnt : x[b] >= at ? at - 1 : x[b]; } });
  sh.cf = (sh.cf || []).filter(x => x.r2 >= x.r1 && x.c2 >= x.c1);
  if (sh.filter) { sh.filter = null; }
}
function insertRows() { const g = selRect(); shiftSheet('r', g.r1, g.r2 - g.r1 + 1); commit('Zeilen einfügen'); }
function insertCols() { const g = selRect(); shiftSheet('c', g.c1, g.c2 - g.c1 + 1); commit('Spalten einfügen'); }
function deleteRows() { const g = selRect(); shiftSheet('r', g.r1, -(g.r2 - g.r1 + 1)); S.sel = { r1: g.r1, c1: g.c1, r2: g.r1, c2: g.c2 }; S.active = { r: g.r1, c: g.c1 }; commit('Zeilen löschen'); }
function deleteCols() { const g = selRect(); shiftSheet('c', g.c1, -(g.c2 - g.c1 + 1)); S.sel = { r1: g.r1, c1: g.c1, r2: g.r2, c2: g.c1 }; S.active = { r: g.r1, c: g.c1 }; commit('Spalten löschen'); }

/* ---------- Dialoge, Formate, Ausfüllen ---------- */
function ask(title, fields, ok, hint) {
  const ins = fields.map(f => f.opts ? el('select', { style: 'width:100%' }, ...f.opts.map(([v, t]) => el('option', { value: v }, t))) : el('input', { type: f.type || 'text', value: f.value != null ? f.value : '', style: 'width:100%' }));
  ins.forEach((x, i) => { if (fields[i].value != null && fields[i].opts) x.value = fields[i].value; });
  const body = el('div', null, ...fields.map((f, i) => el('label', { style: 'display:block;margin:8px 0' }, f.label, ins[i])), hint ? el('p', { class: 'hint' }, hint) : '');
  dialog({ title, body, buttons: [{ label: 'Abbrechen' }, { label: 'OK', pri: true, fn: () => { try { return ok(ins.map(x => x.value)); } catch (e) { toast(e.message, true); return false; } } }] });
  ins.forEach(x => x.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const b = document.querySelector('.dlg .btn.pri'); if (b) b.click(); } }));
}
function setColWidthDlg() { const g = selRect(); ask('Spaltenbreite', [{ label: 'Breite in Pixel (24–600)', type: 'number', value: Math.round(colX[g.c1 + 1] - colX[g.c1]) }], ([v]) => { const w = clamp(Math.round(+v), 24, 600); if (!isFinite(w)) return false; for (let c = g.c1; c <= g.c2; c++) cur().colW[c] = w; commit('Spaltenbreite'); }); }
function setRowHeightDlg() { const g = selRect(); ask('Zeilenhöhe', [{ label: 'Höhe in Pixel (12–400)', type: 'number', value: Math.round(rowY[g.r1 + 1] - rowY[g.r1]) }], ([v]) => { const h = clamp(Math.round(+v), 12, 400); if (!isFinite(h)) return false; for (let r = g.r1; r <= g.r2; r++) { cur().rowH[r] = h; if (cur().rowM) cur().rowM[r] = 1; } commit('Zeilenhöhe'); }); }
function hideRows(on) { const g = selRect(), sh = cur(); if (on) { for (let r = g.r1; r <= g.r2; r++) sh.hidden[r] = 1; const nr = skipHidden(g.r1, 1); S.active = { r: nr, c: S.active.c }; S.sel = { r1: nr, c1: S.active.c, r2: nr, c2: S.active.c }; } else { for (let r = Math.max(0, g.r1 - 1); r <= Math.min(ROWS - 1, g.r2 + 1); r++) delete sh.hidden[r]; } commit(on ? 'Zeilen ausblenden' : 'Zeilen einblenden'); }
function fillDir(dir) { const g = selRect(); if (dir === 'v') { if (g.r2 <= g.r1) { toast('Mehrere Zeilen markieren: Die oberste Zeile wird nach unten kopiert.', true); return; } fillRange({ r1: g.r1, r2: g.r1, c1: g.c1, c2: g.c2 }, g, 'v'); } else { if (g.c2 <= g.c1) { toast('Mehrere Spalten markieren: Die linke Spalte wird nach rechts kopiert.', true); return; } fillRange({ r1: g.r1, r2: g.r2, c1: g.c1, c2: g.c1 }, g, 'h'); } }
function clearFormats() { eachSel((r, c, sh) => { const k = key(r, c), cell = sh.cells[k]; if (!cell || !cell.st) return; delete cell.st; if (cell.v === null && cell.f === undefined) delete sh.cells[k]; }, true); commit('Formate löschen'); }
function bumpSize(d) { const sz = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72], cu = (aStyle().sz || 11); let i = sz.findIndex(x => x >= cu); if (i < 0) i = sz.length - 1; i = clamp(i + d, 0, sz.length - 1); setStyle('sz', sz[i] === 11 ? null : sz[i]); }
function autoFn(name) { // Summe/Mittelwert/… unter bzw. neben die Auswahl schreiben
  const g = selRect(), sh = cur();
  if (g.r1 === g.r2 && g.c1 === g.c2) { let rr = g.r1 - 1; while (rr >= 0 && sh.cells[key(rr, g.c1)] && typeof sh.cells[key(rr, g.c1)].v === 'number') rr--; if (rr + 1 >= g.r1) { toast('Keine Zahlen oberhalb gefunden.', true); return; } try { setCellInput(g.r1, g.c1, '=' + name + '(' + addr(rr + 1, g.c1) + ':' + addr(g.r1 - 1, g.c1) + ')'); commit(name); } catch (e) { toast(e.message, true); } return; }
  for (let cc = g.c1; cc <= g.c2; cc++) setCellInput(g.r2 + 1, cc, '=' + name + '(' + addr(g.r1, cc) + ':' + addr(g.r2, cc) + ')'); commit(name);
}

/* ---------- Datenwerkzeuge ---------- */
function cellTextVal(cell) { return cell && cell.v !== null && cell.v !== undefined && !(cell.v instanceof XlErr) ? cell.v : null; }
function cleanText(mode) {
  let n = 0; eachSel((r, c, sh) => { const k = key(r, c), cell = sh.cells[k]; if (!cell || cell.f !== undefined || typeof cell.v !== 'string') return; let t = cell.v;
    if (mode === 'trim') t = t.trim().replace(/\s+/g, ' '); else if (mode === 'up') t = t.toUpperCase(); else if (mode === 'low') t = t.toLowerCase(); else if (mode === 'prop') t = t.toLowerCase().replace(/(^|[^a-zäöüß])([a-zäöüß])/g, (m, p, ch) => p + ch.toUpperCase());
    if (t !== cell.v) { cell.v = t; n++; } });
  commit('Text bereinigen'); toast(n + (n === 1 ? ' Zelle geändert.' : ' Zellen geändert.'));
}
function removeDuplicates() {
  const g = targetRange(), sh = cur(), hdr = guessHeader(g), seen = new Set(), rows = []; let removed = 0;
  for (let r = g.r1; r <= g.r2; r++) { const row = []; let sig = []; for (let c = g.c1; c <= g.c2; c++) { const cell = sh.cells[key(r, c)]; row.push(cell || null); const v = cellTextVal(cell); sig.push(v === null ? '' : typeof v + ':' + String(v).toLowerCase()); } const s = sig.join('\u0001'); if (r === g.r1 && hdr) { rows.push(row); continue; } if (seen.has(s)) { removed++; continue; } seen.add(s); rows.push(row); }
  if (!removed) { toast('Keine doppelten Zeilen gefunden.'); return; }
  for (let r = g.r1; r <= g.r2; r++) for (let c = g.c1; c <= g.c2; c++) delete sh.cells[key(r, c)];
  rows.forEach((row, i) => row.forEach((cell, j) => { if (cell) sh.cells[key(g.r1 + i, g.c1 + j)] = cell; }));
  commit('Duplikate entfernen'); toast(removed + (removed === 1 ? ' doppelte Zeile entfernt.' : ' doppelte Zeilen entfernt.'));
}
function textToColumns() {
  const g = selRect(), sh = cur(); if (g.c1 !== g.c2) { toast('Bitte genau eine Spalte markieren.', true); return; }
  ask('Text in Spalten', [{ label: 'Trennzeichen', value: ';', opts: [[';', 'Semikolon'], [',', 'Komma'], ['\t', 'Tabulator'], [' ', 'Leerzeichen'], ['|', 'Senkrechter Strich']] }], ([d]) => {
    let maxc = 0; const rows = []; for (let r = g.r1; r <= g.r2; r++) { const cell = sh.cells[key(r, g.c1)]; const v = cellTextVal(cell); const parts = v === null ? [] : String(v).split(d); rows.push(parts); maxc = Math.max(maxc, parts.length); }
    if (g.c1 + maxc > COLS) throw new Error('Nicht genug Spalten rechts.');
    rows.forEach((parts, i) => parts.forEach((p, j) => setCellInput(g.r1 + i, g.c1 + j, p.trim())));
    S.sel = { r1: g.r1, c1: g.c1, r2: g.r2, c2: g.c1 + Math.max(0, maxc - 1) }; commit('Text in Spalten');
  }, 'Die Teile werden in die Spalten rechts der Auswahl geschrieben; vorhandene Werte dort werden überschrieben.');
}
function transposeSel() {
  const g = selRect(), sh = cur(), h = g.r2 - g.r1 + 1, w = g.c2 - g.c1 + 1; if (g.c1 + h > COLS || g.r1 + w > ROWS) { toast('Der transponierte Bereich passt nicht auf das Blatt.', true); return; }
  const buf = []; for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) { const cell = sh.cells[key(g.r1 + r, g.c1 + c)]; buf.push([r, c, cell ? JSON.parse(JSON.stringify(cell, (k, v) => v instanceof XlErr ? null : v)) : null]); }
  for (let r = 0; r < Math.max(h, w); r++) for (let c = 0; c < Math.max(h, w); c++) if (g.r1 + r < ROWS && g.c1 + c < COLS && (r < h && c < w || r < w && c < h)) delete sh.cells[key(g.r1 + r, g.c1 + c)];
  buf.forEach(([r, c, cell]) => { if (cell) { if (cell.f !== undefined) { cell.v = 0; } sh.cells[key(g.r1 + c, g.c1 + r)] = cell; } });
  S.sel = { r1: g.r1, c1: g.c1, r2: g.r1 + w - 1, c2: g.c1 + h - 1 }; commit('Transponieren'); toast('Formeln wurden dabei unverändert übernommen – Bezüge ggf. prüfen.');
}
function selStats() {
  const g = selRect(), sh = cur(), v = []; let cnt = 0, txtN = 0;
  eachSel((r, c) => { const cell = sh.cells[key(r, c)], x = cellTextVal(cell); if (x === null) return; cnt++; if (typeof x === 'number') v.push(x); else txtN++; });
  const sum = v.reduce((a, b) => a + b, 0), f = x => fmtGeneral(+x.toPrecision(12)), sd = v.length > 1 ? Math.sqrt(v.reduce((s, x) => s + (x - sum / v.length) ** 2, 0) / (v.length - 1)) : null, srt = v.slice().sort((a, b) => a - b), med = srt.length ? (srt.length % 2 ? srt[srt.length >> 1] : (srt[srt.length / 2 - 1] + srt[srt.length / 2]) / 2) : null;
  const rows = [['Bereich', addr(g.r1, g.c1) + (g.r1 === g.r2 && g.c1 === g.c2 ? '' : ':' + addr(g.r2, g.c2))], ['Gefüllte Zellen', cnt], ['Zahlen', v.length], ['Text', txtN], ['Summe', v.length ? f(sum) : '–'], ['Mittelwert', v.length ? f(sum / v.length) : '–'], ['Median', med !== null ? f(med) : '–'], ['Minimum', v.length ? f(srt[0]) : '–'], ['Maximum', v.length ? f(srt[srt.length - 1]) : '–'], ['Standardabweichung', sd !== null ? f(sd) : '–']];
  dialog({ title: 'Statistik der Auswahl', body: el('table', { class: 'stat' }, ...rows.map(([a, b]) => el('tr', null, el('td', null, a), el('td', { style: 'text-align:right;font-weight:600;padding-left:24px' }, String(b))))) });
}

/* ---------- Bedingte Formatierung ---------- */
const CF_PRESETS = { rot: { bg: '#ffc7ce', co: '#9c0006' }, gelb: { bg: '#ffeb9c', co: '#9c5700' }, gruen: { bg: '#c6efce', co: '#006100' }, blau: { bg: '#bdd7ee', co: '#1f4e79' }, fett: { b: 1, co: '#c00000' } };
const CF_SCALES = { 'Weiß → Grün': ['#ffffff', '#63be7b'], 'Weiß → Rot': ['#ffffff', '#f8696b'], 'Weiß → Blau': ['#ffffff', '#5a8ac6'], 'Grün – Gelb – Rot': ['#63be7b', '#ffeb84', '#f8696b'], 'Rot – Gelb – Grün': ['#f8696b', '#ffeb84', '#63be7b'], 'Blau – Weiß – Rot': ['#5a8ac6', '#ffffff', '#f8696b'] };
const CFC = new WeakMap();
const hex2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function lerpCol(stops, t) { t = clamp(t, 0, 1); const seg = (stops.length - 1) * t, i = Math.min(stops.length - 2, Math.floor(seg)), f = seg - i, a = hex2(stops[i]), b = hex2(stops[i + 1]); return '#' + a.map((x, k) => Math.round(x + (b[k] - x) * f).toString(16).padStart(2, '0')).join(''); }
function cfData(rule, sh) {
  let d = CFC.get(rule); if (d && d.pass === calc.pass) return d; d = { pass: calc.pass };
  const vals = []; for (let r = rule.r1; r <= rule.r2; r++) for (let c = rule.c1; c <= rule.c2; c++) { const x = cellTextVal(sh.cells[key(r, c)]); if (x !== null) vals.push(x); }
  const ns = vals.filter(x => typeof x === 'number');
  if (rule.type === 'dup' || rule.type === 'uniq') { d.cnt = new Map(); vals.forEach(x => { const k = typeof x === 'string' ? x.toLowerCase() : x; d.cnt.set(k, (d.cnt.get(k) || 0) + 1); }); }
  if (rule.type === 'top' || rule.type === 'bottom') { const s = ns.slice().sort((a, b) => rule.type === 'top' ? b - a : a - b); d.thr = s.length ? s[Math.min(s.length, Math.max(1, rule.a)) - 1] : null; }
  if (rule.type === 'scale') { d.min = ns.length ? Math.min(...ns) : 0; d.max = ns.length ? Math.max(...ns) : 0; }
  if (rule.type === 'avg+' || rule.type === 'avg-') d.avg = ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0;
  CFC.set(rule, d); return d;
}
function cfStyle(sh, r, c, cell) {
  const v = cellTextVal(cell);
  for (const rule of sh.cf) {
    if (r < rule.r1 || r > rule.r2 || c < rule.c1 || c > rule.c2) continue; const num_ = typeof v === 'number'; let hit = false;
    switch (rule.type) {
      case 'gt': hit = num_ && v > rule.a; break; case 'lt': hit = num_ && v < rule.a; break; case 'ge': hit = num_ && v >= rule.a; break; case 'le': hit = num_ && v <= rule.a; break;
      case 'eq': hit = v !== null && (num_ && isFinite(rule.a) ? v === +rule.a : String(v).toLowerCase() === String(rule.a).toLowerCase()); break;
      case 'between': hit = num_ && v >= Math.min(rule.a, rule.b) && v <= Math.max(rule.a, rule.b); break;
      case 'text': hit = v !== null && String(v).toLowerCase().includes(String(rule.a).toLowerCase()); break;
      case 'blank': hit = v === null || v === ''; break;
      case 'dup': case 'uniq': { if (v === null) break; const n = cfData(rule, sh).cnt.get(typeof v === 'string' ? v.toLowerCase() : v); hit = rule.type === 'dup' ? n > 1 : n === 1; break; }
      case 'top': hit = num_ && cfData(rule, sh).thr !== null && v >= cfData(rule, sh).thr; break; case 'bottom': hit = num_ && cfData(rule, sh).thr !== null && v <= cfData(rule, sh).thr; break;
      case 'avg+': hit = num_ && v > cfData(rule, sh).avg; break; case 'avg-': hit = num_ && v < cfData(rule, sh).avg; break;
      case 'scale': { if (!num_) break; const d = cfData(rule, sh); return { bg: lerpCol(rule.cols, d.max === d.min ? 0.5 : (v - d.min) / (d.max - d.min)) }; }
    }
    if (hit) return rule.fmt;
  }
  return null;
}
function cfAdd(rule) { const g = selRect(), sh = cur(); sh.cf = sh.cf || []; Object.assign(rule, { r1: g.r1, c1: g.c1, r2: g.r2, c2: g.c2 }); sh.cf.push(rule); commit('Bedingte Formatierung'); }
function cfValueDlg(title, type, two) {
  const fields = [{ label: two ? 'Von' : 'Wert', value: '' }]; if (two) fields.push({ label: 'Bis', value: '' }); fields.push({ label: 'Formatierung', value: 'rot', opts: [['rot', 'Hellrote Füllung mit dunkelrotem Text'], ['gelb', 'Gelbe Füllung mit dunkelgelbem Text'], ['gruen', 'Grüne Füllung mit dunkelgrünem Text'], ['blau', 'Blaue Füllung'], ['fett', 'Roter fetter Text']] });
  ask(title, fields, vals => { const fmt = CF_PRESETS[vals[vals.length - 1]]; const a = vals[0]; if (type !== 'text' && type !== 'eq' && !isFinite(parseNumberText(a))) throw new Error('Bitte eine Zahl eingeben.'); const conv = x => type === 'text' || type === 'eq' ? (parseNumberText(x) !== null && x.trim() !== '' ? parseNumberText(x) : x) : parseNumberText(x); const rule = { type, a: conv(a), fmt }; if (two) { if (!isFinite(parseNumberText(vals[1]))) throw new Error('Bitte eine Zahl eingeben.'); rule.b = parseNumberText(vals[1]); } cfAdd(rule); });
}
function cfPresetAsk(title, type, a) { ask(title, [{ label: 'Formatierung', value: 'rot', opts: [['rot', 'Hellrote Füllung mit dunkelrotem Text'], ['gelb', 'Gelbe Füllung mit dunkelgelbem Text'], ['gruen', 'Grüne Füllung mit dunkelgrünem Text'], ['blau', 'Blaue Füllung'], ['fett', 'Roter fetter Text']] }], ([f]) => { cfAdd({ type, a, fmt: CF_PRESETS[f] }); }); }
function cfMenu() {
  return [{ label: 'Größer als …', fn: () => cfValueDlg('Größer als', 'gt') }, { label: 'Kleiner als …', fn: () => cfValueDlg('Kleiner als', 'lt') }, { label: 'Zwischen …', fn: () => cfValueDlg('Zwischen', 'between', true) }, { label: 'Gleich …', fn: () => cfValueDlg('Gleich', 'eq') }, { label: 'Text enthält …', fn: () => cfValueDlg('Text enthält', 'text') }, { label: 'Doppelte Werte', fn: () => cfPresetAsk('Doppelte Werte', 'dup') }, { label: 'Eindeutige Werte', fn: () => cfPresetAsk('Eindeutige Werte', 'uniq') }, { label: 'Leere Zellen', fn: () => cfPresetAsk('Leere Zellen', 'blank') }, '-',
    { label: 'Obere 10 Werte', fn: () => cfPresetAsk('Obere 10 Werte', 'top', 10) }, { label: 'Untere 10 Werte', fn: () => cfPresetAsk('Untere 10 Werte', 'bottom', 10) }, { label: 'Über dem Durchschnitt', fn: () => cfPresetAsk('Über dem Durchschnitt', 'avg+') }, { label: 'Unter dem Durchschnitt', fn: () => cfPresetAsk('Unter dem Durchschnitt', 'avg-') }, '-',
    ...Object.keys(CF_SCALES).map(n => ({ label: 'Farbskala: ' + n, fn: () => cfAdd({ type: 'scale', cols: CF_SCALES[n], fmt: {} }) })), '-',
    { label: 'Regeln der Auswahl löschen', fn: () => { const g = selRect(), sh = cur(); sh.cf = (sh.cf || []).filter(x => x.r2 < g.r1 || x.r1 > g.r2 || x.c2 < g.c1 || x.c1 > g.c2); commit('Regeln löschen'); } }, { label: 'Alle Regeln im Blatt löschen', fn: () => { cur().cf = []; commit('Regeln löschen'); } }];
}
/* Bedingte Formatierung beim Laden erhalten */
(() => { const orig = validateWorkbook; validateWorkbook = function (p) { const wb = orig(p); p.sheets.forEach((s, i) => { const out = [], ok = x => Number.isInteger(x) && x >= 0; (Array.isArray(s.cf) ? s.cf : []).slice(0, 200).forEach(x => { if (!x || ![x.r1, x.c1, x.r2, x.c2].every(ok) || x.r2 >= ROWS || x.c2 >= COLS || !/^(gt|lt|ge|le|eq|between|text|blank|dup|uniq|top|bottom|avg\+|avg-|scale)$/.test(x.type)) return; const r = { type: x.type, r1: x.r1, c1: x.c1, r2: x.r2, c2: x.c2, fmt: {} }; if (x.a != null && (typeof x.a === 'number' || typeof x.a === 'string')) r.a = typeof x.a === 'string' ? x.a.slice(0, 200) : x.a; if (typeof x.b === 'number') r.b = x.b; if (x.fmt) { const col = v => /^#[0-9a-f]{6}$/i.test(v) ? v : null; if (col(x.fmt.bg)) r.fmt.bg = x.fmt.bg; if (col(x.fmt.co)) r.fmt.co = x.fmt.co; if (x.fmt.b) r.fmt.b = 1; } if (x.type === 'scale') { const cols = Array.isArray(x.cols) ? x.cols.filter(c => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 3) : []; if (cols.length < 2) return; r.cols = cols; } out.push(r); }); wb.wb.sheets[i].cf = out; }); return wb; }; })();

/* ---------- Menüband ---------- */
(() => {
  const catMenu = names => names.map(n => ({ label: n, fn: () => startEdit('=' + n + '(') }));
  const startBase = RIB.start;
  RIB.start = () => {
    const g = startBase();
    g.splice(4, 0, GR('Zellen', B({ icon: 'insrow', label: 'Einfügen', tip: 'Zeilen oder Spalten einfügen', menu: () => [{ label: 'Zeilen oberhalb einfügen', fn: insertRows }, { label: 'Spalten links einfügen', fn: insertCols }] }), B({ icon: 'delrow', label: 'Löschen', tip: 'Zeilen oder Spalten löschen', menu: () => [{ label: 'Zeilen löschen', fn: deleteRows }, { label: 'Spalten löschen', fn: deleteCols }] }), B({ icon: 'cellfmt', label: 'Format', tip: 'Zeilenhöhe, Spaltenbreite, Ausblenden', menu: () => [{ label: 'Zeilenhöhe …', fn: setRowHeightDlg }, { label: 'Spaltenbreite …', fn: setColWidthDlg }, { label: 'Spaltenbreite automatisch anpassen', fn: fitColumn }, '-', { label: 'Zeilen ausblenden', fn: () => hideRows(true) }, { label: 'Zeilen einblenden (um Auswahl)', fn: () => hideRows(false) }, { label: 'Alle Zeilen einblenden', fn: () => { cur().hidden = {}; commit('Zeilen einblenden'); } }] })),
      GR('Formatvorlagen', B({ icon: 'cf', label: 'Bedingte Formatierung', menu: cfMenu }), B({ icon: 'clearfmt', label: 'Formate löschen', fn: clearFormats })));
    const sch = g[1].querySelector('.rb-col'); if (sch) { const row = sch.firstChild; if (row) row.append(B({ icon: 'sizeup', sm: 1, tip: 'Schrift vergrößern', fn: () => bumpSize(1) }), B({ icon: 'sizedown', sm: 1, tip: 'Schrift verkleinern', fn: () => bumpSize(-1) })); }
    const ed = g.find(x => x.querySelector('.gn') && x.querySelector('.gn').textContent === 'Bearbeiten'); if (ed) { ed.querySelector('.items').append(col(B({ icon: 'filldown', sm: 1, label: 'Nach unten', tip: 'Strg+D', fn: () => fillDir('v') }), B({ icon: 'fillright', sm: 1, label: 'Nach rechts', tip: 'Strg+R', fn: () => fillDir('h') })), B({ icon: 'sigma', label: 'Autosumme', menu: () => [['SUMME', 'Summe'], ['MITTELWERT', 'Mittelwert'], ['ANZAHL', 'Anzahl'], ['MAX', 'Maximum'], ['MIN', 'Minimum']].map(([n, l]) => ({ label: l, fn: () => autoFn(n) })) })); }
    return g;
  };
  RIB.formulas = () => [GR('Funktionsbibliothek', B({ icon: 'sigma', label: 'Autosumme', menu: () => [['SUMME', 'Summe'], ['MITTELWERT', 'Mittelwert'], ['ANZAHL', 'Anzahl'], ['MAX', 'Maximum'], ['MIN', 'Minimum']].map(([n, l]) => ({ label: l, fn: () => autoFn(n) })) }),
    ...FUNC_CATS.map(([name, ic, fns]) => B({ icon: ic === 'math' || ic === 'text' ? 'fx' : ic, label: name, tip: fns.length + ' Funktionen', menu: () => catMenu(fns) }))),
    GR('Berechnung', B({ icon: 'recalc', label: 'Neu berechnen', fn: () => { commit('Neu berechnen'); toast('Alle Formeln neu berechnet.'); } }), B({ icon: 'showf', label: 'Formel anzeigen', tip: 'Formel der aktiven Zelle in der Formelleiste markieren', fn: () => { const i = $('#fx'); i.focus(); i.select(); } }))];
  RIB.review = () => [GR('Auswertung', B({ icon: 'stat', label: 'Statistik', tip: 'Summe, Mittelwert, Median … der Auswahl', fn: selStats })),
    GR('Text bereinigen', B({ icon: 'clean', label: 'Leerzeichen entfernen', fn: () => cleanText('trim') }), col(B({ icon: 'text', sm: 1, label: 'GROSSBUCHSTABEN', fn: () => cleanText('up') }), B({ icon: 'text', sm: 1, label: 'kleinbuchstaben', fn: () => cleanText('low') }), B({ icon: 'text', sm: 1, label: 'Erster Buchstabe Groß', fn: () => cleanText('prop') })))];
  const dataBase = RIB.data;
  RIB.data = () => { const g = dataBase(); g.push(GR('Datentools', B({ icon: 'dedupe', label: 'Duplikate entfernen', fn: removeDuplicates }), B({ icon: 'textcols', label: 'Text in Spalten', fn: textToColumns }), B({ icon: 'transp', label: 'Transponieren', fn: transposeSel }))); return g; };
  const viewBase = RIB.view;
  RIB.view = () => { const g = viewBase(); g.push(GR('Blatt', B({ icon: 'hiderow', label: 'Zeilen ausblenden', fn: () => hideRows(true) }), B({ icon: 'eye', label: 'Alle Zeilen einblenden', fn: () => { cur().hidden = {}; commit('Zeilen einblenden'); } }))); return g; };
  TABS.splice(3, 0, ['formulas', 'Formeln']); TABS.splice(5, 0, ['review', 'Überprüfen']);
  if (!IC.eye) IC.eye = '<path d="M3 12s3.500-6 9-6 9 6 9 6-3.500 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.500"/>';
  if (!IC.search) IC.search = '<circle cx="10.500" cy="10.500" r="6"/><path d="M15 15l5.500 5.500"/>';
  if (!IC.euro) IC.euro = '<path d="M17 6a6 6 0 100 12M5 10h9M5 14h9"/>';
  if (!IC.help) IC.help = '<circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 115 0c0 1.500-2.500 2-2.500 4M12 17h0"/>';
  if (!IC.clock) IC.clock = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
  if (!IC.text) IC.text = '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>';
})();
document.addEventListener('keydown', e => {
  if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || S.editing || document.activeElement !== $('#viewport')) return;
  if (e.key === 'd' || e.key === 'D') { e.preventDefault(); fillDir('v'); } else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); fillDir('h'); }
});
