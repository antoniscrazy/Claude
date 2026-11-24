/* =====================================================================
   PowerPoint-Erweiterungen: Formeffekte (Farbverlauf, Schatten, Ecken, Schnellformatvorlagen), Absatz (Aufzählung,
   Blocksatz, Zeilenabstand), Symbole/Datum/Foliennummer, Suchen & Ersetzen, Reiter „Überprüfen“
   (Wörter zählen, Rechtschreibung, Barrierefreiheit), Raster und Einrasten in der Ansicht.
   ===================================================================== */
Object.assign(IC, {
  grad: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M11 4v16M15 4v16" opacity=".5"/>', shadow: '<rect x="4" y="4" width="11" height="11" rx="1"/><path d="M8 18h9a2 2 0 002-2V8" opacity=".5"/>',
  corner: '<path d="M4 20V10a6 6 0 016-6h10"/>', quick: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="4"/><rect x="3" y="13" width="8" height="8" rx="4"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
  bullet2: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.500" cy="6" r="1.200"/><circle cx="4.500" cy="12" r="1.200"/><circle cx="4.500" cy="18" r="1.200"/>', justify: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>',
  lh: '<path d="M10 6h10M10 12h10M10 18h10M5 4v16M3 6l2-2 2 2M3 18l2 2 2-2"/>', sizeup: '<path d="M3 19l5-13 5 13M5 14h6M17 8v6M14 11h6"/>', sizedown: '<path d="M3 19l5-13 5 13M5 14h6M14 11h6"/>',
  symbol: '<path d="M6 19h4v-2.500C7.500 15.500 6 13.500 6 11a6 6 0 0112 0c0 2.500-1.500 4.500-4 5.500V19h4"/>', datetime: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4M12 13v3l2 1"/>', hash: '<path d="M9 4L7 20M17 4l-2 16M4 9h16M3 15h16"/>',
  wc: '<path d="M4 6h16M4 11h16M4 16h10"/><path d="M17 15l2 2 3-4"/>', spell: '<path d="M3 17l4-11 4 11M4.500 13h5M13 15l3 3 6-7"/>', access: '<circle cx="12" cy="5" r="2"/><path d="M5 9l7 1 7-1M12 10v5l-3 5M12 15l3 5"/>', find2: '<circle cx="10.500" cy="10.500" r="6"/><path d="M15 15l5.500 5.500M8 10.500h5"/>',
  gridl: '<path d="M4 4h16v16H4zM4 9.300h16M4 14.700h16M9.300 4v16M14.700 4v16"/>', snap: '<path d="M5 5h6M5 5v6M19 19h-6M19 19v-6M12 12l4 4M12 12l-1 4M12 12l4-1"/>'
});

/* ---- Hilfen ---- */
const allObjs = () => { const out = []; S.proj.slides.forEach((sl, i) => { const walk = os => os.forEach(o => { out.push([i, o]); if (o.type === 'group') walk(o.children || []); }); walk(sl.objects); }); return out; };
const mapText = (html, fn) => { const d = document.createElement('div'); d.innerHTML = html; const w = document.createTreeWalker(d, NodeFilter.SHOW_TEXT); const ns = []; let n; while ((n = w.nextNode())) ns.push(n); ns.forEach(t => { t.nodeValue = fn(t.nodeValue); }); return d.innerHTML; };
function flat(html) { const d = document.createElement('div'); d.innerHTML = html || ''; return d.textContent; }
function ask2(title, fields, ok, hint) {
  const ins = fields.map(f => f.type === 'check' ? el('input', { type: 'checkbox' }) : el('input', { type: f.type || 'text', value: f.value != null ? f.value : '', style: 'width:100%' }));
  const body = el('div', null, ...fields.map((f, i) => el('label', { style: 'display:block;margin:8px 0' }, f.label + ' ', ins[i])), hint ? el('p', { class: 'hint' }, hint) : '');
  dialog({ title, body, buttons: [{ label: 'Schließen' }, ...ok.map((o, k) => ({ label: o[0], pri: k === 0, fn: () => { o[1](ins.map((x, i) => fields[i].type === 'check' ? x.checked : x.value)); return o[2] === true ? undefined : false; } }))] });
}

