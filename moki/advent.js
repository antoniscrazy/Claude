// Moki Weihnachten: Adventskalender (24 Tuerchen), Weihnachtsbaum zum Schmuecken, Lichterkette, Schnee, Zipfelmuetze am Logo.
// Wird nur in moki_weinachten.html eingebettet (build.py). Nutzt Hilfen aus app.js (games, app, home, renderSide, openGame, icon, esc, CATLABEL, CATICON, SVG).
// Vorschau eines Tages: moki_weinachten.html?advent=12   (0 = noch nicht gestartet, 24 = alles offen)
(function () {
  "use strict";
  window.MOKI_XMAS = true;
  const KEY = "moki-advent-open", root = document.documentElement;
  const forcedRaw = new URLSearchParams(location.search).get("advent");
  const forced = forcedRaw === null ? null : Math.max(0, Math.min(24, parseInt(forcedRaw, 10) || 0));

  // ---------- Datum: Tag im Advent nach deutscher Zeit ----------
  const berlin = () => { const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", month: "numeric", day: "numeric" }).formatToParts(new Date()); return { m: +p.find(x => x.type === "month").value, d: +p.find(x => x.type === "day").value }; };
  function today() { if (forced !== null) return forced; const b = berlin(); if (b.m === 12) return Math.min(b.d, 24); if (b.m <= 2) return 24; return 0; }
  function daysUntil() { const y = +new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric" }).format(new Date()), b = berlin(); return Math.max(1, Math.round((Date.UTC(y, 11, 1) - Date.UTC(y, b.m - 1, b.d)) / 86400000)); }

  // ---------- Inhalt: pro Tuerchen ein Spiel, ein Gruss, ein Schmuckstueck ----------
  const DAYS = [
    { g: "blumgi-ball", o: "⭐", t: "Los geht's!", s: "Heute startet dein Moki-Advent: jeden Tag ein Türchen, ein Spiel und ein Schmuckstück für deinen Baum." },
    { g: "blumgi-merge", o: "🍪", t: "Plätzchen-Zeit", s: "Passend zur Backzeit: Heute wird gemischt und verschmolzen. Plätzchen gibt es bestimmt auch noch." },
    { g: "blumgi-paintball", o: "☕", t: "Heißer Kakao", s: "Tipp für heute: Kakao kochen, Marshmallows rein und dann in Ruhe zocken. Mit Sahne ist es noch besser." },
    { g: "blumgi-soccer", o: "🌸", t: "Barbaratag", s: "Heute ist Barbaratag. Der Brauch: Kirschzweige schneiden, die bis Weihnachten blühen sollen." },
    { g: "dino-bros", o: "🦌", t: "Rentier-Fakt", s: "Rentiere sind die einzigen Hirsche, bei denen auch die Weibchen ein Geweih tragen. Dein heutiges Spiel ist urzeitlicher." },
    { g: "gobble", o: "🎅", t: "Nikolaustag", s: "Stiefel raus! Heute ist Nikolaustag, und dein Türchen hat einen Happen für dich." },
    { g: "hexellent", o: "☃️", t: "Schnee-Witz", s: "Was sagt ein Schneemann zum anderen? „Riechst du auch Karotten?“ Heute knobelst du mit Sechsecken." },
    { g: "idle-cowshed", o: "💡", t: "Lichterglanz", s: "Hast du heute schon Lichterketten gesehen? Moki hat dir eine übers Fenster gehängt. Und im Stall wird gearbeitet." },
    { g: "free-rider-jumps", o: "🎪", t: "Weihnachtsmarkt-Gefühl", s: "Gebrannte Mandeln, Gedränge, volle Straßen. Heute geht es dagegen auf zwei Rädern durch die Lüfte." },
    { g: "dune", o: "🧩", t: "Zehn Türchen offen", s: "Zehn Türchen sind auf. Heute geht es in die Wüste. Zum Aufwärmen passend zum Winter." },
    { g: "drift-boss", o: "🔔", t: "Zahlenzauber", s: "Elf Türchen sind offen und heute wird gedriftet. Ein Fehler in der Kurve, und du fliegst raus." },
    { g: "monster-match", o: "🎁", t: "Halbzeit!", s: "Halbzeit im Advent! Heute darfst du Monster suchen und Paare finden. Ruhig kombinieren." },
    { g: "moto-trap", o: "❄️", t: "Schwung holen", s: "Draußen ist es glatt, drinnen darfst du Gas geben. Heute zählt jede Kurve." },
    { g: "slime-dunk", o: "🍔", t: "Schleim-Treffer", s: "Auch Weihnachtsmänner brauchen Bewegung. Heute geht es mit Schleim auf den Korb." },
    { g: "stack", o: "🧶", t: "Stapelzeit", s: "Geschenke stapelt man am besten in der richtigen Reihenfolge. Heute übst du das mit Blöcken." },
    { g: "stick-fighter", o: "🔷", t: "Winterkampf", s: "Schneeflocken haben sechs Ecken, Strichmännchen haben null. Heute wird trotzdem gekämpft." },
    { g: "stickman-merge", o: "🌱", t: "Truppenverstärkung", s: "Zusammen ist man stärker. Heute verschmilzt du Strichmännchen zu einer ganzen Armee." },
    { g: "helix-jump", o: "🔴", t: "Kugeln!", s: "Weihnachtskugeln fallen nicht und gehen auch nicht kaputt. Heute geht es Ebene für Ebene nach unten." },
    { g: "doodle-jump", o: "🛷", t: "Winterfahrt", s: "Draußen ist es glatt. Drinnen darfst du springen, so hoch du kannst." },
    { g: "subway-surfers", o: "🐦", t: "Stress abbauen", s: "Noch vier Tage. Gegen Vorfreude-Stress hilft: einfach mal losrennen." },
    { g: "balatro", o: "🕯️", t: "Längste Nacht", s: "Um den 21. Dezember ist die längste Nacht des Jahres. Perfekt für Karten und gemütliches Licht." },
    { g: "tombofthemask", o: "🧣", t: "Vorfreude", s: "Nur noch zwei Nächte. Heute rast du durch ein Labyrinth und sammelst, was du kriegen kannst." },
    { g: "cut-the-rope", o: "🍬", t: "Letzte Besorgungen", s: "Alles eingepackt? Dann schneide heute noch das Seil durch und füttere das Monster mit Bonbons." },
    { g: null, o: "🎄", t: "Bescherung!", s: "Frohe Weihnachten! Dein Geschenk: ein Überraschungsspiel, ausgewählt vom Moki-Zufall. Viel Spaß beim Auspacken." }
  ];
  const findGame = id => games.find(g => g.id === id) || (window.MOKI_XMAS_GAMES || []).find(g => g.id === id);

  // ---------- Quiz: pro Tuerchen eine Frage (erste Antwort ist die richtige, die Reihenfolge wird pro Tag fest gemischt) ----------
  const QZ = [
    ["Wie viele Kerzen hat ein klassischer Adventskranz?", ["4", "3", "7"]],
    ["Was wird im Advent traditionell gebacken?", ["Plätzchen", "Eiswürfel", "Pizzateig"]],
    ["Womit verfeinert man heißen Kakao oft?", ["Sahne", "Senf", "Essig"]],
    ["Welche Zweige schneidet man am Barbaratag?", ["Kirschzweige", "Tannenzweige", "Eichenzweige"]],
    ["Welche Tiere ziehen den Schlitten des Weihnachtsmanns?", ["Rentiere", "Pferde", "Hunde"]],
    ["An welchem Tag kommt der Nikolaus?", ["6. Dezember", "24. Dezember", "1. Januar"]],
    ["Was baut man aus drei großen Schneekugeln?", ["Einen Schneemann", "Ein Iglu", "Einen Schlitten"]],
    ["Was fällt im Winter oft vom Himmel?", ["Schnee", "Sand", "Konfetti"]],
    ["Was gibt es auf dem Weihnachtsmarkt?", ["Gebrannte Mandeln", "Wassermelonen", "Sandburgen"]],
    ["Wie viele Adventssonntage gibt es vor Weihnachten?", ["4", "2", "7"]],
    ["In welchem Land wurde „Stille Nacht“ zum ersten Mal gesungen?", ["Österreich", "Italien", "Spanien"]],
    ["Wie viele Türchen hat ein klassischer Adventskalender?", ["24", "12", "31"]],
    ["Was braucht man zum Rodeln?", ["Einen Schlitten", "Ein Skateboard", "Ein Surfbrett"]],
    ["Was ist ein Stollen?", ["Ein Kuchen", "Ein Schuh", "Ein Werkzeug"]],
    ["Wie viele Ecken hat eine typische Schneeflocke?", ["6", "4", "8"]],
    ["Was sitzt oft ganz oben auf dem Weihnachtsbaum?", ["Ein Stern", "Ein Schuh", "Ein Ei"]],
    ["Wie heißt die Zimmerpflanze mit den roten Blättern zu Weihnachten?", ["Weihnachtsstern", "Gummibaum", "Kaktus"]],
    ["Woraus besteht ein Lebkuchenhaus?", ["Lebkuchen", "Beton", "Holz"]],
    ["Wie nennt man Schuhe mit Kufen zum Gleiten auf Eis?", ["Schlittschuhe", "Sandalen", "Gummistiefel"]],
    ["Wie heißt der letzte Tag des Jahres?", ["Silvester", "Pfingsten", "Allerheiligen"]],
    ["Wie nennt man den kürzesten Tag des Jahres?", ["Wintersonnenwende", "Sommerfest", "Nikolaustag"]],
    ["Wann ist Heiligabend?", ["24. Dezember", "6. Januar", "31. Oktober"]],
    ["Wie nennt man die Tage zwischen Weihnachten und Neujahr?", ["Zwischen den Jahren", "Hundstage", "Karnevalszeit"]],
    ["Was bringt der Weihnachtsmann?", ["Geschenke", "Hausaufgaben", "Rechnungen"]]
  ];
  function quiz(day) {
    const [q, a] = QZ[day - 1], idx = [0, 1, 2]; let sd = day * 7919 + 13;
    for (let i = 2; i > 0; i--) { sd = (sd * 16807) % 2147483647; const j = sd % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return { q, opts: idx.map(i => ({ t: a[i], ok: i === 0 })) };
  }
  const TITLES = [[0, "Wichtel"], [5, "Weihnachtself"], [10, "Rentier-Profi"], [15, "Weihnachtsmeister"], [20, "Weihnachtsmann"]];
  const titleFor = n => TITLES.filter(t => n >= t[0]).pop()[1];

  // ---------- Baum: 24 Plaetze fuer Schmuck (gleiche Koordinaten fuer Kalender und Einleitung, in Prozent) ----------
  function slots() {
    const rows = [[22, 1], [31, 2], [41, 3], [52, 5], [63, 6], [75, 7]], out = [];
    const hw = y => Math.max(.786 * Math.max(0, y - 6) * (y <= 34 ? 1 : 0), .88 * Math.max(0, y - 20) * (y >= 20 && y <= 54 ? 1 : 0), .975 * Math.max(0, y - 38) * (y >= 38 ? 1 : 0));
    rows.forEach(([y, c]) => { const w = hw(y) * .8; for (let k = 0; k < c; k++) out.push({ x: c === 1 ? 50 : 50 + ((k + .5) / c - .5) * 2 * w, y }); });
    // feste Mischung: Tag -> Platz
    const order = []; for (let i = 0; i < 24; i++) order.push(i);
    let s = 7; for (let i = 23; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
    return order.map(i => out[i]);
  }
  const SLOTS = slots();
  window.MOKI_XMAS_API = { DAYS, SLOTS, today, findGame, daysUntil };

  // ---------- Zustand ----------
  const getOpen = () => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch (e) { return new Set(); } };
  const saveOpen = s => { try { localStorage.setItem(KEY, JSON.stringify([...s])); } catch (e) {} };
  let opened = getOpen();
  const getJ = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const setJ = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let qres = getJ("moki-advent-quiz", {}), flakes = +getJ("moki-advent-flakes", 0) || 0;
  const stars = () => Object.values(qres).filter(v => v === 1).length;
  const gifts = () => Math.min(5, Math.floor(flakes / 5));
  const stat = (m, k) => { try { if (window.mokiStat) window.mokiStat(m, k || ""); } catch (e) {} };

  // ---------- Countdown bis zur Bescherung (24.12., 18 Uhr deutsche Zeit) ----------
  function cdParts() {
    const y = +new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric" }).format(new Date());
    const ms = Date.UTC(y, 11, 24, 17, 0, 0) - Date.now(); if (ms <= 0) return null;
    const t = Math.floor(ms / 1000); return { d: Math.floor(t / 86400), h: Math.floor(t % 86400 / 3600), m: Math.floor(t % 3600 / 60), s: t % 60 };
  }
  const p2 = n => String(n).padStart(2, "0");
  const cdHtml = () => { const c = cdParts(); return c ? `<div class="xmcd" data-cd role="timer" aria-label="Zeit bis zur Bescherung"><span class="cl">Bescherung in</span><b data-u="d">${c.d}</b><i>Tagen</i><b data-u="h">${p2(c.h)}</b><i>Std</i><b data-u="m">${p2(c.m)}</b><i>Min</i><b data-u="s">${p2(c.s)}</b><i>Sek</i></div>` : `<div class="xmcd" data-cd><span class="cl">Frohe Weihnachten!</span></div>`; };
  setInterval(() => { const c = cdParts(); if (!c) return; document.querySelectorAll("[data-cd] [data-u]").forEach(e => { const v = c[e.dataset.u]; e.textContent = e.dataset.u === "d" ? v : p2(v); }); }, 1000);

  Object.assign(SVG, { gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>' });
  CATLABEL.__advent = "Adventskalender"; CATICON.__advent = "gift";

  // ---------- Darstellung ----------
  const treeHtml = () => {
    const td = today();
    const orn = DAYS.map((it, i) => { const s = SLOTS[i], on = opened.has(i + 1) && i + 1 <= Math.max(td, 24); return `<span class="orn c${i % 4}${on ? " on" : " slot"}" style="left:${s.x}%;top:${s.y}%;animation-delay:${i * 30}ms">${on ? it.o : "?"}</span>`; }).join("");
    const tier = (pts, id) => `<polygon points="${pts}" fill="url(#xmg${id})"/><polygon points="${pts}" fill="none" stroke="#9bf0c8" stroke-opacity=".55" stroke-width=".5" stroke-linejoin="round"/>`;
    const caps = (y, x0, x1) => { let d = ""; const n = 7; for (let q = 0; q < n; q++) { const x = x0 + (x1 - x0) * (q + .5) / n; d += `<ellipse cx="${x.toFixed(1)}" cy="${y}" rx="3.2" ry="1.7" fill="#fff"/>`; } return d; };
    const bulbs = [[22, 40], [30, 47], [37, 36], [44, 52], [50, 33], [58, 55], [64, 45], [70, 62], [76, 38], [82, 58], [88, 49], [60, 28]].map((b, k) => `<circle class="bl bl${k % 4}" cx="${b[1]}" cy="${b[0]}" r="1.15"/>`).join("");
    return `<div class="tree" role="img" aria-label="Weihnachtsbaum mit ${opened.size} von 24 Schmuckstücken"><i class="tglow"></i><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="xmg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3ed08f"/><stop offset="1" stop-color="#0f6b43"/></linearGradient>
      <linearGradient id="xmg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34c383"/><stop offset="1" stop-color="#0c5a38"/></linearGradient>
      <linearGradient id="xmg3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2bb277"/><stop offset="1" stop-color="#0a4a2f"/></linearGradient>
      <linearGradient id="xmt" x1="0" x2="1"><stop offset="0" stop-color="#8a5126"/><stop offset="1" stop-color="#53301a"/></linearGradient></defs>
      <ellipse cx="50" cy="95" rx="46" ry="4.5" fill="#fff" fill-opacity=".92"/><ellipse cx="50" cy="94" rx="40" ry="3" fill="#dbe7ff" fill-opacity=".5"/>
      <rect x="43" y="80" width="14" height="14" rx="2" fill="url(#xmt)"/>
      ${tier("8,80 50,44 92,80", 1)}${tier("17,58 50,22 83,58", 2)}${tier("26,37 50,6 74,37", 3)}
      ${caps(79.2, 12, 88)}${caps(57.2, 22, 78)}${caps(36.2, 31, 69)}
      <path d="M14 70 Q30 76 50 66 T86 68" fill="none" stroke="#ffd23f" stroke-width=".7" stroke-dasharray="1.4 1.8" stroke-linecap="round" opacity=".8"/>${bulbs}</svg>
      <svg class="tstar${opened.has(24) ? " on" : ""}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1l3.1 7 7.6.7-5.7 5 1.7 7.5L12 17.3 5.3 21.2 7 13.7 1.3 8.7l7.6-.7z" fill="#ffd23f" stroke="#fff3b0" stroke-width=".8" stroke-linejoin="round"/></svg>${orn}</div><div class="gifts" aria-label="${gifts()} von 5 Geschenken unterm Baum">${Array.from({ length: 5 }, (_, i) => `<span class="${i < gifts() ? "on" : ""}">🎁</span>`).join("")}</div><small class="fl">❄ ${flakes} goldene Glücksflocken${gifts() < 5 ? ` · noch ${5 - (flakes % 5)} bis zum nächsten Geschenk` : " · alle Geschenke gesammelt!"}</small>`;
  };
  const doorHtml = (it, i) => {
    const d = i + 1, td = today(), g = it.g ? findGame(it.g) : null, isOpen = opened.has(d) && d <= Math.max(td, 24), locked = d > td, isToday = d === td && !isOpen;
    const back = isOpen ? `<div class="dback">${g ? `<img src="${esc(g.image)}" alt="">` : ""}<span class="dgr"></span><span class="dd">${d}</span><span class="do">${it.o}</span><b>${esc(g ? g.title : "Bescherung")}</b></div>` : `<div class="dback"></div>`;
    return `<button type="button" class="door${isOpen ? " open" : ""}${locked ? " locked" : ""}${isToday ? " today" : ""}" data-d="${d}" aria-label="Türchen ${d}${locked ? ", noch gesperrt" : isOpen ? ", geöffnet" : ""}">${back}<div class="dface"><span class="dnum"><b>${d}</b></span><i class="dbow"></i>${locked ? '<span class="dlock">🔒</span>' : ""}</div></button>`;
  };
  function calendarView() {
    const td = today(), n = [...opened].filter(d => d <= Math.max(td, 24)).length, st = stars();
    const head = td === 0 ? `Der Kalender startet am 1. Dezember. Noch ${daysUntil()} ${daysUntil() === 1 ? "Tag" : "Tage"}.` : td < 24 ? `Heute ist Türchen ${td} dran.` : "Alle 24 Türchen sind offen. Frohe Weihnachten!";
    const mine = DAYS.map((d, i) => opened.has(i + 1) && i + 1 <= td && findGame(d.g)).filter(Boolean), opts = mine.map(g => `<option value="${esc(g.id)}">${esc(g.title)}</option>`).join("");
    app.innerHTML = `<section class="adv"><div class="ahead"><div><h2>${icon("gift")}Adventskalender</h2><p>${head}</p></div><div class="acount">${n} von 24 Türchen geöffnet</div></div>
      ${cdHtml()}
      <div class="alay"><div><div class="doors">${DAYS.map(doorHtml).join("")}</div>
        <div class="agift"><h3>🎁 Verschenke ein Spiel</h3><p>Verschenken kannst du nur Spiele aus Türchen, die du selbst schon geöffnet hast. Dein Freund bekommt einen Link und packt das Geschenk bei Moki aus.</p>
          ${mine.length ? "" : "<p><b>Öffne zuerst ein Türchen, dann kannst du dessen Spiel verschenken.</b></p>"}<div class="agrow"${mine.length ? "" : " hidden"}><select id="ag-game" aria-label="Spiel zum Verschenken">${opts}</select><input id="ag-name" maxlength="24" placeholder="Dein Name" autocomplete="off" aria-label="Dein Name"><button class="btn go" id="ag-go" type="button">Geschenklink erstellen</button></div><div class="agout" id="ag-out" aria-live="polite"></div></div></div>
        <aside class="atree"><h3>Dein Weihnachtsbaum</h3><div class="astars"><span>⭐ ${st} ${st === 1 ? "Stern" : "Sterne"}</span><b>${titleFor(st)}</b></div><small>Jedes Türchen schenkt Schmuck, jede richtige Quizantwort einen Stern.</small>${treeHtml()}</aside></div></section>`;
  }
  window.MOKI_XMAS_HOME = () => {
    const td = today(), n = opened.size, t = td === 0 ? `Noch ${daysUntil()} ${daysUntil() === 1 ? "Tag" : "Tage"} bis zum 1. Dezember` : td < 24 ? `Heute: Türchen ${td}` : "Alle Türchen offen";
    const sub = td === 0 ? "Ab dem 1. Dezember öffnet sich jeden Tag ein Türchen mit einem Spiel, einem Gruß und Schmuck für deinen Baum." : `Jeden Tag ein Spiel und ein Schmuckstück für deinen Baum. Du hast ${n} von 24 Türchen geöffnet.`;
    return `<section class="advb" aria-label="Adventskalender"><div class="adn">${td || 24}</div><div class="adt"><span class="chip">${icon("gift")}Adventskalender</span><h2>${esc(t)}</h2><p>${esc(sub)}</p><div class="adp"><i style="width:${Math.round(n / 24 * 100)}%"></i></div>${cdHtml()}</div><button class="btn go" type="button" data-cat="__advent">${td === 0 ? "Kalender ansehen" : "Türchen öffnen"}</button></section>`;
  };
  window.MOKI_EXT_CATS = ["__advent"];
  window.MOKI_EXT_COUNT = c => c === "__advent" ? 24 : null;
  window.MOKI_EXT_VIEW = { __advent: calendarView };

  // ---------- Tuerchen oeffnen ----------
  const toast = msg => { const t = document.createElement("div"); t.className = "mtoast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.classList.add("out"), 2600); setTimeout(() => t.remove(), 3100); };
  function quizHtml(day) {
    const z = quiz(day), done = qres[day] !== undefined;
    return `<div class="quiz" data-q="${day}"><b>Quizfrage</b><p>${esc(z.q)}</p><div class="qa">${z.opts.map((o, i) => `<button type="button" class="qopt${done ? (o.ok ? " ok" : "") : ""}" data-i="${i}"${done ? " disabled" : ""}>${esc(o.t)}</button>`).join("")}</div><div class="qres" aria-live="polite">${done ? (qres[day] === 1 ? "Richtig! ⭐" : "Leider nicht. Die richtige Antwort ist markiert.") : ""}</div></div>`;
  }
  function answer(el, day, i) {
    if (qres[day] !== undefined) return;
    const z = quiz(day), ok = z.opts[i].ok; qres[day] = ok ? 1 : 0; setJ("moki-advent-quiz", qres); stat("quiz", ok ? "richtig" : "falsch");
    el.querySelectorAll(".qopt").forEach((b, j) => { b.disabled = true; if (z.opts[j].ok) b.classList.add("ok"); else if (j === i) b.classList.add("bad"); });
    const r = el.querySelector(".qres"); if (r) r.textContent = ok ? `Richtig! ⭐ Du hast jetzt ${stars()} ${stars() === 1 ? "Stern" : "Sterne"} (${titleFor(stars())}).` : "Leider nicht. Die richtige Antwort ist markiert.";
    if (ok) { const sp = el.querySelector(".sp"); if (sp) { const cols = ["#f6c667", "#fff", "#ffd23f"]; sp.innerHTML = Array.from({ length: 26 }, (_, q) => { const a = Math.random() * 6.283, d = 80 + Math.random() * 160; return `<i style="--c:${cols[q % 3]};--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;top:62%"></i>`; }).join(""); } }
  }
  function modal(day, first) {
    const it = DAYS[day - 1], g = it.g ? findGame(it.g) : null;
    const el = document.createElement("div"); el.className = "advm";
    const cols = ["#f6c667", "#ff6b5a", "#ffffff", "#3ddc84", "#4da6ff"];
    el.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-label="Türchen ${day}"><div class="sp">${first ? Array.from({ length: 36 }, (_, i) => { const a = Math.random() * 6.283, d = 120 + Math.random() * 190; return `<i style="--c:${cols[i % 5]};--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;animation-delay:${Math.random() * .25}s"></i>`; }).join("") : ""}</div>
      <span class="dn">Türchen ${day}</span><h2>${esc(it.t)}</h2><p>${esc(it.s)}</p>
      ${g ? `<div class="gcard"><img src="${esc(g.image)}" alt=""><div><b>${esc(g.title)}</b><span>${esc(g.category || "")}${g.description ? " · " + esc(g.description) : ""}</span></div></div>` : ""}
      ${quizHtml(day)}
      <div class="orn">${first ? "Neu an deinem Baum:" : "Dein Schmuckstück:"} <i>${it.o}</i></div>
      <div class="acts">${g ? `<button class="btn go" type="button" data-a="play">Jetzt spielen</button>` : `<button class="btn go" type="button" data-a="gift">Überraschung auswählen</button>`}${g ? `<button class="btn" type="button" data-a="give">🎁 Verschenken</button>` : ""}<button class="btn" type="button" data-a="close">${g ? "Später" : "Schließen"}</button></div></div>`;
    const close = () => { el.remove(); removeEventListener("keydown", onKey); if (category === "__advent") calendarView(); };
    const onKey = e => { if (e.key === "Escape") close(); };
    addEventListener("keydown", onKey);
    el.addEventListener("click", e => {
      if (e.target === el) return close();
      const b = e.target.closest("[data-a]"); if (!b && !e.target.closest(".qopt")) return;
      const qo = e.target.closest(".qopt"); if (qo) return answer(el, day, +qo.dataset.i);
      if (!b) return;
      if (b.dataset.a === "close") return close();
      if (b.dataset.a === "play") { close(); openGame(g); }
      if (b.dataset.a === "give") { close(); category = "__advent"; home(); const sel = document.getElementById("ag-game"); if (sel && g) sel.value = g.id; const gg = document.querySelector(".agift"); if (gg) gg.scrollIntoView({ block: "center" }); return; }
      if (b.dataset.a === "gift") { close(); const r = document.getElementById("rnd"); if (r) r.click(); }
    });
    document.body.appendChild(el); el.querySelector("[data-a]").focus({ preventScroll: true });
  }
  function openDoor(day, btn) {
    if (day > today()) { toast(`Türchen ${day} öffnet sich am ${day}. Dezember.`); if (btn) btn.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 300 }); return; }
    const first = !opened.has(day);
    if (first) { opened.add(day); saveOpen(opened); try { if (window.mokiStat) window.mokiStat("advent", String(day)); } catch (e) {} }
    if (btn && first) { btn.classList.remove("today"); btn.classList.add("open"); const b = btn.querySelector(".dback"); if (b) { b.style.visibility = "visible"; } }
    setTimeout(() => modal(day, first), first && btn ? 650 : 0);
  }
  document.addEventListener("click", e => { const d = e.target.closest && e.target.closest(".door"); if (d && category === "__advent") { e.preventDefault(); openDoor(+d.dataset.d, d); } });

  // ---------- Geschenk: Link erstellen und beim Empfaenger auspacken ----------
  const cleanName = n => String(n || "").replace(/[<>"'`\\\u0000-\u001f]/g, "").trim().slice(0, 24);
  document.addEventListener("click", async e => {
    if (!e.target.closest || !e.target.closest("#ag-go")) return;
    const sel = document.getElementById("ag-game"), nm = cleanName(document.getElementById("ag-name").value), out = document.getElementById("ag-out");
    const link = location.origin + location.pathname + "#/geschenk/" + sel.value + "/" + encodeURIComponent(nm);
    let copied = false; try { await navigator.clipboard.writeText(link); copied = true; } catch (er) {}
    out.innerHTML = `<b>${copied ? "Link kopiert!" : "Dein Geschenklink:"}</b> Schick ihn deinem Freund:<input readonly value="${esc(link)}" aria-label="Geschenklink"><a class="btn" href="${esc(link)}" target="_blank" rel="noopener">So sieht es aus</a>`;
    const inp = out.querySelector("input"); if (inp && !copied) inp.select(); stat("gift", "erstellt");
  });
  function showGift() {
    const m = /^#\/geschenk\/([a-z0-9-]{1,60})\/?([^/]*)$/i.exec(location.hash); if (!m || document.querySelector(".agiftv")) return;
    const g = findGame(m[1].toLowerCase()); if (!g) return; let nm = ""; try { nm = cleanName(decodeURIComponent(m[2] || "")); } catch (e) {}
    const el = document.createElement("div"); el.className = "agiftv"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Geschenk auspacken");
    el.innerHTML = `<div class="gw"><h2 class="gh">${nm ? esc(nm) + " hat dir ein Geschenk geschickt!" : "Du hast ein Geschenk bekommen!"}</h2>
      <button type="button" class="gbox" aria-label="Geschenk auspacken"><span class="glow"></span><span class="gbody"></span><span class="glid"><i class="bow"></i></span></button><p class="gp">Tippe aufs Geschenk, um es auszupacken.</p>
      <div class="greveal" hidden><div class="gcard"><img src="${esc(g.image)}" alt=""><div><span>Frohe Weihnachten!</span><b>${nm ? esc(nm) + " schenkt dir" : "Dein Geschenk:"} ${esc(g.title)}</b><small>${esc(g.category || "")}${g.description ? " · " + esc(g.description) : ""}</small></div></div>
        <div class="acts"><button class="btn go" type="button" data-a="play">Jetzt spielen</button><button class="btn" type="button" data-a="home">Zur Startseite</button></div></div><div class="gsp"></div></div>`;
    const clear = () => { try { history.replaceState(null, "", location.pathname + location.search); } catch (er) {} };
    el.addEventListener("click", e => {
      if (e.target.closest(".gbox") && !el.classList.contains("open")) {
        el.classList.add("open"); stat("gift", "ausgepackt"); const cols = ["#f6c667", "#ff6b5a", "#fff", "#3ddc84", "#4da6ff"];
        el.querySelector(".gsp").innerHTML = Array.from({ length: 60 }, (_, i) => { const a = Math.random() * 6.283, d = 140 + Math.random() * 360; return `<i style="--c:${cols[i % 5]};--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;animation-delay:${Math.random() * .2}s"></i>`; }).join("");
        setTimeout(() => { el.querySelector(".greveal").hidden = false; el.querySelector(".gp").hidden = true; el.querySelector(".gh").textContent = "Frohe Weihnachten!"; const p = el.querySelector("[data-a=play]"); if (p) p.focus({ preventScroll: true }); }, 750); return;
      }
      const b = e.target.closest("[data-a]"); if (!b) return;
      if (b.dataset.a === "play") { el.remove(); clear(); openGame(g); }
      if (b.dataset.a === "home") { el.remove(); clear(); category = "Alle"; home(); }
    });
    document.body.appendChild(el); el.querySelector(".gbox").focus({ preventScroll: true });
  }
  addEventListener("hashchange", showGift); setTimeout(showGift, 300);

  // ---------- Goldene Gluecksflocken: fangen bringt Geschenke unter den Baum ----------
  function flakeLoop() {
    const wait = () => setTimeout(spawn, 14000 + Math.random() * 14000);
    function spawn() {
      if (document.hidden || document.getElementById("player") || root.classList.contains("mi-on") || document.querySelector(".xm-flake,.agiftv,.advm")) return wait();
      const f = document.createElement("button"); f.type = "button"; f.className = "xm-flake"; f.setAttribute("aria-label", "Goldene Glücksflocke fangen"); f.textContent = "❄";
      f.style.left = (6 + Math.random() * 86) + "vw"; f.style.setProperty("--dx", (Math.random() * 160 - 80) + "px"); f.style.animationDuration = (8 + Math.random() * 4) + "s";
      f.addEventListener("click", () => {
        const r = f.getBoundingClientRect(); flakes++; setJ("moki-advent-flakes", flakes); stat("flake", "");
        const cols = ["#ffd23f", "#fff", "#f6c667"]; for (let i = 0; i < 16; i++) { const s = document.createElement("i"); s.className = "xm-fx"; const a = Math.random() * 6.283, d = 40 + Math.random() * 70; s.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;--c:${cols[i % 3]}`; document.body.appendChild(s); setTimeout(() => s.remove(), 900); }
        f.remove(); toast(flakes % 5 === 0 && flakes <= 25 ? "Neues Geschenk unter deinem Baum! 🎁" : `Goldene Glücksflocke gefangen! (${flakes})`);
        if (category === "__advent") calendarView();
      });
      f.addEventListener("animationend", () => f.remove()); document.body.appendChild(f); wait();
    }
    setTimeout(spawn, 5000 + Math.random() * 5000);
  }
  flakeLoop();

  // ---------- Spieluhr: Weihnachtslieder (frei von Rechten), startet nur auf Klick ----------
  const M = n => 440 * Math.pow(2, (n - 69) / 12);
  const SONGS = [
    { n: "Jingle Bells", u: .4, notes: [[64, 1], [64, 1], [64, 2], [64, 1], [64, 1], [64, 2], [64, 1], [67, 1], [60, 1.5], [62, .5], [64, 4], [65, 1], [65, 1], [65, 1.5], [65, .5], [65, 1], [64, 1], [64, 1], [64, .5], [64, .5], [64, 1], [62, 1], [62, 1], [64, 1], [62, 2], [67, 2],
      [64, 1], [64, 1], [64, 2], [64, 1], [64, 1], [64, 2], [64, 1], [67, 1], [60, 1.5], [62, .5], [64, 4], [65, 1], [65, 1], [65, 1.5], [65, .5], [65, 1], [64, 1], [64, 1], [64, .5], [64, .5], [67, 1], [67, 1], [65, 1], [62, 1], [60, 4], [null, 2]] },
    { n: "Stille Nacht", u: .36, notes: [[67, 1.5], [69, .5], [67, 1], [64, 3], [67, 1.5], [69, .5], [67, 1], [64, 3], [74, 2], [74, 1], [71, 3], [72, 2], [72, 1], [67, 3], [69, 2], [69, 1], [72, 1.5], [71, .5], [69, 1], [67, 1.5], [69, .5], [67, 1], [64, 3],
      [69, 2], [69, 1], [72, 1.5], [71, .5], [69, 1], [67, 1.5], [69, .5], [67, 1], [64, 3], [74, 2], [74, 1], [77, 1.5], [74, .5], [71, 1], [72, 3], [76, 3], [72, 1], [67, 1], [64, 1], [67, 1.5], [65, .5], [62, 1], [60, 6], [null, 3]] },
    { n: "We Wish You a Merry Christmas", u: .42, notes: [[62, 1], [67, 1], [67, .5], [69, .5], [67, .5], [66, .5], [64, 1], [64, 1], [64, 1], [69, 1], [69, .5], [71, .5], [69, .5], [67, .5], [66, 1], [62, 1], [62, 1], [71, 1], [71, .5], [72, .5], [71, .5], [69, .5], [67, 1], [64, 1], [62, .5], [62, .5], [64, 1], [69, 1], [66, 1], [67, 3], [null, 2]] }
  ];
  const MUS = { on: false, ctx: null, out: null, timer: 0, i: 0 };
  function playSong() {
    const ac = MUS.ctx, song = SONGS[MUS.i % SONGS.length]; let t = ac.currentTime + .15;
    song.notes.forEach(([m, d]) => {
      const dur = d * song.u;
      if (m !== null) {
        const o1 = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(); o1.type = "triangle"; o2.type = "sine"; o1.frequency.value = M(m); o2.frequency.value = M(m) * 3;
        const g2 = ac.createGain(); g2.gain.value = .22; o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(MUS.out);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.2, t + .006); g.gain.exponentialRampToValueAtTime(.0008, t + Math.max(.6, dur * 1.5));
        o1.start(t); o2.start(t); o1.stop(t + 1.8); o2.stop(t + 1.8);
      }
      t += dur;
    });
    MUS.i++; MUS.timer = setTimeout(() => { if (MUS.on) playSong(); }, (t - ac.currentTime) * 1000 + 600);
  }
  // Echte Aufnahmen (werden vom Build eingebettet); ohne sie spielt der kleine Synthesizer darueber
  const TR = Array.isArray(window.MOKI_XMAS_MUSIC) && window.MOKI_XMAS_MUSIC.length ? window.MOKI_XMAS_MUSIC : null;
  let trI = 0, trA = null;
  function trPlay() {
    if (!trA) { trA = new Audio(); trA.volume = .5; trA.addEventListener("ended", () => { trI = (trI + 1) % TR.length; if (MUS.on) trPlay(); }); }
    trA.src = TR[trI].u; trA.play().catch(() => { MUS.on = false; const bt = document.querySelector(".xm-music"); if (bt) { bt.classList.remove("on"); bt.setAttribute("aria-pressed", "false"); } toast("Die Musik konnte nicht starten."); });
  }
  function musicBtn() {
    const b = document.createElement("button"); b.type = "button"; b.className = "xm-music"; b.setAttribute("aria-pressed", "false"); b.setAttribute("aria-label", "Weihnachtsmusik an oder aus"); b.title = "Weihnachtsmusik"; b.innerHTML = "<span>♪</span>";
    b.addEventListener("click", () => {
      if (TR) {
        MUS.on = !MUS.on; b.setAttribute("aria-pressed", String(MUS.on)); b.classList.toggle("on", MUS.on);
        if (MUS.on) { trPlay(); toast("♪ " + TR[trI].n); stat("music", "an"); } else if (trA) trA.pause();
        return;
      }
      if (!MUS.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) { toast("Dein Browser kann keine Musik abspielen."); return; } MUS.ctx = new AC(); const m = MUS.ctx.createGain(); m.gain.value = .38; const dl = MUS.ctx.createDelay(1); dl.delayTime.value = .24; const fb = MUS.ctx.createGain(); fb.gain.value = .3; dl.connect(fb); fb.connect(dl); m.connect(MUS.ctx.destination); m.connect(dl); dl.connect(MUS.ctx.destination); MUS.out = m; }
      MUS.on = !MUS.on; b.setAttribute("aria-pressed", String(MUS.on)); b.classList.toggle("on", MUS.on);
      if (MUS.on) { MUS.ctx.resume(); playSong(); toast("♪ " + SONGS[(MUS.i - 1 + SONGS.length) % SONGS.length].n); stat("music", "an"); } else { clearTimeout(MUS.timer); MUS.ctx.suspend(); }
    });
    document.body.appendChild(b);
    const sync = () => { if (TR) { if (!MUS.on || !trA) return; (document.getElementById("player") || document.hidden) ? trA.pause() : trA.play().catch(() => {}); return; } if (!MUS.ctx || !MUS.on) return; (document.getElementById("player") || document.hidden) ? MUS.ctx.suspend() : MUS.ctx.resume(); };
    addEventListener("hashchange", sync); document.addEventListener("visibilitychange", sync);
  }
  musicBtn();

  // ---------- Lichterkette ----------
  function garland() {
    let el = document.getElementById("xm-garland"); if (!el) { el = document.createElement("div"); el.id = "xm-garland"; el.setAttribute("aria-hidden", "true"); document.body.appendChild(el); }
    const w = innerWidth, n = Math.max(10, Math.round(w / 46)), seg = w / n, cols = ["#ff4d5e", "#ffd23f", "#3ddc84", "#4da6ff", "#ff8a3d"];
    let d = "M0 3", b = "";
    for (let i = 0; i < n; i++) { d += ` Q ${(i + .5) * seg} 15 ${(i + 1) * seg} 3`; const cx = (i + .5) * seg; b += `<g class="bulb" style="color:${cols[i % 5]};animation-delay:${((i * 7) % 5) * .45}s"><rect x="${cx - 2}" y="8" width="4" height="5" rx="1" fill="#1b2140"/><ellipse cx="${cx}" cy="18" rx="4.4" ry="6" fill="currentColor"/></g>`; }
    el.innerHTML = `<svg viewBox="0 0 ${w} 34" preserveAspectRatio="none"><path class="wire" d="${d}"/>${b}</svg>`;
  }
  let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(garland, 150); });

  // ---------- Schnee ----------
  function snow() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = document.createElement("canvas"); cv.id = "xm-snow"; cv.setAttribute("aria-hidden", "true"); document.body.appendChild(cv);
    const x = cv.getContext("2d"); let W = 0, H = 0, flakes = [];
    const resize = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; const n = Math.round(Math.min(150, W / 9)); flakes = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: .8 + Math.random() * 2.6, v: 20 + Math.random() * 50, p: Math.random() * 6.28, a: .35 + Math.random() * .55 })); };
    resize(); addEventListener("resize", resize);
    let last = performance.now();
    (function frame(now) {
      const dt = Math.min((now - last) / 1000, .1); last = now; x.clearRect(0, 0, W, H);
      for (const f of flakes) { f.y += f.v * dt * (.6 + f.r / 3); f.x += Math.sin(now / 1500 + f.p) * 18 * dt; if (f.y > H + 6) { f.y = -6; f.x = Math.random() * W; } if (f.x > W + 6) f.x = -6; if (f.x < -6) f.x = W + 6; x.globalAlpha = f.a; x.fillStyle = "#fff"; x.beginPath(); x.arc(f.x, f.y, f.r, 0, 7); x.fill(); }
      requestAnimationFrame(frame);
    })(last);
  }

  // ---------- Zipfelmuetze auf dem Logo ----------
  function hat() {
    const logo = document.querySelector(".logo"); if (!logo || logo.querySelector(".xm-hat")) return;
    logo.insertAdjacentHTML("beforeend", '<svg class="xm-hat" viewBox="0 0 40 36" aria-hidden="true"><path d="M5 28C6 14 16 5 33 7C29 12 29 20 35 28Z" fill="#d93a49"/><path d="M5 28C6 14 16 5 33 7" fill="none" stroke="#ff8a94" stroke-width="1.6" stroke-linecap="round" opacity=".7"/><rect x="2" y="25" width="36" height="9" rx="4.5" fill="#fff"/><circle cx="34" cy="7" r="4.6" fill="#fff"/></svg>');
  }

  garland(); snow(); hat();
  document.title = document.title.replace(/^Moki/, "Moki Weihnachten");
  try { renderSide(); home(); } catch (e) {}
})();
