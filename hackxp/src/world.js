/* =====================================================================
   WORLD — services, tools, shop, hosts, story missions, contracts
===================================================================== */
const SVC = {
  80: { svc: 'http', tool: 'web', game: 'breach', label: 'HTTP' },
  21: { svc: 'ftp', tool: 'ftp', game: 'packets', label: 'FTP' },
  22: { svc: 'ssh', tool: 'ssh', game: 'lock', label: 'SSH' },
  25: { svc: 'smtp', tool: 'smtp', game: 'typer', label: 'SMTP' },
  1433: { svc: 'sql', tool: 'sql', game: 'memory', label: 'SQL' },
};
const TOOLS = {
  web: { name: 'WebXploit.exe', price: 0, port: 80, desc: 'Knackt Webserver (Port 80) per Speicher-Breach. Grundausstattung.' },
  ftp: { name: 'FTPBounce.exe', price: 350, port: 21, desc: 'Fängt Datenpakete auf FTP-Port 21 ab. Klick die grünen Pakete, meide Honeypots.' },
  ssh: { name: 'SSHcrack.exe', price: 650, port: 22, desc: 'Brute-Force auf SSH-Port 22. Errate den Zugangscode anhand von Rückmeldungen.' },
  fw: { name: 'FirewallBreaker.exe', price: 1100, port: null, desc: 'Synchronisiert dein Signal mit der Firewall-Frequenz und öffnet ein Loch.' },
  smtp: { name: 'SMTPoverflow.exe', price: 1000, port: 25, desc: 'Buffer-Overflow auf Mailserver-Port 25. Tippe die Payloads, bevor der Puffer kippt.' },
  sql: { name: 'SQLinject.exe', price: 1600, port: 1433, desc: 'Injiziert Abfragen in Datenbank-Port 1433. Merke dir das Query-Muster.' },
  wipe: { name: 'LogWiper Pro', price: 450, port: null, desc: 'Löscht Logs dreimal so schnell. Weniger Zeit im Trace.' },
};
const HW = {
  cpu: { name: 'CPU', lv: ['Pentium III 800 MHz', 'Pentium 4 2,4 GHz', 'Athlon 64 X2', 'Quantum-Kern (Prototyp)'], price: [0, 700, 1600, 3400], desc: 'Mehr Zeit in allen Hack-Tools (+18 % pro Stufe).' },
  ram: { name: 'RAM', lv: ['256 MB SDRAM', '1 GB DDR', '4 GB DDR2', '16 GB DDR3'], price: [0, 500, 1200, 2600], desc: 'Trace läuft langsamer, während Tools arbeiten.' },
  net: { name: 'Verbindung', lv: ['56k-Modem', 'DSL 6000', 'VDSL 50', 'Glasfaser 1 Gbit'], price: [0, 400, 1000, 2200], desc: 'Schnellere Downloads und Uploads.' },
};
const PROXY_PRICES = [500, 900, 1500, 2300];
const LOOT = [
  ['kunden_2026.db', 38, 260], ['passwoerter.txt', 1, 180], ['gehaelter.xls', 4, 150], ['backup_full.zip', 220, 320], ['vpn_keys.pem', 1, 240],
  ['urlaub_mallorca.jpg', 6, 0], ['chef_privat.eml', 1, 120], ['kreditkarten.csv', 12, 420], ['quellcode.zip', 140, 380], ['notizen.txt', 1, 0],
  ['server.cfg', 1, 60], ['patente_entwurf.pdf', 18, 340], ['personalakten.db', 64, 290], ['meme_sammlung.zip', 90, 0], ['bitcoin_wallet.dat', 2, 600],
  ['einkaufsliste.txt', 1, 0], ['vertraege_2026.pdf', 22, 210], ['admin_hash.txt', 1, 150], ['kamera_aufnahmen.mp4', 380, 90], ['steuer_trick.xls', 5, 270],
];
const JUNK_TEXT = {
  'notizen.txt': 'Montag: Drucker kaputt.\nDienstag: Drucker immer noch kaputt.\nMittwoch: IT sagt, Drucker ist "nicht unser Problem".',
  'einkaufsliste.txt': '- Milch\n- Energydrinks (viele)\n- Neues Passwort ausdenken (nicht "passwort123")',
  'passwoerter.txt': 'admin: Sommer2026!\nbuchhaltung: katze123\nchef: ichbinderchef\n\n(bitte nicht weitergeben!!)',
  'server.cfg': 'port=8080\nlogging=verbose\nadmin_mail=it@intern\nfirewall=off   # TODO: wieder einschalten',
  'admin_hash.txt': '$2y$10$wH8Qn1u5e8sT3m0P9yZ1xO7cJq3VbL2kR6dF4gA9hN0iU5eW8tYzS',
};

