// Offline API - Полная офлайн функциональность для GitHub Pages
import { getRandomCards, generateOfflineReading, MAJOR_ARCANA, TarotCard, getCardById } from '../data/tarotCards';
import { getDailyAstrology, formatAstrologyForReading, getMoonData, getRetrogradePlanets, DailyAstrology, ZodiacSign, getZodiacCompatibility } from './astrology';
import { generateMysticalTarotSVG, generateMysticalCardBack } from './tarotCardImages';
import { UserProfile } from '../stores/userProfileStore';

// Тип для опционального профиля пользователя в функциях
export interface PersonalizationContext {
  profile?: UserProfile | null;
}

export interface OfflineReadingResult {
  cards: TarotCard[];
  interpretation: string;
  question?: string;
  timestamp: string;
}

/**
 * Генерация офлайн гадания на картах Таро
 */
export async function generateOfflineTarotReading(
  question?: string,
  cardCount: number = 3,
  context?: PersonalizationContext
): Promise<OfflineReadingResult> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const cards = getRandomCards(cardCount);
  const interpretation = generateDetailedInterpretation(cards, question, context?.profile);

  return {
    cards,
    interpretation,
    question,
    timestamp: new Date().toISOString()
  };
}

/**
 * Генерация детальной интерпретации карт с астрологическим контекстом
 */
function generateDetailedInterpretation(cards: TarotCard[], question?: string, profile?: UserProfile | null): string {
  const positions = cards.length === 1 ? ['Ответ'] :
                    cards.length === 3 ? ['Прошлое', 'Настоящее', 'Будущее'] :
                    ['Ситуация', 'Препятствие', 'Прошлое', 'Будущее', 'Сознательное', 'Подсознательное', 'Совет', 'Внешнее влияние', 'Надежды', 'Итог'];

  const astrology = getDailyAstrology();
  const retrograde = getRetrogradePlanets();

  // Персонализированное приветствие
  const greeting = profile?.name ? `Дорогой(ая) ${profile.name}` : 'Дорогой искатель';

  let interpretation = `🔮 **Мистическое Гадание на Таро**\n\n`;

  if (question) {
    interpretation += `*Ваш вопрос: "${question}"*\n\n`;
  }

  // Персонализированный астрологический контекст
  interpretation += `---\n`;
  interpretation += `### ${astrology.moon.emoji} Космический Контекст\n\n`;

  if (profile?.sunSign) {
    interpretation += `**Ваш знак:** ${profile.sunSign.nameRu} ${profile.sunSign.symbol}\n`;
    const compatibility = getZodiacCompatibility(profile.sunSign, astrology.moon.moonSign);
    interpretation += `**Гармония с Луной:** ${compatibility.score}%\n\n`;
  }

  interpretation += `**Луна:** ${astrology.moon.phaseNameRu} в ${astrology.moon.moonSign.nameRu} ${astrology.moon.moonSign.symbol}\n`;
  interpretation += `**Лунный день:** ${astrology.moon.lunarDay} | **Освещённость:** ${astrology.moon.illumination}%\n`;
  interpretation += `**День:** ${astrology.dayOfWeekRu} — день ${astrology.rulingPlanetRu}\n`;

  if (retrograde.length > 0) {
    interpretation += `⚠️ **Ретроград:** ${retrograde.join(', ')}\n`;
    if (profile?.sunSign) {
      interpretation += `*Влияние на ${profile.sunSign.nameRu}: будьте внимательны в коммуникации*\n`;
    }
  }
  interpretation += `\n---\n\n`;

  interpretation += `${greeting}, карты раскрывают глубокую мудрость для вашего пути...\n\n`;

  cards.forEach((card, index) => {
    const position = positions[index] || `Карта ${index + 1}`;
    const isReversed = Math.random() < 0.3;
    const meaning = isReversed ? card.reversed_meaning : card.upright_meaning;

    interpretation += `### ✨ **${position}**: ${card.name}${isReversed ? ' (Перевёрнутая)' : ''}\n\n`;
    interpretation += `${meaning}\n\n`;
    interpretation += `*Ключевые слова*: ${card.keywords.join(', ')}\n\n`;
  });

  interpretation += `---\n\n`;
  interpretation += `## 💫 **Итог**\n\n`;
  interpretation += `${astrology.energyDescription}\n\n`;
  interpretation += `Карты несут для вас важное послание. Доверяйте своей интуиции и следуйте мудрости, открывшейся здесь. `;
  interpretation += `Помните, что именно вы держите ключ к своей судьбе.\n\n`;
  interpretation += `🍀 **Счастливые числа:** ${astrology.luckyNumbers.join(', ')}\n`;
  interpretation += `🎨 **Счастливые цвета:** ${astrology.luckyColors.join(', ')}\n\n`;
  interpretation += `*Пусть звёзды освещают ваш путь!* ⭐\n`;

  return interpretation;
}

