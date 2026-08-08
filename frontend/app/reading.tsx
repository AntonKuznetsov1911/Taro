import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSettings } from '../src/contexts/SettingsContext';
import { playFlip, playReveal } from '../src/utils/sound';
import { generateOfflineTarotReading, getOfflineCardBack, generateTarotCardSVG, OfflineReadingResult } from '../src/utils/offlineApi';
import { TarotCard } from '../src/data/tarotCards';
import { readingsStorage } from '../src/utils/storage';

interface TarotReading {
  id: string;
  question: string;
  category: string;
  spread_type: string;
  cards: TarotCard[];
  positions: string[];
  interpretation: string;
  created_at: string;
}

// Position names for different spread types
const SPREAD_POSITIONS: { [key: string]: string[] } = {
  'one_card': ['Ответ'],
  'three_cards': ['Прошлое', 'Настоящее', 'Будущее'],
  'celtic_cross': [
    'Ситуация',
    'Препятствие',
    'Основа',
    'Прошлое',
    'Возможное будущее',
    'Ближайшее будущее',
    'Ваше отношение',
    'Внешнее влияние',
    'Надежды и страхи',
    'Итог'
  ],
  'love': ['Вы', 'Партнёр', 'Отношения'],
  'career': ['Текущая ситуация', 'Препятствия', 'Действия'],
  'yes_no': ['Ответ'],
};

// Get card count for spread type
function getCardCount(spreadType: string): number {
  switch (spreadType) {
    case 'one_card':
    case 'yes_no':
      return 1;
    case 'three_cards':
    case 'love':
    case 'career':
      return 3;
    case 'celtic_cross':
      return 10;
    default:
      return 3;
  }
}

