import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { readingsStorage } from '../src/utils/storage';
import { stripMarkdown } from '../src/utils/stripMarkdown';

// Безопасный разбор JSON из параметров навигации
const parseStringList = (raw: unknown): string[] => {
  if (typeof raw !== 'string' || raw.length === 0) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch (error) {
    console.warn('Не удалось разобрать данные портрета:', error);
    return [];
  }
};

export default function AstroResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const {
    analysisId,
    personalityAnalysis,
    dominantArcana,
    characterTraits,
    lifePath,
    currentPhase,
    advice,
  } = params;

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const analysisText =
    typeof personalityAnalysis === 'string' ? personalityAnalysis.trim() : '';
  const hasAnalysis = analysisText.length > 0;

  const arcanaList: string[] = parseStringList(dominantArcana);
  const traitsList: string[] = parseStringList(characterTraits);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Мой астропсихологический портрет\n\n${stripMarkdown(analysisText)}${
          lifePath ? `\n\nЖизненный путь: ${lifePath}` : ''
        }${currentPhase ? `\n\nТекущая фаза: ${currentPhase}` : ''}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const readingId = (analysisId as string) || `astro-${Date.now()}`;
      const existing = await readingsStorage.getReadings();

      if (existing.some((r) => r?.id === readingId)) {
        setIsSaved(true);
        Alert.alert('Уже сохранено', 'Этот портрет уже есть в вашей истории');
        return;
      }

      await readingsStorage.addReading({
        id: readingId,
        type: 'astro_personality',
        question: 'Астропсихологический портрет',
        category: 'general',
        spread_type: 'astro_personality',
        cards: [],
        positions: [],
        interpretation: analysisText,
        dominant_arcana: arcanaList,
        character_traits: traitsList,
        life_path: (lifePath as string) || '',
        current_phase: (currentPhase as string) || '',
        advice: (advice as string) || '',
        created_at: new Date().toISOString(),
      });

      setIsSaved(true);
      Alert.alert('Сохранено', 'Ваш астропсихологический портрет сохранён в историю');
    } catch (error) {
      console.error('Error saving astro portrait:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить портрет. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewReading = () => {
    router.push('/astro-personality');
  };

  const hasAnyContent =
    hasAnalysis ||
    arcanaList.length > 0 ||
    traitsList.length > 0 ||
    !!lifePath ||
    !!currentPhase ||
    !!advice;

  if (!hasAnyContent) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
          style={styles.background}
        >
          <StatusBar barStyle="light-content" backgroundColor="#000011" />
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ваш портрет</Text>
            <View style={styles.backButton} />
          </View>
          <View style={styles.emptyState}>
            <Ionicons name="sparkles-outline" size={64} color="#9B59B6" />
            <Text style={styles.emptyTitle}>Портрет не найден</Text>
            <Text style={styles.emptyText}>
              Данные анализа недоступны. Пройдите тест заново, чтобы получить
              астропсихологический портрет.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.replace('/astro-personality')}
            >
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)']}
                style={styles.emptyButtonGradient}
              >
                <Ionicons name="refresh" size={20} color="#FFF" />
                <Text style={styles.emptyButtonText}>Создать портрет</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
        style={styles.background}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000011" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ваш портрет</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#E8E8E8" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.3)', 'rgba(142, 68, 173, 0.5)']}
                style={styles.heroIconGradient}
              >
                <Ionicons name="sparkles" size={50} color="#9B59B6" />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>Астропсихологический портрет</Text>
            <Text style={styles.heroSubtitle}>Уникальный разбор вашей личности</Text>
          </View>

          {/* Dominant Arcana */}
          {arcanaList.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="star" size={24} color="#9B59B6" />
                <Text style={styles.sectionTitle}>Ваши архетипы</Text>
              </View>
              <View style={styles.arcanaContainer}>
                {arcanaList.map((arcana, index) => (
                  <View key={index} style={styles.arcanaCard}>
                    <LinearGradient
                      colors={['rgba(155, 89, 182, 0.2)', 'rgba(142, 68, 173, 0.15)']}
                      style={styles.arcanaCardGradient}
                    >
                      <Text style={styles.arcanaEmoji}>🎴</Text>
                      <Text style={styles.arcanaText}>{arcana}</Text>
                    </LinearGradient>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Life Path */}
          {lifePath && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="compass" size={24} color="#9B59B6" />
                <Text style={styles.sectionTitle}>Ваш жизненный путь</Text>
              </View>
              <View style={styles.pathCard}>
                <LinearGradient
                  colors={['rgba(155, 89, 182, 0.15)', 'rgba(142, 68, 173, 0.1)']}
                  style={styles.pathCardGradient}
                >
                  <Text style={styles.pathText}>{lifePath}</Text>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Current Phase */}
          {currentPhase && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="moon" size={24} color="#9B59B6" />
                <Text style={styles.sectionTitle}>Текущая фаза</Text>
              </View>
              <View style={styles.phaseCard}>
                <Text style={styles.phaseText}>{currentPhase}</Text>
              </View>
            </View>
          )}

          {/* Character Traits */}
          {traitsList.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="color-palette" size={24} color="#9B59B6" />
                <Text style={styles.sectionTitle}>Черты характера</Text>
              </View>
              <View style={styles.traitsContainer}>
                {traitsList.map((trait, index) => (
                  <View key={index} style={styles.traitPill}>
                    <Text style={styles.traitText}>{trait}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Main Analysis */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="book" size={24} color="#9B59B6" />
              <Text style={styles.sectionTitle}>Глубинный анализ</Text>
            </View>
            <View style={styles.analysisCard}>
              {hasAnalysis ? (
                <MarkdownRenderer content={analysisText} />
              ) : (
                <View style={styles.inlineEmpty}>
                  <Ionicons name="alert-circle-outline" size={22} color="#9B59B6" />
                  <Text style={styles.inlineEmptyText}>
                    Текст анализа недоступен. Создайте портрет заново, чтобы увидеть
                    подробный разбор.
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Advice Section */}
          {advice && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb" size={24} color="#9B59B6" />
                <Text style={styles.sectionTitle}>Послание Вселенной</Text>
              </View>
              <View style={styles.adviceCard}>
                <LinearGradient
                  colors={['rgba(155, 89, 182, 0.2)', 'rgba(142, 68, 173, 0.25)']}
                  style={styles.adviceCardGradient}
                >
                  <Text style={styles.adviceText}>{advice}</Text>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#9B59B6" />
            <Text style={styles.infoText}>
              Этот портрет отражает вашу суть здесь и сейчас. Вы постоянно развиваетесь,
              и ваша энергия меняется. Возвращайтесь к анализу через время - он может раскрыть новые грани.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSave}
              disabled={isSaving}
            >
              <LinearGradient
                colors={
                  isSaving
                    ? ['rgba(120, 120, 120, 0.8)', 'rgba(90, 90, 90, 0.9)']
                    : ['rgba(46, 204, 113, 0.8)', 'rgba(39, 174, 96, 0.9)']
                }
                style={styles.actionButtonGradient}
              >
                <Ionicons name={isSaved ? 'checkmark' : 'bookmark'} size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>
                  {isSaving ? 'Сохранение...' : isSaved ? 'Сохранено' : 'Сохранить'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleNewReading}>
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="refresh" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>Новый портрет</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#E8E8E8',
  },
  shareButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 10,
  },
  heroIconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E8E8E8',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8E8E8',
    marginLeft: 10,
  },
  arcanaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  arcanaCard: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
  },
  arcanaCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
    borderRadius: 15,
  },
  arcanaEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  arcanaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E8E8E8',
  },
  pathCard: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
  },
  pathCardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
    borderRadius: 15,
  },
  pathText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    lineHeight: 24,
  },
  phaseCard: {
    backgroundColor: 'rgba(155, 89, 182, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  phaseText: {
    fontSize: 16,
    color: '#E8E8E8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitPill: {
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.4)',
  },
  traitText: {
    fontSize: 13,
    color: '#E8E8E8',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(155, 89, 182, 0.3)',
    marginHorizontal: 20,
    marginVertical: 25,
  },
  analysisCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  adviceCard: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 6,
  },
  adviceCardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.4)',
    borderRadius: 15,
  },
  adviceText: {
    fontSize: 15,
    color: '#E8E8E8',
    lineHeight: 22,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(155, 89, 182, 0.15)',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    marginLeft: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 10,
  },
  actionButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 15,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 30,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  inlineEmpty: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  inlineEmptyText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 20,
  },
});
