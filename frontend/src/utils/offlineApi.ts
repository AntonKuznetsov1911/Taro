// Offline API - Полная офлайн функциональность для GitHub Pages
import type { ImageSourcePropType } from 'react-native';
import { getRandomCards, MAJOR_ARCANA, FULL_TAROT_DECK, TarotCard, getCardById } from '../data/tarotCards';
import { resolveSpread, resolveCategory, CATEGORY_LENS, SUIT_THEMES, SpreadDef, CategoryId } from '../data/spreads';
import { getDailyAstrology, formatAstrologyForReading, getMoonData, getRetrogradePlanets, DailyAstrology, ZodiacSign, getZodiacCompatibility } from './astrology';
import { generateMysticalCardBack } from './tarotCardImages';
import { getTarotCardImage } from './tarotCardAssets';
import { UserProfile } from '../stores/userProfileStore';

// Тип для опционального профиля пользователя в функциях
export interface PersonalizationContext {
  profile?: UserProfile | null;
}

/** Карта в раскладе: ориентация решается один раз и дальше используется
 *  и для картинки, и для текста — иначе они расходятся */
export type DrawnCard = TarotCard & { is_reversed: boolean };

export interface OfflineReadingResult {
  cards: DrawnCard[];
  positions: string[];
  interpretation: string;
  question?: string;
  timestamp: string;
}

// При обычном перемешивании колоды половина карт ложится перевёрнутой
const REVERSAL_PROBABILITY = 0.5;

/**
 * Генерация офлайн гадания на картах Таро
 */
export async function generateOfflineTarotReading(
  question?: string,
  spreadId?: string,
  categoryId?: string,
  context?: PersonalizationContext
): Promise<OfflineReadingResult> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const spread = resolveSpread(spreadId);
  const category = resolveCategory(categoryId);
  const cards: DrawnCard[] = getRandomCards(spread.cards).map(card => ({
    ...card,
    is_reversed: Math.random() < REVERSAL_PROBABILITY,
  }));
  const interpretation = generateDetailedInterpretation(cards, spread, category, question, context?.profile);

  return {
    cards,
    positions: spread.positions.map(p => p.title),
    interpretation,
    question,
    timestamp: new Date().toISOString()
  };
}

/** Первая фраза значения — для коротких ссылок на карту в выводе */
function firstClause(text: string): string {
  return text.split(/[.,;]/)[0].trim().toLowerCase();
}

/**
 * Толкование: каждая карта читается через свою позицию и тему вопроса,
 * в конце — вывод по раскладу в целом
 */
function generateDetailedInterpretation(
  cards: DrawnCard[],
  spread: SpreadDef,
  category: CategoryId,
  question?: string,
  profile?: UserProfile | null
): string {
  const lens = CATEGORY_LENS[category];
  const astrology = getDailyAstrology();
  const retrograde = getRetrogradePlanets();
  const greeting = profile?.name ? `${profile.name}, карты` : 'Карты';

  let text = `🔮 **${spread.name} · ${lens.name}**\n\n`;
  if (question) text += `*Ваш вопрос: «${question}»*\n\n`;
  text += `${greeting} показывают, что происходит ${lens.area}.\n\n`;

  text += `## 🃏 Карты расклада\n\n`;
  cards.forEach((card, index) => {
    const position = spread.positions[index] ?? { title: `Карта ${index + 1}`, hint: '' };
    const meaning = card.is_reversed ? card.reversed_meaning : card.upright_meaning;

    text += `### ${index + 1}. ${position.title}: ${card.name}${card.is_reversed ? ' (перевёрнутая)' : ''}\n\n`;
    if (position.hint) text += `*Позиция: ${position.hint}.*\n\n`;
    text += `${meaning}.\n\n`;
    if (card.is_reversed) {
      // Ключевые слова описывают прямое положение — для перевёрнутой карты
      // говорим о них как о заблокированных
      text += `Темы карты — ${card.keywords.slice(0, 2).join(' и ')} — сейчас ${lens.area} заблокированы или проявляются с трудом.\n\n`;
    } else {
      text += `${lens.area[0].toUpperCase()}${lens.area.slice(1)} на первый план выходят ${card.keywords.slice(0, 2).join(' и ')}.\n\n`;
    }
  });

  // Вывод по раскладу
  text += `## 💫 Общий вывод и рекомендации\n\n`;
  const majors = cards.filter(c => c.type === 'major').length;
  const reversed = cards.filter(c => c.is_reversed).length;
  const suitCounts = new Map<string, number>();
  cards.filter(c => c.type !== 'major').forEach(c => suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1));
  const [topSuit, topCount] = [...suitCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];

  if (cards.length > 1 && majors * 2 >= cards.length) {
    text += `- В раскладе много старших арканов (${majors} из ${cards.length}): ситуацию определяют крупные жизненные силы, а не мелкие обстоятельства.\n`;
  } else if (cards.length === 1 && majors === 1) {
    text += `- Выпал старший аркан — вопрос важнее, чем может казаться.\n`;
  }
  if (topSuit && (topCount >= 2 || cards.length === 1)) {
    const theme = SUIT_THEMES[topSuit];
    text += `- Преобладает масть ${theme.name}: главное здесь — ${theme.theme}.`;
    text += topSuit === lens.keySuit ? ' Это прямо отвечает на тему вашего вопроса.\n' : '\n';
  }
  if (cards.length > 1 && reversed * 2 > cards.length) {
    text += `- Больше половины карт перевёрнуты: энергия заблокирована, многое зависит от того, что вы пока не решаетесь признать или сделать.\n`;
  }
  if (cards.length > 1) {
    const last = cards[cards.length - 1];
    const lastPos = spread.positions[cards.length - 1]?.title ?? 'Итог';
    text += `- Карта «${last.name}» в позиции «${lastPos}» говорит: ${firstClause(last.is_reversed ? last.reversed_meaning : last.upright_meaning)}.\n`;
  }
  text += `\n**Совет:** ${lens.advice}\n\n`;

  // Астрологический фон — отдельно от вывода по картам
  text += `## 🌙 Космический контекст\n\n`;
  if (profile?.sunSign) {
    const compatibility = getZodiacCompatibility(profile.sunSign, astrology.moon.moonSign);
    text += `**Ваш знак:** ${profile.sunSign.nameRu} ${profile.sunSign.symbol} · **гармония с Луной:** ${compatibility.score}%\n\n`;
  }
  text += `**Луна:** ${astrology.moon.phaseNameRu} в знаке ${astrology.moon.moonSign.nameRu} ${astrology.moon.moonSign.symbol} · ${astrology.moon.lunarDay}-й лунный день\n\n`;
  if (retrograde.length > 0) text += `**Ретроградные планеты:** ${retrograde.join(', ')}\n\n`;
  text += `${astrology.energyDescription}\n`;

  return text;
}

