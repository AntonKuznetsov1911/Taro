// Линии ладони нейросетью.
//
// Модель — U-Net из открытого проекта «Fortune On Your Hand: View-Invariant
// Machine Palmistry» (github.com/yeonsumia/palmistry, лицензия Apache 2.0),
// обученная на размеченных фотографиях ладоней (набор PLSU). Здесь —
// подготовка снимка ровно так, как при обучении, и чтение четырёх главных
// линий из карты, которую выдаёт сеть. Модуль не зависит от платформы:
// сама сеть запускается в palmLineRunner.web.ts.

import type { LineTrait, PalmFeatures, PalmLineId } from './palmReading';
import {
  classifyHand,
  measureHand,
  LineFinding,
  PalmAnalysis,
  PalmQualityIssue,
  Point,
  RgbaImage,
} from './palmVision';

export const NET_SIZE = 256;

/**
 * Положения 21 точки руки в «стандартной позе» (доли ширины и высоты
 * кадра) — из исходного проекта. Снимок отражается по горизонтали, и
 * рука переносится гомографией так, чтобы её точки совпали с этими.
 */
const TARGET: Array<[number, number]> = [
  [0.48203104734420776, 0.9063420295715332], [0.6043621301651001, 0.8119394183158875],
  [0.6763232946395874, 0.6790258884429932], [0.7340714335441589, 0.5716733932495117],
  [0.7896472215652466, 0.5098430514335632], [0.5655680298805237, 0.5117031931877136],
  [0.5979393720626831, 0.36575648188591003], [0.6135331392288208, 0.2713503837585449],
  [0.6196483373641968, 0.19251111149787903], [0.4928809702396393, 0.4982593059539795],
  [0.4899863600730896, 0.3213786780834198], [0.4894656836986542, 0.21283167600631714],
  [0.48334982991218567, 0.12900274991989136], [0.4258815348148346, 0.5180916786193848],
  [0.4033462107181549, 0.3581996262073517], [0.3938145041465759, 0.2616880536079407],
  [0.38608720898628235, 0.1775170862674713], [0.36368662118911743, 0.5642163157463074],
  [0.33553171157836914, 0.44737303256988525], [0.3209102153778076, 0.3749568462371826],
  [0.31213682889938354, 0.3026996850967407],
].map(([x, y]) => [1 - x, y] as [number, number]);

const PALM_POINTS = [0, 1, 2, 5, 9, 13, 17];

// ==================== ГОМОГРАФИЯ ====================

export type Homography = number[]; // 3×3 по строкам, h[8] = 1

/** Гомография по парам точек методом наименьших квадратов (DLT, h33 = 1) */
export function fitHomography(src: Point[], dst: Point[]): Homography {
  // Нормализация координат улучшает обусловленность
  const norm = (pts: Point[]) => {
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const d = pts.reduce((s, p) => s + Math.hypot(p.x - cx, p.y - cy), 0) / pts.length || 1;
    const k = Math.SQRT2 / d;
    return { T: [k, 0, -k * cx, 0, k, -k * cy, 0, 0, 1], pts: pts.map(p => ({ x: (p.x - cx) * k, y: (p.y - cy) * k })) };
  };
  const a = norm(src), b = norm(dst);
  // 2n уравнений, 8 неизвестных: нормальные уравнения AᵀA h = Aᵀb
  const AtA = Array.from({ length: 8 }, () => new Array(8).fill(0));
  const Atb = new Array(8).fill(0);
  for (let i = 0; i < a.pts.length; i++) {
    const { x, y } = a.pts[i];
    const { x: u, y: v } = b.pts[i];
    const rows: Array<[number[], number]> = [
      [[x, y, 1, 0, 0, 0, -u * x, -u * y], u],
      [[0, 0, 0, x, y, 1, -v * x, -v * y], v],
    ];
    for (const [r, rhs] of rows) {
      for (let p = 0; p < 8; p++) {
        Atb[p] += r[p] * rhs;
        for (let q = 0; q < 8; q++) AtA[p][q] += r[p] * r[q];
      }
    }
  }
  const h = solve(AtA, Atb);
  const Hn = [...h, 1];
  // H = Tb⁻¹ · Hn · Ta
  return mul(mul(inv3(b.T), Hn), a.T).map((v, _, arr) => v / arr[8]);
}

