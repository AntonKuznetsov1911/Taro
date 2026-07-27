// Offline API - Complete offline functionality for GitHub Pages
import { getRandomCards, generateOfflineReading, MAJOR_ARCANA, TarotCard, getCardById } from '../data/tarotCards';

export interface OfflineReadingResult {
  cards: TarotCard[];
  interpretation: string;
  question?: string;
  timestamp: string;
}

/**
 * Generate offline tarot reading with full interpretation
 */
export async function generateOfflineTarotReading(question?: string, cardCount: number = 3): Promise<OfflineReadingResult> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const cards = getRandomCards(cardCount);
  const interpretation = generateDetailedInterpretation(cards, question);

  return {
    cards,
    interpretation,
    question,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate detailed interpretation for cards
 */
function generateDetailedInterpretation(cards: TarotCard[], question?: string): string {
  const positions = cards.length === 1 ? ['Answer'] :
                    cards.length === 3 ? ['Past', 'Present', 'Future'] :
                    ['Situation', 'Challenge', 'Past', 'Future', 'Above', 'Below', 'Advice', 'External', 'Hopes', 'Outcome'];

  let interpretation = `🔮 **Mystic Tarot Reading**\n\n`;

  if (question) {
    interpretation += `*Your question: "${question}"*\n\n`;
  }

  interpretation += `Dear seeker, the cards reveal profound wisdom for your journey...\n\n`;

  cards.forEach((card, index) => {
    const position = positions[index] || `Card ${index + 1}`;
    const isReversed = Math.random() < 0.3;
    const meaning = isReversed ? card.reversed_meaning : card.upright_meaning;

    interpretation += `### ✨ **${position}**: ${card.name}${isReversed ? ' (Reversed)' : ''}\n\n`;
    interpretation += `${meaning}\n\n`;
    interpretation += `*Keywords*: ${card.keywords.join(', ')}\n\n`;
  });

  interpretation += `---\n\n`;
  interpretation += `## 💫 **Summary**\n\n`;
  interpretation += `The cards weave a powerful message for you. Trust your intuition and follow the guidance revealed here. `;
  interpretation += `Remember that you hold the power to shape your destiny.\n\n`;
  interpretation += `*May the stars light your path!* ⭐\n`;

  return interpretation;
}

/**
 * Get offline card back image (SVG)
 */
export async function getOfflineCardBack(): Promise<string> {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cosmicGrad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" style="stop-color:#1a0040;stop-opacity:1" />
          <stop offset="30%" style="stop-color:#2d1b69;stop-opacity:1" />
          <stop offset="70%" style="stop-color:#0f0f23;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#000011;stop-opacity:1" />
        </radialGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#FFA500;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FFD700;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="200" height="300" fill="url(#cosmicGrad)" rx="18"/>
      <rect x="4" y="4" width="192" height="292" fill="none" stroke="url(#goldGrad)" stroke-width="2" rx="15"/>
      <circle cx="100" cy="150" r="50" fill="none" stroke="#9B59B6" stroke-width="2"/>
      <circle cx="100" cy="150" r="35" fill="none" stroke="#BB6BD9" stroke-width="1.5"/>
      <text x="100" y="160" font-family="serif" font-size="32" fill="#FFD700" text-anchor="middle">🔮</text>
      <text x="100" y="35" font-family="serif" font-size="14" font-weight="bold" fill="#FFD700" text-anchor="middle" opacity="0.9">✦ TARO ✦</text>
      <text x="100" y="280" font-family="serif" font-size="10" fill="#9B59B6" text-anchor="middle" opacity="0.7">Mystic Wisdom</text>
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
 * Get single card by ID
 */
export async function getOfflineCardById(id: number): Promise<TarotCard | null> {
  return getCardById(id) || null;
}

/**
 * Generate offline compatibility reading
 */
export async function generateOfflineCompatibility(name1: string, name2: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 800));

  const cards = getRandomCards(2);
  const score = Math.floor(Math.random() * 30) + 65;

  const levelText = score >= 85 ? 'exceptional harmony' :
                    score >= 75 ? 'strong compatibility' :
                    score >= 65 ? 'good potential' : 'opportunity for growth';

  return `💕 **Name Compatibility Analysis**

## ${name1} & ${name2}

**Compatibility Score: ${score}%** - ${levelText}

---

### 🎴 Card for ${name1}: **${cards[0].name}**
${cards[0].upright_meaning}

*This energy represents ${name1}'s contribution to the relationship.*

### 🎴 Card for ${name2}: **${cards[1].name}**
${cards[1].upright_meaning}

*This energy represents ${name2}'s contribution to the relationship.*

---

### ✨ **Analysis**

The cosmic energies of your names create a ${levelText.toLowerCase()} pattern. ${cards[0].name} and ${cards[1].name} together suggest a relationship where both partners can grow and learn from each other.

**Strengths:**
- Complementary energies that balance each other
- Strong foundation for understanding
- Potential for deep emotional connection

**Advice:**
${cards[0].keywords[0]} and ${cards[1].keywords[0]} - embrace these qualities in your connection.

---

💫 *Remember: Love is built day by day through understanding, patience, and genuine care for one another.*`;
}

