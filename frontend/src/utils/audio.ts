import { Platform } from 'react-native';

/**
 * Программный синтез звуковой палитры приложения (Web Audio API).
 *
 * Никаких аудиофайлов и сетевых запросов: все тембры собираются на лету,
 * поэтому приложение остаётся полностью офлайновым.
 *
 * Контекст создаётся лениво — только в момент первого воспроизведения
 * (то есть внутри пользовательского жеста) и возобновляется, если браузер
 * успел его усыпить автоплей-политикой.
 */

type Ctx = AudioContext;

let ctx: Ctx | null = null;
let master: GainNode | null = null;
let dryBus: GainNode | null = null;
let wetBus: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let unlockAttached = false;
let audioDisabled = false;

const MASTER_LEVEL = 0.9;

export function isAudioSupported(): boolean {
  if (audioDisabled) return false;
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).AudioContext || (window as any).webkitAudioContext
  );
}

function attachUnlockHandlers() {
  if (unlockAttached || typeof window === 'undefined') return;
  unlockAttached = true;
  const resume = () => {
    try {
      if (ctx && ctx.state === 'suspended') void ctx.resume();
    } catch {
      // Браузер может отказать — попробуем при следующем жесте
    }
  };
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach((evt) => {
    try {
      window.addEventListener(evt, resume, { passive: true });
    } catch {
      // Старые браузеры без options — не критично
    }
  });
}

/** Мягкий «зал»: импульсная характеристика из затухающего шума. */
function createImpulseResponse(context: Ctx, seconds: number, decay: number): AudioBuffer {
  const rate = context.sampleRate;
  const length = Math.max(1, Math.floor(rate * seconds));
  const buffer = context.createBuffer(2, length, rate);
  const buildUp = Math.max(1, Math.floor(rate * 0.015));

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const envelope = Math.pow(1 - t, decay);
      const attack = i < buildUp ? i / buildUp : 1;
      data[i] = (Math.random() * 2 - 1) * envelope * attack;
    }
  }
  return buffer;
}

function getNoiseBuffer(context: Ctx): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === context.sampleRate) return noiseBuffer;
  const rate = context.sampleRate;
  const length = Math.floor(rate * 2);
  const buffer = context.createBuffer(2, length, rate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let last = 0;
    for (let i = 0; i < length; i++) {
      // Слегка «розовый» шум: белый шум, сглаженный однополюсным фильтром,
      // звучит теплее и бумажнее, чем чистый белый
      const white = Math.random() * 2 - 1;
      last = 0.82 * last + 0.18 * white;
      data[i] = last * 1.6;
    }
  }
  noiseBuffer = buffer;
  return buffer;
}

/** Создаёт (или возвращает) аудиоконтекст и общую шину эффектов. */
function ensureAudio(): { context: Ctx; dry: GainNode; wet: GainNode } | null {
  if (!isAudioSupported()) return null;
  try {
    if (!ctx) {
      const AC: typeof AudioContext =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      ctx = new AC();

      // Мягкий лимитер, чтобы наложение голосов не давало перегруза
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -12;
      limiter.knee.value = 24;
      limiter.ratio.value = 6;
      limiter.attack.value = 0.006;
      limiter.release.value = 0.28;

      master = ctx.createGain();
      master.gain.value = MASTER_LEVEL;
      master.connect(limiter);
      limiter.connect(ctx.destination);

      dryBus = ctx.createGain();
      dryBus.gain.value = 1;
      dryBus.connect(master);

      const convolver = ctx.createConvolver();
      convolver.buffer = createImpulseResponse(ctx, 2.6, 2.4);
      const reverbTone = ctx.createBiquadFilter();
      reverbTone.type = 'lowpass';
      reverbTone.frequency.value = 2600;
      const reverbLevel = ctx.createGain();
      reverbLevel.gain.value = 0.75;

      wetBus = ctx.createGain();
      wetBus.gain.value = 1;
      wetBus.connect(convolver);
      convolver.connect(reverbTone);
      reverbTone.connect(reverbLevel);
      reverbLevel.connect(master);
    }

    attachUnlockHandlers();

    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    if (!dryBus || !wetBus) return null;
    return { context: ctx, dry: dryBus, wet: wetBus };
  } catch {
    // Если Web Audio недоступен (приватный режим, политика браузера) —
    // тихо отключаемся, приложение продолжает работать без звука
    audioDisabled = true;
    ctx = null;
    master = null;
    dryBus = null;
    wetBus = null;
    return null;
  }
}

