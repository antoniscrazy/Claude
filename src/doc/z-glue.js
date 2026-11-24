/* Verdrahtung der gemeinsamen Titelleisten-Suche und des Zoomreglers */
window.addEventListener('DOMContentLoaded', () => {
  initTellMe({
    tabs: () => TABS,
    build: id => { const keep = ribCtl; ribCtl = []; try { return RIB[id](); } finally { ribCtl = keep; } },
    go: id => { tabNow = id; S._rk = null; refreshRibbon(); }
  });
  const zs = $('#zoomsel'); if (!zs) return;
  const lab = zs.closest('label'), w = zoomWidget({ min: 30, max: 300, get: () => S.zoom, set: v => { S.zoomMode = 'num'; setZoom(v); } });
  const orig = setZoom; setZoom = function (z) { orig(z); w.update(); };
  const fit = document.createElement('button'); fit.type = 'button'; fit.textContent = 'Seitenbreite'; fit.className = 'fitbtn'; fit.onclick = () => { S.zoomMode = 'fit'; setZoom('fit'); };
  lab.replaceWith(fit, w); w.update();
});

window.addEventListener('DOMContentLoaded', () => initSettings('word', { canvasLabel: 'Seiten im Dunkelmodus abdunkeln', extra: [
  { label: 'Rechtschreibprüfung', hint: 'Unterringelt Fehler beim Schreiben', get: () => docEl().spellcheck, set: v => { docEl().spellcheck = v; } },
  { label: 'Formatierungszeichen anzeigen', hint: 'Absatzmarken (¶)', get: () => docEl().classList.contains('marks'), set: v => { docEl().classList.toggle('marks', v); refreshRibbon(); } },
  { label: 'Navigationsbereich anzeigen', get: () => S.navOn, set: v => { S.navOn = v; $('#nav').style.display = v ? 'flex' : 'none'; setZoom(S.zoomMode === 'fit' ? 'fit' : S.zoom); refreshRibbon(); } },
  { type: 'select', label: 'Zoom', opts: [['fit', 'Seitenbreite'], ['0.75', '75 %'], ['1', '100 %'], ['1.25', '125 %'], ['1.5', '150 %']], get: () => S.zoomMode === 'fit' ? 'fit' : String(S.zoom), set: v => { S.zoomMode = v === 'fit' ? 'fit' : 'num'; setZoom(v === 'fit' ? 'fit' : +v); } }
] }));
