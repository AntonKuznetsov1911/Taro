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

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface CompatibilityResult {
  name1: string;
  name2: string;
  compatibility_score: number;
  analysis: string;
  created_at: string;
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
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/compatibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name1: name1.trim(),
          name2: name2.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
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