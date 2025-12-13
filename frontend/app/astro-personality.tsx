import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ASTRO_PSYCHOLOGY_QUESTIONS,
  Question,
  QuestionOption,
  CATEGORY_INFO,
} from '../src/data/astroPsychologyQuestions';

const { width } = Dimensions.get('window');

interface Answer {
  questionId: string;
  optionId: string;
  keywords: string[];
  arcana?: string;
}

export default function AstroPersonalityScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const currentQuestion = ASTRO_PSYCHOLOGY_QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / ASTRO_PSYCHOLOGY_QUESTIONS.length) * 100;
  const categoryInfo = CATEGORY_INFO[currentQuestion.category];

  const handleAnswer = (option: QuestionOption) => {
    setSelectedOption(option.id);

    // Haptic feedback simulation with scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      const answer: Answer = {
        questionId: currentQuestion.id,
        optionId: option.id,
        keywords: option.keywords,
        arcana: option.arcana,
      };

      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);

      if (currentIndex < ASTRO_PSYCHOLOGY_QUESTIONS.length - 1) {
        // Animate to next question
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setCurrentIndex(currentIndex + 1);
          setSelectedOption(null);
          slideAnim.setValue(50);
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        });
      } else {
        // All questions answered - navigate to analysis
        navigateToAnalysis(newAnswers);
      }
    }, 400);
  };

  const navigateToAnalysis = (finalAnswers: Answer[]) => {
    // Navigate to loading/analysis screen
    router.push({
      pathname: '/astro-analysis',
      params: {
        answers: JSON.stringify(finalAnswers),
      },
    });
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(currentIndex - 1);
        setAnswers(answers.slice(0, -1));
        setSelectedOption(null);
        slideAnim.setValue(-50);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
        style={styles.background}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000011" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Астропсихологический портрет</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: `${progress}%`,
                },
              ]}
            >
              <LinearGradient
                colors={['#9B59B6', '#8E44AD', '#6C3483']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
            </Animated.View>
          </View>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {ASTRO_PSYCHOLOGY_QUESTIONS.length}
          </Text>
        </View>

        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
          <View style={styles.categoryTextContainer}>
            <Text style={styles.categoryTitle}>{categoryInfo.title}</Text>
            <Text style={styles.categoryDescription}>{categoryInfo.description}</Text>
          </View>
        </View>

        {/* Question Card */}
        <Animated.View
          style={[
            styles.questionContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.questionCard}>
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.15)', 'rgba(142, 68, 173, 0.1)']}
                style={styles.questionCardGradient}
              >
                <View style={styles.questionIconContainer}>
                  <Ionicons
                    name={currentQuestion.icon as any}
                    size={40}
                    color="#9B59B6"
                  />
                </View>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>
                {currentQuestion.subtitle && (
                  <Text style={styles.questionSubtitle}>{currentQuestion.subtitle}</Text>
                )}
              </LinearGradient>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    selectedOption === option.id && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleAnswer(option)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      selectedOption === option.id
                        ? ['rgba(155, 89, 182, 0.4)', 'rgba(142, 68, 173, 0.4)']
                        : ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.2)']
                    }
                    style={styles.optionGradient}
                  >
                    <View style={styles.optionContent}>
                      <View style={styles.optionNumber}>
                        <Text style={styles.optionNumberText}>
                          {String.fromCharCode(65 + index)}
                        </Text>
                      </View>
                      <Text style={styles.optionText}>{option.text}</Text>
                    </View>
                    {option.arcana && (
                      <Text style={styles.arcanaText}>🔮 {option.arcana}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mystical Quote */}
            <View style={styles.quoteContainer}>
              <Ionicons name="sparkles" size={16} color="#9B59B6" />
              <Text style={styles.quoteText}>
                Ваши ответы создают уникальный энергетический портрет
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressGradient: {
    flex: 1,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9B59B6',
    minWidth: 50,
    textAlign: 'right',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(155, 89, 182, 0.15)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  categoryEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 3,
  },
  categoryDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  questionContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  questionCard: {
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
  },
  questionCardGradient: {
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
    borderRadius: 20,
  },
  questionIconContainer: {
    alignSelf: 'center',
    marginBottom: 15,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  optionButton: {
    marginBottom: 12,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
  },
  optionButtonSelected: {
    elevation: 8,
  },
  optionGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
    borderRadius: 15,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  optionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(155, 89, 182, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8E8E8',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#E8E8E8',
    lineHeight: 21,
  },
  arcanaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  quoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    paddingHorizontal: 20,
  },
  quoteText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
    marginLeft: 8,
  },
});
