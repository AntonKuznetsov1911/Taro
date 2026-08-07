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

interface CompatibilityResult {
  name1: string;
  name2: string;
  compatibility_score: number;
  analysis: string;
  created_at: string;
}

// Numerology letter values (Russian and English)
const LETTER_VALUES: { [key: string]: number } = {
  'а': 1, 'б': 2, 'в': 3, 'г': 4, 'д': 5, 'е': 6, 'ё': 7, 'ж': 8, 'з': 9,
  'и': 1, 'й': 2, 'к': 3, 'л': 4, 'м': 5, 'н': 6, 'о': 7, 'п': 8, 'р': 9,
  'с': 1, 'т': 2, 'у': 3, 'ф': 4, 'х': 5, 'ц': 6, 'ч': 7, 'ш': 8, 'щ': 9,
  'ъ': 1, 'ы': 2, 'ь': 3, 'э': 4, 'ю': 5, 'я': 6,
  'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9,
  'j': 1, 'k': 2, 'l': 3, 'm': 4, 'n': 5, 'o': 6, 'p': 7, 'q': 8, 'r': 9,
  's': 1, 't': 2, 'u': 3, 'v': 4, 'w': 5, 'x': 6, 'y': 7, 'z': 8,
};

// Calculate numerology number for a name
function calculateNameNumber(name: string): number {
  const cleanName = name.toLowerCase().replace(/[^а-яёa-z]/g, '');
  let sum = 0;
  for (const char of cleanName) {
    sum += LETTER_VALUES[char] || 0;
  }
  // Reduce to single digit
  while (sum > 9) {
    sum = String(sum).split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  }
  return sum;
}

// Compatibility analysis texts
const COMPATIBILITY_TEXTS: { [key: number]: string[] } = {
  9: [
    "Идеальная совместимость! Ваши энергии находятся в полной гармонии. Вы дополняете друг друга, как инь и янь, создавая баланс во всех сферах жизни.",
    "Ваш союз благословлён космическими силами. Вместе вы способны преодолеть любые препятствия и достичь самых смелых целей.",
    "Между вами существует глубокая духовная связь, которая выходит за рамки обычных отношений."
  ],
  8: [
    "Очень высокая совместимость! Ваши имена резонируют на глубоком уровне. Вы понимаете друг друга интуитивно.",
    "Энергетика ваших имен создаёт мощное поле взаимопритяжения. Это союз, который может выдержать испытание временем.",
    "Вы вдохновляете друг друга на рост и развитие, помогая раскрыть лучшие качества."
  ],
  7: [
    "Хорошая совместимость с потенциалом для развития. Ваши энергии дополняют друг друга в большинстве аспектов.",
    "Между вами есть искра, которую нужно бережно хранить. При взаимном уважении отношения будут процветать.",
    "Ваш союз обладает творческим потенциалом. Вместе вы можете создать что-то прекрасное."
  ],
  6: [
    "Средняя совместимость с возможностью гармонии. Ваши имена имеют как схожие, так и различающиеся вибрации.",
    "Отношения потребуют работы над собой, но результат стоит усилий. Учитесь ценить различия друг друга.",
    "Понимание и терпение станут ключами к вашей гармонии."
  ],
  5: [
    "Противоположные энергии, которые могут как притягивать, так и отталкивать. Это союз контрастов.",
    "Ваши различия могут стать источником как конфликтов, так и взаимного обогащения. Важен компромисс.",
    "Динамичные отношения, требующие гибкости и открытости к переменам."
  ],
  4: [
    "Непростая совместимость, требующая значительных усилий. Но любовь способна преодолеть числовые барьеры.",
    "Ваши энергии движутся в разных направлениях, но при желании можно найти точки соприкосновения.",
    "Путь не будет легким, но если вы готовы работать над отношениями, успех возможен."
  ],
  3: [
    "Сложная совместимость. Ваши вибрации значительно отличаются, что может создавать напряжение.",
    "Потребуется много понимания и принятия. Фокусируйтесь на том, что вас объединяет.",
    "Возможно, вам предстоит многому научиться друг у друга."
  ],
  2: [
    "Низкая совместимость по нумерологическим показателям. Ваши энергии редко находят общий язык.",
    "Это не значит, что отношения невозможны, но они потребуют особой мудрости и терпения.",
    "Иногда противоположности притягиваются для важных жизненных уроков."
  ],
  1: [
    "Очень низкая нумерологическая совместимость. Ваши вибрации движутся в противоположных направлениях.",
    "Если чувства сильны, помните: любовь превыше чисел. Но путь будет требовать постоянных усилий.",
    "Возможно, вселенная свела вас для важного кармического урока."
  ],
};

