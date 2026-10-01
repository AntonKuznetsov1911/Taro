// Астропсихологический портрет: архетипы личности из ответов теста
// плюс натальный аркан по знаку Солнца.
//
// Раньше портрет собирался так: ничьи между архетипами решал порядок
// вопросов, пять арканов были недостижимы, «жизненный путь» и «фаза»
// выбирались хэшем английских ключевых слов, а тексты были одинаковыми
// для всех. Теперь результат детерминирован и целиком выводится из ответов.

import { ASTRO_PSYCHOLOGY_QUESTIONS, QuestionOption } from '../data/astroPsychologyQuestions';
import { Archetype, findArchetype, SUN_SIGN_ARCANA } from '../data/archetypes';
import { MAJOR_ARCANA } from '../data/tarotCards';
import { getZodiacSign, ZodiacSign } from './astrology';

export interface AstroPortrait {
  dominant_arcana: string[];
  character_traits: string[];
  life_path: string;
  current_phase: string;
  advice: string;
  personality_analysis: string;
}

const PRIMARY_WEIGHT = 2;
const SECONDARY_WEIGHT = 1;
const NATAL_WEIGHT = 1;

/** Текущее состояние — по ответу на вопрос «как вы сейчас?» */
const PHASE_BY_MOOD: Record<string, string> = {
  m1_a: 'Фаза действия — сил много, и сейчас удачное время воплощать задуманное',
  m1_b: 'Фаза равновесия — вы в ладу с собой, это время укреплять то, что уже есть',
  m1_c: 'Фаза осмысления — внимание обращено внутрь, идёт переоценка и поиск смысла',
  m1_d: 'Фаза перехода — тревога говорит о том, что старое уходит, а новое ещё не оформилось',
  m1_e: 'Фаза ожидания — перемены на пороге, и важно подготовить для них почву',
};

/** Что сейчас поддержит — по ответу «что вам больше всего нужно?» */
const NEED_ADVICE: Record<string, string> = {
  m2_a: 'Сейчас вам важнее всего восстановиться: выделите время на сон и отдых без чувства вины.',
  m2_b: 'Добавьте в ближайшие дни что-то новое — место, занятие или знакомство.',
  m2_c: 'Чтобы обрести ясность, запишите, что вас беспокоит, и отделите факты от догадок.',
  m2_d: 'Не оставайтесь со всем в одиночку: напишите близкому человеку и попросите поддержки.',
  m2_e: 'Вспомните три ситуации, с которыми вы уже справились, — уверенность растёт из опыта.',
};

const OPTION_BY_ID = new Map<string, { option: QuestionOption; category: string }>();
for (const q of ASTRO_PSYCHOLOGY_QUESTIONS) {
  for (const option of q.options) OPTION_BY_ID.set(option.id, { option, category: q.category });
}

const ARCANA_ORDER = new Map(MAJOR_ARCANA.map(c => [c.name, c.id]));

/** Ответы приходят как список id вариантов («ch1_a,ch2_b,…») */
export function parseAnswerIds(raw: unknown): string[] {
  if (typeof raw !== 'string') return [];
  return raw.split(',').map(s => s.trim()).filter(id => OPTION_BY_ID.has(id));
}

/** Тест пройден полностью: по одному ответу на каждый вопрос */
export function isCompleteAnswerSet(ids: string[]): boolean {
  return ASTRO_PSYCHOLOGY_QUESTIONS.every(q => q.options.filter(o => ids.includes(o.id)).length === 1);
}

export function getNatalArcana(birthDate?: string | null): { sign: ZodiacSign; arcana: Archetype } | null {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  if (isNaN(date.getTime())) return null;
  const sign = getZodiacSign(date);
  const arcana = findArchetype(SUN_SIGN_ARCANA[sign.name]);
  return arcana ? { sign, arcana } : null;
}

function quoted(names: string[]): string {
  const q = names.map(n => `«${n}»`);
  return q.length > 1 ? `${q.slice(0, -1).join(', ')} и ${q[q.length - 1]}` : q[0];
}

