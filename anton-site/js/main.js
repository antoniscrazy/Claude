/* ==========================================================================
   Anton – Vibecoder · main.js
   Reines Vanilla JS, keine Abhängigkeiten.

   Module (in dieser Reihenfolge):
     0. Setup & Helfer
     1. Toast
     2. Boot-Sequenz
     3. Hintergrund: Code-Regen (Canvas)
     4. Navigation (Mobile-Menü, aktiver Link, CRT-Schalter)
     5. Hero-Typewriter
     6. Sich selbst tippende Code-Fenster (+ Mini-Syntax-Highlighter)
     7. Scroll-Reveals
     8. Karten-Tilt & Glow
     9. Labor-Ladebalken (wird nie fertig)
    10. Mini-Terminal
    11. Discord-Karte (ID kopieren, optional Lanyard)
    12. Easter Eggs (Konami-Code, Logo-Klicks, Konsole)
   ========================================================================== */
(() => {
  "use strict";

  /* 0. SETUP & HELFER ===================================================== */
  const root = document.documentElement;
  root.classList.add("js");

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand  = (min, max) => Math.random() * (max - min) + min;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reducedMotion = () => motionQuery.matches;

  // Kleiner Speicher-Wrapper (nur für die CRT-Einstellung, kein Tracking)
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* egal */ } },
  };

  const escapeHTML = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Jahr im Footer
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Bewusste "#"-Platzhalter-Links (Moki, Flexspacepro) sollen nicht nach oben springen
  $$("a[data-placeholder]").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      toast("Link kommt bald. Anton muss ihn nur noch reinkopieren.");
    })
  );

  /* 1. TOAST ============================================================== */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg, ms = 2600) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-shown"), ms);
  }

  /* 2. BOOT-SEQUENZ ======================================================= */
  const BOOT_LINES = [
    ["> lade anton.exe ", "...", " ok"],
    ["> verbinde mit KI-Assistent ", "...", ""],
    ["> KI-Assistent: ", "", "online ✔"],
    ["> Ideen: ", "", "unendlich"],
    ["> Vibe-Check: ", "", "bestanden"],
    ["> Code selbst geschrieben: ", "", "0 Zeilen (stolz drauf)"],
    ["> starte Oberfläche", "", " _"],
  ];

  function runBoot() {
    return new Promise((resolve) => {
      const boot = $("#boot");
      const log = $("#boot-log");
      if (!boot || !log || reducedMotion()) {
        boot && boot.remove();
        return resolve();
      }

      document.body.classList.add("is-booting");
      let finished = false;
      const timers = [];

      const finish = () => {
        if (finished) return;
        finished = true;
        timers.forEach(clearTimeout);
        document.removeEventListener("keydown", onKey);
        boot.classList.add("is-done");
        document.body.classList.remove("is-booting");
        setTimeout(() => boot.remove(), 500);
        resolve();
      };
      const onKey = (e) => { if (e.key === "Escape" || e.key === "Enter") finish(); };

      $("#boot-skip").addEventListener("click", finish);
      document.addEventListener("keydown", onKey);

      // Zeilen nacheinander ausgeben (~2,5 s insgesamt)
      let t = 120;
      BOOT_LINES.forEach(([pre, dots, ok], i) => {
        timers.push(setTimeout(() => {
          const line = document.createElement("div");
          line.innerHTML = `<span class="hl">${escapeHTML(pre)}</span>${escapeHTML(dots)}<span class="ok">${escapeHTML(ok)}</span>`;
          log.appendChild(line);
        }, t));
        t += i === 1 ? 480 : 300;
      });
      timers.push(setTimeout(finish, t + 450));
    });
  }

  /* 3. HINTERGRUND: CODE-REGEN ============================================ */
  const rain = (() => {
    const canvas = $("#bg-canvas");
    if (!canvas || !canvas.getContext) return { intense() {} };
    const ctx = canvas.getContext("2d");
    const GLYPHS = "01<>/{}[]();=+*&|!?#$AIaiAntonvibe".split("");
    const SIZE = 16;
    let w = 0, h = 0, cols = 0, drops = [], raf = 0, last = 0, intense = false;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${SIZE - 2}px ui-monospace, Menlo, Consolas, monospace`;
      cols = Math.ceil(w / (SIZE * 1.2));
      drops = Array.from({ length: cols }, () => ({
        y: rand(-h, 0) / SIZE,
        speed: rand(0.25, 0.7),
      }));
      ctx.fillStyle = "#07090a";
      ctx.fillRect(0, 0, w, h);
      if (reducedMotion()) drawStatic();
    }

    // Reduced Motion: einmalig ein ruhiges Muster zeichnen, keine Animation
    function drawStatic() {
      ctx.fillStyle = "#07090a"; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < cols; i++) {
        const len = Math.floor(rand(3, 14));
        const start = Math.floor(rand(0, h / SIZE));
        for (let j = 0; j < len; j++) {
          ctx.fillStyle = `rgba(61,255,154,${0.15 + (j / len) * 0.5})`;
          ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], i * SIZE * 1.2, (start + j) * SIZE);
        }
      }
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      const fps = intense ? 40 : 24;
      if (now - last < 1000 / fps) return;
      last = now;

      // Spur verblassen lassen
      ctx.fillStyle = "rgba(7, 9, 10, 0.12)";
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < cols; i++) {
        const d = drops[i];
        const x = i * SIZE * 1.2;
        const y = d.y * SIZE;
        const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        ctx.fillStyle = Math.random() > 0.96 ? "#d9ffe9" : "#3dff9a";
        ctx.fillText(ch, x, y);
        d.y += d.speed * (intense ? 2.2 : 1);
        if (y > h && Math.random() > 0.975) { d.y = rand(-20, 0); d.speed = rand(0.25, 0.7); }
      }
    }

    function start() { if (!raf && !reducedMotion()) raf = requestAnimationFrame(frame); }
    function stop()  { cancelAnimationFrame(raf); raf = 0; }

    resize();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    motionQuery.addEventListener?.("change", () => { stop(); resize(); start(); });
    start();

    return {
      intense(on) {
        intense = on;
        canvas.classList.toggle("is-intense", on);
      },
      isIntense: () => intense,
    };
  })();

  /* 4. NAVIGATION ========================================================= */
  (() => {
    const toggle = $("#nav-toggle");
    const menu = $("#nav-menu");
    const close = () => { menu.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); };

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
      if (open) $("a", menu)?.focus();
    });
    $$("a", menu).forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) { close(); toggle.focus(); }
    });

    // Aktiver Link beim Scrollen
    const links = $$("[data-nav]");
    const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    const setActive = (id) => links.forEach((a) => {
      if (byId.get(id) === a) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["top", ...byId.keys()].forEach((id) => { const s = document.getElementById(id); s && io.observe(s); });

    // CRT-Overlay an/aus (Einstellung wird lokal gemerkt)
    const crtBtn = $("#crt-toggle");
    const applyCrt = (on) => {
      root.classList.toggle("crt-off", !on);
      crtBtn.setAttribute("aria-pressed", String(on));
    };
    applyCrt(store.get("crt") !== "off");
    crtBtn.addEventListener("click", () => {
      const on = crtBtn.getAttribute("aria-pressed") !== "true";
      applyCrt(on);
      store.set("crt", on ? "on" : "off");
    });
    window.__setCrt = (on) => { applyCrt(on); store.set("crt", on ? "on" : "off"); };
  })();

  /* 5. HERO-TYPEWRITER ==================================================== */
  const ROLES = [
    "Vibecoder", "Web-App-Schmied", "Ideengeber", "Prompt-Flüsterer",
    "Windows-App-Bastler", "KI-Dompteur", "Chef-Ausdenker",
  ];

  async function typeInto(el, text, speed = 70) {
    for (let i = 1; i <= text.length; i++) {
      el.textContent = text.slice(0, i);
      await sleep(speed + rand(-20, 30));
    }
  }
  async function eraseFrom(el, speed = 35) {
    for (let i = el.textContent.length; i >= 0; i--) {
      el.textContent = el.textContent.slice(0, i);
      await sleep(speed);
    }
  }

  async function runHero() {
    const nameEl = $("#hero-name");
    const roleEl = $("#hero-role");
    if (!nameEl || !roleEl) return;
    if (reducedMotion()) return; // statischer Text bleibt stehen

    nameEl.textContent = "";
    roleEl.textContent = "";
    await sleep(200);
    await typeInto(nameEl, "Anton", 120);
    await sleep(350);

    let i = 0;
    for (;;) {
      await typeInto(roleEl, ROLES[i], 65);
      await sleep(1700);
      await eraseFrom(roleEl, 30);
      await sleep(250);
      i = (i + 1) % ROLES.length;
      if (document.hidden) await new Promise((r) => document.addEventListener("visibilitychange", r, { once: true }));
    }
  }

  /* 6. CODE-FENSTER + MINI-HIGHLIGHTER ==================================== */
  // Jede Sprache: ein kombiniertes RegExp + passende CSS-Klasse pro Gruppe.
  const LANGS = {
    json: {
      re: /("(?:[^"\\\n]|\\.)*"(?=\s*:))|("(?:[^"\\\n]|\\.)*"?)|(-?\b\d+(?:\.\d+)?\b)|(\btrue\b|\bfalse\b|\bnull\b)|([{}[\],:])/g,
      cls: ["key", "str", "num", "kw", "punc"],
    },
    js: {
      re: /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?|`[^`]*`?)|\b(const|let|var|function|return|if|else|await|async|new|for|of|while|import|export|from|class|this|true|false|null|try|catch)\b|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*(?=\s*\())/g,
      cls: ["com", "str", "kw", "num", "fn"],
    },
    html: {
      re: /(<!--[\s\S]*?(?:-->|$))|(<\/?[A-Za-z!][\w-]*|\/?>)|("[^"\n]*"?)|([A-Za-z-]+(?==))/g,
      cls: ["com", "tag", "str", "attr"],
    },
    sql: {
      re: /(--[^\n]*)|('[^'\n]*'?)|\b(create|table|select|from|where|insert|into|values|and|or|not|null|primary|key|references|default|in|between|on|order|by|limit|uuid|timestamptz|text|int)\b|(\b\d+\b)|([A-Za-z_]\w*(?=\s*\())/gi,
      cls: ["com", "str", "kw", "num", "fn"],
    },
    sh: {
      re: /(^\$[^\n]*)|(^✔[^\n]*)|(^●[^\n]*)|(^>[^\n]*)/gm,
      cls: ["cmd", "ok", "ai", "kw"],
    },
  };

  function highlight(text, lang) {
    const L = LANGS[lang];
    if (!L) return escapeHTML(text);
    L.re.lastIndex = 0;
    let out = "", last = 0, m;
    while ((m = L.re.exec(text))) {
      if (m[0] === "") { L.re.lastIndex++; continue; }
      let g = 1; while (m[g] === undefined) g++;
      out += escapeHTML(text.slice(last, m.index));
      out += `<span class="tk-${L.cls[g - 1]}">${escapeHTML(m[0])}</span>`;
      last = L.re.lastIndex;
    }
    return out + escapeHTML(text.slice(last));
  }

  function setupCodeWindows() {
    const wins = $$(".codewin[data-lang]");
    wins.forEach((win) => {
      const code = $("code", win);
      const lang = win.dataset.lang;
      const full = code.textContent; // Quelltext steht im HTML (auch ohne JS sichtbar)
      const loop = win.hasAttribute("data-loop");
      const body = $(".codewin__body", win);

      // Höhe vorab fixieren, damit beim Tippen nichts springt
      code.innerHTML = highlight(full, lang);
      if (reducedMotion()) return; // alles sofort fertig anzeigen
      body.style.minHeight = body.offsetHeight + "px";
      code.innerHTML = "";

      let running = false, visible = false;

      async function type() {
        running = true;
        win.classList.add("is-typing");
        do {
          let i = 0;
          while (i < full.length) {
            if (!visible) { await sleep(300); continue; } // pausieren, wenn außer Sicht
            const step = full[i] === "\n" ? 1 : Math.random() > 0.85 ? 3 : 2;
            i = Math.min(full.length, i + step);
            code.innerHTML = highlight(full.slice(0, i), lang);
            await sleep(full[i - 1] === "\n" ? rand(70, 160) : rand(14, 38));
          }
          if (loop) {
            await sleep(4500);
            code.innerHTML = "";
            await sleep(600);
          }
        } while (loop);
        win.classList.remove("is-typing");
      }

      const io = new IntersectionObserver(([en]) => {
        visible = en.isIntersecting;
        if (visible && !running) type();
      }, { threshold: 0.25 });
      io.observe(win);
    });
  }

  /* 7. SCROLL-REVEALS ===================================================== */
  function setupReveals() {
    const els = $$(".reveal");
    if (reducedMotion() || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-visible");
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  }

  /* 8. KARTEN-TILT & GLOW ================================================= */
  function setupTilt() {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;
    $$(".card").forEach((card) => {
      const canTilt = card.classList.contains("tilt");
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", `${px * 100}%`);
        card.style.setProperty("--my", `${py * 100}%`);
        if (!canTilt || reducedMotion()) return;
        // Große Karten kippen weniger
        const max = r.width > 600 ? 2.5 : 6;
        card.style.setProperty("--ry", `${(px - 0.5) * max}deg`);
        card.style.setProperty("--rx", `${(0.5 - py) * max}deg`);
        card.classList.add("is-tilting");
      });
      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-tilting");
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* 9. LABOR-LADEBALKEN =================================================== */
  function setupLab() {
    const fill = $("#lab-fill"), pct = $("#lab-pct"), status = $("#lab-status");
    if (!fill) return;
    const MSG = [
      "lade nächste Idee …", "frage Claude …", "Claude fragt zurück …",
      "noch eine Idee gehabt …", "baue um …", "fast fertig™ …",
      "nur noch ein kleines Feature …", "Vibe wird kalibriert …",
    ];
    if (reducedMotion()) {
      fill.style.width = "99%"; pct.textContent = "99%"; status.textContent = "fast fertig™ …";
      return;
    }
    let p = 0, m = 0, visible = false;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(fill);

    (async function tick() {
      for (;;) {
        await sleep(rand(350, 900));
        if (!visible) continue;
        if (p >= 99) {
          // Natürlich wird es nie fertig: neue Idee, alles von vorn.
          status.textContent = "Neue Idee! Starte neu …";
          await sleep(1600);
          p = 0; fill.style.width = "0%"; pct.textContent = "0%";
          await sleep(500);
          continue;
        }
        p = Math.min(99, p + (p > 85 ? rand(0.3, 1.5) : rand(3, 11)));
        fill.style.width = p.toFixed(1) + "%";
        pct.textContent = Math.floor(p) + "%";
        if (Math.random() > 0.55) status.textContent = MSG[m++ % MSG.length];
      }
    })();
  }

  /* 10. MINI-TERMINAL ===================================================== */
  function setupTerminal() {
    const form = $("#term-form"), input = $("#term-input"), out = $("#term-out");
    if (!form) return;
    const history = [];
    let hIdx = 0;

    const print = (html, cls = "") => {
      const p = document.createElement("p");
      if (cls) p.className = cls;
      p.innerHTML = html;
      out.appendChild(p);
      out.scrollTop = out.scrollHeight;
    };
    const link = (href, text) =>
      `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });

    const COMMANDS = {
      help: () => [
        "Verfügbare Befehle:",
        "  <span class='accent'>about</span>      wer ist dieser Anton?",
        "  <span class='accent'>projekte</span>   was hat er gebaut?",
        "  <span class='accent'>stack</span>      womit?",
        "  <span class='accent'>discord</span>    wie erreiche ich ihn?",
        "  <span class='accent'>claude</span>     der eigentliche Entwickler",
        "  <span class='accent'>matrix</span>     Code-Regen aufdrehen",
        "  <span class='accent'>crt</span>        Scanlines an/aus",
        "  <span class='accent'>sudo</span>       lieber nicht",
        "  <span class='accent'>clear</span>      aufräumen",
        "Versteckt gibt's noch mehr. Probier rum.",
      ].join("\n"),
      about: () => "Anton. Vibecoder. Hat die Ideen, die KI schreibt den Code.\nCode selbst geschrieben: 0 Zeilen. Stolz drauf: ja.",
      whoami: () => "gast. Aber schön, dass du da bist.\n(Falls du Anton meinst: tipp <span class='accent'>about</span>.)",
      projekte: () => [
        "drwxr-xr-x  <span class='accent'>moki/</span>           Spiele ohne Werbe-Terror  ★",
        "drwxr-xr-x  <span class='accent'>flexspacepro/</span>   Raumbuchung mit Supabase",
        "drwx------  <span class='accent'>.geheim/</span>        Zugriff verweigert. Nice try.",
      ].join("\n"),
      ls: () => COMMANDS.projekte(),
      stack: () => "1. Claude Code  – macht die Arbeit\n2. HTML5        – läuft überall\n3. Supabase     – Daten ohne Server-Kuscheln",
      discord: () => {
        setTimeout(() => scrollTo("discord"), 400);
        return `Discord-ID: 1496498092004868279\nProfil: ${link("https://discord.com/users/1496498092004868279", "discord.com/users/1496498092004868279")}\nIch scroll dich mal hin …`;
      },
      claude: () => "Claude ist gerade beschäftigt. Es ist nämlich diese Website.",
      sudo: (args) => {
        if (/rm\s+-rf/.test(args)) return "<span class='err'>Nein.</span> Einfach nein. Hier wird nichts gelöscht außer schlechte Ideen.";
        return "<span class='err'>[sudo] Passwort für gast:</span> ********\nNetter Versuch. Dieser Vorfall wird gemeldet.\n(An niemanden. Hier gibt's kein Backend.)";
      },
      rm: () => "<span class='err'>rm:</span> Zugriff verweigert. Die Ideen bleiben.",
      matrix: () => {
        const on = !rain.isIntense();
        rain.intense(on);
        return on ? "<span class='ok'>Folge dem weißen Kaninchen.</span> (Nochmal <span class='accent'>matrix</span> zum Beruhigen.)" : "Code-Regen wieder auf Nieselregen gestellt.";
      },
      crt: () => {
        const on = root.classList.contains("crt-off");
        window.__setCrt(on);
        return on ? "CRT an. Fühlt sich gleich 30 Jahre älter an." : "CRT aus. Willkommen in der Gegenwart.";
      },
      vibe: () => "Vibe-Check läuft …\n<span class='ok'>✔ bestanden.</span> Du darfst bleiben.",
      kaffee: () => "☕ Fehler 418: Ich bin eine Teekanne.",
      coffee: () => COMMANDS.kaffee(),
      hack: () => "Hacke Mainframe …\n[██████████] 100%\n<span class='ok'>Zugriff erhalten</span> auf: nichts. Ist eine statische Seite.",
      ping: () => "PING anton … 64 bytes: Idee empfangen, zeit=0.42ms",
      date: () => new Date().toLocaleString("de-DE"),
      echo: (args) => escapeHTML(args || ""),
      history: () => history.map((h, i) => `  ${i + 1}  ${escapeHTML(h)}`).join("\n") || "Noch leer.",
      hallo: () => "Hallo zurück! 👋",
      hi: () => COMMANDS.hallo(),
      exit: () => "Hier kommt man nicht raus. Scherz: einfach weiterscrollen.",
      konami: () => "Den musst du schon selbst eingeben. Mit den Pfeiltasten. Außerhalb vom Terminal.",
      cat: (args) => args.trim() === "anton.json"
        ? '{ "rolle": "Vibecoder", "code_selbst_geschrieben": 0, "stolz_drauf": true }'
        : "cat: Datei nicht gefunden. Versuch's mal mit <span class='accent'>cat anton.json</span>",
      clear: () => { out.innerHTML = ""; return null; },
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      input.value = "";
      if (!raw) return;
      history.push(raw); hIdx = history.length;
      print(`<span class="accent">gast@anton</span>:~$ ${escapeHTML(raw)}`, "cmd");

      const [cmd, ...rest] = raw.split(/\s+/);
      const fn = COMMANDS[cmd.toLowerCase()];
      if (!fn) {
        print(`<span class="err">befehl nicht gefunden:</span> ${escapeHTML(cmd)}. Tipp: <span class="accent">help</span>`);
        return;
      }
      const res = fn(rest.join(" "));
      if (res) print(res);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" && history.length) {
        e.preventDefault(); hIdx = Math.max(0, hIdx - 1); input.value = history[hIdx];
      } else if (e.key === "ArrowDown" && history.length) {
        e.preventDefault(); hIdx = Math.min(history.length, hIdx + 1); input.value = history[hIdx] || "";
      } else if (e.key === "Tab" && input.value) {
        const match = Object.keys(COMMANDS).find((c) => c.startsWith(input.value.toLowerCase()));
        if (match) { e.preventDefault(); input.value = match; }
      }
    });

    // Klick ins Terminal fokussiert die Eingabe (Text markieren bleibt möglich)
    $("#term").addEventListener("click", (e) => {
      if (e.target.closest("a") || window.getSelection().toString()) return;
      input.focus({ preventScroll: true });
    });
  }

  /* 11. DISCORD-KARTE ===================================================== */
  const DISCORD_ID = "1496498092004868279";

  function setupDiscord() {
    $("#dc-copy")?.addEventListener("click", async () => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(DISCORD_ID);
        ok = true;
      } catch {
        // Fallback (z. B. bei file:// oder alten Browsern)
        const ta = document.createElement("textarea");
        ta.value = DISCORD_ID; ta.setAttribute("readonly", "");
        ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand("copy"); } catch { ok = false; }
        ta.remove();
      }
      toast(ok ? `ID kopiert: ${DISCORD_ID} ✔` : `Kopieren ging nicht. Hier zum Abtippen: ${DISCORD_ID}`);
    });

    if (LANYARD_ENABLED) loadLanyard();
  }

  /* ---------------------------------------------------------------------
     OPTIONAL: Live-Status über die Lanyard-API
     ---------------------------------------------------------------------
     Standardmäßig AUS. Die Karte zeigt dann statisch "online".
     Zum Aktivieren:
       1. Dem Lanyard-Discord-Server beitreten (sonst kennt die API dich nicht):
          https://discord.gg/lanyard
       2. LANYARD_ENABLED unten auf true setzen.
     Schlägt der Aufruf fehl (kein Netz, nicht beigetreten, Timeout),
     bleibt einfach der statische Status stehen. Es wird nichts kaputt angezeigt.
     Die Content-Security-Policy in _headers erlaubt api.lanyard.rest bereits.
  --------------------------------------------------------------------- */
  const LANYARD_ENABLED = false;

  async function loadLanyard() {
    const dot = $("#dc-status"), txt = $("#dc-status-text"), act = $("#dc-activity");
    const LABEL = { online: "Online", idle: "Abwesend", dnd: "Bitte nicht stören", offline: "Offline" };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    try {
      const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      if (!json.success || !json.data) throw new Error("no data");
      const status = LABEL[json.data.discord_status] ? json.data.discord_status : "online";
      dot.dataset.status = status;
      dot.title = LABEL[status];
      txt.textContent = `Status: ${LABEL[status]}`;
      const game = (json.data.activities || []).find((a) => a.type !== 4 && a.name);
      if (game && act) act.innerHTML = `<span class="accent">▶</span> ${escapeHTML(game.name)}`;
    } catch {
      /* still und leise beim statischen Fallback bleiben */
    } finally {
      clearTimeout(timer);
    }
  }

  /* 12. EASTER EGGS ======================================================= */
  function setupEasterEggs() {
    // Konami-Code: ↑ ↑ ↓ ↓ ← → ← → B A
    const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let pos = 0;
    document.addEventListener("keydown", (e) => {
      if (e.target.matches?.("input, textarea")) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = key === KONAMI[pos] ? pos + 1 : key === KONAMI[0] ? 1 : 0;
      if (pos === KONAMI.length) {
        pos = 0;
        toast("Cheat aktiviert: Unendlich Ideen. (Hatte ich vorher schon.)", 4000);
        if (reducedMotion()) return;
        root.classList.add("konami");
        rain.intense(true);
        $(".logo")?.classList.add("is-glitch");
        setTimeout(() => {
          root.classList.remove("konami");
          rain.intense(false);
          $(".logo")?.classList.remove("is-glitch");
        }, 8000);
      }
    });

    // Logo 7× schnell klicken
    let clicks = 0, clickTimer;
    $("#brand")?.addEventListener("click", () => {
      clicks++;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => (clicks = 0), 1500);
      if (clicks === 7) {
        clicks = 0;
        toast("7× aufs Logo geklickt. Es fühlt sich jetzt sehr geschätzt.");
        const logo = $(".logo");
        logo.classList.remove("is-glitch"); void logo.getBoundingClientRect(); logo.classList.add("is-glitch");
      }
    });

    // Gruß an alle, die die Konsole öffnen
    console.log(
      "%c<A/> Hi, Neugierige:r! %c\nDiesen Code hat die KI geschrieben. Anton hatte nur die Idee.\nTipp: Probier im Mini-Terminal mal 'sudo' oder den Konami-Code.",
      "color:#3dff9a;font:700 16px monospace;", "color:#9eaba5;font:12px monospace;"
    );
  }

  /* START ================================================================= */
  setupReveals();
  setupCodeWindows();
  setupTilt();
  setupLab();
  setupTerminal();
  setupDiscord();
  setupEasterEggs();
  runBoot().then(runHero);
})();
