/**
 * Астрологический модуль
 * Расчёт фаз луны, положения планет, знаков зодиака и астрологических аспектов
 */

// Положения Луны и планет считаются настоящей эфемеридой (astronomy-engine:
// чистый JS, без сети и файлов данных). Раньше знак Луны выводился из
// «время / 2,5 дня по кругу» и был неверен 93% дней, а ретроградность
// планет задавалась выдуманными окнами по дням года.
import * as Astronomy from 'astronomy-engine';
import { getLunarDayInfo } from '../data/lunarDays';

// ==================== ТИПЫ ====================

export interface MoonData {
  phase: number; // 0-1 (0 = новолуние, 0.5 = полнолуние)
  phaseName: string;
  phaseNameRu: string;
  illumination: number; // 0-100%
  lunarDay: number; // 1-30
  /** Начало и конец текущих лунных суток (нет, если эфемерида недоступна) */
  lunarDayStart?: Date;
  lunarDayEnd?: Date;
  moonSign: ZodiacSign;
  isWaxing: boolean; // растущая
  isWaning: boolean; // убывающая
  emoji: string;
}

export interface ZodiacSign {
  name: string;
  nameRu: string;
  symbol: string;
  element: 'fire' | 'earth' | 'air' | 'water';
  elementRu: string;
  quality: 'cardinal' | 'fixed' | 'mutable';
  qualityRu: string;
  rulingPlanet: string;
  rulingPlanetRu: string;
}

export interface PlanetPosition {
  name: string;
  nameRu: string;
  symbol: string;
  sign: ZodiacSign;
  degree: number;
  isRetrograde: boolean;
  influence: string;
}

export interface DailyAstrology {
  date: Date;
  dayOfWeek: string;
  dayOfWeekRu: string;
  rulingPlanet: string;
  rulingPlanetRu: string;
  moon: MoonData;
  sunSign: ZodiacSign;
  favorableActivities: string[];
  unfavorableActivities: string[];
  overallEnergy: 'high' | 'medium' | 'low';
  energyDescription: string;
}

// ==================== ДАННЫЕ ====================

export const ZODIAC_SIGNS: ZodiacSign[] = [
  { name: 'Aries', nameRu: 'Овен', symbol: '♈', element: 'fire', elementRu: 'Огонь', quality: 'cardinal', qualityRu: 'Кардинальный', rulingPlanet: 'Mars', rulingPlanetRu: 'Марс' },
  { name: 'Taurus', nameRu: 'Телец', symbol: '♉', element: 'earth', elementRu: 'Земля', quality: 'fixed', qualityRu: 'Фиксированный', rulingPlanet: 'Venus', rulingPlanetRu: 'Венера' },
  { name: 'Gemini', nameRu: 'Близнецы', symbol: '♊', element: 'air', elementRu: 'Воздух', quality: 'mutable', qualityRu: 'Мутабельный', rulingPlanet: 'Mercury', rulingPlanetRu: 'Меркурий' },
  { name: 'Cancer', nameRu: 'Рак', symbol: '♋', element: 'water', elementRu: 'Вода', quality: 'cardinal', qualityRu: 'Кардинальный', rulingPlanet: 'Moon', rulingPlanetRu: 'Луна' },
  { name: 'Leo', nameRu: 'Лев', symbol: '♌', element: 'fire', elementRu: 'Огонь', quality: 'fixed', qualityRu: 'Фиксированный', rulingPlanet: 'Sun', rulingPlanetRu: 'Солнце' },
  { name: 'Virgo', nameRu: 'Дева', symbol: '♍', element: 'earth', elementRu: 'Земля', quality: 'mutable', qualityRu: 'Мутабельный', rulingPlanet: 'Mercury', rulingPlanetRu: 'Меркурий' },
  { name: 'Libra', nameRu: 'Весы', symbol: '♎', element: 'air', elementRu: 'Воздух', quality: 'cardinal', qualityRu: 'Кардинальный', rulingPlanet: 'Venus', rulingPlanetRu: 'Венера' },
  { name: 'Scorpio', nameRu: 'Скорпион', symbol: '♏', element: 'water', elementRu: 'Вода', quality: 'fixed', qualityRu: 'Фиксированный', rulingPlanet: 'Pluto', rulingPlanetRu: 'Плутон' },
  { name: 'Sagittarius', nameRu: 'Стрелец', symbol: '♐', element: 'fire', elementRu: 'Огонь', quality: 'mutable', qualityRu: 'Мутабельный', rulingPlanet: 'Jupiter', rulingPlanetRu: 'Юпитер' },
  { name: 'Capricorn', nameRu: 'Козерог', symbol: '♑', element: 'earth', elementRu: 'Земля', quality: 'cardinal', qualityRu: 'Кардинальный', rulingPlanet: 'Saturn', rulingPlanetRu: 'Сатурн' },
  { name: 'Aquarius', nameRu: 'Водолей', symbol: '♒', element: 'air', elementRu: 'Воздух', quality: 'fixed', qualityRu: 'Фиксированный', rulingPlanet: 'Uranus', rulingPlanetRu: 'Уран' },
  { name: 'Pisces', nameRu: 'Рыбы', symbol: '♓', element: 'water', elementRu: 'Вода', quality: 'mutable', qualityRu: 'Мутабельный', rulingPlanet: 'Neptune', rulingPlanetRu: 'Нептун' },
];

