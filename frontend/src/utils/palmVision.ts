// Автоматический разбор ладони по фото.
//
// На вход — пиксели снимка и 21 точка руки от MediaPipe Hand Landmarker.
// По точкам измеряется форма руки (пропорции ладони и длина пальцев),
// затем ладонь «выпрямляется» в стандартную сетку, и в зонах, где по
// канонам хиромантии проходят главные линии, ищутся тёмные складки.
// Для каждой линии оцениваются глубина, форма, разрывы, «цепочка»
// и раздвоение. Модуль не зависит от платформы и тестируется в node.

import type { HandShapeId, LineTrait, PalmFeatures, PalmLineId } from './palmReading';

export interface Point { x: number; y: number }

export interface RgbaImage {
  width: number;
  height: number;
  /** RGBA, 4 байта на пиксель */
  data: Uint8ClampedArray | Uint8Array;
}

export interface LineFinding {
  id: PalmLineId;
  found: boolean;
  traits: LineTrait[];
  /** Насколько линия выделяется на коже (в «сигмах» шума) */
  strength: number;
  /** На сколько линия темнее кожи вокруг, в долях яркости */
  contrast: number;
  /** Путь линии в долях ширины/высоты снимка — для отрисовки */
  path: Point[];
}

export interface PalmMeasurements {
  /** Длина ладони к её ширине */
  palmRatio: number;
  /** Длина среднего пальца к длине ладони */
  fingerRatio: number;
}

export type PalmQualityIssue = 'too_small' | 'too_dark' | 'too_bright' | 'blurry' | 'no_lines';

export interface PalmAnalysis {
  features: PalmFeatures;
  measurements: PalmMeasurements;
  lines: LineFinding[];
  issues: PalmQualityIssue[];
  /** Снимок слегка размыт: линии найдены, но глубина может быть занижена */
  soft: boolean;
}

// ==================== ГЕОМЕТРИЯ РУКИ ====================

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const add = (a: Point, b: Point, k = 1): Point => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });

/** Пороги форм руки. Ширина по суставам (5–17) примерно на четверть
 *  меньше полной ширины ладони, поэтому она масштабируется. Точки MediaPipe
 *  стоят на суставах, а не на кожных складках, поэтому палец «по точкам»
 *  длиннее, а ладонь короче, чем при измерении линейкой: у взрослой руки
 *  средний палец по точкам ≈ 1,1–1,25 длины ладони */
const KNUCKLE_TO_PALM_WIDTH = 1.25;
const SQUARE_PALM_MAX_RATIO = 1.12;
const LONG_FINGERS_MIN_RATIO = 1.15;

export function measureHand(lm: Point[]): PalmMeasurements {
  const palmLength = dist(lm[0], lm[9]);
  const palmWidth = dist(lm[5], lm[17]) * KNUCKLE_TO_PALM_WIDTH;
  const finger = dist(lm[9], lm[10]) + dist(lm[10], lm[11]) + dist(lm[11], lm[12]);
  return { palmRatio: palmLength / palmWidth, fingerRatio: finger / palmLength };
}

export function classifyHand(m: PalmMeasurements): HandShapeId {
  const square = m.palmRatio < SQUARE_PALM_MAX_RATIO;
  const longFingers = m.fingerRatio >= LONG_FINGERS_MIN_RATIO;
  if (square) return longFingers ? 'air' : 'earth';
  return longFingers ? 'water' : 'fire';
}

/**
 * Четырёхугольник ладони: u = 0 — сторона указательного пальца,
 * u = 1 — сторона мизинца, v = 0 — основания пальцев, v = 1 — запястье.
 * Не зависит от того, левая рука или правая и отзеркален ли снимок.
 */
function palmQuad(lm: Point[]) {
  const across = sub(lm[17], lm[5]);
  const topL = add(lm[5], across, -0.12);
  const topR = add(lm[17], across, 0.12);
  const botL = add(lm[0], across, -0.55);
  const botR = add(lm[0], across, 0.5);
  return (u: number, v: number): Point => lerp(lerp(topL, topR, u), lerp(botL, botR, u), v);
}

