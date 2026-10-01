// Расклады Таро и темы вопросов — единый источник для экранов выбора,
// вопроса, расклада и генератора толкования (раньше списки позиций
// дублировались в нескольких файлах и расходились).

export type SpreadId = 'one_card' | 'three_cards' | 'celtic_cross';
export type CategoryId = 'love' | 'career' | 'finance' | 'general';

export interface SpreadPosition {
  title: string;
  /** Что означает карта в этой позиции */
  hint: string;
}

export interface SpreadDef {
  id: SpreadId;
  name: string;
  cards: number;
  positions: SpreadPosition[];
}

export const SPREADS: Record<SpreadId, SpreadDef> = {
  one_card: {
    id: 'one_card',
    name: 'Одна карта',
    cards: 1,
    positions: [{ title: 'Ответ', hint: 'суть ответа на ваш вопрос' }],
  },
  three_cards: {
    id: 'three_cards',
    name: 'Три карты',
    cards: 3,
    positions: [
      { title: 'Прошлое', hint: 'что привело к нынешней ситуации' },
      { title: 'Настоящее', hint: 'что происходит сейчас' },
      { title: 'Будущее', hint: 'куда ведёт нынешний путь' },
    ],
  },
  // Кельтский крест в распространённом современном порядке: сначала крест
  // (суть, препятствие, основа, прошлое, венец, будущее), затем «посох» из
  // четырёх карт снизу вверх
  celtic_cross: {
    id: 'celtic_cross',
    name: 'Кельтский крест',
    cards: 10,
    positions: [
      { title: 'Суть ситуации', hint: 'то, что сейчас в центре вопроса' },
      { title: 'Препятствие', hint: 'что противостоит вам или осложняет дело' },
      { title: 'Основа', hint: 'глубинная причина, подсознательное' },
      { title: 'Недавнее прошлое', hint: 'то, что уже уходит' },
      { title: 'Что венчает', hint: 'ваши сознательные цели и ожидания' },
      { title: 'Ближайшее будущее', hint: 'что приближается в ближайшее время' },
      { title: 'Вы сами', hint: 'ваше отношение и роль в ситуации' },
      { title: 'Окружение', hint: 'влияние других людей и обстоятельств' },
      { title: 'Надежды и страхи', hint: 'чего вы ждёте и чего опасаетесь' },
      { title: 'Итог', hint: 'вероятный исход, если ничего не менять' },
    ],
  },
};

export const DEFAULT_SPREAD_ID: SpreadId = 'three_cards';
export const DEFAULT_CATEGORY_ID: CategoryId = 'general';

export function resolveSpread(id?: string | null): SpreadDef {
  return id && id in SPREADS ? SPREADS[id as SpreadId] : SPREADS[DEFAULT_SPREAD_ID];
}

export function resolveCategory(id?: string | null): CategoryId {
  return id && id in CATEGORY_LENS ? (id as CategoryId) : DEFAULT_CATEGORY_ID;
}

/** «1 карта», «3 карты», «10 карт» */
export function pluralCards(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} карта`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} карты`;
  return `${n} карт`;
}

/** Как каждая тема вопроса окрашивает толкование */
export const CATEGORY_LENS: Record<CategoryId, {
  name: string;
  area: string;
  /** Какая масть говорит о теме вопроса напрямую */
  keySuit: string;
  advice: string;
}> = {
  love: {
    name: 'Любовь',
    area: 'в чувствах и отношениях',
    keySuit: 'cups',
    advice: 'Говорите о своих чувствах прямо и не решайте за другого человека, что он думает.',
  },
  career: {
    name: 'Карьера',
    area: 'в работе и делах',
    keySuit: 'wands',
    advice: 'Выберите один конкретный шаг, который можно сделать на этой неделе, и сделайте его.',
  },
  finance: {
    name: 'Финансы',
    area: 'в деньгах и материальных делах',
    keySuit: 'pentacles',
    advice: 'Опирайтесь на цифры, а не на ожидания: посчитайте, прежде чем рисковать.',
  },
  general: {
    name: 'Общие вопросы',
    area: 'в вашей жизни',
    keySuit: '',
    advice: 'Отметьте, какая из карт откликнулась сильнее всего — там и лежит главный ответ.',
  },
};

/** Что говорит преобладание масти */
export const SUIT_THEMES: Record<string, { name: string; theme: string }> = {
  wands: { name: 'Жезлы', theme: 'энергия, действия, амбиции и работа' },
  cups: { name: 'Кубки', theme: 'чувства, отношения и интуиция' },
  swords: { name: 'Мечи', theme: 'мысли, решения, конфликты и правда' },
  pentacles: { name: 'Пентакли', theme: 'деньги, тело, быт и практические дела' },
};