const MOON_PHASES = [
  { name: 'New Moon', nameRu: 'Новолуние', emoji: '🌑', range: [0, 0.0625] },
  { name: 'Waxing Crescent', nameRu: 'Растущий серп', emoji: '🌒', range: [0.0625, 0.1875] },
  { name: 'First Quarter', nameRu: 'Первая четверть', emoji: '🌓', range: [0.1875, 0.3125] },
  { name: 'Waxing Gibbous', nameRu: 'Растущая луна', emoji: '🌔', range: [0.3125, 0.4375] },
  { name: 'Full Moon', nameRu: 'Полнолуние', emoji: '🌕', range: [0.4375, 0.5625] },
  { name: 'Waning Gibbous', nameRu: 'Убывающая луна', emoji: '🌖', range: [0.5625, 0.6875] },
  { name: 'Last Quarter', nameRu: 'Последняя четверть', emoji: '🌗', range: [0.6875, 0.8125] },
  { name: 'Waning Crescent', nameRu: 'Убывающий серп', emoji: '🌘', range: [0.8125, 1] },
];

const WEEKDAY_PLANETS: { [key: number]: { planet: string, planetRu: string } } = {
  0: { planet: 'Sun', planetRu: 'Солнце' },      // Воскресенье
  1: { planet: 'Moon', planetRu: 'Луна' },       // Понедельник
  2: { planet: 'Mars', planetRu: 'Марс' },       // Вторник
  3: { planet: 'Mercury', planetRu: 'Меркурий' }, // Среда
  4: { planet: 'Jupiter', planetRu: 'Юпитер' },  // Четверг
  5: { planet: 'Venus', planetRu: 'Венера' },    // Пятница
  6: { planet: 'Saturn', planetRu: 'Сатурн' },   // Суббота
};

const WEEKDAYS_RU = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

// ==================== ФУНКЦИИ ====================

/**
 * Простой расчёт фазы луны без внешних библиотек
 */
function calculateMoonPhase(date: Date): { phase: number; fraction: number } {
  // Известная дата новолуния для базы расчёта (1 января 2000)
  const knownNewMoon = new Date('2000-01-06T18:14:00Z').getTime();
  const lunarCycle = 29.53058867; // дней
  const msPerDay = 24 * 60 * 60 * 1000;

  const daysSinceKnown = (date.getTime() - knownNewMoon) / msPerDay;
  const currentCycle = daysSinceKnown / lunarCycle;
  const phase = currentCycle - Math.floor(currentCycle);

  // Расчёт освещённости (0 = новолуние, 0.5 = полнолуние)
  const fraction = (1 - Math.cos(2 * Math.PI * phase)) / 2;

  return { phase, fraction };
}

function moonSignIndexAt(date: Date): number {
  try {
    return Math.floor(Astronomy.EclipticGeoMoon(date).lon / 30) % 12;
  } catch {
    // Средняя долгота Луны (точность — несколько градусов)
    const days = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 864e5;
    const lon = ((218.316 + 13.176396 * days) % 360 + 360) % 360;
    return Math.floor(lon / 30);
  }
}

// Лунные сутки считаются для Москвы — как в большинстве русских лунных
// календарей (время восхода Луны зависит от места)
const LUNAR_OBSERVER = { latitude: 55.7558, longitude: 37.6173, height: 150 };