/**
 * Generate offline horoscope
 */
export async function generateOfflineHoroscope(sign: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 600));

  const card = getRandomCards(1)[0];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const moodRating = Math.floor(Math.random() * 3) + 7;
  const luckyNumbers = Array.from({length: 5}, () => Math.floor(Math.random() * 49) + 1);
  const colors = ['purple', 'gold', 'silver', 'blue', 'green', 'rose'];
  const luckyColor = colors[Math.floor(Math.random() * colors.length)];

  return `🌟 **Daily Horoscope for ${sign}**
*${today}*

---

### 🎴 Card of the Day: **${card.name}**

${card.upright_meaning}

---

### ✨ **Today's Forecast**

**Mood Rating:** ${'⭐'.repeat(moodRating)}${'☆'.repeat(10 - moodRating)} (${moodRating}/10)

The energy of ${card.name} influences your day, bringing themes of ${card.keywords.slice(0, 3).join(', ')}. This is a time to embrace ${card.keywords[0]} in all aspects of your life.

### 💕 **Love & Relationships**
${card.keywords.includes('love') || card.keywords.includes('harmony')
  ? 'Romance is in the air! Express your feelings openly today.'
  : 'Focus on self-love and inner harmony. The right connections will follow.'}

### 💼 **Career & Goals**
${card.keywords.includes('success') || card.keywords.includes('power')
  ? 'Professional success is highlighted. Take bold action on your projects.'
  : 'Patience and planning will serve you well. Build foundations for future success.'}

### 🍀 **Lucky Elements**
- **Numbers:** ${luckyNumbers.join(', ')}
- **Color:** ${luckyColor}
- **Best Time:** ${Math.floor(Math.random() * 12) + 1}:00 ${Math.random() > 0.5 ? 'AM' : 'PM'}

---

💫 *Trust the cosmic guidance and make the most of today's energy!*`;
}

/**
 * Generate offline palmistry reading
 */
export async function generateOfflinePalmistry(question?: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const cards = getRandomCards(3);

  return `🤲 **Palmistry Reading**

*"${question || 'Tell me about my destiny'}"*

---

### 📍 **Life Line**
The Life Line reveals your vitality and major life events. ${cards[0].upright_meaning}

**Key Insight:** Focus on ${cards[0].keywords[0]} to enhance your life energy.

### 💖 **Heart Line**
The Heart Line shows your emotional nature and relationships. ${cards[1].upright_meaning}

**Key Insight:** Embrace ${cards[1].keywords[0]} in matters of the heart.

### 🧠 **Head Line**
The Head Line indicates your mental approach and thinking patterns. ${cards[2].upright_meaning}

**Key Insight:** Apply ${cards[2].keywords[0]} to your decision-making.

---

### ✨ **Overall Guidance**

The lines of your palm tell a story of ${cards.map(c => c.keywords[0]).join(', ')}. Your destiny is written not just in your hand, but in the choices you make each day.

**Practical Advice:**
1. Trust your intuition more
2. Take action on your dreams
3. Maintain balance in all areas of life

---

💫 *The future is yours to shape. The lines are guides, not chains.*`;
}

