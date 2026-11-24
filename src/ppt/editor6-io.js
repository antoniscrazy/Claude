/* =====================================================================
   6. Speichern, Import, Export (Projekt, HTML-Präsentation, PNG, Druck), Präsentation, Dialoge, Start
   ===================================================================== */
const AUTOSAVE_KEY = 'webOffice.ppt.autosave.v1';
let autoT = 0, autoMsg = 'Noch nicht gesichert', fileMsg = '';
function collectSrc(objs, set) { objs.forEach(o => { if (o.src) set.add(o.src); if (o.children) collectSrc(o.children, set); }); }
function pruneProject() {
  const used = new Set(); S.proj.slides.forEach(s => collectSrc(s.objects, used)); const assets = {}; used.forEach(k => { if (S.proj.assets[k]) assets[k] = S.proj.assets[k]; });
  return { format: 'WebOffice-Praesentation', version: 1, title: S.name, size: S.proj.size, master: S.proj.master, slides: S.proj.slides, assets };
}
function setSaveStatus() { $('#savestat').textContent = [autoMsg, fileMsg].filter(Boolean).join(' · '); }
function scheduleAutosave() {
  autoMsg = 'Änderungen noch nicht gesichert …'; setSaveStatus(); clearTimeout(autoT);
  autoT = setTimeout(() => { // wirklicher Speichervorgang; Status erst nach Ergebnis
    try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(pruneProject())); autoMsg = 'Automatisch gesichert ' + new Date().toLocaleTimeString('de-DE'); }
    catch (e) { autoMsg = 'Automatische Sicherung nicht möglich (' + (e && e.name === 'QuotaExceededError' ? 'Speicher voll' : 'Browser blockiert Speicher') + ') – bitte Projekt herunterladen'; }
    setSaveStatus();
  }, 700);
}
function download(blob, name) { const a = el('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
const safeName = () => (S.name || 'Praesentation').replace(/[äÄöÖüÜß]/g, c => ({ 'ä': 'ae', 'Ä': 'Ae', 'ö': 'oe', 'Ö': 'Oe', 'ü': 'ue', 'Ü': 'Ue', 'ß': 'ss' }[c])).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w .-]+/g, '_').trim().slice(0, 80) || 'Praesentation';
function saveProject() {
  if (S.editing) endEdit(); try { download(new Blob([JSON.stringify(pruneProject())], { type: 'application/json' }), safeName() + '.webppt.json'); S.dirty = false; fileMsg = 'Projektdatei heruntergeladen ' + new Date().toLocaleTimeString('de-DE'); setSaveStatus(); toast('Projekt als Datei „' + safeName() + '.webppt.json“ heruntergeladen.'); }
  catch (e) { toast('Speichern fehlgeschlagen: ' + e.message, true); }
}
function adoptProject(p, name) {
  if (S.editing) { S.editing = null; } stopPreview(true); S.proj = p; S.name = name || p.title || 'Präsentation'; $('#docname').value = S.name; S.cur = 0; S.sel = []; S.fx = null; S.view = 'normal'; thumbCache.clear(); histReset(); S._rkey = null; render(); S.dirty = false;
}
function confirmLoad(p, name) { const go = () => { adoptProject(p, name); scheduleAutosave(); }; if (S.dirty) dialog({ title: 'Aktuelles Projekt ersetzen?', body: 'Nicht heruntergeladene Änderungen gehen verloren (der Autosave-Stand wird überschrieben).', buttons: [{ label: 'Abbrechen' }, { label: 'Ersetzen', pri: true, fn: go }] }); else go(); }
function openProjectPicker() {
  const f = $('#fileProj'); f.value = ''; f.onchange = async () => {
    const file = f.files[0]; if (!file) return; let txt;
    try { txt = await file.text(); const raw = JSON.parse(txt), p = validateProject(raw); confirmLoad(p, (p.title || file.name.replace(/\.webppt\.json$|\.json$/i, ''))); }
    catch (e) { const msg = e instanceof SyntaxError ? 'Die Datei ist kein gültiges JSON (beschädigt oder falscher Dateityp).' : e.message; dialog({ title: 'Datei konnte nicht geöffnet werden', body: el('div', null, el('p', null, msg), el('p', { class: 'hint' }, 'Das aktuell geöffnete Projekt wurde nicht verändert.')) }); }
  }; f.click();
}
function newProjectDialog() {
  let tpl = 'aurora', size = '16:9'; const grid = el('div', { class: 'tplgrid' });
  const draw = () => { grid.replaceChildren(...Object.entries(TEMPLATES).map(([id, t]) => { const p = blankProject(id, size); p.slides[0].objects[0].html = '<div>' + t.name + '</div>'; const l = renderSlide(p.slides[0], p, 'show'), w = 180, k = w / p.size.w; l.style.transform = 'scale(' + k + ')'; return el('button', { class: 'tplc' + (tpl === id ? ' on' : ''), onclick: () => { tpl = id; draw(); } }, el('div', { class: 'pvv', style: `width:${w}px;height:${Math.round(p.size.h * k)}px` }, l), el('b', null, t.name), el('div', { class: 'hint' }, t.desc)); })); };
  draw(); const sz = el('select', { onchange: e => { size = e.target.value; draw(); } }, el('option', { value: '16:9' }, '16:9 (Breitbild)'), el('option', { value: '4:3' }, '4:3'));
  dialog({ title: 'Neue Präsentation', wide: true, body: el('div', null, el('div', { class: 'frow' }, el('label', null, 'Folienformat', sz)), grid), buttons: [{ label: 'Abbrechen' }, { label: 'Beispielpräsentation', fn: () => confirmLoad(sampleProject(), 'Beispielpräsentation') }, { label: 'Leere Präsentation', pri: true, fn: () => { const p = blankProject(tpl, size); confirmLoad(p, 'Neue Präsentation'); } }] });
}