/** Разрешён ли звук с точки зрения громкости. */
function normVolume(volume?: number): number {
  const v = typeof volume === 'number' ? volume : 0.7;
  return Math.max(0, Math.min(1, v));
}

type ToneOptions = {
  freq: number;
  /** смещение начала относительно «сейчас», в секундах */
  delay?: number;
  duration: number;
  peak: number;
  type?: OscillatorType;
  attack?: number;
  detune?: number;
  lowpass?: number;
  /** доля сигнала, уходящая в реверберацию (0..1) */
  reverb?: number;
};

/** Одиночный голос с плавной атакой и экспоненциальным хвостом. */
function voice(bus: { context: Ctx; dry: GainNode; wet: GainNode }, opts: ToneOptions) {
  const { context, dry, wet } = bus;
  const start = context.currentTime + 0.02 + (opts.delay ?? 0);
  const attack = opts.attack ?? 0.02;
  const duration = Math.max(0.05, opts.duration);
  const peak = Math.max(0.0002, opts.peak);

  const osc = context.createOscillator();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.freq, start);
  if (opts.detune) osc.detune.setValueAtTime(opts.detune, start);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  let node: AudioNode = osc;
  if (opts.lowpass) {
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(opts.lowpass, start);
    filter.Q.value = 0.6;
    osc.connect(filter);
    node = filter;
  }
  node.connect(gain);

  gain.connect(dry);
  const send = opts.reverb ?? 0;
  if (send > 0) {
    const sendGain = context.createGain();
    sendGain.gain.value = send;
    gain.connect(sendGain);
    sendGain.connect(wet);
  }

  osc.start(start);
  osc.stop(start + duration + 0.05);
}

type NoiseOptions = {
  delay?: number;
  duration: number;
  peak: number;
  /** начальная и конечная частота полосового фильтра */
  from: number;
  to: number;
  q?: number;
  attack?: number;
  reverb?: number;
};

/** Короткий шумовой всплеск — основа «бумажных» и «шуршащих» звуков. */
function noise(bus: { context: Ctx; dry: GainNode; wet: GainNode }, opts: NoiseOptions) {
  const { context, dry, wet } = bus;
  const start = context.currentTime + 0.02 + (opts.delay ?? 0);
  const duration = Math.max(0.03, opts.duration);
  const attack = Math.min(opts.attack ?? 0.012, duration * 0.4);
  const peak = Math.max(0.0002, opts.peak);

  const source = context.createBufferSource();
  source.buffer = getNoiseBuffer(context);
  source.loop = true;
  // Случайная точка старта, чтобы повторы не звучали одинаково
  const offset = Math.random() * 1.5;

  const band = context.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = opts.q ?? 0.9;
  band.frequency.setValueAtTime(opts.from, start);
  band.frequency.exponentialRampToValueAtTime(Math.max(60, opts.to), start + duration);

  const tame = context.createBiquadFilter();
  tame.type = 'lowpass';
  tame.frequency.value = 7000;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.connect(band);
  band.connect(tame);
  tame.connect(gain);
  gain.connect(dry);

  const send = opts.reverb ?? 0;
  if (send > 0) {
    const sendGain = context.createGain();
    sendGain.gain.value = send;
    gain.connect(sendGain);
    sendGain.connect(wet);
  }

  source.start(start, offset, duration + 0.1);
  source.stop(start + duration + 0.1);
}

/** Тёплый колокол / поющая чаша: основной тон плюс мягкие обертоны. */
function bell(
  bus: { context: Ctx; dry: GainNode; wet: GainNode },
  freq: number,
  level: number,
  delay = 0,
  length = 1
) {
  const tail = 2.6 * length;
  voice(bus, {
    freq,
    delay,
    duration: tail,
    peak: level * 0.55,
    type: 'sine',
    attack: 0.035,
    reverb: 0.5,
  });
  // Лёгкая расстройка даёт живое биение
  voice(bus, {
    freq,
    delay: delay + 0.008,
    duration: tail * 0.9,
    peak: level * 0.3,
    type: 'sine',
    detune: 7,
    attack: 0.05,
    reverb: 0.45,
  });
  voice(bus, {
    freq: freq * 2,
    delay: delay + 0.004,
    duration: tail * 0.55,
    peak: level * 0.2,
    type: 'sine',
    detune: -5,
    attack: 0.03,
    reverb: 0.4,
  });
  voice(bus, {
    freq: freq * 3.01,
    delay: delay + 0.01,
    duration: tail * 0.3,
    peak: level * 0.075,
    type: 'sine',
    attack: 0.025,
    reverb: 0.35,
  });
  // Низкий «корпус» инструмента — придаёт теплоты
  voice(bus, {
    freq: freq * 0.5,
    delay,
    duration: tail * 0.75,
    peak: level * 0.18,
    type: 'sine',
    attack: 0.06,
    lowpass: 900,
    reverb: 0.3,
  });
}

