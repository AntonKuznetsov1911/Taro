// Рисованные иллюстрации карт Таро.
//
// Картинки собираются кодом, а не грузятся файлами: приложение работает офлайн,
// а 78 растровых карт весили бы десятки мегабайт. Каждая карта — это сцена из
// общего набора примитивов (небо, земля, светила, фигуры, эмблемы мастей),
// поэтому колода выглядит единым целым.

import type { TarotCard } from '../data/tarotCards';

const W = 200;
const H = 300;

// Границы области иллюстрации
const ART = { x: 16, y: 48, w: 168, h: 196 };
const CX = W / 2;

interface Palette {
  sky1: string;
  sky2: string;
  ground: string;
  ink: string;
  accent: string;
  metal: string;
}

const PALETTES: Record<string, Palette> = {
  major: { sky1: '#2b1a4a', sky2: '#0f0a1e', ground: '#3b2a1e', ink: '#e9e2f5', accent: '#c9a227', metal: '#f3d98b' },
  wands: { sky1: '#4a2413', sky2: '#1a0d07', ground: '#5a3320', ink: '#ffe8d6', accent: '#ff8c42', metal: '#ffc078' },
  cups: { sky1: '#123a4a', sky2: '#061a24', ground: '#14485c', ink: '#dff3ff', accent: '#4bb8d8', metal: '#9fe0f0' },
  swords: { sky1: '#2d3550', sky2: '#0b0f1c', ground: '#39405c', ink: '#e8ecff', accent: '#8fa4d8', metal: '#cdd8f5' },
  pentacles: { sky1: '#1e3a1e', sky2: '#08150a', ground: '#2f4a22', ink: '#e6f5d8', accent: '#7fb069', metal: '#bcd99a' },
};

function paletteFor(card: TarotCard): Palette {
  return PALETTES[card.suit] || PALETTES.major;
}

/* ─────────────── примитивы сцены ─────────────── */

const sky = (p: Palette) => `<rect x="${ART.x}" y="${ART.y}" width="${ART.w}" height="${ART.h}" fill="url(#sky)" rx="6"/>`;

const ground = (p: Palette, top = 196) =>
  `<path d="M${ART.x},${top} Q${CX},${top - 8} ${ART.x + ART.w},${top} L${ART.x + ART.w},${ART.y + ART.h} L${ART.x},${ART.y + ART.h} Z" fill="${p.ground}"/>`;

const sun = (cx: number, cy: number, r: number, p: Palette) => {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    const x1 = cx + Math.cos(a) * (r + 3), y1 = cy + Math.sin(a) * (r + 3);
    const x2 = cx + Math.cos(a) * (r + 9), y2 = cy + Math.sin(a) * (r + 9);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${p.metal}" stroke-width="1.4" opacity="0.85"/>`;
  }).join('');
  return `${rays}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.metal}"/>`;
};

const moon = (cx: number, cy: number, r: number, p: Palette) =>
  `<path d="M${cx + r * 0.35},${cy - r} a${r},${r} 0 1,0 0,${2 * r} a${r * 0.8},${r} 0 1,1 0,${-2 * r} Z" fill="${p.metal}"/>`;

const stars = (n: number, seed: number, p: Palette) =>
  Array.from({ length: n }, (_, i) => {
    const k = (seed + i * 37) % 97;
    const x = ART.x + 8 + ((k * 13) % (ART.w - 16));
    const y = ART.y + 6 + ((k * 29) % 90);
    const r = 0.7 + ((k % 3) * 0.4);
    return `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="${p.ink}" opacity="${(0.35 + (k % 5) * 0.12).toFixed(2)}"/>`;
  }).join('');

const mountains = (p: Palette, y = 190) =>
  `<path d="M${ART.x},${y} L${ART.x + 40},${y - 34} L${ART.x + 66},${y - 6} L${ART.x + 96},${y - 44} L${ART.x + 130},${y - 8} L${ART.x + ART.w},${y} Z" fill="${p.sky2}" opacity="0.85"/>`;