// ==================== ИЗОБРАЖЕНИЕ ====================

const GRID_U = 200;
const GRID_V = 240;
/** Размеры в клетках ниже подобраны для сетки шириной 150 */
const K = GRID_U / 150;
const k = (n: number) => Math.round(n * K);

function sampleGray(img: RgbaImage, x: number, y: number): number {
  const fx = Math.min(img.width - 1.001, Math.max(0, x));
  const fy = Math.min(img.height - 1.001, Math.max(0, y));
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const ax = fx - x0, ay = fy - y0;
  const g = (xx: number, yy: number) => {
    const i = (yy * img.width + xx) * 4;
    // Складки на коже лучше всего видны в зелёном канале
    return 0.25 * img.data[i] + 0.6 * img.data[i + 1] + 0.15 * img.data[i + 2];
  };
  return (
    g(x0, y0) * (1 - ax) * (1 - ay) + g(x0 + 1, y0) * ax * (1 - ay) +
    g(x0, y0 + 1) * (1 - ax) * ay + g(x0 + 1, y0 + 1) * ax * ay
  );
}

type Grid = Float32Array;
const at = (g: Grid, u: number, v: number) => g[v * GRID_U + u];

function boxBlur(src: Grid, r: number, horizontal: boolean): Grid {
  const out = new Float32Array(src.length);
  for (let v = 0; v < GRID_V; v++) {
    for (let u = 0; u < GRID_U; u++) {
      let s = 0, n = 0;
      for (let k = -r; k <= r; k++) {
        const uu = horizontal ? u + k : u, vv = horizontal ? v : v + k;
        if (uu < 0 || vv < 0 || uu >= GRID_U || vv >= GRID_V) continue;
        s += at(src, uu, vv); n++;
      }
      out[v * GRID_U + u] = s / n;
    }
  }
  return out;
}

/** Приближение гауссова размытия тремя проходами box-фильтра */
function gaussBlur(src: Grid, sigma: number): Grid {
  const r = Math.max(1, Math.round(sigma * 0.9));
  let out = src;
  for (let i = 0; i < 3; i++) out = boxBlur(boxBlur(out, r, true), r, false);
  return out;
}

/**
 * Выравнивание освещения: каждая точка делится на среднюю яркость
 * окрестности. Тени от изгиба ладони и неровный свет пропадают, а
 * складки остаются — значение показывает, насколько точка темнее кожи
 * вокруг (1 — как кожа, 0,9 — на 10% темнее)
 */
function flatField(gray: Grid): Grid {
  const bg = gaussBlur(gray, 9 * K);
  return gray.map((x, i) => x / Math.max(bg[i], 1)) as Grid;
}

/**
 * Отклик складки по матрице Гессе (как в фильтре Франжи): у тёмной линии
 * яркость резко растёт поперёк неё (большое λ1 > 0) и почти не меняется
 * вдоль (малое |λ2|). У пор и пятен обе кривизны велики — отклик гасится,
 * у коротких морщинок он слабее, чем у длинной складки. Ориентация 'h' —
 * поперечные линии (сердца, ума), 'v' — продольные (судьбы).
 */
