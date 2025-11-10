// Offline API - Fallback when backend is unavailable
import { getRandomCards, generateOfflineReading, MAJOR_ARCANA, TarotCard } from '../data/tarotCards';

export interface OfflineReadingResult {
  cards: TarotCard[];
  interpretation: string;
  question?: string;
  timestamp: string;
}

/**
 * Generate offline tarot reading
 */
export async function generateOfflineTarotReading(question?: string, cardCount: number = 3): Promise<OfflineReadingResult> {
  // Simulate API delay for UX
  await new Promise(resolve => setTimeout(resolve, 500));

  const cards = getRandomCards(cardCount);
  const interpretation = generateOfflineReading(cards, question);

  return {
    cards,
    interpretation,
    question,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get offline card back image (SVG placeholder)
 */
export async function getOfflineCardBack(): Promise<string> {
  // Return a simple SVG card back
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cosmicGrad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" style="stop-color:#1a0040;stop-opacity:1" />
          <stop offset="30%" style="stop-color:#2d1b69;stop-opacity:1" />
          <stop offset="70%" style="stop-color:#0f0f23;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#000011;stop-opacity:1" />
        </radialGradient>
      </defs>
      <rect width="200" height="300" fill="url(#cosmicGrad)" rx="18"/>
      <rect x="4" y="4" width="192" height="292" fill="none" stroke="#FFD700" stroke-width="2" rx="15" opacity="0.8"/>
      <circle cx="100" cy="150" r="50" fill="none" stroke="#9B59B6" stroke-width="2"/>
      <text x="100" y="160" font-family="serif" font-size="28" fill="#FFD700" text-anchor="middle">🔮</text>
      <text x="100" y="35" font-family="serif" font-size="16" font-weight="bold" fill="#FFD700" text-anchor="middle" opacity="0.8">✦ T A R O ✦</text>
    </svg>
  `)}`;
}

/**
 * Get all tarot cards (offline)
 */
export async function getOfflineTarotDeck(): Promise<TarotCard[]> {
  return MAJOR_ARCANA;
}

/**
 * Generate offline compatibility reading
 */
export async function generateOfflineCompatibility(name1: string, name2: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 800));

  const cards = getRandomCards(2);

  return `💕 Анализ совместимости: ${name1} и ${name2}

🎴 Карта ${name1}: ${cards[0].name}
${cards[0].upright_meaning}

🎴 Карта ${name2}: ${cards[1].name}
${cards[1].upright_meaning}

✨ Заключение: Эти карты указывают на ${Math.random() > 0.5 ? 'гармоничное взаимодействие' : 'возможность для роста через различия'}. Ваша совместимость зависит от готовности понимать и принимать друг друга.

💫 Совет: Прислушивайтесь к своему сердцу и доверяйте интуиции.`;
}

/**
 * Generate offline horoscope
 */
export async function generateOfflineHoroscope(sign: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 600));

  const card = getRandomCards(1)[0];

  return `🌟 Гороскоп для ${sign}

🎴 Карта дня: ${card.name}
${card.upright_meaning}

✨ Сегодняшний совет: ${card.keywords.join(', ')}

💫 Прогноз: День благоприятствует ${card.keywords[0]}. Обратите внимание на возможности, которые появятся в области ${card.keywords[1]}.`;
}

/**
 * Check if backend is available (simplified)
 */
export async function isBackendAvailable(backendUrl?: string): Promise<boolean> {
  if (!backendUrl) return false;

  try {
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
}
