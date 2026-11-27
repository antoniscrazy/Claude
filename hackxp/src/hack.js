/* =====================================================================
   HACK — connection, trace, logs, heat
===================================================================== */
const Hack = {
  conn: null, lastBeep: 0, adminUntil: 0,
  know(ip) { S.known = S.known || []; if (!S.known.includes(ip)) S.known.push(ip); Bus.emit('net'); },
  proxyCount() { return S.proxies + Object.values(S.hosts).filter(x => x.ownedProxy).length; },
  rate() {
    const c = this.conn; if (!c) return 0;
    let r = (0.75 + c.host.sec * 0.55) / (1 + 0.3 * this.proxyCount());
    if (Mini.active) r *= 0.5 * (1 - 0.12 * (S.hw.ram - 1));
    if (Date.now() < this.adminUntil) r *= 2;
    if (S.flags.nyxHunt && c.host.name === 'omni-mainframe') r *= 1.15;
    return r;
  },
  bump(n) { if (!this.conn) return; this.conn.trace = Math.min(100, this.conn.trace + n); },
  tick(dt) {
    const c = this.conn;
    if (!c) { UI.trace(0, false); return; }
    c.trace = Math.min(100, c.trace + this.rate() * dt);
    UI.trace(c.trace, true); Term.head();
    const iv = 1600 - c.trace * 14; const now = performance.now();
    if (now - this.lastBeep > Math.max(140, iv)) { this.lastBeep = now; if (c.trace > 25) Sound.sfx('trace'); }
    // random admin event
    if (!c.adminSeen && Math.random() < dt * c.host.sec * 0.006 && c.trace > 10) {
      c.adminSeen = true; this.adminUntil = Date.now() + 12000;
      Term.println(`\n  ⚠ WARNUNG: Admin „${c.host.admin}" hat sich eingeloggt! Trace läuft doppelt so schnell (12 s).`, 't-err t-b');
      balloon('Admin online!', `${esc(c.host.admin)} ist auf ${esc(c.host.name)} aktiv. Trace ×2!`, { kind: 'danger', icon: 'warn', sound: 'alarm' });
      Term.alarm(12000);
    }
    if (c.trace >= 100) this.traced();
  },
  connect(ip) {
    const host = S.hosts[ip]; if (!host) return false;
    if (this.conn) this.disconnect(true);
    host.visits++; host.logs++;
    this.conn = { ip, host, trace: clamp(host.alert * 8, 0, 60), t0: Date.now(), adminSeen: false };
    UI.tray(); Bus.emit('net');
    return true;
  },
  disconnect(silent, forced) {
    const c = this.conn; if (!c) return;
    this.conn = null; this.adminUntil = 0;
    const host = c.host, clean = host.logs === 0;
    if (!host.root) { host.ports.forEach(p => p.open = false); host.fwDown = 0; }
    UI.trace(0, false); UI.tray(); Term.head(); Term.alarm(0);
    if (!forced && !clean && S.hosts[host.ip]) {
      const logs = host.logs, gain = Math.round(logs * host.sec * 1.6);
      host.alert++;
      setTimeout(() => Eco.addHeat(gain, `Admin von <b>${esc(host.org)}</b> hat ${logs} Log-Einträge mit deiner Spur gefunden. Nächstes Mal <code>clearlogs</code> vor dem Trennen!`), 2500);
    }
    if (!silent) Term.println('Verbindung getrennt.' + (clean ? ' Keine Spuren hinterlassen. ✓' : ' ⚠ Logs nicht gelöscht!'), clean ? 't-ok' : 't-warn');
    Story.onDisconnect(host.ip, clean);
    Bus.emit('net'); Save.write();
  },
  traced() {
    const c = this.conn; if (!c) return;
    const host = c.host; S.stats.traced++;
    host.alert += 2; host.logs = 0;
    Term.println('\n  ██ TRACE ABGESCHLOSSEN ██  Deine IP wurde an die Cyberpol übermittelt!', 't-err t-b');
    Sound.sfx('alarm'); Term.glitch();
    if (Mini.active && WM.wins.mini) { WM.close('mini'); }
    Term.cancelBusy && Term.cancelBusy();
    this.disconnect(true, true);
    Eco.addHeat(18 + host.sec * 4, `Du wurdest auf <b>${esc(host.org)}</b> zurückverfolgt. Die Cyberpol kommt näher.`);
    document.body.animate([{ filter: 'invert(1) hue-rotate(180deg)' }, { filter: 'none' }], { duration: 350, iterations: 2 });
  },
  wipeTime() { return (S.tools.wipe ? 1.6 : 4.5) * (1 - 0.1 * (S.hw.ram - 1)) + (this.conn ? this.conn.host.logs * 0.35 : 0); },
  dlSpeed() { return [0, 3, 9, 25, 70][S.hw.net]; },
};
// heat cools down when you lie low
setInterval(() => { if (!Game.running) return; S.stats.played++; if (!Hack.conn && S.heat > 0) { S.heat = Math.max(0, S.heat - 0.12); if (Math.random() < .1) UI.update(); } }, 1000);

