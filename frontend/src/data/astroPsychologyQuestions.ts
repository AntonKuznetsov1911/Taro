/**
 * Вопросы астропсихологического теста.
 *
 * Ответы на вопросы о характере, целях, страхах, отношениях и финальный
 * вопрос складываются в архетипы личности: главный аркан ответа даёт
 * 2 балла, дополнительный — 1. Каждый из 22 старших арканов встречается
 * в ответах несколько раз, поэтому достижим любой архетип.
 * Вопросы о настроении (category 'mood') описывают текущее состояние
 * и в архетипы личности не засчитываются.
 */

export interface QuestionOption {
  id: string;
  text: string;
  keywords: string[];
  /** Главный архетип ответа (старший аркан, как в MAJOR_ARCANA) */
  arcana?: string;
  /** Дополнительный архетип — учитывается с половинным весом */
  also?: string;
}

export interface Question {
  id: string;
  category: string;
  categoryRu: string;
  question: string;
  subtitle?: string;
  icon: string;
  options: QuestionOption[];
}

export const ASTRO_PSYCHOLOGY_QUESTIONS: Question[] = [
  // ХАРАКТЕР (Character)
  {
    id: 'character_1',
    category: 'character',
    categoryRu: 'Характер',
    question: 'Как вы обычно реагируете на перемены в жизни?',
    subtitle: 'Выберите наиболее близкий вариант',
    icon: 'person-outline',
    options: [
      {
        id: 'ch1_a',
        text: 'С энтузиазмом и любопытством — перемены вдохновляют меня',
        keywords: ['adventurous', 'curious', 'open', 'explorer', 'dynamic'],
        arcana: 'Дурак',
        also: 'Колесо Фортуны',
      },
      {
        id: 'ch1_b',
        text: 'С осторожностью, мне нужно время на адаптацию',
        keywords: ['cautious', 'thoughtful', 'analytical', 'careful', 'protective'],
        arcana: 'Повешенный',
        also: 'Отшельник',
      },
      {
        id: 'ch1_c',
        text: 'С сопротивлением — предпочитаю стабильность',
        keywords: ['stable', 'grounded', 'traditional', 'conservative', 'loyal'],
        arcana: 'Император',
        also: 'Иерофант',
      },
      {
        id: 'ch1_d',
        text: 'По-разному, зависит от ситуации',
        keywords: ['flexible', 'adaptive', 'balanced', 'moderate', 'versatile'],
        arcana: 'Умеренность',
        also: 'Колесо Фортуны',
      },
    ],
  },
  {
    id: 'character_2',
    category: 'character',
    categoryRu: 'Характер',
    question: 'Что больше всего описывает вашу энергию?',
    subtitle: 'Как вы чувствуете себя большую часть времени',
    icon: 'flash-outline',
    options: [
      {
        id: 'ch2_a',
        text: 'Я как огонь — страстный, активный, импульсивный',
        keywords: ['passionate', 'active', 'energetic', 'impulsive', 'bold'],
        arcana: 'Солнце',
        also: 'Колесница',
      },
      {
        id: 'ch2_b',
        text: 'Я как вода — глубокий, интуитивный, эмоциональный',
        keywords: ['intuitive', 'emotional', 'deep', 'sensitive', 'empathic'],
        arcana: 'Луна',
        also: 'Смерть',
      },
      {
        id: 'ch2_c',
        text: 'Я как воздух — лёгкий, общительный, интеллектуальный',
        keywords: ['social', 'intellectual', 'communicative', 'light', 'mental'],
        arcana: 'Маг',
        also: 'Звезда',
      },
      {
        id: 'ch2_d',
        text: 'Я как земля — практичный, стабильный, надёжный',
        keywords: ['practical', 'stable', 'reliable', 'grounded', 'material'],
        arcana: 'Иерофант',
        also: 'Мир',
      },
    ],
  },
  {
    id: 'character_3',
    category: 'character',
    categoryRu: 'Характер',
    question: 'В сложных ситуациях вы больше полагаетесь на...',
    subtitle: 'Что ведёт вас в принятии решений',
    icon: 'compass-outline',
    options: [
      {
        id: 'ch3_a',
        text: 'Интуицию и внутренний голос',
        keywords: ['intuitive', 'instinctive', 'inner-guided', 'spiritual', 'feeling'],
        arcana: 'Верховная Жрица',
        also: 'Луна',
      },
      {
        id: 'ch3_b',
        text: 'Логику и анализ фактов',
        keywords: ['logical', 'analytical', 'rational', 'thinking', 'strategic'],
        arcana: 'Справедливость',
        also: 'Император',
      },
      {
        id: 'ch3_c',
        text: 'Опыт и проверенные методы',
        keywords: ['experienced', 'traditional', 'wise', 'practical', 'proven'],
        arcana: 'Иерофант',
        also: 'Отшельник',
      },
      {
        id: 'ch3_d',
        text: 'Советы близких людей',
        keywords: ['social', 'collaborative', 'trusting', 'connected', 'relational'],
        arcana: 'Влюблённые',
        also: 'Умеренность',
      },
    ],
  },

  // ЦЕЛИ И АМБИЦИИ (Goals & Ambitions)
  {
    id: 'goals_1',
    category: 'goals',
    categoryRu: 'Цели',
    question: 'Что для вас важнее всего в жизни прямо сейчас?',
    subtitle: 'Ваш главный приоритет на данном этапе',
    icon: 'trophy-outline',
    options: [
      {
        id: 'g1_a',
        text: 'Карьера и профессиональная реализация',
        keywords: ['ambitious', 'career-focused', 'achievement', 'success', 'professional'],
        arcana: 'Колесница',
        also: 'Император',
      },
      {
        id: 'g1_b',
        text: 'Любовь и близкие отношения',
        keywords: ['loving', 'relational', 'intimate', 'connected', 'partnership'],
        arcana: 'Влюблённые',
        also: 'Императрица',
      },
      {
        id: 'g1_c',
        text: 'Личностный рост и самопознание',
        keywords: ['growth', 'self-aware', 'transformative', 'evolving', 'inner'],
        arcana: 'Звезда',
        also: 'Смерть',
      },
      {
        id: 'g1_d',
        text: 'Материальная стабильность и комфорт',
        keywords: ['practical', 'security', 'material', 'stable', 'comfortable'],
        arcana: 'Император',
        also: 'Дьявол',
      },
      {
        id: 'g1_e',
        text: 'Творчество и самовыражение',
        keywords: ['creative', 'expressive', 'artistic', 'unique', 'innovative'],
        arcana: 'Императрица',
        also: 'Солнце',
      },
    ],
  },
  {
    id: 'goals_2',
    category: 'goals',
    categoryRu: 'Цели',
    question: 'Как вы видите свою идеальную жизнь через 5 лет?',
    subtitle: 'Ваше видение будущего',
    icon: 'telescope-outline',
    options: [
      {
        id: 'g2_a',
        text: 'Я на вершине успеха, признан и влиятелен',
        keywords: ['ambitious', 'powerful', 'influential', 'successful', 'leader'],
        arcana: 'Колесница',
        also: 'Солнце',
      },
      {
        id: 'g2_b',
        text: 'Я окружён любовью, в гармонии с собой и близкими',
        keywords: ['harmonious', 'loving', 'peaceful', 'balanced', 'connected'],
        arcana: 'Мир',
        also: 'Влюблённые',
      },
      {
        id: 'g2_c',
        text: 'Я живу по своим правилам, полностью свободен',
        keywords: ['free', 'independent', 'unconventional', 'rebellious', 'authentic'],
        arcana: 'Дурак',
        also: 'Башня',
      },
      {
        id: 'g2_d',
        text: 'Я наконец понял себя и обрёл внутренний покой',
        keywords: ['peaceful', 'enlightened', 'wise', 'centered', 'spiritual'],
        arcana: 'Отшельник',
        also: 'Умеренность',
      },
      {
        id: 'g2_e',
        text: 'Я создаю что-то значимое, меняю мир',
        keywords: ['creative', 'impactful', 'purposeful', 'transformative', 'visionary'],
        arcana: 'Суд',
        also: 'Маг',
      },
    ],
  },

  // СТРАХИ И ТРЕВОГИ (Fears & Anxieties)
  {
    id: 'fears_1',
    category: 'fears',
    categoryRu: 'Страхи',
    question: 'Что вызывает у вас наибольшее беспокойство?',
    subtitle: 'Ваши внутренние тревоги',
    icon: 'alert-circle-outline',
    options: [
      {
        id: 'f1_a',
        text: 'Страх неудачи и потери контроля',
        keywords: ['control', 'perfectionist', 'anxious', 'afraid-of-failure', 'rigid'],
        arcana: 'Башня',
        also: 'Колесница',
      },
      {
        id: 'f1_b',
        text: 'Страх одиночества и отвержения',
        keywords: ['lonely', 'seeking-approval', 'dependent', 'fear-of-abandonment', 'social'],
        arcana: 'Луна',
        also: 'Дьявол',
      },
      {
        id: 'f1_c',
        text: 'Страх упустить свой потенциал',
        keywords: ['unfulfilled', 'potential', 'pressure', 'self-doubt', 'ambitious'],
        arcana: 'Суд',
        also: 'Звезда',
      },
      {
        id: 'f1_d',
        text: 'Страх перемен и неизвестности',
        keywords: ['anxious', 'conservative', 'security-seeking', 'cautious', 'resistant'],
        arcana: 'Смерть',
        also: 'Повешенный',
      },
      {
        id: 'f1_e',
        text: 'У меня нет серьёзных страхов',
        keywords: ['confident', 'fearless', 'optimistic', 'trusting', 'secure'],
        arcana: 'Сила',
        also: 'Солнце',
      },
    ],
  },
  {
    id: 'fears_2',
    category: 'fears',
    categoryRu: 'Страхи',
    question: 'Что помогает вам справляться с трудностями?',
    subtitle: 'Ваш источник силы',
    icon: 'shield-outline',
    options: [
      {
        id: 'f2_a',
        text: 'Вера в себя и свою силу',
        keywords: ['self-reliant', 'strong', 'confident', 'independent', 'resilient'],
        arcana: 'Сила',
        also: 'Колесница',
      },
      {
        id: 'f2_b',
        text: 'Поддержка близких людей',
        keywords: ['supported', 'connected', 'trusting', 'collaborative', 'relational'],
        arcana: 'Мир',
        also: 'Влюблённые',
      },
      {
        id: 'f2_c',
        text: 'Вера в высшие силы и судьбу',
        keywords: ['spiritual', 'faithful', 'trusting', 'surrendering', 'mystical'],
        arcana: 'Колесо Фортуны',
        also: 'Звезда',
      },
      {
        id: 'f2_d',
        text: 'Позитивное мышление и юмор',
        keywords: ['optimistic', 'light', 'humorous', 'positive', 'resilient'],
        arcana: 'Солнце',
        also: 'Дурак',
      },
      {
        id: 'f2_e',
        text: 'Анализ ситуации и план действий',
        keywords: ['strategic', 'analytical', 'planning', 'rational', 'organized'],
        arcana: 'Справедливость',
        also: 'Маг',
      },
    ],
  },

  // ОТНОШЕНИЯ (Relationships)
  {
    id: 'relationships_1',
    category: 'relationships',
    categoryRu: 'Отношения',
    question: 'Что для вас важнее всего в отношениях?',
    subtitle: 'Ваша потребность в партнёрстве',
    icon: 'heart-outline',
    options: [
      {
        id: 'r1_a',
        text: 'Страсть и интенсивность чувств',
        keywords: ['passionate', 'intense', 'deep', 'romantic', 'emotional'],
        arcana: 'Дьявол',
        also: 'Влюблённые',
      },
      {
        id: 'r1_b',
        text: 'Стабильность и надёжность партнёра',
        keywords: ['stable', 'reliable', 'secure', 'committed', 'loyal'],
        arcana: 'Иерофант',
        also: 'Справедливость',
      },
      {
        id: 'r1_c',
        text: 'Свобода и независимость друг от друга',
        keywords: ['independent', 'free', 'autonomous', 'space', 'unconventional'],
        arcana: 'Звезда',
        also: 'Дурак',
      },
      {
        id: 'r1_d',
        text: 'Глубокое понимание и духовная связь',
        keywords: ['understanding', 'spiritual', 'deep', 'soulmate', 'empathic'],
        arcana: 'Верховная Жрица',
        also: 'Луна',
      },
      {
        id: 'r1_e',
        text: 'Общие цели и совместный рост',
        keywords: ['growth', 'partnership', 'collaborative', 'evolving', 'supportive'],
        arcana: 'Мир',
        also: 'Колесница',
      },
    ],
  },
  {
    id: 'relationships_2',
    category: 'relationships',
    categoryRu: 'Отношения',
    question: 'Как вы обычно проявляете любовь?',
    subtitle: 'Ваш язык любви',
    icon: 'gift-outline',
    options: [
      {
        id: 'r2_a',
        text: 'Через слова признания и комплименты',
        keywords: ['verbal', 'expressive', 'communicative', 'affirming', 'articulate'],
        arcana: 'Маг',
        also: 'Солнце',
      },
      {
        id: 'r2_b',
        text: 'Через качественное время вместе',
        keywords: ['present', 'attentive', 'quality-time', 'connected', 'devoted'],
        arcana: 'Влюблённые',
        also: 'Умеренность',
      },
      {
        id: 'r2_c',
        text: 'Через подарки и материальные знаки внимания',
        keywords: ['generous', 'material', 'giving', 'providing', 'abundant'],
        arcana: 'Императрица',
        also: 'Колесо Фортуны',
      },
      {
        id: 'r2_d',
        text: 'Через поступки и помощь',
        keywords: ['helpful', 'supportive', 'practical', 'service', 'caring'],
        arcana: 'Умеренность',
        also: 'Сила',
      },
      {
        id: 'r2_e',
        text: 'Через физическую близость и прикосновения',
        keywords: ['physical', 'tactile', 'sensual', 'intimate', 'affectionate'],
        arcana: 'Императрица',
        also: 'Дьявол',
      },
    ],
  },

  // НАСТРОЕНИЕ И ЭНЕРГИЯ (Mood & Energy)
  {
    id: 'mood_1',
    category: 'mood',
    categoryRu: 'Настроение',
    question: 'Как бы вы описали своё состояние прямо сейчас?',
    subtitle: 'Ваше текущее внутреннее состояние',
    icon: 'sunny-outline',
    options: [
      {
        id: 'm1_a',
        text: 'Я полон энергии и готов действовать',
        keywords: ['energetic', 'motivated', 'active', 'ready', 'dynamic'],
        arcana: 'Колесница',
      },
      {
        id: 'm1_b',
        text: 'Я спокоен и уравновешен',
        keywords: ['calm', 'balanced', 'peaceful', 'centered', 'stable'],
        arcana: 'Умеренность',
      },
      {
        id: 'm1_c',
        text: 'Я задумчив и погружён в себя',
        keywords: ['introspective', 'thoughtful', 'reflective', 'contemplative', 'inner'],
        arcana: 'Отшельник',
      },
      {
        id: 'm1_d',
        text: 'Я взволнован и немного тревожен',
        keywords: ['anxious', 'worried', 'uncertain', 'tense', 'restless'],
        arcana: 'Луна',
      },
      {
        id: 'm1_e',
        text: 'Я в ожидании перемен',
        keywords: ['expectant', 'transitional', 'anticipating', 'waiting', 'hopeful'],
        arcana: 'Повешенный',
      },
    ],
  },
  {
    id: 'mood_2',
    category: 'mood',
    categoryRu: 'Настроение',
    question: 'Что вам сейчас больше всего нужно?',
    subtitle: 'Ваша текущая потребность',
    icon: 'water-outline',
    options: [
      {
        id: 'm2_a',
        text: 'Отдых и восстановление сил',
        keywords: ['tired', 'need-rest', 'recovering', 'depleted', 'recharging'],
        arcana: 'Повешенный',
      },
      {
        id: 'm2_b',
        text: 'Новые впечатления и эмоции',
        keywords: ['seeking', 'adventurous', 'bored', 'curious', 'stimulation'],
        arcana: 'Дурак',
      },
      {
        id: 'm2_c',
        text: 'Ясность и понимание',
        keywords: ['confused', 'seeking-answers', 'clarity', 'direction', 'guidance'],
        arcana: 'Верховная Жрица',
      },
      {
        id: 'm2_d',
        text: 'Поддержка и тепло',
        keywords: ['needing-support', 'vulnerable', 'connection', 'warmth', 'comfort'],
        arcana: 'Императрица',
      },
      {
        id: 'm2_e',
        text: 'Уверенность и силу',
        keywords: ['needing-strength', 'courage', 'empowerment', 'confidence', 'power'],
        arcana: 'Сила',
      },
    ],
  },

  // ЗАКЛЮЧИТЕЛЬНЫЙ ВОПРОС
  {
    id: 'final_1',
    category: 'final',
    categoryRu: 'Завершение',
    question: 'Если бы Вселенная могла дать вам сейчас один дар, что бы это было?',
    subtitle: 'Ваше главное желание в этот момент',
    icon: 'sparkles-outline',
    options: [
      {
        id: 'fn1_a',
        text: 'Мудрость и понимание жизни',
        keywords: ['wisdom', 'understanding', 'enlightenment', 'knowledge', 'insight'],
        arcana: 'Отшельник',
        also: 'Повешенный',
      },
      {
        id: 'fn1_b',
        text: 'Безусловная любовь',
        keywords: ['love', 'unconditional', 'acceptance', 'compassion', 'heart'],
        arcana: 'Умеренность',
        also: 'Императрица',
      },
      {
        id: 'fn1_c',
        text: 'Силу преодолевать любые препятствия',
        keywords: ['strength', 'power', 'resilience', 'overcome', 'invincible'],
        arcana: 'Сила',
        also: 'Башня',
      },
      {
        id: 'fn1_d',
        text: 'Свободу быть собой',
        keywords: ['freedom', 'authenticity', 'liberation', 'true-self', 'expression'],
        arcana: 'Дурак',
        also: 'Суд',
      },
      {
        id: 'fn1_e',
        text: 'Способность создавать свою реальность',
        keywords: ['manifestation', 'creative', 'powerful', 'magic', 'creator'],
        arcana: 'Маг',
        also: 'Колесо Фортуны',
      },
    ],
  },
];

