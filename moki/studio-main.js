// ====================================================================
// Vorschau (geschützte Box: sandbox ohne same-origin)
// ====================================================================
const isHtmlCode = c => /^\s*(<!doctype|<html|<head|<body)/i.test(String(c));
function getSave() { try { return JSON.parse(localStorage.getItem('moki_studio_save') || '{}'); } catch (e) { return {}; } }
function buildSrcdoc(code, title) {
  const inj = '<script>window.MOKI_TITLE=' + JSON.stringify(title).replace(/</g, '\\u003c') + ';window.MOKI_SAVE=' + JSON.stringify(getSave()).replace(/</g, '\\u003c') + ';<\/script><script>' + window.MOKI_ENGINE + '<\/script>';
  if (isHtmlCode(code)) {   // ganze HTML-Seite
    let html = String(code), m = /<head[^>]*>/i.exec(html) || /<html[^>]*>/i.exec(html) || /<!doctype[^>]*>/i.exec(html), at = m ? m.index + m[0].length : 0;
    html = html.slice(0, at) + inj + html.slice(at);
    return { html, offset: html.slice(0, at).split('\n').length + inj.split('\n').length - 1 };
  }
  const pre = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + inj + '<script>\n';
  return { html: pre + String(code).replace(/<\/script/gi, '<\\/script') + '\n<\/script></body></html>', offset: pre.split('\n').length };
}
let prevOffset = 1, runTimer = 0;
function runPreview() {
  clearTimeout(runTimer);
  if (!App.g) return;
  const code = currentCode(), d = buildSrcdoc(code, App.g.title || 'Spiel');
  prevOffset = d.offset;
  const old = $('#prev'), f = document.createElement('iframe');   // frischer Frame bei jedem Start
  f.id = 'prev'; f.title = 'Vorschau'; f.setAttribute('sandbox', 'allow-scripts'); f.srcdoc = d.html; old.replaceWith(f);
  consAdd('m', 'Gestartet ' + new Date().toLocaleTimeString('de-DE'));
  setGutterError(0);
}
function scheduleRun(ms) { clearTimeout(runTimer); runTimer = setTimeout(runPreview, ms == null ? 450 : ms); }
function consAdd(kind, text) {
  const c = $('#cons'); if (!c) return;
  const d = document.createElement('div'); d.className = kind; d.textContent = text; c.appendChild(d);
  while (c.children.length > 200) c.firstChild.remove();
  c.scrollTop = c.scrollHeight;
}
addEventListener('message', e => {
  const m = e.data; if (!m || m.moki !== 1) return;
  const f = $('#prev'); if (!f || e.source !== f.contentWindow) return;
  if (m.type === 'log') consAdd(m.level === 'error' ? 'e' : m.level === 'warn' ? 'w' : '', String(m.text).slice(0, 2000));
  else if (m.type === 'error') {
    const line = m.line ? Math.max(1, m.line - prevOffset + 1) : 0;
    consAdd('e', (line ? 'Zeile ' + line + ': ' : '') + String(m.text).slice(0, 1000));
    if (line) setGutterError(line);
  } else if (m.type === 'restart') runPreview();
  else if (m.type === 'save') { const sv = getSave(); sv[String(m.key).slice(0, 60)] = m.value; try { localStorage.setItem('moki_studio_save', JSON.stringify(sv).slice(0, 200000)); } catch (e) {} }
});

