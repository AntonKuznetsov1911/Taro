// Толкование ладони по классической хиромантии.
//
// Признаки ладони приходят из автоматического разбора снимка
// (palmVision.ts) или, если распознать не удалось, из ручного описания.
// Каждая линия описывается набором признаков: глубина, форма и особенности
// (разрывы, «цепочка», раздвоение).

import { PALM_LINES, HAND_SHAPES } from '../data/palmistryKnowledge';

export type HandShapeId = 'earth' | 'air' | 'water' | 'fire';
export type LineTrait = 'deep' | 'shallow' | 'broken' | 'chained' | 'forked' | 'straight' | 'curved';
export type PalmLineId = 'heart_line' | 'head_line' | 'life_line' | 'fate_line';

export interface PalmFeatures {
  hand: HandShapeId;
  heart_line: LineTrait[];
  head_line: LineTrait[];
  life_line: LineTrait[];
  /** Линия судьбы есть не у всех */
  fate_line: LineTrait[] | 'none';
}

export const HAND_SHAPE_OPTIONS: Array<{ id: HandShapeId; title: string; hint: string }> = [
  { id: 'earth', title: 'Земная', hint: 'Квадратная ладонь, короткие пальцы' },
  { id: 'air', title: 'Воздушная', hint: 'Квадратная ладонь, длинные пальцы' },
  { id: 'water', title: 'Водная', hint: 'Вытянутая ладонь, длинные пальцы' },
  { id: 'fire', title: 'Огненная', hint: 'Вытянутая ладонь, короткие пальцы' },
];

export const LINE_TRAIT_OPTIONS: Array<{ id: LineTrait; title: string }> = [
  { id: 'deep', title: 'Глубокая, чёткая' },
  { id: 'shallow', title: 'Тонкая, едва видна' },
  { id: 'straight', title: 'Прямая' },
  { id: 'curved', title: 'Изогнута дугой' },
  { id: 'forked', title: 'Раздваивается' },
  { id: 'broken', title: 'С разрывами' },
  { id: 'chained', title: 'Цепочкой из звеньев' },
];

export const PALM_LINE_STEPS: Array<{ id: PalmLineId; title: string; /** «на линии …» */ prepositional: string; where: string; optional?: boolean }> = [
  { id: 'heart_line', title: 'Линия сердца', prepositional: 'линии сердца', where: 'верхняя поперечная линия: от края ладони под мизинцем к указательному пальцу' },
  { id: 'head_line', title: 'Линия ума', prepositional: 'линии ума', where: 'средняя поперечная линия: начинается между большим и указательным пальцем' },
  { id: 'life_line', title: 'Линия жизни', prepositional: 'линии жизни', where: 'дуга, огибающая основание большого пальца' },
  { id: 'fate_line', title: 'Линия судьбы', prepositional: 'линии судьбы', where: 'вертикальная линия от запястья к среднему пальцу — есть не у всех', optional: true },
];

const HAND_ELEMENT_THEMES: Record<HandShapeId, string> = {
  earth: 'опора, надёжность и дела, которые можно потрогать руками',
  air: 'идеи, общение и свобода мысли',
  water: 'чувства, интуиция и тонкое понимание людей',
  fire: 'энергия, страсть и стремление действовать',
};

function lineById(id: PalmLineId) {
  return PALM_LINES.find(l => l.id === id)!;
}

export function isPalmFeaturesComplete(f: Partial<PalmFeatures>): f is PalmFeatures {
  const lineOk = (x: unknown) => Array.isArray(x) && x.length > 0;
  return !!(f.hand && lineOk(f.heart_line) && lineOk(f.head_line) && lineOk(f.life_line) &&
    (f.fate_line === 'none' || lineOk(f.fate_line)));
}

/** Как получены признаки — для честной подписи в толковании */
export type PalmSource = 'auto' | 'manual';

/** Толкование детерминировано: одинаковое описание даёт одинаковый текст */
export function generatePalmReading(features: PalmFeatures, source: PalmSource = 'manual'): string {
  const hand = HAND_SHAPES.find(h => h.id === features.hand)!;
  const traitTitle = (t: LineTrait) => LINE_TRAIT_OPTIONS.find(o => o.id === t)!.title.toLowerCase();

  let text = source === 'auto'
    ? `Толкование составлено по автоматическому разбору фото — по правилам классической хиромантии.\n\n`
    : `Толкование составлено по тому, как вы сами описали свою ладонь, — по правилам классической хиромантии.\n\n`;

  text += `## ✋ Форма руки: ${hand.nameRu}\n\n`;
  text += `*Стихия: ${hand.element}. ${hand.characteristics}.*\n\n`;
  text += `${hand.personality}.\n\n`;

  text += `## 📖 Главные линии\n\n`;
  for (const step of PALM_LINE_STEPS) {
    const line = lineById(step.id);
    const traits = features[step.id];
    text += `### ${line.nameRu}\n\n`;
    if (traits === 'none') {
      text += `Линия судьбы не выражена. Это не плохой знак: такие люди не следуют заранее заданному сценарию и сами выбирают направление, часто меняя его в течение жизни.\n\n`;
      continue;
    }
    text += `*${source === 'auto' ? 'На снимке' : 'Вы отметили'}: ${traits.map(traitTitle).join(', ')}.*\n\n`;
    text += traits.map(t => `${line.meanings[t]}.`).join(' ') + `\n\n`;
  }

  // Вывод: что в руке сильнее всего
  text += `## 💫 Общий вывод\n\n`;
  const has = (id: PalmLineId, t: LineTrait) => {
    const traits = features[id];
    return Array.isArray(traits) && traits.includes(t);
  };
  const deepLines = PALM_LINE_STEPS.filter(s => has(s.id, 'deep')).map(s => s.title.toLowerCase());
  const troubled = PALM_LINE_STEPS.filter(s => has(s.id, 'broken') || has(s.id, 'chained'))
    .map(s => s.prepositional);

  text += `Ваша рука говорит о человеке, для которого главное — ${HAND_ELEMENT_THEMES[features.hand]}.`;
  if (deepLines.length) text += ` Сильнее всего ${deepLines.length > 1 ? 'выражены' : 'выражена'} ${deepLines.join(' и ')} — ${deepLines.length > 1 ? 'в этих сферах' : 'в этой сфере'} ваш главный ресурс.`;
  if (troubled.length) text += ` На ${troubled.join(' и ')} видны перемены и испытания — это зона роста, а не приговор.`;
  text += `\n\n`;
  text += `*Линии рук меняются со временем — перечитайте ладонь через год, и картина может стать другой.*\n`;

  return text;
}