function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

function mul(A: number[], B: number[]): number[] {
  const C = new Array(9).fill(0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) C[i * 3 + j] += A[i * 3 + k] * B[k * 3 + j];
  return C;
}

export function inv3(m: number[]): number[] {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map(v => v / det);
}

export function applyH(H: number[], x: number, y: number): Point {
  const w = H[6] * x + H[7] * y + H[8];
  return { x: (H[0] * x + H[1] * y + H[2]) / w, y: (H[3] * x + H[4] * y + H[5]) / w };
}

// ==================== ПОДГОТОВКА СНИМКА ====================

export interface NetInput {
  tensor: Float32Array; // 1×3×256×256, RGB в [0, 1]
  /** Из «стандартной позы» (пиксели исходного размера) в отражённый снимок */
  canonToFlipped: Homography;
}

/** HSV как в OpenCV: H 0–180, S и V 0–255 */
function isSkin(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const v = max;
  const s = max === 0 ? 0 : ((max - min) / max) * 255;
  let h = 0;
  if (max !== min) {
    if (max === r) h = (60 * (g - b)) / (max - min);
    else if (max === g) h = 120 + (60 * (b - r)) / (max - min);
    else h = 240 + (60 * (r - g)) / (max - min);
    if (h < 0) h += 360;
  }
  h /= 2;
  return h <= 50 && s >= 20 && v >= 80;
}

/**
 * Яркость и цвет ладони приводятся к эталонной коже: сеть и отделение
 * фона по цвету рассчитаны на светлый, нейтрально освещённый снимок, а
 * в комнате фото часто тёмное или жёлтое
 */
const REFERENCE_SKIN = [212, 180, 168];

function palmColorGain(img: RgbaImage, landmarks: Point[]): number[] {
  const poly = PALM_POINTS.map(i => landmarks[i]);
  const xs = poly.map(p => p.x), ys = poly.map(p => p.y);
  const inside = (x: number, y: number) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      if ((poly[i].y > y) !== (poly[j].y > y) && x < ((poly[j].x - poly[i].x) * (y - poly[i].y)) / (poly[j].y - poly[i].y) + poly[i].x) c = !c;
    }
    return c;
  };
  const ch: number[][] = [[], [], []];
  const x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.min(img.width - 1, Math.ceil(Math.max(...xs)));
  const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(img.height - 1, Math.ceil(Math.max(...ys)));
  const step = Math.max(1, Math.round((x1 - x0) / 60));
  for (let y = y0; y <= y1; y += step) {
    for (let x = x0; x <= x1; x += step) {
      if (!inside(x, y)) continue;
      const i = (y * img.width + x) * 4;
      for (let c = 0; c < 3; c++) ch[c].push(img.data[i + c]);
    }
  }
  if (ch[0].length < 20) return [1, 1, 1];
  return ch.map((vals, c) => {
    const sorted = vals.sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)] || 1;
    return Math.min(2.5, Math.max(0.6, REFERENCE_SKIN[c] / med));
  });
}

/**
 * Снимок → вход сети: отражение, перенос руки в стандартную позу,
 * фон (всё, что не похоже на кожу) — белый, размер 256×256
 */