function ridgeResponse(img: Grid, orientation: 'h' | 'v' | 'any'): Grid {
  const out = new Float32Array(img.length);
  for (const sigma of [1.1 * K, 1.8 * K, 2.8 * K]) {
    const g = gaussBlur(img, sigma);
    const s2 = sigma * sigma;
    for (let v = 1; v < GRID_V - 1; v++) {
      for (let u = 1; u < GRID_U - 1; u++) {
        const c = at(g, u, v);
        const dxx = at(g, u + 1, v) - 2 * c + at(g, u - 1, v);
        const dyy = at(g, u, v + 1) - 2 * c + at(g, u, v - 1);
        const dxy = (at(g, u + 1, v + 1) - at(g, u + 1, v - 1) - at(g, u - 1, v + 1) + at(g, u - 1, v - 1)) / 4;
        const tr = (dxx + dyy) / 2;
        const det = Math.sqrt(((dxx - dyy) / 2) ** 2 + dxy * dxy);
        const l1 = tr + det; // кривизна поперёк складки
        const l2 = tr - det; // вдоль складки
        if (l1 <= 0) continue;
        let resp = s2 * Math.max(0, l1 - 1.5 * Math.abs(l2));
        if (orientation !== 'any') {
          // Собственный вектор λ1 — нормаль к складке
          let nx = dxy, ny = l1 - dxx;
          if (Math.abs(nx) + Math.abs(ny) < 1e-9) { nx = l1 - dyy; ny = dxy; }
          const len = Math.hypot(nx, ny) || 1;
          const along = orientation === 'h' ? ny / len : nx / len;
          resp *= along * along;
        }
        const i = v * GRID_U + u;
        if (resp > out[i]) out[i] = resp;
      }
    }
  }
  // Немного сглаживаем вдоль линии, чтобы разрывы в один-два пикселя не мешали
  if (orientation === 'h') return boxBlur(out, k(2), true);
  if (orientation === 'v') return boxBlur(out, k(2), false);
  return boxBlur(boxBlur(out, 1, true), 1, false);
}

/** Перевод отклика в «сигмы» относительно фона кожи ладони */
function normalize(resp: Grid): Grid {
  const values = Array.from(resp).sort((a, b) => a - b);
  const med = values[Math.floor(values.length / 2)];
  const mad = values.map(x => Math.abs(x - med)).sort((a, b) => a - b)[Math.floor(values.length / 2)] || 1e-3;
  const scale = 1.4826 * mad;
  return resp.map(x => (x - med) / scale) as Grid;
}

// ==================== ПОИСК ЛИНИЙ ====================

interface Trace {
  /** Координата поперёк линии для каждого шага вдоль неё */
  cross: number[];
  /** Сила отклика на каждом шаге */
  z: number[];
  /** Начало шагов вдоль линии */
  from: number;
}

/**
 * Лучший гладкий путь через зону (динамическое программирование):
 * вдоль оси «along» на каждом шаге поперечная координата меняется не
 * больше чем на 1, а штраф за изгиб не даёт пути скакать по шуму
 */
function tracePath(
  z: Grid,
  along: 'u' | 'v',
  alongRange: [number, number],
  crossRange: (a: number) => [number, number],
  blocked?: (a: number, c: number) => boolean
): Trace {
  const [a0, a1] = alongRange;
  // Логарифм ограничивает вклад одной яркой точки (родинка, тень), но
  // сохраняет стремление пути держаться середины линии
  const value = (a: number, c: number) => {
    if (blocked?.(a, c)) return -5;
    const [lo, hi] = crossRange(a);
    if (c < lo || c > hi) return -50;
    const raw = along === 'u' ? at(z, a, c) : at(z, c, a);
    return raw > 0 ? Math.log1p(raw) : raw;
  };
  const crossMax = along === 'u' ? GRID_V : GRID_U;
  const steps = a1 - a0 + 1;
  const score = new Float32Array(steps * crossMax);
  const back = new Int16Array(steps * crossMax);
  for (let c = 0; c < crossMax; c++) score[c] = value(a0, c);
  for (let s = 1; s < steps; s++) {
    for (let c = 0; c < crossMax; c++) {
      let best = -Infinity, arg = c;
      for (let dc = -1; dc <= 1; dc++) {
        const pc = c + dc;
        if (pc < 0 || pc >= crossMax) continue;
        const sc = score[(s - 1) * crossMax + pc] - (dc ? 0.15 : 0);
        if (sc > best) { best = sc; arg = pc; }
      }
      score[s * crossMax + c] = best + value(a0 + s, c);
      back[s * crossMax + c] = arg;
    }
  }
  let end = 0;
  for (let c = 1; c < crossMax; c++) if (score[(steps - 1) * crossMax + c] > score[(steps - 1) * crossMax + end]) end = c;
  const cross = new Array<number>(steps);
  cross[steps - 1] = end;
  for (let s = steps - 1; s > 0; s--) cross[s - 1] = back[s * crossMax + cross[s]];
  // Сила линии — максимум в пределах клетки от пути (путь дискретный)
  const zz = cross.map((c, s) => {
    let best = -Infinity;
    for (let dc = -1; dc <= 1; dc++) {
      const cc = Math.min(crossMax - 1, Math.max(0, c + dc));
      best = Math.max(best, along === 'u' ? at(z, a0 + s, cc) : at(z, cc, a0 + s));
    }
    return best;
  });
  return { cross, z: zz, from: a0 };
}