// ====================================================================
// Übersicht (Meine Spiele)
// ====================================================================
async function loadMine() {
  App.loadErr = '';
  try { App.mine = await rpc('moki_my', { p_token: App.token }); } catch (e) { App.mine = []; App.loadErr = e.message; }
}
function gameCard(g) {
  const pub = g.status === 'published';
  return `<article class="gc" data-id="${esc(g.id)}">
    <div class="im">${g.icon ? `<img src="${esc(g.icon)}" alt="">` : ic('game')}<span class="st${pub ? ' pub' : ''}">${pub ? 'Veröffentlicht' : 'Entwurf'}</span></div>
    <div class="bd"><h3>${esc(g.title)}</h3><div class="mt">${g.mode === 'code' ? 'Code' : 'Baukasten'} · ${new Date(g.updated_at).toLocaleDateString('de-DE')}</div>
    <div class="acts"><button class="btn sm pri" data-act="edit" type="button">${ic('edit')}Bearbeiten</button>
    <button class="btn sm ${pub ? 'ghost' : 'warn'}" data-act="${pub ? 'unpub' : 'pub'}" type="button">${pub ? 'Zurückziehen' : 'Veröffentlichen'}</button>
    ${pub ? `<button class="btn sm ghost" data-act="copy" data-slug="${esc(g.slug)}" type="button">${ic('link')}Link</button>` : ''}
    <button class="btn sm ghost danger" data-act="del" type="button" aria-label="Löschen">${ic('trash')}</button></div></div></article>`;
}
async function showDash() {
  App.view = 'dash'; App.g = null;
  $('#view-edit').hidden = true; $('#view-dash').hidden = false;
  const el = $('#view-dash');
  el.innerHTML = `<section class="hero"><div style="flex:1;min-width:260px"><h1>Hallo ${esc(App.name)}!</h1><p>Baue dein eigenes Spiel: mit dem Baukasten ganz ohne Programmieren oder mit eigenem Code. Speichere es, und wenn du willst, erscheint es bei Moki unter „Kreationen“.</p></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn pri" id="d-new" type="button" style="padding:14px 26px;font-size:16px">${ic('plus')}Neues Spiel</button><button class="btn" id="d-ai" type="button" style="padding:14px 22px;font-size:16px">${ic('sparkles')}Mit KI bauen</button></div></section>
    <h2 class="sec">Meine Spiele</h2><p class="sub">Nur du kannst sie bearbeiten (über den Schlüssel in diesem Browser).</p><div id="d-list"><p class="sub"><span class="spin"></span> Lade …</p></div>
    <div class="keybox">${ic('link')}<span style="flex:1;min-width:200px">Deine Spiele sind an einen geheimen Schlüssel in diesem Browser gebunden. Sichere ihn, wenn du auch an einem anderen Gerät weiterbauen willst.</span><button class="btn ghost sm" id="d-key" type="button">Schlüssel anzeigen</button></div>`;
  $('#d-new').onclick = openTemplates; $('#d-ai').onclick = () => openAI('new'); $('#d-key').onclick = openKey;
  await loadMine();
  const list = $('#d-list'); if (!list || App.view !== 'dash') return;
  const draft = LS.get('moki-studio-draft', null);
  let html = '';
  if (draft && draft.g && (draft.g.dirty || !draft.g.id)) html += `<div class="note" id="d-draft"><b>Ungespeicherte Änderungen gefunden:</b> „${esc(draft.g.title)}“ <span style="display:inline-flex;gap:8px;margin-left:10px;flex-wrap:wrap"><button class="btn sm pri" data-act="draft-open" type="button">Weiterbauen</button><button class="btn sm ghost" data-act="draft-drop" type="button">Verwerfen</button></span></div>`;
  if (App.loadErr) html += `<div class="note" style="background:#4a1020;border-color:#ff6b8166;color:#ffd3da">Konnte deine Spiele nicht laden: ${esc(App.loadErr)} <button class="btn sm ghost" data-act="reload" type="button">Nochmal versuchen</button></div>`;
  html += App.mine.length ? `<div class="gg" style="margin-top:18px">${App.mine.map(gameCard).join('')}</div>` : (App.loadErr ? '' : `<div class="empty" style="margin-top:18px">Noch keine Spiele gespeichert.<br>Klick oben auf „Neues Spiel“ und leg los.</div>`);
  list.innerHTML = html;
}
$('#view-dash').addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const card = b.closest('.gc'), id = card && card.dataset.id, g = id && App.mine.find(x => x.id === id), act = b.dataset.act;
  try {
    if (act === 'edit') await openGame(id);
    else if (act === 'pub') await publish(g);
    else if (act === 'unpub') { await rpc('moki_set_published', { p_token: App.token, p_id: id, p_published: false }); toast('Zurückgezogen. Das Spiel ist bei Moki nicht mehr zu sehen.', 'ok'); showDash(); }
    else if (act === 'copy') copyText(gameUrl(b.dataset.slug));
    else if (act === 'del') { if (await confirmBox('Spiel löschen?', `„${g.title}“ wird endgültig gelöscht${g.status === 'published' ? ' und verschwindet auch bei Moki' : ''}.`, 'Löschen', true)) { await rpc('moki_delete', { p_token: App.token, p_id: id }); toast('Gelöscht', 'ok'); showDash(); } }
    else if (act === 'reload') showDash();
    else if (act === 'draft-open') { const d = LS.get('moki-studio-draft', null); if (d) { App.g = d.g; enterEditor(); } }
    else if (act === 'draft-drop') { LS.del('moki-studio-draft'); showDash(); }
  } catch (err) { toast(err.message, 'bad'); }
});
async function publish(g) {
  if (!g.icon) { await openGame(g.id); openSave(true); return; }
  const r = await rpc('moki_set_published', { p_token: App.token, p_id: g.id, p_published: true });
  toast('Veröffentlicht! Es steht jetzt bei Moki unter „Kreationen“.', 'ok', { label: 'Link kopieren', fn: () => copyText(gameUrl(r.slug)) });
  if (App.view === 'dash') showDash();
}
function openTemplates() {
  const m = modal(`<h3>Wie willst du anfangen?</h3><p class="lead">Such dir eine Vorlage aus. Du kannst später alles ändern.</p><div class="tpls">${Object.entries(TEMPLATES).map(([k, t]) => `<button class="tpl" data-k="${k}" type="button"><span class="ti">${ic(t.icon)}</span><b>${esc(t.name)}</b><span>${esc(t.desc)}</span></button>`).join('')}</div>`, { wide: true });
  m.addEventListener('click', e => { const t = e.target.closest('.tpl'); if (!t) return; m.close(); if (t.dataset.k === 'ai') { openAI('new'); return; } App.g = newGame(t.dataset.k); enterEditor(); });
}

