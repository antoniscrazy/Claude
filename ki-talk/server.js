// KI-Talk: kleiner Server ohne Abhängigkeiten. Hält die API-Keys serverseitig.
const http = require("http");
const fs = require("fs");
const path = require("path");

// .env laden (KEY=VALUE pro Zeile)
try {
  for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const { GROQ_API_KEY, CARTESIA_API_KEY } = process.env;
const PORT = process.env.PORT || 3000;
const GROQ_MODEL = "openai/gpt-oss-20b";
const TTS_MODEL = "sonic-3";
const CARTESIA_VERSION = "2025-04-16";
if (!GROQ_API_KEY || !CARTESIA_API_KEY) {
  console.error("Fehlt: GROQ_API_KEY und/oder CARTESIA_API_KEY (siehe .env.example)");
  process.exit(1);
}

const LANGS = {
  de: ["Deutsch", "Deutsche Jugendsprache: z.B. 'Digga', 'safe', 'cringe', 'lowkey', 'wild', 'Bruder', 'ehrlich jetzt', 'mega', 'no cap', 'läuft bei dir'."],
  en: ["English", "Gen-Z teen slang: e.g. 'bro', 'no cap', 'lowkey', 'fr fr', 'bet', 'that's wild', 'sus', 'vibes'."],
  es: ["Español", "Jerga juvenil: 'tío', 'o sea', 'flipas', 'mola', 'guay', 'en plan', 'bro'."],
  fr: ["Français", "Argot des jeunes: 'wesh', 'trop bien', 'chelou', 'frérot', 'grave', 'ouf', 'en mode'."],
  it: ["Italiano", "Slang giovanile: 'bro', 'zio', 'assurdo', 'top', 'cringe', 'fra', 'letteralmente'."],
  pt: ["Português", "Gíria jovem: 'mano', 'tipo assim', 'show', 'da hora', 'cara', 'massa'."],
  nl: ["Nederlands", "Jongerentaal: 'gozer', 'echt waar', 'chill', 'lekker man', 'tof', 'bro'."],
  pl: ["Polski", "Młodzieżowy slang: 'stary', 'no cringe', 'ogarniasz', 'lol', 'spoko', 'wporzo'."],
  tr: ["Türkçe", "Gençlerin argosu: 'kanka', 'abi', 'valla', 'çok iyi', 'tam bir efsane', 'off'."],
  ru: ["Русский", "Молодёжный сленг: 'бро', 'кринж', 'жиза', 'имба', 'чё как', 'норм', 'вайб'."],
  ja: ["日本語", "若者言葉: 'マジで', 'やばい', 'ウケる', 'それな', 'エモい', 'ガチで'."],
  ko: ["한국어", "10대 은어/반말: '대박', '헐', 'ㄹㅇ', '찐', '갓생', '완전'."],
  zh: ["中文", "年轻人网络用语: '绝了', '真的假的', '笑死', 'yyds', '我靠', '太香了'."],
  hi: ["हिन्दी", "युवाओं की भाषा: 'यार', 'भाई', 'सही में', 'मस्त', 'एकदम झक्कास', 'चिल कर'."],
  sv: ["Svenska", "Ungdomsslang: 'asså', 'nice', 'grymt', 'tjena', 'sjukt', 'fett'."],
};

function readBody(req) {
  return new Promise((res, rej) => {
    let d = "";
    req.on("data", (c) => { d += c; if (d.length > 1e6) req.destroy(); });
    req.on("end", () => { try { res(JSON.parse(d || "{}")); } catch (e) { rej(e); } });
  });
}
const json = (res, code, obj) => {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
};

async function listVoices() {
  const out = [];
  let url = "https://api.cartesia.ai/voices?limit=100";
  for (let i = 0; i < 10 && url; i++) {
    const r = await fetch(url, { headers: { "X-API-Key": CARTESIA_API_KEY, "Cartesia-Version": CARTESIA_VERSION } });
    if (!r.ok) throw new Error("Cartesia voices: " + r.status);
    const j = await r.json();
    out.push(...j.data);
    url = j.has_more && j.next_page ? "https://api.cartesia.ai/voices?limit=100&starting_after=" + j.next_page : null;
  }
  return out.map((v) => ({ id: v.id, name: v.name.trim(), language: v.language, own: !!v.is_owner }));
}

async function chat({ lang, speaker, other, topic, history }) {
  const [langName, slang] = LANGS[lang] || LANGS.de;
  const system =
    `Du bist ${speaker}, ein Teenager/junger Erwachsener, und unterhältst dich per Sprachnachricht mit deinem besten Freund/deiner besten Freundin ${other}. ` +
    `Ihr seid enge Freunde und redet ganz locker miteinander.\n` +
    `SPRACHE: Sprich ausschließlich ${langName}. ${slang}\n` +
    `REGELN: Maximal 1-2 kurze Sätze (unter 30 Wörter). Natürlich wie gesprochen, keine Emojis, keine Sternchen, keine Regieanweisungen, kein Name-Präfix, ` +
    `keine Aufzählungen. Reagiere auf das, was ${other} gerade gesagt hat, bring eigene Meinungen, Witze, Stories oder Gegenfragen ein. ` +
    `Wechsle auch mal das Thema, wenn es natürlich passt. Nicht ständig wiederholen oder nur zustimmen.\n` +
    `Startthema: ${topic || "frei, was euch gerade einfällt"}.`;
  const messages = [{ role: "system", content: system }];
  if (!history.length) {
    messages.push({ role: "user", content: `(Du fängst das Gespräch an. Sag ${other} was.)` });
  } else {
    for (const h of history.slice(-16)) {
      messages.push({ role: h.speaker === speaker ? "assistant" : "user", content: h.text });
    }
  }
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + GROQ_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 1, max_tokens: 600, reasoning_effort: "low" }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error("Groq: " + (j.error?.message || r.status));
  let text = (j.choices?.[0]?.message?.content || "").trim();
  text = text.replace(/^["„“]+|["“”]+$/g, "").replace(new RegExp("^" + speaker + "\\s*:\\s*", "i"), "").replace(/\*+/g, "");
  if (!text) throw new Error("Leere Antwort von Groq");
  return text;
}