/**
 * Получить изображение рубашки карты (SVG)
 */
export async function getOfflineCardBack(): Promise<string> {
  return generateMysticalCardBack();
}

/**
 * Получить SVG изображение карты Таро
 */
export function generateTarotCardSVG(card: TarotCard, isReversed: boolean = false): string {
  return generateMysticalTarotSVG(card, isReversed);
}

/**
 * Получить все карты Таро (офлайн)
 */
export async function getOfflineTarotDeck(): Promise<TarotCard[]> {
  return MAJOR_ARCANA;
}

/**
 * Получить карту по ID
 */
export async function getOfflineCardById(id: number): Promise<TarotCard | null> {
  return getCardById(id) || null;
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

  // Используем дату и фазу луны для выбора карты
  const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate() + Math.floor(astrology.moon.phase * 10)) % MAJOR_ARCANA.length;
  const card = MAJOR_ARCANA[dayIndex];

  // Перевёрнутость зависит от фазы луны и лунного дня
  const isReversed = astrology.moon.lunarDay === 9 || astrology.moon.lunarDay === 15 || astrology.moon.lunarDay === 29;

  const moonContext = astrology.moon.isWaxing
    ? 'Растущая луна усиливает энергию карты'
    : 'Убывающая луна призывает к рефлексии';

  const messages = [
    `${astrology.moon.emoji} ${moonContext}. ${card.name} направляет вас сегодня. ${card.keywords[0]} — ключ к успеху.`,
    `${astrology.moon.emoji} ${astrology.moon.phaseNameRu}. Энергия ${card.name} освещает ваш путь.`,
    `${astrology.moon.emoji} Луна в ${astrology.moon.moonSign.nameRu}. ${card.name} несёт важное послание.`,
    `${astrology.moon.emoji} ${moonContext}. ${card.name} говорит о ${card.keywords.slice(0, 2).join(' и ')}.`
  ];

  return {
    card,
    message: messages[today.getDay() % messages.length],
    is_reversed: isReversed,
    astrology
  };
}

/**
 * Генерация офлайн анализа совместимости
 */
export async function generateOfflineCompatibility(name1: string, name2: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 800));

  const cards = getRandomCards(2);
  const score = Math.floor(Math.random() * 30) + 65;

  const levelText = score >= 85 ? 'исключительная гармония' :
                    score >= 75 ? 'сильная совместимость' :
                    score >= 65 ? 'хороший потенциал' : 'возможность для роста';

  return `💕 **Анализ совместимости имён**

## ${name1} & ${name2}

**Показатель совместимости: ${score}%** — ${levelText}

---

### 🎴 Карта для ${name1}: **${cards[0].name}**
${cards[0].upright_meaning}

*Эта энергия олицетворяет вклад ${name1} в отношения.*

### 🎴 Карта для ${name2}: **${cards[1].name}**
${cards[1].upright_meaning}

*Эта энергия олицетворяет вклад ${name2} в отношения.*

---

### ✨ **Анализ**

Космические энергии ваших имён создают узор ${levelText.toLowerCase()}. ${cards[0].name} и ${cards[1].name} вместе указывают на отношения, в которых оба партнёра могут расти и учиться друг у друга.

**Сильные стороны:**
- Взаимодополняющие энергии, создающие баланс
- Прочный фундамент для взаимопонимания
- Потенциал глубокой эмоциональной связи

**Совет:**
${cards[0].keywords[0]} и ${cards[1].keywords[0]} — развивайте эти качества в вашей связи.

---

💫 *Помните: Любовь строится день за днём через понимание, терпение и искреннюю заботу друг о друге.*`;
}

/**
 * Генерация офлайн гороскопа с реальными астрологическими данными
 */