interface LunarDayResult {
  day: number;
  start?: Date;
  end?: Date;
}

// Расчёт занимает несколько миллисекунд, а экраны запрашивают Луну
// многократно — запоминаем последние сутки
let lunarCache: LunarDayResult | null = null;

/**
 * Лунные сутки по русской традиции: первые начинаются в момент новолуния,
 * каждые следующие — с восходом Луны; в цикле 29 или 30 суток
 */
function calculateLunarDay(date: Date, phase: number): LunarDayResult {
  if (lunarCache?.start && lunarCache.end && date >= lunarCache.start && date < lunarCache.end) {
    return lunarCache;
  }
  try {
    const observer = new Astronomy.Observer(LUNAR_OBSERVER.latitude, LUNAR_OBSERVER.longitude, LUNAR_OBSERVER.height);
    const newMoon = Astronomy.SearchMoonPhase(0, date, -32);
    if (!newMoon) throw new Error('new moon not found');

    let day = 1;
    let start = newMoon.date;
    let cursor = newMoon;
    let nextRise: Date | undefined;
    for (;;) {
      const rise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, +1, cursor, 3);
      if (!rise) break;
      if (rise.date > date) {
        nextRise = rise.date;
        break;
      }
      day++;
      start = rise.date;
      cursor = rise.AddDays(1 / 1440);
    }

    // Сутки заканчиваются со следующим восходом или новым новолунием
    const nextNewMoon = Astronomy.SearchMoonPhase(0, date, 32)?.date;
    let end = nextRise;
    if (nextNewMoon && (!end || nextNewMoon < end)) end = nextNewMoon;

    lunarCache = { day: Math.min(day, 30), start, end };
    return lunarCache;
  } catch {
    // Приближение по среднему циклу: число суток с новолуния
    return { day: Math.min(Math.floor(phase * 29.53) + 1, 30) };
  }
}

/**
 * Получить данные о луне на указанную дату
 */
export function getMoonData(date: Date = new Date()): MoonData {
  let phase: number;
  let fraction: number;

  try {
    // Элонгация Луны от Солнца: 0° — новолуние, 180° — полнолуние
    phase = Astronomy.MoonPhase(date) / 360;
    fraction = Astronomy.Illumination(Astronomy.Body.Moon, date).phase_fraction;
  } catch (error) {
    console.warn('Moon ephemeris unavailable, using mean-cycle approximation');
    const moonCalc = calculateMoonPhase(date);
    phase = moonCalc.phase;
    fraction = moonCalc.fraction;
  }

  // Определяем фазу луны
  let moonPhase = MOON_PHASES[0];
  for (const p of MOON_PHASES) {
    if (phase >= p.range[0] && phase < p.range[1]) {
      moonPhase = p;
      break;
    }
  }

  const lunar = calculateLunarDay(date, phase);

  // Знак Луны — по её настоящей эклиптической долготе (30° на знак)
  const moonSign = ZODIAC_SIGNS[moonSignIndexAt(date)];

  return {
    phase,
    phaseName: moonPhase.name,
    phaseNameRu: moonPhase.nameRu,
    illumination: Math.round(fraction * 100),
    lunarDay: lunar.day,
    lunarDayStart: lunar.start,
    lunarDayEnd: lunar.end,
    moonSign,
    isWaxing: phase < 0.5,
    isWaning: phase >= 0.5,
    emoji: moonPhase.emoji,
  };
}

/**
 * Получить знак зодиака по дате рождения
 */
export function getZodiacSign(date: Date): ZodiacSign {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const signIndex =
    (month === 3 && day >= 21) || (month === 4 && day <= 19) ? 0 :  // Овен
    (month === 4 && day >= 20) || (month === 5 && day <= 20) ? 1 :  // Телец
    (month === 5 && day >= 21) || (month === 6 && day <= 20) ? 2 :  // Близнецы
    (month === 6 && day >= 21) || (month === 7 && day <= 22) ? 3 :  // Рак
    (month === 7 && day >= 23) || (month === 8 && day <= 22) ? 4 :  // Лев
    (month === 8 && day >= 23) || (month === 9 && day <= 22) ? 5 :  // Дева
    (month === 9 && day >= 23) || (month === 10 && day <= 22) ? 6 : // Весы
    (month === 10 && day >= 23) || (month === 11 && day <= 21) ? 7 : // Скорпион
    (month === 11 && day >= 22) || (month === 12 && day <= 21) ? 8 : // Стрелец
    (month === 12 && day >= 22) || (month === 1 && day <= 19) ? 9 : // Козерог
    (month === 1 && day >= 20) || (month === 2 && day <= 18) ? 10 : // Водолей
    11; // Рыбы

  return ZODIAC_SIGNS[signIndex];
}