/* ---------- host factory ---------- */
function makeHost(d) {
  const host = Object.assign({
    ip: randIP(), name: 'srv', org: 'Unbekannt', sec: 1, need: 1, fw: 0, fwDown: 0, root: false,
    admin: pick(['k.schmidt', 'admin', 'm.becker', 'root', 'sysop', 'j.wagner', 'it-support']),
    files: [], bank: 0, logs: 0, proxy: false, visits: 0, alert: 0, story: false,
  }, d);
  host.ports = (d.ports || [80]).map(n => ({ n, open: false }));
  host.files = (d.files || []).map(f => Object.assign({ size: 4, value: 0, content: '' }, f));
  // sprinkle loot
  const lootN = d.loot ?? rnd(1, 3);
  const pool = LOOT.filter(l => !host.files.some(f => f.name === l[0]));
  for (let i = 0; i < lootN; i++) {
    const l = pool.splice(rnd(0, pool.length - 1), 1)[0]; if (!l) break;
    host.files.push({ name: l[0], size: l[1], value: Math.round(l[2] * (0.7 + host.sec * 0.3)), content: JUNK_TEXT[l[0]] || '' });
  }
  host.files.push({ name: 'system.log', size: 1, value: 0, content: '[auth] session opened for ' + host.admin + '\n[cron] backup ok\n[kernel] all systems nominal', sys: true });
  S.hosts[host.ip] = host;
  return host;
}

