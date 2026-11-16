// ====================================================================
// Baukasten-Oberfläche (Spielfeld zum Ziehen, Figuren, Variablen, Regeln)
// ====================================================================
const opt = (list, v) => list.map(([k, l]) => `<option value="${esc(k)}"${String(k) === String(v) ? ' selected' : ''}>${esc(l)}</option>`).join('');
const shapeOpts = v => `<optgroup label="Formen">${opt(SHAPE_OPTS, v)}</optgroup><optgroup label="Bilder">${opt(IMAGE_OPTS, v)}</optgroup>`;
const spOpts = (M, v, ph) => `<option value="">${esc(ph || '— Figur wählen —')}</option>` + M.sprites.map(s => `<option value="${esc(s.id)}"${s.id === v ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
const varOpts = (M, v) => `<option value="">— Variable wählen —</option>` + M.vars.map(x => `<option value="${esc(x.id)}"${x.id === v ? ' selected' : ''}>${esc(x.name)}</option>`).join('');
function statOpts(M, v) {
  return (M.screens.length ? `<optgroup label="Bildschirm">${M.screens.map(c => `<option value="screen:${esc(c.id)}"${v === 'screen:' + c.id ? ' selected' : ''}>Bildschirm: ${esc(c.name)}</option>`).join('')}</optgroup>` : '') + `<optgroup label="Spiel"><option value="score"${v === 'score' ? ' selected' : ''}>Punkte</option><option value="lives"${v === 'lives' ? ' selected' : ''}>Leben</option><option value="time"${v === 'time' ? ' selected' : ''}>Spielzeit (Sekunden)</option></optgroup>` +
    (M.vars.length ? `<optgroup label="Variablen">${M.vars.map(x => `<option value="var:${esc(x.id)}"${v === 'var:' + x.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</optgroup>` : '') +
    (M.sprites.length ? `<optgroup label="Anzahl Figuren">${M.sprites.map(s => `<option value="count:${esc(s.id)}"${v === 'count:' + s.id ? ' selected' : ''}>Anzahl: ${esc(s.name)}</option>`).join('')}</optgroup>` : '');
}
const scrOpts = (M, v, ph) => `<option value="">${esc(ph || '— Bildschirm wählen —')}</option>` + M.screens.map(c => `<option value="${esc(c.id)}"${c.id === v ? ' selected' : ''}>${esc(c.name)}</option>`).join('');
const hasA = w => ['touch', 'edge', 'click', 'destroyed'].includes(w.type);
function targetOpts(M, when, v) {
  let o = '<option value="">— Figur wählen —</option>';
  if (when.type === 'touch') o += `<option value="@a"${v === '@a' ? ' selected' : ''}>Die erste Figur (A)</option><option value="@b"${v === '@b' ? ' selected' : ''}>Die zweite Figur (B)</option>`;
  else if (hasA(when)) o += `<option value="@a"${v === '@a' ? ' selected' : ''}>Diese Figur</option>`;
  return o + M.sprites.map(s => `<option value="${esc(s.id)}"${s.id === v ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
}
const MURL = {};
const motifUrl = id => MURL[id] || (MURL[id] = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200"><g stroke="#0d1240" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round">${(MOKI_MOTIFS.find(m => m.id === id) || { svg: '' }).svg}</g></svg>`));

// ---------- Spielfeld (SVG) ----------
function sceneCells(s) {
  const w = num(s.size) * (num(s.stretch) || 1), h = num(s.size), cols = Math.max(1, num(s.cols) | 0), rows = Math.max(1, num(s.rows) | 0), out = [];
  for (let j = 0; j < Math.min(rows, 40); j++) for (let i = 0; i < Math.min(cols, 40); i++) out.push({ cx: num(s.x) / 100 * 800 + i * (w + num(s.gapX)), cy: num(s.y) / 100 * 500 + j * (h + num(s.gapY)), w, h });
  return out;
}
function sceneShape(s, c) {
  const tr = `translate(${c.cx} ${c.cy}) rotate(${num(s.angle)})`, op = ` opacity="${Math.max(0.15, num(s.opacity))}"`;
  if (s.shape === 'text') return `<text transform="${tr}" text-anchor="middle" dominant-baseline="central" font-family="Segoe UI,system-ui,sans-serif" font-weight="800" font-size="${Math.max(10, num(s.size))}" fill="${esc(s.color)}"${op}>${esc(String(s.label || 'Text').replace(/\{score\}|\{lives\}|\{time\}/g, '0').replace(/\{[^}]+\}/g, '0'))}</text>`;
  if (MOKI_MOTIFS.some(m => m.id === s.shape && s.shape !== 'star' && s.shape !== 'heart')) return `<image transform="${tr}" href="${motifUrl(s.shape)}" x="${-c.w / 2}" y="${-c.h / 2}" width="${c.w}" height="${c.h}"${op}/>`;
  if (s.shape === 'button') return `<g transform="${tr}"${op}><rect x="${-c.w / 2}" y="${-c.h / 2}" width="${c.w}" height="${c.h}" rx="${Math.min(c.w, c.h) * 0.32}" fill="${esc(s.color)}" stroke="rgba(255,255,255,.7)" stroke-width="3"/><text text-anchor="middle" dominant-baseline="central" font-family="Segoe UI,system-ui,sans-serif" font-weight="800" font-size="${Math.max(14, Math.min(c.h * 0.42, c.w * 0.3))}" fill="#0a0d2b">${esc(String(s.label || 'Knopf').replace(/\{[^}]+\}/g, '0'))}</text></g>`;
  const st = ` fill="${esc(s.color)}" stroke="rgba(255,255,255,.6)" stroke-width="2" vector-effect="non-scaling-stroke"${op}`;
  if (s.shape === 'square') return `<rect transform="${tr}" x="${-c.w / 2}" y="${-c.h / 2}" width="${c.w}" height="${c.h}" rx="${Math.min(c.w, c.h) * 0.18}"${st}/>`;
  return `<path transform="${tr} translate(${-c.w / 2} ${-c.h / 2}) scale(${c.w / 100} ${c.h / 100})" d="${MOKI_SHAPES[s.shape] || MOKI_SHAPES.circle}" fill-rule="${s.shape === 'ring' ? 'evenodd' : 'nonzero'}"${st}/>`;
}
function sceneInner(M) {
  const S = M.settings; let h = `<defs><linearGradient id="sgbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${esc(S.bg)}"/><stop offset="1" stop-color="${esc(S.bg2 || S.bg)}"/></linearGradient></defs><rect width="800" height="500" fill="url(#sgbg)"/>`;
  for (let x = 100; x < 800; x += 100) h += `<line x1="${x}" y1="0" x2="${x}" y2="500" stroke="#fff" stroke-opacity=".06"/>`;
  for (let y = 100; y < 500; y += 100) h += `<line x1="0" y1="${y}" x2="800" y2="${y}" stroke="#fff" stroke-opacity=".06"/>`;
  h += '<rect x="0.5" y="0.5" width="799" height="499" fill="none" stroke="#fff" stroke-opacity=".25"/>';
  const vis = s => !App.scr || !s.screen || s.screen === App.scr;
  M.sprites.filter(vis).forEach(s => { const cells = sceneCells(s); h += `<g data-sid="${esc(s.id)}" style="cursor:grab">${cells.map(c => sceneShape(s, c)).join('')}</g>`; });
  const sel = M.sprites.find(s => s.id === App.sel && vis(s));
  if (sel) {
    const c = sceneCells(sel), a = c[0], z = c[c.length - 1];
    const x0 = a.cx - a.w / 2, y0 = a.cy - a.h / 2, x1 = z.cx + z.w / 2, y1 = z.cy + z.h / 2;
    h += `<rect x="${x0 - 3}" y="${y0 - 3}" width="${x1 - x0 + 6}" height="${y1 - y0 + 6}" fill="none" stroke="#00e5a8" stroke-width="2" stroke-dasharray="7 5" pointer-events="none"/>`;
    h += `<text x="${x0}" y="${Math.max(14, y0 - 8)}" fill="#00e5a8" font-size="15" font-weight="800" font-family="Segoe UI,system-ui,sans-serif" pointer-events="none">${esc(sel.name)}</text>`;
    h += `<circle data-handle="${esc(sel.id)}" cx="${a.cx + a.w / 2}" cy="${a.cy + a.h / 2}" r="9" fill="#00e5a8" stroke="#04201a" stroke-width="2" style="cursor:nwse-resize"/>`;
  }
  return h;
}
function drawScene() { const s = $('#scene'); if (s && App.g) s.innerHTML = sceneInner(App.g.model); }
let drag = null;
function scenePoint(e) { const svg = $('#scene'), pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return { x: p.x, y: p.y }; }
function markSelected() { $$('#pane-builder .cardx.sprite').forEach(c => c.classList.toggle('sel', c.dataset.sid === App.sel)); }
document.addEventListener('pointerdown', e => {
  const svg = e.target.closest && e.target.closest('#scene'); if (!svg || !App.g) return;
  const M = App.g.model, p = scenePoint(e), handle = e.target.closest('[data-handle]'), g = e.target.closest('[data-sid]');
  if (handle) { const s = M.sprites.find(x => x.id === handle.dataset.handle); drag = { mode: 'size', s }; }
  else if (g) {
    const s = M.sprites.find(x => x.id === g.dataset.sid); App.sel = s.id;
    drag = { mode: 'move', s, ox: p.x - num(s.x) / 100 * 800, oy: p.y - num(s.y) / 100 * 500, moved: false };
    markSelected();
  } else { App.sel = null; markSelected(); }
  if (drag) { try { svg.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); }
  drawScene();
});
document.addEventListener('pointermove', e => {
  if (!drag) return;
  const p = scenePoint(e), s = drag.s;
  if (drag.mode === 'move') {
    s.x = Math.round((p.x - drag.ox) / 800 * 100 * 2) / 2; s.y = Math.round((p.y - drag.oy) / 500 * 100 * 2) / 2; drag.moved = true;
  } else {
    const cx = num(s.x) / 100 * 800, cy = num(s.y) / 100 * 500, st = num(s.stretch) || 1;
    s.size = clamp(Math.round(Math.max(Math.abs(p.x - cx) * 2 / st, Math.abs(p.y - cy) * 2) / 2) * 2, 8, 600); drag.moved = true;
  }
  drawScene();
});
function endDrag() {
  if (!drag) return;
  const moved = drag.moved; drag = null;
  if (moved) { markDirty(); scheduleRun(120); }
  renderBuilder();
}
document.addEventListener('pointerup', endDrag);
document.addEventListener('pointercancel', endDrag);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
document.addEventListener('dblclick', e => {
  const g = e.target.closest && e.target.closest('#scene [data-sid]'); if (!g) return;
  const card = $(`#pane-builder .cardx.sprite[data-sid="${g.dataset.sid}"]`); if (card) { const d = $('details.more', card); if (d) d.open = true; card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});

// ---------- Karten ----------
const tools = (kind, i, n) => kind === 'screen' ? `<button class="xbtn" data-act="up-screen" data-i="${i}" type="button" aria-label="Nach oben" title="Nach oben"${i === 0 ? ' disabled' : ''}>${ic('up')}</button><button class="xbtn" data-act="down-screen" data-i="${i}" type="button" aria-label="Nach unten" title="Nach unten"${i === n - 1 ? ' disabled' : ''}>${ic('down2')}</button><button class="xbtn" data-act="del-screen" data-i="${i}" type="button" aria-label="Löschen" title="Löschen">${ic('trash')}</button>` : `<button class="xbtn" data-act="up-${kind}" data-i="${i}" type="button" aria-label="Nach oben" title="Nach oben"${i === 0 ? ' disabled' : ''}>${ic('up')}</button><button class="xbtn" data-act="down-${kind}" data-i="${i}" type="button" aria-label="Nach unten" title="Nach unten"${i === n - 1 ? ' disabled' : ''}>${ic('down2')}</button><button class="xbtn" data-act="dup-${kind}" data-i="${i}" type="button" aria-label="Duplizieren" title="Duplizieren">${ic('copy')}</button><button class="xbtn" data-act="del-${kind}" data-i="${i}" type="button" aria-label="Löschen" title="Löschen">${ic('trash')}</button>`;
function spriteCard(M, s, i) {
  const P = 'sprites.' + i + '.', ctl = s.control !== 'none', txt = s.shape === 'text', btn = s.shape === 'button';
  const sl = (label, f, min, max, step, suf) => `<label><span class="lt">${label}<b>${num(s[f])}${suf || ''}</b></span><input type="range" min="${min}" max="${max}" step="${step || 1}" data-p="${P}${f}" data-suf="${suf || ''}" value="${num(s[f])}"></label>`;
  return `<div class="cardx sprite${App.sel === s.id ? ' sel' : ''}" data-sid="${esc(s.id)}">
    <div class="chead"><span class="sw" style="background:${esc(s.color)}"></span><input class="nm" data-p="${P}name" data-re="1" value="${esc(s.name)}" maxlength="24" aria-label="Name">${tools('sprite', i, M.sprites.length)}</div>
    <div class="g2">
      <label>Aussehen<select data-p="${P}shape" data-re="1">${shapeOpts(s.shape)}</select></label>
      <label>Farbe<input type="color" data-p="${P}color" data-sw="1" value="${esc(s.color)}"></label>
      ${btn ? `<label style="grid-column:1/-1">Text auf dem Knopf<input type="text" data-p="${P}label" value="${esc(s.label)}" maxlength="24"></label>` : ''}
      ${txt ? `<label style="grid-column:1/-1">Text (mit {score}, {lives}, {time} oder {Variable})<input type="text" data-p="${P}label" value="${esc(s.label)}" maxlength="80"></label>` : ''}
      ${sl(txt ? 'Schriftgröße' : 'Größe', 'size', 8, 400, 1)}
      ${sl('Tempo', 'speed', 0, 900, 10)}
      ${sl('Start links/rechts', 'x', -10, 110, 0.5, '%')}
      ${sl('Start oben/unten', 'y', -10, 110, 0.5, '%')}
      ${M.screens.length ? `<label style="grid-column:1/-1">Zeigen auf<select data-p="${P}screen"><option value="">Allen Bildschirmen</option>${M.screens.map(c => `<option value="${esc(c.id)}"${c.id === s.screen ? ' selected' : ''}>Nur: ${esc(c.name)}</option>`).join('')}</select></label>` : ''}
      <label>Steuerung<select data-p="${P}control" data-re="1">${opt(CONTROLS, s.control)}</select></label>
      ${ctl ? `<label>Darf sich bewegen<select data-p="${P}axis">${opt(AXES, s.axis)}</select></label>` : `<label>Bewegung<select data-p="${P}motion" data-re="1">${opt(MOTIONS, s.motion)}</select></label>`}
    </div>
    <details class="more"><summary>Mehr Einstellungen</summary><div class="g2" style="margin-top:10px">
      ${sl('Breite (mal Größe)', 'stretch', 0.1, 24, 0.1)}
      ${sl('Drehung', 'angle', -180, 180, 5, '°')}
      ${sl('Dauerdrehung', 'spin', -360, 360, 10, '°/s')}
      ${sl('Deckkraft', 'opacity', 0.1, 1, 0.05)}
      <label>Physik<select data-p="${P}physics" data-re="1">${opt(PHYSICS, s.physics)}</select></label>
      ${s.physics === 'platformer' ? sl('Sprungkraft', 'jump', 200, 1100, 10) : '<span></span>'}
      ${sl('Leben der Figur', 'hp', 1, 99, 1)}
      <span></span>
      <label class="ck"><input type="checkbox" data-p="${P}solid"${s.solid ? ' checked' : ''}>Fest (Boden / Wand / Plattform)</label>
      <label class="ck"><input type="checkbox" data-p="${P}wrap"${s.wrap ? ' checked' : ''}>Kommt auf der anderen Seite wieder rein</label>
      ${s.motion === 'bounce' ? `<label class="ck"><input type="checkbox" data-p="${P}openBottom"${s.openBottom ? ' checked' : ''}>Unten offen (Ball kann herausfallen)</label>` : ''}
      ${!txt && !btn ? `<label style="grid-column:1/-1">Beschriftung in der Figur<input type="text" data-p="${P}label" value="${esc(s.label)}" maxlength="40"></label>` : ''}
      <div style="grid-column:1/-1" class="lab" style="margin:6px 0 0">Viele auf einmal (Gitter)</div>
      ${sl('Spalten', 'cols', 1, 20, 1)}${sl('Zeilen', 'rows', 1, 20, 1)}
      ${sl('Abstand waagrecht', 'gapX', 0, 80, 1)}${sl('Abstand senkrecht', 'gapY', 0, 80, 1)}
    </div></details></div>`;
}
function whenParams(M, w, P) {
  switch (w.type) {
    case 'touch': return `<select data-p="${P}a">${spOpts(M, w.a, '— Figur A —')}</select><span>und</span><select data-p="${P}b" data-re="1">${spOpts(M, w.b, '— Figur B —')}</select><span>sich berühren</span>`;
    case 'key': return `<select data-p="${P}key">${opt(KEYS, w.key)}</select><span>gedrückt wird</span>`;
    case 'hold': return `<select data-p="${P}key">${opt(KEYS, w.key)}</select><span>gehalten wird (jedes Bild)</span>`;
    case 'tap': return '<span>irgendwo getippt oder geklickt wird</span>';
    case 'edge': return `<select data-p="${P}a">${spOpts(M, w.a)}</select><span>den Bildschirm verlässt</span>`;
    case 'click': return `<select data-p="${P}a">${spOpts(M, w.a)}</select><span>angetippt wird</span>`;
    case 'destroyed': return `<select data-p="${P}a">${spOpts(M, w.a)}</select><span>zerstört wird</span>`;
    case 'every': return `<span>alle</span><input type="number" step="0.1" min="0.1" data-p="${P}n" value="${num(w.n)}"><span>Sekunden</span>`;
    case 'after': return `<span>nach</span><input type="number" step="0.1" min="0.1" data-p="${P}n" value="${num(w.n)}"><span>Sekunden (einmal)</span>`;
    case 'score': return `<span>die Punkte</span><input type="number" step="1" data-p="${P}n" value="${num(w.n)}"><span>erreichen</span>`;
    case 'screen': return `<select data-p="${P}screen">${scrOpts(M, w.screen)}</select><span>geöffnet wird</span>`;
    case 'stat': return `<select data-p="${P}stat">${statOpts(M, w.stat)}</select><select data-p="${P}op">${opt(OPS, w.op)}</select><input type="number" step="1" data-p="${P}n" value="${num(w.n)}">`;
  } return '<span>das Spiel startet</span>';
}
function actParams(M, w, a, P) {
  const T = () => `<select data-p="${P}target">${targetOpts(M, w, a.target)}</select>`, N = (f, step, min) => `<input type="number" step="${step || 1}"${min != null ? ` min="${min}"` : ''} data-p="${P}${f}" value="${num(a[f])}">`;
  switch (a.type) {
    case 'score': return `<span>Punkte um</span>${N('n')}`;
    case 'life': return `<span>Leben um</span>${N('n')}`;
    case 'setvar': return `<select data-p="${P}var">${varOpts(M, a.var)}</select><span>auf</span>${N('n')}`;
    case 'addvar': return `<select data-p="${P}var">${varOpts(M, a.var)}</select><span>um</span>${N('n')}`;
    case 'respawn': return T() + '<span>am Rand neu starten</span>';
    case 'scatter': return T() + '<span>zufällig platzieren</span>';
    case 'destroy': return T() + '<span>entfernen</span>';
    case 'place': return T() + `<span>nach X</span>${N('x', 1, 0)}<span>% Y</span>${N('y', 1, 0)}<span>%</span>`;
    case 'fly': return T() + `<select data-p="${P}dir">${opt(DIRS, a.dir)}</select><span>mit Tempo</span>${N('speed', 10, 0)}`;
    case 'stop': return T() + '<span>anhalten</span>';
    case 'move': return T() + `<select data-p="${P}dir">${opt(DIRS, a.dir)}</select><span>mit Tempo</span>${N('speed', 10, 0)}`;
    case 'jump': return T() + `<span>springt mit Kraft</span>${N('power', 10, 0)}<label class="ck" style="color:#fff"><input type="checkbox" data-p="${P}air"${a.air ? ' checked' : ''}>auch in der Luft</label>`;
    case 'shoot': return T() + `<span>schießt</span><select data-p="${P}sprite">${spOpts(M, a.sprite, '— Geschoss —')}</select><select data-p="${P}dir">${opt(DIRS, a.dir)}</select><span>Tempo</span>${N('speed', 10, 0)}`;
    case 'hurt': return T() + `<span>Schaden</span>${N('n', 1, 1)}`;
    case 'bounce': return T() + `<span>prallt ab von</span><select data-p="${P}other">${targetOpts(M, w, a.other)}</select>`;
    case 'speed': return T() + `<span>Tempo mal</span>${N('f', 0.05, 0)}`;
    case 'grow': return T() + `<span>Größe mal</span>${N('f', 0.05, 0)}`;
    case 'color': return T() + `<span>Farbe</span><input type="color" data-p="${P}color" value="${esc(a.color || '#ff4d6d')}">`;
    case 'show': return T() + `<select data-p="${P}visible" data-bool="1"><option value="true"${a.visible !== false ? ' selected' : ''}>zeigen</option><option value="false"${a.visible === false ? ' selected' : ''}>verstecken</option></select>`;
    case 'spawn': return `<select data-p="${P}sprite">${spOpts(M, a.sprite)}</select><span>neu erzeugen</span><select data-p="${P}where" data-re="1">${opt([['auto', 'am Rand (wie gewohnt)'], ['random', 'zufällig'], ['xy', 'an einem Ort']].concat(hasA(w) ? [['at@a', 'bei Figur A']] : []).concat(w.type === 'touch' ? [['at@b', 'bei Figur B']] : []), a.where || 'auto')}</select>` + (a.where === 'xy' ? `<span>X</span>${N('x', 1, 0)}<span>% Y</span>${N('y', 1, 0)}<span>%</span>` : '');
    case 'go': return `<span>zu</span><select data-p="${P}screen">${scrOpts(M, a.screen)}</select><span>wechseln</span>`;
    case 'sound': return `<select data-p="${P}sound">${opt(SOUND_OPTS, a.sound)}</select>`;
    case 'effect': return `<select data-p="${P}kind" data-re="1">${opt(EFFECT_OPTS, a.kind)}</select>` + (a.kind === 'sparks' || a.kind === 'boom' ? T() : '');
    case 'say': return `<input type="text" data-p="${P}text" value="${esc(a.text || '')}" maxlength="60" placeholder="Text">`;
    case 'win': case 'lose': return `<input type="text" data-p="${P}text" value="${esc(a.text || '')}" maxlength="40" placeholder="Text (optional)">`;
  } return '';
}
function ruleCard(M, r, i) {
  const P = 'rules.' + i + '.', w = r.when;
  return `<div class="cardx">
    <div class="rline"><span class="lbl">Wenn</span><select data-p="${P}when.type" data-re="1">${opt(EVENTS, w.type)}</select><span style="margin-left:auto;display:flex;gap:2px">${tools('rule', i, M.rules.length)}</span></div>
    <div class="rline" style="margin-left:46px">${whenParams(M, w, P + 'when.')}</div>
    ${(r.conds || []).map((c, ci) => `<div class="rline" style="margin-left:46px"><span class="lbl" style="color:var(--accent2)">nur wenn</span><select data-p="${P}conds.${ci}.stat" data-re="1">${statOpts(M, c.stat)}</select>${String(c.stat).startsWith('screen:') ? `<select data-p="${P}conds.${ci}.op">${opt(SCREEN_OPS, c.op === '!=' ? '!=' : '==')}</select>` : `<select data-p="${P}conds.${ci}.op">${opt(OPS, c.op)}</select><input type="number" step="1" data-p="${P}conds.${ci}.n" value="${num(c.n)}">`}<button class="xbtn" data-act="del-cond" data-i="${i}" data-ci="${ci}" type="button" aria-label="Bedingung löschen">${ic('x')}</button></div>`).join('')}
    <div class="then">${(r.then || []).map((a, ai) => `<div class="rline"><span class="lbl">dann</span><select data-p="${P}then.${ai}.type" data-re="1">${opt(ACTIONS, a.type)}</select><button class="xbtn" data-act="del-action" data-i="${i}" data-ai="${ai}" type="button" aria-label="Aktion löschen">${ic('x')}</button></div><div class="rline" style="margin-left:46px">${actParams(M, w, a, P + 'then.' + ai + '.')}</div>`).join('')}
      <div class="addrow" style="margin-top:6px"><button class="btn sm ghost" data-act="add-action" data-i="${i}" type="button">${ic('plus')}Aktion</button><button class="btn sm ghost" data-act="add-cond" data-i="${i}" type="button">${ic('plus')}Bedingung</button></div></div></div>`;
}
function varRow(v, i) {
  return `<div class="rline"><input type="text" data-p="vars.${i}.name" data-re="1" value="${esc(v.name)}" maxlength="20" aria-label="Name der Variable" style="min-width:120px"><span>startet bei</span><input type="number" step="1" data-p="vars.${i}.value" value="${num(v.value)}"><button class="xbtn" data-act="del-var" data-i="${i}" type="button" aria-label="Variable löschen">${ic('trash')}</button></div>`;
}
function renderBuilder() {
  const g = App.g; if (!g) return; g.model = normalizeModel(g.model);
  const M = g.model, pane = $('#pane-builder'), top = pane.scrollTop, S = M.settings;
  const openState = $$('details.bx', pane).map(d => d.open), moreOpen = $$('details.more', pane).map(d => d.open);
  pane.innerHTML = `
  ${g.mode === 'code' ? `<div class="tonote">Dieses Spiel besteht aus eigenem Code. Der Baukasten zeigt hier den alten Stand. Wenn du hier etwas änderst, wird der Code <b>ersetzt</b>, sobald du „Aus dem Baukasten übernehmen“ wählst.<div style="margin-top:10px"><button class="btn sm warn" data-act="from-builder" type="button">Aus dem Baukasten übernehmen</button></div></div>` : ''}
  <details class="bx" open><summary>${ic('game')} Spielfeld <span class="cnt">ziehen zum Verschieben</span></summary><div class="in-b">
    ${M.screens.length ? `<div class="scrtabs"><button class="tab${!App.scr ? ' on' : ''}" data-act="scr-tab" data-sid="" type="button">Alle</button>${M.screens.map(c => `<button class="tab${App.scr === c.id ? ' on' : ''}" data-act="scr-tab" data-sid="${esc(c.id)}" type="button">${esc(c.name)}</button>`).join('')}</div>` : ''}
    <svg id="scene" viewBox="0 0 800 500" role="img" aria-label="Spielfeld: Figuren zum Verschieben ziehen">${sceneInner(M)}</svg>
    <p class="hint">So sieht das Spielfeld beim Start aus. Zieh eine Figur zum Verschieben, die grüne Kugel unten rechts vergrößert sie. Doppelklick öffnet die Einstellungen.</p>
  </div></details>
  <details class="bx" open><summary>${ic('pen')} Spiel</summary><div class="in-b"><div class="g2">
    <label>Hintergrund oben<input type="color" data-p="settings.bg" value="${esc(S.bg)}"></label>
    <label>Hintergrund unten <span class="hint" style="margin:0;display:inline">(optional)</span><span style="display:flex;gap:6px"><input type="color" data-p="settings.bg2" value="${esc(S.bg2 || S.bg)}" style="flex:1"><button class="btn sm ghost" data-act="clear-bg2" type="button"${S.bg2 ? '' : ' disabled'}>Aus</button></span></label>
    <label>Muster<select data-p="settings.pattern">${opt(PATTERNS, S.pattern)}</select></label>
    <label>Leben (0 = keine)<input type="number" min="0" max="9" data-p="settings.lives" value="${num(S.lives)}"></label>
    <label>Zeit in Sekunden (0 = keine)<input type="number" min="0" max="600" data-p="settings.time" value="${num(S.time)}"></label>
    <label>Wenn die Zeit abläuft<select data-p="settings.timeMode"><option value="win"${S.timeMode === 'win' ? ' selected' : ''}>hast du gewonnen</option><option value="lose"${S.timeMode === 'lose' ? ' selected' : ''}>hast du verloren</option></select></label>
    <label><span class="lt">Schwerkraft<b>${num(S.gravity)}</b></span><input type="range" min="200" max="3000" step="50" data-p="settings.gravity" value="${num(S.gravity)}"></label>
    <label class="ck"><input type="checkbox" data-p="settings.showScore"${S.showScore ? ' checked' : ''}>Punkte anzeigen</label>
    <label style="grid-column:1/-1">Anleitung auf dem Startbildschirm<input type="text" data-p="settings.help" value="${esc(S.help)}" maxlength="70" placeholder="z. B. Pfeiltasten bewegen den Spieler"></label>
  </div></div></details>
  <details class="bx"${M.screens.length ? ' open' : ''}><summary>${ic('blocks')} Bildschirme und Menüs <span class="cnt">${M.screens.length}</span></summary><div class="in-b">
    <p class="hint" style="margin-top:0">Ein Bildschirm ist zum Beispiel das Hauptmenü, das Spiel oder die Pause. Figuren und Knöpfe zeigst du nur auf einem Bildschirm. Der oberste Bildschirm ist der Start. Ein „Menü“ hält das Spiel an. Heißt ein Bildschirm <b>Gewonnen</b> oder <b>Verloren</b>, öffnet er sich automatisch beim Sieg bzw. bei der Niederlage (Text dort: {message}).</p>
    ${M.screens.map((c, i) => `<div class="rline"><input type="text" data-p="screens.${i}.name" data-re="1" value="${esc(c.name)}" maxlength="20" aria-label="Name des Bildschirms" style="min-width:120px"><label class="ck" style="color:#fff"><input type="checkbox" data-p="screens.${i}.menu"${c.menu ? ' checked' : ''}>Menü (Spiel pausiert)</label><span style="margin-left:auto;display:flex;gap:2px">${tools('screen', i, M.screens.length)}</span></div>`).join('')}
    <div class="addrow"><button class="btn sm" data-act="add-screen" type="button">${ic('plus')}Bildschirm</button>${M.screens.length ? '' : `<button class="btn sm pri" data-act="add-menus" type="button">${ic('sparkles')}Standard-Menüs hinzufügen</button>`}</div>
  </div></details>
  <details class="bx"${M.vars.length ? ' open' : ''}><summary>${ic('blocks')} Variablen <span class="cnt">${M.vars.length}</span></summary><div class="in-b">
    <p class="hint" style="margin-top:0">Variablen merken sich eine Zahl, zum Beispiel „Schlüssel“ oder „Level“. Du kannst sie in Regeln ändern und prüfen und mit {Name} in Texten anzeigen.</p>
    ${M.vars.map(varRow).join('')}
    <div class="addrow"><button class="btn sm" data-act="add-var" type="button">${ic('plus')}Variable</button></div>
  </div></details>
  <details class="bx" open><summary>${ic('game')} Figuren <span class="cnt">${M.sprites.length}</span></summary><div class="in-b">
    ${M.sprites.length ? M.sprites.map((s, i) => spriteCard(M, s, i)).join('') : '<p class="hint">Noch keine Figuren. Füge unten eine hinzu: Spieler, Sammelobjekt oder Gegner.</p>'}
    <div class="addrow">${[['player', 'Spieler'], ['hero', 'Hüpf-Held'], ['item', 'Sammelobjekt'], ['enemy', 'Gegner'], ['bouncer', 'Springer'], ['ground', 'Boden'], ['platform', 'Plattform'], ['bullet', 'Geschoss'], ['text', 'Text'], ['button', 'Knopf'], ['blank', 'Leer']].map(([k, l]) => `<button class="btn sm${k === 'blank' ? ' ghost' : ''}" data-act="add-sprite" data-k="${k}" type="button">${ic('plus')}${l}</button>`).join('')}</div>
  </div></details>
  <details class="bx" open><summary>${ic('bolt')} Regeln <span class="cnt">${M.rules.length}</span></summary><div class="in-b">
    ${M.rules.length ? M.rules.map((r, i) => ruleCard(M, r, i)).join('') : '<p class="hint">Regeln sagen, was passiert. Zum Beispiel: „Wenn Spieler und Stern sich berühren, dann Punkte um 1.“</p>'}
    <div class="addrow"><button class="btn sm pri" data-act="add-rule" type="button">${ic('plus')}Regel</button></div>
    ${M.sprites.length > 1 && new Set(M.sprites.map(s => s.name)).size !== M.sprites.length ? '<p class="hint bad">Zwei Figuren heißen gleich. Gib ihnen verschiedene Namen.</p>' : ''}
  </div></details>`;
  $$('details.bx', pane).forEach((d, i) => { if (openState[i] === false) d.open = false; });
  $$('details.more', pane).forEach((d, i) => { if (moreOpen[i]) d.open = true; });
  pane.scrollTop = top;
}
function getPath(o, path) { return path.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
function setPath(o, path, v) { const k = path.split('.'), last = k.pop(); const t = k.reduce((a, x) => a[x], o); t[last] = v; }
function fixWhen(M, r) {
  const w = r.when, s = M.sprites;
  if (w.type === 'touch') { w.a = w.a || (s[0] && s[0].id) || ''; w.b = w.b || (s[1] && s[1].id) || (s[0] && s[0].id) || ''; }
  else if (['edge', 'click', 'destroyed'].includes(w.type)) w.a = w.a || (s[0] && s[0].id) || '';
  else if (w.type === 'key' || w.type === 'hold') w.key = w.key || 'SPACE';
  else if (w.type === 'every') w.n = w.n || 2; else if (w.type === 'after') w.n = w.n || 3;
  else if (w.type === 'score') w.n = w.n || 10;
  else if (w.type === 'screen') w.screen = w.screen || (M.screens[0] && M.screens[0].id) || '';
  else if (w.type === 'stat') { w.stat = w.stat || 'score'; w.op = w.op || '>='; if (w.n == null) w.n = 10; }
  (r.then || []).forEach(a => {
    if (a.target === '@b' && w.type !== 'touch') a.target = '';
    if (a.target === '@a' && !hasA(w)) a.target = '';
    if (a.other === '@b' && w.type !== 'touch') a.other = ''; if (a.other === '@a' && !hasA(w)) a.other = '';
    if (a.where === 'at@b' && w.type !== 'touch') a.where = 'auto'; if (a.where === 'at@a' && !hasA(w)) a.where = 'auto';
  });
}
const NEEDS_T = ['respawn', 'scatter', 'destroy', 'place', 'fly', 'stop', 'move', 'jump', 'shoot', 'hurt', 'bounce', 'speed', 'grow', 'color', 'show'];
function fixAction(M, r, a) {
  const s = M.sprites, d = { score: { n: 1 }, life: { n: -1 }, setvar: { n: 0 }, addvar: { n: 1 }, place: { x: 50, y: 50 }, fly: { dir: 'up', speed: 300 }, move: { dir: 'right', speed: 200 }, jump: { power: 640 }, shoot: { dir: 'up', speed: 520 }, hurt: { n: 1 }, speed: { f: 1.2 }, grow: { f: 1.2 }, color: { color: '#ff4d6d' }, spawn: { where: 'auto' }, sound: { sound: 'coin' }, effect: { kind: 'sparks' }, say: { text: 'Hallo!' } }[a.type];
  if (d) for (const k in d) if (a[k] == null) a[k] = d[k];
  const defT = r.when.type === 'touch' ? '@b' : (hasA(r.when) ? '@a' : (s[0] && s[0].id) || '');
  if ((NEEDS_T.includes(a.type) || (a.type === 'effect' && (a.kind === 'sparks' || a.kind === 'boom'))) && !a.target) a.target = (a.type === 'jump' || a.type === 'shoot' || a.type === 'fly' || a.type === 'move' || a.type === 'stop') ? ((hasA(r.when) ? '@a' : (s[0] && s[0].id)) || '') : defT;
  if (a.type === 'go' && !a.screen) a.screen = (M.screens[0] && M.screens[0].id) || '';
  if (a.type === 'bounce' && !a.other) a.other = r.when.type === 'touch' ? '@b' : '';
  if (a.type === 'bounce' && r.when.type === 'touch') a.target = a.target || '@a';
  if (['spawn', 'shoot'].includes(a.type) && !a.sprite) a.sprite = (s[0] && s[0].id) || '';
  if ((a.type === 'setvar' || a.type === 'addvar') && !a.var) a.var = (M.vars[0] && M.vars[0].id) || '';
}
function onBuilderInput(e) {
  const el = e.target.closest('[data-p]'); if (!el) return;
  const g = App.g, M = g.model, p = el.dataset.p;
  let v = el.type === 'checkbox' ? el.checked : (el.type === 'range' || el.type === 'number') ? (el.value === '' ? 0 : +el.value) : el.value;
  if (el.dataset.bool) v = v === 'true';
  if (e.type === 'input' && el.tagName === 'SELECT') return;
  const before = getPath(M, p);
  setPath(M, p, v);
  if (e.type === 'change' && before === v && !el.dataset.re && !/\.when\.type$|\.then\.\d+\.type$/.test(p)) return;
  if (/^sprites\.\d+\.control$/.test(p) && v !== 'none') M.sprites[+p.split('.')[1]].motion = 'none';
  const lab = el.closest('label'); if (lab && el.type === 'range') { const b = $('b', lab); if (b) b.textContent = v + (el.dataset.suf || ''); }
  if (el.dataset.sw) { const sw = el.closest('.cardx') && $('.sw', el.closest('.cardx')); if (sw) sw.style.background = v; }
  const m = /^rules\.(\d+)\.when\.type$/.exec(p); if (m) fixWhen(M, M.rules[+m[1]]);
  const m2 = /^rules\.(\d+)\.when\.(a|b)$/.exec(p); if (m2) fixWhen(M, M.rules[+m2[1]]);
  const ma = /^rules\.(\d+)\.then\.(\d+)\.(type|kind|where)$/.exec(p); if (ma) fixAction(M, M.rules[+ma[1]], M.rules[+ma[1]].then[+ma[2]]);
  if (p.endsWith('.name') && p.startsWith('sprites.')) {
    const i = +p.split('.')[1]; let n = String(v).trim() || 'Figur', k = 2, base = n;
    while (M.sprites.some((s, j) => j !== i && s.name === n)) n = base + ' ' + k++;
    M.sprites[i].name = e.type === 'change' ? n : String(v);
  }
  if (p.startsWith('screens.') && p.endsWith('.name')) { const i = +p.split('.')[1]; let n = String(v).replace(/["\\]/g, '').trim() || 'Bildschirm', k = 2, base = n; while (M.screens.some((c, j) => j !== i && c.name === n)) n = base + ' ' + k++; M.screens[i].name = e.type === 'change' ? n : String(v).replace(/["\\]/g, ''); }
  const mc = /^rules\.(\d+)\.conds\.(\d+)\.stat$/.exec(p); if (mc) { const c = M.rules[+mc[1]].conds[+mc[2]]; if (String(c.stat).startsWith('screen:')) { c.op = '=='; } else if (c.op === '==' || c.op === '!=') c.op = '>='; }
  if (p.startsWith('vars.') && p.endsWith('.name')) M.vars[+p.split('.')[1]].name = String(v).replace(/[{}]/g, '').trim() || 'Variable';
  if (p.startsWith('sprites.') || p.startsWith('settings.')) drawScene();
  if (e.type === 'change' && (el.dataset.re || m || ma || mc)) renderBuilder();
  markDirty(); if (g.mode === 'builder') scheduleRun();
}
$('#pane-builder').addEventListener('input', onBuilderInput);
$('#pane-builder').addEventListener('change', onBuilderInput);
$('#pane-builder').addEventListener('click', e => {
  const cardHead = e.target.closest('.cardx.sprite .chead'); if (cardHead && !e.target.closest('button,input')) { App.sel = cardHead.closest('.cardx').dataset.sid; markSelected(); drawScene(); }
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const g = App.g, M = g.model, a = b.dataset.act, i = +b.dataset.i, mv = (arr, from, to) => { arr.splice(to, 0, arr.splice(from, 1)[0]); };
  if (a === 'add-sprite') { const s = addSprite(M, b.dataset.k, { screen: (App.scr && M.screens.some(c => c.id === App.scr)) ? App.scr : '' }); App.sel = s.id; }
  else if (a === 'del-sprite') {
    const id = M.sprites[i].id; M.sprites.splice(i, 1); if (App.sel === id) App.sel = null;
    M.rules.forEach(r => { ['a', 'b'].forEach(k => { if (r.when[k] === id) r.when[k] = ''; }); if (r.when.stat === 'count:' + id) r.when.stat = 'score'; (r.conds || []).forEach(c => { if (c.stat === 'count:' + id) c.stat = 'score'; }); (r.then || []).forEach(x => { ['target', 'sprite', 'other'].forEach(k => { if (x[k] === id) x[k] = ''; }); }); });
  }
  else if (a === 'up-sprite') mv(M.sprites, i, i - 1); else if (a === 'down-sprite') mv(M.sprites, i, i + 1);
  else if (a === 'dup-sprite') { const c = JSON.parse(JSON.stringify(M.sprites[i])); c.id = uid('s'); let n = c.name.replace(/ \d+$/, ''), k = 2; while (M.sprites.some(s => s.name === n + ' ' + k)) k++; c.name = n + ' ' + k; c.x = Math.min(110, num(c.x) + 4); c.y = Math.min(110, num(c.y) + 4); M.sprites.splice(i + 1, 0, c); App.sel = c.id; }
  else if (a === 'add-rule') { const r = { id: uid('r'), when: { type: M.sprites.length > 1 ? 'touch' : 'start' }, conds: [], then: [{ type: 'score' }] }; fixWhen(M, r); fixAction(M, r, r.then[0]); M.rules.push(r); }
  else if (a === 'del-rule') M.rules.splice(i, 1);
  else if (a === 'up-rule') mv(M.rules, i, i - 1); else if (a === 'down-rule') mv(M.rules, i, i + 1);
  else if (a === 'dup-rule') { const c = JSON.parse(JSON.stringify(M.rules[i])); c.id = uid('r'); M.rules.splice(i + 1, 0, c); }
  else if (a === 'add-action') { const r = M.rules[i], x = { type: 'score' }; fixAction(M, r, x); r.then.push(x); }
  else if (a === 'del-action') M.rules[i].then.splice(+b.dataset.ai, 1);
  else if (a === 'add-cond') M.rules[i].conds.push({ stat: 'score', op: '>=', n: 5 });
  else if (a === 'del-cond') M.rules[i].conds.splice(+b.dataset.ci, 1);
  else if (a === 'add-var') { let n = 'Zahl', k = 2; while (M.vars.some(v => v.name === n)) n = 'Zahl ' + k++; M.vars.push({ id: uid('v'), name: n, value: 0 }); }
  else if (a === 'del-var') { const id = M.vars[i].id; M.vars.splice(i, 1); M.rules.forEach(r => { if (r.when.stat === 'var:' + id) r.when.stat = 'score'; (r.conds || []).forEach(c => { if (c.stat === 'var:' + id) c.stat = 'score'; }); (r.then || []).forEach(x => { if (x.var === id) x.var = ''; }); }); }
  else if (a === 'clear-bg2') M.settings.bg2 = '';
  else if (a === 'scr-tab') App.scr = b.dataset.sid;
  else if (a === 'add-screen') { let n = 'Bildschirm', k = 2; while (M.screens.some(c => c.name === n)) n = 'Bildschirm ' + k++; const c = { id: uid('c'), name: n, menu: true }; M.screens.push(c); App.scr = c.id; }
  else if (a === 'add-menus') { addMenus(M, g.title); App.scr = M.screens[0].id; toast('Menüs hinzugefügt: Hauptmenü, Pause, Gewonnen und Verloren', 'ok'); }
  else if (a === 'up-screen') mv(M.screens, i, i - 1); else if (a === 'down-screen') mv(M.screens, i, i + 1);
  else if (a === 'del-screen') {
    const c = M.screens[i], n = M.sprites.filter(s => s.screen === c.id).length;
    confirmBox('Bildschirm löschen?', `„${c.name}“ wird gelöscht${n ? ` und die ${n} Figur${n > 1 ? 'en' : ''} darauf auch` : ''}.`, 'Löschen', true).then(ok => {
      if (!ok) return;
      M.sprites = M.sprites.filter(s => s.screen !== c.id); M.screens.splice(M.screens.indexOf(c), 1); if (App.scr === c.id) App.scr = '';
      M.rules.forEach(r => { if (r.when.screen === c.id) r.when.screen = ''; (r.conds || []).forEach(x => { if (x.stat === 'screen:' + c.id) x.stat = 'score'; }); (r.then || []).forEach(x => { if (x.screen === c.id) x.screen = ''; }); });
      renderBuilder(); markDirty(); scheduleRun(100);
    });
    return;
  }
  else if (a === 'from-builder') { g.mode = 'builder'; g.code = ''; toast('Der Code wurde durch den Baukasten ersetzt', 'ok'); }
  else return;
  renderBuilder(); markDirty(); scheduleRun(100);
});
