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