/* ---------- STORY ---------- */
const NYX = 'Nyx <nyx@shadowmail.onion>';
const STORY = [
  {
    title: 'Die Probe', from: NYX, subj: 'Dein Probeauftrag',
    body: ip => `<p>Hey Neuling,</p><p>ich bin <b>Nyx</b>. Man sagt, du hast Talent. Beweis es.</p>
      <p>Die Pizzakette <b>PizzaBlitz</b> hütet ihr Soßenrezept wie ein Staatsgeheimnis. Ein Kunde zahlt gut dafür. Ihr Webserver ist ein Witz: nur Port 80.</p>
      <pre>Ziel-IP: ${ip}
1. Hack-Konsole öffnen
2. connect ${ip}
3. probe            (zeigt Ports)
4. crack 80         (startet WebXploit)
5. ls  →  download rezept_geheim.txt
6. clearlogs        (Spuren löschen!)
7. dc               (Verbindung trennen)</pre>
      <p>Sobald du verbunden bist, läuft der <b>Trace</b>. Bei 100 % weiß die Cyberpol, wo du wohnst. Sei schnell.</p><p>– N.</p>`,
    host: () => ({ name: 'pizzablitz-web', org: 'PizzaBlitz GmbH', sec: 1, ports: [80], need: 1, loot: 1, admin: 'mario',
      files: [{ name: 'rezept_geheim.txt', size: 2, content: 'GEHEIMREZEPT „Blitzsoße"\n\n- 2 Dosen Tomaten\n- 1 Prise Oregano\n- 3 EL Ketchup (!!!)\n- Viel Liebe\n\nNIEMALS VERRATEN. Vor allem nicht, dass es Ketchup ist.', key: true }] }),
    obj: { type: 'download', file: 'rezept_geheim.txt' }, reward: 300, rep: 25,
    done: 'Sauber. Ketchup… wer hätte das gedacht. 300 Cr sind auf deinem Konto. Ich melde mich mit dem nächsten Job.',
    news: ['PizzaBlitz: Geheimrezept im Netz aufgetaucht – „Es ist Ketchup"', 'Lokales'],
  },
  {
    title: 'Peinliches Video', from: 'Lena K. <lena.k@schulnetz.de>', subj: 'bitte hilf mir!!',
    body: ip => `<p>Hi, Nyx hat mir deine Adresse gegeben.</p><p>Jemand hat ein total peinliches Video von mir auf den Server vom <b>Gymnasium Am Hafen</b> geladen und alle machen sich lustig. Die Schulleitung tut nichts.</p>
      <p>Bitte lösch <code>lena_party.mp4</code>! Ich habe 450 Cr gespart.</p><pre>Server: ${ip}
Ports: 80 (Web) und 21 (FTP) – beide müssen auf.</pre>
      <p><i>P.S. von Nyx: Für FTP brauchst du <b>FTPBounce.exe</b>. Gibt's auf <code>darkmarket.onion</code> im NetXplorer.</i></p>`,
    host: () => ({ name: 'gah-fileserver', org: 'Gymnasium Am Hafen', sec: 1, ports: [80, 21], need: 2, admin: 'hausmeister',
      files: [{ name: 'lena_party.mp4', size: 140, content: '[Videodatei]', key: true }, { name: 'vertretungsplan.txt', size: 1, content: 'Mathe fällt aus. Wie immer.' }] }),
    obj: { type: 'delete', file: 'lena_party.mp4' }, reward: 450, rep: 30,
    done: 'DANKE!!! Es ist weg! Du bist die beste Person im ganzen Internet. Hier sind die 450 Cr. 💛 – Lena',
    news: ['Gymnasium Am Hafen: Server-Panne – Datei spurlos verschwunden', 'Bildung'],
  },
  {
    title: 'Spurensuche', from: NYX, subj: 'Ein Rivale namens Cr0w',
    body: ip => `<p>Es gibt da jemanden: <b>Cr0w</b>. Er klaut Aufträge und verkauft Hacker an die Cyberpol.</p>
      <p>Ich habe einen seiner Relay-Server gefunden. Hol mir das Log <code>crow_relay.log</code>. Port 22 läuft dort mit SSH, dafür brauchst du <b>SSHcrack.exe</b>.</p>
      <pre>Relay: ${ip}
Ports: 80, 22   (beide nötig)</pre><p>Bonus: Wenn du root hast, kannst du den Relay später als <b>Proxy</b> nutzen. Das bremst jeden Trace.</p><p>– N.</p>`,
    host: () => ({ name: 'cr0w-relay-07', org: 'privat (Cr0w)', sec: 2, ports: [80, 22], need: 2, admin: 'cr0w', proxy: true,
      files: [{ name: 'crow_relay.log', size: 3, content: '[relay] tunnel 66.17.4.201 -> OMNICORP-GW\n[relay] payment received: 12.000 Cr from "O."\n[relay] target list updated: nyx, sp1der, kalt3, ???\n[relay] note: O. will die Liste bis Freitag.', key: true }] }),
    obj: { type: 'download', file: 'crow_relay.log' }, reward: 700, rep: 40,
    done: 'Interessant… Cr0w bekommt Geld von jemandem namens „O.". Behalte den Relay, er dient dir ab jetzt als Proxy. 700 Cr überwiesen.',
    news: ['Experten warnen: Hackergruppen bekriegen sich gegenseitig', 'Netz'],
    after: () => { const hst = Object.values(S.hosts).find(x => x.name === 'cr0w-relay-07'); if (hst) { hst.ownedProxy = true; balloon('Neuer Proxy', 'cr0w-relay-07 leitet ab jetzt deine Verbindungen um. Trace läuft langsamer.', { icon: 'network' }); } },
  },
  {
    title: 'Nordlicht', from: NYX, subj: 'Schwarzgeld bei der Kreditbank',
    body: ip => `<p>Die <b>Kreditbank Nordlicht</b> wäscht Geld für OmniCorp. Ich brauche Beweise: <code>schwarzgeld_2026.xls</code>.</p>
      <p>Die Bank hat eine <b>Firewall</b>. Ohne <b>FirewallBreaker.exe</b> kommst du nicht an die Ports. Befehl: <code>firewall</code>.</p>
      <pre>Bank: ${ip}
Ports: 80, 21, 22  (2 von 3 reichen)
Firewall: aktiv</pre>
      <p>Und ja: Auf dem Server liegt auch Geld. <code>transfer &lt;betrag&gt;</code> funktioniert. Aber jede Überweisung erhöht deine Fahndung. Gier tötet.</p><p>– N.</p>`,
    host: () => ({ name: 'nordlicht-core', org: 'Kreditbank Nordlicht', sec: 3, ports: [80, 21, 22], need: 2, fw: 1, bank: 9000, admin: 'h.lindqvist',
      files: [{ name: 'schwarzgeld_2026.xls', size: 9, content: 'Konto OMNI-77: 48.000.000 Cr  → Briefkasten „Hydra Holding"\nKonto OMNI-78: 12.500.000 Cr  → „Projekt H"\nFreigabe: Vorstand O.', key: true }] }),
    obj: { type: 'download', file: 'schwarzgeld_2026.xls' }, reward: 1200, rep: 60,
    done: '„Hydra Holding"… Das ist größer als ich dachte. 1.200 Cr für dich. Pass auf dich auf: Cr0w hat bestimmt mitbekommen, dass du seinen Relay hast.',
    news: ['Kreditbank Nordlicht: Hacker erbeuten interne Dokumente', 'Wirtschaft', true],
    after: () => setTimeout(() => Events.counterAttack('Cr0w'), 14000),
  },
  {
    title: 'Krähenjagd', from: NYX, subj: 'Zeit für Rache',
    body: ip => `<p>Cr0w hat versucht, dich zu hacken. Jetzt schlagen wir zurück.</p>
      <p>Ich habe seinen Heimrechner. Lösch sein Toolkit <code>crowkit.zip</code>, dann ist er für Monate raus. Er hat seinen Mailserver offen gelassen: Port 25. Dafür brauchst du <b>SMTPoverflow.exe</b>.</p>
      <pre>Cr0w-Home: ${ip}
Ports: 22, 25, 80  (alle 3 nötig)</pre><p>– N.</p>`,
    host: () => ({ name: 'crow-home', org: 'privat (Cr0w)', sec: 3, ports: [22, 25, 80], need: 3, admin: 'cr0w',
      files: [{ name: 'crowkit.zip', size: 60, content: '[Archiv]', key: true }, { name: 'tagebuch.txt', size: 1, content: 'O. zahlt doppelt, wenn ich Nyx finde. Komisch: Nyx und O. schreiben beide immer „– N." bzw. „– O." mit Gedankenstrich. Zufall?' }] }),
    obj: { type: 'delete', file: 'crowkit.zip' }, reward: 1500, rep: 70,
    done: 'Cr0w ist Geschichte. Gute Arbeit. 1.500 Cr. Jetzt wird es ernst: OmniCorp.',
    news: ['Bekannter Hacker „Cr0w" offenbar offline', 'Szene'],
  },
  {
    title: 'Hydra', from: NYX, subj: 'OmniCorp',
    body: ip => `<p>Alle Spuren führen zu <b>OmniCorp</b>. Ihr Mailserver ist der Einstieg. Ich will die Mail <code>projekt_hydra.eml</code>.</p>
      <pre>OmniCorp Mail: ${ip}
Ports: 25, 22, 80, 21  (3 von 4)
Firewall: aktiv</pre><p>Ab hier ist die Sicherheit hoch. Kauf dir Proxys oder bessere Hardware, wenn du kannst. Und Decoys.</p><p>– N.</p>`,
    host: () => ({ name: 'omni-mx01', org: 'OmniCorp', sec: 4, ports: [25, 22, 80, 21], need: 3, fw: 1, admin: 'sec-ops',
      files: [{ name: 'projekt_hydra.eml', size: 1, content: 'Von: O. (Vorstand)\nAn: Sicherheitsabteilung\nBetreff: HYDRA Phase 3\n\nHYDRA wird ab Q1 jede Kamera, jedes Telefon und jede Nachricht im Land mitlesen.\nStörfaktor: unabhängige Hacker. Unsere Agentin „N." rekrutiert gerade einen Neuen, der die übrigen für uns ausschaltet.\nSobald er den Kern-Key holt, lassen wir ihn hochgehen.\n\n– O.', key: true }] }),
    obj: { type: 'download', file: 'projekt_hydra.eml' }, reward: 2200, rep: 90,
    done: 'Hast du die Mail gelesen? Egal. Weiter geht\'s. Der letzte Schritt: die Datenbank. 2.200 Cr.',
    news: ['OmniCorp dementiert Datenleck: „Alles unter Kontrolle"', 'Wirtschaft', true],
  },
  {
    title: 'Der Kern', from: NYX, subj: 'Fast geschafft',
    body: ip => `<p>OmniCorps Datenbank enthält den Kern-Schlüssel <code>hydra_core.key</code>. Hol ihn mir.</p>
      <pre>OmniCorp DB: ${ip}
Ports: 1433, 22, 80  (alle 3)
Firewall: aktiv</pre><p>Für Port 1433 brauchst du <b>SQLinject.exe</b>.</p><p>– N.</p>`,
    host: () => ({ name: 'omni-db-prod', org: 'OmniCorp', sec: 4, ports: [1433, 22, 80], need: 3, fw: 1, admin: 'dba',
      files: [{ name: 'hydra_core.key', size: 1, content: '-----BEGIN HYDRA CORE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END HYDRA CORE KEY-----', key: true }] }),
    obj: { type: 'download', file: 'hydra_core.key' }, reward: 3000, rep: 110,
    done: 'Perfekt. Behalte den Schlüssel, bis ich mich melde. 3.000 Cr.',
    news: ['Großangriff auf OmniCorp? Konzern schweigt', 'Wirtschaft', true],
    after: () => setTimeout(() => Story.twist(), 9000),
  },
];
const FINAL = {
  nyx: {
    title: 'Hydra erwacht', from: NYX, subj: 'Der letzte Auftrag',
    body: ip => `<p>Du hast dich für mich entschieden. Klug.</p><p>Lade <code>hydra_core.key</code> auf den OmniCorp-Mainframe hoch (<code>upload hydra_core.key</code>). Damit wird HYDRA aktiviert – und ich werde reich. Du auch.</p>
      <pre>Mainframe: ${ip}
Ports: 22, 25, 80, 1433, 21  (4 von 5)
Firewall: 2 Schichten</pre><p>– N.</p>`,
    obj: { type: 'upload', file: 'hydra_core.key' }, reward: 20000, rep: 200,
  },
  ghost: {
    title: 'Kopf der Hydra', from: 'Ghostwire <gw@ghostwire.onion>', subj: 'Jetzt oder nie',
    body: ip => `<p>Danke, dass du mir vertraust.</p><p>Auf dem OmniCorp-Mainframe läuft <code>HYDRA.sys</code>. Lösch es (<code>rm HYDRA.sys</code>) und alles ist vorbei. Nyx wird versuchen, dich aufzuhalten. Rechne mit allem.</p>
      <pre>Mainframe: ${ip}
Ports: 22, 25, 80, 1433, 21  (4 von 5)
Firewall: 2 Schichten</pre><p>– GW</p>`,
    obj: { type: 'delete', file: 'HYDRA.sys' }, reward: 8000, rep: 300,
  },
};