/**
 * Получить изображение рубашки карты (SVG)
 */
export async function getOfflineCardBack(): Promise<string> {
  return generateMysticalCardBack();
}

/**
 * Иллюстрация карты Таро (скан колоды Райдера — Уэйта — Смит из assets/cards).
 *
 * Возвращает готовый источник для <Image source={...} /> — это require()-ассет,
 * а не data-URI. Перевёрнутое положение картинку не меняет: разворот на 180°
 * делается стилем на самом <Image> (REVERSED_IMAGE_STYLE), поэтому параметр
 * isReversed сохранён только ради совместимости вызовов и не влияет на результат.
 */
export function generateTarotCardSVG(card: TarotCard, _isReversed: boolean = false): ImageSourcePropType | undefined {
  return getTarotCardImage(card);
}

/**
 * Карта дня: зависит только от календарной даты, одна и та же на главном
 * экране и в гороскопе. Раньше в расчёт входила текущая фаза Луны — карта
 * менялась посреди дня, — выбор шёл только из 22 старших арканов и почти
 * по порядку день за днём, а гороскоп брал вообще случайную карту.
 */
export function getDailyCard(date: Date = new Date()): { card: TarotCard; isReversed: boolean } {
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    hash = Math.imul(hash ^ dateKey.charCodeAt(i), 16777619) >>> 0;
  }
  // Перемешиваем биты, чтобы соседние даты давали несвязанные карты
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b) >>> 0;
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35) >>> 0;
  hash ^= hash >>> 16;
  hash >>>= 0;
  return {
    card: FULL_TAROT_DECK[hash % FULL_TAROT_DECK.length],
    isReversed: ((hash >>> 16) & 1) === 1,
  };
}

/**
 * Получить карту дня с астрологическим контекстом
 */
export async function getOfflineDailyCard(): Promise<{
  card: TarotCard;
  message: string;
  is_reversed: boolean;
  astrology: DailyAstrology;
}> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const today = new Date();
  const astrology = getDailyAstrology(today);

  const { card, isReversed } = getDailyCard(today);

  const moonContext = astrology.moon.isWaxing
    ? 'Растущая луна усиливает энергию карты'
    : 'Убывающая луна призывает к рефлексии';

  const meaningHint = firstClause(isReversed ? card.reversed_meaning : card.upright_meaning);
  const messages = [
    `${astrology.moon.emoji} ${moonContext}. ${card.name}${isReversed ? ' (перевёрнутая)' : ''} направляет вас сегодня: ${meaningHint}.`,
    `${astrology.moon.emoji} ${astrology.moon.phaseNameRu}. Энергия карты «${card.name}» освещает ваш путь.`,
    `${astrology.moon.emoji} Луна в знаке ${astrology.moon.moonSign.nameRu}. ${card.name} несёт важное послание.`,
    `${astrology.moon.emoji} ${moonContext}. Карта «${card.name}» говорит: ${meaningHint}.`
  ];

  return {
    card,
    message: messages[today.getDay() % messages.length],
    is_reversed: isReversed,
    astrology
  };
}