// Generate compatibility analysis
function generateCompatibilityAnalysis(name1: string, name2: string): CompatibilityResult {
  const num1 = calculateNameNumber(name1);
  const num2 = calculateNameNumber(name2);

  // Calculate compatibility score (1-9 scale, converted to percentage)
  const diff = Math.abs(num1 - num2);
  const baseScore = 9 - diff;

  // Add some variation based on sum
  const sum = num1 + num2;
  const bonus = (sum % 3) * 3;

  // Final score (55-98 range)
  const score = Math.min(98, Math.max(55, 55 + (baseScore * 5) + bonus));

  // Get appropriate text
  const textIndex = Math.floor(baseScore);
  const texts = COMPATIBILITY_TEXTS[textIndex] || COMPATIBILITY_TEXTS[5];
  const randomText = texts[Math.floor(Math.random() * texts.length)];

  // Create detailed analysis
  const analysis = `🔢 Нумерологический анализ имён:\n\n` +
    `✨ Число имени "${name1}": ${num1}\n` +
    `✨ Число имени "${name2}": ${num2}\n\n` +
    `💫 ${randomText}\n\n` +
    `🌟 Совместное число: ${(num1 + num2) % 9 + 1}\n\n` +
    `${getNumberMeaning(num1, name1)}\n\n` +
    `${getNumberMeaning(num2, name2)}\n\n` +
    `💕 Рекомендация: ${getRecommendation(score)}`;

  return {
    name1,
    name2,
    compatibility_score: score,
    analysis,
    created_at: new Date().toISOString(),
  };
}

function getNumberMeaning(num: number, name: string): string {
  const meanings: { [key: number]: string } = {
    1: `${name} несёт энергию лидерства и независимости. Это число первопроходцев.`,
    2: `${name} обладает энергией гармонии и дипломатии. Стремление к партнёрству.`,
    3: `${name} наполнено творческой энергией и радостью жизни. Число самовыражения.`,
    4: `${name} несёт стабильность и практичность. Надёжность и трудолюбие.`,
    5: `${name} полно энергии перемен и свободы. Любовь к приключениям.`,
    6: `${name} излучает любовь и заботу. Семейные ценности на первом месте.`,
    7: `${name} обладает мистической энергией поиска истины. Духовность и мудрость.`,
    8: `${name} несёт энергию достижений и материального успеха. Сила воли.`,
    9: `${name} завершает цикл, неся мудрость и сострадание. Универсальная любовь.`,
  };
  return meanings[num] || meanings[5];
}

function getRecommendation(score: number): string {
  if (score >= 85) return "Берегите этот союз — он особенный! Доверяйте друг другу и двигайтесь вместе к общим целям.";
  if (score >= 70) return "У вас хороший потенциал. Развивайте общение и учитесь слышать друг друга.";
  if (score >= 55) return "Работайте над взаимопониманием. Ваши различия могут стать источником роста.";
  return "Потребуется терпение и мудрость, но любовь способна преодолеть любые препятствия.";
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

    // Simulate brief loading for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    const data = generateCompatibilityAnalysis(name1.trim(), name2.trim());
    setResult(data);
    setIsLoading(false);
  };

  const resetForm = () => {
    setName1('');
    setName2('');
    setResult(null);
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return '#27AE60';
    if (score >= 60) return '#F39C12';
    if (score >= 40) return '#E67E22';
    return '#E74C3C';
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
              <Text style={styles.infoText}>• Нумерологический расчёт совместимости</Text>
              <Text style={styles.infoText}>• Астрологические соответствия имён</Text>
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
  },
  submitButtonDisabled: {
    elevation: 0,
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
