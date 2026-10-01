// Распознавание руки на фото в браузере: MediaPipe Hand Landmarker
// находит 21 точку руки, дальше palmVision разбирает ладонь.
//
// Модель (≈8 МБ) и WebAssembly лежат рядом с сайтом в /mediapipe и
// загружаются только при первом гадании по руке; сервис-воркер кэширует
// их, после чего распознавание работает без интернета.

import type { HandLandmarker } from '@mediapipe/tasks-vision';
import { analyzePalm, PalmAnalysis, Point } from './palmVision';

export type PalmDetectError = 'unsupported' | 'load_failed' | 'no_hand' | 'back_of_hand' | 'image_failed';

export type PalmDetectResult =
  | { ok: true; analysis: PalmAnalysis; width: number; height: number; enhancedUri?: string }
  | { ok: false; error: PalmDetectError };

const BASE = `${process.env.EXPO_BASE_URL ?? ''}/mediapipe`;

let landmarkerPromise: Promise<HandLandmarker> | null = null;

function loadLandmarker(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await import('@mediapipe/tasks-vision');
      const fileset = await vision.FilesetResolver.forVisionTasks(`${BASE}/wasm`);
      const options = (delegate: 'GPU' | 'CPU') => ({
        baseOptions: { modelAssetPath: `${BASE}/hand_landmarker.task`, delegate },
        runningMode: 'IMAGE' as const,
        numHands: 1,
        minHandDetectionConfidence: 0.5,
      });
      try {
        return await vision.HandLandmarker.createFromOptions(fileset, options('GPU'));
      } catch {
        // Не на всех телефонах есть WebGL2 — процессор медленнее, но работает
        return await vision.HandLandmarker.createFromOptions(fileset, options('CPU'));
      }
    })();
    landmarkerPromise.catch(() => {
      landmarkerPromise = null;
    });
  }
  return landmarkerPromise;
}

/** Начать загрузку модели заранее, пока человек наводит камеру */
export function preloadPalmDetector(): void {
  if (isPalmDetectionSupported()) void loadLandmarker().catch(() => undefined);
}

export function isPalmDetectionSupported(): boolean {
  return typeof window !== 'undefined' && typeof WebAssembly === 'object' && typeof document !== 'undefined';
}

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = uri;
  });
}

export async function detectPalm(uri: string): Promise<PalmDetectResult> {
  if (!isPalmDetectionSupported()) return { ok: false, error: 'unsupported' };

  let landmarker: HandLandmarker;
  try {
    landmarker = await loadLandmarker();
  } catch (error) {
    console.error('Palm detector failed to load', error);
    return { ok: false, error: 'load_failed' };
  }

  let image: HTMLImageElement;
  try {
    image = await loadImage(uri);
  } catch {
    return { ok: false, error: 'image_failed' };
  }

  const result = landmarker.detect(image);
  const hand = result.landmarks?.[0];
  if (!hand || hand.length < 21) return { ok: false, error: 'no_hand' };

  // Ладонь или тыльная сторона? MediaPipe распознаёт по виду руки, правая
  // она или левая (проверено на снимках: метка соответствует руке на
  // обычном, незеркальном фото). По взаимному положению запястья,
  // указательного пальца и мизинца видно, какой стороной рука повёрнута
  // к камере. На зеркальном снимке меняются и метка, и геометрия —
  // ответ остаётся верным.
  const handed = result.handedness?.[0]?.[0];
  if (handed && handed.score >= 0.8) {
    const isRight = handed.categoryName === 'Right';
    const v1 = { x: hand[5].x - hand[0].x, y: hand[5].y - hand[0].y };
    const v2 = { x: hand[17].x - hand[0].x, y: hand[17].y - hand[0].y };
    const cross = v1.x * v2.y - v1.y * v2.x;
    const palmFacing = isRight ? cross < 0 : cross > 0;
    if (!palmFacing) return { ok: false, error: 'back_of_hand' };
  }

  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return { ok: false, error: 'image_failed' };
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, width, height);

  const landmarks: Point[] = hand.map(p => ({ x: p.x * width, y: p.y * height }));
  const analysis = analyzePalm({ width, height, data: pixels.data }, landmarks);
  const palmSize = Math.hypot(landmarks[0].x - landmarks[9].x, landmarks[0].y - landmarks[9].y);
  const enhancedUri = await enhanceLines(image, palmSize).catch(() => undefined);
  return { ok: true, analysis, width, height, enhancedUri };
}

/**
 * «Контрастный» вариант снимка: из яркости вычитается её размытая копия
 * (локальный контраст), поэтому тени и неровный свет уходят, а складки
 * ладони становятся тёмными чёткими линиями
 */
export async function enhanceLines(image: HTMLImageElement, palmSize: number): Promise<string | undefined> {
  const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
  const w = Math.round(image.naturalWidth * scale);
  const h = Math.round(image.naturalHeight * scale);
  const base = document.createElement('canvas');
  base.width = w;
  base.height = h;
  const ctx = base.getContext('2d', { willReadFrequently: true });
  if (!ctx) return undefined;
  ctx.drawImage(image, 0, 0, w, h);
  const src = ctx.getImageData(0, 0, w, h);

  const blurred = document.createElement('canvas');
  blurred.width = w;
  blurred.height = h;
  const bctx = blurred.getContext('2d', { willReadFrequently: true });
  if (!bctx || !('filter' in bctx)) return undefined;
  bctx.filter = `blur(${Math.max(4, Math.round((palmSize * scale) / 30))}px)`;
  bctx.drawImage(base, 0, 0);
  if (bctx.filter === 'none') return undefined; // фильтры canvas не поддерживаются
  const bg = bctx.getImageData(0, 0, w, h);

  const out = ctx.createImageData(w, h);
  for (let i = 0; i < src.data.length; i += 4) {
    const l = 0.25 * src.data[i] + 0.6 * src.data[i + 1] + 0.15 * src.data[i + 2];
    const b = 0.25 * bg.data[i] + 0.6 * bg.data[i + 1] + 0.15 * bg.data[i + 2];
    // Отношение к фону: 1 — как кожа рядом, меньше — складка
    const r = l / Math.max(b, 1);
    const v = Math.max(0, Math.min(255, 195 + (r - 1) * 750));
    out.data[i] = Math.min(255, v + 18);
    out.data[i + 1] = v;
    out.data[i + 2] = Math.max(0, v - 12);
    out.data[i + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  return new Promise(resolve => base.toBlob(blob => resolve(blob ? URL.createObjectURL(blob) : undefined), 'image/jpeg', 0.9));
}