/* =====================================================================
   TERMINAL
===================================================================== */
const Term = {
  lines: [], hist: [], hi: 0, busy: false, cancel: null,
  CMDS: ['help', 'clear', 'scan', 'probe', 'connect', 'dc', 'crack', 'firewall', 'ls', 'cat', 'download', 'rm', 'upload', 'transfer', 'clearlogs', 'decoy', 'status', 'whoami', 'ipconfig', 'hosts', 'matrix', 'date', 'echo', 'exit'],
  open() {
    const fresh = !WM.wins.terminal;
    const w = WM.create({
      id: 'terminal', title: 'Hack-Konsole', icon: 'terminal', w: 720, h: 470,
      onFocus: () => setTimeout(() => !isTouch() && Term.inp && Term.inp.focus(), 0),
      render: (b) => {
        b.innerHTML = `<div class="term"><div class="term-head"><span>ZeroShell v4.2</span><span class="th-host"></span><span class="tr"><span class="tr-l">TRACE</span><span class="th-bar"><i></i></span><b class="tr-v">--</b></span></div>
          <div class="term-out"></div><div class="term-chips"></div><div class="term-in"><span class="pr"></span><input aria-label="Befehl eingeben" autocomplete="off" autocapitalize="off" spellcheck="false"></div></div>`;
        this.root = b.querySelector('.term'); this._ck = null; this.out = b.querySelector('.term-out'); this.inp = b.querySelector('input'); this.chipsEl = b.querySelector('.term-chips');
        this.out.innerHTML = ''; this.lines.forEach(l => this.out.appendChild(this.mk(l)));
        this.inp.addEventListener('keydown', e => this.key(e));
        this.root.addEventListener('click', e => { if (!e.target.closest('button') && !getSelection().toString()) this.inp.focus(); });
        this.head(); this.chips(); this.scroll();
      },
    });
    if (fresh && !this.lines.length) this.banner();
    setTimeout(() => !isTouch() && this.inp && this.inp.focus(), 50);
    return w;
  },
  mk(l) { const d = document.createElement('div'); d.className = 'term-line ' + (l.c || ''); if (l.html) d.innerHTML = l.t; else d.textContent = l.t; return d; },
  println(t = '', c = '', html = false) {
    const l = { t, c, html }; this.lines.push(l); if (this.lines.length > 400) this.lines.shift();
    if (this.out && WM.wins.terminal) { const el = this.mk(l); this.out.appendChild(el); if (this.out.children.length > 400) this.out.firstChild.remove(); this.scroll(); return el; }
    else if (WM.wins.terminal === undefined && c.includes('t-err')) { /* unseen warning */ }
    WM.flash('terminal');
  },
  scroll() { if (this.out) this.out.scrollTop = this.out.scrollHeight; },
  async type(lines, ms = 18) { for (const l of lines) { this.println(l[0], l[1]); await sleep(ms); } },
  prompt() { const c = Hack.conn; return c ? `${c.host.root ? 'root' : 'guest'}@${c.host.name}:~${c.host.root ? '#' : '$'}` : `C:\\Dokumente und Einstellungen\\${S.alias}>`; },
  head() {
    if (!this.root || !WM.wins.terminal) return;
    const c = Hack.conn;
    this.root.querySelector('.th-host').textContent = c ? `● ${c.host.name} (${c.ip}) · Sicherheit ${'■'.repeat(c.host.sec)}${'□'.repeat(5 - c.host.sec)}` : '○ nicht verbunden';
    const tr = this.root.querySelector('.tr');
    tr.querySelector('i').style.width = (c ? c.trace : 0) + '%';
    tr.querySelector('.tr-v').textContent = c ? c.trace.toFixed(1) + '%' : '--';
    tr.classList.toggle('hot', !!c && c.trace > 65);
    this.root.querySelector('.pr').textContent = this.prompt();
  },
  chips() {
    if (!this.chipsEl) return;
    const c = Hack.conn; let list;
    if (!c) {
      const targets = [S.mission, S.activeContract].filter(Boolean).map(j => j.ip);
      list = ['help', 'scan', ...targets.map(ip => 'connect ' + ip), 'status'];
    } else {
      const hst = c.host; list = ['probe'];
      if (hst.fw > hst.fwDown && !hst.root) list.push('firewall');
      if (!hst.root) hst.ports.filter(p => !p.open).forEach(p => list.push('crack ' + p.n));
      if (hst.root) { list.push('ls'); const j = [S.mission, S.activeContract].find(j => j && j.ip === c.ip); if (j && !j.objDone && j.obj.file) list.push((j.obj.type === 'download' ? 'download ' : j.obj.type === 'delete' ? 'rm ' : 'upload ') + j.obj.file); if (hst.bank) list.push('transfer 1000'); }
      if (S.items && S.items.decoy) list.push('decoy');
      list.push('clearlogs', 'dc');
    }
    const key = list.join('|'); if (key === this._ck && this.chipsEl.children.length) return; this._ck = key;
    this.chipsEl.innerHTML = '';
    list.forEach(cmd => { const b = h(`<button type="button">${esc(cmd)}</button>`); b.onclick = () => { if (this.busy) return; this.run(cmd); }; this.chipsEl.appendChild(b); });
  },
  alarm(ms) { if (!this.root) return; clearTimeout(this._al); this.root.classList.toggle('alarm', ms > 0); if (ms) this._al = setTimeout(() => this.root && this.root.classList.remove('alarm'), ms); },
  glitch() { if (!this.root) return; this.root.classList.remove('glitch'); void this.root.offsetWidth; this.root.classList.add('glitch'); },
  banner() {
    [['ZeroShell v4.2 — (c) Untergrund Software Kollektiv', 't-cy'], ['Doors XP [Version 5.1.2600]', 't-dim'], [''],
     ...(innerWidth < 600 ? [['  [ Z E R O // D A Y ]', 't-ok t-b']] : [['   ███████╗███████╗██████╗  ██████╗ ', 't-ok'], ['   ╚══███╔╝██╔════╝██╔══██╗██╔═══██╗', 't-ok'], ['     ███╔╝ █████╗  ██████╔╝██║   ██║', 't-ok'], ['    ███╔╝  ██╔══╝  ██╔══██╗██║   ██║', 't-ok'], ['   ███████╗███████╗██║  ██║╚██████╔╝', 't-ok'], ['   ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝  DAY', 't-ok']]), [''],
     ['Tippe "help" für alle Befehle. Tab vervollständigt, ↑/↓ blättert im Verlauf.', 't-dim'], ['']].forEach(l => this.println(l[0], l[1]));
  },
  key(e) {
    if (e.key === 'Enter') { const v = this.inp.value; this.inp.value = ''; if (!this.busy) this.run(v); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); if (this.hi > 0) this.inp.value = this.hist[--this.hi] || ''; return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); this.hi = Math.min(this.hist.length, this.hi + 1); this.inp.value = this.hist[this.hi] || ''; return; }
    if (e.key === 'Tab') { e.preventDefault(); this.complete(); return; }
    if (e.key === 'c' && e.ctrlKey && this.busy && this.cancel) { this.cancel(); return; }
    if (e.key.length === 1) Sound.sfx('key');
  },
  complete() {
    const v = this.inp.value, parts = v.split(' ');
    if (parts.length === 1) { const m = this.CMDS.filter(c => c.startsWith(parts[0])); if (m.length === 1) this.inp.value = m[0] + ' '; else if (m.length) this.println(m.join('  '), 't-dim'); return; }
    const pre = parts.slice(-1)[0]; let opts = [];
    if (['connect', 'probe', 'nmap'].includes(parts[0])) opts = S.known || [];
    else if (parts[0] === 'upload') opts = S.files.map(f => f.name);
    else if (Hack.conn) opts = Hack.conn.host.files.map(f => f.name).concat(Hack.conn.host.ports.map(p => '' + p.n));
    const m = opts.filter(o => o.startsWith(pre));
    if (m.length === 1) { parts[parts.length - 1] = m[0]; this.inp.value = parts.join(' '); } else if (m.length) this.println(m.join('  '), 't-dim');
  },
  setBusy(b) { this.busy = b; const el = this.root && this.root.querySelector('.term-in'); el && el.classList.toggle('busy', b); },
  // progress line, resolves true on completion, false if aborted (trace/disconnect)
  progress(label, sec) {
    return new Promise(res => {
      const el = this.println('', 't-wh'); const t0 = performance.now(); const ip = Hack.conn && Hack.conn.ip;
      this.setBusy(true);
      const end = ok => { clearInterval(iv); this.cancel = null; this.cancelBusy = null; this.setBusy(false); res(ok); };
      this.cancel = () => { this.println('^C abgebrochen', 't-warn'); end(false); };
      this.cancelBusy = () => end(false);
      const iv = setInterval(() => {
        if (ip && (!Hack.conn || Hack.conn.ip !== ip)) return end(false);
        const p = clamp((performance.now() - t0) / 1000 / sec, 0, 1), n = Math.round(p * 28);
        const txt = `${label} [${'#'.repeat(n)}${'.'.repeat(28 - n)}] ${Math.round(p * 100)}%`;
        if (el) el.textContent = txt; else if (this.lines.length) this.lines[this.lines.length - 1].t = txt;
        if (p >= 1) end(true);
      }, 80);
    });
  },
  async run(raw) {
    const v = raw.trim(); this.println(this.prompt() + ' ' + v, 't-cy');
    if (!v) return;
    this.hist.push(v); this.hi = this.hist.length;
    const [cmd0, ...args] = v.split(/\s+/); const cmd = cmd0.toLowerCase(); const a = args.join(' ');
    const fn = this.cmd[cmd] || this.cmd[{ nmap: 'probe', disconnect: 'dc', dir: 'ls', type: 'cat', get: 'download', del: 'rm', put: 'upload', cls: 'clear', '?': 'help', login: 'probe', ssh: 'connect', rmlogs: 'clearlogs' }[cmd]];
    if (!fn) { this.println(`'${cmd0}' ist kein bekannter Befehl. Tippe "help".`, 't-err'); Sound.sfx('error'); return; }
    try { await fn.call(this, a, args); } catch (err) { console.error(err); this.println('Interner Fehler: ' + err.message, 't-err'); this.setBusy(false); }
    this.head(); this.chips(); UI.update();
  },
  needConn() { if (!Hack.conn) { this.println('Nicht verbunden. Erst: connect <ip>', 't-err'); Sound.sfx('error'); return false; } return true; },
  needRoot() { if (!this.needConn()) return false; if (!Hack.conn.host.root) { this.println('Zugriff verweigert. Du brauchst root. Knacke erst genug Ports (probe).', 't-err'); Sound.sfx('error'); return false; } return true; },
  findFile(name) { const hst = Hack.conn.host; return hst.files.find(f => f.name.toLowerCase() === name.toLowerCase()); },

  cmd: {
    help() {
      const rows = [
        ['scan', 'Netzwerk nach Zielen durchsuchen'], ['connect <ip>', 'Mit einem Server verbinden (Trace startet!)'], ['probe', 'Ports, Firewall und Sicherheit anzeigen'],
        ['firewall', 'Firewall durchbrechen (FirewallBreaker.exe)'], ['crack <port>', 'Port knacken mit passendem Tool'], ['ls', 'Dateien auflisten (root)'],
        ['cat <datei>', 'Datei lesen'], ['download <datei>', 'Datei auf deinen PC laden'], ['rm <datei>', 'Datei löschen'], ['upload <datei>', 'Eigene Datei hochladen'],
        ['transfer <betrag>', 'Geld von Bank-Servern abbuchen (+Heat)'], ['clearlogs', 'Spuren löschen, VOR dem Trennen'], ['decoy', 'Köder zünden: Trace −25 % (verbraucht 1)'],
        ['dc', 'Verbindung trennen'], ['status', 'Dein Rechner, Tools, Proxys'], ['hosts', 'Bekannte Server'], ['clear', 'Bildschirm leeren'],
      ];
      this.println('BEFEHLE', 't-wh t-b');
      rows.forEach(([c, d]) => this.println(`  ${c.padEnd(19)} ${d}`, 't-dim'));
      this.println('Tipp: Strg+C bricht laufende Vorgänge ab. Die Buttons unten sind Abkürzungen.', 't-dim');
    },
    clear() { this.lines = []; if (this.out) this.out.innerHTML = ''; },
    echo(a) { this.println(a); },
    date() { this.println(new Date().toLocaleDateString('de-DE') + ' ' + Game.clockStr()); },
    exit() { if (Hack.conn) return this.cmd.dc.call(this); WM.close('terminal'); },
    whoami() { this.println(Hack.conn ? (Hack.conn.host.root ? 'root' : 'guest') : `${S.alias} (${Eco.rank()})`); },
    ipconfig() { this.println('Doors-IP-Konfiguration\n\n  Verbindung: ' + HW.net.lv[S.hw.net - 1] + '\n  IP-Adresse: 10.0.0.' + (S.alias.length * 7 % 250) + '\n  Proxy-Kette: ' + (Hack.proxyCount() ? Hack.proxyCount() + ' Knoten (Trace −' + Math.round((1 - 1 / (1 + .3 * Hack.proxyCount())) * 100) + ' %)' : 'keine'), 't-dim'); },
    matrix() { Apps.setWallpaper('matrix'); this.println('Folge dem weißen Kaninchen…', 't-ok'); },
    sudo() { this.println('Netter Versuch. Das hier ist Doors, nicht Linux. 😉', 't-warn'); },
    async scan() {
      this.setBusy(true); this.println('Scanne Subnetze…', 't-dim');
      await this.progress('SCAN', 1.6);
      const now = Date.now();
      if (!S.flags.lastScan || now - S.flags.lastScan > 45000) {
        S.flags.lastScan = now;
        const randoms = Object.values(S.hosts).filter(x => x.random);
        if (randoms.length >= 5) delete S.hosts[randoms[0].ip];
        const sec = clamp(rnd(1, 1 + Math.floor(S.rep / 150)), 1, 4);
        const ports = [[80], [80, 21], [80, 22, 21], [22, 80, 25, 21]][sec - 1];
        const org = pick(['Heimnetz „FRITZ!Box-7"', 'Webcam-Server', 'Druckerei Hansen', 'Gameserver „PixelPit"', 'Uni-Testrechner', 'Smart-Kühlschrank', 'Tankstelle Süd', 'Bürgerbüro Nord']);
        const hst = makeHost({ org, name: org.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '').slice(0, 14), sec, ports, need: Math.min(ports.length, sec), fw: sec >= 4 ? 1 : 0, random: true, loot: rnd(1, 3), bank: Math.random() < .2 ? rnd(2, 8) * 250 : 0 });
        this.know(hst.ip);
        this.println(`  Neuer Host entdeckt: ${hst.ip}  ${hst.org}`, 't-ok');
      }
      this.cmd.hosts.call(this);
      this.setBusy(false);
    },
    hosts() {
      const list = (S.known || []).filter(ip => S.hosts[ip]);
      if (!list.length) return this.println('Keine bekannten Server. Lies deine Mails oder nutze scan.', 't-dim');
      this.println('  IP                 SEC    STATUS   ORGANISATION', 't-wh');
      list.forEach(ip => { const x = S.hosts[ip]; const tag = [S.mission, S.activeContract].some(j => j && j.ip === ip) ? ' ◄ ZIEL' : ''; this.println(`  ${ip.padEnd(18)} ${('■'.repeat(x.sec)).padEnd(6)} ${(x.root ? 'ROOT' : 'zu').padEnd(8)} ${x.org}${tag}`, tag ? 't-warn' : 't-dim'); });
    },
    know(ip) { Hack.know(ip); },
    async connect(a) {
      const ip = a.trim(); if (!ip) return this.println('Benutzung: connect <ip>', 't-err');
      const host = S.hosts[ip];
      this.setBusy(true);
      const hops = Hack.proxyCount();
      await this.type([[`Verbinde mit ${ip}${hops ? ` über ${hops} Proxy-Knoten` : ''}…`, 't-dim']], 10);
      await sleep(450 + hops * 150);
      if (!host) { this.setBusy(false); Sound.sfx('error'); return this.println('Zeitüberschreitung. Host nicht erreichbar.', 't-err'); }
      Hack.connect(ip); Hack.know(ip);
      this.setBusy(false);
      this.println(`Verbunden mit ${host.name} — ${host.org}`, 't-ok');
      if (host.root) this.println('Backdoor aktiv: Du hast bereits root.', 't-mag');
      this.println(`Trace läuft! Gegenwärtig ${Hack.conn.trace.toFixed(0)} %. Tippe "probe".`, 't-warn');
      Sound.sfx('ok');
    },
    probe() {
      if (!this.needConn()) return;
      const hst = Hack.conn.host; hst.logs++;
      this.println(`Host:  ${hst.name}   Org: ${hst.org}   Admin: ${hst.admin}`, 't-wh');
      this.println(`Sicherheit: ${'■'.repeat(hst.sec)}${'□'.repeat(5 - hst.sec)}   Nötige Ports für root: ${hst.need}`, 't-dim');
      if (hst.fw) this.println(`Firewall: ${hst.fwDown >= hst.fw ? 'DURCHBROCHEN' : `AKTIV (${hst.fw - hst.fwDown} Schicht${hst.fw - hst.fwDown > 1 ? 'en' : ''})`}`, hst.fwDown >= hst.fw ? 't-ok' : 't-err');
      hst.ports.forEach(p => { const s = SVC[p.n], has = S.tools[s.tool]; this.println(`  PORT ${String(p.n).padEnd(5)} ${s.label.padEnd(5)} ${p.open ? 'OFFEN ✓' : 'zu     '}  ${has ? '→ ' + TOOLS[s.tool].name : '✗ Tool fehlt: ' + TOOLS[s.tool].name}`, p.open ? 't-ok' : has ? 't-cy' : 't-err'); });
      if (hst.bank) this.println(`Kontostand erkannt: ${cr(hst.bank)}`, 't-warn');
      if (hst.root) this.println('Status: ROOT ✓', 't-mag');
    },
    async firewall() {
      if (!this.needConn()) return;
      const hst = Hack.conn.host;
      if (!hst.fw || hst.fwDown >= hst.fw) return this.println('Keine aktive Firewall.', 't-dim');
      if (!S.tools.fw) { Sound.sfx('error'); return this.println('FirewallBreaker.exe fehlt. Gibt es auf darkmarket.onion.', 't-err'); }
      hst.logs++; this.println(`Starte FirewallBreaker.exe (Schicht ${hst.fwDown + 1}/${hst.fw})…`, 't-dim');
      this.setBusy(true); this.hollywood(12); await sleep(450); const ok = await Mini.run('signal', hst.sec); this.setBusy(false);
      if (!Hack.conn) return;
      if (ok) { hst.fwDown++; this.println(hst.fwDown >= hst.fw ? 'Firewall durchbrochen. Ports sind jetzt angreifbar.' : `Schicht ${hst.fwDown} offen. Noch ${hst.fw - hst.fwDown}.`, 't-ok'); }
      else { Hack.bump(10); this.println('Firewall hat dich bemerkt! Trace +10 %', 't-err'); }
    },
    async crack(a) {
      if (!this.needConn()) return;
      const hst = Hack.conn.host, n = parseInt(a), p = hst.ports.find(x => x.n === n);
      if (!p) return this.println(a ? `Port ${a} existiert hier nicht. Nutze probe.` : 'Benutzung: crack <port>', 't-err');
      if (p.open) return this.println(`Port ${n} ist schon offen.`, 't-dim');
      if (hst.fw > hst.fwDown) { Sound.sfx('error'); return this.println('Firewall blockiert! Erst "firewall" ausführen.', 't-err'); }
      const s = SVC[n];
      if (!S.tools[s.tool]) { Sound.sfx('error'); return this.println(`${TOOLS[s.tool].name} fehlt. Kaufen auf darkmarket.onion (${cr(TOOLS[s.tool].price)}).`, 't-err'); }
      hst.logs++; this.println(`Starte ${TOOLS[s.tool].name} gegen Port ${n}…`, 't-dim');
      this.setBusy(true); this.hollywood(14); await sleep(500); const ok = await Mini.run(s.game, hst.sec); this.setBusy(false);
      if (!Hack.conn || Hack.conn.ip !== hst.ip) return;
      if (ok) {
        p.open = true; this.println(`Port ${n} (${s.label}) geöffnet.`, 't-ok');
        const open = hst.ports.filter(x => x.open).length;
        if (open >= hst.need && !hst.root) {
          hst.root = true;
          await this.type([['', ''], ['  >>> ZUGRIFF GEWÄHRT — root-Rechte erlangt <<<', 't-mag t-b'], ['  Tippe "ls" für die Dateien.', 't-dim']], 60);
          Story.check({ type: 'root', ip: hst.ip }); Bus.emit('net');
        } else if (!hst.root) this.println(`Noch ${hst.need - open} Port(s) bis root.`, 't-dim');
      } else { Hack.bump(12); this.println('Angriff fehlgeschlagen. IDS-Alarm: Trace +12 %', 't-err'); }
    },
    ls() {
      if (!this.needRoot()) return;
      const hst = Hack.conn.host; hst.logs++;
      this.println(` Verzeichnis von ${hst.name}:/home`, 't-wh');
      hst.files.forEach(f => this.println(`  ${f.name.padEnd(26)} ${String(f.size + ' MB').padStart(8)}  ${f.key ? '◄ ZIEL?' : f.value ? '$ ' + cr(f.value) : ''}`, f.key ? 't-warn' : f.value ? 't-ok' : 't-dim'));
      this.println(`  ${hst.files.length} Datei(en).  Log-Einträge: ${hst.logs}`, 't-dim');
    },
    cat(a) {
      if (!this.needRoot()) return;
      const f = this.findFile(a); if (!f) return this.println('Datei nicht gefunden.', 't-err');
      Hack.conn.host.logs++;
      if (f.name.endsWith('.mp4') || f.name.endsWith('.zip') || f.name.endsWith('.jpg')) return this.println('[Binärdaten] ' + '█▓▒░'.repeat(12), 't-dim');
      (f.content || '[leer]').split('\n').forEach(l => this.println('  ' + l, 't-wh'));
    },
    async download(a) {
      if (!this.needRoot()) return;
      const f = this.findFile(a); if (!f) return this.println('Datei nicht gefunden.', 't-err');
      const hst = Hack.conn.host; hst.logs++;
      if (S.files.some(x => x.name === f.name && x.from === hst.org)) return this.println('Hast du schon.', 't-dim');
      const t = Math.max(0.8, f.size / Hack.dlSpeed());
      const ok = await this.progress('DOWNLOAD ' + f.name, t);
      if (!ok) return this.println('Download abgebrochen.', 't-err');
      S.files.push({ name: f.name, size: f.size, value: f.value, content: f.content, from: hst.org, sold: false });
      this.println(`${f.name} gespeichert in „Eigene Dateien".${f.value ? ' Marktwert ca. ' + cr(f.value) + ' (verkaufen auf darkmarket.onion).' : ''}`, 't-ok');
      Story.check({ type: 'download', ip: hst.ip, file: f.name }); Bus.emit('files');
    },
    async rm(a) {
      if (!this.needRoot()) return;
      const hst = Hack.conn.host;
      if (a === 'system.log' || a === '*.log') return this.cmd.clearlogs.call(this);
      const f = this.findFile(a); if (!f) return this.println('Datei nicht gefunden.', 't-err');
      hst.logs++;
      const ok = await this.progress('SHRED ' + f.name, Math.max(.8, f.size / 400 + .6));
      if (!ok) return;
      hst.files = hst.files.filter(x => x !== f);
      this.println(`${f.name} unwiderruflich gelöscht.`, 't-ok');
      Story.check({ type: 'delete', ip: hst.ip, file: f.name });
    },
    async upload(a) {
      if (!this.needRoot()) return;
      const f = S.files.find(x => x.name.toLowerCase() === a.toLowerCase());
      if (!f) return this.println(a ? 'Diese Datei hast du nicht. Siehe „Eigene Dateien".' : 'Benutzung: upload <datei>', 't-err');
      const hst = Hack.conn.host; hst.logs++;
      const ok = await this.progress('UPLOAD ' + f.name, Math.max(1, f.size / Hack.dlSpeed() + .8));
      if (!ok) return;
      hst.files.push({ name: f.name, size: f.size, value: 0, content: f.content });
      this.println(`${f.name} hochgeladen.`, 't-ok');
      Story.check({ type: 'upload', ip: hst.ip, file: f.name });
    },
    async transfer(a) {
      if (!this.needRoot()) return;
      const hst = Hack.conn.host, n = Math.floor(+a);
      if (!hst.bank) return this.println('Kein Konto auf diesem Server.', 't-err');
      if (!n || n <= 0) return this.println(`Benutzung: transfer <betrag>   (verfügbar: ${cr(hst.bank)})`, 't-err');
      const amt = Math.min(n, hst.bank);
      hst.logs += 2;
      const ok = await this.progress('SWIFT ' + cr(amt), 1.2 + amt / 4000);
      if (!ok) return;
      hst.bank -= amt; Eco.addMoney(amt);
      Hack.bump(4 + amt / 1500);
      this.println(`${cr(amt)} auf dein Konto umgeleitet. Rest: ${cr(hst.bank)}. Trace +${(4 + amt / 1500).toFixed(0)} %`, 't-ok');
      Eco.addHeat(Math.round(amt / 1200) + 1, null);
      Story.check({ type: 'transfer', ip: hst.ip, amount: amt });
    },
    async clearlogs() {
      if (!this.needConn()) return;
      const hst = Hack.conn.host;
      if (!hst.root) { this.println('Ohne root kannst du die Logs nicht löschen. Trenn lieber schnell.', 't-err'); return; }
      if (!hst.logs) return this.println('Keine Log-Einträge vorhanden.', 't-dim');
      const ok = await this.progress(`WIPE ${hst.logs} Einträge`, Hack.wipeTime());
      if (!ok) return;
      hst.logs = 0; this.println('Logs bereinigt. Du warst nie hier.', 't-ok');
    },
    decoy() {
      if (!this.needConn()) return;
      S.items = S.items || {}; if (!S.items.decoy) return this.println('Keine Decoys. Kaufbar auf darkmarket.onion.', 't-err');
      S.items.decoy--; Hack.conn.trace = Math.max(0, Hack.conn.trace - 25);
      this.println(`Köder-Pakete gesendet. Trace −25 %. (${S.items.decoy} übrig)`, 't-ok'); Sound.sfx('zap');
    },
    dc() {
      if (!Hack.conn) return this.println('Nicht verbunden.', 't-dim');
      Hack.disconnect();
    },
    status() {
      this.println(`${S.alias} — ${Eco.rank()}   Konto: ${cr(S.money)}   Ruf: ${S.rep}   Heat: ${Math.round(S.heat)} %`, 't-wh');
      this.println(`CPU: ${HW.cpu.lv[S.hw.cpu - 1]}   RAM: ${HW.ram.lv[S.hw.ram - 1]}   Netz: ${HW.net.lv[S.hw.net - 1]}`, 't-dim');
      this.println('Tools: ' + Object.keys(TOOLS).filter(k => S.tools[k]).map(k => TOOLS[k].name).join(', '), 't-dim');
      this.println(`Proxys: ${Hack.proxyCount()}   Decoys: ${(S.items && S.items.decoy) || 0}`, 't-dim');
    },
  },
};
Term.know = Hack.know.bind(Hack);