/* ---------- Präsentation ---------- */
function startShow(i, presenter) {
  if (S.editing) endEdit(); stopPreview(true); const host = $('#show'); host.style.display = 'block';
  if (S.proj.slides[i] && S.proj.slides[i].hidden && i === 0) { const f = S.proj.slides.findIndex(s => !s.hidden); if (f >= 0) i = f; }
  S.player = new Player(host, S.proj, { presenter: !!presenter, onExit: idx => { host.style.display = 'none'; S.player = null; S.cur = clamp(idx, 0, S.proj.slides.length - 1); S.sel = []; S.focusArea = 'stage'; render(); const sc = $('#scaler'); sc.tabIndex = -1; const f = () => sc.focus({ preventScroll: true }); f(); setTimeout(f, 0); setTimeout(f, 150); } });
  S.player.start(i);
  if (host.requestFullscreen) host.requestFullscreen().catch(() => S.player && S.player.say('Vollbild nicht freigegeben – Fenstermodus aktiv')); else S.player.say('Vollbild nicht verfügbar – Fenstermodus aktiv');
}

/* ---------- Standalone-HTML ---------- */
function exportHtml() {
  if (S.editing) endEdit(); const proj = pruneProject(), json = JSON.stringify(proj).replace(/</g, '\\u003c').replace(new RegExp(String.fromCharCode(0x2028),'g'), '\\u2028').replace(new RegExp(String.fromCharCode(0x2029),'g'), '\\u2029');
  const rt = $('#rt-js').textContent, css = $('#rt-css').textContent, title = PP.escHtml(S.name);
  const boot = `(function(){var proj=PP.validateProject(JSON.parse(document.getElementById('pdata').textContent));var host=document.getElementById('host'),st=document.getElementById('start'),cur=null;
function go(i,pres){st.style.display='none';host.style.display='block';cur=new PP.Player(host,proj,{presenter:pres,onExit:function(){host.style.display='none';st.style.display='flex';}});window.__player=cur;cur.start(i||0);
 if(host.requestFullscreen){host.requestFullscreen().catch(function(){cur.say('Fenstermodus aktiv (Vollbild nicht freigegeben)');});}}
document.getElementById('go').onclick=function(){go(0,false)};document.getElementById('gop').onclick=function(){go(0,true)};
document.getElementById('cnt').textContent=proj.slides.length+' Folien';})();`;
  const html = `<!DOCTYPE html>\n<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>${css}\nhtml,body{margin:0;height:100%;background:#15171c;font-family:"Segoe UI",Arial,sans-serif;color:#fff}#start{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:20px}#start h1{font-size:34px;margin:0}#start button{font-size:17px;padding:12px 26px;border-radius:8px;border:0;background:#e2552b;color:#fff;cursor:pointer}#start button.s{background:#2c2f36;border:1px solid #444}#start p{color:#9aa3b2;max-width:560px;font-size:14px;line-height:1.5}#host{display:none}</style></head>
<body><div id="start"><h1>${title}</h1><span id="cnt"></span><div><button id="go">Präsentation starten</button> <button id="gop" class="s">Mit Referentenansicht</button></div><p>Weiter: Pfeil rechts, Leertaste oder Klick · Zurück: Pfeil links · Referentenansicht: P · Vollbild: F · Beenden: Esc. Diese Datei läuft vollständig offline.</p></div><div id="host"></div>
<script>${rt}<\/script>\n<script id="pdata" type="application/json">${json}<\/script>\n<script>${boot}<\/script></body></html>`;
  download(new Blob([html], { type: 'text/html' }), safeName() + '.html'); toast('Eigenständige HTML-Präsentation exportiert (offline lauffähig).');
}