const ON = 1.6;   // точка относится к линии
/** Глубокая линия темнее окружающей кожи хотя бы на столько (доля яркости) */
const DEEP_CONTRAST = 0.05;
/** Резкость (мелкие детали к крупным): ниже — снимок размыт */
const BLURRY_SHARPNESS = 1.1;
const SOFT_SHARPNESS = 1.3;
/** Слабее этого складка неотличима от рисунка кожи */
const MIN_CONTRAST = 0.027;

function smooth(xs: number[], r: number): number[] {
  return xs.map((_, i) => {
    let s = 0, n = 0;
    for (let k = -r; k <= r; k++) if (xs[i + k] !== undefined) { s += xs[i + k]; n++; }
    return s / n;
  });
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

interface LineStats {
  found: boolean;
  start: number;
  end: number;
  strength: number;
  broken: boolean;
  chained: boolean;
  curved: boolean;
}

function lineStats(t: Trace, minLength: number): LineStats {
  const zs = smooth(t.z, 2);
  // Точка принадлежит линии, если отклик заметен и на фоне самой линии:
  // иначе слабый шум у её концов «удлиняет» линию туда, где её нет
  const sorted = [...zs].sort((a, b) => a - b);
  const peak = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
  const onLevel = Math.max(ON, peak * 0.25);
  const on = zs.map(z => z >= onLevel);
  // Протяжённость линии: от первой до последней устойчиво яркой точки
  let start = on.findIndex((x, i) => x && on[i + 1] && on[i + 2]);
  let end = on.length - 1 - [...on].reverse().findIndex((x, i, arr) => x && arr[i + 1] && arr[i + 2]);
  if (start < 0 || end <= start) return { found: false, start: 0, end: 0, strength: median(t.z), broken: false, chained: false, curved: false };
  const span = end - start + 1;
  const inside = t.z.slice(start, end + 1);
  const strength = median(inside);
  const coverage = on.slice(start, end + 1).filter(Boolean).length / span;
  const found = span >= minLength && coverage >= 0.55 && strength >= ON;

  // Разрыв — провал заметной длины, по обе стороны от которого линия сильная
  let broken = false;
  const gapMin = Math.max(k(5), Math.round(span * 0.07));
  const gapLevel = Math.max(ON, strength * 0.2);
  for (let i = start, run = 0; i <= end; i++) {
    if (zs[i] < gapLevel) run++;
    else {
      if (run >= gapMin) {
        const left = on.slice(start, i - run).filter(Boolean).length;
        const right = on.slice(i, end + 1).filter(Boolean).length;
        if (left >= span * 0.12 && right >= span * 0.12) broken = true;
      }
      run = 0;
    }
  }

  // «Цепочка» — линия есть на всём протяжении, но состоит из звеньев:
  // её сила регулярно проваливается между соседними яркими участками
  const raw = smooth(t.z.slice(start, end + 1), 1);
  let links = 0;
  for (let i = 1; i < raw.length - 1; i++) {
    if (raw[i] > raw[i - 1] || raw[i] > raw[i + 1]) continue;
    const left = Math.max(...raw.slice(Math.max(0, i - k(6)), i));
    const right = Math.max(...raw.slice(i + 1, i + k(6) + 1));
    if (raw[i] < 0.7 * Math.min(left, right)) links++;
  }
  const chained = !broken && links >= Math.max(4, span / 22);

  // Изгиб — насколько путь отходит от прямой между концами
  const c0 = t.cross[start], c1 = t.cross[end];
  let maxDev = 0;
  for (let i = start; i <= end; i++) {
    const chord = c0 + ((c1 - c0) * (i - start)) / Math.max(1, end - start);
    maxDev = Math.max(maxDev, Math.abs(t.cross[i] - chord));
  }
  const curved = maxDev / span > 0.07;

  return { found, start, end, strength, broken, chained, curved };
}

/**
 * Раздвоение на конце: от основной линии отходит ветвь — вторая складка,
 * которая начинается вплотную к линии и постепенно от неё отдаляется
 * (так соседняя линия, идущая параллельно, за ветвь не считается)
 */
function hasFork(z: Grid, t: Trace, s: LineStats, along: 'u' | 'v', side: 'start' | 'end'): boolean {
  const len = s.end - s.start + 1;
  const from = side === 'end' ? s.end - Math.round(len * 0.3) : s.start;
  const to = side === 'end' ? s.end : s.start + Math.round(len * 0.3);
  const crossMax = along === 'u' ? GRID_V : GRID_U;
  const read = (a: number, c: number) => (along === 'u' ? at(z, a, c) : at(z, c, a));
  for (const dir of [-1, 1]) {
    let run = 0, lastD = 0;
    for (let i = from; i <= to; i++) {
      const a = t.from + i, c = t.cross[i];
      const main = read(a, c);
      // Ближайший к линии пик с этой стороны
      let bestD = 0, best = 0;
      for (let d = k(3); d <= k(22); d++) {
        const cc = c + dir * d;
        if (cc < 0 || cc >= crossMax) break;
        const val = read(a, cc);
        if (val > best) { best = val; bestD = d; }
      }
      const isBranch = main >= ON && best >= Math.max(ON * 1.4, main * 0.28) &&
        (run === 0 ? bestD <= k(7) : bestD >= lastD - 1 && bestD <= lastD + 3);
      if (isBranch) {
        run++;
        lastD = bestD;
        if (run >= k(6) && lastD >= k(8)) return true;
      } else {
        run = 0;
      }
    }
  }
  return false;
}

function traitsOf(s: LineStats, contrast: number, fork: boolean, curveMatters = true): LineTrait[] {
  const traits: LineTrait[] = [contrast >= DEEP_CONTRAST ? 'deep' : 'shallow'];
  if (curveMatters) traits.push(s.curved ? 'curved' : 'straight');
  if (s.broken) traits.push('broken');
  else if (s.chained) traits.push('chained');
  if (fork) traits.push('forked');
  return traits;
}

// ==================== ВСЁ ВМЕСТЕ ====================

/**
 * Разбор ладони. landmarks — 21 точка MediaPipe в пикселях снимка.
 */
export function analyzePalm(img: RgbaImage, landmarks: Point[]): PalmAnalysis {
  const issues: PalmQualityIssue[] = [];
  const measurements = measureHand(landmarks);
  const toImage = palmQuad(landmarks);

  if (dist(landmarks[0], landmarks[9]) < 140) issues.push('too_small');

  // Ладонь в стандартной сетке. Клетка сетки на большом снимке занимает
  // несколько пикселей — усредняем их, а не берём один (меньше шума)
  const cellPx = dist(toImage(0, 0.5), toImage(1, 0.5)) / GRID_U;
  const sub = Math.max(1, Math.min(4, Math.round(cellPx)));
  const gray = new Float32Array(GRID_U * GRID_V);
  for (let v = 0; v < GRID_V; v++) {
    for (let u = 0; u < GRID_U; u++) {
      let sum = 0;
      for (let sy = 0; sy < sub; sy++) {
        for (let sx = 0; sx < sub; sx++) {
          const p = toImage((u + (sx + 0.5) / sub - 0.5) / (GRID_U - 1), (v + (sy + 0.5) / sub - 0.5) / (GRID_V - 1));
          sum += sampleGray(img, p.x, p.y);
        }
      }
      gray[v * GRID_U + u] = sum / (sub * sub);
    }
  }
  const brightness = median(Array.from(gray));
  if (brightness < 55) issues.push('too_dark');
  if (brightness > 235) issues.push('too_bright');

  const flat = flatField(gray);

  // Резкость: доля мелких деталей (перепадов между соседними клетками)
  // относительно перепадов на масштабе нескольких клеток — не зависит ни
  // от яркости, ни от освещения. У размытого снимка мелкие детали гаснут
  const coarse = gaussBlur(flat, 2 * K);
  let fine = 0, broad = 0;
  for (let v = 2; v < GRID_V - 2; v++) {
    for (let u = 2; u < GRID_U - 2; u++) {
      fine += Math.abs(at(flat, u, v) - at(flat, u - 1, v)) + Math.abs(at(flat, u, v) - at(flat, u, v - 1));
      broad += Math.abs(at(coarse, u, v) - at(coarse, u - 2, v)) + Math.abs(at(coarse, u, v) - at(coarse, u, v - 2));
    }
  }
  const sharpness = broad > 0 ? fine / broad : 0;
  if (sharpness < BLURRY_SHARPNESS) issues.push('blurry');
  const soft = sharpness < SOFT_SHARPNESS;
  const rawH = ridgeResponse(flat, 'h');
  const rawV = ridgeResponse(flat, 'v');
  const rawA = ridgeResponse(flat, 'any');
  // Для глубины — насколько складка темнее кожи по обе стороны от неё
  const smoothFlat = boxBlur(boxBlur(flat, 1, true), 1, false);
  const zH = normalize(rawH);
  const zV = normalize(rawV);
  const zA = normalize(rawA);

  // Глубина линии — насколько она темнее кожи по обе стороны, в долях
  // яркости (после выравнивания освещения)
  const depthProfile = (t: Trace, st: LineStats, along: 'u' | 'v'): number[] => {
    const crossMax = along === 'u' ? GRID_V : GRID_U;
    const read = (a: number, c: number) => {
      const cc = Math.min(crossMax - 1, Math.max(0, c));
      return along === 'u' ? at(smoothFlat, a, cc) : at(smoothFlat, cc, a);
    };
    const depths: number[] = [];
    const side = k(5);
    for (let i = st.start; i <= st.end; i++) {
      const a = t.from + i, c = t.cross[i];
      const center = Math.min(read(a, c - 1), read(a, c), read(a, c + 1));
      const skin = (read(a, c - side) + read(a, c + side)) / 2;
      depths.push(Math.max(0, skin - center));
    }
    return depths;
  };

  /** «Цепочка» по профилю темноты: складка регулярно прерывается звеньями */
  const isChain = (depths: number[]) => {
    const d = smooth(depths, 1);
    const w = k(6);
    let links = 0;
    for (let i = 1; i < d.length - 1; i++) {
      if (d[i] > d[i - 1] || d[i] > d[i + 1]) continue;
      const left = Math.max(...d.slice(Math.max(0, i - w), i));
      const right = Math.max(...d.slice(i + 1, i + w + 1));
      if (d[i] < 0.55 * Math.min(left, right)) links++;
    }
    return links >= Math.max(4, d.length / 22);
  };

  const V = (f: number) => Math.round(f * (GRID_V - 1));
  const U = (f: number) => Math.round(f * (GRID_U - 1));

  // Линия сердца — верхняя поперечная, от края под мизинцем к указательному
  const heartT = tracePath(zH, 'u', [U(0.06), U(0.97)], () => [V(0.06), V(0.38)]);
  const heart = lineStats(heartT, GRID_U * 0.3);

  // Линия ума — ниже линии сердца
  const heartAt = (a: number) => heartT.cross[a - heartT.from] ?? 0;
  const headT = tracePath(zH, 'u', [U(0.02), U(0.85)], a => [Math.max(V(0.22), heartAt(a) + k(10)), V(0.62)]);
  const head = lineStats(headT, GRID_U * 0.3);

  // Линия жизни — дуга вокруг основания большого пальца, идёт сверху вниз
  const lifeT = tracePath(zA, 'v', [V(0.22), V(0.96)], () => [U(0.0), U(0.55)]);
  const life = lineStats(lifeT, GRID_V * 0.3);

  // Линия судьбы — вертикальная по центру ладони, есть не у всех
  const fateT = tracePath(zV, 'v', [V(0.25), V(0.98)], () => [U(0.32), U(0.72)],
    (a, c) => Math.abs(c - (lifeT.cross[a - lifeT.from] ?? -99)) < k(8));
  const fate = lineStats(fateT, GRID_V * 0.25);

  const pathOf = (t: Trace, s: LineStats, along: 'u' | 'v'): Point[] => {
    if (!s.found) return [];
    const pts: Point[] = [];
    const step = Math.max(1, Math.round((s.end - s.start) / 24));
    for (let i = s.start; i <= s.end; i += step) {
      const a = t.from + i, c = t.cross[i];
      const p = along === 'u' ? toImage(a / (GRID_U - 1), c / (GRID_V - 1)) : toImage(c / (GRID_U - 1), a / (GRID_V - 1));
      pts.push({ x: +(p.x / img.width).toFixed(4), y: +(p.y / img.height).toFixed(4) });
    }
    return pts;
  };

  // Линии, которых не нашли, описываем как тонкие, едва заметные
  const finding = (
    id: PalmLineId, t: Trace, st: LineStats, raw: Grid, z: Grid, along: 'u' | 'v',
    opts: { fork: boolean; curve: boolean; fallback: LineTrait[] }
  ): LineFinding => {
    const depths = st.found ? depthProfile(t, st, along) : [];
    const contrast = median(depths);
    if (contrast < MIN_CONTRAST) st = { ...st, found: false };
    if (st.found && !st.broken) st = { ...st, chained: st.chained || isChain(depths) };
    // Ветвь отходит под углом — ищем её по отклику без учёта направления
    const fork = opts.fork && st.found && hasFork(zA, t, st, along, 'end');
    return {
      id,
      found: st.found,
      strength: st.strength,
      contrast,
      traits: st.found ? traitsOf(st, contrast, fork, opts.curve) : opts.fallback,
      path: pathOf(t, st, along),
    };
  };
  const lines: LineFinding[] = [
    finding('heart_line', heartT, heart, rawH, zH, 'u', { fork: true, curve: true, fallback: ['shallow'] }),
    finding('head_line', headT, head, rawH, zH, 'u', { fork: true, curve: true, fallback: ['shallow'] }),
    finding('life_line', lifeT, life, rawA, zA, 'v', { fork: true, curve: false, fallback: ['shallow'] }),
    finding('fate_line', fateT, fate, rawV, zV, 'v', { fork: false, curve: false, fallback: [] }),
  ];

  if (!lines[0].found && !lines[1].found && !lines[2].found) issues.push('no_lines');

  return {
    features: {
      hand: classifyHand(measurements),
      heart_line: lines[0].traits,
      head_line: lines[1].traits,
      life_line: lines[2].traits,
      fate_line: lines[3].found ? lines[3].traits : 'none',
    },
    measurements,
    lines,
    issues,
    soft,
  };
}
