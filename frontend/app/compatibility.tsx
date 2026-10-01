import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '../src/utils/alert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FULL_TAROT_DECK } from '../src/data/tarotCards';
import { calculateDestinyNumber, rootNumber, hasNameLetters, MASTER_NUMBERS } from '../src/data/numerologyKnowledge';

/** Устойчивый код имени: одинаковые имена всегда дают одинаковое число */
function nameCode(name: string): number {
  let hash = 0;
  for (const char of name.trim().toLowerCase()) {
    hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  }
  return hash;
}

/** Разброс 0..9, выведенный из пары имён, вместо случайной добавки */
function nameSpread(name1: string, name2: string): number {
  // >>> 0: XOR в JS возвращает знаковое число, и разброс бывал отрицательным —
  // балл проваливался ниже минимума, а уровень в тексте становился undefined
  return ((nameCode(name1) ^ nameCode(name2)) >>> 0) % 10;
}
import { getDailyAstrology } from '../src/utils/astrology';
import { useSettings } from '../src/contexts/SettingsContext';
import { playComplete, playSelect } from '../src/utils/sound';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface CompatibilityResult {
  name1: string;
  name2: string;
  compatibility_score: number;
  analysis: string;
  created_at: string;
}

/** Число имени по стандартной пифагоровой таблице (общей с нумерологией) */
function calculateNameNumber(name: string): number {
  return calculateDestinyNumber(name);
}

/**
 * Числа делятся на три «семьи», внутри которых совместимость естественная:
 * 1-5-7 (ум, независимость), 2-4-8 (практичность, надёжность),
 * 3-6-9 (чувства, творчество). Мастер-числа сравниваются по корню
 * (11 → 2, 22 → 4, 33 → 6) — раньше 22 сравнивалось с 1–9 как «двадцать два»,
 * и имена вроде Мария или Антон получали 40% почти с кем угодно.
 */
const NUMBER_FAMILIES: Array<{ members: number[]; theme: string }> = [
  { members: [1, 5, 7], theme: 'ума, свободы и независимости' },
  { members: [2, 4, 8], theme: 'практичности, надёжности и опоры' },
  { members: [3, 6, 9], theme: 'чувств, заботы и творчества' },
];

function familyOf(root: number) {
  return NUMBER_FAMILIES.find(f => f.members.includes(root));
}

type PairKind = 'mirror' | 'natural' | 'different';

function pairKind(root1: number, root2: number): PairKind {
  if (root1 === root2) return 'mirror';
  return familyOf(root1) === familyOf(root2) ? 'natural' : 'different';
}

const PAIR_BASE: Record<PairKind, number> = { natural: 88, mirror: 80, different: 64 };

// Генерация анализа совместимости
function generateCompatibilityAnalysis(name1: string, name2: string): CompatibilityResult {
  const num1 = calculateNameNumber(name1);
  const num2 = calculateNameNumber(name2);
  const root1 = rootNumber(num1);
  const root2 = rootNumber(num2);
  const kind = pairKind(root1, root2);

  // Карта закреплена за самим именем и не зависит от того, в какое поле его
  // ввели. Если обоим выпала одна карта, следующую берёт тот, чьё имя дальше
  // по алфавиту — так результат тоже не зависит от порядка
  const deck = FULL_TAROT_DECK;
  let id1 = nameCode(name1) % deck.length;
  let id2 = nameCode(name2) % deck.length;
  if (id1 === id2) {
    if (name1.trim().toLowerCase().localeCompare(name2.trim().toLowerCase(), 'ru') > 0) id1 = (id1 + 1) % deck.length;
    else id2 = (id2 + 1) % deck.length;
  }
  const cards = [deck[id1], deck[id2]];
  const astrology = getDailyAstrology();

  // Мастер-число у кого-то из пары — небольшой бонус к потенциалу союза
  const masterBonus = MASTER_NUMBERS.includes(num1) || MASTER_NUMBERS.includes(num2) ? 4 : 0;

  // Одна и та же пара имён обязана давать один и тот же результат:
  // нумерология детерминирована, поэтому вместо случайной добавки берём
  // устойчивый разброс, выведенный из самих имён (XOR симметричен)
  const spread = nameSpread(name1, name2);
  const score = Math.min(99, PAIR_BASE[kind] + masterBonus + spread);

  const compatibilityLevels = {
    high: ['исключительная гармония', 'глубокая духовная связь', 'идеальное дополнение'],
    medium: ['хороший потенциал', 'взаимное притяжение', 'интересный союз'],
    low: ['возможность для роста', 'уроки друг для друга', 'путь к пониманию'],
  };

  const level = score >= 85 ? 'high' : score >= 70 ? 'medium' : 'low';
  const levelText = compatibilityLevels[level][spread % 3];

  const analysis = `💕 **Анализ совместимости имён**

## ${name1} & ${name2}

**Нумерологическая совместимость: ${score}%** — ${levelText}

---

### 🔢 Нумерология имён

**${name1}** — число имени **${describeNumber(num1)}**
Энергия: ${getNumberMeaning(num1)}

**${name2}** — число имени **${describeNumber(num2)}**
Энергия: ${getNumberMeaning(num2)}

---

### 🎴 Карты Таро для вашей пары

**Карта ${name1}:** ${cards[0].name}
${cards[0].upright_meaning}

**Карта ${name2}:** ${cards[1].name}
${cards[1].upright_meaning}

---

### ✨ Анализ энергий

${getCompatibilityText(kind, root1, root2, name1, name2)}

### 🌙 Космический контекст

Луна в фазе «${astrology.moon.phaseNameRu}» усиливает ${astrology.moon.isWaxing ? 'потенциал новых начинаний в отношениях' : 'глубину эмоциональной связи'}.

---

### 💫 Советы для гармонии

• ${cards[0].keywords[0]} — развивайте это качество вместе
• ${cards[1].keywords[0]} — это ваш общий ресурс
• Уважайте индивидуальность друг друга

---

*Помните: любовь строится день за днём через понимание, терпение и искреннюю заботу друг о друге.* 💖`;

  return {
    name1,
    name2,
    compatibility_score: score,
    analysis,
    created_at: new Date().toISOString(),
  };
}

