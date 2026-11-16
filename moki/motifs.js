// Gemeinsame Formen und Motive (Engine + Studio)
function starArr(cx, cy, ro, ri) {
  const p = [];
  for (let i = 0; i < 10; i++) { const r = i % 2 ? ri : ro, a = -Math.PI / 2 + i * Math.PI / 5; p.push((cx + Math.cos(a) * r).toFixed(1) + ',' + (cy + Math.sin(a) * r).toFixed(1)); }
  return p;
}
const starPts = (cx, cy, ro, ri) => starArr(cx, cy, ro, ri).join(' ');

// Formen als SVG-Pfade in einer 100 x 100 Box (Engine nutzt Path2D, Studio nutzt <path>)
const MOKI_SHAPES = {
  circle: 'M50 0A50 50 0 1 1 50 100A50 50 0 1 1 50 0Z',
  triangle: 'M50 2L98 98H2Z',
  diamond: 'M50 0L100 50L50 100L0 50Z',
  star: 'M' + starArr(50, 54, 50, 21).join('L') + 'Z',
  heart: 'M50 98C8 66 2 30 22 14C36 4 50 14 50 28C50 14 64 4 78 14C98 30 92 66 50 98Z',
  hexagon: 'M26 4H74L100 50L74 96H26L0 50Z',
  ring: 'M50 0A50 50 0 1 1 50 100A50 50 0 1 1 50 0ZM50 24A26 26 0 1 0 50 76A26 26 0 1 0 50 24Z',
  cross: 'M34 0H66V34H100V66H66V100H34V66H0V34H34Z',
  arrow: 'M0 34H56V6L100 50L56 94V66H0Z'
};
const MOKI_SHAPE_NAMES = [['circle', 'Kreis'], ['square', 'Quadrat / Balken'], ['triangle', 'Dreieck'], ['diamond', 'Raute'], ['star', 'Stern'], ['heart', 'Herz'], ['hexagon', 'Sechseck'], ['ring', 'Ring'], ['cross', 'Kreuz'], ['arrow', 'Pfeil'], ['text', 'Nur Text'], ['button', 'Knopf (Menü)']];

