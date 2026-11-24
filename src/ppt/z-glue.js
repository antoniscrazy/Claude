/* Verdrahtung der gemeinsamen Titelleisten-Suche */
window.addEventListener('DOMContentLoaded', () => initTellMe({
  tabs: () => TAB_DEF,
  build: id => { const keep = ribbonControls; ribbonControls = []; try { return RIBBON[id](); } finally { ribbonControls = keep; } },
  go: id => { S.tab = id; S._rkey = null; buildRibbon(); buildTabs(); }
}));

window.addEventListener('DOMContentLoaded', () => initSettings('powerpoint', { canvasLabel: null, extra: [
  { label: 'Gitternetzlinien anzeigen', get: () => !!S.gridOn, set: v => { S.gridOn = v; renderStage(true); refreshRibbon(); } },
  { label: 'Objekte einrasten', hint: 'An Hilfslinien und Rändern', get: () => !!S.snap, set: v => { S.snap = v; refreshRibbon(); } },
  { label: 'Folienleiste anzeigen', get: () => !!S.thumbsOn, set: v => { S.thumbsOn = v; render(); } },
  { label: 'Notizen anzeigen', get: () => !!S.notesOn, set: v => { S.notesOn = v; render(); } },
  { label: 'Seitenleiste rechts anzeigen', get: () => !!S.rightOn, set: v => { S.rightOn = v; render(); } },
  { label: 'Rechtschreibprüfung', get: () => spellOn, set: v => { if (spellOn !== v) toggleSpell(); } }
] }));