// ====================================================================
// Mit KI bauen: fertiger Prompt für duck.ai, danach Code einfügen
// ====================================================================
const AI_URL = 'https://duck.ai/';
const AI_INTRO = `Du bist Spiele-Entwickler im "Moki Studio". Schreibe mir ein kleines Browser-Spiel in JavaScript für die Moki-Engine.

REGELN FÜR DEINE ANTWORT
- Gib NUR EINEN Code-Block mit reinem JavaScript zurück. Kein HTML, kein CSS, keine Bibliotheken, keine Bilder, keine Töne, kein Internet. Alles wird von der Engine gezeichnet.
- Schreibe die Kommentare im Code auf Deutsch. Nach dem Code höchstens 2 kurze Sätze zur Steuerung.
- Das Spiel muss mit Tastatur UND Finger (Touch) spielbar sein, ein klares Ziel haben (gewinnen oder verlieren) und beim Start sofort funktionieren.
- Benutze NUR die Funktionen, die unten stehen. Erfinde keine anderen. Die Variable Moki gibt es schon, nichts importieren. Am Ende muss game.start() stehen.

SO FUNKTIONIERT DIE MOKI-ENGINE
Das Spielfeld ist 800 x 500 groß. Figuren sind Formen oder kleine Bilder.
const game = Moki.game({ background:'#0d1240', background2:'#2b1b6b', pattern:'stars', lives:3, time:30, timeMode:'win', showScore:true, gravity:1400, help:'Anleitung' })
  background2 (optional) macht einen Farbverlauf nach unten. pattern: 'none', 'stars', 'grid', 'dots'. lives: Leben (0 = keine, bei 0 Leben ist das Spiel verloren). time: Sekunden (0 = keine). timeMode: 'win' oder 'lose' = was passiert, wenn die Zeit abläuft. help: kurzer Text auf dem Startbildschirm.
game.sprite({ name, shape, color, size, stretch, x, y, angle, spin, opacity, control, axis, motion, speed, physics, solid, hp, wrap, openBottom, jump, label, cols, rows, gapX, gapY })  legt eine Figur an und gibt sie zurück.
  shape: circle, square, triangle, diamond, star, heart, hexagon, ring, cross, arrow, text (nur Text aus label), button (Knopf mit label). Als Bilder: rocket, ghost, crown, ball, planet, car, sword, gem, pad, blob, bolt.
  color: z. B. '#00e5a8'. size: Pixel (Höhe). stretch: Breite = size * stretch (für Balken, Plattformen). angle: Drehung in Grad. spin: Grad pro Sekunde. opacity: 0 bis 1.
  x und y beim Anlegen sind PROZENT vom Spielfeld (0 bis 100, auch -5 oder 110 für knapp außerhalb).
  control: 'keys' (Pfeiltasten/WASD und Finger), 'mouse' oder 'none'. axis: 'x', 'y' oder 'xy' (wohin die gesteuerte Figur darf).
  motion: none, fall, rise, left, right, bounce (prallt an den Rändern ab), follow (verfolgt die gesteuerte Figur). speed: Pixel pro Sekunde. openBottom: true = bounce-Figur prallt unten nicht ab.
  physics: 'platformer' (Schwerkraft, springt mit Leertaste/oben/Tippen oben, steht auf Figuren mit solid:true) oder 'topdown' (stößt nur an solid-Figuren). solid: true = fester Boden/Wand/Plattform. jump: Sprungkraft (Standard 640).
  hp: Leben der Figur. wrap: true = kommt auf der anderen Seite wieder rein. label: Text in der Figur (oder bei shape 'text' der Text selbst, mit {score}, {lives}, {time} und {meineVariable}).
  cols und rows (und gapX, gapY in Pixeln) legen viele gleiche Figuren in einem Gitter an, z. B. Ziegel.
  Figuren mit motion fall/rise/left/right starten automatisch am Rand neu, wenn sie den Bildschirm verlassen.
Figur s: s.x und s.y sind zur Laufzeit PIXEL (Mitte). Außerdem s.name, s.color, s.size, s.speed, s.angle, s.label, s.visible, s.hp, s.onGround.
  s.place(xProzent, yProzent), s.respawn(), s.scatter() (zufällig), s.destroy(), s.clone(), s.touches(andereFigur), s.hurt(schaden) (bei hp 0 weg),
  s.jump(kraft, inDerLuftErlaubt), s.fly(richtung, tempo), s.stop(), s.nudge(richtung, pixel), s.shoot('GeschossName', richtung, tempo), s.bounceOff(andereFigur), s.burst(farbe).
  richtung: 'up', 'down', 'left', 'right', 'pointer' (zur Maus/zum Finger), eine Figur, ein Winkel in Grad (0 = rechts, 90 = unten) oder [dx, dy].
  Eine Figur, die als Geschoss mit shoot genutzt wird, legst du vorher mit game.sprite() an, am besten außerhalb des Bildschirms (x:-10, y:-10).
Ereignisse:
  game.onStart(() => {})   game.onUpdate(dt => {}) jedes Bild, dt in Sekunden   game.onPointer((x, y) => {}) irgendwo getippt
  game.onKey('SPACE', () => {}) (SPACE, LEFT, RIGHT, UP, DOWN, ENTER, A bis Z)   game.onKeyHold('LEFT', dt => {}) solange gehalten
  game.onTouch('NameA', 'NameB', (a, b) => {})  wenn sich zwei Figuren berühren (a und b sind die beteiligten Figuren)
  game.onEdge('Name', s => {}) Figur verlässt den Bildschirm.   game.onClick('Name', s => {}) Figur angetippt.   game.onDestroy('Name', s => {}) Figur zerstört.
  game.onScreen('Name', () => {}) wenn ein Bildschirm (Menü) geöffnet wird
  game.every(sekunden, () => {})   game.after(sekunden, () => {}) einmal   game.onScore(punkte, () => {})   game.when(() => game.get('Schlüssel') >= 3, () => {}) wenn die Bedingung wahr wird
Aktionen: game.addScore(n)  game.addLife(n)  game.say('Text', sekunden)  game.win('Text')  game.lose('Text')  game.restart()
  game.spawn('Name') (neue Kopie einer Figur, startet am Rand)  game.find('Name')  game.all('Name')  game.count('Name')  game.random(min, max)
  game.set('Name', wert)  game.change('Name', plusMinus)  game.get('Name')  (eigene Zahlen-Variablen)
  game.sound('coin' | 'hit' | 'jump' | 'shoot' | 'pop' | 'powerup' | 'explosion' | 'win' | 'lose')  game.shake(ms)  game.flash('#fff')  game.burst(xProzent, yProzent, farbe, anzahl)
  Lesen: game.score, game.lives, game.time. Figuren mit gleichem name sind eine Gruppe, auch Kopien.
Menüs und Bildschirme (optional): Moki.game({ screens:[{ name:'Hauptmenü', menu:true }, { name:'Spiel', menu:false }, { name:'Pause', menu:true }] }) legt Bildschirme an. Der erste ist der Start. menu:true hält das Spiel an (nur Knöpfe und Texte reagieren).
  Bei jeder Figur sagt screen:'Name', auf welchem Bildschirm sie erscheint (ohne screen auf allen). game.go('Spiel') wechselt den Bildschirm, game.screen ist der aktuelle.
  shape:'button' macht einen Knopf mit label als Beschriftung. Er reagiert mit game.onClick('Knopfname', () => game.go('Spiel')). Texte: shape:'text'.
  Gibt es Bildschirme namens 'Gewonnen' und 'Verloren', öffnen sie sich automatisch bei game.win/game.lose; {message} zeigt dort den Text von win/lose an. game.restart() startet das ganze Spiel neu (zurück ins Hauptmenü).

BEISPIEL (ein komplettes, funktionierendes Spiel)
\`\`\`javascript
${STARTER_CODE}\`\`\`

Wenn dir etwas fehlt, baue es mit diesen Funktionen nach. Das ist mein Wunsch:
FORTGESCHRITTEN (nur bei Bedarf benutzen)
- game.sprite hat auch: motion 'patrol','wander','orbit'(radius),'sine'(amp,freq),'drift'; physics 'body' (bounciness); glow, outline, z, fixed, hitbox:'circle', image:'https://…'; world: Moki.game({worldWidth, worldHeight}) und game.camera.follow(figur).
- game.level(zeilen, legende, zellgroesse) baut ein Level aus Text. game.art(name, zeilen, palette) erzeugt Pixel-Art, danach shape:name.
- game.onDraw(ctx=>…), game.onDrawBack, game.onDrawHud zum selbst Zeichnen. game.emit(x,y,{count,color,speed,angle,spread,gravity,life}) für Partikel. s.tween({size:90},0.4,'bounce'). await game.wait(sek).
- game.music('retro'|'chill'|'action'|'space'), game.tone(freq,dauer,typ), game.save(key,wert), game.load(key,standard), game.best, game.timeScale, game.math.lerp/clamp/dist/noise/choose.
`;
const aiPrompt = req => AI_INTRO + ' ' + (req || '').trim();
function extractCode(text) {
  const t = String(text || '').replace(/\r/g, '');
  const blocks = [...t.matchAll(/```[a-zA-Z]*\n([\s\S]*?)```/g)].map(m => m[1]);
  if (blocks.length) return blocks.sort((a, b) => b.length - a.length)[0].trim() + '\n';
  const open = /```[a-zA-Z]*\n([\s\S]*)$/.exec(t);   // Block ohne schließende Klammern
  return (open ? open[1] : t).trim() + '\n';
}
function openAI(mode) {
  const replace = mode === 'replace' && App.g;
  const m = modal(`<h3>Keine Lust, selbst zu bauen?</h3>
    <p class="lead">Dann lass eine KI das Spiel schreiben. Das geht in drei Schritten, ohne Anmeldung.</p>
    <div class="aistep"><span class="n">1</span><div style="flex:1"><b>Schreib, was du haben willst</b>
      <textarea class="in" id="ai-req" rows="3" maxlength="600" placeholder="z. B. Ein Spiel, in dem ich ein Raumschiff steuere und Meteoriten ausweiche. Wer 30 Sekunden überlebt, gewinnt." autofocus></textarea></div></div>
    <div class="aistep"><span class="n">2</span><div style="flex:1"><b>Kopiere den Prompt und öffne duck.ai</b>
      <p class="hint" style="margin-top:2px">Der Prompt erklärt der KI, wie Moki-Spiele funktionieren, und hängt deinen Wunsch hinten an. Füge ihn dort einfach in das Chatfenster ein.</p>
      <div class="addrow" style="margin-top:8px"><button class="btn pri" id="ai-copy" type="button" disabled>${ic('copy')}Prompt kopieren</button><a class="btn" id="ai-open" href="${AI_URL}" target="_blank" rel="noopener noreferrer">${ic('ext')}duck.ai öffnen</a></div>
      <details style="margin-top:10px"><summary class="hint" style="cursor:pointer">Prompt ansehen</summary><textarea class="in" id="ai-prompt" rows="7" readonly style="font:12.5px/1.5 ui-monospace,Menlo,Consolas,monospace;margin-top:8px"></textarea></details></div></div>
    <div class="aistep"><span class="n">3</span><div style="flex:1"><b>Füge die Antwort der KI hier ein</b>
      <textarea class="in" id="ai-code" rows="4" placeholder="Hier den ganzen Code oder die ganze Antwort der KI einfügen"></textarea></div></div>
    <div class="note" style="margin-top:6px;font-size:14px">duck.ai ist ein Dienst von DuckDuckGo, nicht von Moki. Schick dort keine privaten Daten hin. Die KI macht manchmal Fehler: Wenn das Spiel nicht läuft, siehst du die Fehlermeldung in der Konsole. Kopier sie in den Chat und bitte die KI, den Fehler zu beheben.</div>
    <div class="err" id="ai-err"></div>
    <div class="mfoot"><button class="btn ghost" id="ai-x" type="button">Abbrechen</button><button class="btn pri" id="ai-go" type="button" disabled>${replace ? 'In dieses Spiel einsetzen' : 'Als neues Spiel öffnen'}</button></div>`, { wide: true });
  const R = s => $(s, m), upd = () => {
    const req = R('#ai-req').value.trim(), has = req.length >= 5;
    R('#ai-prompt').value = aiPrompt(req); R('#ai-copy').disabled = !has; R('#ai-go').disabled = R('#ai-code').value.trim().length < 20;
  };
  R('#ai-req').addEventListener('input', upd); R('#ai-code').addEventListener('input', upd); upd();
  R('#ai-copy').onclick = () => copyText(aiPrompt(R('#ai-req').value));
  R('#ai-x').onclick = () => m.close();
  R('#ai-go').onclick = async () => {
    const code = extractCode(R('#ai-code').value);
    if (!/Moki\.game\s*\(/.test(code)) { R('#ai-err').textContent = 'Das sieht nicht nach Moki-Code aus (es fehlt Moki.game). Hast du die ganze Antwort der KI eingefügt?'; return; }
    if (code.length > 100000) { R('#ai-err').textContent = 'Der Code ist zu lang.'; return; }
    if (replace) {
      const g = App.g;
      if (g.mode === 'code' && g.code.trim() && g.code.trim() !== code.trim() && !(await confirmBox('Code ersetzen?', 'Dein bisheriger Code wird durch den Code der KI ersetzt.', 'Ersetzen', true))) return;
      g.mode = 'code'; g.code = code; markDirty(); m.close(); setTab('code'); runPreview(); toast('Code eingesetzt', 'ok');
    } else {
      m.close(); App.g = newGame('code'); App.g.code = code; App.g.title = 'Mein KI-Spiel'; enterEditor(); toast('Fertig! Probier das Spiel in der Vorschau.', 'ok');
    }
  };
}
async function openGame(id) {
  const row = await rpc('moki_get_mine', { p_token: App.token, p_id: id });
  App.g = { id: row.id, slug: row.slug, title: row.title, description: row.description || '', creator: row.creator, icon: row.icon, status: row.status, dirty: false, mode: row.mode, model: row.builder || newModel(), code: row.code || '' };
  enterEditor();
}

// ====================================================================
// Name und Schlüssel
// ====================================================================
function askName(first) {
  return new Promise(res => {
    const m = modal(`<h3>${first ? 'Willkommen im Moki Studio' : 'Dein Name'}</h3><p class="lead">${first ? 'Wie heißt du? Dein Name steht bei deinen Spielen auf Moki („Made by …“).' : 'So steht dein Name bei neuen und gespeicherten Spielen.'}</p>
      <label class="fld">Name<input type="text" id="nm" maxlength="24" autocomplete="nickname" autofocus value="${esc(App.name)}" placeholder="z. B. Anton"></label><div class="err" id="nm-e"></div>
      <div class="mfoot">${first ? '' : '<button class="btn ghost" id="nm-c" type="button">Abbrechen</button>'}<button class="btn pri" id="nm-ok" type="button">${first ? 'Los geht’s' : 'Speichern'}</button></div>`, { sticky: first, onClose: () => res(false) });
    const go = () => {
      const v = $('#nm', m).value.replace(/\s+/g, ' ').trim();
      if (v.length < 2) { $('#nm-e', m).textContent = 'Bitte mindestens 2 Zeichen.'; return; }
      App.name = v; LS.set('moki-studio-name', v); $('#who-name').textContent = v; res(true); m.remove();
    };
    $('#nm-ok', m).onclick = go; $('#nm', m).addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    const c = $('#nm-c', m); if (c) c.onclick = () => m.close();
  });
}
function openKey() {
  const m = modal(`<h3>Dein Studio-Schlüssel</h3><p class="lead">Mit diesem Schlüssel bearbeitest du deine Spiele. <b>Gib ihn niemandem</b>: Wer ihn kennt, kann deine Spiele ändern oder löschen. Speichere ihn irgendwo, falls du an einem anderen Gerät weiterbauen willst.</p>
    <label class="fld">Dein Schlüssel<input type="text" class="in" id="k-v" readonly value="${esc(App.token)}"></label>
    <div class="mfoot" style="justify-content:flex-start;margin-top:0"><button class="btn sm" id="k-c" type="button">Kopieren</button></div>
    <h3 style="font-size:18px;margin-top:22px">Schlüssel von einem anderen Gerät einsetzen</h3>
    <label class="fld" style="margin-top:10px"><input type="text" class="in" id="k-n" placeholder="Schlüssel hier einfügen" autocomplete="off"></label><div class="err" id="k-e"></div>
    <div class="mfoot"><button class="btn ghost" id="k-x" type="button">Schließen</button><button class="btn pri" id="k-ok" type="button">Einsetzen</button></div>`);
  $('#k-c', m).onclick = () => copyText(App.token); $('#k-x', m).onclick = () => m.close();
  $('#k-ok', m).onclick = () => {
    const v = $('#k-n', m).value.trim();
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(v)) { $('#k-e', m).textContent = 'Das sieht nicht wie ein Schlüssel aus.'; return; }
    LS.set('moki-studio-key', v); App.token = v; m.close(); toast('Schlüssel eingesetzt', 'ok'); showDash();
  };
}

// ====================================================================
// Editor
// ====================================================================
let dirtyTimer = 0;
function markDirty() {
  const g = App.g; if (!g) return;
  g.dirty = true; updateState();
  clearTimeout(dirtyTimer); dirtyTimer = setTimeout(() => LS.set('moki-studio-draft', { g: App.g, t: Date.now() }), 700);
}
function updateState() {
  const g = App.g; if (!g) return; const s = $('#e-state');
  s.textContent = g.dirty ? 'Nicht gespeichert' : (g.id ? 'Gespeichert' : ''); s.className = 'state ' + (g.dirty ? 'dirty' : 'ok');
  $('#e-pub-t').textContent = g.status === 'published' ? 'Veröffentlicht' : 'Veröffentlichen';
}
function enterEditor() {
  App.view = 'edit'; App.tab = App.g.mode === 'code' ? 'code' : 'builder';
  $('#view-dash').hidden = true; $('#view-edit').hidden = false;
  $('#e-title').value = App.g.title; $('#cons').innerHTML = '';
  setTab(App.tab); updateState(); runPreview();
  if (App.g.dirty) LS.set('moki-studio-draft', { g: App.g, t: Date.now() });
}
$('#e-title').addEventListener('input', e => { App.g.title = e.target.value; markDirty(); });
$('#e-title').addEventListener('change', () => scheduleRun(100));
$('#e-run').onclick = runPreview;
$('#cons-clear').onclick = () => { $('#cons').innerHTML = ''; };
$('#e-back').onclick = async () => {
  if (App.g && App.g.dirty && !(await confirmBox('Ungespeicherte Änderungen', 'Du hast Änderungen noch nicht gespeichert. Sie bleiben als Entwurf in diesem Browser, bis du sie speicherst oder verwirfst.', 'Trotzdem zurück'))) return;
  showDash();
};
function setTab(t) {
  App.tab = t;
  $$('.ltabs .tab').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  const pb = $('#pane-builder'), pc = $('#pane-code');
  pb.hidden = t !== 'builder'; pb.style.display = t === 'builder' ? '' : 'none';
  pc.hidden = t !== 'code'; pc.style.display = t === 'code' ? 'flex' : 'none';
  if (t === 'builder') renderBuilder(); else renderCode();
}
$$('.ltabs .tab').forEach(b => b.onclick = () => setTab(b.dataset.tab));

// ---------- Code-Editor ----------
const HELP = `<h4>Spiel anlegen</h4><p><code>const game = Moki.game({ background:'#0d1240', background2:'#2b1b6b', pattern:'stars', lives:3, time:30, gravity:1400, help:'Anleitung' })</code><br>Am Ende immer <code>game.start()</code>. Das Spielfeld ist 800 × 500 groß.</p>
<h4>Figuren</h4><p><code>game.sprite({ name, shape, color, size, stretch, x, y, angle, spin, opacity, control, axis, motion, speed, physics, solid, hp, wrap, jump, label, cols, rows, gapX, gapY })</code><br>
Formen: circle, square, triangle, diamond, star, heart, hexagon, ring, cross, arrow, text, button · Bilder: rocket, ghost, crown, ball, planet, car, sword, gem, pad, blob, bolt<br>
Steuerung: 'keys' oder 'mouse' · Bewegung: fall, rise, left, right, bounce, follow · Physik: 'platformer' (Schwerkraft und Springen) oder 'topdown' · <code>solid:true</code> für festen Boden und Wände.<br>
<code>x</code> und <code>y</code> sind beim Anlegen Prozent (0 bis 100). Zur Laufzeit sind <code>s.x</code> und <code>s.y</code> Pixel. Mit <code>cols</code> und <code>rows</code> entsteht ein Gitter aus vielen gleichen Figuren.</p>
<p><code>s.place(x%, y%)</code> · <code>s.respawn()</code> · <code>s.scatter()</code> · <code>s.destroy()</code> · <code>s.clone()</code> · <code>s.touches(andere)</code> · <code>s.hurt(1)</code> · <code>s.jump(kraft)</code> · <code>s.fly('up', 300)</code> · <code>s.stop()</code> · <code>s.shoot('Kugel', 'up', 600)</code> · <code>s.bounceOff(andere)</code> · <code>s.burst()</code></p>
<h4>Ereignisse</h4><p><code>game.onStart(() => {})</code> · <code>game.onUpdate(dt => {})</code> (jedes Bild) · <code>game.onPointer((x, y) => {})</code><br><code>game.onKey('SPACE', () => {})</code> · <code>game.onKeyHold('LEFT', dt => {})</code> (Tasten: SPACE, LEFT, RIGHT, UP, DOWN, ENTER, A bis Z)<br>
<code>game.onTouch('Spieler', 'Stern', (a, b) => {})</code> · <code>game.onEdge('Stein', s => {})</code> · <code>game.onClick('Ziel', s => {})</code> · <code>game.onDestroy('Gegner', s => {})</code><br><code>game.every(2, () => {})</code> · <code>game.after(5, () => {})</code> · <code>game.onScore(10, () => {})</code> · <code>game.when(() => game.get('Level') >= 3, () => {})</code></p>
<h4>Aktionen</h4><p><code>game.addScore(1)</code> · <code>game.addLife(-1)</code> · <code>game.say('Text', 2)</code> · <code>game.win('Geschafft!')</code> · <code>game.lose('Pech')</code> · <code>game.restart()</code><br>
<code>game.spawn('Stern')</code> neue Figur · <code>game.find('Spieler')</code> · <code>game.all('Stern')</code> · <code>game.count('Ziegel')</code> · <code>game.random(a, b)</code><br>
<code>game.set('Schlüssel', 0)</code> · <code>game.change('Schlüssel', 1)</code> · <code>game.get('Schlüssel')</code> (eigene Variablen) · <code>game.score</code>, <code>game.lives</code>, <code>game.time</code><br>
<code>game.sound('coin')</code> (coin, hit, jump, shoot, pop, powerup, explosion, win, lose) · <code>game.shake(300)</code> · <code>game.flash('#fff')</code> · <code>game.burst(x%, y%, farbe)</code></p>
<h4>Menüs und Bildschirme</h4><p><code>Moki.game({ screens:[{ name:'Hauptmenü', menu:true }, { name:'Spiel', menu:false }] })</code> · Figur mit <code>screen:'Spiel'</code> erscheint nur dort · <code>game.go('Spiel')</code> wechselt · <code>game.onScreen('Spiel', () => {})</code><br>
Ein Knopf ist <code>shape:'button'</code> mit <code>label:'Spielen'</code>, dazu <code>game.onClick('Knopfname', () => game.go('Spiel'))</code>. Bildschirme namens <code>Gewonnen</code> und <code>Verloren</code> öffnen sich automatisch; <code>{message}</code> zeigt den Text an.</p>
<h4>Texte anzeigen</h4><p>Eine Figur mit <code>shape:'text'</code> und <code>label:'Punkte: {score} Leben: {lives}'</code> zeigt Werte live an. Auch <code>{Schlüssel}</code> für eigene Variablen.</p>
<h4>Mehr Möglichkeiten (Engine 3)</h4><p><b>Große Welt und Kamera:</b> <code>Moki.game({ worldWidth:2400, worldHeight:1000, zoom:1 })</code> · <code>game.camera.follow(figur, 0.1)</code> · <code>game.camera.zoom = 1.5</code> · <code>game.camera.center(x, y)</code> · <code>fixed:true</code> bei einer Figur lässt sie am Bildschirm kleben (Anzeigen, Knöpfe) · <code>scroll:0.5</code> für Parallax.<br>
<b>Level aus Text:</b> <code>game.level(['#####','#  o#','#####'], { '#': {shape:'square', solid:true}, 'o': {shape:'star', name:'Stern'} }, 40)</code> baut ein ganzes Level. Außerdem <code>copies:[[x%,y%],…]</code> und <code>at:[pixelX, pixelY]</code> bei <code>game.sprite</code>.<br>
<b>Eigene Bilder:</b> <code>game.art('Männchen', ['..00..','.0000.','..00..'], ['#222','#fc0'])</code> zeichnet Pixel-Art (Zeichen = Farbnummer 0-9 a-f, Punkt = leer; mehrere Bilder als Liste ergeben eine Animation). Danach <code>shape:'Männchen'</code>. Mit <code>image:'https://…'</code> klappt auch ein Bild aus dem Netz.<br>
<b>Bewegung:</b> <code>motion</code> auch 'patrol', 'wander', 'orbit' (<code>radius</code>), 'sine' (<code>amp</code>, <code>freq</code>), 'drift' · <code>physics:'body'</code> = Ball-Physik (<code>bounciness</code>, <code>drag</code>) · <code>s.follow(ziel, tempo, dt)</code> · <code>s.face(ziel)</code> · <code>s.distanceTo(ziel)</code> · <code>s.angleTo(ziel)</code> · <code>s.tween({ size: 90 }, 0.4, 'bounce')</code> (easing: linear, in, out, inout, back, bounce, elastic) · <code>game.tween(obj, props, sek)</code> · <code>await game.wait(1.5)</code>.<br>
<b>Aussehen:</b> <code>glow</code>, <code>outline</code>, <code>outlineWidth</code>, <code>flipX</code>, <code>z</code> (Ebene), <code>visible</code>, <code>hitbox:'circle'</code> · Partikel: <code>game.emit(x, y, { count, color:[…], speed, angle, spread, gravity, life, size })</code>.<br>
<b>Selbst zeichnen:</b> <code>game.onDrawBack(ctx => …)</code> (hinter den Figuren), <code>game.onDraw(ctx => …)</code> (in der Welt), <code>game.onDrawHud(ctx => …)</code> (über allem) mit dem normalen Canvas-<code>ctx</code>. Helfer: <code>game.ui.text / rect / circle / line / bar</code>.<br>
<b>Eingabe:</b> <code>game.key('A')</code> · <code>game.pointer.x/.y/.down</code> · <code>game.onKeyUp</code> · <code>game.onPointerMove</code> · <code>game.onPointerUp</code> · <code>game.onWheel</code> · <code>game.gamepad(0)</code> · <code>game.onDestroy</code>.<br>
<b>Ton:</b> <code>game.music('retro' | 'chill' | 'action' | 'space')</code> (<code>null</code> = aus) · <code>game.tone(440, 0.2, 'square')</code> · <code>game.sweep(900, 200, 0.3)</code> · <code>game.noise(0.3)</code> · <code>game.volume(0.5)</code> · Taste M schaltet den Ton aus.<br>
<b>Speichern:</b> <code>game.save('level', 3)</code> und <code>game.load('level', 1)</code> bleiben auf dem Gerät erhalten · <code>game.best</code> ist der Rekord (mit <code>showBest:true</code> sichtbar).<br>
<b>Zeit:</b> <code>game.timeScale = 0.3</code> (Zeitlupe) · <code>game.pause()</code> · <code>game.resume()</code> · <code>game.math.lerp / clamp / dist / angle / map / noise / choose / shuffle / randInt</code>.</p>
<h4>Ganze HTML-Seite (alles ist erlaubt)</h4><p>Beginnt dein Code mit <code>&lt;!doctype html&gt;</code>, wird er als <b>komplette Webseite</b> ausgeführt. Dann kannst du eigenes HTML, CSS, Canvas, WebGL, Web Audio, SVG und eigene Skripte benutzen, ganz ohne Moki-Engine. Die Engine (<code>Moki.game</code>) ist trotzdem verfügbar, wenn du sie brauchst. Aus Sicherheitsgründen läuft alles in einer geschützten Box: kein Zugriff auf Moki, Cookies oder Speicher der Seite, keine Formulare, keine neuen Fenster.</p>
<h4>Tipp</h4><p>Mit <code>console.log(...)</code> schreibst du in die Konsole unter der Vorschau. Fehler zeigen die Zeile an.</p>`;
function hl(src) {
  const e = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|\b(const|let|var|function|return|if|else|for|while|true|false|null|new|of|in|break|continue|this|async|await|switch|case|default)\b|\b(\d+\.?\d*)\b|\b(game|Moki)\b/g;
  let out = '', last = 0, m;
  while ((m = re.exec(src))) {
    out += e(src.slice(last, m.index));
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'n' : 'g';
    out += `<span class="tk-${cls}">${e(m[0])}</span>`; last = m.index + m[0].length;
  }
  return out + e(src.slice(last)) + '\n ';
}
function renderGutter(code, errLine) {
  const n = code.split('\n').length; let h = '';
  for (let i = 1; i <= n; i++) h += `<div${i === errLine ? ' class="er"' : ''}>${i}</div>`;
  return h;
}
let errLine = 0;
function setGutterError(n) { errLine = n; const g = $('#gut'); const ta = $('#ta'); if (g && ta) g.innerHTML = renderGutter(ta.value, n); }
function renderCode() {
  const g = App.g, pane = $('#pane-code'), ro = g.mode === 'builder', code = currentCode();
  pane.innerHTML = `<div class="ctools">
      <button class="btn sm ghost" id="c-help" type="button">${ic('code')}Hilfe</button>
      ${ro ? '' : `<button class="btn sm ghost" id="c-snip" type="button">${ic('plus')}Bausteine</button>`}
      <button class="btn sm" id="c-ai" type="button">${ic('sparkles')}Mit KI bauen</button>
      ${ro ? `<button class="btn sm warn" id="c-edit" type="button">${ic('edit')}Code bearbeiten</button>` : `<button class="btn sm ghost" id="c-run" type="button">${ic('down')}Ausführen (Strg+Enter)</button>`}
      ${!ro && g.model ? `<button class="btn sm ghost" id="c-back" type="button">Zurück zum Baukasten</button>` : ''}
    </div>
    ${ro ? '<div class="tonote">Das ist der Code, den dein Baukasten gerade erzeugt. Willst du ihn selbst ändern, klick auf „Code bearbeiten“. Danach läuft das Spiel nur noch mit deinem Code.</div>' : ''}
    <div class="ce"><div class="gut" id="gut"></div><div class="cw"><pre aria-hidden="true"><code id="hl"></code></pre><textarea id="ta" spellcheck="false" wrap="off" autocomplete="off" autocapitalize="off" aria-label="Spiel-Code"${ro ? ' readonly' : ''}></textarea></div></div>
    <div class="help" id="help" hidden>${HELP}</div>`;
  const ta = $('#ta', pane), hlc = $('#hl', pane), gut = $('#gut', pane), pre = $('pre', pane);
  const paint = () => { hlc.innerHTML = hl(ta.value); gut.innerHTML = renderGutter(ta.value, errLine); };
  ta.value = code; paint();
  ta.addEventListener('scroll', () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; gut.scrollTop = ta.scrollTop; });
  ta.addEventListener('input', () => { if (!ro) { App.g.code = ta.value; markDirty(); } errLine = 0; paint(); });
  ta.addEventListener('keydown', e => {
    if (ro) return;
    if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
    else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      const s = ta.selectionStart, before = ta.value.slice(0, s), ind = (before.split('\n').pop().match(/^\s*/) || [''])[0] + (/[{(\[]\s*$/.test(before) ? '  ' : '');
      e.preventDefault(); ta.setRangeText('\n' + ind, s, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input'));
    }
  });
  const csn = $('#c-snip', pane); if (csn) csn.onclick = openSnippets;
  $('#c-ai', pane).onclick = () => openAI('replace');
  $('#c-help', pane).onclick = () => { const h = $('#help', pane); h.hidden = !h.hidden; };
  const ce = $('#c-edit', pane); if (ce) ce.onclick = async () => { if (await confirmBox('Code bearbeiten?', 'Ab jetzt läuft dein Spiel mit dem Code. Im Baukasten kannst du es nicht mehr weiterbauen, außer du übernimmst den Baukasten später wieder (dann geht dein Code verloren).', 'Code bearbeiten')) { g.mode = 'code'; g.code = code; markDirty(); renderCode(); } };
  const cr = $('#c-run', pane); if (cr) cr.onclick = runPreview;
  const cb = $('#c-back', pane); if (cb) cb.onclick = async () => { if (await confirmBox('Zurück zum Baukasten?', 'Dein eigener Code geht verloren, das Spiel wird wieder aus dem Baukasten gebaut.', 'Zurück zum Baukasten', true)) { g.mode = 'builder'; g.code = ''; markDirty(); setTab('builder'); scheduleRun(100); } };
}

// ====================================================================
// Speichern und Veröffentlichen
// ====================================================================
async function saveGame(newIcon) {
  const g = App.g;
  const r = await rpc('moki_save', { p_token: App.token, p_id: g.id, p_creator: App.name, p_title: (g.title || '').trim(), p_description: g.description || '', p_mode: g.mode, p_builder: g.mode === 'builder' ? g.model : null, p_code: currentCode(), p_icon: newIcon || null });
  g.id = r.id; g.slug = r.slug; g.dirty = false; g.creator = App.name; if (newIcon) g.icon = newIcon;
  LS.del('moki-studio-draft'); updateState();
  return r;
}
async function quickSave() {
  const g = App.g; if (!g || App.view !== 'edit') return;
  if (!(g.title || '').trim()) { toast('Gib deinem Spiel einen Namen', 'bad'); $('#e-title').focus(); return; }
  if (!g.icon) { openSave(false); return; }
  const b = $('#e-save'); b.disabled = true;
  try { await saveGame(null); toast('Gespeichert', 'ok'); } catch (e) { toast(e.message, 'bad'); }
  b.disabled = false;
}
$('#e-save').onclick = quickSave;
$('#e-pub').onclick = async () => {
  const g = App.g;
  if (g.status === 'published') { if (g.dirty) await quickSave(); toast('Dein Spiel ist veröffentlicht. Änderungen sind sofort bei Moki zu sehen.', 'ok', g.slug ? { label: 'Link kopieren', fn: () => copyText(gameUrl(g.slug)) } : null); return; }
  if (!g.icon || !g.id || g.dirty) { openSave(true); return; }
  try { const r = await rpc('moki_set_published', { p_token: App.token, p_id: g.id, p_published: true }); g.status = 'published'; updateState(); toast('Veröffentlicht! Es steht jetzt bei Moki unter „Kreationen“.', 'ok', { label: 'Link kopieren', fn: () => copyText(gameUrl(r.slug)) }); } catch (e) { toast(e.message, 'bad'); }
};
function openSave(publishNow) {
  const g = App.g;
  let st = g.icon ? { kind: 'keep', url: g.icon } : null, motif = 'rocket', pal = 0, tab = 'built';
  const m = modal(`<h3>Speichern</h3><p class="lead">Gib deinem Spiel einen Namen und such ein Bild aus. Das Bild ist die Kachel bei Moki.</p>
    <div class="ipick"><div class="iprev"><div class="tilep" id="tp"><div class="none">Wähle ein Bild</div><div class="nm" id="tp-n"></div></div><span class="hint" style="text-align:center">So sieht deine Kachel aus</span></div>
    <div><label class="fld">Name<input type="text" id="s-t" maxlength="60" value="${esc(g.title)}" autofocus></label>
      <label class="fld">Beschreibung (optional)<textarea id="s-d" maxlength="160" rows="2" placeholder="Worum geht es in deinem Spiel?">${esc(g.description)}</textarea></label>
      <div class="tabs"><button class="tab on" data-t="built" type="button">Bild bauen</button><button class="tab" data-t="up" type="button">Eigenes Bild</button></div>
      <div id="t-built"><div class="lab">Motiv</div><div class="mgrid">${ICON_MOTIFS.map(x => `<button class="mo" data-m="${x.id}" type="button" title="${esc(x.name)}" aria-label="${esc(x.name)}">${iconMini(x.id)}</button>`).join('')}</div>
        <div class="lab">Farben</div><div class="pgrid">${ICON_PALS.map((p, i) => `<button class="pa" data-p="${i}" type="button" style="background:linear-gradient(135deg,${p[0]},${p[1]})" aria-label="Farbe ${i + 1}"></button>`).join('')}</div></div>
      <div id="t-up" hidden><div class="lab">Bild von deinem Gerät</div><input type="file" id="s-f" accept="image/*" class="in"><p class="hint">Es wird quadratisch zugeschnitten (Mitte) und verkleinert. Nimm ein Bild, das zu den Moki-Kacheln passt: bunt, groß und ohne viel Text.</p></div></div></div>
    <div class="err" id="s-e"></div>
    <div class="mfoot"><button class="btn ghost" id="s-x" type="button">Abbrechen</button><button class="btn" id="s-d1" type="button" disabled>Als Entwurf speichern</button><button class="btn pri" id="s-p" type="button" disabled>Speichern und veröffentlichen</button></div>`, { wide: true });
  const R = s => $(s, m), setTile = () => {
    const url = st ? (st.kind === 'built' ? svgUrl(iconSvg(st.motif, st.pal)) : st.url) : null;
    R('#tp').innerHTML = (url ? `<img src="${esc(url)}" alt="">` : '<div class="none">Wähle ein Bild</div>') + `<div class="nm">${esc(R('#s-t').value || 'Dein Spiel')}</div>`;
    const ok = !!st && R('#s-t').value.trim().length > 0; R('#s-d1').disabled = !ok; R('#s-p').disabled = !ok;
    $$('.mo', m).forEach(b => b.classList.toggle('on', !!st && st.kind === 'built' && st.motif === b.dataset.m));
    $$('.pa', m).forEach(b => b.classList.toggle('on', !!st && st.kind === 'built' && st.pal === +b.dataset.p));
  };
  m.addEventListener('click', e => {
    const t = e.target.closest('.tab'); if (t) { $$('.tab', m).forEach(x => x.classList.toggle('on', x === t)); R('#t-built').hidden = t.dataset.t !== 'built'; R('#t-up').hidden = t.dataset.t !== 'up'; return; }
    const mo = e.target.closest('.mo'); if (mo) { motif = mo.dataset.m; st = { kind: 'built', motif, pal: st && st.kind === 'built' ? st.pal : pal }; setTile(); return; }
    const pa = e.target.closest('.pa'); if (pa) { pal = +pa.dataset.p; st = { kind: 'built', motif: st && st.kind === 'built' ? st.motif : motif, pal }; setTile(); }
  });
  R('#s-t').addEventListener('input', setTile); setTile();
  R('#s-f').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 8 * 1024 * 1024) { R('#s-e').textContent = 'Das Bild ist zu groß (maximal 8 MB).'; return; }
    try { const u = URL.createObjectURL(f); const j = await toJpeg(u); URL.revokeObjectURL(u); st = { kind: 'upload', url: j }; R('#s-e').textContent = ''; setTile(); } catch (err) { R('#s-e').textContent = 'Das Bild konnte nicht gelesen werden.'; }
  });
  R('#s-x').onclick = () => m.close();
  const go = async pub => {
    R('#s-e').textContent = ''; const bs = [R('#s-d1'), R('#s-p')]; bs.forEach(b => b.disabled = true);
    try {
      g.title = R('#s-t').value.trim(); g.description = R('#s-d').value.trim(); $('#e-title').value = g.title;
      const newIcon = st.kind === 'built' ? await toJpeg(svgUrl(iconSvg(st.motif, st.pal))) : st.kind === 'upload' ? st.url : null;
      const r = await saveGame(newIcon);
      if (pub) { await rpc('moki_set_published', { p_token: App.token, p_id: g.id, p_published: true }); g.status = 'published'; }
      updateState(); m.remove(); scheduleRun(100);
      toast(pub ? 'Veröffentlicht! Es steht jetzt bei Moki unter „Kreationen“.' : 'Gespeichert', 'ok', pub ? { label: 'Link kopieren', fn: () => copyText(gameUrl(r.slug)) } : null);
    } catch (e) { R('#s-e').textContent = e.message; bs.forEach(b => b.disabled = false); }
  };
  R('#s-d1').onclick = () => go(false); R('#s-p').onclick = () => go(true);
  if (publishNow) setTimeout(() => R('#s-p').scrollIntoView({ block: 'nearest' }), 50);
}

// ---------- Tastenkürzel, Schutz vor Verlust ----------
addEventListener('keydown', e => {
  if (App.view !== 'edit') return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); quickSave(); }
  else if (mod && e.key === 'Enter') { e.preventDefault(); runPreview(); }
});
addEventListener('beforeunload', e => { if (App.g && App.g.dirty && App.view === 'edit') { e.preventDefault(); e.returnValue = ''; } });

// ====================================================================
// Start
// ====================================================================
async function init() {
  $('#btn-moki').href = CFG.mokiUrl;
  $('#logo-link').onclick = e => { e.preventDefault(); if (App.name && App.view === 'edit') $('#e-back').click(); else if (App.name) showDash(); };
  $('#btn-who').onclick = () => askName(false);
  $('#btn-key').onclick = openKey;
  if (!App.name) await askName(true);
  $('#who-name').textContent = App.name; $('#btn-who').hidden = false; $('#btn-key').hidden = false;
  showDash();
}
window.__studio = { App, genCode, newGame, buildSrcdoc };
init();
