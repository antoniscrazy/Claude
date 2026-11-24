/* Gemeinsame Befehlssuche in der Titelleiste („Was möchten Sie tun?“): sammelt Befehle aller Reiter,
   springt zum Reiter und hebt die Schaltfläche hervor. api = { tabs(), build(id), go(id) } */
function initTellMe(api) {
  const box = document.getElementById('tsearch'), inp = document.getElementById('tsin'), res = document.getElementById('tsres');
  if (!box || !inp) return;
  document.getElementById('tsic').innerHTML = '<svg class="ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/></svg>';
  let index = null, shown = [], sel = 0;
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function harvest() {
    if (index) return index; index = [];
    for (const [id, tl] of api.tabs()) {
      let nodes = []; try { nodes = api.build(id); } catch (e) { continue; }
      const holder = document.createElement('div'); holder.append(...nodes);
      holder.querySelectorAll('.grp').forEach(g => {
        const gn = (g.querySelector('.gn') || {}).textContent || '';
        g.querySelectorAll('.rb-btn, .rb-field').forEach(b => {
          const t = (b.textContent || '').trim() || b.title || b.getAttribute('aria-label') || '';
          if (t && !index.some(x => x.tab === id && x.label === t)) index.push({ tab: id, tabLabel: tl, label: t, group: gn, key: norm(t + ' ' + gn + ' ' + tl) });
        });
      });
    }
    return index;
  }
  function show(q) {
    const words = norm(q).split(/\s+/).filter(Boolean);
    shown = words.length ? harvest().filter(x => words.every(w => x.key.includes(w))).slice(0, 14) : [];
    sel = 0; res.replaceChildren();
    if (!words.length) { res.classList.remove('open'); return; }
    if (!shown.length) { const n = document.createElement('div'); n.className = 'none'; n.textContent = 'Kein Befehl gefunden.'; res.append(n); }
    shown.forEach((x, i) => { const b = document.createElement('button'); b.className = i === 0 ? 'sel' : ''; b.type = 'button'; b.append(x.label); const s = document.createElement('small'); s.textContent = x.tabLabel + ' › ' + x.group; b.append(s); b.onmousedown = e => { e.preventDefault(); pick(x); }; res.append(b); });
    res.classList.add('open');
  }
  function pick(x) {
    api.go(x.tab); inp.value = ''; res.classList.remove('open'); inp.blur();
    setTimeout(() => {
      const b = [...document.querySelectorAll('#ribbon .rb-btn, #ribbon .rb-field')].find(e => ((e.textContent || '').trim() || e.title || e.getAttribute('aria-label')) === x.label);
      if (b) { b.scrollIntoView({ block: 'nearest', inline: 'center' }); b.classList.add('rb-flash'); setTimeout(() => b.classList.remove('rb-flash'), 3000); }
    }, 60);
  }
  inp.addEventListener('input', () => show(inp.value));
  inp.addEventListener('focus', () => { if (inp.value) show(inp.value); });
  inp.addEventListener('blur', () => setTimeout(() => res.classList.remove('open'), 120));
  inp.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!shown.length) return; sel = (sel + (e.key === 'ArrowDown' ? 1 : shown.length - 1)) % shown.length; [...res.querySelectorAll('button')].forEach((b, i) => b.classList.toggle('sel', i === sel)); }
    else if (e.key === 'Enter' && shown[sel]) { e.preventDefault(); pick(shown[sel]); }
    else if (e.key === 'Escape') { inp.value = ''; res.classList.remove('open'); inp.blur(); }
  });
  document.addEventListener('keydown', e => { if (e.altKey && (e.key === 'q' || e.key === 'Q')) { e.preventDefault(); inp.focus(); inp.select(); } });
}

/* Menüband einklappen (Doppelklick auf einen Reiter oder Strg+F1) */
function toggleRibbonMin() { const a = document.getElementById('app'); a.classList.toggle('rbmin'); window.dispatchEvent(new Event('resize')); return a.classList.contains('rbmin'); }
document.addEventListener('dblclick', e => { if (e.target.closest && e.target.closest('#tabs .tab')) toggleRibbonMin(); });
document.addEventListener('keydown', e => { if (e.ctrlKey && e.key === 'F1') { e.preventDefault(); toggleRibbonMin(); } });

/* Zoomregler und Ansichtsschalter für die Statusleiste. cfg = { get(): Zahl(1 = 100 %), set(v), min, max } */
function zoomWidget(cfg) {
  const w = document.createElement('div'); w.className = 'zm';
  const mk = (t, l) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.setAttribute('aria-label', l); b.title = l; return b; };
  const minus = mk('−', 'Verkleinern'), plus = mk('+', 'Vergrößern'), rng = document.createElement('input'), out = document.createElement('output');
  rng.type = 'range'; rng.min = cfg.min || 25; rng.max = cfg.max || 300; rng.step = 5; rng.setAttribute('aria-label', 'Zoom');
  const apply = pct => { cfg.set(Math.max(+rng.min, Math.min(+rng.max, pct)) / 100); w.update(); };
  rng.oninput = () => apply(+rng.value); minus.onclick = () => apply(Math.round(cfg.get() * 100 / 10) * 10 - 10); plus.onclick = () => apply(Math.round(cfg.get() * 100 / 10) * 10 + 10);
  w.update = () => { const p = Math.round(cfg.get() * 100); rng.value = p; out.textContent = p + ' %'; };
  w.append(minus, rng, plus, out); w.update(); return w;
}
