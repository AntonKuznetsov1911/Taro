// Запуск нейросети линий ладони в браузере (onnxruntime-web, WebAssembly).
//
// Библиотека и модель лежат рядом с сайтом (/ort, /models) и грузятся
// только при первом гадании по руке; сервис-воркер их кэширует, дальше
// всё работает без интернета.

import { NET_SIZE } from './palmLineNet';

const BASE = process.env.EXPO_BASE_URL ?? '';

interface OrtTensor { data: Float32Array }
interface OrtSession { run(feeds: Record<string, unknown>): Promise<Record<string, OrtTensor>> }
interface OrtModule {
  env: { wasm: { wasmPaths: string; numThreads: number } };
  Tensor: new (type: 'float32', data: Float32Array, dims: number[]) => unknown;
  InferenceSession: { create(url: string, options: { executionProviders: string[] }): Promise<OrtSession> };
}

let sessionPromise: Promise<{ ort: OrtModule; session: OrtSession }> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.dataset.src = src;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(el);
  });
}

export function loadPalmLineNet(): Promise<{ ort: OrtModule; session: OrtSession }> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      await loadScript(`${BASE}/ort/ort.wasm.min.js`);
      const ort = (window as unknown as { ort?: OrtModule }).ort;
      if (!ort) throw new Error('onnxruntime-web is unavailable');
      ort.env.wasm.wasmPaths = `${BASE}/ort/`;
      // Многопоточность требует особых заголовков сервера, которых нет у GitHub Pages
      ort.env.wasm.numThreads = 1;
      const session = await ort.InferenceSession.create(`${BASE}/models/palm_lines.onnx`, { executionProviders: ['wasm'] });
      return { ort, session };
    })();
    sessionPromise.catch(() => {
      sessionPromise = null;
    });
  }
  return sessionPromise;
}

/** Вход 1×3×256×256 → вероятность линии в каждой точке (256×256) */
export async function runPalmLineNet(input: Float32Array): Promise<Float32Array> {
  const { ort, session } = await loadPalmLineNet();
  const tensor = new ort.Tensor('float32', input, [1, 3, NET_SIZE, NET_SIZE]);
  const out = await session.run({ image: tensor });
  const logits = out.logits.data;
  const prob = new Float32Array(logits.length);
  for (let i = 0; i < logits.length; i++) prob[i] = 1 / (1 + Math.exp(-logits[i]));
  return prob;
}
