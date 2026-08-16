import React, { useMemo } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { CosmicBackground } from './CosmicBackground';
import { ONBOARDING_WELCOME_IMAGE } from '../src/utils/onboardingWelcomeImage';

/**
 * Мистическая иллюстрация приветственного экрана онбординга.
 * Всё нарисовано кодом (SVG + градиенты), картинок и сети не требуется:
 * приложение полностью офлайновое.
 *
 * WelcomeBackdrop — полноэкранный фон: ночное небо, фиолетово-индиговая
 * туманность, тёплая золотая дымка внизу, звёзды с бликами, бархатные
 * портьеры по нижним углам и две рубашки карт Таро.
 * CrystalOrb — центральная композиция: хрустальный шар с галактикой
 * на золотой резной подставке и золотые ауры-дуги за ним.
 */

// ─── детерминированный «случай»: звёзды не должны прыгать при перерисовке ───
const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const SKY_W = 390;
const SKY_H = 844;

/** Четырёхлучевой блик — вогнутая «искра» */
const sparklePath = (cx: number, cy: number, r: number) => {
  const k = r * 0.13;
  return (
    `M${cx} ${cy - r}` +
    `C${cx + k} ${cy - k} ${cx + k} ${cy - k} ${cx + r} ${cy}` +
    `C${cx + k} ${cy + k} ${cx + k} ${cy + k} ${cx} ${cy + r}` +
    `C${cx - k} ${cy + k} ${cx - k} ${cy + k} ${cx - r} ${cy}` +
    `C${cx - k} ${cy - k} ${cx - k} ${cy - k} ${cx} ${cy - r}Z`
  );
};

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

/** Дуга окружности от угла a0 к a1 (градусы, 0 — вправо, по часовой) */
const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${p0.x.toFixed(1)} ${p0.y.toFixed(1)}A${r} ${r} 0 ${large} 1 ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
};

// ────────────────────────────── ФОН ──────────────────────────────

type Star = { x: number; y: number; r: number; o: number };

const useStars = () =>
  useMemo(() => {
    const rnd = mulberry32(20240816);
    const stars: Star[] = [];
    for (let i = 0; i < 130; i++) {
      const x = rnd() * SKY_W;
      // ближе к середине экрана звёзды ярче и крупнее
      const y = rnd() * SKY_H;
      const centerPull = 1 - Math.min(1, Math.abs(y - SKY_H * 0.34) / (SKY_H * 0.55));
      stars.push({
        x,
        y,
        r: 0.5 + rnd() * 1.3 + centerPull * 0.7,
        o: 0.25 + rnd() * 0.45 + centerPull * 0.3,
      });
    }
    return stars;
  }, []);

const SPARKLES: Array<{ x: number; y: number; r: number; o: number }> = [
  { x: 58, y: 108, r: 9, o: 0.85 },
  { x: 322, y: 152, r: 11, o: 0.9 },
  { x: 96, y: 300, r: 7, o: 0.7 },
  { x: 340, y: 330, r: 8, o: 0.75 },
  { x: 40, y: 214, r: 6, o: 0.6 },
  { x: 288, y: 62, r: 6.5, o: 0.65 },
  { x: 196, y: 46, r: 7.5, o: 0.7 },
  { x: 148, y: 560, r: 6, o: 0.45 },
  { x: 262, y: 600, r: 5.5, o: 0.4 },
];