export async function generateOfflineHoroscope(sign: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 600));

  const card = getRandomCards(1)[0];
  const astrology = getDailyAstrology();
  const retrograde = getRetrogradePlanets();
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const moodRating = astrology.overallEnergy === 'high' ? 9 : astrology.overallEnergy === 'medium' ? 7 : 5;

  return `🌟 **Ежедневный гороскоп для ${sign}**
*${today}*

---

### ${astrology.moon.emoji} **Лунный календарь**

**Фаза:** ${astrology.moon.phaseNameRu} (${astrology.moon.illumination}%)
**Лунный день:** ${astrology.moon.lunarDay}
**Луна в:** ${astrology.moon.moonSign.nameRu} ${astrology.moon.moonSign.symbol}
**Стихия луны:** ${astrology.moon.moonSign.elementRu}

### ☀️ **Солнце в ${astrology.sunSign.nameRu}** ${astrology.sunSign.symbol}

**Управляющая планета дня:** ${astrology.rulingPlanetRu}
${retrograde.length > 0 ? `\n⚠️ **Ретроградные планеты:** ${retrograde.join(', ')}` : ''}

---

### 🎴 Карта дня: **${card.name}**

${card.upright_meaning}

---

### ✨ **Прогноз на сегодня**

**Энергия дня:** ${'⭐'.repeat(moodRating)}${'☆'.repeat(10 - moodRating)} (${moodRating}/10)

${astrology.energyDescription}

Энергия ${card.name} влияет на ваш день, принося темы ${card.keywords.slice(0, 3).join(', ')}. ${astrology.moon.isWaxing ? 'Растущая луна благоприятствует новым начинаниям.' : 'Убывающая луна способствует завершению дел и очищению.'}

### ✅ **Благоприятно сегодня**
${astrology.favorableActivities.slice(0, 3).map(a => `• ${a}`).join('\n')}

### ⛔ **Лучше отложить**
${astrology.unfavorableActivities.map(a => `• ${a}`).join('\n')}

### 💕 **Любовь и отношения**
${astrology.moon.moonSign.element === 'water' || astrology.moon.moonSign.element === 'fire'
  ? 'Эмоции обострены. Романтика витает в воздухе! Открыто выражайте свои чувства сегодня.'
  : 'Сосредоточьтесь на любви к себе и внутренней гармонии. Правильные связи последуют.'}

### 💼 **Карьера и цели**
${astrology.overallEnergy === 'high'
  ? 'Профессиональный успех в центре внимания. Действуйте смело в своих проектах.'
  : 'Терпение и планирование будут вам полезны. Закладывайте фундамент для будущего успеха.'}

### 🍀 **Счастливые элементы**
- **Числа:** ${astrology.luckyNumbers.join(', ')}
- **Цвета:** ${astrology.luckyColors.join(', ')}
- **Лучшее время:** ${10 + Math.floor(moodRating / 3)}:00

---

💫 *Доверяйте космическому руководству и максимально используйте энергию этого дня!*`;
}

/**
 * Генерация офлайн чтения по ладони
 */
export async function generateOfflinePalmistry(question?: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const cards = getRandomCards(3);

  return `🤲 **Чтение по линиям ладони**

*"${question || 'Расскажи о моей судьбе'}"*

---

### 📍 **Линия жизни**
Линия жизни раскрывает вашу жизненную силу и важные события. ${cards[0].upright_meaning}

**Ключевой совет:** Сосредоточьтесь на ${cards[0].keywords[0]} для усиления жизненной энергии.

### 💖 **Линия сердца**
Линия сердца показывает вашу эмоциональную природу и отношения. ${cards[1].upright_meaning}

**Ключевой совет:** Проявляйте ${cards[1].keywords[0]} в делах сердечных.

### 🧠 **Линия головы**
Линия головы указывает на ваш мыслительный подход и образ мышления. ${cards[2].upright_meaning}

**Ключевой совет:** Применяйте ${cards[2].keywords[0]} в принятии решений.

---

### ✨ **Общее руководство**

Линии на вашей ладони рассказывают историю о ${cards.map(c => c.keywords[0]).join(', ')}. Ваша судьба написана не только на руке, но и в выборах, которые вы делаете каждый день.

**Практические советы:**
1. Больше доверяйте своей интуиции
2. Действуйте в направлении своих мечт
3. Поддерживайте баланс во всех сферах жизни

---

💫 *Будущее в ваших руках. Линии — это направления, а не цепи.*`;
}

/**
 * Генерация офлайн чтения рун
 */