export function prepareNetInput(img: RgbaImage, landmarks: Point[]): NetInput {
  const { width: W, height: H } = img;
  const flipped = landmarks.map(p => ({ x: W - 1 - p.x, y: p.y }));
  const target = TARGET.map(([x, y]) => ({ x: x * W, y: y * H }));
  // Подгоняем по точкам самой ладони (запястье, основание большого пальца,
  // суставы у оснований пальцев): от них зависит, где окажутся линии, а
  // положение кончиков пальцев у всех разное
  const toCanon = fitHomography(PALM_POINTS.map(i => flipped[i]), PALM_POINTS.map(i => target[i]));
  const canonToFlipped = inv3(toCanon);

  const N = NET_SIZE;
  const tensor = new Float32Array(3 * N * N);
  const px = (x: number, y: number, c: number) => img.data[(y * W + x) * 4 + c];
  const gain = palmColorGain(img, landmarks);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      // Ближайший пиксель уменьшения (как resize NEAREST после warpPerspective)
      const cx = Math.floor((i * W) / N), cy = Math.floor((j * H) / N);
      const s = applyH(canonToFlipped, cx, cy);
      // Отражённая координата → исходная; края повторяются (BORDER_REPLICATE)
      const fx = Math.min(W - 1.001, Math.max(0, W - 1 - s.x));
      const fy = Math.min(H - 1.001, Math.max(0, s.y));
      const x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
      const rgb = [0, 1, 2].map(c =>
        px(x0, y0, c) * (1 - ax) * (1 - ay) + px(x0 + 1, y0, c) * ax * (1 - ay) +
        px(x0, y0 + 1, c) * (1 - ax) * ay + px(x0 + 1, y0 + 1, c) * ax * ay
      ).map((v, c) => Math.min(255, Math.round(v * gain[c])));
      const background = !isSkin(rgb[0], rgb[1], rgb[2]) || rgb[1] <= 10;
      for (let c = 0; c < 3; c++) tensor[c * N * N + j * N + i] = background ? 1 : rgb[c] / 255;
    }
  }
  return { tensor, canonToFlipped };
}

// ==================== ЛИНИИ ИЗ КАРТЫ СЕТИ ====================

const N = NET_SIZE;
/** Точки стандартной позы в пикселях карты 256×256 */
const T = TARGET.map(([x, y]) => ({ x: x * N, y: y * N }));

/** Утончение маски до линий толщиной в пиксель (Чжан — Суэнь) */
export function thin(mask: Uint8Array): Uint8Array {
  const m = mask.slice();
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= N || y >= N ? 0 : m[y * N + x]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const step of [0, 1]) {
      const del: number[] = [];
      for (let y = 1; y < N - 1; y++) {
        for (let x = 1; x < N - 1; x++) {
          if (!m[y * N + x]) continue;
          const p = [at(x, y - 1), at(x + 1, y - 1), at(x + 1, y), at(x + 1, y + 1), at(x, y + 1), at(x - 1, y + 1), at(x - 1, y), at(x - 1, y - 1)];
          const b = p.reduce((a, v) => a + v, 0);
          if (b < 2 || b > 6) continue;
          let a = 0;
          for (let i = 0; i < 8; i++) if (!p[i] && p[(i + 1) % 8]) a++;
          if (a !== 1) continue;
          if (step === 0 ? p[0] * p[2] * p[4] || p[2] * p[4] * p[6] : p[0] * p[2] * p[6] || p[0] * p[4] * p[6]) continue;
          del.push(y * N + x);
        }
      }
      for (const i of del) m[i] = 0;
      if (del.length) changed = true;
    }
  }
  return m;
}

interface Seg {
  pts: Point[];
  a: number; // узел в начале
  b: number; // узел в конце
  /** Перемычка через разрыв линии (не найдена сетью, а достроена) */
  gap?: boolean;
}

/**
 * Куски одной линии, разделённые коротким промежутком, соединяются
 * «перемычкой» — так линия с разрывом читается целиком, а сам разрыв
 * становится её признаком
 */