/**
 * Generate offline runes reading
 */
export async function generateOfflineRunes(question?: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 700));

  const runes = ['ᚠ Fehu', 'ᚢ Uruz', 'ᚦ Thurisaz', 'ᚨ Ansuz', 'ᚱ Raido', 'ᚲ Kenaz',
                 'ᚷ Gebo', 'ᚹ Wunjo', 'ᚺ Hagalaz', 'ᚾ Nauthiz'];
  const selectedRunes = runes.sort(() => Math.random() - 0.5).slice(0, 3);

  return `ᚠ **Runes Reading**

*Question: "${question || 'What guidance do the runes offer?'}"*

---

### Past: **${selectedRunes[0]}**
This rune speaks of foundations laid and lessons learned.

### Present: **${selectedRunes[1]}**
The current energies surrounding your question.

### Future: **${selectedRunes[2]}**
The potential path ahead based on current trajectories.

---

### ✨ **Interpretation**

The ancient Norse wisdom flows through these runes, offering guidance for your journey. The combination suggests a time of transformation and growth.

**Key Message:** Trust in the process of change. What ends creates space for new beginnings.

---

💫 *May the wisdom of the ancestors light your path.*`;
}

/**
 * Generate offline numerology reading
 */
export async function generateOfflineNumerology(birthDate: string, name?: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 600));

  // Calculate simple life path number
  const digits = birthDate.replace(/\D/g, '').split('').map(Number);
  let lifePathNumber = digits.reduce((a, b) => a + b, 0);
  while (lifePathNumber > 9 && lifePathNumber !== 11 && lifePathNumber !== 22) {
    lifePathNumber = String(lifePathNumber).split('').map(Number).reduce((a, b) => a + b, 0);
  }

  const meanings: { [key: number]: string } = {
    1: 'Leadership, independence, originality',
    2: 'Partnership, diplomacy, sensitivity',
    3: 'Creativity, expression, joy',
    4: 'Stability, discipline, hard work',
    5: 'Freedom, adventure, change',
    6: 'Responsibility, love, nurturing',
    7: 'Spirituality, analysis, wisdom',
    8: 'Power, abundance, success',
    9: 'Humanitarianism, completion, wisdom',
    11: 'Intuition, spiritual insight, illumination',
    22: 'Master builder, vision, practical idealism',
  };

  return `🔢 **Numerology Reading**${name ? ` for ${name}` : ''}

*Birth Date: ${birthDate}*

---

### 🌟 **Your Life Path Number: ${lifePathNumber}**

**Core Meaning:** ${meanings[lifePathNumber] || 'Unique spiritual path'}

${lifePathNumber === 11 || lifePathNumber === 22 ?
`⚡ *Master Number Alert!* You carry the heightened vibration of a Master Number, indicating special life purpose and potential.` : ''}

---

### ✨ **Detailed Analysis**

**Strengths:**
Life Path ${lifePathNumber} individuals are naturally gifted in ${meanings[lifePathNumber]?.split(', ').slice(0, 2).join(' and ') || 'unique abilities'}.

**Challenges:**
Growth comes through balancing ${lifePathNumber === 1 ? 'independence with cooperation' :
lifePathNumber === 2 ? 'others\' needs with your own' :
'your natural gifts with practical application'}.

**Life Purpose:**
Your soul chose this path to learn and embody ${meanings[lifePathNumber]?.split(', ')[0] || 'your unique gifts'}.

---

### 💫 **Personal Year Energy**

Based on current cosmic cycles, this is a year for ${lifePathNumber % 2 === 0 ? 'building and consolidating' : 'initiating and expanding'}.

---

💫 *Your numbers tell a story of infinite potential. Live your truth!*`;
}

/**
 * Check if backend is available
 */
export async function isBackendAvailable(backendUrl?: string): Promise<boolean> {
  if (!backendUrl) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}
