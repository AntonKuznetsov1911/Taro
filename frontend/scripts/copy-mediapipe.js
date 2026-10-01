// Кладёт WebAssembly-файлы MediaPipe рядом с сайтом (dist/mediapipe/wasm),
// чтобы распознавание руки работало без внешних CDN и офлайн.
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
console.log('✅ MediaPipe files copied');
