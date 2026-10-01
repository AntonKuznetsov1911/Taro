// Гороскоп по реальным транзитам.
//
// Всё, что здесь утверждается о небе, рассчитано по эфемериде
// (astronomy-engine): положения Солнца, Луны и планет, их ретроградность,
// смены знаков, ближайшие новолуние и полнолуние. Толкования — классическая
// схема «солнечного» гороскопа: знак человека считается 1-м домом, и смысл
// дня зависит от того, через какие дома идут планеты и какие аспекты они
// образуют с его знаком. Каждое толкование хранит своё астрономическое
// основание, чтобы его можно было показать пользователю.

import * as Astronomy from 'astronomy-engine';
import { ZODIAC_SIGNS, ZodiacSign, getMoonData, formatLunarDayRange } from './astrology';
import { getLunarDayInfo } from '../data/lunarDays';

// ==================== СПРАВОЧНИКИ ====================

/** «в Овне», «в Близнецах» */
const SIGN_PREPOSITIONAL = ['Овне', 'Тельце', 'Близнецах', 'Раке', 'Льве', 'Деве', 'Весах', 'Скорпионе', 'Стрельце', 'Козероге', 'Водолее', 'Рыбах'];

const HOUSES: Array<{ sphere: string; moonTip: string; sunTheme: string }> = [
  { sphere: 'личность и самочувствие', moonTip: 'вы заметнее для других, эмоции ближе к поверхности — хорошее время позаботиться о себе и своём облике', sunTheme: 'ваш личный новый год: время ставить цели на год и заявлять о себе' },
  { sphere: 'деньги и ресурсы', moonTip: 'внимание тянется к деньгам и вещам — удобно разобрать бюджет, но импульсивные покупки соблазнительнее обычного', sunTheme: 'месяц денег и самооценки: пересмотрите доходы, траты и то, что вы цените' },
  { sphere: 'общение, учёба и поездки', moonTip: 'день разговоров, переписки и коротких поездок — легко договариваться и узнавать новое', sunTheme: 'месяц общения и учёбы: много встреч, сообщений, новых сведений' },
  { sphere: 'дом и семья', moonTip: 'тянет домой и к близким — хорошо заняться бытом и побыть с семьёй', sunTheme: 'месяц дома и корней: семья, жильё, внутренняя опора' },
  { sphere: 'любовь, творчество и удовольствия', moonTip: 'больше желания радоваться, флиртовать и творить — день для свиданий, хобби и игры', sunTheme: 'месяц любви и творчества: время для романтики, детей и того, что приносит радость' },
  { sphere: 'работа, режим и здоровье', moonTip: 'день будничных дел: удобно навести порядок в задачах и заняться здоровьем', sunTheme: 'месяц работы и режима: порядок в делах, внимание к телу и привычкам' },
  { sphere: 'партнёрство и договоры', moonTip: 'в центре — другие люди: партнёр, клиенты, договорённости; хорошо искать компромисс', sunTheme: 'месяц партнёрства: отношения, договоры и сотрудничество выходят на первый план' },
  { sphere: 'общие деньги, долги и глубокие чувства', moonTip: 'эмоции глубже и острее — время для честных разговоров, а также для кредитов, налогов и общих финансов', sunTheme: 'месяц глубоких перемен: общие ресурсы, долги, близость и то, с чем пора расстаться' },
  { sphere: 'путешествия, обучение и мировоззрение', moonTip: 'хочется простора и смысла — подходит для учёбы, дальних планов и новых идей', sunTheme: 'месяц расширения горизонтов: путешествия, учёба, поиск смысла' },
  { sphere: 'карьера и репутация', moonTip: 'на виду ваши профессиональные дела — удачно показать результат руководству или публике', sunTheme: 'месяц карьеры: время для профессиональных целей и заметных шагов' },
  { sphere: 'друзья, сообщества и планы', moonTip: 'день друзей и единомышленников — хорошо встречаться, строить планы и просить поддержки', sunTheme: 'месяц друзей и планов на будущее: команды, сообщества, мечты' },
  { sphere: 'уединение и отдых', moonTip: 'силы на спаде — разумно отдохнуть, выспаться и не назначать важного', sunTheme: 'месяц перед вашим днём рождения: время подводить итоги года и восстанавливаться' },
];

type PlanetKey = 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn';