/* ---- Formeffekte ---- */
const shapeSel = () => selObjs().filter(o => o.type === 'shape');
function setGrad(on) { const os = shapeSel(); if (!os.length) { toast('Bitte zuerst eine Form markieren.'); return; } os.forEach(o => { if (on) o.grad = o.grad || { c2: '#ffffff', ang: 90 }; else delete o.grad; }); commit('Farbverlauf'); }
function setGradProp(k, v) { shapeSel().forEach(o => { o.grad = o.grad || { c2: '#ffffff', ang: 90 }; o.grad[k] = v; }); commit('Farbverlauf', { merge: true }); }
function toggleShadow() { const os = selObjs().filter(o => o.type !== 'line'); if (!os.length) return; const on = !os.every(o => o.shadow); os.forEach(o => { if (on) o.shadow = true; else delete o.shadow; }); commit('Schatten'); }
function setRadius(v) { selObjs().filter(o => o.type === 'shape' && o.kind === 'round').forEach(o => { o.radius = clamp(v, 0, 500); }); commit('Eckenradius', { merge: true }); }
const QUICK = [['Hell', { fill: '#ffffff', stroke: '@a1', sw: 3, color: '@a1' }], ['Akzent', { fill: '@a1', stroke: 'none', sw: 0, color: '#ffffff' }], ['Kontur', { fill: 'none', stroke: '@a2', sw: 4, color: '@a2' }], ['Dunkel', { fill: '#222a38', stroke: 'none', sw: 0, color: '#ffffff' }], ['Verlauf', { fill: '@a1', grad: { c2: '@a2', ang: 45 }, stroke: 'none', sw: 0, color: '#ffffff' }], ['Weich', { fill: '#eef1f6', stroke: '#c9d0dc', sw: 2, color: '#222a38', shadow: true }]];
function quickStyle(q) { const os = selObjs().filter(o => o.type === 'shape' || o.type === 'text'); if (!os.length) { toast('Bitte zuerst ein Objekt markieren.'); return; } os.forEach(o => { o.fill = q.fill; o.stroke = q.stroke; o.sw = q.sw; if (q.grad && o.type === 'shape') o.grad = Object.assign({}, q.grad); else delete o.grad; if (q.shadow) o.shadow = true; else delete o.shadow; o.st = o.st || {}; o.st.color = q.color; }); commit('Schnellformatvorlage'); }
const getG = () => { const o = shapeSel()[0]; return o && o.grad; };

/* ---- Einfügen ---- */
const SYMS = '© ® ™ § ¶ † • … – — « » „ “ € £ ¥ ° ± × ÷ ≠ ≈ ≤ ≥ ∞ √ π Ω µ ½ ¼ ¾ ² ³ → ← ↑ ↓ ↔ ⇒ ✓ ✗ ★ ☆ ♥ ☎ ✉ ☀ ♪ α β γ Δ Σ'.split(' ');
function insertTextAtCaretOrBox(t, nm) {
  if (S.editing) { const tx = S.layer.querySelector('[data-oid="' + S.editing + '"] .pp-txt'); if (tx) { tx.focus(); if (S.savedRange) { const s = getSelection(); s.removeAllRanges(); s.addRange(S.savedRange); } document.execCommand('insertText', false, t); return; } }
  const W = S.proj.size.w, H = S.proj.size.h, o = mkText(W * .35, H * .45, W * .3, 70, '<div>' + PP.escHtml(t) + '</div>', { size: 28 }, { name: nm || 'Textfeld' }); addObject(o);
}
const symMenu = () => SYMS.map(ch => ({ label: ch + '   U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'), fn: () => insertTextAtCaretOrBox(ch, 'Symbol') }));
function dateItems() { const d = new Date(), p = n => String(n).padStart(2, '0'), mon = d.toLocaleDateString('de-DE', { month: 'long' }); return [p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear(), d.getDate() + '. ' + mon + ' ' + d.getFullYear(), d.toLocaleDateString('de-DE', { weekday: 'long' }) + ', ' + d.getDate() + '. ' + mon + ' ' + d.getFullYear(), p(d.getHours()) + ':' + p(d.getMinutes()) + ' Uhr'].map(t => ({ label: t, fn: () => insertTextAtCaretOrBox(t, 'Datum') })); }
function insertSlideNo() { const W = S.proj.size.w, H = S.proj.size.h, o = mkText(W - 140, H - 70, 100, 44, '<div>' + (S.cur + 1) + '</div>', { size: 18, align: 'right', color: '@tx' }, { name: 'Foliennummer' }); addObject(o); toast('Die Nummer ist fest (keine automatische Aktualisierung).'); }