const Story = {
  objectiveText() {
    const parts = [];
    if (S.mission) {
      const m = S.mission;
      parts.push(m.objDone ? `<b>${esc(m.title)}:</b> Ziel erreicht – Logs löschen &amp; trennen (<code>dc</code>)` : `<b>${esc(m.title)}:</b> ${this.objLabel(m)} auf <span class="mono">${m.ip}</span>`);
    }
    if (S.activeContract) { const c = S.activeContract; parts.push(c.objDone ? `<b>Job:</b> erledigt – sauber trennen` : `<b>Job:</b> ${this.objLabel(c)} auf <span class="mono">${c.ip}</span>`); }
    if (!parts.length) return S.storyDone ? 'Freies Spiel: Jobs auf <b>jobs.onion</b>' : (S.mails.some(m => !m.read) ? 'Neue E-Mail lesen.' : 'Warte auf neue Nachrichten…');
    return parts.join('<br>');
  },
  objLabel(j) {
    const o = j.obj;
    return { download: `<code>${esc(o.file)}</code> herunterladen`, delete: `<code>${esc(o.file)}</code> löschen`, upload: `<code>${esc(o.file)}</code> hochladen`, transfer: `${cr(o.amount)} abbuchen`, root: 'root-Zugriff holen' }[o.type];
  },
  sendMission(i) {
    const m = STORY[i]; if (!m) return;
    Mail.receive({ from: m.from, subj: m.subj, body: '', mission: i, tag: 'Auftrag' });
  },
  accept(i, variant) {
    const def = variant ? FINAL[variant] : STORY[i];
    let host;
    if (variant) host = makeHost({ name: 'omni-mainframe', org: 'OmniCorp', sec: 5, ports: [22, 25, 80, 1433, 21], need: 4, fw: 2, admin: 'O.', story: true, loot: 3,
      files: [{ name: 'HYDRA.sys', size: 2048, content: '[HYDRA Kernmodul – 2 GB]', key: true }] });
    else host = makeHost(Object.assign(def.host(), { story: true }));
    S.mission = { kind: 'story', idx: i, variant, title: def.title, ip: host.ip, obj: def.obj, reward: def.reward, rep: def.rep, objDone: false };
    Hack.know(host.ip);
    UI.update(); Save.write();
    return host;
  },
  check(ev) {
    [S.mission, S.activeContract].forEach(j => {
      if (!j || j.objDone || ev.ip !== j.ip) return;
      const o = j.obj;
      let ok = false;
      if (o.type === ev.type && (o.file ? o.file === ev.file : true)) ok = true;
      if (o.type === 'transfer' && ev.type === 'transfer') { j.got = (j.got || 0) + ev.amount; ok = j.got >= o.amount; }
      if (o.type === 'root' && ev.type === 'root') ok = true;
      if (ok) {
        j.objDone = true;
        Term.println('');
        Term.println('  ★ ZIEL ERREICHT ★  Jetzt Logs löschen (clearlogs) und trennen (dc).', 't-mag t-b');
        Sound.sfx('win'); UI.update();
      }
    });
  },
  onDisconnect(ip, clean) {
    const m = S.mission;
    if (m && m.objDone && m.ip === ip) {
      S.mission = null;
      Eco.addMoney(m.reward); Eco.addRep(m.rep); S.stats.hacks++;
      if (m.variant) return this.finish(m.variant, clean);
      const def = STORY[m.idx];
      Mail.receive({ from: def.from, subj: 'Re: ' + def.subj, body: `<p>${def.done}</p>`, tag: '+' + cr(m.reward) });
      if (def.news) News.add(def.news[0], def.news[1], def.news[2]);
      def.after && def.after();
      S.story = m.idx + 1;
      if (STORY[S.story] && m.idx !== 6) setTimeout(() => this.sendMission(S.story), 11000);
      if (m.idx === 0) setTimeout(() => Mail.receive({ from: 'jobs.onion <noreply@jobs.onion>', subj: 'Jobbörse freigeschaltet', body: '<p>Neue Mitglieder können jetzt freie Aufträge annehmen. Öffne <code>jobs.onion</code> im NetXplorer.</p><p>Je höher dein Rang, desto lukrativer die Jobs.</p>', tag: 'Info' }), 5000);
      UI.update(); Save.write();
    }
    const c = S.activeContract;
    if (c && c.objDone && c.ip === ip) {
      S.activeContract = null;
      Eco.addMoney(c.reward); Eco.addRep(c.rep); S.stats.hacks++;
      Mail.receive({ from: c.client, subj: 'Auftrag erledigt', body: `<p>${pick(['Saubere Arbeit. Bezahlung ist raus.', 'Danke. Wir hatten nie Kontakt.', 'Exzellent. Wir melden uns wieder.', 'Perfekt erledigt. Geld ist unterwegs.'])}</p><p><b>+${cr(c.reward)}</b>, +${c.rep} Ruf</p>`, tag: '+' + cr(c.reward) });
      News.add(`${c.org}: ${pick(['IT-Sicherheitsvorfall bestätigt', 'Systeme vorübergehend offline', 'Ermittlungen nach Hackerangriff', 'Daten möglicherweise kompromittiert'])}`, 'Netz');
      delete S.hosts[ip];
      Contracts.refill(); UI.update(); Save.write();
    }
  },
  twist() {
    Mail.receive({ from: 'Ghostwire <gw@ghostwire.onion>', subj: 'LIES DAS, bevor du Nyx den Schlüssel gibst', tag: 'Wichtig', twist: true,
      body: `<p>Du kennst mich nicht. Ich habe Cr0w gekannt, bevor du ihn ausgelöscht hast.</p>
      <p>Hast du <code>projekt_hydra.eml</code> gelesen? <b>Nyx ist „N."</b>, OmniCorps Agentin. Sie hat dich benutzt, um jeden Hacker auszuschalten, der HYDRA stoppen könnte. Cr0w hat nur versucht, die Liste zu verkaufen, um selbst zu überleben.</p>
      <p>Wenn du ihr den Schlüssel gibst, geht HYDRA online, und du bist der Nächste auf ihrer Liste.</p>
      <p>Oder du hilfst mir, HYDRA zu löschen. Du musst dich entscheiden.</p>` });
    setTimeout(() => Mail.receive({ from: NYX, subj: 'Glaub ihm kein Wort', tag: 'Wichtig',
      body: `<p>Ghostwire ist ein Lügner und Cr0ws Partner. Wir sind kurz vorm Ziel: <b>20.000 Cr</b> für dich, wenn du den Schlüssel auf den Mainframe lädst.</p><p>Vertrau mir. Habe ich dich je enttäuscht?</p><p>– N.</p>` }), 6000);
  },
  choose(side) {
    if (S.flags.side) return;
    S.flags.side = side;
    const def = FINAL[side];
    const host = this.accept(7, side);
    Mail.receive({ from: def.from, subj: def.subj, body: def.body(host.ip), tag: 'Finale', final: side });
    if (side === 'ghost') { S.flags.nyxHunt = true; setTimeout(() => Events.attack('Nyx (OmniCorp)'), 25000); }
    UI.update();
  },
  finish(side, clean) {
    S.storyDone = true; S.ending = side;
    News.add(side === 'ghost' ? 'HYDRA-Skandal: OmniCorp-Überwachungsprogramm zerstört – Vorstand verhaftet' : 'OmniCorp startet „HYDRA" – Bürgerrechtler entsetzt', 'Breaking', true);
    Save.write();
    setTimeout(() => Game.ending(side), 1800);
  },
};

