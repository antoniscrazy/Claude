/* Verdrahtung der gemeinsamen Titelleisten-Suche */
window.addEventListener('DOMContentLoaded', () => initTellMe({
  tabs: () => TABS,
  build: id => { const keep = ribbonCtl; ribbonCtl = []; try { return RIB[id](); } finally { ribbonCtl = keep; } },
  go: id => { curTab = id; buildRibbon(); }
}));

window.addEventListener('DOMContentLoaded', () => initSettings('excel', { canvasLabel: 'Tabellenblatt im Dunkelmodus abdunkeln', extra: [
  { label: 'Gitternetzlinien anzeigen', get: () => !$('#gridwrap').classList.contains('nogrid'), set: v => { $('#gridwrap').classList.toggle('nogrid', !v); refreshRibbon(); } },
  { label: 'Formelleiste anzeigen', get: () => $('#fbar').style.display !== 'none', set: v => { $('#fbar').style.display = v ? '' : 'none'; layout(); render(); refreshRibbon(); } },
  { label: 'Formeln statt Werte anzeigen', get: () => !!S.showF, set: v => { S.showF = v; render(); refreshRibbon(); } },
  { label: 'Rechtschreibprüfung im Eingabefeld', get: () => $('#ed').spellcheck !== false, set: v => { $('#ed').spellcheck = v; } }
] }));