async function tts({ text, voiceId, lang }) {
  const r = await fetch("https://api.cartesia.ai/tts/bytes", {
    method: "POST",
    headers: { "X-API-Key": CARTESIA_API_KEY, "Cartesia-Version": CARTESIA_VERSION, "Content-Type": "application/json" },
    body: JSON.stringify({
      model_id: TTS_MODEL,
      transcript: text,
      voice: { mode: "id", id: voiceId },
      language: lang,
      output_format: { container: "wav", encoding: "pcm_s16le", sample_rate: 24000 },
    }),
  });
  if (!r.ok) throw new Error("Cartesia TTS " + r.status + ": " + (await r.text()).slice(0, 200));
  return Buffer.from(await r.arrayBuffer());
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    if (req.method === "GET" && url.pathname === "/api/config") {
      const voices = await listVoices();
      return json(res, 200, { voices, langs: Object.fromEntries(Object.entries(LANGS).map(([k, v]) => [k, v[0]])) });
    }
    if (req.method === "POST" && url.pathname === "/api/turn") {
      const b = await readBody(req);
      const text = await chat(b);
      const audio = await tts({ text, voiceId: b.voiceId, lang: b.lang });
      return json(res, 200, { text, audio: audio.toString("base64") });
    }
    if (req.method === "GET") {
      const f = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      const p = path.join(__dirname, "public", path.normalize(f).replace(/^(\.\.[/\\])+/, ""));
      if (p.startsWith(path.join(__dirname, "public")) && fs.existsSync(p) && fs.statSync(p).isFile()) {
        res.writeHead(200, { "Content-Type": p.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" });
        return res.end(fs.readFileSync(p));
      }
    }
    json(res, 404, { error: "not found" });
  } catch (e) {
    console.error(e.message);
    json(res, 500, { error: e.message });
  }
});
server.listen(PORT, () => console.log("KI-Talk läuft auf http://localhost:" + PORT));