// Helper function to get questions by category
export const getQuestionsByCategory = (category: string): Question[] => {
  return ASTRO_PSYCHOLOGY_QUESTIONS.filter((q) => q.category === category);
};

// Helper function to get all categories
export const getCategories = (): string[] => {
  const categories = new Set(ASTRO_PSYCHOLOGY_QUESTIONS.map((q) => q.category));
  return Array.from(categories);
};

// Category display info
export const CATEGORY_INFO: Record<string, { title: string; emoji: string; description: string }> = {
  character: {
    title: 'Характер',
    emoji: '🌟',
    description: 'Узнаем о вашей внутренней природе',
  },
  goals: {
    title: 'Цели и мечты',
    emoji: '🎯',
    description: 'Раскроем ваши стремления',
  },
  fears: {
    title: 'Тени и сила',
    emoji: '🌙',
    description: 'Исследуем ваши страхи и ресурсы',
  },
  relationships: {
    title: 'Отношения',
    emoji: '💫',
    description: 'Поймём ваш язык любви',
  },
  mood: {
    title: 'Текущее состояние',
    emoji: '✨',
    description: 'Почувствуем ваше «здесь и сейчас»',
  },
  final: {
    title: 'Дар Вселенной',
    emoji: '🎁',
    description: 'Финальный штрих вашего портрета',
  },
};
