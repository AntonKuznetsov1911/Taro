/**
 * Генератор мистических SVG изображений карт Таро
 */

import { TarotCard } from '../data/tarotCards';

// Мистические символы для каждой карты Старших Арканов
const ARCANA_DESIGNS: { [key: string]: { symbol: string; colors: string[]; pattern: string } } = {
  'Дурак': {
    symbol: '∞',
    colors: ['#FFD700', '#87CEEB', '#FFFFFF'],
    pattern: 'spirals'
  },
  'Маг': {
    symbol: '☿',
    colors: ['#9B59B6', '#FFD700', '#E74C3C'],
    pattern: 'infinity'
  },
  'Верховная Жрица': {
    symbol: '☽',
    colors: ['#1a1a4e', '#C0C0C0', '#4169E1'],
    pattern: 'moons'
  },
  'Императрица': {
    symbol: '♀',
    colors: ['#2ECC71', '#F1C40F', '#E91E63'],
    pattern: 'flowers'
  },
  'Император': {
    symbol: '♂',
    colors: ['#E74C3C', '#FFD700', '#8B4513'],
    pattern: 'geometric'
  },
  'Иерофант': {
    symbol: '⛤',
    colors: ['#9B59B6', '#FFD700', '#FFFFFF'],
    pattern: 'keys'
  },
  'Влюблённые': {
    symbol: '❤',
    colors: ['#E91E63', '#FFD700', '#FF6B6B'],
    pattern: 'hearts'
  },
  'Колесница': {
    symbol: '⚡',
    colors: ['#3498DB', '#FFD700', '#C0C0C0'],
    pattern: 'stars'
  },
  'Сила': {
    symbol: '∞',
    colors: ['#F39C12', '#E74C3C', '#FFD700'],
    pattern: 'flames'
  },
  'Отшельник': {
    symbol: '✡',
    colors: ['#34495E', '#F1C40F', '#95A5A6'],
    pattern: 'lantern'
  },
  'Колесо Фортуны': {
    symbol: '☸',
    colors: ['#9B59B6', '#FFD700', '#3498DB'],
    pattern: 'wheel'
  },
  'Справедливость': {
    symbol: '⚖',
    colors: ['#3498DB', '#FFD700', '#FFFFFF'],
    pattern: 'scales'
  },
  'Повешенный': {
    symbol: '⚓',
    colors: ['#1ABC9C', '#9B59B6', '#3498DB'],
    pattern: 'water'
  },
  'Смерть': {
    symbol: '☠',
    colors: ['#2C3E50', '#FFFFFF', '#9B59B6'],
    pattern: 'transformation'
  },
  'Умеренность': {
    symbol: '△',
    colors: ['#1ABC9C', '#FFD700', '#FFFFFF'],
    pattern: 'flow'
  },
  'Дьявол': {
    symbol: '⛧',
    colors: ['#E74C3C', '#2C3E50', '#FFD700'],
    pattern: 'chains'
  },
  'Башня': {
    symbol: '⚡',
    colors: ['#E74C3C', '#F39C12', '#2C3E50'],
    pattern: 'lightning'
  },
  'Звезда': {
    symbol: '★',
    colors: ['#3498DB', '#F1C40F', '#FFFFFF'],
    pattern: 'stars'
  },
  'Луна': {
    symbol: '☾',
    colors: ['#9B59B6', '#C0C0C0', '#1a1a4e'],
    pattern: 'moons'
  },
  'Солнце': {
    symbol: '☀',
    colors: ['#F1C40F', '#F39C12', '#FFFFFF'],
    pattern: 'rays'
  },
  'Суд': {
    symbol: '♆',
    colors: ['#9B59B6', '#FFD700', '#E74C3C'],
    pattern: 'wings'
  },
  'Мир': {
    symbol: '◯',
    colors: ['#2ECC71', '#3498DB', '#FFD700'],
    pattern: 'wreath'
  },
};

/**
 * Генерация мистического SVG для карты Таро
 */
