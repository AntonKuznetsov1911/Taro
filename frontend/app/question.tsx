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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSettings } from '../src/contexts/SettingsContext';
import { playShuffle } from '../src/utils/sound';

const CATEGORIES = {
  love: { name: 'Любовь', icon: '❤️', color: '#FF6B9D' },
  career: { name: 'Карьера', icon: '💼', color: '#4ECDC4' },
  finance: { name: 'Финансы', icon: '💰', color: '#45B7D1' },
  general: { name: 'Общие вопросы', icon: '🔮', color: '#9B59B6' }
};

const SPREADS = {
  one_card: { name: 'Одна карта', cards: 1 },
  three_cards: { name: 'Три карты', cards: 3 },
  celtic_cross: { name: 'Кельтский крест', cards: 10 }
};

// Значения по умолчанию, если параметры не переданы (глубокая ссылка, обновление страницы)
const DEFAULT_CATEGORY_KEY: keyof typeof CATEGORIES = 'general';
const DEFAULT_SPREAD_KEY: keyof typeof SPREADS = 'three_cards';

export default function QuestionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { category, spread } = params as { category: string; spread: string };
  
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const settings = useSettings();

  const categoryKey = (category && category in CATEGORIES
    ? category
    : DEFAULT_CATEGORY_KEY) as keyof typeof CATEGORIES;
  const spreadKey = (spread && spread in SPREADS
    ? spread
    : DEFAULT_SPREAD_KEY) as keyof typeof SPREADS;

  const categoryInfo = CATEGORIES[categoryKey];
  const spreadInfo = SPREADS[spreadKey];

  const handleSubmit = async () => {
    if (!question.trim()) {
      Alert.alert('Внимание', 'Пожалуйста, введите ваш вопрос');
      return;
    }

    setIsLoading(true);

    // Колода тасуется — звук запускается внутри жеста пользователя
    void playShuffle({
      soundEnabled: settings.soundEnabled,
      vibration: settings.vibration,
      volume: settings.effectsVolume,
    });

    try {
      router.push({
        pathname: '/reading',
        params: { category: categoryKey, spread: spreadKey, question: question.trim() }
      });
    } catch (error) {
      Alert.alert('Ошибка', 'Произошла ошибка при создании гадания');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceholder = () => {
    switch (categoryKey) {
      case 'love':
        return 'Например: Что ждет меня в отношениях? Любит ли меня этот человек?';
      case 'career':
        return 'Например: Стоит ли мне сменить работу? Какие возможности меня ждут?';
      case 'finance':
        return 'Например: Как улучшить финансовое положение? Стоит ли инвестировать?';
      default:
        return 'Например: Что мне следует знать о текущей ситуации?';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
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
              <Text style={styles.title}>Задайте вопрос</Text>
            </View>

            {/* Selected Options */}
            <View style={styles.selectionContainer}>
              <View style={[styles.selectionCard, { borderColor: categoryInfo.color }]}>
                <Text style={styles.selectionIcon}>{categoryInfo.icon}</Text>
                <Text style={styles.selectionText}>{categoryInfo.name}</Text>
              </View>
              
              <View style={styles.selectionCard}>
                <Text style={styles.selectionIcon}>🎴</Text>
                <Text style={styles.selectionText}>{spreadInfo.name}</Text>
                <Text style={styles.selectionSubtext}>{spreadInfo.cards} карт</Text>
              </View>
            </View>

            {/* Question Input */}
            <View style={styles.questionSection}>
              <Text style={styles.questionTitle}>Ваш вопрос</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  multiline
                  numberOfLines={4}
                  placeholder={getPlaceholder()}
                  placeholderTextColor="#666"
                  value={question}
                  onChangeText={setQuestion}
                  maxLength={500}
                />
                <Text style={styles.characterCount}>{question.length}/500</Text>
              </View>
            </View>

            {/* Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>💡 Советы для лучшего гадания:</Text>
              <Text style={styles.tipText}>• Формулируйте вопрос конкретно и четко</Text>
              <Text style={styles.tipText}>• Задавайте открытые вопросы вместо "да/нет"</Text>
              <Text style={styles.tipText}>• Сосредоточьтесь на том, что действительно важно</Text>
              <Text style={styles.tipText}>• Доверьтесь своей интуиции при интерпретации</Text>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity 
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#666', '#555'] : ['#9B59B6', '#8E44AD', '#6C3483']}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <Text style={styles.submitButtonText}>Подготовка...</Text>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#FFF" style={styles.submitButtonIcon} />
                    <Text style={styles.submitButtonText}>Начать гадание</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E8E8E8',
  },
  selectionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 15,
  },
  selectionCard: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  selectionIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  selectionText: {
    fontSize: 14,
    color: '#E8E8E8',
    fontWeight: '600',
    textAlign: 'center',
  },
  selectionSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  questionSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 15,
  },
  inputContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
    padding: 15,
  },
  textInput: {
    fontSize: 16,
    color: '#E8E8E8',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
  },
  tipsContainer: {
    marginHorizontal: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#9B59B633',
  },
  tipsTitle: {
    fontSize: 16,
    color: '#E8E8E8',
    fontWeight: '600',
    marginBottom: 10,
  },
  tipText: {
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
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
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
});