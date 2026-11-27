/* =====================================================================
   APPS
===================================================================== */
const Apps = {
  open(name, arg) {
    Sound.init();
    const f = {
      terminal: () => Term.open(), mail: () => Mail.open(arg), browser: () => Browser.open(arg || 'www.startseite.xp'),
      market: () => Browser.open('darkmarket.onion'), jobs: () => Browser.open('jobs.onion'),
      explorer: () => Explorer.open('docs'), computer: () => Explorer.open('computer'), trash: () => Explorer.open('trash'),
      notepad: () => Notepad.open(arg), netmap: () => NetMap.open(), taskmgr: () => TaskMgr.open(), media: () => Media.open(),
      settings: () => Settings.open(), help: () => Help.open(), run: () => RunDlg.open(),
    }[name];
    f && f();
  },
  setWallpaper(w) {
    S.wallpaper = w; const d = $('#desk');
    d.classList.remove('wp-bliss', 'wp-night', 'wp-matrix', 'wp-crimson'); d.classList.add('wp-' + w);
    Wallpaper.set(w);
  },
};

/* ---------- MAIL ---------- */
const Mail = {
  sel: null,
  receive(m) {
    m.id = S.mailSeq++; m.time = Game.clockStr(); m.read = false;
    if (m.mission != null && m.body === '') { const host = Story.accept(m.mission); m.body = STORY[m.mission].body(host.ip); m.ip = host.ip; }
    S.mails.unshift(m);
    S.mails = S.mails.slice(0, 40);
    Sound.sfx('mail');
    balloon('Neue E-Mail', `<b>${esc(m.from.split('<')[0])}</b><br>${esc(m.subj)}`, { icon: 'mail', sound: 'none', onClick: () => Mail.open(m.id) });
    UI.update(); this.render(); Save.write();
  },
  open(id) {
    WM.create({ id: 'mail', title: 'Posteingang — Outpost Express', icon: 'mail', w: 760, h: 480, render: b => { this.b = b; this.render(); } });
    if (id) this.sel = id; else if (!this.sel && S.mails[0]) this.sel = S.mails[0].id;
    this.render();
  },
  render() {
    const w = WM.wins.mail; if (!w) return;
    const b = w.body;
    const m = S.mails.find(x => x.id === this.sel);
    if (m && !m.read) { m.read = true; setTimeout(() => UI.update(), 0); }
    b.innerHTML = `<div class="toolbar"><button class="xbtn" type="button" data-a="del">Löschen</button><button class="xbtn" type="button" data-a="term">Konsole öffnen</button><span style="margin-left:auto;color:#555;font-size:11px">${S.mails.length} Nachrichten, ${S.mails.filter(x => !x.read).length} ungelesen</span></div>
      <div class="mail"><div class="mail-list scroll"></div><div class="mail-read"></div></div>`;
    const list = b.querySelector('.mail-list');
    if (!S.mails.length) list.innerHTML = '<div style="padding:12px;color:#777">Keine Nachrichten.</div>';
    S.mails.forEach(x => {
      const it = h(`<button type="button" class="mail-item ${x.read ? '' : 'unread'} ${x.id === this.sel ? 'sel' : ''}"><b>${esc(x.subj)}</b><small><span>${esc(x.from.split('<')[0])}${x.tag ? `<span class="tag">${esc(x.tag)}</span>` : ''}</span><span>${x.time}</span></small></button>`);
      it.onclick = () => { this.sel = x.id; this.render(); Sound.sfx('click'); };
      list.appendChild(it);
    });
    const rd = b.querySelector('.mail-read');
    if (m) {
      rd.innerHTML = `<h3>${esc(m.subj)}</h3><div class="meta">Von: ${esc(m.from)}<br>An: ${esc(S.alias)}@shadowmail.onion · ${m.time}</div>${m.body}`;
      if (m.attach) { const at = h(`<button type="button" class="attach">${fileIcon(m.attach)}<span>${esc(m.attach)}</span></button>`); at.onclick = () => Events.openAttachment(m); rd.appendChild(at); }
      const act = h('<div class="mail-act"></div>');
      if (m.ip) { const c = h(`<button class="xbtn go" type="button">connect ${m.ip}</button>`); c.onclick = () => { Term.open(); if (!Term.busy) Term.run('connect ' + m.ip); }; act.appendChild(c); }
      if (m.twist && !S.flags.side) {
        const a1 = h('<button class="xbtn danger" type="button">Nyx vertrauen (20.000 Cr)</button>'), a2 = h('<button class="xbtn go" type="button">Ghostwire helfen</button>');
        a1.onclick = async () => { if (await msgbox('Entscheidung', 'Du vertraust Nyx und aktivierst HYDRA. Das lässt sich nicht rückgängig machen.', { icon: 'warn', buttons: ['Ja, Nyx', 'Abbrechen'] }) === 'Ja, Nyx') Story.choose('nyx'); };
        a2.onclick = async () => { if (await msgbox('Entscheidung', 'Du stellst dich gegen Nyx und OmniCorp. Sie werden dich jagen.', { icon: 'warn', buttons: ['Ja, Ghostwire', 'Abbrechen'] }) === 'Ja, Ghostwire') Story.choose('ghost'); };
        act.append(a1, a2);
      }
      if (m.final && !m.ip) { const fm = S.mission; if (fm) { m.ip = fm.ip; } }
      if (act.children.length) rd.appendChild(act);
    } else rd.innerHTML = '<p style="color:#777">Keine Nachricht ausgewählt.</p>';
    b.querySelector('[data-a="del"]').onclick = () => { if (!m) return; S.mails = S.mails.filter(x => x !== m); this.sel = S.mails[0]?.id; this.render(); UI.update(); };
    b.querySelector('[data-a="term"]').onclick = () => Term.open();
  },
};