const water = (p: Palette, y = 200) =>
  `<rect x="${ART.x}" y="${y}" width="${ART.w}" height="${ART.y + ART.h - y}" fill="${p.accent}" opacity="0.28"/>` +
  Array.from({ length: 4 }, (_, i) =>
    `<path d="M${ART.x + 6},${y + 10 + i * 9} q14,-4 28,0 t28,0 t28,0 t28,0 t28,0" fill="none" stroke="${p.ink}" stroke-width="0.8" opacity="0.3"/>`
  ).join('');

/** Фигура в мантии: читается даже в мелком размере */
const figure = (cx: number, footY: number, h: number, robe: string, p: Palette, opts: { crown?: boolean; halo?: boolean } = {}) => {
  const headR = h * 0.13;
  const headY = footY - h + headR;
  const shoulderY = headY + headR * 1.6;
  return `
  ${opts.halo ? `<circle cx="${cx}" cy="${headY}" r="${(headR * 1.9).toFixed(1)}" fill="${p.metal}" opacity="0.25"/>` : ''}
  <path d="M${cx - h * 0.22},${footY} L${cx - h * 0.1},${shoulderY} Q${cx},${shoulderY - h * 0.06} ${cx + h * 0.1},${shoulderY} L${cx + h * 0.22},${footY} Z" fill="${robe}"/>
  <circle cx="${cx}" cy="${headY}" r="${headR.toFixed(1)}" fill="${p.ink}" opacity="0.92"/>
  ${opts.crown ? `<path d="M${cx - headR * 1.2},${headY - headR * 1.1} l${headR * 0.8},${-headR * 0.7} l${headR * 0.4},${headR * 0.5} l${headR * 0.4},${-headR * 0.7} l${headR * 0.4},${headR * 0.7} l${headR * 0.4},${-headR * 0.5} l${headR * 0.8},${headR * 0.7} Z" fill="${p.metal}"/>` : ''}`;
};

const pillar = (x: number, topY: number, botY: number, fill: string, p: Palette) => `
  <rect x="${x - 7}" y="${topY}" width="14" height="${botY - topY}" fill="${fill}"/>
  <rect x="${x - 10}" y="${topY - 6}" width="20" height="6" fill="${p.metal}" opacity="0.8"/>
  <rect x="${x - 10}" y="${botY}" width="20" height="5" fill="${p.metal}" opacity="0.6"/>`;

const throne = (cx: number, y: number, p: Palette) =>
  `<rect x="${cx - 30}" y="${y - 46}" width="60" height="50" rx="6" fill="${p.sky2}" opacity="0.9"/>
   <rect x="${cx - 34}" y="${y - 4}" width="68" height="8" rx="3" fill="${p.metal}" opacity="0.7"/>`;

/* ─────────────── эмблемы мастей ─────────────── */

const wand = (cx: number, cy: number, len: number, p: Palette, angle = 0) => `
  <g transform="rotate(${angle} ${cx} ${cy})">
    <rect x="${cx - 1.8}" y="${cy - len / 2}" width="3.6" height="${len}" rx="1.8" fill="#8b5a2b"/>
    <circle cx="${cx}" cy="${cy - len / 2}" r="3.4" fill="${p.accent}"/>
    <path d="M${cx},${cy - len / 2 - 3} l3,-5 l-3,2 l-3,-2 Z" fill="${p.metal}"/>
  </g>`;

const cup = (cx: number, cy: number, s: number, p: Palette) => `
  <g>
    <path d="M${cx - s * 0.5},${cy - s * 0.42} h${s} a${s * 0.5},${s * 0.55} 0 0,1 ${-s} 0 Z" fill="${p.metal}"/>
    <rect x="${cx - 1.6}" y="${cy + s * 0.12}" width="3.2" height="${s * 0.34}" fill="${p.metal}"/>
    <ellipse cx="${cx}" cy="${cy + s * 0.48}" rx="${s * 0.34}" ry="${s * 0.1}" fill="${p.metal}"/>
    <ellipse cx="${cx}" cy="${cy - s * 0.42}" rx="${s * 0.5}" ry="${s * 0.12}" fill="${p.accent}" opacity="0.9"/>
  </g>`;

