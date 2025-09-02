import * as Haptics from 'expo-haptics';
import { Audio, AVPlaybackSource } from 'expo-av';
import { useSettingsStore } from '../store/settings';

// Tiny base64 sounds (simple click and flip). Fallback to haptics if audio fails.
const CLICK_MP3 = 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAA...';
const FLIP_MP3 = 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAA...';

let clickSound: Audio.Sound | null = null;
let flipSound: Audio.Sound | null = null;

async function ensureLoaded() {
  try {
    if (!clickSound) {
      clickSound = new Audio.Sound();
      await clickSound.loadAsync({ uri: CLICK_MP3 } as AVPlaybackSource, { volume: 0.6 }, false);
    }
    if (!flipSound) {
      flipSound = new Audio.Sound();
      await flipSound.loadAsync({ uri: FLIP_MP3 } as AVPlaybackSource, { volume: 0.7 }, false);
    }
  } catch (e) {
    // ignore, fallback to haptics only
  }
}

export async function playClick() {
  const { soundEnabled, vibration } = useSettingsStore.getState();
  if (vibration) Haptics.selectionAsync();
  if (!soundEnabled) return;
  try {
    await ensureLoaded();
    if (clickSound) {
      await clickSound.replayAsync();
    }
  } catch (e) {
    // noop
  }
}

export async function playFlip() {
  const { soundEnabled, vibration } = useSettingsStore.getState();
  if (vibration) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  if (!soundEnabled) return;
  try {
    await ensureLoaded();
    if (flipSound) {
      await flipSound.replayAsync();
    }
  } catch (e) {
    // noop
  }
}