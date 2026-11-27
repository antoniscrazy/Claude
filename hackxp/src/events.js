/* =====================================================================
   EVENTS — enemy hacker / bot attacks, malware, phishing, random world
===================================================================== */
const ATTACKERS = [
  { name: 'Botnetz „SWARM"', kind: 'bot', d: 2, msg: '4.096 infizierte Kühlschränke greifen dich an' },
  { name: 'K1ll3rB0t', kind: 'bot', d: 2, msg: 'Automatischer Wurm scannt deine Ports' },
  { name: 'Mirai-Klon „Hydra-7"', kind: 'bot', d: 3, msg: 'DDoS-Welle auf deinen Anschluss' },
  { name: 'sp1der', kind: 'hacker', d: 3, msg: 'Rivale versucht, deine Wallet zu leeren' },
  { name: 'Z3r0C00l', kind: 'hacker', d: 3, msg: 'Hacker will deine Tools stehlen' },
  { name: 'OmniCorp SecOps', kind: 'hacker', d: 4, msg: 'Konzern-Sicherheit schlägt zurück' },
];
const Events = {
  malware: [], next: 0, busy: false, popTimer: 0,
  init() {
    this.next = Date.now() + 75000;
    setInterval(() => this.tick(), 1000);
    setInterval(() => this.malwareTick(), 4000);
  },
  tick() {
    if (!Game.running || this.busy || Mini.active) return;
    if (Date.now() < this.next) return;
    if (S.story < 1) { this.next = Date.now() + 20000; return; }
    this.next = Date.now() + rnd(70, 140) * 1000 / (S.flags.nyxHunt ? 1.6 : 1);
    const r = Math.random();
    if (r < .34) this.attack();
    else if (r < .5) this.phishing();
    else if (r < .64) this.market();
    else if (r < .76) this.sweep();
    else if (r < .88 && S.story >= 2) this.tip();
    else this.spam();
  },

  /* ---------- incoming attack (movie-style) ---------- */
  attack(forced) {
    const pool = ATTACKERS.filter(a => a.d <= 2 + Math.floor(S.rep / 200));
    const a = forced ? { name: forced, kind: 'hacker', d: 3, msg: 'Rache-Angriff auf deinen Rechner' } : pick(pool);
    this.intrusion(a);
  },
  counterAttack(name) { this.attack(name); },
  intrusion(a) {
    if (this.busy) return;
    if (Mini.active || !Game.running) { setTimeout(() => this.intrusion(a), 8000); return; }
    this.busy = true;
    const ip = randIP();
    Sound.sfx('alarm');
    if (Hack.conn) Term.println(`\n  !!! EINGEHENDER ANGRIFF von ${ip} (${a.name}) !!!`, 't-err t-b');
    const ov = h(`<div id="intrusion"><canvas></canvas><div class="in-box">
      <div class="in-blink">⚠ EINDRINGLING ERKANNT ⚠</div>
      <div class="in-who">${esc(a.name)} · <span class="mono">${ip}</span></div>
      <div class="in-msg">${esc(a.msg)}</div>
      <div class="in-count">Firewall fällt in <b>8</b> s</div>
      <div class="in-btns"><button class="xbtn danger" type="button" data-def>ABWEHREN</button><button class="xbtn" type="button" data-ign>Ignorieren</button></div></div></div>`);
    $('#os').appendChild(ov);
    const cv = ov.querySelector('canvas'), ctx = cv.getContext('2d');
    const cols = []; let raf, t0 = performance.now();
    const draw = t => {
      const k = devicePixelRatio, W = cv.width = innerWidth * k, H = cv.height = innerHeight * k;
      const fs = 14 * k, n = Math.ceil(W / fs);
      while (cols.length < n) cols.push(Math.random() * H);
      ctx.fillStyle = 'rgba(20,0,0,.78)'; ctx.fillRect(0, 0, W, H);
      ctx.font = `${fs}px monospace`;
      cols.forEach((y, i) => { ctx.fillStyle = Math.random() < .1 ? '#fff' : '#ff3030'; ctx.fillText('0123456789ABCDEF'[rnd(0, 15)], i * fs, y); cols[i] = y > H + Math.random() * 3000 ? 0 : y + fs * (0.5 + (i % 3) * .3); });
      // attack line: attacker → you
      const ax = W * .12, ay = H * .2, bx = W * .5, by = H * .78, p = ((t - t0) / 700) % 1;
      ctx.strokeStyle = 'rgba(255,60,60,.8)'; ctx.lineWidth = 2 * k; ctx.setLineDash([8 * k, 6 * k]); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(W * .2, H * .7, bx, by); ctx.stroke(); ctx.setLineDash([]);
      const qx = (1 - p) ** 2 * ax + 2 * (1 - p) * p * W * .2 + p * p * bx, qy = (1 - p) ** 2 * ay + 2 * (1 - p) * p * H * .7 + p * p * by;
      ctx.fillStyle = '#fff'; ctx.shadowColor = '#f00'; ctx.shadowBlur = 20 * k; ctx.beginPath(); ctx.arc(qx, qy, 5 * k, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff6b6b'; ctx.font = `bold ${12 * k}px monospace`; ctx.fillText(ip, ax - 20 * k, ay - 10 * k); ctx.fillText('DEIN PC', bx - 26 * k, by + 22 * k);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    let left = 8; const cEl = ov.querySelector('.in-count b');
    const iv = setInterval(() => { left--; cEl.textContent = left; Sound.sfx('beep'); if (left <= 0) resolve(null); }, 1000);
    let done = false;
    const resolve = async (choice) => {
      if (done) return; done = true; clearInterval(iv); cancelAnimationFrame(raf); ov.remove();
      let ok = false;
      if (choice === 'def') { Term.hollywood(10, 't-err'); ok = await Mini.run('defense', a.d); }
      this.busy = false;
      if (ok) {
        S.stats.defended++; Eco.addRep(5);
        balloon('Angriff abgewehrt!', `${esc(a.name)} wurde geblockt. Seine IP <b>${ip}</b> ist jetzt bekannt: <b>Konter-Hack</b> möglich!`, { icon: 'shieldok', sound: 'win', ms: 9000, onClick: () => Apps.open('netmap') });
        const hst = makeHost({ ip, name: a.kind === 'bot' ? 'c2-' + a.name.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8) : a.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-pc', org: a.kind === 'bot' ? 'Botnetz-Steuerserver' : 'privat (' + a.name + ')', sec: clamp(a.d, 1, 4), ports: [[80], [80, 21], [80, 22, 21], [22, 80, 25, 21]][clamp(a.d, 1, 4) - 1], need: clamp(a.d, 1, 3), random: true, bank: rnd(3, 10) * 200, loot: 2 });
        Hack.know(hst.ip);
        News.add(`${a.kind === 'bot' ? 'Botnetz' : 'Hacker'} „${esc(a.name)}" scheitert an unbekanntem Verteidiger`, 'Szene');
      } else this.damage(a);
    };
    ov.querySelector('[data-def]').onclick = () => resolve('def');
    ov.querySelector('[data-ign]').onclick = () => resolve(null);
  },
  damage(a) {
    const loss = Math.min(Math.round(S.money * .15), 1500);
    Eco.addMoney(-loss);
    const mw = pick(['svch0st.exe', 'winupdate32.exe', 'miner_x.exe', 'k3ylogger.exe', 'bonzi_helper.exe']);
    if (!this.malware.includes(mw)) this.malware.push(mw);
    document.body.animate([{ filter: 'hue-rotate(0)' }, { filter: 'hue-rotate(160deg) saturate(3)' }, { filter: 'none' }], { duration: 600 });
    Sound.sfx('fail');
    balloon('System kompromittiert!', `${esc(a.name)} hat <b>${cr(loss)}</b> gestohlen und <b>${mw}</b> installiert. Beende den Prozess im <b>Task-Manager</b>, sonst wird es teurer!`, { kind: 'danger', icon: 'error', sound: 'error', ms: 10000, onClick: () => Apps.open('taskmgr') });
    TaskMgr.render();
  },
  malwareTick() {
    if (!Game.running || !this.malware.length) return;
    const drain = this.malware.length * rnd(8, 20);
    S.money = Math.max(0, S.money - drain); UI.update();
    if (Math.random() < .45) this.popup();
  },
  killMalware(n) {
    this.malware = this.malware.filter(x => x !== n);
    Sound.sfx('zap'); balloon('Malware beendet', `${esc(n)} wurde entfernt.`, { icon: 'shieldok' });
    $$('.win').forEach(w => { if (w.querySelector('.ad-pop')) { const id = Object.keys(WM.wins).find(k => WM.wins[k].el === w); id && WM.close(id); } });
  },
  popup() {
    const ads = [['SIE HABEN GEWONNEN!!!', 'Sie sind der 1.000.000. Besucher! Klicken Sie hier für Ihren Preis!'], ['Ihr PC ist langsam!', 'RAM-Doppler 2000 jetzt herunterladen! 100 % kostenlos!'], ['Singles in Ihrer Nähe', 'Mehr als 3 Singles warten auf Ihren Klick!'], ['WARNUNG: VIRUS GEFUNDEN', '(Ironischerweise stimmt das.) Kaufen Sie Antivirus Ultra Pro!']];
    const [t, m] = pick(ads), id = 'ad' + (S.seq++);
    WM.create({ id, title: t, icon: 'warn', w: 300, h: 160, noMax: true, noResize: true, keepSize: true, x: rnd(40, Math.max(60, innerWidth - 360)), y: rnd(20, Math.max(40, innerHeight - 260)),
      render: b => { b.innerHTML = `<div class="dlg ad-pop" style="background:linear-gradient(#fffbe0,#ffe066)"><b style="color:#c40000;font-size:14px">${t}</b><div>${m}</div><div class="dlg-btns"><button class="xbtn go" type="button">JETZT KLICKEN!</button></div></div>`; b.querySelector('button').onclick = () => { Eco.addMoney(-50); WM.close(id); balloon('Reingefallen', 'Der Klick hat dich 50 Cr gekostet.', { icon: 'error' }); }; } });
  },

  /* ---------- mail traps ---------- */
  phishing() {
    const p = pick([['Paketdienst', 'Ihre Sendung konnte nicht zugestellt werden', 'sendungsdaten.exe'], ['Lotto-Zentrale', 'GEWINNBENACHRICHTIGUNG 250.000 Cr', 'gewinn_formular.exe'], ['DarkMarket Support', 'Ihr Wallet wurde gesperrt', 'wallet_fix.exe'], ['Nyx', 'Neues Tool für dich', 'nyx_tool.exe']]);
    Mail.receive({ from: `${p[0]} <service@${p[0].toLowerCase().replace(/[^a-z]/g, '')}-${rnd(10, 99)}.biz>`, subj: p[1], body: `<p>Sehr geehrter Kunde,</p><p>bitte öffnen Sie den Anhang, um fortzufahren. Dies ist dringend.</p><p>Mit freundlichen Grüßen<br>${p[0]}</p><p style="color:#aaa;font-size:10px">Absender-Server: ${randIP()}</p>`, attach: p[2], phish: true });
  },
  openAttachment(m) {
    if (m.phish) {
      if (m.opened) return; m.opened = true;
      Sound.sfx('error');
      msgbox(m.attach, `${esc(m.attach)} wird ausgeführt…<br><b style="color:#c40000">Das war ein Trojaner!</b>`, { icon: 'error' });
      setTimeout(() => this.intrusion({ name: 'Trojaner aus ' + m.attach, kind: 'bot', d: 2, msg: 'Schadcode öffnet eine Hintertür' }), 1200);
    }
  },
  spam() {
    const s = pick([['Prinz Abubakar', 'Dringende Geschäftsangelegenheit', 'Ich habe 40 Millionen geerbt und brauche nur Ihre Kontonummer.'], ['Hacker-Forum', 'Wochen-Digest', 'Top-Thema: „Ist Ketchup auf Pizza ein Verbrechen?" (312 Antworten)'], ['Mama', 'Bist du gesund?', 'Du meldest dich nie. Iss was Ordentliches. Und mach den Computer mal aus!']]);
    Mail.receive({ from: s[0] + ' <x@mail.net>', subj: s[1], body: `<p>${s[2]}</p>` });
  },
  market() {
    S.flags.market = pick([0.6, 0.75, 1.4, 1.7, 2]);
    balloon('DarkMarket', S.flags.market > 1 ? `Hohe Nachfrage nach Daten! Verkaufspreise <b>+${Math.round((S.flags.market - 1) * 100)} %</b>.` : `Datenflaute. Preise <b>−${Math.round((1 - S.flags.market) * 100)} %</b>. Lieber warten.`, { icon: 'skull', onClick: () => { Browser.tab = 'sell'; Apps.open('market'); } });
    setTimeout(() => { S.flags.market = 1; }, 120000);
  },
  sweep() {
    if (Hack.conn) { Hack.bump(15); Term.println('\n  ⚠ Cyberpol-Netzscan! Deine Verbindung wird abgetastet: Trace +15 %', 't-err t-b'); balloon('Cyberpol-Scan', 'Großfahndung im Netz. Trace +15 %!', { kind: 'danger', icon: 'shield', sound: 'alarm' }); }
    else { balloon('Cyberpol-Scan', 'Die Cyberpol durchsucht das Netz. Gut, dass du gerade offline bist.', { icon: 'shieldok' }); }
  },
  tip() {
    Mail.receive({ from: 'Anonymer Tippgeber <tip@void.onion>', subj: 'Leichte Beute', body: `<p>Kleiner Tipp: ${pick(['Ein Online-Casino', 'Eine Krypto-Börse', 'Ein Spam-Versender'])} hat seine Server schlecht gesichert. Viel Geld, kaum Schutz.</p><p>Nutze <code>scan</code> in der Konsole. Viel Glück.</p>`, tag: 'Tipp' });
    S.flags.lastScan = 0;
  },
};

/* ---------- Hollywood code burst in terminal (movie look) ---------- */
Term.hollywood = function (n = 14, cls = 't-dim') {
  const frags = ['0x7FFE4A20', 'mov eax, [ebp+8]', 'xor ecx, ecx', 'jmp 0x0040F1A3', 'GET /admin.php?id=1%27--', 'ACK SEQ=', 'inject shellcode', 'bypass ASLR', 'heap spray', 'decrypt RSA-2048 block', 'syn flood', 'rootkit.ko loaded', 'sha256:', 'PORT KNOCK', 'tunnel via tor', 'overwrite EIP'];
  let i = 0;
  const iv = setInterval(() => {
    const hex = Array.from({ length: 6 }, () => rnd(0, 0xffff).toString(16).padStart(4, '0')).join(' ');
    this.println(`  ${hex}  ${pick(frags)}${Math.random() < .3 ? ' ... OK' : ''}`, cls);
    if (++i >= n) clearInterval(iv);
  }, 35);
};