const sword = (cx: number, cy: number, len: number, p: Palette, angle = 0) => `
  <g transform="rotate(${angle} ${cx} ${cy})">
    <path d="M${cx},${cy - len / 2} l3,${len * 0.14} v${len * 0.6} h-6 v${-len * 0.6} Z" fill="${p.metal}"/>
    <rect x="${cx - 7}" y="${cy + len * 0.24}" width="14" height="3" rx="1.5" fill="${p.accent}"/>
    <rect x="${cx - 1.6}" y="${cy + len * 0.27}" width="3.2" height="${len * 0.2}" fill="${p.accent}"/>
    <circle cx="${cx}" cy="${cy + len * 0.48}" r="2.6" fill="${p.metal}"/>
  </g>`;

const pentacle = (cx: number, cy: number, r: number, p: Palette) => {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
    return `${(cx + Math.cos(a) * r * 0.62).toFixed(1)},${(cy + Math.sin(a) * r * 0.62).toFixed(1)}`;
  }).join(' ');
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.metal}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.82}" fill="none" stroke="${p.sky2}" stroke-width="1"/>
    <polygon points="${pts}" fill="none" stroke="${p.sky2}" stroke-width="1.4"/>`;
};

function emblem(suit: string, cx: number, cy: number, size: number, p: Palette): string {
  switch (suit) {
    case 'wands': return wand(cx, cy, size * 2.1, p);
    case 'cups': return cup(cx, cy, size * 1.5, p);
    case 'swords': return sword(cx, cy, size * 2.1, p);
    default: return pentacle(cx, cy, size * 0.75, p);
  }
}

/* ─────────────── старшие арканы ─────────────── */

const MAJOR_SCENES: Record<number, (p: Palette) => string> = {
  0: p => `${sky(p)}${stars(14, 3, p)}${sun(150, 78, 9, p)}${mountains(p, 188)}${ground(p)}
    ${figure(96, 196, 74, '#e6d24a', p)}
    <path d="M112,150 l16,-8 l2,5 z" fill="${p.metal}"/>
    <circle cx="76" cy="192" r="6" fill="${p.ink}" opacity="0.75"/>`,
  1: p => `${sky(p)}${stars(10, 7, p)}${ground(p)}
    <text x="${CX}" y="${ART.y + 22}" font-size="16" fill="${p.metal}" text-anchor="middle">∞</text>
    <rect x="${CX - 34}" y="176" width="68" height="6" fill="${p.metal}" opacity="0.7"/>
    ${figure(CX, 176, 78, '#b23a48', p, { halo: true })}
    ${wand(CX, 120, 34, p)}`,
  2: p => `${sky(p)}${stars(12, 11, p)}
    ${pillar(60, 92, 200, '#0d0d18', p)}${pillar(140, 92, 200, '#f0eee8', p)}
    <rect x="72" y="96" width="56" height="104" fill="${p.sky2}" opacity="0.75"/>
    ${moon(CX, 122, 11, p)}
    ${figure(CX, 200, 66, '#2e6ea6', p)}`,
  3: p => `${sky(p)}${sun(146, 74, 10, p)}${ground(p, 190)}
    ${Array.from({ length: 7 }, (_, i) => `<path d="M${44 + i * 18},198 v-14 M${41 + i * 18},188 l3,-6 l3,6" stroke="${p.metal}" stroke-width="1.2" fill="none" opacity="0.8"/>`).join('')}
    ${figure(CX, 194, 70, '#6a9c3a', p, { crown: true })}`,
  4: p => `${sky(p)}${mountains(p, 186)}${ground(p)}
    ${throne(CX, 196, p)}
    ${figure(CX, 192, 68, '#a8322c', p, { crown: true })}`,
  5: p => `${sky(p)}${pillar(62, 88, 198, '#2a2438', p)}${pillar(138, 88, 198, '#2a2438', p)}${ground(p)}
    ${figure(CX, 186, 72, '#8b2f47', p, { crown: true })}
    ${figure(78, 208, 34, '#4a4a5a', p)}${figure(122, 208, 34, '#4a4a5a', p)}`,
  6: p => `${sky(p)}${sun(CX, 74, 12, p)}${ground(p, 194)}
    <path d="M${CX - 40},70 q40,-16 80,0 l-6,10 q-34,-12 -68,0 Z" fill="${p.metal}" opacity="0.5"/>
    ${figure(74, 200, 64, '#c96a86', p)}${figure(126, 200, 64, '#3f7fa8', p)}`,
  7: p => `${sky(p)}${stars(10, 5, p)}${ground(p, 198)}
    <rect x="${CX - 26}" y="168" width="52" height="30" rx="4" fill="${p.sky2}"/>
    <circle cx="${CX - 20}" cy="200" r="7" fill="${p.metal}" opacity="0.8"/><circle cx="${CX + 20}" cy="200" r="7" fill="${p.metal}" opacity="0.8"/>
    ${figure(CX, 170, 52, '#4a5fa8', p, { crown: true })}`,
  8: p => `${sky(p)}${sun(148, 72, 9, p)}${ground(p, 196)}
    <text x="${CX}" y="${ART.y + 24}" font-size="16" fill="${p.metal}" text-anchor="middle">∞</text>
    <ellipse cx="122" cy="184" rx="26" ry="16" fill="#c98a2b"/>
    <circle cx="146" cy="176" r="10" fill="#e0a94a"/>
    ${figure(84, 198, 60, '#f2eee4', p)}`,
  9: p => `${sky(p)}${stars(16, 13, p)}${mountains(p, 192)}${ground(p)}
    ${figure(CX, 198, 76, '#5a5a6e', p)}
    <circle cx="${CX + 22}" cy="150" r="9" fill="${p.metal}"/>
    <circle cx="${CX + 22}" cy="150" r="15" fill="${p.metal}" opacity="0.22"/>`,
  10: p => `${sky(p)}${stars(12, 17, p)}
    <circle cx="${CX}" cy="140" r="42" fill="none" stroke="${p.metal}" stroke-width="3"/>
    <circle cx="${CX}" cy="140" r="30" fill="none" stroke="${p.accent}" stroke-width="1.4" opacity="0.7"/>
    ${Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `<line x1="${CX}" y1="140" x2="${(CX + Math.cos(a) * 42).toFixed(1)}" y2="${(140 + Math.sin(a) * 42).toFixed(1)}" stroke="${p.metal}" stroke-width="1.2" opacity="0.6"/>`; }).join('')}
    ${ground(p)}`,
  11: p => `${sky(p)}${pillar(64, 96, 200, '#2a2438', p)}${pillar(136, 96, 200, '#2a2438', p)}
    ${figure(CX, 198, 70, '#7d2f4f', p, { crown: true })}
    ${sword(CX + 26, 140, 44, p)}
    <line x1="${CX - 34}" y1="132" x2="${CX - 12}" y2="132" stroke="${p.metal}" stroke-width="1.4"/>
    <circle cx="${CX - 34}" cy="138" r="5" fill="none" stroke="${p.metal}" stroke-width="1.2"/>
    <circle cx="${CX - 12}" cy="138" r="5" fill="none" stroke="${p.metal}" stroke-width="1.2"/>`,
  12: p => `${sky(p)}${stars(10, 19, p)}${ground(p, 210)}
    <rect x="${CX - 44}" y="86" width="88" height="5" fill="#6b4a2a"/>
    <rect x="${CX - 46}" y="86" width="5" height="60" fill="#6b4a2a"/><rect x="${CX + 41}" y="86" width="5" height="60" fill="#6b4a2a"/>
    <line x1="${CX}" y1="91" x2="${CX}" y2="112" stroke="${p.metal}" stroke-width="1.4"/>
    <circle cx="${CX}" cy="122" r="10" fill="${p.ink}" opacity="0.9"/>
    <circle cx="${CX}" cy="122" r="17" fill="${p.metal}" opacity="0.22"/>
    <path d="M${CX - 12},132 L${CX},174 L${CX + 12},132 Z" fill="#3f6fa8"/>`,
  13: p => `${sky(p)}${stars(8, 23, p)}${sun(CX, 176, 8, p)}${ground(p, 200)}
    ${figure(CX, 200, 74, '#1a1a22', p)}
    <circle cx="${CX}" cy="140" r="9" fill="${p.ink}"/>
    <circle cx="${CX - 3.4}" cy="138" r="1.6" fill="${p.sky2}"/><circle cx="${CX + 3.4}" cy="138" r="1.6" fill="${p.sky2}"/>`,
  14: p => `${sky(p)}${sun(150, 76, 8, p)}${water(p, 206)}
    ${figure(CX, 200, 74, '#e8e4f0', p, { halo: true })}
    ${cup(CX - 24, 150, 20, p)}${cup(CX + 24, 164, 20, p)}
    <path d="M${CX - 18},156 q18,6 36,4" stroke="${p.accent}" stroke-width="1.6" fill="none" opacity="0.8"/>`,
  15: p => `${sky(p)}
    <rect x="${ART.x}" y="${ART.y}" width="${ART.w}" height="${ART.h}" fill="#0a0710" rx="6" opacity="0.7"/>
    ${figure(CX, 176, 72, '#4a2038', p)}
    <path d="M${CX - 16},118 l-10,-14 l6,2 M${CX + 16},118 l10,-14 l-6,2" stroke="${p.metal}" stroke-width="2" fill="none"/>
    ${figure(74, 216, 40, '#5a4a4a', p)}${figure(126, 216, 40, '#5a4a4a', p)}
    <path d="M84,196 q16,8 32,0" stroke="${p.metal}" stroke-width="1.2" fill="none" opacity="0.7"/>`,
  16: p => `${sky(p)}
    <rect x="${CX - 24}" y="120" width="48" height="86" fill="#4a4450"/>
    <path d="M${CX - 30},120 l30,-20 l30,20 Z" fill="#6a5a3a"/>
    <path d="M${CX + 6},${ART.y + 4} l-16,44 l12,-4 l-10,32 l30,-46 l-13,3 z" fill="${p.metal}"/>
    <circle cx="${CX - 40}" cy="188" r="6" fill="${p.ink}" opacity="0.8"/><circle cx="${CX + 40}" cy="196" r="6" fill="${p.ink}" opacity="0.8"/>
    ${ground(p, 212)}`,
  17: p => `${sky(p)}${stars(18, 29, p)}
    ${Array.from({ length: 7 }, (_, i) => { const x = 46 + i * 18, y = 74 + (i % 2) * 12; return `<path d="M${x},${y - 6} l1.8,4.4 l4.8,0.4 l-3.6,3.2 l1.1,4.6 l-4.1,-2.5 l-4.1,2.5 l1.1,-4.6 l-3.6,-3.2 l4.8,-0.4 Z" fill="${p.metal}" opacity="0.9"/>`; }).join('')}
    <path d="M${CX},60 l3,7 l7.5,0.6 l-5.7,5 l1.8,7.3 l-6.6,-4 l-6.6,4 l1.8,-7.3 l-5.7,-5 l7.5,-0.6 Z" fill="${p.metal}"/>
    ${water(p, 208)}${figure(CX, 206, 58, '#dfe8f2', p)}
    ${cup(CX - 28, 178, 16, p)}${cup(CX + 28, 182, 16, p)}`,
  18: p => `${sky(p)}${stars(14, 31, p)}${moon(CX, 96, 15, p)}
    ${pillar(56, 130, 200, '#26203a', p)}${pillar(144, 130, 200, '#26203a', p)}
    ${water(p, 210)}
    <path d="M${CX - 8},210 L${CX},170 L${CX + 8},210 Z" fill="${p.ink}" opacity="0.25"/>
    <circle cx="80" cy="196" r="5" fill="${p.ink}" opacity="0.6"/><circle cx="120" cy="196" r="5" fill="${p.ink}" opacity="0.6"/>`,
  19: p => `${sky(p)}${sun(CX, 104, 22, p)}${ground(p, 200)}
    ${Array.from({ length: 5 }, (_, i) => `<circle cx="${46 + i * 27}" cy="188" r="6" fill="${p.metal}" opacity="0.85"/><rect x="${45 + i * 27}" y="188" width="2" height="14" fill="#6a9c3a"/>`).join('')}
    ${figure(CX, 202, 54, '#f0d97a', p, { halo: true })}`,
  20: p => `${sky(p)}${stars(10, 37, p)}
    <path d="M${CX - 30},92 q30,-16 60,0 l-8,10 q-22,-11 -44,0 Z" fill="${p.metal}" opacity="0.55"/>
    <path d="M${CX + 8},96 l26,-14 l2,6 l-26,14 Z" fill="${p.metal}"/>
    ${ground(p, 206)}
    ${figure(72, 214, 44, '#cfd6e6', p)}${figure(CX, 210, 50, '#e2e8f2', p)}${figure(128, 214, 44, '#cfd6e6', p)}`,
  21: p => `${sky(p)}${stars(12, 41, p)}
    <ellipse cx="${CX}" cy="146" rx="46" ry="62" fill="none" stroke="#6a9c3a" stroke-width="5" opacity="0.9"/>
    ${figure(CX, 186, 66, '#e8dff5', p, { halo: true })}
    ${[[46, 76], [154, 76], [46, 216], [154, 216]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${p.metal}" opacity="0.75"/>`).join('')}`,
};

/* ─────────────── младшие арканы ─────────────── */

// Традиционные раскладки пипсов: от туза до десятки
const PIP_LAYOUTS: Record<number, Array<[number, number]>> = {
  1: [[0, 0]],
  2: [[0, -34], [0, 34]],
  3: [[0, -40], [-32, 22], [32, 22]],
  4: [[-30, -32], [30, -32], [-30, 32], [30, 32]],
  5: [[-30, -36], [30, -36], [0, 0], [-30, 36], [30, 36]],
  6: [[-32, -40], [32, -40], [-32, 0], [32, 0], [-32, 40], [32, 40]],
  7: [[-32, -44], [32, -44], [-32, -6], [32, -6], [-32, 32], [32, 32], [0, 62]],
  8: [[-32, -46], [32, -46], [-32, -14], [32, -14], [-32, 18], [32, 18], [-32, 50], [32, 50]],
  9: [[-34, -48], [0, -48], [34, -48], [-34, -8], [0, -8], [34, -8], [-34, 32], [0, 32], [34, 32]],
  10: [[-34, -52], [0, -52], [34, -52], [-34, -18], [0, -18], [34, -18], [-34, 16], [0, 16], [34, 16], [0, 50]],
};

/** Порядковый номер младшего аркана: 1..10 для пипсов, 11..14 для фигурных */
function minorRank(card: TarotCard): number {
  const suitStart: Record<string, number> = { wands: 22, cups: 36, swords: 50, pentacles: 64 };
  const start = suitStart[card.suit];
  return start === undefined ? 0 : card.id - start + 1;
}

function pipScene(card: TarotCard, rank: number, p: Palette): string {
  const layout = PIP_LAYOUTS[rank] || PIP_LAYOUTS[1];
  const cy = ART.y + ART.h / 2;
  const size = rank <= 2 ? 20 : rank <= 6 ? 14 : 11;
  const items = layout.map(([dx, dy]) => emblem(card.suit, CX + dx, cy + dy * 0.78, size, p)).join('');

  // Туз подаётся крупно, с сиянием — как дар из облака
  if (rank === 1) {
    return `${sky(p)}${stars(10, card.id, p)}
      <ellipse cx="${CX}" cy="${cy}" rx="46" ry="46" fill="${p.accent}" opacity="0.18"/>
      <path d="M${CX - 44},${cy - 54} q16,-12 34,-2 q18,-10 32,4 q10,10 -4,16 l-58,0 q-12,-8 -4,-18 Z" fill="${p.ink}" opacity="0.28"/>
      ${emblem(card.suit, CX, cy + 6, 30, p)}`;
  }
  return `${sky(p)}${stars(8, card.id, p)}${ground(p, 214)}${items}`;
}

const COURT_ROBES = ['#8a6a3a', '#a8433a', '#7d4a86', '#2f5f8a'];

function courtScene(card: TarotCard, rank: number, p: Palette): string {
  const cy = ART.y + ART.h / 2;
  const robe = COURT_ROBES[(rank - 11) % 4];
  const isPage = rank === 11, isKnight = rank === 12;
  const crown = rank >= 13;

  const mount = isKnight
    ? `<path d="M${CX - 44},214 q10,-30 34,-30 q16,0 22,10 q10,-4 14,6 l6,14 Z" fill="${p.sky2}" opacity="0.95"/>
       <rect x="${CX - 38}" y="214" width="5" height="16" fill="${p.sky2}"/><rect x="${CX + 22}" y="214" width="5" height="16" fill="${p.sky2}"/>`
    : '';
  const seat = crown ? throne(CX, 216, p) : '';

  return `${sky(p)}${stars(8, card.id, p)}${ground(p, 212)}
    ${seat}${mount}
    ${figure(CX, isKnight ? 186 : 210, isPage ? 62 : 76, robe, p, { crown })}
    ${emblem(card.suit, CX + 40, cy + 10, 13, p)}`;
}

/* ─────────────── сборка карты ─────────────── */

function romanNumeral(n: number): string {
  const table: Array<[number, string]> = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  if (n === 0) return '0';
  let rest = n, out = '';
  for (const [value, sign] of table) {
    while (rest >= value) { out += sign; rest -= value; }
  }
  return out;
}

const SUIT_LABEL: Record<string, string> = {
  major: 'Старший аркан',
  wands: 'Жезлы',
  cups: 'Кубки',
  swords: 'Мечи',
  pentacles: 'Пентакли',
};

const RANK_LABEL: Record<number, string> = {
  11: 'Паж', 12: 'Рыцарь', 13: 'Королева', 14: 'Король',
};

function sceneFor(card: TarotCard, p: Palette): string {
  if (card.suit === 'major') {
    const scene = MAJOR_SCENES[card.id];
    return scene ? scene(p) : `${sky(p)}${stars(12, card.id, p)}${ground(p)}${figure(CX, 200, 70, p.accent, p)}`;
  }
  const rank = minorRank(card);
  return rank >= 11 ? courtScene(card, rank, p) : pipScene(card, rank, p);
}

/** Подпись ранга: римская цифра для старших, номер или чин — для младших */
function rankMark(card: TarotCard): string {
  if (card.suit === 'major') return romanNumeral(card.id);
  const rank = minorRank(card);
  if (rank >= 11) return RANK_LABEL[rank] || '';
  return rank === 1 ? 'ТУЗ' : String(rank);
}

export function renderTarotCard(card: TarotCard, isReversed = false): string {
  const p = paletteFor(card);
  const uid = `c${card.id}`;
  // Имя длиннее 16 знаков переносим, иначе оно вылезает за рамку
  const name = card.name.length > 16 ? card.name.split(' ') : [card.name];
  const nameLines = name.length > 1
    ? `<text x="${CX}" y="34" font-family="Georgia,serif" font-size="10" font-weight="bold" fill="${p.metal}" text-anchor="middle">${name[0]}</text>
       <text x="${CX}" y="44" font-family="Georgia,serif" font-size="10" font-weight="bold" fill="${p.metal}" text-anchor="middle">${name.slice(1).join(' ')}</text>`
    : `<text x="${CX}" y="38" font-family="Georgia,serif" font-size="12" font-weight="bold" fill="${p.metal}" text-anchor="middle">${card.name}</text>`;

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.sky1}"/><stop offset="100%" stop-color="${p.sky2}"/>
    </linearGradient>
    <linearGradient id="frame_${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.metal}"/><stop offset="50%" stop-color="${p.accent}"/><stop offset="100%" stop-color="${p.metal}"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" rx="12" fill="${p.sky2}"/>
  <rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="10" fill="none" stroke="url(#frame_${uid})" stroke-width="2"/>

  <g${isReversed ? ` transform="rotate(180 ${CX} ${ART.y + ART.h / 2})"` : ''}>
    ${sceneFor(card, p)}
  </g>
  <rect x="${ART.x}" y="${ART.y}" width="${ART.w}" height="${ART.h}" fill="none" stroke="${p.metal}" stroke-width="1" rx="6" opacity="0.65"/>

  ${nameLines}
  <text x="${CX}" y="262" font-family="Georgia,serif" font-size="11" fill="${p.accent}" text-anchor="middle">${rankMark(card)}</text>
  <text x="${CX}" y="280" font-family="Arial,sans-serif" font-size="7.5" fill="${p.ink}" text-anchor="middle" opacity="0.7">${SUIT_LABEL[card.suit] || ''}</text>
  ${isReversed ? `<text x="${CX}" y="292" font-family="Arial,sans-serif" font-size="7" fill="${p.accent}" text-anchor="middle">⟲ перевёрнутая</text>` : ''}
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}
