/**
 * Астрологический модуль
 * Расчёт фаз луны, положения планет, знаков зодиака и астрологических аспектов
 */

import SunCalc from 'suncalc';

// ==================== ТИПЫ ====================

export interface MoonData {
  phase: number; // 0-1 (0 = новолуние, 0.5 = полнолуние)
  phaseName: string;
  phaseNameRu: string;
  illumination: number; // 0-100%
  lunarDay: number; // 1-30
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
  luckyNumbers: number[];
  luckyColors: string[];
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

const LUCKY_COLORS_BY_ELEMENT = {
  fire: ['красный', 'оранжевый', 'золотой', 'алый'],
  earth: ['зелёный', 'коричневый', 'бежевый', 'терракотовый'],
  air: ['голубой', 'жёлтый', 'белый', 'серебряный'],
  water: ['синий', 'фиолетовый', 'бирюзовый', 'серебристый'],
};

// ==================== ФУНКЦИИ ====================

/**
 * Получить данные о луне на указанную дату
 */
export function getMoonData(date: Date = new Date()): MoonData {
  const moonIllum = SunCalc.getMoonIllumination(date);
  const phase = moonIllum.phase;

  // Определяем фазу луны
  let moonPhase = MOON_PHASES[0];
  for (const p of MOON_PHASES) {
    if (phase >= p.range[0] && phase < p.range[1]) {
      moonPhase = p;
      break;
    }
  }

  // Расчёт лунного дня (приблизительно)
  const lunarDay = Math.floor(phase * 29.53) + 1;

  // Определяем знак луны (упрощённый расчёт на основе даты)
  const moonSignIndex = Math.floor((date.getTime() / (2.5 * 24 * 60 * 60 * 1000)) % 12);
  const moonSign = ZODIAC_SIGNS[moonSignIndex];

  return {
    phase,
    phaseName: moonPhase.name,
    phaseNameRu: moonPhase.nameRu,
    illumination: Math.round(moonIllum.fraction * 100),
    lunarDay: Math.min(lunarDay, 30),
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

  // Генерация счастливых чисел на основе даты и фазы луны
  const seed = date.getDate() + date.getMonth() * 31 + Math.floor(moon.phase * 100);
  const luckyNumbers = generateLuckyNumbers(seed, 5);

  // Счастливые цвета на основе элемента знака луны
  const luckyColors = LUCKY_COLORS_BY_ELEMENT[moon.moonSign.element].slice(0, 3);

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
    luckyNumbers,
    luckyColors,
    favorableActivities: favorable,
    unfavorableActivities: unfavorable,
    overallEnergy: energy.level,
    energyDescription: energy.description,
  };
}

/**
 * Генерация счастливых чисел
 */
function generateLuckyNumbers(seed: number, count: number): number[] {
  const numbers: number[] = [];
  let current = seed;

  while (numbers.length < count) {
    current = (current * 1103515245 + 12345) % 2147483648;
    const num = (current % 49) + 1;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }

  return numbers.sort((a, b) => a - b);
}

/**
 * Получить активности по фазе луны
 */
function getActivitiesByMoonPhase(moon: MoonData): { favorable: string[], unfavorable: string[] } {
  if (moon.isWaxing) {
    // Растущая луна - начинания, рост
    return {
      favorable: [
        'Начало новых проектов',
        'Важные переговоры',
        'Финансовые вложения',
        'Укрепление здоровья',
        'Новые знакомства',
      ],
      unfavorable: [
        'Завершение дел',
        'Хирургические операции',
        'Расставания',
      ],
    };
  } else {
    // Убывающая луна - завершение, очищение
    return {
      favorable: [
        'Завершение проектов',
        'Уборка и очищение',
        'Избавление от вредных привычек',
        'Медитация и самоанализ',
        'Возврат долгов',
      ],
      unfavorable: [
        'Начало важных дел',
        'Свадьбы',
        'Крупные покупки',
      ],
    };
  }
}

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
  // Одинаковая стихия - высокая совместимость
  if (sign1.element === sign2.element) {
    return { score: 85 + Math.floor(Math.random() * 10), description: 'Гармоничный союз одной стихии. Глубокое понимание и общие ценности.' };
  }

  // Совместимые стихии
  const compatible: { [key: string]: string[] } = {
    fire: ['air'],
    air: ['fire'],
    earth: ['water'],
    water: ['earth'],
  };

  if (compatible[sign1.element]?.includes(sign2.element)) {
    return { score: 70 + Math.floor(Math.random() * 15), description: 'Взаимодополняющие энергии. Партнёры вдохновляют друг друга.' };
  }

  // Противоположные стихии
  return { score: 50 + Math.floor(Math.random() * 20), description: 'Непростой союз, требующий работы. Но противоположности притягиваются и учат друг друга.' };
}

/**
 * Получить ретроградные планеты (упрощённый расчёт)
 */
export function getRetrogradePlanets(date: Date = new Date()): string[] {
  const retrogrades: string[] = [];
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));

  // Меркурий ретроградный ~3 раза в год по ~3 недели
  if ((dayOfYear >= 20 && dayOfYear <= 40) || (dayOfYear >= 140 && dayOfYear <= 160) || (dayOfYear >= 280 && dayOfYear <= 300)) {
    retrogrades.push('Меркурий');
  }

  // Венера ретроградная ~раз в 18 месяцев
  if (dayOfYear >= 200 && dayOfYear <= 240 && date.getFullYear() % 2 === 0) {
    retrogrades.push('Венера');
  }

  // Марс ретроградный ~раз в 2 года
  if (dayOfYear >= 270 && dayOfYear <= 330 && date.getFullYear() % 2 === 1) {
    retrogrades.push('Марс');
  }

  return retrogrades;
}

/**
 * Форматирование астрологической информации для отображения
 */
export function formatAstrologyForReading(astrology: DailyAstrology): string {
  const retrograde = getRetrogradePlanets(astrology.date);

  let text = `🌙 **Лунный календарь**\n`;
  text += `${astrology.moon.emoji} ${astrology.moon.phaseNameRu} (${astrology.moon.illumination}%)\n`;
  text += `Лунный день: ${astrology.moon.lunarDay}\n`;
  text += `Луна в ${astrology.moon.moonSign.nameRu} ${astrology.moon.moonSign.symbol}\n\n`;

  text += `☀️ **Солнце в ${astrology.sunSign.nameRu}** ${astrology.sunSign.symbol}\n`;
  text += `Стихия: ${astrology.sunSign.elementRu}\n\n`;

  text += `📅 **${astrology.dayOfWeekRu}**\n`;
  text += `Управляющая планета: ${astrology.rulingPlanetRu}\n\n`;

  if (retrograde.length > 0) {
    text += `⚠️ **Ретроградные планеты:** ${retrograde.join(', ')}\n\n`;
  }

  text += `🍀 **Счастливые числа:** ${astrology.luckyNumbers.join(', ')}\n`;
  text += `🎨 **Счастливые цвета:** ${astrology.luckyColors.join(', ')}\n\n`;

  text += `✨ **Энергия дня:** ${astrology.energyDescription}`;

  return text;
}