/** Рубашка карты Таро: тёмное поле, золотая рамка и звёздный вензель */
const TarotCardBack: React.FC<{ x: number; y: number; rotate: number; opacity?: number }> = ({
  x,
  y,
  rotate,
  opacity = 1,
}) => (
  <G transform={`translate(${x} ${y}) rotate(${rotate})`} opacity={opacity}>
    <Rect x={-43} y={-65} width={86} height={130} rx={9} fill="#150A2C" />
    <Rect x={-43} y={-65} width={86} height={130} rx={9} fill="url(#gCardFace)" />
    <Rect
      x={-43}
      y={-65}
      width={86}
      height={130}
      rx={9}
      fill="none"
      stroke="url(#gGoldV)"
      strokeWidth={2}
    />
    <Rect
      x={-36}
      y={-58}
      width={72}
      height={116}
      rx={6}
      fill="none"
      stroke="#D9AE5C"
      strokeOpacity={0.55}
      strokeWidth={1}
    />
    <Circle cx={0} cy={0} r={20} fill="none" stroke="#E7C271" strokeOpacity={0.7} strokeWidth={1.2} />
    <Circle cx={0} cy={0} r={13} fill="none" stroke="#E7C271" strokeOpacity={0.4} strokeWidth={0.8} />
    <Path d={sparklePath(0, 0, 15)} fill="#F3D68C" opacity={0.9} />
    <Path d={sparklePath(0, -42, 6)} fill="#E7C271" opacity={0.65} />
    <Path d={sparklePath(0, 42, 6)} fill="#E7C271" opacity={0.65} />
    <Circle cx={-24} cy={-24} r={2} fill="#E7C271" opacity={0.6} />
    <Circle cx={24} cy={-24} r={2} fill="#E7C271" opacity={0.6} />
    <Circle cx={-24} cy={24} r={2} fill="#E7C271" opacity={0.6} />
    <Circle cx={24} cy={24} r={2} fill="#E7C271" opacity={0.6} />
  </G>
);