function describeNumber(num: number): string {
  return MASTER_NUMBERS.includes(num) ? `${num} (мастер-число, корень ${rootNumber(num)})` : String(num);
}

function getNumberMeaning(num: number): string {
  const meanings: { [key: number]: string } = {
    1: 'лидерство, независимость, инициатива',
    2: 'партнёрство, чувствительность, дипломатия',
    3: 'творчество, радость, самовыражение',
    4: 'стабильность, надёжность, труд',
    5: 'свобода, перемены, приключения',
    6: 'любовь, забота, ответственность',
    7: 'мудрость, духовность, анализ',
    8: 'успех, власть, материальное',
    9: 'завершение, мудрость, гуманизм',
    11: 'интуиция, духовное прозрение',
    22: 'мастерство, большие свершения',
    33: 'служение, безусловная любовь',
  };
  return meanings[num] || meanings[rootNumber(num)];
}

function getCompatibilityText(kind: PairKind, root1: number, root2: number, name1: string, name2: string): string {
  if (kind === 'mirror') {
    return `${name1} и ${name2} обладают одинаковой числовой вибрацией (${root1}). Вы понимаете друг друга с полуслова и смотрите на мир похоже — но и слабые стороны у вас общие, поэтому важно не усиливать их вместе.`;
  }
  if (kind === 'natural') {
    return `Числа ${root1} и ${root2} принадлежат одной семье — семье ${familyOf(root1)!.theme}. Это естественная совместимость: у вас схожие ценности и общий ритм жизни, вам легко договариваться.`;
  }
  return `Число ${root1} относится к семье ${familyOf(root1)!.theme}, а ${root2} — к семье ${familyOf(root2)!.theme}. Вы по-разному смотрите на жизнь: это союз, где противоположности дополняют друг друга, но требуют терпения и уважения к чужому способу жить.`;
}

