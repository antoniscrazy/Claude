/* =====================================================================
   MINIGAMES — breach, lock, typer, memory, signal, packets
   Mini.run(game, difficulty, opts) → Promise<boolean>
===================================================================== */
const Mini = {
  active: false,
  timeMul() { return 1 + 0.18 * (S.hw.cpu - 1); },
  run(game, d, opts = {}) {
    if (this.active) return Promise.resolve(false);
    this.active = true; S.stats.minis++;
    const meta = {
      breach: ['WebXploit.exe', 'Speicher-Breach · Port 80'], lock: ['SSHcrack.exe', 'Brute-Force · Port 22'], typer: ['SMTPoverflow.exe', 'Buffer-Overflow · Port 25'],
      memory: ['SQLinject.exe', 'Query-Muster · Port 1433'], signal: ['FirewallBreaker.exe', 'Frequenz-Sync · Firewall'], packets: ['FTPBounce.exe', 'Paket-Abfang · Port 21'],
      defense: ['ZeroShield.exe', 'GEGENANGRIFF ABWEHREN'],
    }[game];
    return new Promise(res => {
      let finished = false, timers = [], raf = 0, cleanup = [];
      const T = {
        every(ms, f) { const t = setInterval(f, ms); timers.push(t); return t; },
        after(ms, f) { const t = setTimeout(f, ms); timers.push(t); return t; },
        raf(f) { const loop = (ts) => { if (finished) return; f(ts); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); },
        onEnd(f) { cleanup.push(f); },
      };
      const finish = (ok, msg) => {
        if (finished) return; finished = true;
        timers.forEach(t => { clearInterval(t); clearTimeout(t); }); cancelAnimationFrame(raf); cleanup.forEach(f => f());
        S.stats.minisWon += ok ? 1 : 0;
        Sound.sfx(ok ? 'ok' : 'fail');
        const w = WM.wins.mini;
        if (w) {
          w.body.appendChild(h(`<div class="mg-res ${ok ? 'ok' : 'bad'}">${msg || (ok ? 'ZUGRIFF OK' : 'FEHLGESCHLAGEN')}</div>`));
          setTimeout(() => { if (WM.wins.mini) { WM.wins.mini.o.onClose = null; WM.close('mini'); } this.active = false; res(ok); }, 950);
        } else { this.active = false; res(ok); }
      };
      WM.create({
        id: 'mini', title: meta[0] + ' — ' + meta[1], icon: game === 'defense' ? 'shield' : 'lock', w: 540, h: game === 'packets' || game === 'defense' ? 470 : 460,
        noMax: true, noMin: true, keepSize: innerWidth > 720,
        onClose: () => { finish(false, 'ABGEBROCHEN'); return true; },
        render: (b) => {
          b.innerHTML = `<div class="mg"><div class="mg-head"><b>${meta[0]}</b><span class="mg-info"></span></div><div class="mg-time"><i style="width:100%"></i></div><div class="mg-body"></div></div>`;
          const body = b.querySelector('.mg-body'), info = b.querySelector('.mg-info'), bar = b.querySelector('.mg-time i');
          // shared countdown
          const clock = {
            total: 0, left: 0,
            start(sec, onOut) { this.total = this.left = sec; const t0 = performance.now(); let last = t0;
              T.every(100, () => { const n = performance.now(); this.left -= (n - last) / 1000; last = n; bar.style.width = clamp(this.left / this.total * 100, 0, 100) + '%'; if (this.left <= 5 && Math.floor(this.left * 10) % 10 === 0) Sound.sfx('beep'); if (this.left <= 0) onOut ? onOut() : finish(false, 'ZEIT ABGELAUFEN'); }); },
            add(s) { this.left = Math.min(this.total, this.left + s); },
          };
          this.games[game](body, d, finish, T, clock, info, opts);
        },
      });
    });
  },
  games: {
    /* ---------- BREACH: pick codes along alternating row/column ---------- */
    breach(el, d, done, T, clock, info) {
      const N = d <= 2 ? 5 : 6, codes = ['1C', '55', '7A', 'BD', 'E9', 'FF'];
      const len = 3 + (d >= 3 ? 1 : 0) + (d >= 5 ? 1 : 0);
      const grid = Array.from({ length: N }, () => Array.from({ length: N }, () => pick(codes)));
      let r = 0, c = rnd(0, N - 1); const path = [[0, c]];
      for (let i = 1; i < len; i++) {
        let nr = r, nc = c, tries = 0;
        do { if (i % 2) nr = rnd(0, N - 1); else nc = rnd(0, N - 1); tries++; } while (path.some(p => p[0] === nr && p[1] === nc) && tries < 60);
        r = nr; c = nc; path.push([r, c]);
      }
      const target = path.map(() => pick(codes));
      path.forEach(([pr, pc], i) => grid[pr][pc] = target[i]);
      const bufSize = len + 3; const buf = []; let prog = 0, mode = 'row', line = 0;
      el.innerHTML = `<div class="mg-hint">Wähle Codes in der <b>markierten Zeile/Spalte</b>. Gib die Zielsequenz in Reihenfolge ein. Nach jedem Klick wechselt die Richtung.</div>
        <div class="br-seq"></div><div class="br-buf"></div><div class="br-grid" style="grid-template-columns:repeat(${N},auto)"></div>`;
      const seqEl = el.querySelector('.br-seq'), bufEl = el.querySelector('.br-buf'), gEl = el.querySelector('.br-grid');
      const used = new Set();
      const draw = () => {
        seqEl.innerHTML = target.map((t, i) => `<span class="${i < prog ? 'done' : ''}">${t}</span>`).join('');
        bufEl.innerHTML = Array.from({ length: bufSize }, (_, i) => `<span>${buf[i] || ''}</span>`).join('');
        gEl.innerHTML = '';
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const k = y + ',' + x, act = !used.has(k) && (mode === 'row' ? y === line : x === line);
          const b = h(`<button type="button" class="${used.has(k) ? 'used' : ''} ${act ? 'line' : ''}" ${act ? '' : 'disabled'}>${used.has(k) ? '[ ]' : grid[y][x]}</button>`);
          b.onclick = () => pickCell(y, x);
          gEl.appendChild(b);
        }
        info.textContent = `Puffer ${buf.length}/${bufSize}`;
      };
      const pickCell = (y, x) => {
        const code = grid[y][x]; used.add(y + ',' + x); buf.push(code);
        if (code === target[prog]) { prog++; Sound.sfx('beep'); } else { prog = code === target[0] ? 1 : 0; Sound.sfx('hit'); }
        if (mode === 'row') { mode = 'col'; line = x; } else { mode = 'row'; line = y; }
        draw();
        if (prog >= len) return done(true, 'BREACH OK');
        if (buf.length >= bufSize) return done(false, 'PUFFER VOLL');
        // dead end: no free cells in the active line
        const free = Array.from({ length: N }, (_, i) => mode === 'row' ? line + ',' + i : i + ',' + line).some(k => !used.has(k));
        if (!free) done(false, 'SACKGASSE');
      };
      draw(); clock.start((42 - d * 4) * Mini.timeMul());
    },

    /* ---------- LOCK: guess the code (exact/near feedback) ---------- */
    lock(el, d, done, T, clock, info) {
      const len = d >= 4 ? 5 : 4, digits = [...'0123456789'].sort(() => Math.random() - .5).slice(0, len);
      const tries = 8 - Math.ceil(d / 2); const rows = []; let cur = ''; const dead = new Set();
      el.innerHTML = `<div class="mg-hint">Knacke den ${len}-stelligen SSH-Code (keine Ziffer doppelt).<br><span style="color:#33ff77">■ richtig</span> · <span style="color:#ffcf3a">■ falsche Stelle</span> · <span style="color:#567">■ nicht enthalten</span>${S.hw.cpu >= 3 ? `<br>Sniffer: erste Ziffer ist <b>${digits[0]}</b>` : ''}</div><div class="lk-rows"></div><div class="lk-pad"></div>`;
      const rowsEl = el.querySelector('.lk-rows'), pad = el.querySelector('.lk-pad');
      const draw = () => {
        rowsEl.innerHTML = '';
        for (let i = 0; i < tries; i++) {
          const r = rows[i]; const row = h('<div class="lk-row"></div>');
          for (let k = 0; k < len; k++) {
            let ch = '', cls = '';
            if (r) { ch = r[k]; cls = r[k] === digits[k] ? 'g' : digits.includes(r[k]) ? 'y' : 'x'; }
            else if (i === rows.length) ch = cur[k] || '';
            row.appendChild(h(`<span class="${cls}">${ch || '·'}</span>`));
          }
          rowsEl.appendChild(row);
        }
        pad.innerHTML = '';
        [...'0123456789', '⌫', '↵'].forEach(k => { const b = h(`<button type="button" class="${dead.has(k) ? 'dead' : ''}">${k}</button>`); b.onclick = () => press(k); pad.appendChild(b); });
        info.textContent = `Versuch ${Math.min(rows.length + 1, tries)}/${tries}`;
      };
      const press = k => {
        if (k === '⌫') cur = cur.slice(0, -1);
        else if (k === '↵' || k === 'Enter') {
          if (cur.length !== len) return Sound.sfx('error');
          rows.push(cur); [...cur].forEach(ch => { if (!digits.includes(ch)) dead.add(ch); });
          if (cur === digits.join('')) { draw(); return done(true, 'CODE KORREKT'); }
          cur = ''; Sound.sfx('hit');
          if (rows.length >= tries) { draw(); return done(false, 'GESPERRT'); }
        } else if (/^\d$/.test(k) && cur.length < len && !cur.includes(k)) { cur += k; Sound.sfx('key'); }
        draw();
      };
      const kd = e => { if (/^\d$/.test(e.key) || e.key === 'Enter') { e.preventDefault(); press(e.key); } else if (e.key === 'Backspace') { e.preventDefault(); press('⌫'); } };
      document.addEventListener('keydown', kd); T.onEnd(() => document.removeEventListener('keydown', kd));
      draw(); clock.start((60 - d * 5) * Mini.timeMul());
    },

    /* ---------- TYPER: type payloads before time runs out ---------- */
    typer(el, d, done, T, clock, info) {
      const pool = ['HELO overflow.local', 'MAIL FROM:<root@0day>', 'RCPT TO:<admin>', 'DATA %x%x%x%n', 'VRFY root', 'EXPN admins', 'jmp esp 0x7c86467b', 'EXEC /bin/sh -i', 'nop sled x90x90x90', 'push 0xdeadbeef', 'QUIT; rm -rf /var/log', 'AUTH LOGIN AAAA', 'call [eax+0x1c]', 'setuid(0)'];
      const list = pool.sort(() => Math.random() - .5).slice(0, 3 + d); let idx = 0;
      el.innerHTML = `<div class="mg-hint">Tippe jede Payload exakt ab und drück Enter. Tippfehler kosten Zeit.</div><div class="ty-count"></div><div class="ty-target"></div><input class="ty-in" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Payload eingeben">`;
      const tgt = el.querySelector('.ty-target'), inp = el.querySelector('.ty-in'), cnt = el.querySelector('.ty-count');
      const draw = () => {
        const t = list[idx], v = inp.value; let html = '';
        for (let i = 0; i < t.length; i++) { const ch = esc(t[i]); if (i < v.length) html += `<span class="${v[i].toLowerCase() === t[i].toLowerCase() ? 'ok' : 'bad'}">${ch}</span>`; else html += ch; }
        tgt.innerHTML = html; cnt.textContent = `Payload ${idx + 1} / ${list.length}`; info.textContent = `${idx}/${list.length} injiziert`;
      };
      let lastBad = 0;
      inp.addEventListener('input', () => {
        const t = list[idx], v = inp.value; Sound.sfx('type');
        const wrong = [...v].some((ch, i) => !t[i] || ch.toLowerCase() !== t[i].toLowerCase());
        if (wrong && v.length > lastBad) { clock.add(-1.2); Sound.sfx('hit'); }
        lastBad = wrong ? v.length : 0;
        if (v.toLowerCase() === t.toLowerCase()) next();
        draw();
      });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter' && inp.value.toLowerCase() === list[idx].toLowerCase()) next(); });
      const next = () => { idx++; inp.value = ''; lastBad = 0; Sound.sfx('beep'); if (idx >= list.length) return done(true, 'OVERFLOW!'); draw(); };
      draw(); setTimeout(() => inp.focus(), 60);
      clock.start(list.length * (7.2 - d * 0.55) * Mini.timeMul());
    },

    /* ---------- MEMORY: repeat the growing query pattern ---------- */
    memory(el, d, done, T, clock, info) {
      const labels = ['users', 'orders', 'keys', 'logs', 'admin', 'files', 'cards', 'auth', 'meta'];
      const full = Array.from({ length: 3 + d }, () => rnd(0, 8));
      let shown = 3, input = [], lives = 2, locked = true;
      el.innerHTML = `<div class="mg-hint">Merke dir die Reihenfolge der aufleuchtenden Tabellen und wiederhole sie. Das Muster wird länger.</div><div class="br-grid" style="grid-template-columns:repeat(3,auto)"></div><div class="ty-count"></div>`;
      const g = el.querySelector('.br-grid'), st = el.querySelector('.ty-count');
      const btns = labels.map((l, i) => { const b = h(`<button type="button" style="width:96px;height:52px;font-size:12px">${l}</button>`); b.onclick = () => tap(i); g.appendChild(b); return b; });
      const flash = (i, ms) => { btns[i].classList.add('line'); btns[i].style.background = '#33ff77'; btns[i].style.color = '#001'; Sound.tone(300 + i * 70, ms / 1000, 'square', .03); setTimeout(() => { btns[i].style.background = ''; btns[i].style.color = ''; btns[i].classList.remove('line'); }, ms); };
      const play = async () => {
        locked = true; input = []; st.textContent = 'Muster wird gesendet…'; info.textContent = `Länge ${shown}/${full.length} · Leben ${lives}`;
        await sleep(500); const sp = Math.max(260, 560 - d * 50);
        for (let i = 0; i < shown; i++) { if (!WM.wins.mini) return; flash(full[i], sp * .75); await sleep(sp); }
        locked = false; st.textContent = 'Jetzt du!';
      };
      const tap = i => {
        if (locked) return; flash(i, 180); input.push(i);
        const k = input.length - 1;
        if (input[k] !== full[k]) {
          lives--; Sound.sfx('hit');
          if (lives <= 0) return done(false, 'INJEKTION ERKANNT');
          st.textContent = 'Falsch! Muster wird wiederholt.'; return setTimeout(play, 700);
        }
        if (input.length === shown) {
          if (shown >= full.length) return done(true, 'QUERY OK');
          shown++; setTimeout(play, 500);
        }
      };
      play(); clock.start((40 + d * 8) * Mini.timeMul());
    },

    /* ---------- SIGNAL: match the firewall waveform ---------- */
    signal(el, d, done, T, clock, info) {
      const tgt = { f: 1 + Math.random() * 4, a: .35 + Math.random() * .6, p: Math.random() * Math.PI * 2 };
      const usePhase = d >= 3;
      el.innerHTML = `<div class="mg-hint">Gleiche deine Welle (grün) der Firewall-Frequenz (rot) an. Halte die Übereinstimmung, bis die Sperre fällt.</div>
        <canvas class="sg-canvas"></canvas>
        <div class="sg-ctrl"><label for="sg-f">Frequenz</label><input id="sg-f" type="range" min="0.5" max="5.5" step="0.01" value="3">
        <label for="sg-a">Amplitude</label><input id="sg-a" type="range" min="0.1" max="1" step="0.01" value="0.5">
        ${usePhase ? '<label for="sg-p">Phase</label><input id="sg-p" type="range" min="0" max="6.283" step="0.01" value="0">' : ''}</div>
        <div class="sg-lock"><div class="pbar"><i></i></div></div>`;
      const cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), lockBar = el.querySelector('.sg-lock i');
      const F = el.querySelector('#sg-f'), A = el.querySelector('#sg-a'), P = el.querySelector('#sg-p');
      let lock = 0, last = performance.now(), t = 0;
      T.raf(now => {
        const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
        if (d >= 4) { tgt.f += Math.sin(t * .7) * .004 * d; tgt.f = clamp(tgt.f, .6, 5.4); }
        const pf = +F.value, pa = +A.value, pp = P ? +P.value : tgt.p;
        let dp = Math.abs(((pp - tgt.p) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
        const score = 1 - (Math.abs(pf - tgt.f) / 1.6 + Math.abs(pa - tgt.a) * 1.4 + (usePhase ? dp / Math.PI * .7 : 0));
        if (score > .86) { lock += dt / 2.4; if (Math.random() < .2) Sound.tone(600 + lock * 600, .03, 'sine', .02); } else lock = Math.max(0, lock - dt * .35);
        lockBar.style.width = clamp(lock * 100, 0, 100) + '%';
        info.textContent = `Sync ${Math.round(clamp(score, 0, 1) * 100)}%`;
        const W = cv.width = cv.clientWidth * devicePixelRatio, H = cv.height = cv.clientHeight * devicePixelRatio;
        ctx.strokeStyle = '#0d3a1c'; ctx.lineWidth = 1;
        for (let x = 0; x < W; x += W / 12) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
        const wave = (f, a, p, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); for (let x = 0; x <= W; x += 3) { const y = H / 2 + Math.sin(x / W * Math.PI * 2 * f + p + t * 2) * a * H * .42; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); };
        wave(tgt.f, tgt.a, tgt.p, '#ff4f4f', 2.5 * devicePixelRatio);
        wave(pf, pa, pp, score > .86 ? '#5fe3ff' : '#33ff77', 2 * devicePixelRatio);
        if (lock >= 1) done(true, 'FIREWALL OFFEN');
      });
      clock.start((38 - d * 2) * Mini.timeMul());
    },

    /* ---------- PACKETS: catch data packets / defend your core ---------- */
    packets(el, d, done, T, clock, info, opts = {}) { Mini.packetGame(el, d, done, T, clock, info, false); },
    defense(el, d, done, T, clock, info) { Mini.packetGame(el, d, done, T, clock, info, true); },
  },
  packetGame(el, d, done, T, clock, info, defense) {
    el.innerHTML = `<div class="mg-hint">${defense ? 'Ein Angreifer schickt <b style="color:#ff4f4f">Malware-Pakete (rot)</b> an deinen Rechner. Klick sie weg, bevor sie den Kern treffen! Blaue Pakete sind harmlos.' : 'Klick die <b style="color:#33ff77">grünen Datenpakete</b>, bevor sie den Server erreichen. <b style="color:#ff4f4f">Rote Honeypots</b> nicht anfassen!'}</div><canvas class="pk-canvas"></canvas>`;
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
    const goal = defense ? 0 : 5 + d * 2; let got = 0, hp = defense ? 5 : 3; const ps = []; let last = performance.now(), spawn = 0, t = 0, fx = [];
    const dur = defense ? 22 : 34;
    const hit = (e) => {
      const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        if (Math.hypot((p.x - x) * r.width, (p.y - y) * r.height) < (isTouch() ? 26 : 18)) {
          ps.splice(i, 1); fx.push({ x: p.x, y: p.y, t: 0, c: p.good ? '#33ff77' : '#ff4f4f' });
          if (defense) { if (p.good) { hp--; Sound.sfx('hit'); } else { Sound.sfx('zap'); } }
          else { if (p.good) { got++; Sound.sfx('beep'); } else { hp--; Sound.sfx('hit'); Hack.bump(4); } }
          return;
        }
      }
    };
    cv.addEventListener('pointerdown', hit);
    T.raf(now => {
      const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; spawn -= dt;
      if (spawn <= 0) {
        spawn = (defense ? .55 : .7) - d * .06 - (defense ? t / 80 : 0);
        const a = Math.random() * Math.PI * 2;
        const good = defense ? Math.random() < .25 : Math.random() < .62;
        ps.push({ x: .5 + Math.cos(a) * .62, y: .5 + Math.sin(a) * .62, a, v: (defense ? .16 : .13) + d * .02 + Math.random() * .05, good, wob: Math.random() * 6 });
      }
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]; const dx = .5 - p.x, dy = .5 - p.y, L = Math.hypot(dx, dy);
        p.x += dx / L * p.v * dt + Math.sin(t * 3 + p.wob) * .0015; p.y += dy / L * p.v * dt + Math.cos(t * 3 + p.wob) * .0015;
        if (L < .06) { ps.splice(i, 1); if (defense && !p.good) { hp--; Sound.sfx('hit'); fx.push({ x: .5, y: .5, t: 0, c: '#ff4f4f', big: 1 }); } }
      }
      info.textContent = defense ? `Kern ${'♥'.repeat(Math.max(0, hp))}` : `Pakete ${got}/${goal} · Leben ${'♥'.repeat(Math.max(0, hp))}`;
      const W = cv.width = cv.clientWidth * devicePixelRatio, H = cv.height = cv.clientHeight * devicePixelRatio, k = devicePixelRatio;
      ctx.clearRect(0, 0, W, H);
      for (let r = 1; r <= 4; r++) { ctx.strokeStyle = 'rgba(51,255,119,' + (.05 + r * .02) + ')'; ctx.beginPath(); ctx.arc(W / 2, H / 2, r * Math.min(W, H) * .12, 0, 7); ctx.stroke(); }
      const pulse = 1 + Math.sin(t * 6) * .08;
      ctx.fillStyle = defense ? '#5fe3ff' : '#ffcf3a'; ctx.beginPath(); ctx.arc(W / 2, H / 2, 16 * k * pulse, 0, 7); ctx.fill();
      ctx.fillStyle = '#001'; ctx.font = `bold ${10 * k}px monospace`; ctx.textAlign = 'center'; ctx.fillText(defense ? 'DU' : 'SRV', W / 2, H / 2 + 3 * k);
      ps.forEach(p => {
        const x = p.x * W, y = p.y * H; ctx.fillStyle = p.good ? (defense ? '#4f8dff' : '#33ff77') : '#ff4f4f';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10 * k; ctx.fillRect(x - 9 * k, y - 6 * k, 18 * k, 12 * k); ctx.shadowBlur = 0;
        ctx.fillStyle = '#001'; ctx.font = `bold ${8 * k}px monospace`; ctx.fillText(p.good ? (defense ? 'ok' : '01') : 'XX', x, y + 3 * k);
      });
      fx = fx.filter(f => (f.t += dt) < .4); fx.forEach(f => { ctx.strokeStyle = f.c; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.arc(f.x * W, f.y * H, (f.big ? 40 : 10 + f.t * 60) * k, 0, 7); ctx.stroke(); });
      if (!defense && got >= goal) done(true, 'DATEN ABGEFANGEN');
      if (hp <= 0) done(false, defense ? 'SYSTEM INFIZIERT' : 'HONEYPOT!');
    });
    clock.start(defense ? dur : dur * Mini.timeMul(), defense ? () => done(true, 'ABGEWEHRT') : undefined);
  },
};