function bridgeGaps(segs: Seg[], maxGap: number): Seg[] {
  const degree = new Map<number, number>();
  for (const sg of segs) for (const n of [sg.a, sg.b]) degree.set(n, (degree.get(n) ?? 0) + 1);
  const ends: Array<{ node: number; p: Point; dir: Point; seg: number }> = [];
  segs.forEach((sg, i) => {
    if (sg.pts.length < 5) return;
    for (const atEnd of [false, true]) {
      const node = atEnd ? sg.b : sg.a;
      if (degree.get(node) !== 1) continue;
      const p = atEnd ? sg.pts[sg.pts.length - 1] : sg.pts[0];
      const q = atEnd ? sg.pts[Math.max(0, sg.pts.length - 6)] : sg.pts[Math.min(sg.pts.length - 1, 5)];
      const l = Math.hypot(p.x - q.x, p.y - q.y) || 1;
      ends.push({ node, p, dir: { x: (p.x - q.x) / l, y: (p.y - q.y) / l }, seg: i });
    }
  });
  const out = [...segs];
  for (let i = 0; i < ends.length; i++) {
    for (let j = i + 1; j < ends.length; j++) {
      const e = ends[i], f = ends[j];
      if (e.seg === f.seg) continue;
      const vx = f.p.x - e.p.x, vy = f.p.y - e.p.y;
      const d = Math.hypot(vx, vy);
      if (d < 2 || d > maxGap) continue;
      // Оба конца смотрят друг на друга и в одну сторону
      const toF = (vx * e.dir.x + vy * e.dir.y) / d;
      const toE = -(vx * f.dir.x + vy * f.dir.y) / d;
      if (toF < 0.85 || toE < 0.85) continue;
      const steps = Math.ceil(d);
      const pts = Array.from({ length: steps + 1 }, (_, k) => ({ x: e.p.x + (vx * k) / steps, y: e.p.y + (vy * k) / steps }));
      out.push({ pts, a: e.node, b: f.node, gap: true });
    }
  }
  return out;
}

/**
 * Скелет → граф: узлы — концы и развилки, рёбра — отрезки линий между ними
 */
