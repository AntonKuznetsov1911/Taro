import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio, AVPlaybackSource } from 'expo-av';

// Web fallback sounds (very small inline) and native data URIs (best-effort)
const CLICK_MP3 = 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAA';
const FLIP_MP3 = 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAA';

let clickSound: Audio.Sound | null = null;
let flipSound: Audio.Sound | null = null;
let webClick: HTMLAudioElement | null = null;
let webFlip: HTMLAudioElement | null = null;

async function ensureLoaded() {
  try {
    if (Platform.OS === 'web') {
      if (!webClick) webClick = new Audio(CLICK_MP3);
      if (!webFlip) webFlip = new Audio(FLIP_MP3);
      return;
    }
    if (!clickSound) {
      clickSound = new Audio.Sound();
      await clickSound.loadAsync({ uri: CLICK_MP3 } as AVPlaybackSource, {}, false);
    }
    if (!flipSound) {
      flipSound = new Audio.Sound();
      await flipSound.loadAsync({ uri: FLIP_MP3 } as AVPlaybackSource, { volume: 0.7 }, false);
    }
  } catch (e) {
    // Loading audio is best-effort; haptics will still work
  }
}

export async function playClick(opts: { soundEnabled: boolean; vibration: boolean; volume?: number }) {
  try {
    if (opts.vibration) await Haptics.selectionAsync();
    if (!opts.soundEnabled) return;
    await ensureLoaded();
    if (Platform.OS === 'web') {
      if (webClick) webClick.volume = Math.max(0, Math.min(1, opts.volume ?? 0.7));
      await webClick?.play();
    } else if (clickSound) {
      await clickSound.setVolumeAsync(Math.max(0, Math.min(1, opts.volume ?? 0.7)));
      await clickSound.replayAsync();
    }
  } catch {}
}

export async function playFlip(opts: { soundEnabled: boolean; vibration: boolean }) {
  try {
    if (opts.vibration) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!opts.soundEnabled) return;
    await ensureLoaded();
    if (Platform.OS === 'web') {
      await webFlip?.play();
    } else if (flipSound) {
      await flipSound.replayAsync();
    }
  } catch {}
}