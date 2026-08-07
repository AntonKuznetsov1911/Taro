import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getRandomCards } from '../src/data/tarotCards';
import { getDailyAstrology } from '../src/utils/astrology';

interface CompatibilityResult {
  name1: string;
  name2: string;
  compatibility_score: number;
  analysis: string;
  created_at: string;
}

// Расчет нумерологического числа имени
function calculateNameNumber(name: string): number {
  const letterValues: { [key: string]: number } = {
    'а': 1, 'б': 2, 'в': 3, 'г': 4, 'д': 5, 'е': 6, 'ё': 7, 'ж': 8, 'з': 9,
    'и': 1, 'й': 2, 'к': 3, 'л': 4, 'м': 5, 'н': 6, 'о': 7, 'п': 8, 'р': 9,
    'с': 1, 'т': 2, 'у': 3, 'ф': 4, 'х': 5, 'ц': 6, 'ч': 7, 'ш': 8, 'щ': 9,
    'ъ': 1, 'ы': 2, 'ь': 3, 'э': 4, 'ю': 5, 'я': 6,
    'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9,
    'j': 1, 'k': 2, 'l': 3, 'm': 4, 'n': 5, 'o': 6, 'p': 7, 'q': 8, 'r': 9,
    's': 1, 't': 2, 'u': 3, 'v': 4, 'w': 5, 'x': 6, 'y': 7, 'z': 8,
  };

  let sum = 0;
  for (const char of name.toLowerCase()) {
    sum += letterValues[char] || 0;
  }

  while (sum > 9 && sum !== 11 && sum !== 22) {
    sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0);
  }

  return sum;
}

// Генерация анализа совместимости
function generateCompatibilityAnalysis(name1: string, name2: string): CompatibilityResult {
  const num1 = calculateNameNumber(name1);
  const num2 = calculateNameNumber(name2);
  const cards = getRandomCards(2);
  const astrology = getDailyAstrology();

  // Расчет совместимости на основе нумерологии
  const diff = Math.abs(num1 - num2);
  const baseScore = 100 - (diff * 5);

  // Бонусы за особые комбинации
  let bonus = 0;
  if (num1 === num2) bonus += 15; // Одинаковые числа
  if ((num1 + num2) === 11 || (num1 + num2) === 22) bonus += 10; // Мастер-числа
  if (Math.abs(num1 - num2) === 3 || Math.abs(num1 - num2) === 6) bonus += 5; // Гармоничные числа

  const score = Math.min(99, Math.max(40, baseScore + bonus + Math.floor(Math.random() * 10)));

  const compatibilityLevels = {
    high: ['исключительная гармония', 'глубокая духовная связь', 'идеальное дополнение'],
    medium: ['хороший потенциал', 'взаимное притяжение', 'интересный союз'],
    low: ['возможность для роста', 'уроки друг для друга', 'путь к пониманию'],
  };

  const level = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
  const levelText = compatibilityLevels[level][Math.floor(Math.random() * 3)];

  const analysis = `💕 **Анализ совместимости имён**

## ${name1} & ${name2}

**Нумерологическая совместимость: ${score}%** — ${levelText}

---

### 🔢 Нумерология имён

**${name1}** — число имени **${num1}**
Энергия: ${getNumberMeaning(num1)}

**${name2}** — число имени **${num2}**
Энергия: ${getNumberMeaning(num2)}

---

### 🎴 Карты Таро для вашей пары

**Карта ${name1}:** ${cards[0].name}
${cards[0].upright_meaning}

**Карта ${name2}:** ${cards[1].name}
${cards[1].upright_meaning}

---

### ✨ Анализ энергий

${getCompatibilityText(num1, num2, name1, name2)}

### 🌙 Космический контекст

Луна в фазе "${astrology.moon.phaseNameRu}" усиливает ${astrology.moon.isWaxing ? 'потенциал новых начинаний в отношениях' : 'глубину эмоциональной связи'}.

---

### 💫 Советы для гармонии

• ${cards[0].keywords[0]} — развивайте это качество вместе
• ${cards[1].keywords[0]} — это ваш общий ресурс
• Уважайте индивидуальность друг друга

---

*Помните: Любовь строится день за днём через понимание, терпение и искреннюю заботу друг о друге.* 💖`;

  return {
    name1,
    name2,
    compatibility_score: score,
    analysis,
    created_at: new Date().toISOString(),
  };
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
  };
  return meanings[num] || 'уникальный путь';
}

function getCompatibilityText(num1: number, num2: number, name1: string, name2: string): string {
  const sum = num1 + num2;

  if (num1 === num2) {
    return `${name1} и ${name2} обладают одинаковой числовой вибрацией, что создаёт глубокое понимание на интуитивном уровне. Вы как зеркала друг для друга — видите свои сильные стороны и точки роста.`;
  }

  if (sum === 11 || sum === 22) {
    return `Сумма ваших чисел образует мастер-число ${sum}! Это указывает на кармическую связь и высокий духовный потенциал отношений. Вместе вы способны достичь значительных высот.`;
  }

  if (Math.abs(num1 - num2) <= 2) {
    return `Близкие числовые вибрации ${name1} и ${name2} создают гармоничный резонанс. Вы интуитивно понимаете друг друга и движетесь в одном направлении.`;
  }

  return `Разные числовые вибрации ${name1} (${num1}) и ${name2} (${num2}) создают интересную динамику. Это союз, где противоположности дополняют друг друга, принося баланс и новые перспективы.`;
}

export default function CompatibilityScreen() {
  const router = useRouter();
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);

  const analyzeCompatibility = async () => {
    if (!name1.trim() || !name2.trim()) {
      Alert.alert('Внимание', 'Пожалуйста, введите оба имени');
      return;
    }

    setIsLoading(true);

    try {
      // Имитация загрузки для UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      const data = generateCompatibilityAnalysis(name1.trim(), name2.trim());
      setResult(data);
    } catch (error) {
      console.error('Error analyzing compatibility:', error);
      Alert.alert('Ошибка', 'Не удалось проанализировать совместимость. Попробуйте еще раз.');
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
    if (score >= 80) return '#27AE60'; // Green
    if (score >= 60) return '#F39C12'; // Orange
    if (score >= 40) return '#E67E22'; // Orange-Red
    return '#E74C3C'; // Red
  };

  const getCompatibilityEmoji = (score: number) => {
    if (score >= 90) return '💕';
    if (score >= 80) return '❤️';
    if (score >= 70) return '💖';
    if (score >= 60) return '💛';
    if (score >= 40) return '🧡';
    return '💔';
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
                <ScrollView style={styles.analysisScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.analysisText}>{result.analysis}</Text>
                </ScrollView>
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
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
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
    maxHeight: 300,
  },
  analysisScroll: {
    maxHeight: 260,
  },
  analysisText: {
    fontSize: 16,
    color: '#E8E8E8',
    lineHeight: 24,
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