const PLANETS: Record<PlanetKey, { body: Astronomy.Body; name: string; /** «Меркурия» */ genitive: string; themes: string; benefic: number }> = {
  mercury: { body: Astronomy.Body.Mercury, name: 'Меркурий', genitive: 'Меркурия', themes: 'общение, документы, учёба и поездки', benefic: 0 },
  venus: { body: Astronomy.Body.Venus, name: 'Венера', genitive: 'Венеры', themes: 'любовь, симпатии, красота и деньги', benefic: 1 },
  mars: { body: Astronomy.Body.Mars, name: 'Марс', genitive: 'Марса', themes: 'энергия, инициатива и спорт', benefic: -1 },
  jupiter: { body: Astronomy.Body.Jupiter, name: 'Юпитер', genitive: 'Юпитера', themes: 'рост, возможности и удача', benefic: 1 },
  saturn: { body: Astronomy.Body.Saturn, name: 'Сатурн', genitive: 'Сатурна', themes: 'ответственность, сроки и ограничения', benefic: -1 },
};

const RETROGRADE_NOTES: Partial<Record<PlanetKey, string>> = {
  mercury: 'по традиции не лучшее время подписывать важные договоры и покупать технику; хорошо перепроверять, дорабатывать и возвращаться к старым делам',
  venus: 'по традиции не время для новых романов и крупных покупок ради красоты; часто возвращаются старые чувства и люди из прошлого',
  mars: 'по традиции энергия уходит внутрь: лучше не начинать споров и рискованных дел, а доделывать начатое',
  jupiter: 'рост идёт внутрь: время переосмыслить планы, а не расширяться',
  saturn: 'время пересмотреть обязательства и долгосрочные планы',
};

type AspectKind = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition' | 'none';

/** Аспекты между знаками (по целым знакам) */
function aspectBetween(signA: number, signB: number): AspectKind {
  const d = Math.min((signA - signB + 12) % 12, (signB - signA + 12) % 12);
  return ({ 0: 'conjunction', 2: 'sextile', 3: 'square', 4: 'trine', 6: 'opposition' } as Record<number, AspectKind>)[d] ?? 'none';
}

const ASPECT_NAMES: Record<AspectKind, string> = {
  conjunction: 'соединение', sextile: 'секстиль', square: 'квадрат', trine: 'трин', opposition: 'оппозиция', none: '',
};

function aspectScore(kind: AspectKind, benefic: number): number {
  switch (kind) {
    case 'trine': return 1;
    case 'sextile': return 0.5;
    case 'square': return -1;
    case 'opposition': return -0.5;
    case 'conjunction': return 0.5 * benefic;
    default: return 0;
  }
}

// ==================== АСТРОНОМИЯ ====================

function eclipticLongitude(body: Astronomy.Body, date: Date): number {
  if (body === Astronomy.Body.Moon) return Astronomy.EclipticGeoMoon(date).lon;
  if (body === Astronomy.Body.Sun) return Astronomy.SunPosition(date).elon;
  return Astronomy.Ecliptic(Astronomy.GeoVector(body, date, true)).elon;
}

const signOf = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);

function isRetrograde(body: Astronomy.Body, date: Date): boolean {
  let d = eclipticLongitude(body, new Date(date.getTime() + 864e5)) - eclipticLongitude(body, date);
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d < 0;
}

/** Когда планета сменит знак (поиск с шагом и уточнением до минуты) */
function nextSignChange(body: Astronomy.Body, date: Date, stepHours: number, maxDays: number): Date | null {
  const start = signOf(eclipticLongitude(body, date));
  let lo = date.getTime();
  for (let t = lo + stepHours * 36e5; t <= lo + maxDays * 864e5; t += stepHours * 36e5) {
    if (signOf(eclipticLongitude(body, new Date(t))) !== start) {
      let a = t - stepHours * 36e5, b = t;
      while (b - a > 60e3) {
        const m = (a + b) / 2;
        if (signOf(eclipticLongitude(body, new Date(m))) === start) a = m; else b = m;
      }
      return new Date(b);
    }
  }
  return null;
}

/** Когда закончится ретроградность (станция директ) */
function retrogradeEnd(body: Astronomy.Body, date: Date): Date | null {
  for (let i = 1; i <= 160; i++) {
    const t = new Date(date.getTime() + i * 864e5);
    if (!isRetrograde(body, t)) return t;
  }
  return null;
}

// ==================== ГОРОСКОП ====================

export interface Reasoned {
  text: string;
  /** Астрономическое основание толкования */
  basis: string;
}

