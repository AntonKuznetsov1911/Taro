import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { playCue, primeAudio } from './audio';

/**
 * Тонкая обёртка над синтезатором: связывает настройки приложения
 * (звук / вибрация / громкость эффектов) со звуковой палитрой.
 *
 * Контракт вызова намеренно сохранён прежним:
 *   play*({ soundEnabled, vibration, volume })
 */
export type SoundOptions = {
  soundEnabled: boolean;
  vibration: boolean;
  volume?: number;
};

type HapticKind = 'selection' | 'soft' | 'light' | 'medium' | 'success';

async function haptic(kind: HapticKind, enabled: boolean) {
  if (!enabled || Platform.OS === 'web') return;
  try {
    switch (kind) {
      case 'selection':
        await Haptics.selectionAsync();
        break;
      case 'soft':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        break;
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
    }
  } catch {
    // Тактильная отдача необязательна
  }
}

function volumeOf(opts: SoundOptions, fallback: number): number {
  const raw = typeof opts.volume === 'number' ? opts.volume : fallback;
  return Math.max(0, Math.min(1, raw));
}

async function play(
  cue: Parameters<typeof playCue>[0],
  kind: HapticKind,
  opts: SoundOptions,
  fallbackVolume: number
) {
  try {
    await haptic(kind, opts.vibration);
    if (!opts.soundEnabled) return;
    playCue(cue, volumeOf(opts, fallbackVolume));
  } catch {
    // Звук не должен ломать пользовательский сценарий
  }
}

/** Обычное касание / выбор пункта. */
export async function playClick(opts: SoundOptions) {
  await play('tap', 'selection', opts, 0.7);
}

/** Алиас для читаемости в местах выбора варианта. */
export async function playSelect(opts: SoundOptions) {
  await play('tap', 'selection', opts, 0.7);
}

/** Переворот карты. */
export async function playFlip(opts: SoundOptions) {
  await play('flip', 'soft', opts, 0.7);
}

/** Раскрытие карты / всех карт. */
export async function playReveal(opts: SoundOptions) {
  await play('reveal', 'light', opts, 0.8);
}

/** Перемешивание колоды в начале расклада. */
export async function playShuffle(opts: SoundOptions) {
  await play('shuffle', 'medium', opts, 0.7);
}

/** Вытягивание рун. */
export async function playDraw(opts: SoundOptions) {
  await play('draw', 'medium', opts, 0.7);
}

/** Завершение расчёта (совместимость, нумерология и т. п.). */
export async function playComplete(opts: SoundOptions) {
  await play('chime', 'success', opts, 0.8);
}

/**
 * Разогрев аудиодвижка внутри жеста пользователя (веб).
 * На нативных платформах — no-op.
 */
export function warmUpSound() {
  if (Platform.OS !== 'web') return;
  primeAudio();
}