export type CueName = 'tap' | 'flip' | 'reveal' | 'shuffle' | 'chime' | 'draw';

/**
 * Воспроизводит звуковой сигнал. Никогда не бросает исключений:
 * звук — украшение, он не должен ломать экран.
 */
export function playCue(name: CueName, volume?: number): void {
  const bus = ensureAudio();
  if (!bus) return;
  const v = normVolume(volume);
  if (v <= 0) return;

  try {
    switch (name) {
      // Тихий приглушённый тон: только подтверждение касания
      case 'tap': {
        voice(bus, {
          freq: 396,
          duration: 0.16,
          peak: 0.05 * v,
          type: 'sine',
          attack: 0.012,
          lowpass: 1200,
          reverb: 0.12,
        });
        voice(bus, {
          freq: 198,
          duration: 0.2,
          peak: 0.03 * v,
          type: 'sine',
          attack: 0.02,
          lowpass: 700,
        });
        break;
      }

      // Переворот карты: мягкий бумажный «вжух» с быстрым спадом
      case 'flip': {
        noise(bus, {
          duration: 0.26,
          peak: 0.14 * v,
          from: 2600,
          to: 620,
          q: 0.7,
          attack: 0.018,
          reverb: 0.18,
        });
        noise(bus, {
          delay: 0.05,
          duration: 0.2,
          peak: 0.07 * v,
          from: 1400,
          to: 380,
          q: 1.1,
          attack: 0.03,
          reverb: 0.22,
        });
        // Едва слышный низкий призвук — «вес» карты
        voice(bus, {
          freq: 174,
          delay: 0.03,
          duration: 0.5,
          peak: 0.035 * v,
          type: 'sine',
          attack: 0.04,
          lowpass: 600,
          reverb: 0.3,
        });
        break;
      }

      // Раскрытие карты: тёплая поющая чаша с длинным хвостом
      case 'reveal': {
        bell(bus, 220, 0.3 * v, 0, 1.15);
        bell(bus, 330, 0.14 * v, 0.14, 0.95);
        noise(bus, {
          duration: 0.55,
          peak: 0.035 * v,
          from: 3200,
          to: 900,
          q: 0.6,
          attack: 0.08,
          reverb: 0.5,
        });
        break;
      }

      // Перемешивание колоды: слои коротких шелестящих всплесков
      case 'shuffle': {
        const bursts = 7;
        for (let i = 0; i < bursts; i++) {
          const delay = i * 0.085 + Math.random() * 0.04;
          noise(bus, {
            delay,
            duration: 0.15 + Math.random() * 0.09,
            peak: (0.075 + Math.random() * 0.04) * v,
            from: 2200 + Math.random() * 1600,
            to: 500 + Math.random() * 300,
            q: 0.8,
            attack: 0.012,
            reverb: 0.2,
          });
        }
        voice(bus, {
          freq: 146.83,
          delay: 0.12,
          duration: 1.1,
          peak: 0.05 * v,
          type: 'sine',
          attack: 0.12,
          lowpass: 500,
          reverb: 0.35,
        });
        break;
      }

      // Завершение расчёта: мягкая восходящая пентатоника (ля-минор)
      case 'chime': {
        const notes = [220, 261.63, 329.63]; // A3 — C4 — E4
        notes.forEach((freq, i) => {
          bell(bus, freq, (0.24 - i * 0.03) * v, i * 0.26, 1 + i * 0.15);
        });
        break;
      }

      // Вытягивание рун: шорох мешочка и низкий гулкий тон
      case 'draw': {
        for (let i = 0; i < 4; i++) {
          noise(bus, {
            delay: i * 0.07 + Math.random() * 0.03,
            duration: 0.13 + Math.random() * 0.07,
            peak: (0.06 + Math.random() * 0.03) * v,
            from: 1800 + Math.random() * 1200,
            to: 420,
            q: 1,
            attack: 0.015,
            reverb: 0.25,
          });
        }
        bell(bus, 164.81, 0.2 * v, 0.3, 1.2); // E3
        break;
      }
    }
  } catch {
    // Игнорируем сбои планирования — тишина лучше падения
  }
}

/**
 * Подготавливает аудиодвижок внутри пользовательского жеста.
 * Полезно вызывать заранее, чтобы первый звук прозвучал без задержки.
 */
export function primeAudio(): void {
  ensureAudio();
}