export interface TransitHoroscope {
  sign: ZodiacSign;
  date: Date;
  /** Главное о дне: Луна в солнечном доме */
  day: Reasoned;
  /** Тема месяца: Солнце в солнечном доме */
  month: Reasoned;
  love: Reasoned[];
  work: Reasoned[];
  energy: Reasoned[];
  /** Баланс гармоничных и напряжённых аспектов, 1–10 */
  balance: number;
  balanceBasis: string;
  sky: {
    moon: string;
    lunarDay: string;
    lunarDayEssence: string;
    planets: string[];
    retrogrades: string[];
    upcoming: string[];
  };
  favorable: string[];
  unfavorable: string[];
}

const fmtTime = (d: Date) => d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const fmtDay = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

function planetReading(key: PlanetKey, signIdx: number, date: Date) {
  const p = PLANETS[key];
  const pSign = signOf(eclipticLongitude(p.body, date));
  const house = (pSign - signIdx + 12) % 12;
  const aspect = aspectBetween(pSign, signIdx);
  const retro = isRetrograde(p.body, date);
  const where = `${p.name} в ${SIGN_PREPOSITIONAL[pSign]}${retro ? ', в ретроградном движении' : ''}`;
  let basis = `${where} — ваш ${house + 1}-й дом`;
  if (aspect !== 'none') basis += aspect === 'conjunction' ? ', в вашем знаке' : `, ${ASPECT_NAMES[aspect]} к вашему знаку`;
  return { p, pSign, house, aspect, retro, basis, score: aspectScore(aspect, p.benefic) - (retro ? 0.5 : 0) };
}

function aspectSentence(r: ReturnType<typeof planetReading>): string {
  const sphere = HOUSES[r.house].sphere;
  switch (r.aspect) {
    case 'trine':
    case 'sextile':
      return `Гармоничный аспект ${r.p.genitive} к вашему знаку: ${r.p.themes} складываются легче обычного, особенно в сфере «${sphere}».`;
    case 'square':
    case 'opposition':
      return `Напряжённый аспект ${r.p.genitive} к вашему знаку: в темах «${r.p.themes}» возможны трения — действуйте осознанно, особенно в сфере «${sphere}».`;
    case 'conjunction':
      return `${r.p.name} в вашем знаке: ${r.p.themes} сейчас касаются вас лично и выходят на первый план.`;
    default:
      return `${r.p.name} проходит ваш ${r.house + 1}-й дом: ${r.p.themes} сейчас связаны со сферой «${sphere}».`;
  }
}