/* ---- Suchen und Ersetzen ---- */
function findAll(q, cs) { let n = 0; const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), cs ? 'g' : 'gi'); allObjs().forEach(([i, o]) => { if (o.html) n += (flat(o.html).match(re) || []).length; if (o.type === 'table') o.rows.forEach(r => r.forEach(c => { n += (String(c).match(re) || []).length; })); }); return n; }
function replaceAllText(q, rep, cs) {
  if (!q) return 0; const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), cs ? 'g' : 'gi'); let n = 0;
  allObjs().forEach(([i, o]) => { if (o.html) { const h = mapText(o.html, t => t.replace(re, () => { n++; return rep; })); o.html = h; } if (o.type === 'table') o.rows = o.rows.map(r => r.map(c => String(c).replace(re, () => { n++; return rep; }))); });
  if (n) commit('Ersetzen'); return n;
}
function findDialog() {
  const fq = el('input', { type: 'text', style: 'width:100%' }), fr = el('input', { type: 'text', style: 'width:100%' }), cs = el('input', { type: 'checkbox' }), info = el('p', { class: 'hint' }, ' ');
  const upd = () => { info.textContent = fq.value ? findAll(fq.value, cs.checked) + ' Treffer in der gesamten Präsentation' : ' '; }; fq.oninput = upd; cs.onchange = upd;
  dialog({ title: 'Suchen und Ersetzen', body: el('div', null, el('label', { style: 'display:block;margin:6px 0' }, 'Suchen nach', fq), el('label', { style: 'display:block;margin:6px 0' }, 'Ersetzen durch', fr), el('label', null, cs, ' Groß-/Kleinschreibung beachten'), info),
    buttons: [{ label: 'Schließen' }, { label: 'Alle ersetzen', pri: true, fn: () => { const n = replaceAllText(fq.value, fr.value, cs.checked); toast(n + (n === 1 ? ' Ersetzung' : ' Ersetzungen') + ' vorgenommen.'); upd(); return false; } }] });
  fq.focus();
}

