/* =====================================================================
   GAME — boot, login, loop, busted, ending
===================================================================== */
const Game = {
  running: false,
  clockStr() { const m = Math.floor(S.clock) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); },
  show(id) { $$('.screen').forEach(s => s.hidden = s.id !== id); $('#os').hidden = id !== null && id !== 'os'; if (id === 'os') $$('.screen').forEach(s => s.hidden = true); },
  async boot() {
    this.show('bios');
    const bios = $('#bios'); let skip = false;
    const sk = () => { skip = true; Sound.init(); }; bios.onclick = sk; document.addEventListener('keydown', sk, { once: true });
    const lines = ['<span class="hl">ZeroBIOS v6.00PG</span>, An Energy Star Ally', 'Copyright (C) 1984-2026, Untergrund Software', '', 'Pentium III-800 CPU erkannt', 'Speichertest: 262144K OK', '', 'Erkenne IDE-Laufwerke ...', '  Primary Master: DOORS_XP_HDD 40GB', '  Secondary Master: CD-ROM', '', 'Modem 56k ... bereit', 'Lade ZeroShell-Kernelmodul ... <span class="hl">OK</span>', 'Tarnmodus aktiv ... <span class="hl">OK</span>', '', 'Klicken, um zu überspringen'];
    for (const l of lines) { if (skip) break; bios.innerHTML += l + '\n'; await sleep(95); }
    await sleep(skip ? 0 : 350);
    this.show('bootlogo'); skip = false; $('#bootlogo').onclick = sk;
    for (let i = 0; i < 26 && !skip; i++) await sleep(100);
    this.loginScreen();
  },
  loginScreen() {
    this.show('login');
    const has = Save.has() && Save.load();
    $('#lg-avatar').innerHTML = icon('avatar');
    $('#lg-name').textContent = has ? S.alias : 'Neuer Hacker';
    $('#lg-sub').textContent = has ? `Fortsetzen · ${Eco.rank()} · ${cr(S.money)}` : 'Klicken, um ein neues Spiel zu starten';
    $('#lg-pass').hidden = true;
    $$('.lg-extra').forEach(e => e.remove());
    if (has) {
      const nb = h(`<button class="lg-user lg-extra" type="button"><span class="avatar">${icon('ghost')}</span><span><b>Neues Spiel</b><small>Spielstand überschreiben</small></span></button>`);
      nb.style.marginTop = '10px'; nb.querySelector('.avatar').style.background = '#1b5e20';
      nb.onclick = () => { S = defaultState(); this.askAlias(); };
      $('.lg-right').appendChild(nb);
    }
    $('#lg-user').onclick = () => { Sound.init(); if (has) this.start(false); else this.askAlias(); };
    $('#lg-off').onclick = () => this.shutdown();
  },
  askAlias() {
    Sound.init();
    $('#lg-pass').hidden = false; $('#lg-name').textContent = 'Hacker-Alias wählen'; $('#lg-sub').textContent = 'Wie soll dich die Szene nennen?';
    const inp = $('#lg-alias'); inp.value = ''; setTimeout(() => inp.focus(), 50);
    const go = () => { S = defaultState(); S.alias = (inp.value.trim() || 'Ghost').replace(/[^\wäöüÄÖÜß\-]/g, '').slice(0, 14) || 'Ghost'; this.start(true); };
    $('#lg-go').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
  },
  async start(fresh) {
    Sound.init();
    this.show('welcome'); Sound.sfx('boot');
    await sleep(1500);
    this.show('os');
    WM.closeAll(); Term.lines = [];
    Apps.setWallpaper(S.wallpaper || 'bliss');
    Desktop.render(); UI.update(); UI.tray();
    this.running = true;
    if (fresh) {
      Save.write();
      setTimeout(() => balloon('Willkommen, ' + S.alias, 'Dein Rechner ist bereit. Du hast eine neue E-Mail.', { icon: 'ghost', ms: 7000 }), 900);
      setTimeout(() => { Story.sendMission(0); }, 2600);
      setTimeout(() => Mail.receive({ from: 'Doors-Team <info@doors.xp>', subj: 'Willkommen bei Doors XP', body: '<p>Vielen Dank, dass Sie sich für Doors XP entschieden haben.</p><p>Tipp: Unter <b>Start → Hilfe und Support</b> finden Sie eine Anleitung. Doppelklicken Sie auf Symbole, um Programme zu öffnen.</p>' }), 1400);
    } else {
      setTimeout(() => balloon('Willkommen zurück', `Konto: <b>${cr(S.money)}</b> · Heat: <b>${Math.round(S.heat)}%</b>`, { icon: 'ghost' }), 900);
      if (S.story < STORY.length && !S.mission && !S.storyDone && !S.flags.side && !S.mails.some(m => m.mission === S.story)) setTimeout(() => Story.sendMission(S.story), 3000);
    }
  },
  logout() { Sound.sfx('logout'); Hack.disconnect(true); Save.write(); this.running = false; Music.stop(); WM.closeAll(); setTimeout(() => this.loginScreen(), 400); },
  shutdown() { Hack.conn && Hack.disconnect(true); Save.write(); this.running = false; Music.stop(); WM.closeAll(); Sound.sfx('logout'); this.show('shutdown'); $('#shutdown').onclick = () => this.boot(); },
  reset() { Save.wipe(); S = defaultState(); this.running = false; WM.closeAll(); Term.lines = []; Events.malware = []; this.boot(); },
  bsod() {
    this.running = false; Hack.conn && Hack.disconnect(true, true); Sound.sfx('error');
    this.show('bsod');
    $('#bsod').textContent = `Es wurde ein Problem festgestellt. Doors wurde heruntergefahren, damit\nder Computer nicht beschädigt wird.\n\nCRITICAL_PROCESS_DIED\n\nSie haben gerade einen wichtigen Systemprozess beendet.\nDas war … mutig.\n\nTechnische Informationen:\n*** STOP: 0x000000EF (0xDEADBEEF, 0x00000000, 0xC0FFEE00, 0x00000000)\n\n\nKlicken Sie, um neu zu starten.`;
    $('#bsod').onclick = () => { Save.write(); this.boot(); };
  },
  busted() {
    if (!this.running) return;
    this.running = false; Hack.conn && Hack.disconnect(true, true); Music.stop();
    Sound.sfx('siren'); WM.closeAll();
    const bail = 1200 + S.rep * 4;
    const b = $('#busted');
    b.innerHTML = `<h1>ZUGRIFF!</h1><p><b>CYBERPOL — Durchsuchungsbeschluss</b><br>Um ${this.clockStr()} Uhr stürmt ein Einsatzkommando deine Wohnung. Der Rechner von „${esc(S.alias)}" wird beschlagnahmt.</p>
      <p style="font-family:var(--mono);color:#aaa">Hacks: ${S.stats.hacks} · Verdient: ${cr(S.stats.earned)} · Zurückverfolgt: ${S.stats.traced}×</p>
      <div class="bt">${S.money >= bail ? `<button class="xbtn go" type="button" data-bail>Anwalt &amp; Kaution zahlen (${cr(bail)})</button>` : `<span style="color:#f88">Für Kaution fehlen dir ${cr(bail - S.money)}.</span>`}<button class="xbtn danger" type="button" data-new>Neu anfangen</button></div>`;
    this.show('busted');
    const bb = b.querySelector('[data-bail]');
    bb && (bb.onclick = () => { S.money -= bail; S.heat = 45; S.proxies = Math.max(0, S.proxies - 1); Save.write(); this.start(false); setTimeout(() => balloon('Wieder frei', 'Du bist auf Kaution draußen. Ein Proxy wurde beschlagnahmt. Halt die Füße still!', { icon: 'warn', kind: 'warn' }), 2500); });
    b.querySelector('[data-new]').onclick = () => this.reset();
  },
  ending(side) {
    this.running = false; Hack.conn && Hack.disconnect(true, true); WM.closeAll(); Sound.sfx('win');
    const e = $('#ending');
    const txt = side === 'ghost'
      ? `<h1 style="color:#33ff77">HYDRA GELÖSCHT</h1><p style="max-width:620px">HYDRA.sys ist weg. Ghostwire leitet die Beweise an die Presse. Drei Tage später wird der OmniCorp-Vorstand verhaftet. Nyx verschwindet spurlos.<br><br>Niemand kennt deinen echten Namen. Aber in der Szene erzählen sie sich von „${esc(S.alias)}", der Person, die eine Hydra enthauptet hat.</p>`
      : `<h1 style="color:#ff4f4f">HYDRA ERWACHT</h1><p style="max-width:620px">Der Schlüssel greift. Jede Kamera, jedes Telefon, jede Nachricht: HYDRA sieht alles. Die 20.000 Cr landen auf deinem Konto.<br><br>Dann klingelt dein Telefon. Eine Nachricht von Nyx: <i>„Danke. Du stehst übrigens auch auf der Liste."</i><br>Deine Fahndung steigt auf 80 %. Lauf.</p>`;
    e.innerHTML = `${txt}<div class="stats"><span>Alias</span><b>${esc(S.alias)}</b><span>Rang</span><b>${Eco.rank()}</b><span>Hacks</span><b>${S.stats.hacks}</b><span>Verdient</span><b>${cr(S.stats.earned)}</b><span>Angriffe abgewehrt</span><b>${S.stats.defended}</b><span>Zurückverfolgt</span><b>${S.stats.traced}×</b></div>
      <p style="color:#888">ENDE · Danke fürs Spielen. Du kannst im freien Spiel weitermachen: Jobs, Konter-Hacks, Upgrades.</p><button class="xbtn go" type="button">Weiterspielen</button>`;
    if (side === 'nyx') S.heat = Math.max(S.heat, 80);
    this.show('ending');
    e.querySelector('button').onclick = () => { Save.write(); this.start(false); };
  },
};