export function generateMysticalTarotSVG(card: TarotCard, isReversed: boolean = false): string {
  const design = ARCANA_DESIGNS[card.name] || {
    symbol: '🔮',
    colors: ['#9B59B6', '#FFD700', '#FFFFFF'],
    pattern: 'default'
  };

  const [primary, secondary, accent] = design.colors;
  const patternSVG = generatePattern(design.pattern, primary, secondary, card.id);

  const svg = `
<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardBg_${card.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a0a2e"/>
      <stop offset="50%" style="stop-color:#16213e"/>
      <stop offset="100%" style="stop-color:#0a0a15"/>
    </linearGradient>
    <linearGradient id="goldBorder_${card.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700"/>
      <stop offset="50%" style="stop-color:#FFA500"/>
      <stop offset="100%" style="stop-color:#FFD700"/>
    </linearGradient>
    <radialGradient id="symbolGlow_${card.id}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${primary};stop-opacity:0.8"/>
      <stop offset="100%" style="stop-color:${primary};stop-opacity:0"/>
    </radialGradient>
    <filter id="glow_${card.id}">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    ${patternSVG}
  </defs>

  <!-- Фон карты -->
  <rect width="200" height="300" fill="url(#cardBg_${card.id})" rx="12"/>

  <!-- Декоративная рамка -->
  <rect x="4" y="4" width="192" height="292" fill="none" stroke="url(#goldBorder_${card.id})" stroke-width="2" rx="10"/>
  <rect x="10" y="10" width="180" height="280" fill="none" stroke="${secondary}" stroke-width="0.5" rx="8" opacity="0.5"/>

  <!-- Угловые украшения -->
  <path d="M20,20 L35,20 L35,25 L25,25 L25,35 L20,35 Z" fill="${secondary}" opacity="0.6"/>
  <path d="M180,20 L165,20 L165,25 L175,25 L175,35 L180,35 Z" fill="${secondary}" opacity="0.6"/>
  <path d="M20,280 L35,280 L35,275 L25,275 L25,265 L20,265 Z" fill="${secondary}" opacity="0.6"/>
  <path d="M180,280 L165,280 L165,275 L175,275 L175,265 L180,265 Z" fill="${secondary}" opacity="0.6"/>

  <!-- Название карты сверху -->
  <text x="100" y="38" font-family="Georgia, serif" font-size="13" font-weight="bold" fill="${secondary}" text-anchor="middle" filter="url(#glow_${card.id})">${card.name}</text>

  <!-- Центральная область с символом -->
  <rect x="25" y="55" width="150" height="170" fill="rgba(0,0,0,0.3)" rx="8"/>
  <rect x="25" y="55" width="150" height="170" fill="url(#pattern_card_${card.id})" rx="8" opacity="0.15"/>

  <!-- Свечение символа -->
  <ellipse cx="100" cy="140" rx="50" ry="50" fill="url(#symbolGlow_${card.id})"/>

  <!-- Главный символ -->
  <text x="100" y="155" font-size="60" fill="${accent}" text-anchor="middle" dominant-baseline="middle" filter="url(#glow_${card.id})">${design.symbol}</text>

  <!-- Римская цифра -->
  <text x="100" y="85" font-family="Georgia, serif" font-size="18" fill="${secondary}" text-anchor="middle" opacity="0.8">${getRomanNumeral(card.id)}</text>

  <!-- Ключевые слова -->
  <text x="100" y="245" font-family="Arial, sans-serif" font-size="8" fill="${accent}" text-anchor="middle" opacity="0.9">${card.keywords.slice(0, 2).join(' • ').toUpperCase()}</text>

  <!-- Тип карты -->
  <text x="100" y="260" font-family="Arial, sans-serif" font-size="7" fill="#888" text-anchor="middle">СТАРШИЙ АРКАН</text>

  <!-- Индикатор перевёрнутости -->
  ${isReversed ? `<text x="100" y="278" font-size="10" fill="${secondary}" text-anchor="middle">⟲ ПЕРЕВЁРНУТАЯ</text>` : ''}

  <!-- Мистические элементы по бокам -->
  <circle cx="20" cy="150" r="3" fill="${primary}" opacity="0.5"/>
  <circle cx="180" cy="150" r="3" fill="${primary}" opacity="0.5"/>
  <circle cx="20" cy="130" r="2" fill="${secondary}" opacity="0.3"/>
  <circle cx="180" cy="130" r="2" fill="${secondary}" opacity="0.3"/>
  <circle cx="20" cy="170" r="2" fill="${secondary}" opacity="0.3"/>
  <circle cx="180" cy="170" r="2" fill="${secondary}" opacity="0.3"/>
</svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

/**
 * Генерация паттерна для фона
 */
function generatePattern(patternType: string, color1: string, color2: string, cardId: number): string {
  const patternId = `pattern_card_${cardId}`;
  const patterns: { [key: string]: string } = {
    stars: `
      <pattern id="${patternId}" width="30" height="30" patternUnits="userSpaceOnUse">
        <polygon points="15,0 18,10 28,10 20,16 23,27 15,20 7,27 10,16 2,10 12,10" fill="${color1}" opacity="0.3"/>
      </pattern>
    `,
    moons: `
      <pattern id="${patternId}" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M20,5 A15,15 0 1,1 20,35 A10,10 0 1,0 20,5" fill="${color2}" opacity="0.2"/>
      </pattern>
    `,
    geometric: `
      <pattern id="${patternId}" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="10" height="10" fill="${color1}" opacity="0.1"/>
        <rect x="10" y="10" width="10" height="10" fill="${color1}" opacity="0.1"/>
      </pattern>
    `,
    spirals: `
      <pattern id="${patternId}" width="50" height="50" patternUnits="userSpaceOnUse">
        <circle cx="25" cy="25" r="20" fill="none" stroke="${color1}" stroke-width="1" opacity="0.2"/>
        <circle cx="25" cy="25" r="15" fill="none" stroke="${color2}" stroke-width="0.5" opacity="0.15"/>
        <circle cx="25" cy="25" r="10" fill="none" stroke="${color1}" stroke-width="0.5" opacity="0.1"/>
      </pattern>
    `,
    default: `
      <pattern id="${patternId}" width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="5" cy="5" r="1" fill="${color1}" opacity="0.2"/>
      </pattern>
    `,
  };

  return patterns[patternType] || patterns.default;
}

/**
 * Конвертация числа в римские цифры
 */
function getRomanNumeral(num: number): string {
  const romanNumerals: [number, string][] = [
    [21, 'XXI'], [20, 'XX'], [19, 'XIX'], [18, 'XVIII'], [17, 'XVII'],
    [16, 'XVI'], [15, 'XV'], [14, 'XIV'], [13, 'XIII'], [12, 'XII'],
    [11, 'XI'], [10, 'X'], [9, 'IX'], [8, 'VIII'], [7, 'VII'],
    [6, 'VI'], [5, 'V'], [4, 'IV'], [3, 'III'], [2, 'II'], [1, 'I'], [0, '0']
  ];

  for (const [value, numeral] of romanNumerals) {
    if (num >= value) return numeral;
  }
  return num.toString();
}

/**
 * Генерация красивой рубашки карты
 */
export function generateMysticalCardBack(): string {
  const svg = `
<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" style="stop-color:#2d1b69"/>
      <stop offset="50%" style="stop-color:#1a0a2e"/>
      <stop offset="100%" style="stop-color:#0a0a15"/>
    </radialGradient>
    <linearGradient id="goldFrame" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700"/>
      <stop offset="50%" style="stop-color:#FFA500"/>
      <stop offset="100%" style="stop-color:#FFD700"/>
    </linearGradient>
    <pattern id="mysticalPattern" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="15" fill="none" stroke="#9B59B6" stroke-width="0.5" opacity="0.3"/>
      <circle cx="20" cy="20" r="8" fill="none" stroke="#FFD700" stroke-width="0.3" opacity="0.2"/>
      <polygon points="20,5 23,15 33,15 25,21 28,31 20,25 12,31 15,21 7,15 17,15" fill="#9B59B6" opacity="0.1"/>
    </pattern>
    <filter id="glowEffect">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="200" height="300" fill="url(#bgGrad)" rx="12"/>
  <rect x="4" y="4" width="192" height="292" fill="none" stroke="url(#goldFrame)" stroke-width="2.5" rx="10"/>
  <rect x="12" y="12" width="176" height="276" fill="none" stroke="#9B59B6" stroke-width="1" rx="8" opacity="0.4"/>

  <rect x="20" y="20" width="160" height="260" fill="url(#mysticalPattern)"/>

  <!-- Центральный символ -->
  <circle cx="100" cy="150" r="55" fill="none" stroke="#9B59B6" stroke-width="2" opacity="0.6"/>
  <circle cx="100" cy="150" r="45" fill="none" stroke="#FFD700" stroke-width="1.5" opacity="0.5"/>
  <circle cx="100" cy="150" r="35" fill="none" stroke="#9B59B6" stroke-width="1" opacity="0.4"/>

  <!-- Пентаграмма -->
  <polygon points="100,100 115,135 145,140 125,160 130,195 100,175 70,195 75,160 55,140 85,135"
           fill="none" stroke="#FFD700" stroke-width="1.5" opacity="0.6" filter="url(#glowEffect)"/>

  <!-- Символ в центре -->
  <text x="100" y="160" font-size="35" fill="#FFD700" text-anchor="middle" dominant-baseline="middle" filter="url(#glowEffect)">🔮</text>

  <!-- Текст -->
  <text x="100" y="40" font-family="Georgia, serif" font-size="16" font-weight="bold" fill="#FFD700" text-anchor="middle" opacity="0.9">✦ ТАРО ✦</text>
  <text x="100" y="275" font-family="Georgia, serif" font-size="10" fill="#9B59B6" text-anchor="middle" opacity="0.7">Мистическая Мудрость</text>

  <!-- Угловые звёзды -->
  <text x="25" y="35" font-size="12" fill="#FFD700" opacity="0.5">✧</text>
  <text x="175" y="35" font-size="12" fill="#FFD700" opacity="0.5">✧</text>
  <text x="25" y="280" font-size="12" fill="#FFD700" opacity="0.5">✧</text>
  <text x="175" y="280" font-size="12" fill="#FFD700" opacity="0.5">✧</text>
</svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}
