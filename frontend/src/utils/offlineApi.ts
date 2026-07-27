// Offline API - Полная офлайн функциональность для GitHub Pages
import { getRandomCards, generateOfflineReading, MAJOR_ARCANA, TarotCard, getCardById } from '../data/tarotCards';

export interface OfflineReadingResult {
  cards: TarotCard[];
  interpretation: string;
  question?: string;
  timestamp: string;
}

/**
 * Генерация офлайн гадания на картах Таро
 */
export async function generateOfflineTarotReading(question?: string, cardCount: number = 3): Promise<OfflineReadingResult> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const cards = getRandomCards(cardCount);
  const interpretation = generateDetailedInterpretation(cards, question);

  return {
    cards,
    interpretation,
    question,
    timestamp: new Date().toISOString()
  };
}

/**
 * Генерация детальной интерпретации карт
 */
function generateDetailedInterpretation(cards: TarotCard[], question?: string): string {
  const positions = cards.length === 1 ? ['Ответ'] :
                    cards.length === 3 ? ['Прошлое', 'Настоящее', 'Будущее'] :
                    ['Ситуация', 'Препятствие', 'Прошлое', 'Будущее', 'Сознательное', 'Подсознательное', 'Совет', 'Внешнее влияние', 'Надежды', 'Итог'];

  let interpretation = `🔮 **Мистическое Гадание на Таро**\n\n`;

  if (question) {
    interpretation += `*Ваш вопрос: "${question}"*\n\n`;
  }

  interpretation += `Дорогой искатель, карты раскрывают глубокую мудрость для вашего пути...\n\n`;

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
  interpretation += `Карты несут для вас важное послание. Доверяйте своей интуиции и следуйте мудрости, открывшейся здесь. `;
  interpretation += `Помните, что именно вы держите ключ к своей судьбе.\n\n`;
  interpretation += `*Пусть звёзды освещают ваш путь!* ⭐\n`;

  return interpretation;
}

/**
 * Получить изображение рубашки карты (SVG)
 */
