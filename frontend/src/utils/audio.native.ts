import { AppState } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

export type CueName = 'tap' | 'flip' | 'reveal' | 'shuffle' | 'chime' | 'draw';
const sources = {
  tap: require('../../assets/sounds/tap.wav'), flip: require('../../assets/sounds/flip.wav'),
  reveal: require('../../assets/sounds/reveal.wav'), shuffle: require('../../assets/sounds/shuffle.wav'),
  chime: require('../../assets/sounds/chime.wav'), draw: require('../../assets/sounds/draw.wav'),
};
const players = new Map<CueName, AudioPlayer>();
let initialized = false;

export function isAudioSupported(): boolean { return true; }
export function primeAudio(): void {
  if (initialized) return;
  initialized = true;
  void setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false }).catch(() => undefined);
  AppState.addEventListener('change', (state) => {
    if (state !== 'active') players.forEach(player => { try { player.pause(); } catch {} });
  });
}

export function playCue(name: CueName, volume = 0.7): void {
  if (volume <= 0 || AppState.currentState !== 'active') return;
  try {
    primeAudio();
    let player = players.get(name);
    if (!player) { player = createAudioPlayer(sources[name]); players.set(name, player); }
    player.volume = Math.max(0, Math.min(1, volume));
    const current = player;
    if (current.currentTime === 0) current.play();
    else void current.seekTo(0).then(() => { if (AppState.currentState === 'active') current.play(); }).catch(() => undefined);
  } catch { /* Audio remains optional; a failed cue must not interrupt a reading. */ }
}
