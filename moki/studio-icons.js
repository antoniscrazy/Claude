const ICON_MOTIFS = MOKI_MOTIFS;
// Icon-Baukasten: Motiv + Farbverlauf -> 400x400 Bild (wie die Kacheln bei Moki)
const ICON_PALS = [
  ['#00e5a8', '#2b6fd6'], ['#ff7a18', '#af002d'], ['#7b2ff7', '#f107a3'], ['#2b9cf0', '#1b2a8f'], ['#ffe600', '#ff9f1c'],
  ['#3ba7f5', '#69cbec'], ['#2e9c2e', '#d9ec2a'], ['#ff4d8d', '#ffb347'], ['#1b1f4a', '#4b2ea8'], ['#f5f7ff', '#a9d6ff']
];
function iconSvg(motifId, palIdx) {
  const m = ICON_MOTIFS.find(x => x.id === motifId) || ICON_MOTIFS[0];
  const p = ICON_PALS[palIdx] || ICON_PALS[0];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient></defs>
<rect width="400" height="400" fill="url(#bg)"/><circle cx="345" cy="55" r="140" fill="#fff" opacity=".14"/><circle cx="30" cy="395" r="120" fill="#000" opacity=".13"/>
<ellipse cx="200" cy="352" rx="105" ry="13" fill="#000" opacity=".2"/>
<g transform="translate(52 40) scale(2.96)" stroke="#0d1240" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round">${m.svg}</g></svg>`;
}
function iconMini(motifId) {   // kleine Vorschau für die Motiv-Auswahl
  const m = ICON_MOTIFS.find(x => x.id === motifId);
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><g stroke="#0d1240" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round">${m.svg}</g></svg>`;
}
const svgUrl = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Bild konnte nicht gelesen werden')); i.src = src; }); }
// beliebiges Bild -> 400x400 JPEG (Mitte, quadratisch zugeschnitten)
async function toJpeg(src, flat) {
  const img = await loadImg(src);
  const c = document.createElement('canvas'); c.width = c.height = 400;
  const x = c.getContext('2d');
  x.fillStyle = flat || '#101645'; x.fillRect(0, 0, 400, 400);
  const w = img.naturalWidth || 400, h = img.naturalHeight || 400, s = Math.min(w, h);
  x.drawImage(img, (w - s) / 2, (h - s) / 2, s, s, 0, 0, 400, 400);
  let q = 0.86, out = c.toDataURL('image/jpeg', q);
  while (out.length > 110000 && q > 0.4) { q -= 0.1; out = c.toDataURL('image/jpeg', q); }
  return out;
}