export async function getOfflineCardBack(): Promise<string> {
  const svg = `<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="cosmicGrad" cx="50%" cy="50%" r="70%"><stop offset="0%" style="stop-color:#1a0040;stop-opacity:1"/><stop offset="30%" style="stop-color:#2d1b69;stop-opacity:1"/><stop offset="70%" style="stop-color:#0f0f23;stop-opacity:1"/><stop offset="100%" style="stop-color:#000011;stop-opacity:1"/></radialGradient><linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFD700;stop-opacity:1"/><stop offset="50%" style="stop-color:#FFA500;stop-opacity:1"/><stop offset="100%" style="stop-color:#FFD700;stop-opacity:1"/></linearGradient></defs><rect width="200" height="300" fill="url(#cosmicGrad)" rx="18"/><rect x="4" y="4" width="192" height="292" fill="none" stroke="url(#goldGrad)" stroke-width="2" rx="15"/><circle cx="100" cy="150" r="50" fill="none" stroke="#9B59B6" stroke-width="2"/><circle cx="100" cy="150" r="35" fill="none" stroke="#BB6BD9" stroke-width="1.5"/><text x="100" y="160" font-family="serif" font-size="32" fill="#FFD700" text-anchor="middle">🔮</text><text x="100" y="35" font-family="serif" font-size="14" font-weight="bold" fill="#FFD700" text-anchor="middle" opacity="0.9">✦ ТАРО ✦</text><text x="100" y="280" font-family="serif" font-size="10" fill="#9B59B6" text-anchor="middle" opacity="0.7">Мистическая мудрость</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Получить SVG изображение карты Таро
 */
export function generateTarotCardSVG(card: TarotCard, isReversed: boolean = false): string {
  const arcanaSymbols: { [key: string]: string } = {
    'Дурак': '🃏', 'Маг': '🎭', 'Верховная Жрица': '🌙', 'Императрица': '👑',
    'Император': '⚔️', 'Иерофант': '📿', 'Влюблённые': '💕', 'Колесница': '🏇',
    'Сила': '🦁', 'Отшельник': '🔦', 'Колесо Фортуны': '🎡', 'Справедливость': '⚖️',
    'Повешенный': '🔄', 'Смерть': '💀', 'Умеренность': '⚗️', 'Дьявол': '😈',
    'Башня': '🏰', 'Звезда': '⭐', 'Луна': '🌙', 'Солнце': '☀️',
    'Суд': '📯', 'Мир': '🌍'
  };

  const symbol = arcanaSymbols[card.name] || '🔮';
  const bgColor = card.type === 'major' ? '#2d1b69' : '#1a3a5c';
  const accentColor = card.type === 'major' ? '#9B59B6' : '#3498db';

  const svg = `
    <svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0a0a15;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#FFA500;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FFD700;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="200" height="300" fill="url(#cardBg)" rx="15"/>
      <rect x="3" y="3" width="194" height="294" fill="none" stroke="url(#goldBorder)" stroke-width="2" rx="13"/>
      <rect x="15" y="50" width="170" height="180" fill="rgba(0,0,0,0.3)" rx="10"/>
      <text x="100" y="150" font-size="60" text-anchor="middle" dominant-baseline="middle">${symbol}</text>
      <text x="100" y="30" font-family="serif" font-size="11" font-weight="bold" fill="#FFD700" text-anchor="middle">${card.name}</text>
      <text x="100" y="255" font-family="sans-serif" font-size="8" fill="${accentColor}" text-anchor="middle" opacity="0.9">${card.keywords.slice(0, 2).join(' • ')}</text>
      <text x="100" y="275" font-family="sans-serif" font-size="7" fill="#888" text-anchor="middle">${card.type === 'major' ? 'Старший Аркан' : 'Младший Аркан'}</text>
      ${isReversed ? '<text x="100" y="290" font-size="10" fill="#FFD700" text-anchor="middle">⟲ Перевёрнутая</text>' : ''}
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
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
 * Получить карту дня
 */
export async function getOfflineDailyCard(): Promise<{
  card: TarotCard;
  message: string;
  is_reversed: boolean;
}> {
  await new Promise(resolve => setTimeout(resolve, 300));

  // Используем дату для стабильности карты в течение дня
  const today = new Date();
  const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % MAJOR_ARCANA.length;
  const card = MAJOR_ARCANA[dayIndex];
  const isReversed = (today.getDate() % 3) === 0;

  const messages = [
    `Сегодня ${card.name} направляет вас. ${card.keywords[0]} — ключ к успеху этого дня.`,
    `Энергия ${card.name} освещает ваш путь. Прислушайтесь к ${card.keywords[1]}.`,
    `${card.name} несёт важное послание: обратите внимание на ${card.keywords[0]} и ${card.keywords[1]}.`,
    `Карта ${card.name} говорит о ${card.keywords.slice(0, 2).join(' и ')}. Пусть это направляет ваши действия.`
  ];

  return {
    card,
    message: messages[today.getDay() % messages.length],
    is_reversed: isReversed
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
 * Генерация офлайн гороскопа
 */
export async function generateOfflineHoroscope(sign: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 600));

  const card = getRandomCards(1)[0];
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const moodRating = Math.floor(Math.random() * 3) + 7;
  const luckyNumbers = Array.from({length: 5}, () => Math.floor(Math.random() * 49) + 1);
  const colors = ['фиолетовый', 'золотой', 'серебряный', 'синий', 'зелёный', 'розовый'];
  const luckyColor = colors[Math.floor(Math.random() * colors.length)];

  return `🌟 **Ежедневный гороскоп для ${sign}**
*${today}*

---

### 🎴 Карта дня: **${card.name}**

${card.upright_meaning}

---

### ✨ **Прогноз на сегодня**

**Настроение:** ${'⭐'.repeat(moodRating)}${'☆'.repeat(10 - moodRating)} (${moodRating}/10)

Энергия ${card.name} влияет на ваш день, принося темы ${card.keywords.slice(0, 3).join(', ')}. Сейчас время проявить ${card.keywords[0]} во всех сферах жизни.

### 💕 **Любовь и отношения**
${card.keywords.includes('любовь') || card.keywords.includes('гармония')
  ? 'Романтика витает в воздухе! Открыто выражайте свои чувства сегодня.'
  : 'Сосредоточьтесь на любви к себе и внутренней гармонии. Правильные связи последуют.'}

### 💼 **Карьера и цели**
${card.keywords.includes('успех') || card.keywords.includes('сила')
  ? 'Профессиональный успех в центре внимания. Действуйте смело в своих проектах.'
  : 'Терпение и планирование будут вам полезны. Закладывайте фундамент для будущего успеха.'}

### 🍀 **Счастливые элементы**
- **Числа:** ${luckyNumbers.join(', ')}
- **Цвет:** ${luckyColor}
- **Лучшее время:** ${Math.floor(Math.random() * 12) + 1}:00

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