export default function CompatibilityScreen() {
  const router = useRouter();
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const settings = useSettings();

  const analyzeCompatibility = async () => {
    if (!name1.trim() || !name2.trim()) {
      showAlert('Внимание', 'Пожалуйста, введите оба имени');
      return;
    }
    if (!hasNameLetters(name1) || !hasNameLetters(name2)) {
      showAlert('Внимание', 'Имена должны состоять из букв — по ним считается нумерология');
      return;
    }

    setIsLoading(true);
    void playSelect({ soundEnabled: settings.soundEnabled, vibration: settings.vibration, volume: settings.effectsVolume });

    try {
      // Имитация загрузки для UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      const data = generateCompatibilityAnalysis(name1.trim(), name2.trim());
      setResult(data);
      void playComplete({ soundEnabled: settings.soundEnabled, vibration: settings.vibration, volume: settings.effectsVolume });
    } catch (error) {
      console.error('Error analyzing compatibility:', error);
      showAlert('Ошибка', 'Не удалось проанализировать совместимость. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName1('');
    setName2('');
    setResult(null);
  };

  const getCompatibilityColor = (score: number) => {
    // Пороги совпадают с уровнями текста в анализе (85 / 70)
    if (score >= 85) return '#27AE60'; // Green
    if (score >= 70) return '#F39C12'; // Orange
    return '#E67E22'; // Orange-Red
  };

  const getCompatibilityEmoji = (score: number) => {
    if (score >= 92) return '💕';
    if (score >= 85) return '❤️';
    if (score >= 70) return '💛';
    return '🧡';
  };

  if (result) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#0a0a0a', '#1a1a2e', '#16213e', '#8E44AD']}
          style={styles.background}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
              </TouchableOpacity>
              <Text style={styles.title}>Анализ совместимости</Text>
            </View>

            {/* Names */}
            <View style={styles.namesContainer}>
              <Text style={styles.nameText}>{result.name1}</Text>
              <Text style={styles.heartIcon}>💕</Text>
              <Text style={styles.nameText}>{result.name2}</Text>
            </View>

            {/* Compatibility Score */}
            <View style={styles.scoreContainer}>
              <View style={styles.scoreCircle}>
                <LinearGradient
                  colors={[getCompatibilityColor(result.compatibility_score), '#FFF']}
                  style={styles.scoreGradient}
                >
                  <Text style={styles.scoreText}>{result.compatibility_score}%</Text>
                  <Text style={styles.compatibilityEmoji}>
                    {getCompatibilityEmoji(result.compatibility_score)}
                  </Text>
                </LinearGradient>
              </View>
            </View>

            {/* Analysis */}
            <View style={styles.analysisContainer}>
              <Text style={styles.analysisTitle}>✨ Анализ мудрой гадалки</Text>
              <View style={styles.analysisContent}>
                <MarkdownRenderer content={result.analysis} />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={resetForm}
              >
                <LinearGradient
                  colors={['#9B59B6', '#8E44AD']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="refresh" size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>Новый анализ</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/')}
              >
                <LinearGradient
                  colors={['#4ECDC4', '#26A0B4']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="home" size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>На главную</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e', '#8E44AD']}
        style={styles.background}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
              </TouchableOpacity>
              <Text style={styles.title}>Гадание на совместимость</Text>
            </View>

            {/* Hearts decoration */}
            <View style={styles.heartsDecoration}>
              <Text style={styles.heartsText}>💕 💖 💕 💛 💕 💖 💕</Text>
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputTitle}>Введите имена для анализа совместимости</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Первое имя</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Например: Анна"
                  placeholderTextColor="#666"
                  value={name1}
                  onChangeText={setName1}
                  maxLength={50}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Второе имя</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Например: Михаил"
                  placeholderTextColor="#666"
                  value={name2}
                  onChangeText={setName2}
                  maxLength={50}
                />
              </View>
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>💡 О гадании на совместимость:</Text>
              <Text style={styles.infoText}>• Анализ энергетики имен и их взаимодействия</Text>
              <Text style={styles.infoText}>• Нумерологический расчет совместимости</Text>
              <Text style={styles.infoText}>• Астрологические соответствия имен</Text>
              <Text style={styles.infoText}>• Интуитивное толкование мудрой гадалки</Text>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity 
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={analyzeCompatibility}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#666', '#555'] : ['#E74C3C', '#C0392B', '#A93226']}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.submitButtonText}>Анализирую...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="heart" size={20} color="#FFF" style={styles.submitButtonIcon} />
                    <Text style={styles.submitButtonText}>Узнать совместимость</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 15,
    padding: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E8E8E8',
  },
  heartsDecoration: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  heartsText: {
    fontSize: 20,
    opacity: 0.7,
  },
  inputSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E74C3C33',
    padding: 15,
    fontSize: 16,
    color: '#E8E8E8',
  },
  infoContainer: {
    marginHorizontal: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E74C3C33',
  },
  infoTitle: {
    fontSize: 16,
    color: '#E8E8E8',
    fontWeight: '600',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#B8B8B8',
    lineHeight: 20,
    marginBottom: 5,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  submitButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    boxShadow: '0px 4px 8px rgba(231, 76, 60, 0.4)',
  },
  submitButtonDisabled: {
    elevation: 0,
    boxShadow: 'none',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  submitButtonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  // Result screen styles
  namesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E8E8E8',
    textAlign: 'center',
  },
  heartIcon: {
    fontSize: 30,
    marginHorizontal: 15,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  scoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    elevation: 10,
    boxShadow: '0px 5px 10px rgba(0, 0, 0, 0.3)',
  },
  scoreGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  compatibilityEmoji: {
    fontSize: 24,
    marginTop: 5,
  },
  analysisContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 15,
    textAlign: 'center',
  },
  analysisContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E74C3C33',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 15,
  },
  actionButton: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
