import { Platform, Vibration } from 'react-native';

// Very small, cross-platform safe sound approach without extra deps:
// - On native: use vibration only (no audio libs to avoid dependency installs now)
// - On web preview: play short base64-embedded audio via HTMLAudioElement

const CLICK_MP3 = 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAA'; // tiny placeholder
const FLIP_MP3 = 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAA'; // tiny placeholder

let webClick: HTMLAudioElement | null = null;
let webFlip: HTMLAudioElement | null = null;

function ensureWebSounds() {
  if (Platform.OS !== 'web') return;
  try {
    if (!webClick) webClick = new Audio(CLICK_MP3);
    if (!webFlip) webFlip = new Audio(FLIP_MP3);
  } catch (e) {
    // ignore
  }
}

export async function playClick(opts: { soundEnabled: boolean; vibration: boolean }) {
  try {
    if (opts.vibration) Vibration.vibrate(10);
    if (opts.soundEnabled) {
      if (Platform.OS === 'web') {
        ensureWebSounds();
        await webClick?.play();
      }
    }
  } catch {}
}

export async function playFlip(opts: { soundEnabled: boolean; vibration: boolean }) {
  try {
    if (opts.vibration) Vibration.vibrate(20);
    if (opts.soundEnabled) {
      if (Platform.OS === 'web') {
        ensureWebSounds();
        await webFlip?.play();
      }
    }
  } catch {}
}