/* ---------- PNG ---------- */
async function slideToCanvas(slide, k) {
  const W = S.proj.size.w, H = S.proj.size.h, layer = renderSlide(slide, S.proj, 'show'); new AnimEngine(slide, layer, S.proj).finish();
  const wrap = document.createElement('div'); wrap.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml'); wrap.style.cssText = `position:relative;width:${W}px;height:${H}px;overflow:hidden`; layer.style.transform = ''; wrap.append(layer);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * k}" height="${H * k}" viewBox="0 0 ${W} ${H}"><foreignObject x="0" y="0" width="${W}" height="${H}"><style>${$('#rt-css').textContent}</style>${new XMLSerializer().serializeToString(wrap)}</foreignObject></svg>`;
  const img = new Image(); await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('Folie konnte nicht gerendert werden.')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  const c = document.createElement('canvas'); c.width = W * k; c.height = H * k; c.getContext('2d').drawImage(img, 0, 0); return c;
}
async function exportPng() {
  if (S.editing) endEdit();
  try { const c = await slideToCanvas(curSlide(), 2), blob = await new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('Das Browser-Canvas ist gesperrt (Sicherheitsbeschränkung).')), 'image/png')); download(blob, safeName() + '-folie' + (S.cur + 1) + '.png'); toast('PNG der aktuellen Folie exportiert.'); }
  catch (e) { toast('PNG-Export fehlgeschlagen: ' + e.message, true); }
}

/* ---------- Druckansicht: eine Folie pro Seite (Endzustand der Animationen) ---------- */
function printDeck() {
  if (S.editing) endEdit(); const W = S.proj.size.w, H = S.proj.size.h, area = $('#printArea'); area.replaceChildren();
  let st = $('#pagestyle'); if (!st) { st = el('style', { id: 'pagestyle' }); document.head.append(st); } st.textContent = `@page{size:${W}px ${H}px;margin:0}`;
  S.proj.slides.filter(s => !s.hidden).forEach(s => { const l = renderSlide(s, S.proj, 'show'); new AnimEngine(s, l, S.proj).finish(); l.style.position = 'relative'; area.append(el('div', { class: 'pp-print-page', style: `width:${W}px;height:${H}px` }, l)); });
  const done = () => { area.replaceChildren(); window.removeEventListener('afterprint', done); }; window.addEventListener('afterprint', done); setTimeout(() => window.print(), 60);
}

