// Нативная сборка: распознавание руки пока работает только в веб-версии
// (см. palmDetector.web.ts). Здесь ладонь описывается вручную.

import type { PalmAnalysis } from './palmVision';

export type PalmDetectError = 'unsupported' | 'load_failed' | 'no_hand' | 'back_of_hand' | 'image_failed';

export type PalmDetectResult =
  | { ok: true; analysis: PalmAnalysis; width: number; height: number }
  | { ok: false; error: PalmDetectError };

export function preloadPalmDetector(): void {}

export function isPalmDetectionSupported(): boolean {
  return false;
}

export async function detectPalm(_uri: string): Promise<PalmDetectResult> {
  return { ok: false, error: 'unsupported' };
}