export const WelcomeBackdrop: React.FC = () => {
  const stars = useStars();

  // Пользователь положил assets/onboarding-welcome.png — картинка на весь экран
  // вместо нарисованного неба; сверху тёмная вуаль ради читаемости текста.
  // Файла нет — сюда мы просто не попадаем (см. onboardingWelcomeImage.ts).
  if (ONBOARDING_WELCOME_IMAGE) {
    return (
      <View style={styles.backdrop} pointerEvents="none">
        <Image
          source={ONBOARDING_WELCOME_IMAGE}
          style={StyleSheet.absoluteFill as any}
          resizeMode="cover"
        />
        {/* Тёмная вуаль поверх фото, чтобы текст оставался читаемым */}
        <LinearGradient
          colors={['rgba(4,2,10,0.72)', 'rgba(4,2,10,0.45)', 'rgba(4,2,10,0.78)']}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill as any}
        />
      </View>
    );
  }

  return (
    <View style={styles.backdrop} pointerEvents="none">
      {/* Базовая звёздная пыль — общий для всего приложения мерцающий фон */}
      <CosmicBackground />

      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SKY_W} ${SKY_H}`}
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFill as any}
      >
        <Defs>
          <RadialGradient id="gViolet" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#B06BFF" stopOpacity="0.55" />
            <Stop offset="0.45" stopColor="#6E2FC4" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#2A0E52" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="gIndigo" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#5A6BFF" stopOpacity="0.42" />
            <Stop offset="0.5" stopColor="#33308F" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#101038" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="gMagenta" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#E256B4" stopOpacity="0.32" />
            <Stop offset="0.5" stopColor="#8A2374" stopOpacity="0.16" />
            <Stop offset="1" stopColor="#5A1049" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="gGoldHaze" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFCE7A" stopOpacity="0.55" />
            <Stop offset="0.45" stopColor="#C8802E" stopOpacity="0.26" />
            <Stop offset="1" stopColor="#3A1E08" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="gVignette" cx="50%" cy="50%" r="50%">
            <Stop offset="0.45" stopColor="#000000" stopOpacity="0" />
            <Stop offset="0.78" stopColor="#020106" stopOpacity="0.45" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0.92" />
          </RadialGradient>
          <SvgLinearGradient id="gVelvet" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#5B2288" stopOpacity="0.95" />
            <Stop offset="0.45" stopColor="#33124F" />
            <Stop offset="1" stopColor="#120522" />
          </SvgLinearGradient>
          <SvgLinearGradient id="gGoldV" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFF2C8" />
            <Stop offset="0.4" stopColor="#E7C271" />
            <Stop offset="1" stopColor="#8C6420" />
          </SvgLinearGradient>
          <SvgLinearGradient id="gCardFace" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#3A1C6B" />
            <Stop offset="0.55" stopColor="#1E0E3E" />
            <Stop offset="1" stopColor="#0D0520" />
          </SvgLinearGradient>
        </Defs>

        {/* Туманности */}
        <Ellipse cx={195} cy={250} rx={255} ry={225} fill="url(#gViolet)" />
        <Ellipse cx={92} cy={188} rx={185} ry={165} fill="url(#gIndigo)" />
        <Ellipse cx={312} cy={300} rx={175} ry={150} fill="url(#gMagenta)" />
        <Ellipse cx={195} cy={470} rx={240} ry={150} fill="url(#gViolet)" opacity={0.55} />
        <Ellipse cx={195} cy={660} rx={310} ry={215} fill="url(#gGoldHaze)" />
        <Ellipse cx={195} cy={720} rx={200} ry={130} fill="url(#gGoldHaze)" opacity={0.7} />
        <Ellipse cx={80} cy={620} rx={150} ry={110} fill="url(#gMagenta)" opacity={0.5} />

        {/* Звёзды */}
        {stars.map((s, i) => (
          <Circle key={`s${i}`} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={s.o} />
        ))}

        {/* Крупные блики с четырьмя лучами */}
        {SPARKLES.map((s, i) => (
          <G key={`sp${i}`} opacity={s.o}>
            <Circle cx={s.x} cy={s.y} r={s.r * 1.6} fill="#FFE9B8" opacity={0.12} />
            <Path d={sparklePath(s.x, s.y, s.r * 2.1)} fill="#FFF6DC" opacity={0.35} />
            <Path d={sparklePath(s.x, s.y, s.r)} fill="#FFFFFF" />
          </G>
        ))}

        {/* Виньетка: к краям почти чёрное небо */}
        <Rect x={0} y={0} width={SKY_W} height={SKY_H} fill="url(#gVignette)" />

        {/* Тёплая золотая дымка внизу — поверх виньетки, чтобы она её не съела */}
        <Ellipse cx={195} cy={648} rx={330} ry={215} fill="url(#gGoldHaze)" opacity={0.75} />
        <Ellipse cx={195} cy={712} rx={210} ry={120} fill="url(#gGoldHaze)" opacity={0.55} />
        <Ellipse cx={195} cy={430} rx={220} ry={140} fill="url(#gMagenta)" opacity={0.45} />

        {/* Бархатные портьеры по нижним углам: складки разной глубины */}
        <G opacity={0.97}>
          {/* левая */}
          <Path d="M0 560 C48 596 92 676 88 764 C86 810 62 828 46 844 L0 844 Z" fill="url(#gVelvet)" />
          <Path
            d="M0 592 C36 626 70 692 68 762 C67 806 48 826 34 844 L0 844 Z"
            fill="#3D1660"
            opacity={0.85}
          />
          <Path
            d="M0 628 C24 660 46 714 45 770 C44 810 30 830 20 844 L0 844 Z"
            fill="#20093A"
            opacity={0.9}
          />
          <Path d="M0 686 C14 712 24 756 22 800 C21 822 14 836 10 844 L0 844 Z" fill="#120522" />
          <Path
            d="M12 596 C46 632 76 700 72 776"
            stroke="#A85FE0"
            strokeOpacity={0.28}
            strokeWidth={4}
            fill="none"
          />
          <Path
            d="M2 648 C24 680 42 726 40 786"
            stroke="#8E45C8"
            strokeOpacity={0.2}
            strokeWidth={3}
            fill="none"
          />
          {/* правая */}
          <Path
            d="M390 560 C342 596 298 676 302 764 C304 810 328 828 344 844 L390 844 Z"
            fill="url(#gVelvet)"
          />
          <Path
            d="M390 592 C354 626 320 692 322 762 C323 806 342 826 356 844 L390 844 Z"
            fill="#3D1660"
            opacity={0.85}
          />
          <Path
            d="M390 628 C366 660 344 714 345 770 C346 810 360 830 370 844 L390 844 Z"
            fill="#20093A"
            opacity={0.9}
          />
          <Path
            d="M390 686 C376 712 366 756 368 800 C369 822 376 836 380 844 L390 844 Z"
            fill="#120522"
          />
          <Path
            d="M378 596 C344 632 314 700 318 776"
            stroke="#A85FE0"
            strokeOpacity={0.28}
            strokeWidth={4}
            fill="none"
          />
          <Path
            d="M388 648 C366 680 348 726 350 786"
            stroke="#8E45C8"
            strokeOpacity={0.2}
            strokeWidth={3}
            fill="none"
          />
        </G>

        {/* Две рубашки карт Таро «лежат» внизу */}
        <TarotCardBack x={46} y={744} rotate={-19} opacity={0.95} />
        <TarotCardBack x={346} y={756} rotate={16} opacity={0.95} />

        {/* Мягкое затемнение по краям */}
        <Rect x={0} y={0} width={SKY_W} height={SKY_H} fill="url(#gVignette)" opacity={0.35} />
      </Svg>

      {/* Ещё немного контраста под подписями */}
      <LinearGradient
        colors={['rgba(4,2,12,0)', 'rgba(5,2,14,0.22)', 'rgba(4,2,10,0.34)']}
        locations={[0.34, 0.7, 1]}
        style={StyleSheet.absoluteFill as any}
      />
    </View>
  );
};

// ─────────────────────── ХРУСТАЛЬНЫЙ ШАР ───────────────────────

const ORB_W = 300;
const ORB_H = 372;
const BALL_CX = 150;
const BALL_CY = 150;
const BALL_R = 76;

/** Логарифмический рукав галактики (сплюснут по вертикали) */
const spiralArm = (startDeg: number, turns: number, maxR: number, flatten: number) => {
  const steps = 64;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const theta = ((startDeg * Math.PI) / 180) + t * turns * Math.PI * 2;
    const r = maxR * Math.pow(t, 0.6);
    const x = Math.cos(theta) * r;
    const y = Math.sin(theta) * r * flatten;
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
};

const useGalaxyDust = () =>
  useMemo(() => {
    const rnd = mulberry32(778899);
    const dust: Array<{ x: number; y: number; r: number; o: number }> = [];
    for (let i = 0; i < 60; i++) {
      const ang = rnd() * Math.PI * 2;
      const rad = Math.pow(rnd(), 0.55) * 68;
      dust.push({
        x: Math.cos(ang) * rad,
        y: Math.sin(ang) * rad * 0.72,
        r: 0.4 + rnd() * 1.1,
        o: 0.25 + rnd() * 0.6,
      });
    }
    return dust;
  }, []);

export const CrystalOrb: React.FC = () => {
  const dust = useGalaxyDust();

  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${ORB_W} ${ORB_H}`} style={styles.orbSvg}>
      <Defs>
        <RadialGradient id="oHalo" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#C79BFF" stopOpacity="0.5" />
          <Stop offset="0.45" stopColor="#7B44C8" stopOpacity="0.22" />
          <Stop offset="1" stopColor="#2A0E52" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="oBody" cx="38%" cy="32%" r="72%">
          <Stop offset="0" stopColor="#452A7C" />
          <Stop offset="0.55" stopColor="#22143F" />
          <Stop offset="1" stopColor="#150B2C" />
        </RadialGradient>
        <RadialGradient id="oDisc" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#C9A6FF" stopOpacity="0.55" />
          <Stop offset="0.5" stopColor="#6A46C8" stopOpacity="0.3" />
          <Stop offset="1" stopColor="#2B1560" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="oCore" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <Stop offset="0.28" stopColor="#FFF2C4" stopOpacity="0.95" />
          <Stop offset="0.6" stopColor="#E6A6FF" stopOpacity="0.5" />
          <Stop offset="1" stopColor="#8A5CD8" stopOpacity="0" />
        </RadialGradient>
        <SvgLinearGradient id="oGlass" x1="0.2" y1="0" x2="0.8" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
          <Stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0.05" />
          <Stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0" />
          <Stop offset="1" stopColor="#D9C2FF" stopOpacity="0.12" />
        </SvgLinearGradient>
        <SvgLinearGradient
          id="oGold"
          x1="88"
          y1="0"
          x2="212"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#6E4A12" />
          <Stop offset="0.16" stopColor="#B98A33" />
          <Stop offset="0.34" stopColor="#FFF3C9" />
          <Stop offset="0.55" stopColor="#E2B75F" />
          <Stop offset="0.8" stopColor="#9C7326" />
          <Stop offset="1" stopColor="#5E3F0E" />
        </SvgLinearGradient>
        <SvgLinearGradient
          id="oGoldSoft"
          x1="100"
          y1="0"
          x2="200"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#8A6420" />
          <Stop offset="0.4" stopColor="#F5DFA0" />
          <Stop offset="1" stopColor="#7A5518" />
        </SvgLinearGradient>
        <RadialGradient id="oWarm" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFCE7A" stopOpacity="0.4" />
          <Stop offset="0.5" stopColor="#D08A32" stopOpacity="0.16" />
          <Stop offset="1" stopColor="#3A1E08" stopOpacity="0" />
        </RadialGradient>
        <ClipPath id="oClip">
          <Circle cx={BALL_CX} cy={BALL_CY} r={BALL_R - 1} />
        </ClipPath>
      </Defs>

      {/* Золотые дуги-ауры, расходящиеся за шаром */}
      <G stroke="#E7C271" fill="none" strokeLinecap="round">
        <Path d={arcPath(BALL_CX, BALL_CY, 96, 196, 344)} strokeOpacity={0.3} strokeWidth={1.3} />
        <Path d={arcPath(BALL_CX, BALL_CY, 114, 190, 350)} strokeOpacity={0.22} strokeWidth={1.1} />
        <Path d={arcPath(BALL_CX, BALL_CY, 132, 184, 356)} strokeOpacity={0.15} strokeWidth={1} />
        <Path d={arcPath(BALL_CX, BALL_CY, 148, 200, 340)} strokeOpacity={0.1} strokeWidth={0.9} />
        <Path d={arcPath(BALL_CX, BALL_CY, 104, 20, 62)} strokeOpacity={0.16} strokeWidth={1} />
        <Path d={arcPath(BALL_CX, BALL_CY, 104, 118, 160)} strokeOpacity={0.16} strokeWidth={1} />
        <Path d={arcPath(BALL_CX, BALL_CY, 124, 14, 56)} strokeOpacity={0.1} strokeWidth={0.9} />
        <Path d={arcPath(BALL_CX, BALL_CY, 124, 124, 166)} strokeOpacity={0.1} strokeWidth={0.9} />
      </G>
      {/* Короткие лучи */}
      <G stroke="#F0D089" strokeOpacity={0.16} strokeWidth={1} strokeLinecap="round">
        {[200, 215, 230, 250, 270, 290, 310, 325, 340].map((a) => {
          const p0 = polar(BALL_CX, BALL_CY, 156, a);
          const p1 = polar(BALL_CX, BALL_CY, 176, a);
          return (
            <Path
              key={`ray${a}`}
              d={`M${p0.x.toFixed(1)} ${p0.y.toFixed(1)}L${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`}
            />
          );
        })}
      </G>

      {/* Свечение вокруг шара */}
      <Circle cx={BALL_CX} cy={BALL_CY} r={124} fill="url(#oHalo)" />

      {/* Стекло шара */}
      <Circle cx={BALL_CX} cy={BALL_CY} r={BALL_R} fill="url(#oBody)" />

      {/* Галактика внутри */}
      <G clipPath="url(#oClip)">
        <G transform={`translate(${BALL_CX} ${BALL_CY}) rotate(-22)`}>
          <Ellipse cx={0} cy={0} rx={72} ry={40} fill="url(#oDisc)" />
          {/* рукава */}
          <G fill="none" strokeLinecap="round">
            <Path d={spiralArm(0, 1.15, 68, 0.56)} stroke="#7C5CE0" strokeOpacity={0.5} strokeWidth={12} />
            <Path d={spiralArm(180, 1.15, 68, 0.56)} stroke="#7C5CE0" strokeOpacity={0.5} strokeWidth={12} />
            <Path d={spiralArm(0, 1.15, 68, 0.56)} stroke="#C3AAFF" strokeOpacity={0.6} strokeWidth={5} />
            <Path d={spiralArm(180, 1.15, 68, 0.56)} stroke="#9FC4FF" strokeOpacity={0.6} strokeWidth={5} />
            <Path d={spiralArm(90, 0.95, 54, 0.56)} stroke="#5E86E8" strokeOpacity={0.32} strokeWidth={7} />
            <Path d={spiralArm(270, 0.95, 54, 0.56)} stroke="#8E63E8" strokeOpacity={0.32} strokeWidth={7} />
          </G>
          {/* звёздная пыль */}
          {dust.map((d, i) => (
            <Circle key={`d${i}`} cx={d.x} cy={d.y} r={d.r} fill="#FFFFFF" opacity={d.o} />
          ))}
          {/* ядро */}
          <Ellipse cx={0} cy={0} rx={34} ry={20} fill="url(#oCore)" />
          <Ellipse cx={0} cy={0} rx={14} ry={8} fill="#FFFDF2" opacity={0.95} />
        </G>
        {/* блик стекла поверх содержимого */}
        <Circle cx={BALL_CX} cy={BALL_CY} r={BALL_R} fill="url(#oGlass)" />
        <Ellipse
          cx={116}
          cy={112}
          rx={30}
          ry={17}
          fill="#FFFFFF"
          opacity={0.14}
          transform="rotate(-38 116 112)"
        />
        <Ellipse
          cx={112}
          cy={104}
          rx={11}
          ry={6}
          fill="#FFFFFF"
          opacity={0.4}
          transform="rotate(-38 112 104)"
        />
        <Path
          d={arcPath(BALL_CX, BALL_CY, 62, 40, 105)}
          stroke="#FFFFFF"
          strokeOpacity={0.16}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
      </G>

      {/* Кромка стекла: наружное свечение + светлый ободок */}
      <Circle
        cx={BALL_CX}
        cy={BALL_CY}
        r={BALL_R + 3}
        fill="none"
        stroke="#B98CF5"
        strokeOpacity={0.22}
        strokeWidth={7}
      />
      <Circle
        cx={BALL_CX}
        cy={BALL_CY}
        r={BALL_R}
        fill="none"
        stroke="#EFE4FF"
        strokeOpacity={0.45}
        strokeWidth={1.8}
      />
      <Path
        d={arcPath(BALL_CX, BALL_CY, BALL_R - 3, 30, 150)}
        fill="none"
        stroke="#C9A6FF"
        strokeOpacity={0.38}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Path
        d={arcPath(BALL_CX, BALL_CY, BALL_R - 2, 210, 330)}
        fill="none"
        stroke="#E9DBFF"
        strokeOpacity={0.22}
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* тёплое сияние под подставкой */}
      <Ellipse cx={150} cy={352} rx={120} ry={30} fill="url(#oWarm)" />

      {/* ── Резная золотая подставка ── */}
      {/* завитки, обнимающие нижнюю часть шара */}
      <Path d="M122 238 C100 228 90 208 100 196 C98 212 112 226 138 234 Z" fill="url(#oGoldSoft)" />
      <Path d="M178 238 C200 228 210 208 200 196 C202 212 188 226 162 234 Z" fill="url(#oGoldSoft)" />
      <Circle cx={100} cy={197} r={4.4} fill="url(#oGoldSoft)" />
      <Circle cx={200} cy={197} r={4.4} fill="url(#oGoldSoft)" />
      <Circle cx={100} cy={197} r={1.7} fill="#5E3F0E" opacity={0.6} />
      <Circle cx={200} cy={197} r={1.7} fill="#5E3F0E" opacity={0.6} />
      <Path
        d="M106 206 C104 216 112 226 124 231"
        stroke="#FFF6D8"
        strokeOpacity={0.4}
        strokeWidth={1.4}
        fill="none"
      />
      {/* чаша, в которой лежит шар */}
      <Path
        d="M112 222 C114 254 130 276 150 276 C170 276 186 254 188 222 C186 236 170 244 150 244 C130 244 114 236 112 222 Z"
        fill="url(#oGold)"
      />
      <Path
        d="M120 236 C124 258 136 270 149 272"
        stroke="#FFF6D8"
        strokeOpacity={0.45}
        strokeWidth={2}
        fill="none"
      />
      <Path
        d="M114 226 C122 238 134 244 150 244"
        stroke="#FFF6D8"
        strokeOpacity={0.35}
        strokeWidth={1.3}
        fill="none"
      />
      {/* центральный завиток спереди */}
      <Path d="M150 246 C141 238 139 226 150 218 C161 226 159 238 150 246 Z" fill="url(#oGoldSoft)" />
      {/* стержень */}
      <Path
        d="M138 272 L162 272 C160 284 160 294 162 304 L138 304 C140 294 140 284 138 272 Z"
        fill="url(#oGold)"
      />
      <Ellipse cx={150} cy={288} rx={20} ry={8} fill="url(#oGold)" />
      <Ellipse cx={150} cy={286} rx={12} ry={4} fill="#FFF3C9" opacity={0.35} />
      {/* расширяющееся основание */}
      <Path
        d="M126 304 C124 316 114 328 102 334 L198 334 C186 328 176 316 174 304 Z"
        fill="url(#oGold)"
      />
      <Path
        d="M90 334 L210 334 C217 338 217 352 208 356 L92 356 C83 352 83 338 90 334 Z"
        fill="url(#oGold)"
      />
      <Ellipse cx={150} cy={358} rx={60} ry={7} fill="#6E4A12" opacity={0.85} />
      <Ellipse cx={150} cy={355} rx={56} ry={5} fill="#F0D89A" opacity={0.3} />
      {/* мелкий орнамент */}
      <Circle cx={122} cy={345} r={3.2} fill="#FFF3C9" opacity={0.55} />
      <Circle cx={150} cy={345} r={3.8} fill="#FFF3C9" opacity={0.65} />
      <Circle cx={178} cy={345} r={3.2} fill="#FFF3C9" opacity={0.55} />
      <Path d={sparklePath(150, 320, 6.5)} fill="#FFF6DC" opacity={0.5} />
    </Svg>
  );
};