/* ---------- CONTRACTS (endless jobs) ---------- */
const ORGS = [
  ['Müller Logistik', 1], ['Zahnarztpraxis Dr. Sommer', 1], ['FitBox Studios', 1], ['Kiosk-Kette Späti24', 1],
  ['Stadtwerke Kranichfeld', 2], ['Kanzlei Weber & Partner', 2], ['Brightline Media', 2], ['Aurora Games', 2], ['Hafenamt Nordport', 2],
  ['Polaris Versicherung', 3], ['Silberfisch Casino', 3], ['Neonet Telekom', 3], ['Vexa Pharma', 3],
  ['Helix Robotics', 4], ['Kraftwerk Ostend', 4], ['Bundesarchiv (Außenstelle)', 4], ['Valkyr Rüstung', 5], ['Zentralbank-Rechenzentrum', 5],
];
const CLIENTS = ['anon_7734 <x@onion.mail>', 'Mr. Grau <grau@protonix.onion>', 'Konkurrenz-AG <cfo@burner.mail>', 'Whistle <leaks@truth.onion>', 'K. <k@shadowmail.onion>', 'Vogel <v@silent.onion>'];
const Contracts = {
  gen() {
    const maxSec = clamp(1 + Math.floor(S.rep / 120), 1, 5);
    const sec = rnd(Math.max(1, maxSec - 2), maxSec);
    const orgs = ORGS.filter(o => o[1] === sec), org = pick(orgs.length ? orgs : ORGS)[0];
    const portPool = [[80, 21], [80, 21, 22], [80, 22, 21, 25], [80, 22, 25, 1433, 21], [22, 25, 80, 1433, 21]][sec - 1];
    const ports = portPool.slice(0, clamp(sec + rnd(0, 1), 1, portPool.length));
    const need = clamp(Math.ceil(sec * 0.75), 1, ports.length);
    const types = sec >= 2 ? ['download', 'download', 'delete', 'upload', 'transfer'] : ['download', 'delete'];
    const type = pick(types);
    const target = pick({
      download: ['kundendaten_master.db', 'prototyp_specs.pdf', 'geheimvertrag.pdf', 'mitarbeiter_ssn.csv', 'sourcecode_v2.zip', 'emails_vorstand.eml'],
      delete: ['beweisfoto_0412.jpg', 'ueberwachung_cam3.mp4', 'schuldnerliste.xls', 'kompromat.zip', 'blacklist.db'],
      upload: ['backdoor.exe'], transfer: [''],
    }[type]);
    const amount = type === 'transfer' ? 1000 * sec + rnd(0, 6) * 250 : 0;
    const reward = Math.round((120 + 160 * Math.pow(sec, 1.55)) * (0.85 + Math.random() * 0.35) / 10) * 10;
    const verb = { download: 'Besorg uns', delete: 'Vernichte', upload: 'Platziere', transfer: 'Buche ab:' }[type];
    return {
      id: 'c' + (S.seq++), org, sec, ports, need, fw: sec >= 3 ? (sec >= 5 ? 2 : 1) : 0, type, file: target, amount,
      reward, rep: 6 + sec * 6, client: pick(CLIENTS),
      title: type === 'transfer' ? `${org}: ${cr(amount)} umleiten` : `${org}: ${target}`,
      desc: type === 'transfer' ? `Buche mindestens ${cr(amount)} vom Firmenkonto ab. Was du darüber hinaus holst, behältst du.` : `${verb} <code>${esc(target)}</code>${type === 'upload' ? ' (liegt nach Annahme in deinen Dateien)' : ''}.`,
    };
  },
  refill() { while (S.contracts.length < 5) S.contracts.push(this.gen()); },
  accept(id) {
    if (S.activeContract) return msgbox('Jobbörse', 'Du hast schon einen aktiven Job. Erledige ihn zuerst oder brich ihn in der Jobbörse ab.', { icon: 'warn' });
    const c = S.contracts.find(x => x.id === id); if (!c) return;
    S.contracts = S.contracts.filter(x => x.id !== id);
    const files = [];
    if (c.type === 'download' || c.type === 'delete') files.push({ name: c.file, size: rnd(2, 80), content: '[vertraulich]', key: true });
    const host = makeHost({ name: c.org.toLowerCase().replace(/[^a-z]+/g, '-').slice(0, 14) + '-' + rnd(1, 9), org: c.org, sec: c.sec, ports: c.ports, need: c.need, fw: c.fw, bank: c.type === 'transfer' ? c.amount * 2 + rnd(0, 3000) : (c.sec >= 3 && Math.random() < .4 ? rnd(1, 4) * 1000 : 0), files });
    if (c.type === 'upload' && !S.files.some(f => f.name === 'backdoor.exe')) S.files.push({ name: 'backdoor.exe', size: 2, value: 0, content: '[Backdoor des Auftraggebers]', from: 'Auftraggeber' });
    S.activeContract = { kind: 'contract', id: c.id, title: c.title, org: c.org, ip: host.ip, obj: { type: c.type, file: c.file, amount: c.amount }, reward: c.reward, rep: c.rep, client: c.client, objDone: false };
    Hack.know(host.ip);
    Mail.receive({ from: c.client, subj: 'Auftrag: ' + c.title, body: `<p>Abgemacht.</p><p>${c.desc}</p><pre>Ziel: ${host.ip} (${esc(c.org)})\nSicherheit: ${'■'.repeat(c.sec)}${'□'.repeat(5 - c.sec)}\nPorts: ${c.ports.join(', ')} (${c.need} nötig)${c.fw ? '\nFirewall: aktiv' : ''}</pre><p>Bezahlung nach sauberer Erledigung: <b>${cr(c.reward)}</b></p>`, tag: 'Job' });
    UI.update(); Save.write(); Sound.sfx('ok');
  },
  abort() {
    const c = S.activeContract; if (!c) return;
    if (Hack.conn && Hack.conn.ip === c.ip) return msgbox('Jobbörse', 'Trenne zuerst die Verbindung zum Ziel.', { icon: 'warn' });
    delete S.hosts[c.ip]; S.activeContract = null; Eco.addRep(-5); this.refill(); UI.update();
    balloon('Job abgebrochen', 'Dein Ruf hat etwas gelitten (−5).', { icon: 'warn' });
  },
};
