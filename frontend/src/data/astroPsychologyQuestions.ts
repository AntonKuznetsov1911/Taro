/**
 * Astro-Psychological Reading Questions
 * Interactive personality analysis in the style of "Birth Chart" show
 */

export interface QuestionOption {
  id: string;
  text: string;
  keywords: string[]; // Keywords for AI analysis
  arcana?: string; // Related Tarot archetype
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
        arcana: 'The Fool',
      },
      {
        id: 'ch1_b',
        text: 'С осторожностью, мне нужно время на адаптацию',
        keywords: ['cautious', 'thoughtful', 'analytical', 'careful', 'protective'],
        arcana: 'The Hermit',
      },
      {
        id: 'ch1_c',
        text: 'С сопротивлением — предпочитаю стабильность',
        keywords: ['stable', 'grounded', 'traditional', 'conservative', 'loyal'],
        arcana: 'The Emperor',
      },
      {
        id: 'ch1_d',
        text: 'По-разному, зависит от ситуации',
        keywords: ['flexible', 'adaptive', 'balanced', 'moderate', 'versatile'],
        arcana: 'Temperance',
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
        arcana: 'The Sun',
      },
      {
        id: 'ch2_b',
        text: 'Я как вода — глубокий, интуитивный, эмоциональный',
        keywords: ['intuitive', 'emotional', 'deep', 'sensitive', 'empathic'],
        arcana: 'The Moon',
      },
      {
        id: 'ch2_c',
        text: 'Я как воздух — лёгкий, общительный, интеллектуальный',
        keywords: ['social', 'intellectual', 'communicative', 'light', 'mental'],
        arcana: 'The Magician',
      },
      {
        id: 'ch2_d',
        text: 'Я как земля — практичный, стабильный, надёжный',
        keywords: ['practical', 'stable', 'reliable', 'grounded', 'material'],
        arcana: 'The Hierophant',
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
        arcana: 'The High Priestess',
      },
      {
        id: 'ch3_b',
        text: 'Логику и анализ фактов',
        keywords: ['logical', 'analytical', 'rational', 'thinking', 'strategic'],
        arcana: 'Justice',
      },
      {
        id: 'ch3_c',
        text: 'Опыт и проверенные методы',
        keywords: ['experienced', 'traditional', 'wise', 'practical', 'proven'],
        arcana: 'The Hermit',
      },
      {
        id: 'ch3_d',
        text: 'Советы близких людей',
        keywords: ['social', 'collaborative', 'trusting', 'connected', 'relational'],
        arcana: 'The Lovers',
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
        arcana: 'The Chariot',
      },
      {
        id: 'g1_b',
        text: 'Любовь и близкие отношения',
        keywords: ['loving', 'relational', 'intimate', 'connected', 'partnership'],
        arcana: 'The Lovers',
      },
      {
        id: 'g1_c',
        text: 'Личностный рост и самопознание',
        keywords: ['growth', 'self-aware', 'transformative', 'evolving', 'inner'],
        arcana: 'The Star',
      },
      {
        id: 'g1_d',
        text: 'Материальная стабильность и комфорт',
        keywords: ['practical', 'security', 'material', 'stable', 'comfortable'],
        arcana: 'Pentacles',
      },
      {
        id: 'g1_e',
        text: 'Творчество и самовыражение',
        keywords: ['creative', 'expressive', 'artistic', 'unique', 'innovative'],
        arcana: 'The Empress',
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
        arcana: 'The Emperor',
      },
      {
        id: 'g2_b',
        text: 'Я окружён любовью, в гармонии с собой и близкими',
        keywords: ['harmonious', 'loving', 'peaceful', 'balanced', 'connected'],
        arcana: 'The World',
      },
      {
        id: 'g2_c',
        text: 'Я живу по своим правилам, полностью свободен',
        keywords: ['free', 'independent', 'unconventional', 'rebellious', 'authentic'],
        arcana: 'The Fool',
      },
      {
        id: 'g2_d',
        text: 'Я наконец понял себя и обрёл внутренний покой',
        keywords: ['peaceful', 'enlightened', 'wise', 'centered', 'spiritual'],
        arcana: 'The Hermit',
      },
      {
        id: 'g2_e',
        text: 'Я создаю что-то значимое, меняю мир',
        keywords: ['creative', 'impactful', 'purposeful', 'transformative', 'visionary'],
        arcana: 'The Magician',
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
        arcana: 'The Tower',
      },
      {
        id: 'f1_b',
        text: 'Страх одиночества и отвержения',
        keywords: ['lonely', 'seeking-approval', 'dependent', 'fear-of-abandonment', 'social'],
        arcana: 'The Moon',
      },
      {
        id: 'f1_c',
        text: 'Страх упустить свой потенциал',
        keywords: ['unfulfilled', 'potential', 'pressure', 'self-doubt', 'ambitious'],
        arcana: 'Judgement',
      },
      {
        id: 'f1_d',
        text: 'Страх перемен и неизвестности',
        keywords: ['anxious', 'conservative', 'security-seeking', 'cautious', 'resistant'],
        arcana: 'The Hanged Man',
      },
      {
        id: 'f1_e',
        text: 'У меня нет серьёзных страхов',
        keywords: ['confident', 'fearless', 'optimistic', 'trusting', 'secure'],
        arcana: 'Strength',
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
        arcana: 'Strength',
      },
      {
        id: 'f2_b',
        text: 'Поддержка близких людей',
        keywords: ['supported', 'connected', 'trusting', 'collaborative', 'relational'],
        arcana: 'The Lovers',
      },
      {
        id: 'f2_c',
        text: 'Вера в высшие силы и судьбу',
        keywords: ['spiritual', 'faithful', 'trusting', 'surrendering', 'mystical'],
        arcana: 'The Star',
      },
      {
        id: 'f2_d',
        text: 'Позитивное мышление и юмор',
        keywords: ['optimistic', 'light', 'humorous', 'positive', 'resilient'],
        arcana: 'The Sun',
      },
      {
        id: 'f2_e',
        text: 'Анализ ситуации и план действий',
        keywords: ['strategic', 'analytical', 'planning', 'rational', 'organized'],
        arcana: 'The Magician',
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
        arcana: 'The Lovers',
      },
      {
        id: 'r1_b',
        text: 'Стабильность и надёжность партнёра',
        keywords: ['stable', 'reliable', 'secure', 'committed', 'loyal'],
        arcana: 'The Hierophant',
      },
      {
        id: 'r1_c',
        text: 'Свобода и независимость друг от друга',
        keywords: ['independent', 'free', 'autonomous', 'space', 'unconventional'],
        arcana: 'The Fool',
      },
      {
        id: 'r1_d',
        text: 'Глубокое понимание и духовная связь',
        keywords: ['understanding', 'spiritual', 'deep', 'soulmate', 'empathic'],
        arcana: 'The High Priestess',
      },
      {
        id: 'r1_e',
        text: 'Общие цели и совместный рост',
        keywords: ['growth', 'partnership', 'collaborative', 'evolving', 'supportive'],
        arcana: 'The World',
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
        arcana: 'The Magician',
      },
      {
        id: 'r2_b',
        text: 'Через качественное время вместе',
        keywords: ['present', 'attentive', 'quality-time', 'connected', 'devoted'],
        arcana: 'The Lovers',
      },
      {
        id: 'r2_c',
        text: 'Через подарки и материальные знаки внимания',
        keywords: ['generous', 'material', 'giving', 'providing', 'abundant'],
        arcana: 'The Empress',
      },
      {
        id: 'r2_d',
        text: 'Через поступки и помощь',
        keywords: ['helpful', 'supportive', 'practical', 'service', 'caring'],
        arcana: 'The Hermit',
      },
      {
        id: 'r2_e',
        text: 'Через физическую близость и прикосновения',
        keywords: ['physical', 'tactile', 'sensual', 'intimate', 'affectionate'],
        arcana: 'The Devil',
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
        arcana: 'The Chariot',
      },
      {
        id: 'm1_b',
        text: 'Я спокоен и уравновешен',
        keywords: ['calm', 'balanced', 'peaceful', 'centered', 'stable'],
        arcana: 'Temperance',
      },
      {
        id: 'm1_c',
        text: 'Я задумчив и погружён в себя',
        keywords: ['introspective', 'thoughtful', 'reflective', 'contemplative', 'inner'],
        arcana: 'The Hermit',
      },
      {
        id: 'm1_d',
        text: 'Я взволнован и немного тревожен',
        keywords: ['anxious', 'worried', 'uncertain', 'tense', 'restless'],
        arcana: 'The Moon',
      },
      {
        id: 'm1_e',
        text: 'Я в ожидании перемен',
        keywords: ['expectant', 'transitional', 'anticipating', 'waiting', 'hopeful'],
        arcana: 'The Hanged Man',
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
        arcana: 'The Hanged Man',
      },
      {
        id: 'm2_b',
        text: 'Новые впечатления и эмоции',
        keywords: ['seeking', 'adventurous', 'bored', 'curious', 'stimulation'],
        arcana: 'The Fool',
      },
      {
        id: 'm2_c',
        text: 'Ясность и понимание',
        keywords: ['confused', 'seeking-answers', 'clarity', 'direction', 'guidance'],
        arcana: 'The High Priestess',
      },
      {
        id: 'm2_d',
        text: 'Поддержка и тепло',
        keywords: ['needing-support', 'vulnerable', 'connection', 'warmth', 'comfort'],
        arcana: 'The Empress',
      },
      {
        id: 'm2_e',
        text: 'Уверенность и силу',
        keywords: ['needing-strength', 'courage', 'empowerment', 'confidence', 'power'],
        arcana: 'Strength',
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
        arcana: 'The Hermit',
      },
      {
        id: 'fn1_b',
        text: 'Безусловная любовь',
        keywords: ['love', 'unconditional', 'acceptance', 'compassion', 'heart'],
        arcana: 'The Empress',
      },
      {
        id: 'fn1_c',
        text: 'Силу преодолевать любые препятствия',
        keywords: ['strength', 'power', 'resilience', 'overcome', 'invincible'],
        arcana: 'Strength',
      },
      {
        id: 'fn1_d',
        text: 'Свободу быть собой',
        keywords: ['freedom', 'authenticity', 'liberation', 'true-self', 'expression'],
        arcana: 'The Fool',
      },
      {
        id: 'fn1_e',
        text: 'Способность создавать свою реальность',
        keywords: ['manifestation', 'creative', 'powerful', 'magic', 'creator'],
        arcana: 'The Magician',
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