/* ---- Überprüfen ---- */
function wordCount() {
  let words = 0, chars = 0, objs = 0, notesW = 0; S.proj.slides.forEach(sl => { notesW += ((sl.notes || '').match(/\S+/g) || []).length; });
  allObjs().forEach(([i, o]) => { objs++; let t = o.html ? flat(o.html) : ''; if (o.type === 'table') t += ' ' + o.rows.map(r => r.join(' ')).join(' '); words += (t.match(/\S+/g) || []).length; chars += t.replace(/\s/g, '').length; });
  const rows = [['Folien', S.proj.slides.length], ['Objekte', objs], ['Wörter auf Folien', words], ['Zeichen (ohne Leerzeichen)', chars], ['Wörter in Notizen', notesW]];
  dialog({ title: 'Wörter zählen', body: el('table', null, ...rows.map(([a, b]) => el('tr', null, el('td', null, a), el('td', { style: 'text-align:right;font-weight:600;padding-left:32px' }, String(b))))) });
}
function accessCheck() {
  const issues = []; S.proj.slides.forEach((sl, i) => {
    const n = i + 1, hasTitle = sl.objects.some(o => o.ph === 'title' && flat(o.html).trim()); if (!hasTitle) issues.push([i, 'Folie ' + n + ': Kein Titel (Bildschirmleseprogramme benötigen einen Folientitel).']);
    (function walk(os) { os.forEach(o => { if (o.type === 'image' && (!o.name || /^(Bild|Image|Foto)\d*$/i.test(o.name.trim()))) issues.push([i, 'Folie ' + n + ': Bild ohne aussagekräftigen Namen/Alternativtext („' + (o.name || '') + '“).']); if (['text', 'shape'].includes(o.type) && o.html && flat(o.html).trim()) { const sz = PP.textStyle(o, S.proj.master, sl).size; if (sz < 14 && !/<(span|font)[^>]*font-size/i.test(o.html)) issues.push([i, 'Folie ' + n + ': Schrift kleiner als 14 pt („' + flat(o.html).trim().slice(0, 24) + '“).']); } if (o.type === 'group') walk(o.children || []); }); })(sl.objects);
    if (sl.transition && sl.transition.type === 'flash') issues.push([i, 'Folie ' + n + ': Blitzende Übergänge können Anfälle auslösen.']);
  });
  dialog({ title: 'Barrierefreiheit prüfen', wide: true, body: issues.length ? el('div', null, el('p', null, issues.length + ' Hinweis(e):'), ...issues.map(([i, t]) => el('div', { style: 'margin:4px 0' }, el('button', { class: 'btn', style: 'margin-right:8px', onclick: () => { S.cur = i; S.sel = []; render(); } }, 'Gehe zu'), t))) : el('p', null, 'Keine Probleme gefunden: Jede Folie hat einen Titel, Bilder sind benannt und die Schrift ist ausreichend groß.') });
}
let spellOn = true;
function toggleSpell() { spellOn = !spellOn; $('#app').spellcheck = spellOn; document.querySelectorAll('[contenteditable]').forEach(e => { e.spellcheck = spellOn; }); refreshRibbon(); toast('Rechtschreibprüfung ' + (spellOn ? 'ein' : 'aus')); }

/* ---- Raster / Einrasten ---- */
(() => { const st = document.createElement('style'); st.textContent = '#scaler.gridon::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:50;background-image:linear-gradient(rgba(60,90,160,.28) 1px,transparent 1px),linear-gradient(90deg,rgba(60,90,160,.28) 1px,transparent 1px);background-size:calc(var(--gz,1)*40px) calc(var(--gz,1)*40px)}'; document.head.append(st); })();
S.gridOn = false;
const _rs = renderStage; renderStage = function (f) { _rs(f); const sc = $('#scaler'); if (sc) { sc.style.setProperty('--gz', S.z || 1); sc.classList.toggle('gridon', !!S.gridOn); } };