/* ---------- animated wallpapers ---------- */
const Wallpaper = {
  mode: '', raf: 0, cols: [],
  set(m) { this.mode = m; cancelAnimationFrame(this.raf); const cv = $('#wpcanvas'), c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); if (m === 'matrix' || m === 'crimson') this.loop(); },
  loop() {
    const cv = $('#wpcanvas'), c = cv.getContext('2d'); let last = 0;
    const f = t => {
      if (this.mode !== 'matrix' && this.mode !== 'crimson') return;
      this.raf = requestAnimationFrame(f);
      if (t - last < 60) return; last = t;
      const W = cv.clientWidth, H = cv.clientHeight; if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; this.cols = []; }
      const fs = 16, n = Math.ceil(W / fs); while (this.cols.length < n) this.cols.push(Math.random() * -H);
      c.fillStyle = this.mode === 'matrix' ? 'rgba(1,10,3,.12)' : 'rgba(26,3,6,.1)'; c.fillRect(0, 0, W, H);
      c.font = fs + 'px monospace';
      this.cols.forEach((y, i) => { c.fillStyle = Math.random() < .05 ? '#cfffdc' : this.mode === 'matrix' ? '#1fd65a' : '#d8304a'; c.fillText(String.fromCharCode(0x30A0 + rnd(0, 95)), i * fs, y); this.cols[i] = y > H && Math.random() > .975 ? 0 : y + fs; });
    };
    this.raf = requestAnimationFrame(f);
  },
};

/* ---------- main loop ---------- */
let _last = performance.now();
setInterval(() => {
  const n = performance.now(), dt = Math.min(.5, (n - _last) / 1000); _last = n;
  if (!Game.running) return;
  S.clock += dt / 2; // 1 game minute every 2 s
  Hack.tick(dt);
}, 100);
setInterval(() => { if (Game.running) Term.chips(); }, 2500);

window.addEventListener('DOMContentLoaded', () => {
  Desktop.init(); Start.init(); UI.init(); Events.init();
  Game.boot();
});
document.addEventListener('pointerdown', () => Sound.init(), { once: true });