/* ---------- BROWSER ---------- */
const Browser = {
  hist: [], hp: -1, url: '', tab: 'tools',
  open(url) {
    WM.create({
      id: 'browser', title: 'NetXplorer', icon: 'globe', w: 820, h: 540,
      render: b => {
        b.innerHTML = `<div class="menubar"><span>Datei</span><span>Bearbeiten</span><span>Ansicht</span><span>Favoriten</span><span>Extras</span><span>?</span></div>
          <div class="br-addr"><span class="br-nav"><button type="button" data-n="back" aria-label="Zurück">◀</button> <button type="button" data-n="fwd" aria-label="Vor">▶</button></span>
          <label for="br-url">Adresse</label><input id="br-url" class="xinput" spellcheck="false" autocomplete="off"><button class="xbtn" type="button" data-n="go" style="min-width:40px">Wechseln zu</button></div>
          <div class="br-fav"><button type="button" data-u="www.startseite.xp">🏠 Startseite</button><button type="button" data-u="darkmarket.onion">☠ DarkMarket</button><button type="button" data-u="jobs.onion">💼 Jobbörse</button><button type="button" data-u="cyberpol.gov">🛡 Cyberpol</button><button type="button" data-u="hackerwiki.onion">📖 HackerWiki</button><button type="button" data-u="omnicorp.com">OmniCorp</button></div>
          <div class="br-load"></div><div class="br-view"></div><div class="statusbar"><span class="br-st">Fertig</span><span>Internet</span></div>`;
        b.querySelector('[data-n="back"]').onclick = () => { if (this.hp > 0) this.go(this.hist[--this.hp], true); };
        b.querySelector('[data-n="fwd"]').onclick = () => { if (this.hp < this.hist.length - 1) this.go(this.hist[++this.hp], true); };
        b.querySelector('[data-n="go"]').onclick = () => this.go(b.querySelector('#br-url').value);
        b.querySelector('#br-url').addEventListener('keydown', e => { if (e.key === 'Enter') this.go(e.target.value); });
        $$('.br-fav button', b).forEach(x => x.onclick = () => this.go(x.dataset.u));
      },
    });
    this.go(url);
  },
  go(u, fromHist) {
    const w = WM.wins.browser; if (!w) return;
    u = (u || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase() || 'www.startseite.xp';
    if (!fromHist) { this.hist = this.hist.slice(0, this.hp + 1); this.hist.push(u); this.hp = this.hist.length - 1; }
    this.url = u; w.body.querySelector('#br-url').value = 'http://' + u + '/';
    const ld = w.body.querySelector('.br-load'); ld.style.transition = 'none'; ld.style.width = '0'; void ld.offsetWidth; ld.style.transition = 'width .35s'; ld.style.width = '100%';
    w.body.querySelector('.br-st').textContent = 'Lade ' + u + '…';
    setTimeout(() => { if (!WM.wins.browser) return; ld.style.width = '0'; w.body.querySelector('.br-st').textContent = 'Fertig'; }, 400);
    WM.setTitle('browser', (this.titles[u] || 'Seite nicht gefunden') + ' — NetXplorer');
    this.render();
  },
  titles: { 'www.startseite.xp': 'XP-Portal', 'darkmarket.onion': 'DarkMarket', 'jobs.onion': 'Jobbörse', 'cyberpol.gov': 'Cyberpol', 'hackerwiki.onion': 'HackerWiki', 'omnicorp.com': 'OmniCorp', 'nordlicht-bank.de': 'Kreditbank Nordlicht' },
  render() {
    const w = WM.wins.browser; if (!w) return;
    const v = w.body.querySelector('.br-view'), st = v.scrollTop;
    const page = this.pages[this.url] || this.pages['404'];
    v.innerHTML = page.call(this);
    this.bind && this.bind(v); this.bind = null;
    v.scrollTop = st;
  },
  pages: {
    '404'() { return `<div class="site-404"><h2>Die Seite kann nicht angezeigt werden</h2><p>Die gesuchte Seite ist zurzeit nicht verfügbar. Möglicherweise ist die Website ausgelastet, oder Sie müssen die Einstellungen anpassen.</p><hr><p>Bekannte Seiten: <code>www.startseite.xp</code>, <code>darkmarket.onion</code>, <code>jobs.onion</code>, <code>cyberpol.gov</code>, <code>hackerwiki.onion</code>, <code>omnicorp.com</code>, <code>nordlicht-bank.de</code></p></div>`; },
    'www.startseite.xp'() {
      const base = [
        { t: 'Neues Doors-Update schließt 47 Sicherheitslücken – und öffnet 12 neue', c: 'Technik' }, { t: 'OmniCorp meldet Rekordgewinn: „Daten sind das neue Öl"', c: 'Wirtschaft' },
        { t: 'Cyberpol warnt vor Welle von Hackerangriffen auf Kleinbetriebe', c: 'Netz' }, { t: 'Studie: 83 % aller Passwörter lauten „Sommer" plus Jahreszahl', c: 'Netz' },
      ];
      const items = S.news.concat(base);
      const ticker = items.slice(0, 6).map(n => n.t).join('  +++  ');
      return `<div class="site-portal"><div class="sp-top"><h1>XP<span>-Portal</span></h1><div class="sp-search"><input class="xinput" placeholder="Websuche" aria-label="Websuche"><button class="xbtn" type="button">Suchen</button></div></div>
        <div class="sp-ticker"><span>+++ ${esc(ticker)} +++</span></div>
        <div class="sp-grid"><div class="sp-news">${items.slice(0, 12).map(n => `<article class="${n.b ? 'breaking' : ''}"><h3>${n.b ? 'EILMELDUNG: ' : ''}${n.t}</h3><small>${esc(n.c)}${n.time ? ' · heute ' + n.time : ''}</small></article>`).join('')}</div>
        <div><div class="sp-box"><h4>Wetter Nordport</h4>Nieselregen, 7 °C. Perfektes Wetter, um drinnen zu bleiben.</div>
        <div class="sp-box"><h4>Cyberpol-Lagebild</h4>Gefahrenstufe: <b style="color:${S.heat > 60 ? '#c40000' : '#c98a00'}">${S.heat > 75 ? 'KRITISCH' : S.heat > 45 ? 'HOCH' : 'ERHÖHT'}</b><br>Gesuchte Personen: ${3 + Math.round(S.heat / 20)}</div>
        <div class="sp-box"><h4>Börse</h4>OMNI ${(412 + S.rep / 10).toFixed(2)} ▲<br>NRDL ${(88 - S.story * 4).toFixed(2)} ▼<br>PZZB 12,40 ▼</div></div></div></div>`;
    },
    'darkmarket.onion'() {
      const tab = this.tab;
      let list = '';
      const item = (title, tag, desc, price, owned, act, disabled) => `<div class="sd-item"><h4>${title}${tag ? `<em>${tag}</em>` : ''}</h4><p>${desc}</p><div class="row"><span class="price">${price}</span>${owned ? `<span class="sd-owned">✓ ${owned}</span>` : `<button class="sd-buy" type="button" data-buy="${act}" ${disabled || S.money < 0 ? 'disabled' : ''}>KAUFEN</button>`}</div></div>`;
      if (tab === 'tools') list = Object.entries(TOOLS).filter(([k]) => k !== 'web').map(([k, t]) => item(t.name, t.port ? 'Port ' + t.port : 'Utility', t.desc, cr(t.price), S.tools[k] ? 'installiert' : '', 'tool:' + k, S.money < t.price)).join('');
      if (tab === 'hw') list = Object.entries(HW).map(([k, x]) => { const lv = S.hw[k], max = lv >= x.lv.length; return item(x.name + ': ' + (max ? x.lv[lv - 1] : x.lv[lv]), 'Stufe ' + Math.min(lv + 1, x.lv.length) + '/' + x.lv.length, x.desc + `<br><small>Aktuell: ${x.lv[lv - 1]}</small>`, max ? '—' : cr(x.price[lv]), max ? 'Maximum' : '', 'hw:' + k, !max && S.money < x.price[lv]); }).join('');
      if (tab === 'svc') {
        const px = PROXY_PRICES[S.proxies], wash = 600 + (S.flags.washes || 0) * 300;
        list = item('Proxy-Knoten mieten', S.proxies + '/4', 'Leitet deine Verbindung über einen weiteren Server. Jeder Knoten verlangsamt den Trace um ca. 23 %.', px ? cr(px) : '—', px ? '' : 'Maximum', 'proxy', px && S.money < px)
          + item('Decoy-Paket', 'x1', 'Einmal-Köder. Im Terminal: <code>decoy</code> senkt den Trace sofort um 25 %. Lebensretter.', cr(250), '', 'decoy', S.money < 250)
          + item('Identität waschen', 'Heat −35 %', 'Neue Fake-Identität, gelöschte Akten. Senkt dein Fahndungslevel sofort.', cr(wash), '', 'wash', S.money < wash || S.heat <= 0);
      }
      if (tab === 'sell') {
        const sellable = S.files.filter(f => f.value > 0 && !f.sold);
        list = sellable.length ? sellable.map(f => { const i = S.files.indexOf(f); return item(esc(f.name), esc(f.from || ''), `${f.size} MB · erbeutet bei ${esc(f.from || '?')}`, cr(f.value * (S.flags.market || 1)), '', 'sell:' + i); }).join('')
          : `<div class="sd-empty">Keine verkaufbaren Daten. Lade bei Hacks wertvolle Dateien herunter (im <code>ls</code> mit $ markiert).</div>`;
      }
      this.bind = v => {
        $$('.sd-tabs button', v).forEach(b => b.onclick = () => { this.tab = b.dataset.t; this.render(); Sound.sfx('click'); });
        $$('[data-buy]', v).forEach(b => b.onclick = () => Shop.buy(b.dataset.buy));
      };
      return `<div class="site-dark"><div class="sd-top"><div><h1>DARKMARKET</h1><small>// anonym · verschlüsselt · keine Rückgabe</small></div><div class="sd-wallet">Wallet: ${cr(S.money)}</div></div>
        <div class="sd-tabs">${[['tools', 'Software'], ['hw', 'Hardware'], ['svc', 'Dienste'], ['sell', 'Daten verkaufen']].map(([k, l]) => `<button type="button" data-t="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        ${S.flags.market && S.flags.market !== 1 ? `<div style="padding:8px 18px;color:${S.flags.market > 1 ? '#7dff9b' : '#ff7b7b'}">Datenmarkt aktuell: ${S.flags.market > 1 ? 'Hohe Nachfrage! +' : 'Flaute −'}${Math.round(Math.abs(S.flags.market - 1) * 100)} %</div>` : ''}
        <div class="sd-list">${list}</div></div>`;
    },
    'jobs.onion'() {
      if (S.story < 1 && !S.storyDone) return `<div class="site-jobs"><div class="sj-top"><h1>JOBS.ONION</h1><small>Nur für Mitglieder.</small></div><div class="sj-list"><p>Zugang verweigert. Erledige zuerst einen Auftrag für einen Bürgen (Posteingang).</p></div></div>`;
      Contracts.refill();
      const a = S.activeContract;
      this.bind = v => { $$('[data-acc]', v).forEach(b => b.onclick = () => { Contracts.accept(b.dataset.acc); this.render(); }); const ab = v.querySelector('[data-abort]'); ab && (ab.onclick = () => { Contracts.abort(); this.render(); }); const rf = v.querySelector('[data-refresh]'); rf && (rf.onclick = () => { if (S.money < 50) return; Eco.addMoney(-50); S.contracts = []; Contracts.refill(); this.render(); }); };
      return `<div class="site-jobs"><div class="sj-top"><h1>JOBS.ONION</h1><small>Rang: ${Eco.rank()} · Höherer Ruf = gefährlichere, besser bezahlte Jobs</small></div>
        <div class="sj-list">${a ? `<div class="sj-job active"><h4>AKTIV: ${esc(a.title)}</h4><p>Ziel: <code>${a.ip}</code> · ${Story.objLabel(a)} ${a.objDone ? '· <b>erledigt, sauber trennen!</b>' : ''}</p><div class="side"><span class="pay">${cr(a.reward)}</span><button class="xbtn" type="button" data-abort>Abbrechen</button></div></div>` : ''}
        ${S.contracts.map(c => `<div class="sj-job"><h4>${esc(c.title)}</h4><p>${c.desc}<br>Ports: ${c.ports.join(', ')} (${c.need} nötig)${c.fw ? ' · Firewall' : ''} · fehlende Tools: ${c.ports.filter(p => !S.tools[SVC[p].tool]).map(p => TOOLS[SVC[p].tool].name).concat(c.fw && !S.tools.fw ? ['FirewallBreaker.exe'] : []).join(', ') || 'keine'}</p>
          <div class="side"><span class="sec">${'■'.repeat(c.sec)}${'□'.repeat(5 - c.sec)}</span><span class="pay">${cr(c.reward)}</span><button class="xbtn" type="button" data-acc="${c.id}" ${a ? 'disabled' : ''}>Annehmen</button></div></div>`).join('')}
        <div><button class="xbtn" type="button" data-refresh ${S.money < 50 ? 'disabled' : ''}>Neue Jobs laden (50 Cr)</button></div></div></div>`;
    },
    'cyberpol.gov'() {
      const wanted = [
        ['Cr0w', S.story >= 5 ? 'Offline / unbekannt' : 'Aktiv', S.story >= 5 ? 20 : 70],
        [S.alias, S.heat > 60 ? 'Identifizierung läuft' : S.heat > 25 ? 'Ermittlungen' : 'Unbekannt', S.heat],
        ['sp1der', 'Festgenommen', 100], ['N.', 'Keine Daten', 5],
      ];
      return `<div class="site-pol"><div class="po-top"><span class="po-badge">CP</span><div><h1>CYBERPOL</h1><small>Bundesstelle zur Bekämpfung der Netzkriminalität (fiktiv)</small></div></div>
        <div style="padding:12px 18px 0"><b>Fahndungsliste – Netzkriminalität</b><br><small>Hinweise bitte über das Kontaktformular. Belohnung bis 50.000 Cr.</small></div>
        <div class="po-body">${wanted.map(([n, s, l]) => `<div class="po-card ${n === S.alias ? 'you' : ''}"><div class="ph">?</div><b>Alias: ${esc(n)}</b><br><small>${s}</small><div class="lvl"><i style="width:${l}%"></i></div><small>Fahndungsstufe ${Math.round(l)} %</small></div>`).join('')}</div>
        <div style="padding:0 18px 18px;font-size:12px;color:#555">Fahndungsstufe 100 % = Durchsuchungsbeschluss. ${S.heat > 50 ? '<b style="color:#c40000">Achtung: Ein Alias in deiner Region steht kurz vor der Identifizierung.</b>' : ''}</div></div>`;
    },
    'hackerwiki.onion'() {
      return `<div class="site-jobs"><div class="sj-top"><h1>HACKERWIKI</h1><small>von Hackern für Hacker</small></div><div class="sj-list" style="line-height:1.7">
        <b>Die goldenen Regeln</b>
        <p>1. <b>Trace</b> läuft, sobald du verbunden bist. Bei 100 % wirst du zurückverfolgt (+Heat).<br>2. Erst <code>clearlogs</code>, dann <code>dc</code>. Logs, die du liegen lässt, findet der Admin: das gibt Heat.<br>3. <b>Heat</b> 100 % = Hausdurchsuchung. Heat sinkt langsam, wenn du offline bist.<br>4. Proxys und RAM verlangsamen den Trace. Bessere CPU = mehr Zeit in Tools.<br>5. Decoys sind deine Notbremse.<br>6. Wertvolle Dateien ($) kannst du auf dem DarkMarket verkaufen. Gier erhöht aber den Trace.<br>7. Klick nie auf .exe-Anhänge von Fremden.</p>
        <b>Port → Tool</b><p>80 HTTP → WebXploit · 21 FTP → FTPBounce · 22 SSH → SSHcrack · 25 SMTP → SMTPoverflow · 1433 SQL → SQLinject · Firewall → FirewallBreaker</p>
        <b>Scan</b><p><code>scan</code> findet alle 45 s einen neuen zufälligen Host. Gut für schnelles Geld durch Datenverkauf.</p></div></div>`;
    },
    'omnicorp.com'() {
      return `<div class="site-corp"><div class="co-hero"><h1>OMNICORP</h1><p>${S.ending === 'ghost' ? 'Diese Website wurde von den Behörden beschlagnahmt.' : 'Wir sehen das große Ganze. Damit Sie es nicht müssen.'}</p></div>
        <div class="co-body"><div><b>Sicherheit</b><p>Unsere Lösungen schützen 200 Millionen Menschen. Ob sie wollen oder nicht.</p></div><div><b>Innovation</b><p>Projekt ${S.story >= 5 ? '<b>HYDRA</b>' : '███'}: die Zukunft der Kommunikation.</p></div><div><b>Karriere</b><p>Wir suchen White-Hats. Und manchmal auch andere.</p></div></div></div>`;
    },
    'nordlicht-bank.de'() {
      return `<div class="site-bank"><div class="bk-top">Kreditbank Nordlicht · Online-Banking</div><div class="bk-body"><p>Willkommen zurück, Kunde <b>${esc(S.alias)}</b>.</p><p>Kontostand Girokonto: <b>${cr(S.money)}</b></p><p style="color:#777">Letzte Umsätze werden aus Sicherheitsgründen nicht angezeigt.${S.story >= 4 ? ' <b>Hinweis:</b> Wir hatten kürzlich einen kleinen Sicherheitsvorfall. Ihre Daten sind sicher (vermutlich).' : ''}</p></div></div>`;
    },
  },
};

/* ---------- SHOP ---------- */
const Shop = {
  buy(code) {
    const [kind, k] = code.split(':');
    const pay = (n, what) => { if (S.money < n) { Sound.sfx('error'); balloon('Zu wenig Geld', `Du brauchst ${cr(n)}.`, { icon: 'error' }); return false; } Eco.addMoney(-n); balloon('Gekauft', what, { icon: 'skull', sound: 'coin' }); return true; };
    if (kind === 'tool') { const t = TOOLS[k]; if (S.tools[k]) return; if (pay(t.price, t.name + ' installiert.')) S.tools[k] = true; }
    if (kind === 'hw') { const x = HW[k], lv = S.hw[k]; if (lv >= x.lv.length) return; if (pay(x.price[lv], x.lv[lv] + ' eingebaut.')) S.hw[k]++; }
    if (kind === 'proxy') { const p = PROXY_PRICES[S.proxies]; if (p && pay(p, 'Proxy-Knoten #' + (S.proxies + 1) + ' aktiv.')) S.proxies++; }
    if (kind === 'decoy') { if (pay(250, 'Decoy-Paket bereit.')) { S.items = S.items || {}; S.items.decoy = (S.items.decoy || 0) + 1; } }
    if (kind === 'wash') { const w = 600 + (S.flags.washes || 0) * 300; if (pay(w, 'Neue Identität. Fahndung −35 %.')) { S.flags.washes = (S.flags.washes || 0) + 1; S.heat = Math.max(0, S.heat - 35); } }
    if (kind === 'sell') { const f = S.files[+k]; if (!f || f.sold) return; const v = Math.round(f.value * (S.flags.market || 1)); f.sold = true; f.value = 0; S.soldFiles++; Eco.addMoney(v); balloon('Verkauft', `${esc(f.name)} für ${cr(v)}.`, { icon: 'skull', sound: 'none' }); }
    UI.update(); Browser.render(); Save.write(); Term.chips();
  },
};

/* ---------- EXPLORER ---------- */
const Explorer = {
  loc: 'docs', sel: null,
  open(loc) {
    this.loc = loc; this.sel = null;
    const titles = { docs: 'Eigene Dateien', computer: 'Arbeitsplatz', trash: 'Papierkorb' };
    const ic = { docs: 'docs', computer: 'computer', trash: 'trashfull' };
    if (WM.wins.explorer) { WM.setTitle('explorer', titles[loc]); WM.focus('explorer'); this.render(); return; }
    WM.create({ id: 'explorer', title: titles[loc], icon: ic[loc], w: 640, h: 430, render: () => this.render() });
    Bus.on('files', () => this.render());
  },
  render() {
    const w = WM.wins.explorer; if (!w) return;
    const b = w.body;
    let files = [], side = '';
    if (this.loc === 'docs') {
      files = S.files.map((f, i) => ({ name: f.name, sub: f.sold ? 'verkauft' : f.value ? '≈ ' + cr(f.value) : f.size + ' MB', ic: fileIcon(f.name), open: () => this.openFile(f), i }));
      const sel = S.files[this.sel];
      side = `<div class="exp-panel"><h5>Datei- und Ordneraufgaben</h5><div>${sel ? `<button type="button" data-x="open">Öffnen</button>${sel.value && !sel.sold ? '<button type="button" data-x="sell">Auf DarkMarket verkaufen</button>' : ''}<button type="button" data-x="del">Datei löschen</button>` : 'Wähle eine Datei aus.'}</div></div>
        <div class="exp-panel"><h5>Details</h5><div>${sel ? `<b>${esc(sel.name)}</b><br>${sel.size} MB<br>Quelle: ${esc(sel.from || 'lokal')}<br>${sel.value ? 'Wert: ' + cr(sel.value) : ''}` : `${S.files.length} Objekte`}</div></div>`;
    } else if (this.loc === 'computer') {
      files = [{ name: 'Lokaler Datenträger (C:)', sub: '12,4 GB frei', ic: icon('computer'), open: () => this.open('docs') }, { name: 'Eigene Dateien', sub: S.files.length + ' Dateien', ic: icon('docs'), open: () => this.open('docs') }, { name: 'Papierkorb', sub: '', ic: icon('trashfull'), open: () => this.open('trash') }, { name: 'Systemsteuerung', sub: '', ic: icon('settings'), open: () => Apps.open('settings') }];
      side = `<div class="exp-panel"><h5>Systeminformationen</h5><div>CPU: ${HW.cpu.lv[S.hw.cpu - 1]}<br>RAM: ${HW.ram.lv[S.hw.ram - 1]}<br>Netz: ${HW.net.lv[S.hw.net - 1]}<br>Proxys: ${Hack.proxyCount()}</div></div>`;
    } else {
      files = [{ name: 'tagebuch_alt.txt', sub: '1 KB', ic: fileIcon('a.txt'), open: () => Notepad.open({ name: 'tagebuch_alt.txt', content: 'Tag 1: Habe mir einen Hacker-Alias ausgedacht.\nTag 2: Bereue den Alias.\nTag 3: Nyx hat mir geschrieben. Klingt seriös. Glaube ich.' }) }, { name: 'bewerbung_omnicorp.doc', sub: 'abgelehnt', ic: fileIcon('a.txt'), open: () => Notepad.open({ name: 'bewerbung_omnicorp.doc', content: 'Sehr geehrte Damen und Herren,\nhiermit bewerbe ich mich als IT-Praktikant...\n\n[ABGELEHNT – „zu neugierig"]' }) }];
      side = `<div class="exp-panel"><h5>Papierkorbaufgaben</h5><div>Der Papierkorb kann nicht geleert werden. Erinnerungen bleiben.</div></div>`;
    }
    b.innerHTML = `<div class="menubar"><span>Datei</span><span>Bearbeiten</span><span>Ansicht</span><span>Favoriten</span><span>Extras</span></div>
      <div class="toolbar"><button class="xbtn" type="button" data-loc="computer">Arbeitsplatz</button><button class="xbtn" type="button" data-loc="docs">Eigene Dateien</button><button class="xbtn" type="button" data-loc="trash">Papierkorb</button></div>
      <div class="exp"><div class="exp-side">${side}</div><div class="exp-files"></div></div><div class="statusbar"><span>${files.length} Objekt(e)</span><span>Arbeitsplatz</span></div>`;
    const fb = b.querySelector('.exp-files');
    if (!files.length) fb.innerHTML = '<div style="color:#777;padding:10px;grid-column:1/-1">Dieser Ordner ist leer. Lade bei Hacks Dateien mit <b>download</b> herunter.</div>';
    files.forEach(f => {
      const el = h(`<button type="button" class="ficon ${f.i === this.sel && f.i != null ? 'sel' : ''}">${f.ic}<span>${esc(f.name)}</span><small>${f.sub}</small></button>`);
      let last = 0;
      el.onclick = () => { const n = Date.now(); if (f.i != null) { this.sel = f.i; } if (n - last < 420 || isTouch()) f.open(); else if (f.i != null) this.render(); last = n; };
      fb.appendChild(el);
    });
    $$('[data-loc]', b).forEach(x => x.onclick = () => this.open(x.dataset.loc));
    const act = x => b.querySelector(`[data-x="${x}"]`);
    act('open') && (act('open').onclick = () => this.openFile(S.files[this.sel]));
    act('sell') && (act('sell').onclick = () => { Shop.buy('sell:' + this.sel); this.render(); });
    act('del') && (act('del').onclick = () => { S.files.splice(this.sel, 1); this.sel = null; this.render(); Sound.sfx('close'); });
  },
  openFile(f) {
    if (!f) return;
    if (/\.(txt|log|cfg|eml|xls|csv|key|pem|pdf|md)$/i.test(f.name) && f.content) Notepad.open(f);
    else msgbox(f.name, 'Doors kann diese Datei nicht öffnen.<br><small>Vielleicht ist sie auf dem DarkMarket etwas wert.</small>', { icon: 'warn' });
  },
};

/* ---------- NOTEPAD ---------- */
const Notepad = {
  open(file) {
    const id = file ? 'np-' + file.name : 'notepad';
    WM.create({
      id, title: (file ? file.name : 'Notizen.txt') + ' — Editor', icon: 'notepad', w: 520, h: 380,
      render: b => {
        b.innerHTML = `<div class="menubar"><span>Datei</span><span>Bearbeiten</span><span>Format</span><span>Ansicht</span><span>?</span></div><textarea class="np" spellcheck="false" aria-label="Text"></textarea>`;
        const ta = b.querySelector('textarea');
        ta.value = file ? file.content : S.notes;
        if (file) ta.readOnly = true; else ta.addEventListener('input', () => { S.notes = ta.value; });
      },
    });
  },
};

/* ---------- NETMAP ---------- */
const NetMap = {
  sel: null, raf: 0,
  open() {
    WM.create({
      id: 'netmap', title: 'Netzwerkkarte', icon: 'network', w: 720, h: 440,
      onClose: () => { cancelAnimationFrame(this.raf); },
      render: b => {
        b.innerHTML = `<div class="nm"><canvas></canvas><div class="nm-info"></div></div>`;
        this.cv = b.querySelector('canvas'); this.info = b.querySelector('.nm-info');
        this.cv.addEventListener('pointerdown', e => this.click(e));
        this.renderInfo();
        const loop = t => { if (!WM.wins.netmap) return; this.draw(t); this.raf = requestAnimationFrame(loop); };
        this.raf = requestAnimationFrame(loop);
      },
    });
    Bus.on('net', () => this.renderInfo());
  },
  nodes() {
    const list = [{ ip: 'local', name: S.alias + ' (Du)', x: .1, y: .5, me: true }];
    const px = Hack.proxyCount();
    for (let i = 0; i < px; i++) list.push({ ip: 'proxy' + i, name: 'Proxy ' + (i + 1), x: .24 + (i % 2) * .06, y: .25 + i * .17, proxy: true });
    (S.known || []).filter(ip => S.hosts[ip]).forEach(ip => {
      let hsh = 0; for (const ch of ip) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0;
      list.push({ ip, name: S.hosts[ip].name, x: .45 + (hsh % 1000) / 1000 * .48, y: .1 + ((hsh >> 10) % 1000) / 1000 * .8, host: S.hosts[ip] });
    });
    return list;
  },
  draw(t) {
    const cv = this.cv, k = devicePixelRatio, W = cv.width = cv.clientWidth * k, H = cv.height = cv.clientHeight * k, c = cv.getContext('2d');
    c.fillStyle = '#030b14'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(40,100,160,.15)'; for (let x = 0; x < W; x += 30 * k) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += 30 * k) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    const ns = this.nodes(); this._ns = ns;
    const me = ns[0], proxies = ns.filter(n => n.proxy), conn = Hack.conn && ns.find(n => n.ip === Hack.conn.ip);
    const chain = [me, ...proxies]; if (conn) chain.push(conn);
    ns.filter(n => n.host).forEach(n => { c.strokeStyle = 'rgba(95,227,255,.12)'; c.beginPath(); c.moveTo(me.x * W, me.y * H); c.lineTo(n.x * W, n.y * H); c.stroke(); });
    if (conn) {
      c.strokeStyle = Hack.conn.trace > 65 ? '#ff4f4f' : '#33ff77'; c.lineWidth = 2 * k; c.beginPath(); chain.forEach((n, i) => i ? c.lineTo(n.x * W, n.y * H) : c.moveTo(n.x * W, n.y * H)); c.stroke(); c.lineWidth = 1;
      for (let i = 1; i < chain.length; i++) { const a = chain[i - 1], b = chain[i], p = ((t / 900) + i * .3) % 1; c.fillStyle = '#fff'; c.beginPath(); c.arc((a.x + (b.x - a.x) * p) * W, (a.y + (b.y - a.y) * p) * H, 3 * k, 0, 7); c.fill(); }
      // trace creeping back
      const tp = Hack.conn.trace / 100, seg = tp * (chain.length - 1), si = Math.floor(seg), sf = seg - si;
      const A = chain[chain.length - 1 - si], B = chain[Math.max(0, chain.length - 2 - si)];
      if (A && B) { c.fillStyle = '#ff2b2b'; c.shadowColor = '#f00'; c.shadowBlur = 14 * k; c.beginPath(); c.arc((A.x + (B.x - A.x) * sf) * W, (A.y + (B.y - A.y) * sf) * H, 6 * k, 0, 7); c.fill(); c.shadowBlur = 0; }
    }
    ns.forEach(n => {
      const x = n.x * W, y = n.y * H, isTarget = [S.mission, S.activeContract].some(j => j && j.ip === n.ip);
      const col = n.me ? '#5fe3ff' : n.proxy ? '#b07bff' : n.host.root ? '#33ff77' : isTarget ? '#ffcf3a' : '#7f93a8';
      c.fillStyle = col; c.strokeStyle = n.ip === this.sel ? '#fff' : 'rgba(255,255,255,.3)'; c.lineWidth = (n.ip === this.sel ? 2 : 1) * k;
      c.beginPath(); c.arc(x, y, (n.me ? 11 : 8) * k * (isTarget ? 1 + Math.sin(t / 200) * .12 : 1), 0, 7); c.fill(); c.stroke();
      c.fillStyle = '#bcd3ea'; c.font = `${10 * k}px monospace`; c.textAlign = 'center'; c.fillText(n.name, x, y + 20 * k);
      if (n.host) { c.fillStyle = '#56708c'; c.fillText(n.ip, x, y + 31 * k); }
    });
  },
  click(e) {
    const r = this.cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const n = (this._ns || []).find(n => n.host && Math.hypot((n.x - x) * r.width, (n.y - y) * r.height) < 18);
    this.sel = n ? n.ip : null; this.renderInfo(); Sound.sfx('click');
  },
  renderInfo() {
    if (!this.info || !WM.wins.netmap) return;
    const hst = S.hosts[this.sel];
    if (!hst) { this.info.innerHTML = `<h4>Netzwerk</h4>Bekannte Hosts: ${(S.known || []).filter(i => S.hosts[i]).length}<br>Proxys: ${Hack.proxyCount()}<br><br>${Hack.conn ? `<b style="color:#33ff77">Verbunden:</b><br>${Hack.conn.host.name}<br>Trace: <span style="color:#ff4f4f">roter Punkt</span> wandert zu dir zurück.` : 'Klick auf einen Knoten für Details.'}<br><br><span style="color:#5fe3ff">●</span> Du <span style="color:#b07bff">●</span> Proxy<br><span style="color:#ffcf3a">●</span> Ziel <span style="color:#33ff77">●</span> root`; return; }
    this.info.innerHTML = `<h4>${esc(hst.name)}</h4>${hst.ip}<br>${esc(hst.org)}<br>Sicherheit: ${'■'.repeat(hst.sec)}${'□'.repeat(5 - hst.sec)}<br>Ports: ${hst.ports.map(p => p.n).join(', ')}<br>${hst.fw ? 'Firewall: ja<br>' : ''}Status: ${hst.root ? '<b style="color:#33ff77">ROOT</b>' : 'gesperrt'}<br><br><button class="xbtn go" type="button">Verbinden</button>`;
    this.info.querySelector('button').onclick = () => { Term.open(); if (!Term.busy) Term.run('connect ' + hst.ip); };
  },
};

/* ---------- TASK MANAGER ---------- */
const TaskMgr = {
  tab: 'proc', sel: null, hist: [], iv: 0,
  procs() {
    const base = [['System', 'SYSTEM', 1, 240], ['explorer.exe', S.alias, 2, 18400], ['zeroshell.exe', S.alias, Hack.conn ? 9 : 1, 6200], ['svchost.exe', 'SYSTEM', 0, 4100], ['csrss.exe', 'SYSTEM', 0, 3100], ['winlogon.exe', 'SYSTEM', 0, 2600]];
    if (Mini.active) base.push(['hacktool.exe', S.alias, 34, 22000]);
    if (Music.timer) base.push(['mplayer.exe', S.alias, 4, 9800]);
    (Events.malware || []).forEach(m => base.push([m, 'UNBEKANNT', 28, 31337, true]));
    return base;
  },
  open() {
    WM.create({
      id: 'taskmgr', title: 'Doors Task-Manager', icon: 'taskmgr', w: 460, h: 440,
      onClose: () => clearInterval(this.iv),
      render: () => { this.render(); clearInterval(this.iv); this.iv = setInterval(() => { this.sample(); if (this.tab === 'perf') this.graph(); else if (Math.random() < .3) this.render(); }, 700); },
    });
  },
  sample() { const cpu = clamp((Hack.conn ? 35 : 6) + (Mini.active ? 40 : 0) + (Events.malware || []).length * 25 + rnd(-5, 8), 1, 100); this.hist.push(cpu); if (this.hist.length > 60) this.hist.shift(); },
  render() {
    const w = WM.wins.taskmgr; if (!w) return;
    const ps = this.procs();
    w.body.innerHTML = `<div class="menubar"><span>Datei</span><span>Optionen</span><span>Ansicht</span><span>?</span></div><div class="tm"><div class="tm-tabs">${[['app', 'Anwendungen'], ['proc', 'Prozesse'], ['perf', 'Systemleistung']].map(([k, l]) => `<button type="button" data-t="${k}" class="${this.tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="tm-pane">${this.tab === 'proc' ? `<table><thead><tr><th>Name</th><th>Benutzer</th><th>CPU</th><th>Speicher</th></tr></thead><tbody>${ps.map((p, i) => `<tr data-i="${i}" class="${this.sel === p[0] ? 'sel' : ''} ${p[4] ? 'mal' : ''}"><td>${p[0]}</td><td>${p[1]}</td><td>${String(p[2]).padStart(2, '0')}</td><td>${p[3].toLocaleString('de-DE')} K</td></tr>`).join('')}</tbody></table>`
        : this.tab === 'app' ? `<table><thead><tr><th>Task</th><th>Status</th></tr></thead><tbody>${Object.values(WM.wins).map(x => `<tr><td>${esc(x.title)}</td><td>Wird ausgeführt</td></tr>`).join('')}</tbody></table>`
        : `<div class="tm-graphs"><div class="tm-graph"><canvas id="tm-c1"></canvas><span>CPU-Auslastung</span></div><div class="tm-graph"><canvas id="tm-c2"></canvas><span>Trace-Verlauf</span></div></div><div style="padding:0 8px;font-size:11px">Prozesse: ${ps.length} · Verbindung: ${Hack.conn ? Hack.conn.host.name : 'keine'}</div>`}</div>
      <div style="display:flex;justify-content:flex-end"><button class="xbtn" type="button" data-kill ${this.tab === 'proc' ? '' : 'disabled'}>Prozess beenden</button></div></div>
      <div class="statusbar"><span>Prozesse: ${ps.length}</span><span>CPU-Auslastung: ${this.hist[this.hist.length - 1] || 3} %</span></div>`;
    $$('[data-t]', w.body).forEach(b => b.onclick = () => { this.tab = b.dataset.t; this.render(); });
    $$('tr[data-i]', w.body).forEach(r => r.onclick = () => { this.sel = ps[+r.dataset.i][0]; this.render(); });
    w.body.querySelector('[data-kill]').onclick = () => {
      if (!this.sel) return;
      if ((Events.malware || []).includes(this.sel)) { Events.killMalware(this.sel); this.sel = null; this.render(); return; }
      if (['System', 'csrss.exe', 'winlogon.exe'].includes(this.sel)) { Game.bsod(); return; }
      msgbox('Task-Manager', `„${esc(this.sel)}" kann nicht beendet werden: Zugriff verweigert.`, { icon: 'warn' });
    };
    if (this.tab === 'perf') this.graph();
  },
  traceHist: [],
  graph() {
    const w = WM.wins.taskmgr; if (!w) return;
    this.traceHist.push(Hack.conn ? Hack.conn.trace : 0); if (this.traceHist.length > 60) this.traceHist.shift();
    [['#tm-c1', this.hist, '#2bff2b'], ['#tm-c2', this.traceHist, '#ff4f4f']].forEach(([sel, data, col]) => {
      const cv = w.body.querySelector(sel); if (!cv) return; const k = devicePixelRatio, W = cv.width = cv.clientWidth * k, H = cv.height = cv.clientHeight * k, c = cv.getContext('2d');
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.strokeStyle = '#063'; for (let x = 0; x < W; x += 12 * k) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += 12 * k) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      c.strokeStyle = col; c.lineWidth = 1.5 * k; c.beginPath(); data.forEach((v, i) => { const x = W - (data.length - 1 - i) * W / 59, y = H - v / 100 * H; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
    });
  },
};

/* ---------- MEDIA PLAYER ---------- */
const Media = {
  raf: 0,
  open() {
    WM.create({
      id: 'media', title: 'Doors Media Player', icon: 'media', w: 420, h: 360,
      onClose: () => cancelAnimationFrame(this.raf),
      render: b => {
        b.innerHTML = `<div class="mp"><canvas></canvas><div class="mp-list"></div><div class="mp-ctrl"><button type="button" data-a="prev" aria-label="Zurück">⏮</button><button type="button" data-a="play" aria-label="Abspielen">▶</button><button type="button" data-a="stop" aria-label="Stopp">■</button><button type="button" data-a="next" aria-label="Weiter">⏭</button><div class="now"></div></div></div>`;
        this.b = b; this.list(); this.ctrl();
        const cv = b.querySelector('canvas'); const loop = t => { if (!WM.wins.media) return; this.viz(cv, t); this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop);
      },
    });
  },
  list() {
    const l = this.b.querySelector('.mp-list'); l.innerHTML = '';
    Music.tracks.forEach((t, i) => { const b = h(`<button type="button" class="${Music.track === i && Music.timer ? 'on' : ''}"><span>${i + 1}. ${t.name} – ${t.artist}</span><span>${t.bpm} BPM</span></button>`); b.onclick = () => { Music.play(i); this.list(); }; l.appendChild(b); });
    const t = Music.tracks[Music.track];
    this.b.querySelector('.now').innerHTML = Music.timer && t ? `<b>${t.name}</b>${t.artist}` : '<b>Bereit</b>Wähle einen Track';
  },
  ctrl() {
    const a = s => this.b.querySelector(`[data-a="${s}"]`);
    a('play').onclick = () => { Music.play(Math.max(0, Music.track)); this.list(); };
    a('stop').onclick = () => { Music.stop(); this.list(); };
    a('next').onclick = () => { Music.play((Music.track + 1) % Music.tracks.length); this.list(); };
    a('prev').onclick = () => { Music.play((Music.track + Music.tracks.length - 1) % Music.tracks.length); this.list(); };
  },
  viz(cv, t) {
    const k = devicePixelRatio, W = cv.width = cv.clientWidth * k, H = cv.height = cv.clientHeight * k, c = cv.getContext('2d');
    c.fillStyle = 'rgba(8,16,40,1)'; c.fillRect(0, 0, W, H);
    let data = new Uint8Array(64);
    if (Music.analyser && Music.timer) Music.analyser.getByteFrequencyData(data);
    const n = 32, bw = W / n;
    for (let i = 0; i < n; i++) {
      const v = Music.timer ? data[i] / 255 : (Math.sin(t / 600 + i / 3) + 1) * .06;
      const g = c.createLinearGradient(0, H, 0, 0); g.addColorStop(0, '#2a5bd9'); g.addColorStop(1, '#7ef7ff');
      c.fillStyle = g; c.fillRect(i * bw + 2, H - v * H * .9, bw - 4, v * H * .9);
    }
  },
};

/* ---------- SETTINGS ---------- */
const Settings = {
  open() {
    WM.create({
      id: 'settings', title: 'Eigenschaften von Anzeige', icon: 'settings', w: 420, h: 430, noMax: true,
      render: b => {
        const wps = [['bliss', 'Grüne Idylle'], ['night', 'Nachtwiese'], ['matrix', 'Matrix'], ['crimson', 'Crimson']];
        b.innerHTML = `<div class="dlg">
          <div class="groupbox"><span class="gb-t">Desktophintergrund</span><div class="wp-pick">${wps.map(([k, l]) => `<button type="button" data-wp="${k}" class="wp-${k} ${S.wallpaper === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
          <div class="groupbox"><span class="gb-t">Sound</span><label><input type="checkbox" id="set-snd" ${S.sound ? 'checked' : ''}> Soundeffekte aktivieren</label></div>
          <div class="groupbox"><span class="gb-t">Spielstand</span><p style="margin:0 0 6px">Fortschritt wird automatisch im Browser gespeichert.</p><p style="margin:0 0 8px;color:#555">Hacks: ${S.stats.hacks} · Verdient: ${cr(S.stats.earned)} · Zurückverfolgt: ${S.stats.traced}× · Tools gewonnen: ${S.stats.minisWon}/${S.stats.minis}</p><button class="xbtn danger" type="button" id="set-reset">Spiel zurücksetzen</button></div>
          <div class="dlg-btns"><button class="xbtn primary" type="button" id="set-ok">OK</button></div></div>`;
        $$('[data-wp]', b).forEach(x => x.onclick = () => { Apps.setWallpaper(x.dataset.wp); $$('[data-wp]', b).forEach(y => y.classList.toggle('on', y === x)); });
        b.querySelector('#set-snd').onchange = e => { S.sound = e.target.checked; Sound.init(); UI.tray(); if (!S.sound) Music.stop(); };
        b.querySelector('#set-ok').onclick = () => WM.close('settings');
        b.querySelector('#set-reset').onclick = async () => { if (await msgbox('Spiel zurücksetzen', 'Wirklich den gesamten Fortschritt löschen?', { icon: 'warn', buttons: ['Löschen', 'Abbrechen'] }) === 'Löschen') Game.reset(); };
      },
    });
  },
};

/* ---------- HELP ---------- */
const Help = {
  open() {
    WM.create({
      id: 'help', title: 'Hilfe und Support — So wird gespielt', icon: 'help', w: 600, h: 500,
      render: b => {
        b.innerHTML = `<div class="help"><h2>Willkommen bei ZeroDay XP</h2>
          <p>Du bist ein Hacker mit einem alten Doors-XP-Rechner. Aufträge kommen per <b>E-Mail</b>. Hacken tust du in der <b>Hack-Konsole</b>.</p>
          <h3>Der Ablauf eines Hacks</h3>
          <table><tr><td>1</td><td><code>connect &lt;ip&gt;</code></td><td>Verbinden. Ab jetzt läuft der <b>Trace</b>.</td></tr>
          <tr><td>2</td><td><code>probe</code></td><td>Ports, Firewall und Sicherheit prüfen.</td></tr>
          <tr><td>3</td><td><code>firewall</code></td><td>Falls vorhanden: erst die Firewall knacken.</td></tr>
          <tr><td>4</td><td><code>crack &lt;port&gt;</code></td><td>Startet ein Hack-Minispiel. Genug offene Ports = <b>root</b>.</td></tr>
          <tr><td>5</td><td><code>ls</code>, <code>download</code>, <code>rm</code>, <code>upload</code>, <code>transfer</code></td><td>Das Auftragsziel erledigen und Beute holen.</td></tr>
          <tr><td>6</td><td><code>clearlogs</code></td><td>Spuren löschen, sonst steigt deine Fahndung.</td></tr>
          <tr><td>7</td><td><code>dc</code></td><td>Trennen. Erst dann gibt es die Belohnung.</td></tr></table>
          <h3>Trace und Heat</h3>
          <p><b>Trace</b> (oben, rot) zeigt, wie nah der Admin dir ist. Bei 100 % wirst du rausgeworfen und deine <b>Fahndung (Heat)</b> steigt stark. Heat 100 % bedeutet Hausdurchsuchung und Game Over.</p>
          <h3>Die Hack-Tools</h3>
          <table><tr><td>Port 80</td><td>WebXploit</td><td>Codes entlang Zeile/Spalte wählen</td></tr><tr><td>Port 21</td><td>FTPBounce</td><td>Grüne Pakete klicken, rote meiden</td></tr><tr><td>Port 22</td><td>SSHcrack</td><td>Zahlencode erraten</td></tr><tr><td>Port 25</td><td>SMTPoverflow</td><td>Payloads schnell abtippen</td></tr><tr><td>Port 1433</td><td>SQLinject</td><td>Muster merken und wiederholen</td></tr><tr><td>Firewall</td><td>FirewallBreaker</td><td>Wellen angleichen</td></tr></table>
          <h3>Geld und Upgrades</h3><p>Kaufe Tools, Hardware, Proxys und Decoys auf <code>darkmarket.onion</code>. Verkaufe erbeutete Daten dort ebenfalls. Freie Aufträge findest du auf <code>jobs.onion</code>.</p>
          <h3>Gefahren</h3><p>Admins können sich einloggen (Trace ×2). Rivalen greifen deinen Rechner an. Öffne keine verdächtigen Mail-Anhänge!</p></div>`;
      },
    });
  },
};

/* ---------- RUN ---------- */
const RunDlg = {
  open() {
    WM.create({
      id: 'run', title: 'Ausführen', icon: 'run', w: 380, h: 190, noMax: true, noMin: true, noResize: true, keepSize: true,
      render: b => {
        b.innerHTML = `<div class="dlg"><div class="dlg-row">${icon('run')}<div>Geben Sie den Namen eines Programms ein (z. B. <code>cmd</code>, <code>notepad</code>, <code>taskmgr</code>).</div></div>
          <div style="display:flex;gap:6px;align-items:center"><label for="run-in">Öffnen:</label><input id="run-in" class="xinput" style="flex:1" autocomplete="off"></div>
          <div class="dlg-btns"><button class="xbtn primary" type="button" data-ok>OK</button><button class="xbtn" type="button" data-c>Abbrechen</button></div></div>`;
        const inp = b.querySelector('#run-in'); setTimeout(() => inp.focus(), 50);
        const go = () => {
          const v = inp.value.trim().toLowerCase().replace('.exe', ''); WM.close('run');
          const map = { cmd: 'terminal', command: 'terminal', terminal: 'terminal', notepad: 'notepad', taskmgr: 'taskmgr', iexplore: 'browser', browser: 'browser', explorer: 'explorer', mail: 'mail', outlook: 'mail', wmplayer: 'media', control: 'settings', help: 'help', winver: 'help' };
          if (map[v]) Apps.open(map[v]); else if (v) msgbox(v, `„${esc(v)}" wurde nicht gefunden.`, { icon: 'error' });
        };
        b.querySelector('[data-ok]').onclick = go; b.querySelector('[data-c]').onclick = () => WM.close('run');
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      },
    });
  },
};