/**
 * Получить текущий знак Солнца
 */
export function getCurrentSunSign(date: Date = new Date()): ZodiacSign {
  return getZodiacSign(date);
}

/**
 * Получить полную астрологическую информацию на день
 */
export function getDailyAstrology(date: Date = new Date()): DailyAstrology {
  const moon = getMoonData(date);
  const sunSign = getCurrentSunSign(date);
  const dayOfWeek = date.getDay();
  const weekdayPlanet = WEEKDAY_PLANETS[dayOfWeek];

  // Благоприятные/неблагоприятные активности на основе лунного дня и фазы
  const { favorable, unfavorable } = getActivitiesByMoonPhase(moon);

  // Общая энергия дня
  const energy = calculateDayEnergy(moon, dayOfWeek);

  return {
    date,
    dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
    dayOfWeekRu: WEEKDAYS_RU[dayOfWeek],
    rulingPlanet: weekdayPlanet.planet,
    rulingPlanetRu: weekdayPlanet.planetRu,
    moon,
    sunSign,
    favorableActivities: favorable,
    unfavorableActivities: unfavorable,
    overallEnergy: energy.level,
    energyDescription: energy.description,
  };
}

const WAXING_ACTIVITIES = {
  favorable: ['Начало новых проектов', 'Важные переговоры', 'Новые знакомства'],
  unfavorable: ['Расставания', 'Резкие отказы'],
};
const WANING_ACTIVITIES = {
  favorable: ['Завершение проектов', 'Избавление от вредных привычек', 'Возврат долгов'],
  unfavorable: ['Начало важных дел', 'Крупные покупки'],
};

/**
 * Благоприятные и неблагоприятные дела: сначала по характеру лунных суток,
 * затем — по растущей или убывающей Луне
 */
function getActivitiesByMoonPhase(moon: MoonData): { favorable: string[], unfavorable: string[] } {
  const day = getLunarDayInfo(moon.lunarDay);
  const phase = moon.isWaxing ? WAXING_ACTIVITIES : WANING_ACTIVITIES;
  const merge = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));
  return {
    favorable: merge(day.favorable, phase.favorable),
    unfavorable: merge(day.unfavorable, phase.unfavorable),
  };
}

const HEAVY_LUNAR_DAYS = [9, 15, 19, 23, 29];

/**
 * Расчёт энергии дня
 */
function calculateDayEnergy(moon: MoonData, dayOfWeek: number): { level: 'high' | 'medium' | 'low', description: string } {
  // Полнолуние и новолуние - особая энергия
  if (moon.phaseName === 'Full Moon') {
    return { level: 'high', description: 'Полнолуние усиливает эмоции и интуицию. День высокой энергии и важных решений.' };
  }
  if (moon.phaseName === 'New Moon') {
    return { level: 'low', description: 'Новолуние — время для планирования и отдыха. Сохраняйте энергию для нового цикла.' };
  }

  // Традиционно самые тяжёлые лунные сутки
  if (HEAVY_LUNAR_DAYS.includes(moon.lunarDay)) {
    return { level: 'low', description: `${moon.lunarDay}-е лунные сутки считаются одними из самых тяжёлых в цикле. Не начинайте важного, берегите силы и нервы.` };
  }

  // Пятница и воскресенье - благоприятные дни
  if (dayOfWeek === 5 || dayOfWeek === 0) {
    return { level: 'high', description: 'Благоприятный день под покровительством планеты гармонии. Хорош для творчества и отношений.' };
  }

  // Вторник и суббота - напряжённые дни
  if (dayOfWeek === 2 || dayOfWeek === 6) {
    return { level: 'medium', description: 'День требует осторожности. Хорош для решительных действий, но избегайте конфликтов.' };
  }

  return { level: 'medium', description: 'Сбалансированный день. Следуйте интуиции и не перенапрягайтесь.' };
}

/**
 * Получить совместимость знаков зодиака
 */
