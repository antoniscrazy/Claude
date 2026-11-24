/* Verdrahtung der gemeinsamen Titelleisten-Suche */
window.addEventListener('DOMContentLoaded', () => initTellMe({
  tabs: () => TAB_DEF,
  build: id => { const keep = ribbonControls; ribbonControls = []; try { return RIBBON[id](); } finally { ribbonControls = keep; } },
  go: id => { S.tab = id; S._rkey = null; buildRibbon(); buildTabs(); }
}));