/* ---- Menüband ---- */
(() => {
  const startBase = RIBBON.start;
  RIBBON.start = () => {
    const g = startBase();
    const para = g.find(x => (x.querySelector('.gn') || {}).textContent === 'Absatz');
    if (para) { const items = para.querySelector('.rb-col'); items.children[0].append(B({ icon: 'bullet2', sm: 1, tip: 'Aufzählung', en: textSel, on: () => !!textStateOf('bullets'), fn: () => applyObjStyle('bullets') }), B({ icon: 'justify', sm: 1, tip: 'Blocksatz', en: textSel, on: () => textStateOf('align') === 'justify', fn: () => applyObjStyle('align', 'justify') }), B({ icon: 'sizeup', sm: 1, tip: 'Schrift vergrößern', en: textSel, fn: () => applyObjStyle('size', Math.min(400, Math.round((textStateOf('size') || 20) * 1.1 + 1))) }), B({ icon: 'sizedown', sm: 1, tip: 'Schrift verkleinern', en: textSel, fn: () => applyObjStyle('size', Math.max(4, Math.round((textStateOf('size') || 20) / 1.1 - 1))) }));
      items.children[1].append(F({ type: 'select', label: 'Zeilenabstand', en: textSel, opts: [['1', '1,0'], ['1.2', '1,2'], ['1.5', '1,5'], ['2', '2,0']], get: () => String(textStateOf('lineH') || 1.2), set: v => applyObjStyle('lineH', +v) })); }
    const draw = g.find(x => (x.querySelector('.gn') || {}).textContent === 'Zeichnen'); if (draw) g.splice(g.indexOf(draw) + 1, 0, G_('Formeffekte', B({ icon: 'quick', label: 'Schnellformat', tip: 'Fertige Kombinationen aus Füllung, Kontur und Schrift', en: () => selObjs().some(o => ['shape', 'text'].includes(o.type)), menu: () => QUICK.map(([n, q]) => ({ label: n, fn: () => quickStyle(q) })) }), B({ icon: 'shadow', label: 'Schatten', en: hasSel, on: () => selObjs().length > 0 && selObjs().every(o => o.shadow), fn: toggleShadow }),
      col(B({ icon: 'grad', sm: 1, label: 'Farbverlauf', en: () => shapeSel().length > 0, on: () => !!getG(), fn: () => setGrad(!getG()) }), F({ type: 'color', label: 'Zweite Farbe', en: () => !!getG(), get: () => getG() ? getG().c2 : '#ffffff', set: v => setGradProp('c2', v) }), F({ label: 'Winkel °', type: 'number', min: 0, max: 359, step: 15, en: () => !!getG(), get: () => getG() ? getG().ang : 0, set: v => setGradProp('ang', ((v % 360) + 360) % 360) })),
      col(F({ label: 'Eckenradius', type: 'number', min: 0, max: 500, step: 5, en: () => shapeSel().some(o => o.kind === 'round'), get: () => { const o = shapeSel().find(x => x.kind === 'round'); return o ? Math.round(o.radius != null ? o.radius : Math.min(o.w, o.h) * .18) : null; }, set: setRadius }))));
    const edit = G_('Bearbeiten', B({ icon: 'find2', label: 'Suchen / Ersetzen', tip: 'Strg+H', fn: findDialog })); g.push(edit);
    return g;
  };
  const insBase = RIBBON.insert;
  RIBBON.insert = () => { const g = insBase(); g.push(G_('Symbole und Text', B({ icon: 'symbol', label: 'Symbol', menu: symMenu }), B({ icon: 'datetime', label: 'Datum und Uhrzeit', menu: dateItems }), B({ icon: 'hash', label: 'Foliennummer', fn: insertSlideNo }))); return g; };
  RIBBON.review = () => [G_('Prüfung', B({ icon: 'spell', label: 'Rechtschreibung', tip: 'Rechtschreibprüfung des Browsers im Textfeld ein-/ausschalten', on: () => spellOn, fn: toggleSpell }), B({ icon: 'wc', label: 'Wörter zählen', fn: wordCount }), B({ icon: 'access', label: 'Barrierefreiheit prüfen', fn: accessCheck })), G_('Suchen', B({ icon: 'find2', label: 'Suchen / Ersetzen', fn: findDialog }))];
  const viewBase = RIBBON.view;
  RIBBON.view = () => { const g = viewBase(); g.push(G_('Raster', B({ icon: 'gridl', label: 'Gitternetzlinien', on: () => S.gridOn, fn: () => { S.gridOn = !S.gridOn; renderStage(true); refreshRibbon(); } }), B({ icon: 'snap', label: 'Einrasten', tip: 'Objekte an Hilfslinien und Rändern einrasten', on: () => S.snap, fn: () => { S.snap = !S.snap; refreshRibbon(); } }), B({ icon: 'reset', label: 'Hilfslinien löschen', en: () => S.guides.length > 0, fn: () => { S.guides.length = 0; renderStage(true); } }))); return g; };
  TAB_DEF.splice(7, 0, ['review', 'Überprüfen']);
  if (!IC.search) IC.search = '<circle cx="10.500" cy="10.500" r="6"/><path d="M15 15l5.500 5.500"/>';
})();
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 'h' || e.key === 'H') && !(document.activeElement && /input|textarea|select/i.test(document.activeElement.tagName)) && !S.editing) { e.preventDefault(); findDialog(); } });
