import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio, AVPlaybackSource } from 'expo-av';

// Small embedded samples (base64). If playback fails, haptics still works.
// CLICK: soft tap
const CLICK_MP3 = 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAA';
// FLIP: soft cosmic flip
const FLIP_MP3 = 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAA';
// REVEAL: airy cosmic reveal
const REVEAL_MP3 = 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAA';

let clickSound: Audio.Sound | null = null;
let flipSound: Audio.Sound | null = null;
let revealSound: Audio.Sound | null = null;

let webAudioCtx: AudioContext | null = null;

function webBeep(durationMs: number, freq: number, volume = 0.3) {
  if (typeof window === 'undefined') return;
  try {
    // @ts-ignore
    const AC = window.AudioContext || (window as any).webkitAudioContext;
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
  } catch {}
}

async function ensureLoaded() {
  try {
    if (Platform.OS === 'web') {
      // No preloading for web beeps
      return;
    }
    if (!clickSound) {
      clickSound = new Audio.Sound();
      await clickSound.loadAsync({ uri: CLICK_MP3 } as AVPlaybackSource, {}, false);
    }
    if (!flipSound) {
      flipSound = new Audio.Sound();
      await flipSound.loadAsync({ uri: FLIP_MP3 } as AVPlaybackSource, {}, false);
    }
    if (!revealSound) {
      revealSound = new Audio.Sound();
      await revealSound.loadAsync({ uri: REVEAL_MP3 } as AVPlaybackSource, {}, false);
    }
  } catch (e) {
    // Ignore audio errors; haptics will still provide feedback
  }
}

export async function playClick(opts: { soundEnabled: boolean; vibration: boolean; volume?: number }) {
  try {
    if (opts.vibration) await Haptics.selectionAsync();
    if (!opts.soundEnabled) return;
    await ensureLoaded();
    const vol = Math.max(0, Math.min(1, opts.volume ?? 0.7));
    if (Platform.OS === 'web') {
      if (webClick) webClick.volume = vol;
      await webClick?.play();
    } else if (clickSound) {
      await clickSound.setVolumeAsync(vol);
      await clickSound.replayAsync();
    }
  } catch {}
}

export async function playFlip(opts: { soundEnabled: boolean; vibration: boolean; volume?: number }) {
  try {
    if (opts.vibration) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    if (!opts.soundEnabled) return;
    await ensureLoaded();
    const vol = Math.max(0, Math.min(1, opts.volume ?? 0.7));
    if (Platform.OS === 'web') {
      if (webFlip) webFlip.volume = vol;
      await webFlip?.play();
    } else if (flipSound) {
      await flipSound.setVolumeAsync(vol);
      await flipSound.replayAsync();
    }
  } catch {}
}

export async function playReveal(opts: { soundEnabled: boolean; vibration: boolean; volume?: number }) {
  try {
    if (opts.vibration) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!opts.soundEnabled) return;
    await ensureLoaded();
    const vol = Math.max(0, Math.min(1, opts.volume ?? 0.8));
    if (Platform.OS === 'web') {
      if (webReveal) webReveal.volume = vol;
      await webReveal?.play();
    } else if (revealSound) {
      await revealSound.setVolumeAsync(vol);
      await revealSound.replayAsync();
    }
  } catch {}
}