function skeletonGraph(sk: Uint8Array): { segs: Seg[]; nodePos: Point[] } {
  const idx = (x: number, y: number) => y * N + x;
  const nb = (x: number, y: number) => {
    const out: Array<[number, number]> = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < N && yy < N && sk[idx(xx, yy)]) out.push([xx, yy]);
    }
    return out;
  };
  // Узлы: концы (1 сосед) и развилки (3+); соседние пиксели развилки — один узел
  const nodeOf = new Int32Array(N * N).fill(-1);
  const nodePos: Point[] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!sk[idx(x, y)] || nodeOf[idx(x, y)] >= 0) continue;
    const deg = nb(x, y).length;
    if (deg === 2) continue;
    const id = nodePos.length;
    const stack: Array<[number, number]> = [[x, y]];
    let sx = 0, sy = 0, n = 0;
    nodeOf[idx(x, y)] = id;
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      sx += cx; sy += cy; n++;
      if (deg === 1) break;
      for (const [nx, ny] of nb(cx, cy)) {
        if (nodeOf[idx(nx, ny)] < 0 && nb(nx, ny).length >= 3) { nodeOf[idx(nx, ny)] = id; stack.push([nx, ny]); }
      }
    }
    nodePos.push({ x: sx / n, y: sy / n });
  }
  // Рёбра: идём от каждого узла по пикселям степени 2 до следующего узла
  const used = new Uint8Array(N * N);
  const segs: Seg[] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const start = nodeOf[idx(x, y)];
    if (start < 0) continue;
    for (const [nx0, ny0] of nb(x, y)) {
      if (nodeOf[idx(nx0, ny0)] === start || used[idx(nx0, ny0)]) continue;
      const pts: Point[] = [{ x, y }];
      let px = x, py = y, cx = nx0, cy = ny0;
      let end = -1;
      for (let guard = 0; guard < N * 4; guard++) {
        pts.push({ x: cx, y: cy });
        if (nodeOf[idx(cx, cy)] >= 0) { end = nodeOf[idx(cx, cy)]; break; }
        used[idx(cx, cy)] = 1;
        const next = nb(cx, cy).find(([qx, qy]) => !(qx === px && qy === py) && !used[idx(qx, qy)] && !(qx === x && qy === y && pts.length < 3));
        if (!next) break;
        px = cx; py = cy; [cx, cy] = next;
      }
      if (end >= 0 && end !== start && pts.length >= 2) segs.push({ pts, a: start, b: end });
      else if (end === start && pts.length > 6) segs.push({ pts, a: start, b: start });
    }
  }
  // Каждое ребро найдено дважды (с обоих концов) — убираем повторы
  const seen = new Set<string>();
  return {
    nodePos,
    segs: segs.filter(sg => {
      const mid = sg.pts[Math.floor(sg.pts.length / 2)];
      const key = `${Math.min(sg.a, sg.b)}-${Math.max(sg.a, sg.b)}-${mid.x},${mid.y}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  };
}

interface Candidate {
  pts: Point[];
  segs: number[];
  /** Узлы-развилки внутри пути и на его концах */
  nodes: number[];
}

/** Все пути по графу длиной до 4 рёбер без резких поворотов */
function candidatePaths(segs: Seg[], nodePos: Point[]): Candidate[] {
  const byNode = new Map<number, number[]>();
  segs.forEach((sg, i) => {
    for (const n of [sg.a, sg.b]) byNode.set(n, [...(byNode.get(n) ?? []), i]);
  });
  const oriented = (i: number, fromNode: number): Point[] => (segs[i].a === fromNode ? segs[i].pts : [...segs[i].pts].reverse());
  const dirAt = (pts: Point[], end: boolean): Point => {
    const k = Math.min(6, pts.length - 1);
    const p = end ? pts[pts.length - 1] : pts[0];
    const q = end ? pts[pts.length - 1 - k] : pts[k];
    const len = Math.hypot(p.x - q.x, p.y - q.y) || 1;
    return end ? { x: (p.x - q.x) / len, y: (p.y - q.y) / len } : { x: (q.x - p.x) / len, y: (q.y - p.y) / len };
  };
  const out: Candidate[] = [];
  const walk = (pts: Point[], usedSegs: number[], nodes: number[], node: number) => {
    out.push({ pts, segs: usedSegs, nodes });
    if (usedSegs.length >= 4) return;
    const dIn = dirAt(pts, true);
    for (const j of byNode.get(node) ?? []) {
      if (usedSegs.includes(j)) continue;
      const seg = oriented(j, node);
      const dOut = dirAt(seg, false);
      // Линия ладони плавная: поворот на развилке не больше ~60°
      if (dIn.x * dOut.x + dIn.y * dOut.y < 0.5) continue;
      const nextNode = segs[j].a === node ? segs[j].b : segs[j].a;
      walk([...pts, ...seg.slice(1)], [...usedSegs, j], [...nodes, nextNode], nextNode);
    }
  };
  segs.forEach((sg, i) => {
    walk(sg.pts, [i], [sg.a, sg.b], sg.b);
    walk([...sg.pts].reverse(), [i], [sg.b, sg.a], sg.a);
  });
  void nodePos;
  return out.filter(c => c.pts.length >= 8);
}

function pathLength(pts: Point[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return l;
}

function isCurved(pts: Point[]): boolean {
  const a = pts[0], b = pts[pts.length - 1];
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  let dev = 0;
  for (const p of pts) dev = Math.max(dev, Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / len);
  return dev / len > 0.08;
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** Яркость (с упором на зелёный канал — в нём складки контрастнее) */
function grayAt(img: RgbaImage, x: number, y: number): number {
  const xi = Math.min(img.width - 1, Math.max(0, Math.round(x)));
  const yi = Math.min(img.height - 1, Math.max(0, Math.round(y)));
  const i = (yi * img.width + xi) * 4;
  return 0.25 * img.data[i] + 0.6 * img.data[i + 1] + 0.15 * img.data[i + 2];
}

const DEEP_CONTRAST = 0.07;
const LINE_PROB = 0.3;

/**
 * Разбор ладони по карте сети. prob — вероятность линии (256×256) в
 * стандартной позе; img и landmarks — исходный снимок и точки руки.
 */
export function analyzeLineMap(
  prob: Float32Array,
  img: RgbaImage,
  landmarks: Point[],
  canonToFlipped: Homography
): PalmAnalysis {
  const { width: W, height: H } = img;
  const issues: PalmQualityIssue[] = [];
  const measurements = measureHand(landmarks);
  const palmLenPx = Math.hypot(landmarks[0].x - landmarks[9].x, landmarks[0].y - landmarks[9].y);
  if (palmLenPx < 140) issues.push('too_small');

  // Геометрия ладони в стандартной позе (большой палец слева, мизинец справа)
  const palmW = T[17].x - T[5].x;
  const palmH = T[0].y - T[9].y;
  const baseY = (x: number) => T[5].y + ((T[17].y - T[5].y) * (x - T[5].x)) / (T[17].x - T[5].x);
  // Промежуток между большим и указательным пальцами — отсюда начинаются
  // линии ума и жизни
  const web = { x: T[5].x - 0.13 * palmW, y: T[5].y + 0.1 * palmH };

  const mask = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) mask[i] = prob[i] >= LINE_PROB ? 1 : 0;
  const graph = skeletonGraph(thin(mask));
  const segs = bridgeGaps(graph.segs, 0.22 * palmW);
  const nodePos = graph.nodePos;
  const cands = candidatePaths(segs, nodePos).map(c => {
    const xs = c.pts.map(p => p.x), ys = c.pts.map(p => p.y);
    const first = c.pts[0], last = c.pts[c.pts.length - 1];
    return {
      ...c,
      len: pathLength(c.pts),
      minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys),
      meanY: ys.reduce((a, b) => a + b, 0) / ys.length,
      fromWeb: Math.min(Math.hypot(first.x - web.x, first.y - web.y), Math.hypot(last.x - web.x, last.y - web.y)),
      dx: Math.abs(last.x - first.x), dy: Math.abs(last.y - first.y),
    };
  });
  type C = (typeof cands)[number];
  const nearWeb = 0.45 * palmW;
  const best = (filter: (c: C) => boolean, score: (c: C) => number) =>
    cands.filter(filter).sort((a, b) => score(b) - score(a))[0] ?? null;

  // Линия сердца: под основаниями пальцев, тянется к краю под мизинцем
  const heart = best(
    c => c.dx > c.dy * 1.2 && c.maxX >= T[13].x && c.minY >= baseY(c.maxX) - 0.05 * palmH - 4 &&
      c.meanY <= baseY((c.minX + c.maxX) / 2) + 0.32 * palmH && c.fromWeb > 0.25 * palmW && c.len >= 0.35 * palmW,
    c => c.len - Math.abs(c.meanY - baseY((c.minX + c.maxX) / 2) - 0.12 * palmH)
  );
  // Линия ума: от промежутка между большим и указательным — поперёк ладони
  const head = best(
    c => c.fromWeb <= nearWeb && c.dx >= c.dy * 0.6 && c.maxX >= web.x + 0.35 * palmW &&
      (!heart || c.meanY > heart.meanY + 2),
    c => c.len
  );
  // Линия жизни: от того же промежутка вниз, огибая большой палец
  const life = best(
    c => c.fromWeb <= nearWeb && c.dy > c.dx && c.maxY >= web.y + 0.25 * palmH && c.maxX <= T[9].x + 0.25 * palmW,
    c => c.len
  );
  // Линия судьбы: вертикальная по центру ладони, не совпадающая с линией жизни
  const lifeSegs = new Set(life?.segs ?? []);
  const fate = best(
    c => c.dy > c.dx * 1.5 && c.fromWeb > 0.3 * palmW && c.len >= 0.2 * palmH &&
      (c.minX + c.maxX) / 2 >= T[5].x && (c.minX + c.maxX) / 2 <= T[13].x + 0.1 * palmW &&
      c.maxY >= T[9].y + 0.45 * palmH && !c.segs.some(sg => lifeSegs.has(sg)),
    c => c.len
  );

  // Из стандартной позы обратно на снимок
  const toImage = (p: Point): Point => {
    const s = applyH(canonToFlipped, (p.x * W) / N, (p.y * H) / N);
    return { x: W - 1 - s.x, y: s.y };
  };

  const segLen = segs.map(sg => pathLength(sg.pts));
  const finding = (id: PalmLineId, c: C | null, opts: { curve: boolean; forkAwayFromWeb: boolean }): LineFinding => {
    if (!c) return { id, found: false, traits: id === 'fate_line' ? [] : ['shallow'], strength: 0, contrast: 0, path: [] };
    // Линия идёт от промежутка у большого пальца (если начинается там)
    const startAtWeb = Math.hypot(c.pts[0].x - web.x, c.pts[0].y - web.y) <= Math.hypot(c.pts[c.pts.length - 1].x - web.x, c.pts[c.pts.length - 1].y - web.y);
    const pts = startAtWeb ? c.pts : [...c.pts].reverse();
    const nodes = startAtWeb ? c.nodes : [...c.nodes].reverse();
    const img_pts = pts.map(toImage);

    // Глубина — насколько складка на снимке темнее кожи по обе стороны
    const side = Math.max(3, palmLenPx * 0.03);
    const depths: number[] = [];
    for (let i = 1; i < img_pts.length - 1; i++) {
      const dx = img_pts[i + 1].x - img_pts[i - 1].x, dy = img_pts[i + 1].y - img_pts[i - 1].y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      let center = Infinity;
      for (let o = -1.5; o <= 1.5; o += 0.5) center = Math.min(center, grayAt(img, img_pts[i].x + nx * o, img_pts[i].y + ny * o));
      const skin = (grayAt(img, img_pts[i].x + nx * side, img_pts[i].y + ny * side) + grayAt(img, img_pts[i].x - nx * side, img_pts[i].y - ny * side)) / 2;
      depths.push(Math.max(0, (skin - center) / Math.max(skin, 1)));
    }
    const contrast = median(depths);

    // Уверенность сети вдоль линии; провалы — разрывы
    const pAlong = pts.map(p => prob[Math.round(p.y) * N + Math.round(p.x)]);
    const traits: LineTrait[] = [contrast >= DEEP_CONTRAST ? 'deep' : 'shallow'];
    if (opts.curve) traits.push(isCurved(pts) ? 'curved' : 'straight');
    const broken = c.segs.some(j => segs[j].gap);
    if (broken) traits.push('broken');
    else if (isChainProfile(depths)) traits.push('chained');
    // Раздвоение: на дальней половине линии от неё отходит ещё одна ветвь
    const half = Math.floor(nodes.length / 2);
    const forked = nodes.slice(half).some((n, k) => {
      if (opts.forkAwayFromWeb === false && k === 0 && half === 0) return false;
      return segs.some((sg, j) => !sg.gap && !c.segs.includes(j) && (sg.a === n || sg.b === n) && segLen[j] >= 0.12 * palmW);
    });
    if (forked) traits.push('forked');

    const step = Math.max(1, Math.round(img_pts.length / 24));
    return {
      id,
      found: true,
      traits,
      strength: median(pAlong),
      contrast,
      path: img_pts.filter((_, i) => i % step === 0 || i === img_pts.length - 1)
        .map(p => ({ x: +(p.x / W).toFixed(4), y: +(p.y / H).toFixed(4) })),
    };
  };

  const lines: LineFinding[] = [
    finding('heart_line', heart, { curve: true, forkAwayFromWeb: true }),
    finding('head_line', head, { curve: true, forkAwayFromWeb: true }),
    finding('life_line', life, { curve: false, forkAwayFromWeb: true }),
    finding('fate_line', fate, { curve: false, forkAwayFromWeb: true }),
  ];
  if (!lines[0].found && !lines[1].found && !lines[2].found) issues.push('no_lines');

  const features: PalmFeatures = {
    hand: classifyHand(measurements),
    heart_line: lines[0].traits,
    head_line: lines[1].traits,
    life_line: lines[2].traits,
    fate_line: lines[3].found ? lines[3].traits : 'none',
  };
  return { features, measurements, lines, issues, soft: false };
}

/** «Цепочка»: темнота вдоль линии регулярно проваливается между звеньями */
function isChainProfile(depths: number[]): boolean {
  const d = depths.map((_, i) => {
    let s = 0, n = 0;
    for (let k = -1; k <= 1; k++) if (depths[i + k] !== undefined) { s += depths[i + k]; n++; }
    return s / n;
  });
  let links = 0;
  for (let i = 1; i < d.length - 1; i++) {
    if (d[i] > d[i - 1] || d[i] > d[i + 1]) continue;
    const l = Math.max(...d.slice(Math.max(0, i - 6), i));
    const r = Math.max(...d.slice(i + 1, i + 7));
    if (d[i] < 0.45 * Math.min(l, r)) links++;
  }
  return links >= Math.max(5, d.length / 18);
}