export function getZodiacCompatibility(sign1: ZodiacSign, sign2: ZodiacSign): {
  score: number;
  description: string;
} {
  // Совместимость по аспекту между знаками — расстоянию по зодиакальному
  // кругу. Раньше оценка включала Math.random(), и «гармония с Луной» в одном
  // и том же раскладе менялась при каждом открытии
  const i1 = ZODIAC_SIGNS.findIndex(s => s.name === sign1.name);
  const i2 = ZODIAC_SIGNS.findIndex(s => s.name === sign2.name);
  const distance = Math.min((i2 - i1 + 12) % 12, (i1 - i2 + 12) % 12);

  switch (distance) {
    case 0:
      return { score: 88, description: 'Один знак: глубокое понимание, но и общие слабые стороны.' };
    case 4:
      return { score: 92, description: 'Трин — знаки одной стихии. Гармония и общие ценности.' };
    case 2:
      return { score: 80, description: 'Секстиль — дружественные стихии. Партнёры вдохновляют друг друга.' };
    case 6:
      return { score: 70, description: 'Оппозиция — противоположности, которые притягиваются и дополняют друг друга.' };
    case 3:
      return { score: 55, description: 'Квадрат — напряжение и разные темпы. Союз требует работы, но даёт рост.' };
    default:
      return { score: 62, description: 'Соседние или несвязанные знаки: мало общего, нужно учиться понимать друг друга.' };
  }
}

const RETROGRADE_BODIES: Array<{ body: Astronomy.Body; nameRu: string }> = [
  { body: Astronomy.Body.Mercury, nameRu: 'Меркурий' },
  { body: Astronomy.Body.Venus, nameRu: 'Венера' },
  { body: Astronomy.Body.Mars, nameRu: 'Марс' },
];

function geocentricLongitude(body: Astronomy.Body, date: Date): number {
  return Astronomy.Ecliptic(Astronomy.GeoVector(body, date, true)).elon;
}

/**
 * Ретроградные личные планеты (Меркурий, Венера, Марс) на дату: планета
 * ретроградна, когда её видимая долгота с Земли уменьшается
 */
export function getRetrogradePlanets(date: Date = new Date()): string[] {
  try {
    const nextDay = new Date(date.getTime() + 864e5);
    return RETROGRADE_BODIES.filter(({ body }) => {
      let delta = geocentricLongitude(body, nextDay) - geocentricLongitude(body, date);
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      return delta < 0;
    }).map(({ nameRu }) => nameRu);
  } catch {
    return [];
  }
}

/**
 * Форматирование астрологической информации для отображения
 */
export function formatAstrologyForReading(astrology: DailyAstrology): string {
  const retrograde = getRetrogradePlanets(astrology.date);

  let text = `🌙 **Лунный календарь**\n`;
  text += `${astrology.moon.emoji} ${astrology.moon.phaseNameRu} (${astrology.moon.illumination}%)\n`;
  const lunarDay = getLunarDayInfo(astrology.moon.lunarDay);
  text += `${astrology.moon.lunarDay}-е лунные сутки — «${lunarDay.symbol}»`;
  const range = formatLunarDayRange(astrology.moon);
  text += range ? ` (${range})\n` : `\n`;
  text += `${lunarDay.essence}\n`;
  text += `Луна в знаке ${astrology.moon.moonSign.nameRu} ${astrology.moon.moonSign.symbol}\n\n`;

  text += `☀️ **Солнце в знаке ${astrology.sunSign.nameRu}** ${astrology.sunSign.symbol}\n`;
  text += `Стихия: ${astrology.sunSign.elementRu}\n\n`;

  text += `📅 **${astrology.dayOfWeekRu}**\n`;
  text += `Управляющая планета: ${astrology.rulingPlanetRu}\n\n`;

  if (retrograde.length > 0) {
    text += `⚠️ **Ретроградные планеты:** ${retrograde.join(', ')}\n\n`;
  }


  text += `✨ **Энергия дня:** ${astrology.energyDescription}`;

  return text;
}

/**
 * «с 30 сент., 18:43 до 1 окт., 19:02» — границы текущих лунных суток
 * по местному времени устройства
 */
export function formatLunarDayRange(moon: MoonData): string {
  if (!moon.lunarDayStart || !moon.lunarDayEnd) return '';
  const fmt = (d: Date) => d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `с ${fmt(moon.lunarDayStart)} до ${fmt(moon.lunarDayEnd)}`;
}