export function generateAstroPortrait(answerIds: string[], birthDate?: string | null): AstroPortrait {
  const scores = new Map<string, number>();
  const primaryPicks = new Map<string, number>();
  const add = (arcana: string | undefined, w: number) => {
    if (arcana && findArchetype(arcana)) scores.set(arcana, (scores.get(arcana) ?? 0) + w);
  };

  let moodId: string | undefined;
  let needId: string | undefined;
  for (const id of answerIds) {
    const entry = OPTION_BY_ID.get(id);
    if (!entry) continue;
    if (entry.category === 'mood') {
      if (id.startsWith('m1_')) moodId = id;
      else needId = id;
      continue;
    }
    add(entry.option.arcana, PRIMARY_WEIGHT);
    add(entry.option.also, SECONDARY_WEIGHT);
    if (entry.option.arcana) primaryPicks.set(entry.option.arcana, (primaryPicks.get(entry.option.arcana) ?? 0) + 1);
  }

  const natal = getNatalArcana(birthDate);
  if (natal) add(natal.arcana.arcana, NATAL_WEIGHT);

  // Порядок не зависит от порядка вопросов: баллы → число прямых выборов →
  // совпадение с натальным арканом → номер аркана
  const ranked = Array.from(scores.keys()).sort((a, b) =>
    (scores.get(b)! - scores.get(a)!) ||
    ((primaryPicks.get(b) ?? 0) - (primaryPicks.get(a) ?? 0)) ||
    (Number(b === natal?.arcana.arcana) - Number(a === natal?.arcana.arcana)) ||
    ((ARCANA_ORDER.get(a) ?? 0) - (ARCANA_ORDER.get(b) ?? 0))
  );
  // Без ответов портрета нет — экран результата предложит пройти тест
  if (ranked.length < 3) throw new Error('Not enough answers for a portrait');

  const [core, potential, direction] = ranked.slice(0, 3).map(name => findArchetype(name)!);
  const top = [core, potential, direction];

  const traits = Array.from(new Set(top.flatMap(a => a.traits))).slice(0, 6);
  const phase = (moodId && PHASE_BY_MOOD[moodId]) || PHASE_BY_MOOD.m1_b;
  const needTip = needId ? NEED_ADVICE[needId] : '';

  let text = `### 🎴 ${core.arcana} — ${core.title}\n\n${core.essence}\n\n`;
  text += `### 🎴 ${potential.arcana} — ${potential.title}\n\n${potential.essence}\n\n`;
  text += `### 🎴 ${direction.arcana} — ${direction.title}\n\n${direction.essence}\n\n`;

  text += `### 💪 Сильные стороны\n\n`;
  text += [...core.strengths, potential.strengths[0]].map(s => `• ${capitalize(s)}`).join('\n') + '\n\n';
  text += `### 🌱 Над чем работать\n\n`;
  text += [core.growth[0], direction.growth[0]].map(s => `• ${capitalize(s)}`).join('\n') + '\n\n';

  if (natal) {
    const inTop = top.some(a => a.arcana === natal.arcana.arcana);
    text += `### ${natal.sign.symbol} Натальный аркан\n\n`;
    text += `Солнце в знаке ${natal.sign.nameRu} соответствует аркану «${natal.arcana.arcana}» (${natal.arcana.title}). `;
    text += inTop
      ? 'Он вошёл в ваши ведущие архетипы — ваш характер совпадает с тем, что обещает знак рождения.\n\n'
      : `Ваши ответы сильнее проявили другие архетипы — качества знака рождения (${natal.arcana.traits.join(', ')}) остаются ресурсом, к которому стоит обращаться.\n\n`;
  }

  text += `---\n\n*Портрет составлен по вашим ответам и архетипам старших арканов ${quoted(top.map(a => a.arcana))}. `;
  text += `Это инструмент самопознания, а не психологическая диагностика.*`;

  return {
    dominant_arcana: top.map(a => a.arcana),
    character_traits: traits,
    life_path: core.path,
    current_phase: phase,
    advice: [core.advice, needTip].filter(Boolean).join(' '),
    personality_analysis: text,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

