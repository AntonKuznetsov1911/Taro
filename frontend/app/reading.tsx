import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSettings } from '../src/contexts/SettingsContext';
import { playFlip, playReveal } from '../src/utils/sound';
import { ReadingInterpretation } from '../components/ReadingInterpretation';
import { AnimatedTarotCard } from '../components/AnimatedTarotCard';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface TarotCard {
  id: number;
  name: string;
  name_en: string;
  type: string;
  image: string;
  keywords: string[];
  upright_meaning: string;
  reversed_meaning: string;
  is_reversed: boolean;
}

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

export default function ReadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { category, spread, question } = params as { category: string; spread: string; question: string };
  
  const [reading, setReading] = useState<TarotReading | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cardsRevealed, setCardsRevealed] = useState<boolean[]>([]);
  const [cardBackImage, setCardBackImage] = useState<string>('');

  const settings = useSettings();

  useEffect(() => {
    loadCardBack();
    createReading();
  }, []);

  const loadCardBack = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/card-back`);
      const data = await response.json();
      setCardBackImage(data.card_back);
    } catch (error) {
      console.error('Error loading card back:', error);
      // Fallback card back
      setCardBackImage("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxkZWZzPgogICAgICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYmFja0dyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICAgICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMkMzRTUwO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICAgICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMzNDQ5NUU7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDwvZGVmcz4KICAgIDxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMzAwIiBmaWxsPSJ1cmwoI2JhY2tHcmFkKSIgcng9IjE1Ii8+CiAgICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxNTAiIHI9IjQwIiBmaWxsPSJub25lIiBzdHJva2U9ImdvbGQiIHN0cm9rZS13aWR0aD0iMiIgb3BhY2l0eT0iMC44Ii8+CiAgICA8dGV4dCB4PSIxMDAiIHk9IjE2MCIgZm9udC1mYW1pbHk9InNlcmlmIiBmb250LXNpemU9IjMyIiBmaWxsPSJnb2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn4yZPC90ZXh0PgogICAgPHRleHQgeD0iMTAwIiB5PSIyODAiIGZvbnQtZmFtaWx5PSJzZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9ImdvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuOCI+VEFSTZQV0ZXh0Pgo8L3N2Zz4=");
    }
  };

  const createReading = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, spread_type: spread, question }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setReading(data);
      setCardsRevealed(new Array(data.cards.length).fill(false));
    } catch (error) {
      console.error('Error creating reading:', error);
      Alert.alert('Ошибка', 'Не удалось создать гадание. Попробуйте еще раз.');
      router.back();
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
            <Text style={styles.questionText}>&quot;{reading.question}&quot;</Text>
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
                <AnimatedTarotCard
                  key={index}
                  card={card}
                  position={reading.positions[index]}
                  index={index}
                  revealed={cardsRevealed[index]}
                  cardBackImage={cardBackImage}
                  onReveal={() => revealCard(index)}
                />
              ))}
            </View>
          </View>

          {cardsRevealed.every(revealed => revealed) && (
            <ReadingInterpretation
              interpretation={reading.interpretation}
              question={reading.question}
              category={reading.category}
              spreadType={reading.spread_type}
            />
          )}

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/') }>
              <LinearGradient colors={['#4ECDC4', '#26A0B4']} style={styles.actionButtonGradient}>
                <Ionicons name="home" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>На главную</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/history')}>
              <LinearGradient colors={['#FF6B9D', '#C44569']} style={styles.actionButtonGradient}>
                <Ionicons name="time" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>История</Text>
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
  cardsContainer: { gap: 15 },
  cardContainer: { alignItems: 'center' },
  card: { width: 200, height: 300, borderRadius: 15, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, position: 'relative' },
  cardContent: { flex: 1, position: 'relative' },
  cardInner: { flex: 1, position: 'relative' },
  cardReversed: { transform: [{ rotate: '180deg' }] },
  cardImage: { width: '100%', height: '100%', borderRadius: 15 },
  cardImageFallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', padding: 10, borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  cardNameOverlay: { fontSize: 14, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
  reversedIndicatorOverlay: { fontSize: 10, color: '#FFD700', textAlign: 'center', marginTop: 2 },
  cardName: { fontSize: 18, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginBottom: 10 },
  cardType: { fontSize: 12, color: '#E8E8E8', opacity: 0.8, marginBottom: 15 },
  reversedIndicator: { fontSize: 12, color: '#FFD700', marginBottom: 10, fontWeight: '600' },
  keywordsContainer: { alignItems: 'center', gap: 5 },
  keyword: { fontSize: 12, color: '#E8E8E8', backgroundColor: '#FFFFFF33', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  cardBack: { flex: 1, position: 'relative' },
  cardBackImage: { width: '100%', height: '100%', borderRadius: 15 },
  cardBackFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardBackText: { fontSize: 48, marginBottom: 10 },
  tapToReveal: { fontSize: 12, color: '#B8B8B8', textAlign: 'center' },
  loadingText: { fontSize: 12, color: '#FFD700', textAlign: 'center', marginTop: 8 },
  positionText: { fontSize: 14, color: '#9B59B6', fontWeight: '600', marginTop: 10, textAlign: 'center' },
  interpretationContainer: { marginHorizontal: 20, marginBottom: 20 },
  interpretationTitle: { fontSize: 20, fontWeight: '600', color: '#E8E8E8', marginBottom: 15, textAlign: 'center' },
  interpretationContent: { backgroundColor: '#1e1e1e', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#9B59B633', maxHeight: 400 },
  interpretationScroll: { maxHeight: 360 },
  interpretationText: { fontSize: 16, color: '#E8E8E8', lineHeight: 24 },
  actionsContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 30, gap: 15 },
  actionButton: { flex: 1, borderRadius: 15, overflow: 'hidden' },
  actionButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8 },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});