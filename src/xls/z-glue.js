/* Verdrahtung der gemeinsamen Titelleisten-Suche */
window.addEventListener('DOMContentLoaded', () => initTellMe({
  tabs: () => TABS,
  build: id => { const keep = ribbonCtl; ribbonCtl = []; try { return RIB[id](); } finally { ribbonCtl = keep; } },
  go: id => { curTab = id; buildRibbon(); }
}));
