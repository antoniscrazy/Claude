// ====================================================================
// Extras: Code-Vorlagen, Bausteine zum Einfügen, Download als HTML-Datei
// ====================================================================
const CODE_SNAKE = `// Snake: Pfeiltasten oder Wischen. Iss Äpfel, stoße nicht an dich oder die Wand.
const game = Moki.game({ background: '#10331f', pattern: 'grid', help: 'Pfeiltasten steuern die Schlange', showBest: true });
const C = 25, COLS = 32, ROWS = 20;
let dir = [1, 0], next = [1, 0], body = [[8, 10], [7, 10], [6, 10]], apple = [20, 10], parts = [];
function px(c) { return c * C + C / 2; }
function placeApple() { do { apple = [game.math.randInt(0, COLS - 1), game.math.randInt(0, ROWS - 1)]; } while (body.some(b => b[0] === apple[0] && b[1] === apple[1])); }
function turn(x, y) { if (x !== -dir[0] || y !== -dir[1]) next = [x, y]; }
game.onKey('LEFT', () => turn(-1, 0)); game.onKey('RIGHT', () => turn(1, 0));
game.onKey('UP', () => turn(0, -1)); game.onKey('DOWN', () => turn(0, 1));
game.onKey('A', () => turn(-1, 0)); game.onKey('D', () => turn(1, 0)); game.onKey('W', () => turn(0, -1)); game.onKey('S', () => turn(0, 1));
let sx = 0, sy = 0;
game.onPointer((x, y) => { sx = x; sy = y; });
game.onPointerUp((x, y) => { const dx = x - sx, dy = y - sy; if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0); else turn(0, dy > 0 ? 1 : -1); });
game.every(0.12, () => {
  dir = next; const h = [body[0][0] + dir[0], body[0][1] + dir[1]];
  if (h[0] < 0 || h[1] < 0 || h[0] >= COLS || h[1] >= ROWS || body.some(b => b[0] === h[0] && b[1] === h[1])) { game.shake(300); game.lose('Autsch!'); return; }
  body.unshift(h);
  if (h[0] === apple[0] && h[1] === apple[1]) { game.addScore(1); game.sound('coin'); game.emit(px(h[0]), px(h[1]), { count: 12, color: ['#ff4d6d', '#ffd23f'], speed: 180 }); placeApple(); }
  else body.pop();
});
game.onDrawBack(ctx => {
  ctx.fillStyle = '#ff4d6d'; ctx.beginPath(); ctx.arc(px(apple[0]), px(apple[1]), C * 0.38, 0, 7); ctx.fill();
  body.forEach((b, i) => { ctx.fillStyle = i === 0 ? '#9dffb0' : '#35c76a'; ctx.fillRect(b[0] * C + 2, b[1] * C + 2, C - 4, C - 4); });
});
game.start();
`;
const CODE_JUMPER = `// Himmelshüpfer: Die Figur springt von allein. Steuere links/rechts und steige immer höher.
const game = Moki.game({ background: '#bfe9ff', background2: '#7cc4f2', worldHeight: 6000, gravity: 1300, help: 'Pfeile oder Finger links/rechts', showBest: true });
game.camera.zoom = 1;
const hero = game.sprite({ name: 'Hüpfer', shape: 'blob', color: '#9acd32', size: 54, x: 50, y: 98, outline: '#2d5a00' });
hero.vy = -900;
for (let i = 0; i < 70; i++) {
  game.sprite({ name: 'Brett', shape: 'square', color: '#58b947', size: 16, stretch: 4.5, at: [game.math.rand(60, 740), 5900 - i * 85], outline: '#2d6a23' });
}
game.sprite({ name: 'Ziel', shape: 'crown', size: 70, at: [400, 70] });
game.sprite({ name: 'Anzeige', shape: 'text', label: 'Höhe: {score} m', color: '#0d1240', size: 24, x: 14, y: 5, fixed: true });
game.camera.follow(hero, 0.2);
let best = 0;
game.onUpdate(dt => {
  const dx = (game.key('RIGHT') || game.key('D') ? 1 : 0) - (game.key('LEFT') || game.key('A') ? 1 : 0) + (game.pointer.down ? (game.pointer.sx > 400 ? 1 : -1) : 0);
  hero.x += dx * 380 * dt; hero.flipX = dx < 0;
  if (hero.x < -20) hero.x = 820; if (hero.x > 820) hero.x = -20;
  hero.vy += game.gravity * dt; hero.y += hero.vy * dt;
  if (hero.vy > 0) game.all('Brett').forEach(b => {
    if (Math.abs(hero.x - b.x) < b.w / 2 + 14 && hero.y + 24 > b.y - 8 && hero.y + 24 < b.y + 22) { hero.vy = -820; game.sound('jump'); }
  });
  best = Math.max(best, Math.round((5950 - hero.y) / 10)); game.setScore(best);
  if (hero.y > game.camera.y + 560) game.lose('Abgestürzt in ' + best + ' m');
});
game.onTouch('Hüpfer', 'Ziel', () => game.win('Gipfel erreicht!'));
game.start();
`;
const CODE_CLICKER = `// Klicker: Tippe auf den Keks, kaufe Verbesserungen. Dein Fortschritt wird automatisch gespeichert.
const game = Moki.game({ background: '#2b1b3d', background2: '#4b2a2a', showScore: false, help: 'Tippe auf den Keks!' });
let cookies = game.load('cookies', 0), per = game.load('per', 1), auto = game.load('auto', 0);
const cost = { per: () => Math.floor(15 * Math.pow(1.6, per - 1)), auto: () => Math.floor(40 * Math.pow(1.5, auto)) };
const cookie = game.sprite({ name: 'Keks', shape: 'circle', color: '#c98a4b', size: 170, x: 50, y: 48, outline: '#7a4a1f', glow: '#ffb86b' });
game.sprite({ name: 'Info', shape: 'text', label: '', color: '#fff', size: 30, x: 50, y: 12 });
game.sprite({ name: 'KaufA', shape: 'button', label: '', color: '#00e5a8', size: 54, stretch: 5, x: 24, y: 90, fixed: true });
game.sprite({ name: 'KaufB', shape: 'button', label: '', color: '#ffd23f', size: 54, stretch: 5, x: 76, y: 90, fixed: true });
function refresh() {
  game.find('Info').label = Math.floor(cookies) + ' Kekse';
  game.find('KaufA').label = '+1 pro Klick (' + cost.per() + ')';
  game.find('KaufB').label = 'Helfer (' + cost.auto() + ')';
  game.save('cookies', Math.floor(cookies)); game.save('per', per); game.save('auto', auto);
}
game.onClick('Keks', c => { cookies += per; game.sound('pop'); c.tween({ size: 150 }, 0.06, 'out', () => c.tween({ size: 170 }, 0.12, 'back')); game.emit(c.x, c.y, { count: 6, color: ['#c98a4b', '#ffb86b'], speed: 150 }); refresh(); });
game.onClick('KaufA', () => { if (cookies >= cost.per()) { cookies -= cost.per(); per++; game.sound('powerup'); refresh(); } else game.sound('hit'); });
game.onClick('KaufB', () => { if (cookies >= cost.auto()) { cookies -= cost.auto(); auto++; game.sound('powerup'); refresh(); } else game.sound('hit'); });
game.every(1, () => { cookies += auto; if (auto) refresh(); });
game.onStart(refresh);
game.start();
`;
const CODE_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  html, body { margin: 0; height: 100%; background: #0d1240; color: #fff; font-family: system-ui, sans-serif; overflow: hidden; }
  canvas { display: block; width: 100%; height: 100%; touch-action: none; }
  #hud { position: fixed; left: 14px; top: 10px; font-weight: 800; font-size: 22px; pointer-events: none; }
</style>
</head>
<body>
<div id="hud">Punkte: 0</div>
<canvas id="c"></canvas>
<script>
// Eine komplette Webseite: hier gehört dir alles (HTML, CSS, Canvas, WebGL, Audio ...).
// Dieses Beispiel malt Bälle, die dem Finger folgen. Die Moki-Engine brauchst du dafür nicht.
const c = document.getElementById('c'), x = c.getContext('2d'), hud = document.getElementById('hud');
let W, H, mx = 0, my = 0, score = 0;
function fit() { W = c.width = innerWidth; H = c.height = innerHeight; }
addEventListener('resize', fit); fit();
addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
const balls = Array.from({ length: 25 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, r: 8 + Math.random() * 10, h: Math.random() * 360 }));
function loop() {
  x.fillStyle = 'rgba(13,18,64,.25)'; x.fillRect(0, 0, W, H);
  for (const b of balls) {
    b.vx += (mx - b.x) * 0.0006; b.vy += (my - b.y) * 0.0006; b.vx *= 0.99; b.vy *= 0.99; b.x += b.vx * 16; b.y += b.vy * 16;
    x.fillStyle = 'hsl(' + b.h + ',90%,60%)'; x.beginPath(); x.arc(b.x, b.y, b.r, 0, 7); x.fill();
    if (Math.hypot(mx - b.x, my - b.y) < b.r + 6) { score++; hud.textContent = 'Punkte: ' + score; b.x = Math.random() * W; b.y = Math.random() * H; b.vx = b.vy = 0; }
  }
  requestAnimationFrame(loop);
}
loop();
<\/script>
</body>
</html>
`;
Object.assign(TEMPLATES, {
  snake: { icon: 'bolt', name: 'Snake', desc: 'Der Klassiker als Code: Äpfel fressen, wachsen, nicht anstoßen. Zum Lernen und Ändern.', title: 'Snake', mode: 'code', code: CODE_SNAKE },
  jumper: { icon: 'bolt', name: 'Himmelshüpfer', desc: 'Endloses Hochspringen wie bei Doodle Jump, mit Kamera. Als Code.', title: 'Himmelshüpfer', mode: 'code', code: CODE_JUMPER },
  clicker: { icon: 'mouse', name: 'Klicker', desc: 'Keks anklicken, Verbesserungen kaufen, Fortschritt wird gespeichert. Als Code.', title: 'Keks-Klicker', mode: 'code', code: CODE_CLICKER },
  html: { icon: 'code', name: 'Eigene Webseite', desc: 'Ganze HTML-Seite mit Canvas, ganz ohne Engine. Für alles, was die Engine nicht kann.', title: 'Meine Webseite', mode: 'code', code: CODE_HTML }
});

// ---------- Bausteine (Code-Schnipsel zum Einfügen) ----------
const SNIPPETS = [
  ['Figur mit Pfeiltasten', "const spieler = game.sprite({ name: 'Spieler', shape: 'circle', color: '#00e5a8', size: 50, x: 50, y: 50, control: 'keys', speed: 300 });\n"],
  ['Gegner, der dich jagt', "game.sprite({ name: 'Jäger', shape: 'ghost', size: 50, x: 10, y: 10, motion: 'follow', speed: 120 });\n"],
  ['Patrouillierender Gegner', "game.sprite({ name: 'Wächter', shape: 'blob', color: '#ff4d6d', size: 44, x: 60, y: 80, motion: 'patrol', physics: 'platformer', speed: 90 });\n"],
  ['Sammelobjekte im Raster', "game.sprite({ name: 'Münze', shape: 'circle', color: '#ffd23f', size: 24, x: 10, y: 20, cols: 8, rows: 3, gapX: 40, gapY: 30 });\n"],
  ['Berühren: Punkte + Ton', "game.onTouch('Spieler', 'Münze', (a, b) => { b.destroy(); game.addScore(1); game.sound('coin'); });\n"],
  ['Schießen mit Leertaste', "game.onKey('SPACE', () => { const s = game.find('Spieler'); if (s) s.shoot('Schuss', 'up', 600); });\n"],
  ['Level aus Text', "game.level([\n  '####################',\n  '#                  #',\n  '#   o        o     #',\n  '#      ####        #',\n  '#                  #',\n  '####################'\n], {\n  '#': { name: 'Wand', shape: 'square', color: '#6b4a2e', solid: true },\n  'o': { name: 'Münze', shape: 'circle', color: '#ffd23f', size: 24 }\n}, 40);\n"],
  ['Pixel-Art-Figur', "game.art('Männchen', [\n  '..0000..',\n  '.011110.',\n  '.010010.',\n  '.011110.',\n  '..0110..',\n  '.011110.',\n  '..0..0..'\n], ['#222', '#ffcc33']);\ngame.sprite({ name: 'Pixel', shape: 'Männchen', size: 64, x: 50, y: 50 });\n"],
  ['Kamera folgt der Figur', "game.camera.follow(game.find('Spieler'), 0.1);\n"],
  ['Partikel-Explosion', "game.emit(400, 250, { count: 40, color: ['#ff4d6d', '#ffd23f'], speed: 300, life: 0.8 });\n"],
  ['Weiche Animation', "game.find('Spieler').tween({ size: 90 }, 0.4, 'bounce');\n"],
  ['Warten und dann etwas tun', "async function ablauf() {\n  game.say('Achtung!');\n  await game.wait(2);\n  game.say('Los!');\n}\ngame.onStart(ablauf);\n"],
  ['Eigene Zeichnung', "game.onDrawBack(ctx => {\n  ctx.fillStyle = 'rgba(255,255,255,.08)';\n  for (let i = 0; i < 10; i++) ctx.fillRect(i * 80, 0, 40, 500);\n});\n"],
  ['Lebensbalken über allem', "game.onDrawHud(ctx => game.ui.bar(20, 470, 200, 14, game.lives, 3, { color: '#ff4d6d' }));\n"],
  ['Musik starten', "game.onStart(() => game.music('retro'));\n"],
  ['Spielstand speichern', "game.onStart(() => { const n = game.load('starts', 0) + 1; game.save('starts', n); game.say('Start Nr. ' + n); });\n"],
  ['Zeitlupe bei Treffer', "game.onTouch('Spieler', 'Gegner', () => { game.timeScale = 0.3; game.after(0.6, () => game.timeScale = 1); });\n"]
];
function openSnippets() {
  const m = modal(`<h3>Bausteine</h3><p class="lead">Klick auf einen Baustein, dann wird er an der Cursor-Stelle in deinen Code eingefügt.</p><div class="snips">${SNIPPETS.map((s, i) => `<button class="snip" data-i="${i}" type="button"><b>${esc(s[0])}</b><code>${esc(s[1].split('\n')[0].slice(0, 70))}</code></button>`).join('')}</div>`, { wide: true });
  m.querySelectorAll('.snip').forEach(b => b.onclick = () => {
    const ta = $('#ta'); if (!ta || ta.readOnly) { toast('Zuerst „Code bearbeiten“ drücken.'); return; }
    const t = SNIPPETS[+b.dataset.i][1], s = ta.selectionStart, pre = ta.value.slice(0, s), nl = pre && !pre.endsWith('\n') ? '\n' : '';
    ta.focus(); ta.setRangeText(nl + t, s, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); m.close();
  });
}
// ---------- Download als eigenständige HTML-Datei ----------
function downloadGame() {
  if (!App.g) return;
  const d = buildSrcdoc(currentCode(), App.g.title || 'Spiel').html;
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([d], { type: 'text/html' }));
  a.download = (App.g.title || 'spiel').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.html'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Spiel als HTML-Datei gespeichert.');
}
const dlb = $('#e-dl'); if (dlb) dlb.onclick = downloadGame;