export async function generateOfflineRunes(question?: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 700));

  const runes = ['ᚠ Феху', 'ᚢ Уруз', 'ᚦ Турисаз', 'ᚨ Ансуз', 'ᚱ Райдо', 'ᚲ Кеназ',
                 'ᚷ Гебо', 'ᚹ Вуньо', 'ᚺ Хагалаз', 'ᚾ Наутиз'];
  const selectedRunes = runes.sort(() => Math.random() - 0.5).slice(0, 3);

  return `ᚠ **Гадание на рунах**

*Вопрос: "${question || 'Какое руководство дают руны?'}"*

---

### Прошлое: **${selectedRunes[0]}**
Эта руна говорит о заложенных основах и усвоенных уроках.

### Настоящее: **${selectedRunes[1]}**
Текущие энергии, окружающие ваш вопрос.

### Будущее: **${selectedRunes[2]}**
Возможный путь вперёд, основанный на текущих траекториях.

---

### ✨ **Толкование**

Древняя скандинавская мудрость течёт через эти руны, предлагая руководство для вашего пути. Комбинация указывает на время трансформации и роста.

**Ключевое послание:** Доверяйте процессу перемен. То, что заканчивается, создаёт пространство для новых начинаний.

---

💫 *Пусть мудрость предков освещает ваш путь.*`;
}

/**
 * Генерация офлайн нумерологического чтения
 */
export async function generateOfflineNumerology(birthDate: string, name?: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 600));

  // Расчёт числа жизненного пути
  const digits = birthDate.replace(/\D/g, '').split('').map(Number);
  let lifePathNumber = digits.reduce((a, b) => a + b, 0);
  while (lifePathNumber > 9 && lifePathNumber !== 11 && lifePathNumber !== 22) {
    lifePathNumber = String(lifePathNumber).split('').map(Number).reduce((a, b) => a + b, 0);
  }

  const meanings: { [key: number]: string } = {
    1: 'Лидерство, независимость, оригинальность',
    2: 'Партнёрство, дипломатия, чувствительность',
    3: 'Творчество, самовыражение, радость',
    4: 'Стабильность, дисциплина, упорный труд',
    5: 'Свобода, приключения, перемены',
    6: 'Ответственность, любовь, забота',
    7: 'Духовность, анализ, мудрость',
    8: 'Власть, изобилие, успех',
    9: 'Гуманизм, завершение, мудрость',
    11: 'Интуиция, духовное прозрение, просветление',
    22: 'Мастер-строитель, видение, практический идеализм',
  };

  return `🔢 **Нумерологический расчёт**${name ? ` для ${name}` : ''}

*Дата рождения: ${birthDate}*

---

### 🌟 **Ваше Число Жизненного Пути: ${lifePathNumber}**

**Основное значение:** ${meanings[lifePathNumber] || 'Уникальный духовный путь'}

${lifePathNumber === 11 || lifePathNumber === 22 ?
`⚡ *Внимание: Мастер-Число!* Вы несёте усиленную вибрацию Мастер-Числа, указывающую на особое жизненное предназначение и потенциал.` : ''}

---

### ✨ **Подробный анализ**

**Сильные стороны:**
Люди с Числом Пути ${lifePathNumber} от природы одарены в ${meanings[lifePathNumber]?.split(', ').slice(0, 2).join(' и ') || 'уникальных способностях'}.

**Вызовы:**
Рост приходит через баланс ${lifePathNumber === 1 ? 'независимости и сотрудничества' :
lifePathNumber === 2 ? 'потребностей других с вашими собственными' :
'природных талантов с практическим применением'}.

**Жизненное предназначение:**
Ваша душа выбрала этот путь, чтобы познать и воплотить ${meanings[lifePathNumber]?.split(', ')[0] || 'ваши уникальные дары'}.

---

### 💫 **Энергия личного года**

Основываясь на текущих космических циклах, этот год — для ${lifePathNumber % 2 === 0 ? 'строительства и укрепления' : 'инициации и расширения'}.

---

💫 *Ваши числа рассказывают историю безграничного потенциала. Живите своей правдой!*`;
}

// Re-export astrology types for convenience
export { getDailyAstrology, getMoonData, getRetrogradePlanets, formatAstrologyForReading } from './astrology';
export type { DailyAstrology, MoonData, ZodiacSign } from './astrology';

/**
 * Проверка доступности бэкенда
 */
export async function isBackendAvailable(backendUrl?: string): Promise<boolean> {
  if (!backendUrl) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}
