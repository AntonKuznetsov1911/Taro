import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Web audio context for sound effects
let webAudioCtx: AudioContext | null = null;

function webBeep(durationMs: number, freq: number, volume = 0.3) {
  if (typeof window === 'undefined') return;
  try {
    // @ts-ignore
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    if (!webAudioCtx) webAudioCtx = new AC();
    if (webAudioCtx.state === 'suspended') webAudioCtx.resume();

    const osc = webAudioCtx.createOscillator();
    const gain = webAudioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(webAudioCtx.destination);
    const now = webAudioCtx.currentTime;
    osc.start(now);
    osc.stop(now + durationMs / 1000);
  } catch {
    // Ignore audio errors
  }
}

export async function playClick(opts: { soundEnabled: boolean; vibration: boolean; volume?: number }) {
  try {
    if (opts.vibration && Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    if (!opts.soundEnabled) return;
    const vol = Math.max(0, Math.min(1, opts.volume ?? 0.7));
    if (Platform.OS === 'web') {
      webBeep(50, 800, vol * 0.3);
    }
  } catch {
    // Ignore errors
  }
}

export async function playFlip(opts: { soundEnabled: boolean; vibration: boolean; volume?: number }) {
  try {
    if (opts.vibration && Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    }
    if (!opts.soundEnabled) return;
    const vol = Math.max(0, Math.min(1, opts.volume ?? 0.7));
    if (Platform.OS === 'web') {
      webBeep(100, 400, vol * 0.2);
      setTimeout(() => webBeep(80, 600, vol * 0.15), 50);
    }
  } catch {
    // Ignore errors
  }
}

export async function playReveal(opts: { soundEnabled: boolean; vibration: boolean; volume?: number }) {
  try {
    if (opts.vibration && Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (!opts.soundEnabled) return;
    const vol = Math.max(0, Math.min(1, opts.volume ?? 0.8));
    if (Platform.OS === 'web') {
      webBeep(150, 523, vol * 0.2); // C5
      setTimeout(() => webBeep(150, 659, vol * 0.15), 100); // E5
      setTimeout(() => webBeep(200, 784, vol * 0.1), 200); // G5
    }
  } catch {
    // Ignore errors
  }
}