export default function ReadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { category, spread, question } = params as { category: string; spread: string; question: string };

  const [reading, setReading] = useState<TarotReading | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cardsRevealed, setCardsRevealed] = useState<boolean[]>([]);
  const [cardBackImage, setCardBackImage] = useState<string>('');
  const [cardImages, setCardImages] = useState<{ [key: number]: string }>({});

  const settings = useSettings();

  useEffect(() => {
    loadCardBack();
    createReading();
  }, []);

  const loadCardBack = async () => {
    try {
      const cardBack = await getOfflineCardBack();
      setCardBackImage(cardBack);
    } catch (error) {
      console.error('Error loading card back:', error);
      setCardBackImage("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFhMDA0MCIgcng9IjE1Ii8+PHRleHQgeD0iMTAwIiB5PSIxNjAiIGZvbnQtc2l6ZT0iNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfjK48L3RleHQ+PC9zdmc+");
    }
  };

  const createReading = async () => {
    try {
      const cardCount = getCardCount(spread || 'three_cards');
      const positions = SPREAD_POSITIONS[spread] || SPREAD_POSITIONS['three_cards'];

      // Generate offline reading
      const offlineResult = await generateOfflineTarotReading(question, cardCount);

      // Generate card images
      const images: { [key: number]: string } = {};
      offlineResult.cards.forEach((card) => {
        const isReversed = Math.random() < 0.3;
        images[card.id] = generateTarotCardSVG(card, isReversed);
      });
      setCardImages(images);

      // Create reading object
      const readingData: TarotReading = {
        id: `reading-${Date.now()}`,
        question: question || 'Общее гадание',
        category: category || 'general',
        spread_type: spread || 'three_cards',
        cards: offlineResult.cards,
        positions: positions,
        interpretation: offlineResult.interpretation,
        created_at: offlineResult.timestamp,
      };

      setReading(readingData);
      setCardsRevealed(new Array(offlineResult.cards.length).fill(false));

      // Save reading to local storage for history
      await readingsStorage.addReading(readingData);
    } catch (error) {
      console.error('Error creating reading:', error);
      // Even on error, create a simple reading
      const fallbackReading: TarotReading = {
        id: `reading-${Date.now()}`,
        question: question || 'Общее гадание',
        category: category || 'general',
        spread_type: spread || 'three_cards',
        cards: [],
        positions: ['Ответ'],
        interpretation: 'Карты несут для вас важное послание. Доверяйте своей интуиции.',
        created_at: new Date().toISOString(),
      };
      setReading(fallbackReading);
      setCardsRevealed([]);
    } finally {
      setIsLoading(false);
    }
  };

  const revealCard = async (index: number) => {
    const newRevealed = [...cardsRevealed];
    newRevealed[index] = true;
    setCardsRevealed(newRevealed);
    await playFlip({ soundEnabled: settings.soundEnabled, vibration: settings.vibration, volume: settings.effectsVolume });
  };

  const revealAllCards = async () => {
    setCardsRevealed(new Array(reading?.cards.length || 0).fill(true));
    await playReveal({ soundEnabled: settings.soundEnabled, vibration: settings.vibration, volume: settings.effectsVolume });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#0a0a0a', '#1a1a2e', '#16213e']} style={styles.background}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9B59B6" />
            <Text style={styles.loadingText}>Карты перемешиваются...</Text>
            <Text style={styles.loadingSubtext}>Ваше гадание готовится</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!reading) return null;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0a0a0a', '#1a1a2e', '#16213e']} style={styles.background}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
            </TouchableOpacity>
            <Text style={styles.title}>Ваше гадание</Text>
          </View>

          <View style={styles.questionContainer}>
            <Text style={styles.questionLabel}>Ваш вопрос:</Text>
            <Text style={styles.questionText}>"{reading.question}"</Text>
          </View>

          <View style={styles.cardsSection}>
            <View style={styles.cardsSectionHeader}>
              <Text style={styles.cardsSectionTitle}>Выпавшие карты</Text>
              {cardsRevealed.some(revealed => !revealed) && (
                <TouchableOpacity onPress={revealAllCards} style={styles.revealAllButton}>
                  <Text style={styles.revealAllText}>Открыть все</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.cardsContainer}>
              {reading.cards.map((card, index) => (
                <View key={index} style={styles.cardWrapper}>
                  <Text style={styles.positionLabel}>{reading.positions[index] || `Карта ${index + 1}`}</Text>
                  <TouchableOpacity
                    style={styles.cardTouchable}
                    onPress={() => !cardsRevealed[index] && revealCard(index)}
                    disabled={cardsRevealed[index]}
                  >
                    <View style={styles.card}>
                      {cardsRevealed[index] ? (
                        <View style={styles.cardFront}>
                          {cardImages[card.id] ? (
                            <Image
                              source={{ uri: cardImages[card.id] }}
                              style={styles.cardImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.cardFallback}>
                              <Text style={styles.cardEmoji}>🎴</Text>
                              <Text style={styles.cardName}>{card.name}</Text>
                            </View>
                          )}
                          <View style={styles.cardOverlay}>
                            <Text style={styles.cardNameOverlay}>{card.name}</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.cardBack}>
                          {cardBackImage ? (
                            <Image
                              source={{ uri: cardBackImage }}
                              style={styles.cardBackImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.cardBackFallback}>
                              <Text style={styles.cardBackEmoji}>🔮</Text>
                            </View>
                          )}
                          <View style={styles.tapHint}>
                            <Text style={styles.tapHintText}>Нажмите для открытия</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                  {cardsRevealed[index] && (
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardKeywords}>
                        {card.keywords.slice(0, 3).join(' • ')}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {cardsRevealed.every(revealed => revealed) && (
            <View style={styles.interpretationContainer}>
              <Text style={styles.interpretationTitle}>✨ Толкование</Text>
              <View style={styles.interpretationContent}>
                <ScrollView style={styles.interpretationScroll} nestedScrollEnabled>
                  <Text style={styles.interpretationText}>{reading.interpretation}</Text>
                </ScrollView>
              </View>
            </View>
          )}

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/')}>
              <LinearGradient colors={['#4ECDC4', '#26A0B4']} style={styles.actionButtonGradient}>
                <Ionicons name="home" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>На главную</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => {
              // Reset and create new reading
              setIsLoading(true);
              setReading(null);
              setCardsRevealed([]);
              createReading();
            }}>
              <LinearGradient colors={['#9B59B6', '#8E44AD']} style={styles.actionButtonGradient}>
                <Ionicons name="refresh" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>Новое гадание</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#E8E8E8', marginTop: 20, fontWeight: '600' },
  loadingSubtext: { fontSize: 14, color: '#B8B8B8', marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  backButton: { marginRight: 15, padding: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#E8E8E8' },
  questionContainer: { marginHorizontal: 20, marginBottom: 20, backgroundColor: '#1e1e1e', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#9B59B633' },
  questionLabel: { fontSize: 14, color: '#9B59B6', fontWeight: '600', marginBottom: 8 },
  questionText: { fontSize: 16, color: '#E8E8E8', lineHeight: 24, fontStyle: 'italic' },
  cardsSection: { paddingHorizontal: 20, marginBottom: 20 },
  cardsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardsSectionTitle: { fontSize: 20, fontWeight: '600', color: '#E8E8E8' },
  revealAllButton: { backgroundColor: '#9B59B633', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  revealAllText: { fontSize: 12, color: '#9B59B6', fontWeight: '600' },
  cardsContainer: { gap: 20 },
  cardWrapper: { alignItems: 'center' },
  positionLabel: { fontSize: 14, color: '#9B59B6', fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' },
  cardTouchable: { width: 180, height: 270 },
  card: { width: '100%', height: '100%', borderRadius: 15, overflow: 'hidden', elevation: 8, shadowColor: '#9B59B6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  cardFront: { flex: 1, backgroundColor: '#2a2a4a' },
  cardImage: { width: '100%', height: '100%' },
  cardFallback: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a3a' },
  cardEmoji: { fontSize: 60, marginBottom: 10 },
  cardName: { fontSize: 16, color: '#E8E8E8', fontWeight: '600', textAlign: 'center', paddingHorizontal: 10 },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10 },
  cardNameOverlay: { fontSize: 14, color: '#FFF', fontWeight: '600', textAlign: 'center' },
  cardBack: { flex: 1, backgroundColor: '#1a0033' },
  cardBackImage: { width: '100%', height: '100%' },
  cardBackFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardBackEmoji: { fontSize: 60 },
  tapHint: { position: 'absolute', bottom: 15, left: 0, right: 0, alignItems: 'center' },
  tapHintText: { fontSize: 12, color: '#9B59B6', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  cardInfo: { marginTop: 10, alignItems: 'center' },
  cardKeywords: { fontSize: 12, color: '#B8B8B8', textAlign: 'center' },
  interpretationContainer: { marginHorizontal: 20, marginBottom: 20 },
  interpretationTitle: { fontSize: 20, fontWeight: '600', color: '#E8E8E8', marginBottom: 15, textAlign: 'center' },
  interpretationContent: { backgroundColor: '#1e1e1e', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#9B59B633', maxHeight: 400 },
  interpretationScroll: { maxHeight: 360 },
  interpretationText: { fontSize: 14, color: '#E8E8E8', lineHeight: 22 },
  actionsContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 30, gap: 15 },
  actionButton: { flex: 1, borderRadius: 15, overflow: 'hidden' },
  actionButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8 },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