// ─────────────────────── ЗОЛОТЫЕ ИКОНКИ ───────────────────────

export type GoldIconName = 'moon' | 'star' | 'candle';

export const GoldIcon: React.FC<{ name: GoldIconName; size?: number }> = ({ name, size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Defs>
      <SvgLinearGradient id="iGold" x1="0" y1="0" x2="0.4" y2="1">
        <Stop offset="0" stopColor="#FFF6D8" />
        <Stop offset="0.45" stopColor="#F0CE7E" />
        <Stop offset="1" stopColor="#C08F32" />
      </SvgLinearGradient>
      <RadialGradient id="iGlow" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor="#FFD98A" stopOpacity="0.45" />
        <Stop offset="1" stopColor="#FFB347" stopOpacity="0" />
      </RadialGradient>
      <SvgLinearGradient id="iFlame" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFF9E0" />
        <Stop offset="0.5" stopColor="#FFD277" />
        <Stop offset="1" stopColor="#E88A22" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx={16} cy={16} r={16} fill="url(#iGlow)" />
    {name === 'moon' && (
      <Path
        d="M20.5 4.6 A12 12 0 1 0 20.5 27.4 A9.6 9.6 0 1 1 20.5 4.6 Z"
        fill="url(#iGold)"
      />
    )}
    {name === 'star' && (
      <G>
        <Path d={sparklePath(16, 16, 13)} fill="url(#iGold)" />
        <G transform="rotate(45 16 16)">
          <Path d={sparklePath(16, 16, 6.5)} fill="#FFF3C9" opacity={0.7} />
        </G>
        <Circle cx={16} cy={16} r={2.4} fill="#FFFDF2" />
      </G>
    )}
    {name === 'candle' && (
      <G>
        <Path
          d="M12.6 14.5 L19.4 14.5 C20.1 14.5 20.5 15 20.5 15.7 L20.5 27.5 C20.5 28.3 20 28.8 19.3 28.8 L12.7 28.8 C12 28.8 11.5 28.3 11.5 27.5 L11.5 15.7 C11.5 15 11.9 14.5 12.6 14.5 Z"
          fill="url(#iGold)"
        />
        <Path d="M14.2 17 L14.2 27" stroke="#8A6420" strokeOpacity={0.4} strokeWidth={1.2} />
        <Path d="M16 12.2 L16 14.6" stroke="#8A6420" strokeWidth={1.3} />
        <Path
          d="M16 2.4 C20.2 7 21.4 9.4 21.4 11.6 C21.4 14.6 19 16.6 16 16.6 C13 16.6 10.6 14.6 10.6 11.6 C10.6 9.4 11.8 7 16 2.4 Z"
          fill="url(#iFlame)"
        />
        <Path
          d="M16 6.6 C18.2 9.2 18.8 10.6 18.8 11.9 C18.8 13.5 17.6 14.6 16 14.6 C14.4 14.6 13.2 13.5 13.2 11.9 C13.2 10.6 13.8 9.2 16 6.6 Z"
          fill="#FFFBEC"
          opacity={0.75}
        />
      </G>
    )}
  </Svg>
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orbSvg: {
    ...(Platform.OS === 'web' ? ({ filter: 'drop-shadow(0 10px 26px rgba(120,60,200,0.35))' } as any) : null),
  },
});
