// Offline-first: Embedded Tarot Cards Data
// This allows the app to work without backend connection

export interface TarotCard {
  id: number;
  name: string;
  name_en: string;
  type: string;
  suit: string;
  keywords: string[];
  upright_meaning: string;
  reversed_meaning: string;
}

export const MAJOR_ARCANA: TarotCard[] = [
  {
    id: 0,
    name: "Дурак",
    name_en: "The Fool",
    type: "major",
    suit: "major",
    keywords: ["новые начинания", "невинность", "спонтанность", "свобода"],
    upright_meaning: "Новые возможности, начало пути, невинность, спонтанность, свобода духа",
    reversed_meaning: "Безрассудство, необдуманные поступки, наивность, отсутствие направления"
  },
  {
    id: 1,
    name: "Маг",
    name_en: "The Magician",
    type: "major",
    suit: "major",
    keywords: ["воля", "мастерство", "концентрация", "сила"],
    upright_meaning: "Сила воли, мастерство, концентрация, способность к действию",
    reversed_meaning: "Манипуляции, злоупотребление силой, недостаток концентрации"
  },
  {
    id: 2,
    name: "Верховная Жрица",
    name_en: "The High Priestess",
    type: "major",
    suit: "major",
    keywords: ["интуиция", "тайны", "подсознание", "мудрость"],
    upright_meaning: "Интуиция, внутренняя мудрость, тайные знания, мистические силы",
    reversed_meaning: "Скрытность, недостаток внутреннего видения, поверхностность"
  },
  {
    id: 3,
    name: "Императрица",
    name_en: "The Empress",
    type: "major",
    suit: "major",
    keywords: ["плодородие", "изобилие", "материнство", "природа"],
    upright_meaning: "Плодородие, изобилие, материнская забота, творческое начало",
    reversed_meaning: "Зависимость, пустота, потеря связи с природой"
  },
  {
    id: 4,
    name: "Император",
    name_en: "The Emperor",
    type: "major",
    suit: "major",
    keywords: ["власть", "стабильность", "структура", "авторитет"],
    upright_meaning: "Авторитет, структура, стабильность, отцовская защита",
    reversed_meaning: "Доминирование, ригидность, отсутствие гибкости"
  },
  {
    id: 5,
    name: "Иерофант",
    name_en: "The Hierophant",
    type: "major",
    suit: "major",
    keywords: ["традиции", "мораль", "конформизм", "духовность"],
    upright_meaning: "Традиции, духовная мудрость, соответствие нормам, образование",
    reversed_meaning: "Бунтарство, нарушение традиций, нетрадиционные верования"
  },
  {
    id: 6,
    name: "Влюблённые",
    name_en: "The Lovers",
    type: "major",
    suit: "major",
    keywords: ["любовь", "гармония", "выбор", "партнёрство"],
    upright_meaning: "Любовь, гармония, важный выбор, притяжение",
    reversed_meaning: "Дисгармония, разногласия, неправильный выбор"
  },
  {
    id: 7,
    name: "Колесница",
    name_en: "The Chariot",
    type: "major",
    suit: "major",
    keywords: ["контроль", "воля", "победа", "решимость"],
    upright_meaning: "Контроль, сила воли, решимость, победа",
    reversed_meaning: "Потеря контроля, агрессия, отсутствие направления"
  },
  {
    id: 8,
    name: "Сила",
    name_en: "Strength",
    type: "major",
    suit: "major",
    keywords: ["сила", "храбрость", "терпение", "сострадание"],
    upright_meaning: "Внутренняя сила, храбрость, терпение, мягкая сила",
    reversed_meaning: "Слабость, сомнение, недостаток самодисциплины"
  },
  {
    id: 9,
    name: "Отшельник",
    name_en: "The Hermit",
    type: "major",
    suit: "major",
    keywords: ["самоанализ", "уединение", "поиск истины", "мудрость"],
    upright_meaning: "Самоанализ, внутренний поиск, уединение, мудрость",
    reversed_meaning: "Изоляция, одиночество, отшельничество как бегство"
  },
  {
    id: 10,
    name: "Колесо Фортуны",
    name_en: "Wheel of Fortune",
    type: "major",
    suit: "major",
    keywords: ["судьба", "карма", "циклы", "удача"],
    upright_meaning: "Судьба, циклы жизни, перемены, удача",
    reversed_meaning: "Невезение, сопротивление переменам, разрыв цикла"
  },
  {
    id: 11,
    name: "Справедливость",
    name_en: "Justice",
    type: "major",
    suit: "major",
    keywords: ["справедливость", "правда", "баланс", "закон"],
    upright_meaning: "Справедливость, истина, баланс, ответственность",
    reversed_meaning: "Несправедливость, дисбаланс, необъективность"
  },
  {
    id: 12,
    name: "Повешенный",
    name_en: "The Hanged Man",
    type: "major",
    suit: "major",
    keywords: ["жертва", "новая перспектива", "пауза", "отпускание"],
    upright_meaning: "Новый взгляд, пауза, жертва, освобождение",
    reversed_meaning: "Застой, сопротивление, напрасная жертва"
  },
  {
    id: 13,
    name: "Смерть",
    name_en: "Death",
    type: "major",
    suit: "major",
    keywords: ["трансформация", "завершение", "переход", "обновление"],
    upright_meaning: "Трансформация, завершение, переход к новому",
    reversed_meaning: "Сопротивление переменам, застой, страх трансформации"
  },
  {
    id: 14,
    name: "Умеренность",
    name_en: "Temperance",
    type: "major",
    suit: "major",
    keywords: ["баланс", "модерация", "терпение", "гармония"],
    upright_meaning: "Баланс, умеренность, терпение, гармония",
    reversed_meaning: "Дисбаланс, избыток, нетерпение"
  },
  {
    id: 15,
    name: "Дьявол",
    name_en: "The Devil",
    type: "major",
    suit: "major",
    keywords: ["искушение", "зависимость", "материализм", "ограничения"],
    upright_meaning: "Зависимость, искушение, материализм, связанность",
    reversed_meaning: "Освобождение от зависимостей, осознание, детоксикация"
  },
  {
    id: 16,
    name: "Башня",
    name_en: "The Tower",
    type: "major",
    suit: "major",
    keywords: ["разрушение", "хаос", "откровение", "освобождение"],
    upright_meaning: "Внезапные перемены, разрушение иллюзий, откровение",
    reversed_meaning: "Избежание катастрофы, страх перемен, внутренний хаос"
  },
  {
    id: 17,
    name: "Звезда",
    name_en: "The Star",
    type: "major",
    suit: "major",
    keywords: ["надежда", "вдохновение", "спокойствие", "обновление"],
    upright_meaning: "Надежда, вдохновение, обновление, спокойствие",
    reversed_meaning: "Отчаяние, потеря веры, недостаток вдохновения"
  },
  {
    id: 18,
    name: "Луна",
    name_en: "The Moon",
    type: "major",
    suit: "major",
    keywords: ["иллюзия", "интуиция", "страхи", "подсознание"],
    upright_meaning: "Иллюзия, интуиция, страхи, подсознательное",
    reversed_meaning: "Освобождение от страхов, ясность, преодоление иллюзий"
  },
  {
    id: 19,
    name: "Солнце",
    name_en: "The Sun",
    type: "major",
    suit: "major",
    keywords: ["радость", "успех", "позитив", "жизненная сила"],
    upright_meaning: "Радость, успех, позитивная энергия, жизненная сила",
    reversed_meaning: "Временная депрессия, недостаток энтузиазма, отложенный успех"
  },
  {
    id: 20,
    name: "Суд",
    name_en: "Judgement",
    type: "major",
    suit: "major",
    keywords: ["возрождение", "внутренний зов", "прощение", "оценка"],
    upright_meaning: "Возрождение, внутренний зов, оценка жизни, прощение",
    reversed_meaning: "Самокритика, неспособность простить, сомнение"
  },
  {
    id: 21,
    name: "Мир",
    name_en: "The World",
    type: "major",
    suit: "major",
    keywords: ["завершение", "достижение", "интеграция", "путешествие"],
    upright_meaning: "Завершение цикла, достижение, успех, интеграция",
    reversed_meaning: "Незавершённость, недостаток достижений, задержки"
  }
];

export const FULL_TAROT_DECK = MAJOR_ARCANA; // Simplified version, можно добавить младшие арканы позже

// Helper function to get random cards
export function getRandomCards(count: number): TarotCard[] {
  const shuffled = [...FULL_TAROT_DECK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Helper function to get card by ID
export function getCardById(id: number): TarotCard | undefined {
  return FULL_TAROT_DECK.find(card => card.id === id);
}

// Helper function to generate reading interpretation
export function generateOfflineReading(cards: TarotCard[], question?: string): string {
  const cardDescriptions = cards.map((card, index) => {
    const position = index === 0 ? "Прошлое" : index === 1 ? "Настоящее" : "Будущее";
    return `${position}: ${card.name} - ${card.upright_meaning}`;
  }).join("\n\n");

  return `🔮 Расклад Таро ${question ? `на вопрос: "${question}"` : ""}\n\n${cardDescriptions}\n\n✨ Совет: Карты указывают на важный этап вашего пути. Прислушайтесь к своей интуиции и доверьтесь процессу.`;
}