/**
 * Генерация офлайн астро-психологического анализа личности
 */
export async function generateOfflineAstroPersonality(answers: any, name?: string): Promise<{
  id: string;
  personality_analysis: string;
  dominant_arcana: string[];
  character_traits: string[];
  life_path: string;
  current_phase: string;
  advice: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Ответы квиза (каждый — {questionId, optionId, keywords, arcana}) должны
  // реально влиять на портрет, а не просто собираться и игнорироваться.
  // Каждый вариант ответа в astroPsychologyQuestions.ts указывает связанный
  // архетип Таро (Russian name, совпадает с MAJOR_ARCANA[i].name) — считаем,
  // какие архетипы выбирались чаще всего, и берём именно их.
  const answerList: Array<{ keywords?: string[]; arcana?: string }> = Array.isArray(answers)
    ? answers
    : [];

  const arcanaCounts = new Map<string, number>();
  const arcanaFirstSeen: string[] = [];
  for (const a of answerList) {
    if (a?.arcana) {
      if (!arcanaCounts.has(a.arcana)) arcanaFirstSeen.push(a.arcana);
      arcanaCounts.set(a.arcana, (arcanaCounts.get(a.arcana) ?? 0) + 1);
    }
  }
  const orderedArcanaNames = arcanaFirstSeen.sort(
    (a, b) => (arcanaCounts.get(b) ?? 0) - (arcanaCounts.get(a) ?? 0)
  );

  const cards: TarotCard[] = [];
  for (const arcanaName of orderedArcanaNames) {
    const match = MAJOR_ARCANA.find(c => c.name === arcanaName);
    if (match && !cards.some(c => c.id === match.id)) cards.push(match);
    if (cards.length === 3) break;
  }
  if (cards.length < 3) {
    const filler = getRandomCards(3).filter(c => !cards.some(existing => existing.id === c.id));
    for (const c of filler) {
      if (cards.length === 3) break;
      cards.push(c);
    }
  }

  const astrology = getDailyAstrology();

  // Генерируем черты характера на основе карт
  const traits = cards.flatMap(card => card.keywords.slice(0, 2));

  // Определяем жизненный путь
  const lifePaths = [
    'Путь Творца — вы призваны создавать и вдохновлять других',
    'Путь Мудреца — ваша миссия в поиске и передаче знаний',
    'Путь Воина — вы несёте силу защиты и справедливости',
    'Путь Целителя — ваш дар в помощи другим и восстановлении гармонии',
    'Путь Провидца — вы способны видеть скрытое и направлять других'
  ];

  const currentPhases = [
    'Фаза Пробуждения — время осознания своего истинного потенциала',
    'Фаза Трансформации — период глубоких внутренних изменений',
    'Фаза Реализации — момент воплощения своих идей в жизнь',
    'Фаза Интеграции — время объединения опыта в мудрость',
    'Фаза Расцвета — период полного раскрытия ваших талантов'
  ];

  // Индекс пути/фазы строим из ключевых слов ответов (стабильно для одного
  // и того же набора ответов), а не только из дня месяца — иначе все, кто
  // проходит квиз в один день, получают одинаковый результат вне
  // зависимости от того, что они отвечали.
  const keywordSeed = answerList.flatMap(a => a.keywords ?? []).join('|');
  let seedHash = 0;
  for (let i = 0; i < keywordSeed.length; i++) {
    seedHash = (seedHash * 31 + keywordSeed.charCodeAt(i)) >>> 0;
  }
  const dayIndex = keywordSeed ? seedHash : new Date().getDate();

  const personalityAnalysis = `
## 🌟 Астро-психологический портрет${name ? ` для ${name}` : ''}

### ${astrology.moon.emoji} Космический контекст вашей личности

**Луна:** ${astrology.moon.phaseNameRu} | **Стихия:** ${astrology.moon.moonSign.elementRu}

---

### 🎴 Доминирующие Арканы вашей души

**${cards[0].name}** — Основа вашей личности
${cards[0].upright_meaning}

**${cards[1].name}** — Ваш внутренний потенциал
${cards[1].upright_meaning}

**${cards[2].name}** — Направление развития
${cards[2].upright_meaning}

---

### ✨ Ключевые черты характера

${traits.map(t => `• **${t}**`).join('\n')}

---

### 🔮 Глубинный анализ

Ваша личность представляет уникальное сочетание энергий ${cards.map(c => c.name).join(', ')}. Это указывает на человека с глубоким внутренним миром и значительным потенциалом для духовного роста.

**Сильные стороны:**
- Интуитивное понимание людей и ситуаций
- Способность видеть суть вещей
- Природная мудрость и проницательность

**Области для развития:**
- Баланс между интуицией и рациональностью
- Практическое применение своих даров
- Доверие к собственному пути

---

💫 *Ваш уникальный энергетический отпечаток создаёт неповторимый узор возможностей. Следуйте своей внутренней правде!*
`;

  return {
    id: `astro-${Date.now()}`,
    personality_analysis: personalityAnalysis,
    // Только имена карт: astro-result.tsx получает этот массив через
    // JSON.stringify в параметрах роутинга и разбирает его строками —
    // передача полных объектов TarotCard даёт "[object Object]" на экране.
    dominant_arcana: cards.map(c => c.name),
    character_traits: traits,
    life_path: lifePaths[dayIndex % lifePaths.length],
    current_phase: currentPhases[(dayIndex + 2) % currentPhases.length],
    advice: `Сосредоточьтесь на теме «${cards[0].keywords[0]}» и развивайте качество «${cards[1].keywords[0]}». Ваш путь освещает ${cards[2].name}.`
  };
}