export function buildTransitHoroscope(sign: ZodiacSign, date: Date = new Date()): TransitHoroscope {
  const signIdx = ZODIAC_SIGNS.findIndex(s => s.name === sign.name);
  const moon = getMoonData(date);
  const moonSign = signOf(eclipticLongitude(Astronomy.Body.Moon, date));
  const moonHouse = (moonSign - signIdx + 12) % 12;
  const moonAspect = aspectBetween(moonSign, signIdx);
  const sunSign = signOf(eclipticLongitude(Astronomy.Body.Sun, date));
  const sunHouse = (sunSign - signIdx + 12) % 12;

  const moonIngress = nextSignChange(Astronomy.Body.Moon, date, 2, 3);
  const sunIngress = nextSignChange(Astronomy.Body.Sun, date, 24, 32);

  const r = Object.fromEntries(
    (Object.keys(PLANETS) as PlanetKey[]).map(k => [k, planetReading(k, signIdx, date)])
  ) as Record<PlanetKey, ReturnType<typeof planetReading>>;

  const day: Reasoned = {
    text: `Луна проходит ваш ${moonHouse + 1}-й дом — сферу «${HOUSES[moonHouse].sphere}». По традиции ${HOUSES[moonHouse].moonTip}.`,
    basis: `Луна в ${SIGN_PREPOSITIONAL[moonSign]}${moonIngress ? ` до ${fmtTime(moonIngress)}` : ''}`,
  };
  const month: Reasoned = {
    text: `Солнце освещает ваш ${sunHouse + 1}-й дом — ${HOUSES[sunHouse].sunTheme}.`,
    basis: `Солнце в ${SIGN_PREPOSITIONAL[sunSign]}${sunIngress ? ` до ${fmtDay(sunIngress)}` : ''}`,
  };

  const reasoned = (k: PlanetKey): Reasoned => ({ text: aspectSentence(r[k]), basis: r[k].basis });

  const love: Reasoned[] = [reasoned('venus')];
  if ([4, 6, 7].includes(moonHouse)) {
    love.push({ text: 'Луна в доме отношений усиливает эмоции и потребность в близости — день подходит для свиданий и откровенных разговоров.', basis: day.basis });
  }
  const work: Reasoned[] = [reasoned('mercury'), reasoned('saturn'), reasoned('jupiter')];
  const energy: Reasoned[] = [reasoned('mars')];
  if ([0, 5, 11].includes(moonHouse)) {
    energy.push({
      text: moonHouse === 11 ? 'Луна в 12-м доме традиционно означает спад сил — дайте себе выспаться.' : 'Луна в доме здоровья и самочувствия: прислушайтесь к телу и режиму.',
      basis: day.basis,
    });
  }

  // Баланс аспектов дня — традиционная оценка, а не обещание
  const parts = [...Object.values(r).map(x => x.score), aspectScore(moonAspect, 0.5)];
  const balance = Math.max(1, Math.min(10, Math.round(6 + parts.reduce((a, b) => a + b, 0) * 1.2)));
  const harmonious = Object.values(r).filter(x => x.aspect === 'trine' || x.aspect === 'sextile').map(x => x.p.name);
  const tense = Object.values(r).filter(x => x.aspect === 'square' || x.aspect === 'opposition').map(x => x.p.name);
  const balanceBasis = [
    harmonious.length ? `гармоничные аспекты: ${harmonious.join(', ')}` : '',
    tense.length ? `напряжённые: ${tense.join(', ')}` : '',
    !harmonious.length && !tense.length ? 'сильных аспектов к вашему знаку нет' : '',
  ].filter(Boolean).join('; ');

  // Что на небе — факты
  const lunarInfo = getLunarDayInfo(moon.lunarDay);
  const range = formatLunarDayRange(moon);
  const retrogrades = (Object.keys(PLANETS) as PlanetKey[]).filter(k => r[k].retro).map(k => {
    const end = retrogradeEnd(PLANETS[k].body, date);
    return `${PLANETS[k].name} — в ретроградном движении${end ? ` до ${fmtDay(end)}` : ''}: ${RETROGRADE_NOTES[k]}.`;
  });
  const upcoming: string[] = [];
  try {
    let q = Astronomy.SearchMoonQuarter(date);
    const found: Record<number, Date> = {};
    for (let i = 0; i < 4 && (found[0] === undefined || found[2] === undefined); i++) {
      if (q.quarter === 0 || q.quarter === 2) found[q.quarter] ??= q.time.date;
      q = Astronomy.NextMoonQuarter(q);
    }
    const events = [
      found[0] && { d: found[0], t: `Новолуние — ${fmtTime(found[0])}` },
      found[2] && { d: found[2], t: `Полнолуние — ${fmtTime(found[2])}` },
    ].filter(Boolean) as Array<{ d: Date; t: string }>;
    events.sort((a, b) => a.d.getTime() - b.d.getTime()).forEach(e => upcoming.push(e.t));
  } catch {
    // без ближайших фаз гороскоп остаётся полным
  }
  // Развороты планет в ближайшие две недели
  for (const k of Object.keys(PLANETS) as PlanetKey[]) {
    for (let i = 1; i <= 14; i++) {
      const t = new Date(date.getTime() + i * 864e5);
      if (isRetrograde(PLANETS[k].body, t) !== r[k].retro) {
        upcoming.push(`${PLANETS[k].name} ${r[k].retro ? 'вернётся к прямому движению' : 'начнёт ретроградное движение'} — около ${fmtDay(t)}`);
        break;
      }
    }
  }
  if (sunIngress) upcoming.push(`Солнце перейдёт в знак ${ZODIAC_SIGNS[(sunSign + 1) % 12].nameRu} — ${fmtDay(sunIngress)}`);

  return {
    sign,
    date,
    day,
    month,
    love,
    work,
    energy,
    balance,
    balanceBasis,
    sky: {
      moon: `${moon.emoji} ${moon.phaseNameRu} (${moon.illumination}%), Луна в ${SIGN_PREPOSITIONAL[moonSign]}${moonIngress ? `, перейдёт в ${ZODIAC_SIGNS[(moonSign + 1) % 12].nameRu} ${fmtTime(moonIngress)}` : ''}`,
      lunarDay: `${moon.lunarDay}-е лунные сутки · «${lunarInfo.symbol}»${range ? ` (${range})` : ''}`,
      lunarDayEssence: lunarInfo.essence,
      planets: (Object.keys(PLANETS) as PlanetKey[]).map(k => `${PLANETS[k].name} в ${SIGN_PREPOSITIONAL[r[k].pSign]}${r[k].retro ? ' ℞' : ''}`),
      retrogrades,
      upcoming,
    },
    favorable: lunarInfo.favorable,
    unfavorable: lunarInfo.unfavorable,
  };
}
