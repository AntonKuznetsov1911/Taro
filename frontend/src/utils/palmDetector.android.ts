import { NativeModules } from 'react-native';
import { fromByteArray, toByteArray } from 'base64-js';
import { analyzePalm, type PalmAnalysis, type Point, type RgbaImage } from './palmVision';
import { analyzeLineMap, fuseMaps, MAP_ZOOM, NET_ZOOMS, prepareNetInput } from './palmLineNet';
import type { PalmDetectResult } from './palmDetector';

type NativePhoto = {
  width: number; height: number; rgba: string; landmarks: Point[];
  hand?: string; confidence?: number; enhancedUri?: string;
};
type VisionBridge = {
  preload(): Promise<boolean>;
  detect(uri: string): Promise<NativePhoto>;
  infer(tensor: string): Promise<string>;
};
const vision = NativeModules.TaroVision as VisionBridge | undefined;

export function isPalmDetectionSupported(): boolean { return Boolean(vision); }
export function preloadPalmDetector(): void { void vision?.preload().catch(() => undefined); }

/** Both trained models are bundled in the APK and run on the phone. */
export async function detectPalm(uri: string): Promise<PalmDetectResult> {
  if (!vision) return { ok: false, error: 'unsupported' };
  let photo: NativePhoto;
  try { photo = await vision.detect(uri); }
  catch { return { ok: false, error: 'image_failed' }; }
  if (photo.landmarks.length !== 21) return { ok: false, error: 'no_hand' };
  const hand = photo.landmarks;
  if ((photo.confidence ?? 0) >= 0.8) {
    const cross = (hand[5].x - hand[0].x) * (hand[17].y - hand[0].y)
      - (hand[5].y - hand[0].y) * (hand[17].x - hand[0].x);
    if (photo.hand === 'Right' ? cross >= 0 : cross <= 0) return { ok: false, error: 'back_of_hand' };
  }
  const { width, height } = photo;
  const pixels = toByteArray(photo.rgba);
  const rgba: RgbaImage = { width, height, data: new Uint8ClampedArray(pixels.buffer, pixels.byteOffset, pixels.byteLength) };
  const landmarks = hand.map(p => ({ x: p.x * width, y: p.y * height }));
  let analysis: PalmAnalysis;
  let method: 'net' | 'classic' = 'net';
  try {
    const maps = [];
    for (const zoom of NET_ZOOMS) {
      const tensor = prepareNetInput(rgba, landmarks, zoom).tensor;
      const input = fromByteArray(new Uint8Array(tensor.buffer, tensor.byteOffset, tensor.byteLength));
      const bytes = toByteArray(await vision.infer(input));
      const prob = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
      maps.push({ prob, zoom });
    }
    analysis = analyzeLineMap(fuseMaps(maps), rgba, landmarks, prepareNetInput(rgba, landmarks, MAP_ZOOM));
  } catch {
    analysis = analyzePalm(rgba, landmarks);
    method = 'classic';
  }
  return { ok: true, analysis, width, height, enhancedUri: photo.enhancedUri, method };
}