/**
 * Генерация офлайн результата анализа ладони с линиями
 */
export interface PalmLine {
  name: string;
  description: string;
  color: string;
  points: number[][];
}

export async function generateOfflinePalmResult(question?: string): Promise<{
  id: string;
  question: string;
  lines: PalmLine[];
  interpretation: string;
  created_at: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 1200));

  const cards = getRandomCards(3);

  const lines: PalmLine[] = [
    {
      name: 'Линия жизни',
      description: `Отражает вашу жизненную силу и энергию. ${cards[0].keywords[0]} — ключевой аспект.`,
      color: '#E74C3C',
      points: [[50, 80], [60, 150], [55, 220]]
    },
    {
      name: 'Линия сердца',
      description: `Показывает эмоциональную природу. ${cards[1].keywords[0]} влияет на ваши отношения.`,
      color: '#E91E63',
      points: [[30, 70], [100, 65], [170, 80]]
    },
    {
      name: 'Линия головы',
      description: `Указывает на мыслительные способности. ${cards[2].keywords[0]} определяет ваш подход.`,
      color: '#3498DB',
      points: [[40, 100], [100, 95], [160, 110]]
    },
    {
      name: 'Линия судьбы',
      description: 'Отражает жизненный путь и предназначение.',
      color: '#9B59B6',
      points: [[100, 220], [100, 150], [95, 80]]
    }
  ];

  const interpretation = `🔮 **Анализ линий ладони**

*Вопрос: "${question || 'Расскажите о моей судьбе'}"*

---

### 📍 Линия жизни
${cards[0].upright_meaning}

Эта линия указывает на темы: ${cards[0].keywords.slice(0, 2).join(' и ')}. Ваша жизненная энергия сильна и направлена на созидание.

### 💖 Линия сердца
${cards[1].upright_meaning}

Ваша эмоциональная природа характеризуется темами: ${cards[1].keywords.slice(0, 2).join(' и ')}. В отношениях вы проявляете глубину и искренность.

### 🧠 Линия головы
${cards[2].upright_meaning}

Ваш мыслительный процесс отмечен темами: ${cards[2].keywords.slice(0, 2).join(' и ')}. Вы способны видеть связи, скрытые от других.

---

### ✨ Общее предсказание

Линии на вашей ладони рассказывают историю о человеке с богатым внутренним миром и значительным потенциалом. Энергии ${cards.map(c => c.name).join(', ')} сплетаются в узор вашей судьбы.

**Благоприятные периоды:**
- Ближайшие 3 месяца — время для важных решений
- Следующий год — период роста и развития

**Рекомендации:**
1. Доверяйте своей интуиции в важных вопросах
2. Развивайте «${cards[0].keywords[0]}» как ключевое качество
3. Помните, что ваша судьба — в ваших руках

---

💫 *Линии на ладони — это карта возможностей, а не предопределённый маршрут. Вы сами выбираете свой путь.*`;

  return {
    id: `palm-${Date.now()}`,
    question: question || 'Расскажите о моей судьбе',
    lines,
    interpretation,
    created_at: new Date().toISOString()
  };
}

// Re-export astrology types for convenience
export { getDailyAstrology, getMoonData, getRetrogradePlanets, formatAstrologyForReading } from './astrology';
export type { DailyAstrology, MoonData, ZodiacSign } from './astrology';