/* ---------- Hilfe ---------- */
function helpDialog() {
  const rows = [['Natives Projekt (.webppt.json)', 'Vollständig: Folien, Objekt-IDs, Gruppen, Bilder, Notizen, Übergänge, Animationen, Master, Morph-Kopplungen.'], ['HTML-Präsentation (.html)', 'Vollständig, eine Datei, offline: gleiche Wiedergabe-Engine (Klickgruppen, Übergänge, Referentenansicht).'], ['PNG / Druck', 'Aktuelle Folie bzw. alle sichtbaren Folien im Endzustand der Animationen.'],
    ['PowerPoint (.pptx)', 'Echte Folien mit editierbaren Textfeldern, Formen, Linien, Bildern, Tabellen, Gruppen, Notizen, Hintergründen. Diagramme als Bild. Übergänge: Überblenden, Schieben, Wischen, Teilen, Abdunkeln (Überblenden über Schwarz), Zoom; Morph wird als Überblenden geschrieben. Animationen: Eingang/Ausgang/Hervorhebung/Bewegungspfad als Standardeffekte mit Start/Dauer/Verzögerung. Folienmaster: Farben/Schriften als Theme, Dekor als Formen auf jeder Folie. Nicht in PowerPoint getestet (nur XML/ZIP-Struktur und Python-Bibliothek).'], ['.pptx-Import', 'Nicht implementiert.']];
  const t = el('table', null, el('tr', null, el('th', null, 'Ausgabe'), el('th', null, 'Umfang')), ...rows.map(r => el('tr', null, el('td', null, r[0]), el('td', null, r[1]))));
  dialog({ title: 'Funktionsumfang und Regeln', wide: true, body: el('div', null, t, el('div', { class: 'sech' }, 'Animations-Zeitplan'), el('p', { class: 'hint' }, 'Beim Klicken beginnt eine neue Klickgruppe (Basis 0). Mit vorheriger: Basis ist die Basis des Vorgängers (Beginn seiner Verzögerungsphase). Nach vorheriger: Basis ist das Ende des Vorgängers (inkl. dessen Verzögerung). Beginn = Basis + Verzögerung; Ende = Beginn + Dauer. Ein erster Effekt ohne Klick startet automatisch mit dem Folienbeginn.'),
      el('div', { class: 'sech' }, 'Navigation in der Präsentation'), el('p', { class: 'hint' }, 'Vorwärts spielt zuerst ausstehende Klickgruppen, dann folgt der Folienwechsel. Rückwärts nimmt zunächst die letzte Klickgruppe zurück; ohne gespielte Gruppe geht es zur vorherigen Folie im ENDZUSTAND (alle Effekte abgeschlossen, ohne Übergang). Ein Sprung per Zahl+Enter, Home oder End zeigt die Zielfolie im ANFANGSZUSTAND. Ausgeblendete Folien werden übersprungen. Verborgene Objekte erscheinen nie in Vorschau, Präsentation, Druck oder Export.')) });
}
function shortcutsDialog() {
  const k = [['Strg+S', 'Projekt herunterladen'], ['Strg+Z / Strg+Y', 'Rückgängig / Wiederholen'], ['Entf', 'Objekt löschen (Folienleiste: Folie löschen; beim Schreiben: Text)'], ['Strg+D / Strg+G / Strg+Umschalt+G', 'Duplizieren / Gruppieren / Gruppierung aufheben'], ['Pfeiltasten (Umschalt = 10 px)', 'Objekt verschieben'], ['Enter / F2 / Doppelklick', 'Text bearbeiten'], ['Esc', 'Dialog, Vorschau oder Textbearbeitung beenden; sonst Auswahl aufheben'], ['F5 / Umschalt+F5', 'Präsentation von Anfang / ab aktueller Folie'], ['Im Vortrag: → Leertaste Enter Klick', 'Weiter'], ['Im Vortrag: ← Rücktaste', 'Zurück'], ['Im Vortrag: P / F / Esc / Zahl+Enter', 'Referentenansicht / Vollbild / Beenden / Foliensprung'], ['Umschalt beim Skalieren', 'Seitenverhältnis umschalten'], ['Alt beim Ziehen', 'Einrasten aus']];
  dialog({ title: 'Tastenkürzel', body: el('table', null, ...k.map(r => el('tr', null, el('td', null, r[0]), el('td', null, r[1])))) });
}

/* ---------- Start ---------- */
function init() {
  $('#qSave').innerHTML = icon('save', 20); $('#qUndo').innerHTML = icon('undo', 20); $('#qRedo').innerHTML = icon('redo', 20);
  $('#qSave').onclick = saveProject; $('#qUndo').onclick = () => { if (S.editing) endEdit(); undo(); }; $('#qRedo').onclick = redo;
  $('#docname').addEventListener('change', e => { S.name = e.target.value.trim() || 'Präsentation'; S.proj.title = S.name; scheduleAutosave(); });
  bindStage(); let loaded = false;
  try { const raw = localStorage.getItem(AUTOSAVE_KEY); if (raw) { const p = validateProject(JSON.parse(raw)); adoptProject(p, p.title); autoMsg = 'Arbeitsstand aus Autosave wiederhergestellt'; loaded = true; } } catch (e) { console.warn('Autosave nicht ladbar:', e.message); }
  if (!loaded) adoptProject(sampleProject(), 'Beispielpräsentation');
  setSaveStatus(); window.WebPPT = { S, HIST, commit, undo, redo, PP, adoptProject, sampleProject, blankProject, validateProject, buildPptx: () => buildPptx(), pruneProject, startShow };
}
window.addEventListener('DOMContentLoaded', init);
