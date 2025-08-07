import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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

const CATEGORIES = {
  love: { name: 'Любовь', icon: '❤️', color: '#FF6B9D' },
  career: { name: 'Карьера', icon: '💼', color: '#4ECDC4' },
  finance: { name: 'Финансы', icon: '💰', color: '#45B7D1' },
  general: { name: 'Общие вопросы', icon: '🔮', color: '#9B59B6' }
};

const SPREADS = {
  one_card: 'Одна карта',
  three_cards: 'Три карты',
  celtic_cross: 'Кельтский крест'
};

export default function HistoryScreen() {
  const router = useRouter();
  const [readings, setReadings] = useState<TarotReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedReading, setExpandedReading] = useState<string | null>(null);

  useEffect(() => {
    fetchReadings();
  }, []);

  const fetchReadings = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/readings`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setReadings(data);
    } catch (error) {
      console.error('Error fetching readings:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить историю гаданий');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const toggleExpansion = (readingId: string) => {
    setExpandedReading(expandedReading === readingId ? null : readingId);
  };

  const ReadingCard = ({ reading }: { reading: TarotReading }) => {
    const isExpanded = expandedReading === reading.id;
    const category = CATEGORIES[reading.category as keyof typeof CATEGORIES];
    
    return (
      <View style={styles.readingCard}>
        <TouchableOpacity onPress={() => toggleExpansion(reading.id)}>
          <View style={styles.readingHeader}>
            <View style={styles.readingInfo}>
              <View style={styles.categoryBadge}>
                <Text style={[styles.categoryIcon, { color: category.color }]}>
                  {category.icon}
                </Text>
                <Text style={[styles.categoryName, { color: category.color }]}>
                  {category.name}
                </Text>
              </View>
              <Text style={styles.readingDate}>{formatDate(reading.created_at)}</Text>
            </View>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#9B59B6" 
            />
          </View>

          <Text style={styles.readingQuestion} numberOfLines={isExpanded ? undefined : 2}>
            "{reading.question}"
          </Text>

          <View style={styles.readingMeta}>
            <Text style={styles.spreadType}>
              {SPREADS[reading.spread_type as keyof typeof SPREADS]} • {reading.cards.length} карт
            </Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.cardsPreview}>
              <Text style={styles.cardsTitle}>Выпавшие карты:</Text>
              {reading.cards.map((card, index) => (
                <View key={index} style={styles.cardPreview}>
                  <Text style={styles.cardPosition}>{reading.positions[index]}:</Text>
                  <Text style={styles.cardName}>
                    {card.name} {card.is_reversed && '(перевернутая)'}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.interpretationPreview}>
              <Text style={styles.interpretationTitle}>Толкование:</Text>
              <Text style={styles.interpretationText} numberOfLines={6}>
                {reading.interpretation}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#0a0a0a', '#1a1a2e', '#16213e']}
          style={styles.background}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9B59B6" />
            <Text style={styles.loadingText}>Загрузка истории...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
          </TouchableOpacity>
          <Text style={styles.title}>История гаданий</Text>
        </View>

        {readings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔮</Text>
            <Text style={styles.emptyTitle}>Нет гаданий</Text>
            <Text style={styles.emptyText}>Ваша история гаданий пока пуста</Text>
            <TouchableOpacity
              style={styles.newReadingButton}
              onPress={() => router.push('/')}
            >
              <LinearGradient
                colors={['#9B59B6', '#8E44AD']}
                style={styles.newReadingButtonGradient}
              >
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.newReadingButtonText}>Создать гадание</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.readingsContainer}>
              {readings.map((reading) => (
                <ReadingCard key={reading.id} reading={reading} />
              ))}
            </View>
          </ScrollView>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#E8E8E8',
    marginTop: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E8E8E8',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#B8B8B8',
    textAlign: 'center',
    marginBottom: 30,
  },
  newReadingButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  newReadingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    gap: 8,
  },
  newReadingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  readingsContainer: {
    padding: 20,
  },
  readingCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  readingInfo: {
    flex: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
  },
  readingDate: {
    fontSize: 12,
    color: '#666',
  },
  readingQuestion: {
    fontSize: 16,
    color: '#E8E8E8',
    lineHeight: 22,
    marginBottom: 10,
  },
  readingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spreadType: {
    fontSize: 12,
    color: '#9B59B6',
    backgroundColor: '#9B59B633',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  expandedContent: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cardsPreview: {
    marginBottom: 15,
  },
  cardsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 8,
  },
  cardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardPosition: {
    fontSize: 12,
    color: '#9B59B6',
    minWidth: 120,
  },
  cardName: {
    fontSize: 12,
    color: '#E8E8E8',
    flex: 1,
  },
  interpretationPreview: {},
  interpretationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 8,
  },
  interpretationText: {
    fontSize: 13,
    color: '#B8B8B8',
    lineHeight: 18,
  },
});