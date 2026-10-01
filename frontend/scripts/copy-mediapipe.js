// Кладёт WebAssembly-файлы MediaPipe (распознавание руки) и onnxruntime-web
// (нейросеть линий ладони) рядом с сайтом, чтобы всё работало без внешних
// CDN и офлайн.
// Модель руки (hand_landmarker.task) лежит в public/mediapipe и копируется
// экспортом Expo вместе с остальной папкой public.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const dist = path.join(__dirname, '..', 'dist', 'mediapipe');
const dest = path.join(dist, 'wasm');

fs.mkdirSync(dest, { recursive: true });
for (const file of fs.readdirSync(src)) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
  console.log(`  ✓ mediapipe/wasm/${file}`);
}

const model = path.join(__dirname, '..', 'public', 'mediapipe', 'hand_landmarker.task');
const modelDest = path.join(dist, 'hand_landmarker.task');
if (!fs.existsSync(modelDest)) fs.copyFileSync(model, modelDest);
// onnxruntime-web для нейросети линий ладони: загрузчик и WebAssembly
const ortSrc = path.join(__dirname, '..', 'node_modules', 'onnxruntime-web', 'dist');
const ortDest = path.join(__dirname, '..', 'dist', 'ort');
fs.mkdirSync(ortDest, { recursive: true });
for (const file of ['ort.wasm.min.js', 'ort-wasm-simd-threaded.wasm', 'ort-wasm-simd-threaded.mjs']) {
  fs.copyFileSync(path.join(ortSrc, file), path.join(ortDest, file));
  console.log(`  ✓ ort/${file}`);
}

// Модель линий ладони лежит в public/models и копируется экспортом Expo
const netModel = path.join(__dirname, '..', 'dist', 'models', 'palm_lines.onnx');
if (!fs.existsSync(netModel)) {
  fs.mkdirSync(path.dirname(netModel), { recursive: true });
  for (const file of ['palm_lines.onnx', 'LICENSE-palm-lines.txt', 'NOTICE-palm-lines.txt']) {
    fs.copyFileSync(path.join(__dirname, '..', 'public', 'models', file), path.join(path.dirname(netModel), file));
  }
}
console.log('✅ MediaPipe and palm line model files copied');