const MOKI_MOTIFS = [
  { id: 'rocket', name: 'Rakete', svg: '<path d="M50 8C66 22 71 44 67 66H33C29 44 34 22 50 8Z" fill="#fff"/><circle cx="50" cy="38" r="8.5" fill="#4cc9f0"/><path d="M33 50 17 68v14l19-12Z" fill="#ff4d6d"/><path d="M67 50 83 68v14L64 70Z" fill="#ff4d6d"/><path d="M41 69c1 19 9 25 9 25s8-6 9-25Z" fill="#ffd23f"/>' },
  { id: 'star', name: 'Stern', svg: '<polygon points="' + starPts(50, 53, 42, 18) + '" fill="#ffd23f"/><circle cx="41" cy="50" r="3.2" fill="#0d1240" stroke="none"/><circle cx="59" cy="50" r="3.2" fill="#0d1240" stroke="none"/><path d="M43 60q7 6 14 0" fill="none"/>' },
  { id: 'heart', name: 'Herz', svg: '<path d="M50 86C14 60 12 30 30 22c12-5 20 4 20 10 0-6 8-15 20-10 18 8 16 38-20 64Z" fill="#ff4d6d"/><path d="M28 36c2-5 7-7 11-5" fill="none" stroke="#fff" stroke-opacity=".7"/>' },
  { id: 'bolt', name: 'Blitz', svg: '<polygon points="58,6 22,56 46,56 38,94 78,40 54,40" fill="#ffd23f"/>' },
  { id: 'ghost', name: 'Geist', svg: '<path d="M20 90V46C20 22 34 10 50 10s30 12 30 36v44l-10-10-10 10-10-10-10 10-10-10Z" fill="#fff"/><circle cx="40" cy="44" r="5" fill="#0d1240" stroke="none"/><circle cx="60" cy="44" r="5" fill="#0d1240" stroke="none"/><path d="M44 58q6 5 12 0" fill="none"/>' },
  { id: 'crown', name: 'Krone', svg: '<polygon points="14,76 10,32 32,52 50,22 68,52 90,32 86,76" fill="#ffd23f"/><rect x="14" y="76" width="72" height="11" rx="3" fill="#ff9f1c"/><circle cx="10" cy="32" r="5" fill="#ff4d6d"/><circle cx="50" cy="22" r="5" fill="#4cc9f0"/><circle cx="90" cy="32" r="5" fill="#ff4d6d"/>' },
  { id: 'ball', name: 'Ball', svg: '<circle cx="50" cy="50" r="40" fill="#fff"/><polygon points="50,33 65,44 59,62 41,62 35,44" fill="#0d1240"/><path d="M50 33V12M65 44l20-7M59 62l12 17M41 62 29 79M35 44l-20-7" fill="none"/>' },
  { id: 'planet', name: 'Planet', svg: '<circle cx="50" cy="50" r="27" fill="#ff9f1c"/><path d="M36 38q14-6 28 2M34 56q16 6 32-2" fill="none" stroke-opacity=".5"/><ellipse cx="50" cy="52" rx="45" ry="12" transform="rotate(-22 50 52)" fill="none" stroke="#fff" stroke-width="6"/><ellipse cx="50" cy="52" rx="45" ry="12" transform="rotate(-22 50 52)" fill="none" stroke-width="1.5"/>' },
  { id: 'car', name: 'Auto', svg: '<path d="M8 62 15 46c3-5 8-7 14-7h38c6 0 11 3 15 8l9 11c2 3 2 7-1 9H11Z" fill="#ff4d6d"/><path d="M32 43h16v12H27Zm22 0h12c4 0 7 2 10 6l2 6H54Z" fill="#bfeaff"/><circle cx="29" cy="68" r="11" fill="#0d1240"/><circle cx="29" cy="68" r="4.5" fill="#fff" stroke="none"/><circle cx="72" cy="68" r="11" fill="#0d1240"/><circle cx="72" cy="68" r="4.5" fill="#fff" stroke="none"/>' },
  { id: 'sword', name: 'Schwert', svg: '<g transform="rotate(45 50 50)"><path d="M46 6h8l2 54H44Z" fill="#dfe6f5"/><rect x="30" y="60" width="40" height="8" rx="3" fill="#ffd23f"/><rect x="45" y="68" width="10" height="17" rx="3" fill="#a0522d"/><circle cx="50" cy="90" r="5.5" fill="#ffd23f"/></g>' },
  { id: 'gem', name: 'Edelstein', svg: '<polygon points="50,90 10,40 28,14 72,14 90,40" fill="#4cc9f0"/><path d="M10 40h80M28 14l22 26 22-26M50 40v50" fill="none" stroke-width="2.5"/>' },
  { id: 'pad', name: 'Controller', svg: '<rect x="6" y="28" width="88" height="46" rx="23" fill="#7b2ff7"/><path d="M31 42v18M22 51h18" stroke="#fff" stroke-width="7"/><circle cx="68" cy="45" r="6" fill="#ffd23f"/><circle cx="79" cy="57" r="6" fill="#ff4d8d"/>' },
  { id: 'blob', name: 'Moki', svg: '<path d="M16 58C16 30 32 14 50 14s34 16 34 44c0 22-14 32-34 32S16 80 16 58Z" fill="#7ff5d4"/><path d="M18 52C14 30 32 8 50 8s36 22 32 44" fill="none" stroke="#ffd23f" stroke-width="5"/><rect x="8" y="46" width="12" height="24" rx="6" fill="#ffd23f"/><rect x="80" y="46" width="12" height="24" rx="6" fill="#ffd23f"/><ellipse cx="38" cy="58" rx="4.5" ry="6" fill="#0d1240" stroke="none"/><ellipse cx="62" cy="58" rx="4.5" ry="6" fill="#0d1240" stroke="none"/><path d="M42 72q8 8 16 0" fill="none"/>' }
];
