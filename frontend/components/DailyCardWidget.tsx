import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface DailyCard {
  id: number;
  name: string;
  type: string;
  image?: string;
  keywords: string[];
  upright_meaning: string;
  is_reversed: boolean;
  message: string;
}

interface DailyCardWidgetProps {
  onViewDetails?: () => void;
}

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export const DailyCardWidget: React.FC<DailyCardWidgetProps> = ({ onViewDetails }) => {
  const [dailyCard, setDailyCard] = useState<DailyCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [lastFetchDate, setLastFetchDate] = useState<string | null>(null);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotateY = useSharedValue(0);

  useEffect(() => {
    checkAndFetchDailyCard();
  }, []);

  useEffect(() => {
    // Entrance animation
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  const checkAndFetchDailyCard = async () => {
    const today = new Date().toDateString();

    // Check if we already have today's card in storage
    // In a real app, you'd use AsyncStorage here
    const storedDate = lastFetchDate;

    if (storedDate === today && dailyCard) {
      setRevealed(true);
      setIsLoading(false);
      return;
    }

    await fetchDailyCard();
  };

  const fetchDailyCard = async () => {
    try {
      // In a real implementation, this would be a dedicated endpoint
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/daily-card`);

      if (!response.ok) {
        throw new Error('Failed to fetch daily card');
      }

      const data = await response.json();
      setDailyCard(data);
      setLastFetchDate(new Date().toDateString());
    } catch (error) {
      console.error('Error fetching daily card:', error);
      // Fallback to a random motivational message
      setDailyCard({
        id: 0,
        name: 'Карта дня',
        type: 'major',
        keywords: ['вдохновение', 'рост', 'возможности'],
        upright_meaning: 'Сегодня день полон возможностей',
        is_reversed: false,
        message: 'Доверьтесь процессу и будьте открыты новому!',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReveal = () => {
    setRevealed(true);
    rotateY.value = withSequence(
      withTiming(90, { duration: 250 }),
      withTiming(180, { duration: 250 })
    );
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#9B59B6" />
        <Text style={styles.loadingText}>Выбираем карту дня...</Text>
      </View>
    );
  }

  if (!dailyCard) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={['rgba(155, 89, 182, 0.15)', 'rgba(155, 89, 182, 0.05)']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="sunny" size={20} color="#FFD700" />
            <Text style={styles.title}>Карта дня</Text>
          </View>
          <Text style={styles.date}>{new Date().toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
          })}</Text>
        </View>

        {!revealed ? (
          <TouchableOpacity onPress={handleReveal} activeOpacity={0.8}>
            <Animated.View style={[styles.cardPreview, cardStyle]}>
              <LinearGradient
                colors={['#2C3E50', '#34495E']}
                style={styles.cardBack}
              >
                <Ionicons name="sparkles" size={40} color="#FFD700" />
                <Text style={styles.revealText}>Нажмите, чтобы открыть</Text>
                <Text style={styles.revealSubtext}>вашу карту дня</Text>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        ) : (
          <Animated.View style={cardStyle}>
            <View style={styles.revealedCard}>
              {dailyCard.image ? (
                <Image
                  source={{ uri: dailyCard.image }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={['#9B59B6', '#8E44AD']}
                  style={styles.cardImageFallback}
                >
                  <Text style={styles.cardName}>{dailyCard.name}</Text>
                </LinearGradient>
              )}

              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{dailyCard.name}</Text>
                {dailyCard.is_reversed && (
                  <Text style={styles.reversedText}>⚌ Перевёрнутая</Text>
                )}

                <Text style={styles.message}>{dailyCard.message || dailyCard.upright_meaning}</Text>

                <View style={styles.keywords}>
                  {dailyCard.keywords.slice(0, 3).map((keyword, index) => (
                    <View key={index} style={styles.keywordBadge}>
                      <Text style={styles.keywordText}>{keyword}</Text>
                    </View>
                  ))}
                </View>

                {onViewDetails && (
                  <TouchableOpacity style={styles.detailsButton} onPress={onViewDetails}>
                    <Text style={styles.detailsButtonText}>Подробнее</Text>
                    <Ionicons name="arrow-forward" size={16} color="#9B59B6" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Animated.View>
        )}

        {revealed && (
          <View style={styles.footer}>
            <Ionicons name="information-circle-outline" size={14} color="#888" />
            <Text style={styles.footerText}>
              Медитируйте на эту карту в течение дня
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
    borderRadius: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#9B59B6',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E8E8E8',
  },
  date: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  cardPreview: {
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardBack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  revealText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E8E8E8',
    marginTop: 8,
  },
  revealSubtext: {
    fontSize: 12,
    color: '#B8B8B8',
  },
  revealedCard: {
    flexDirection: 'row',
    gap: 12,
  },
  cardImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  cardImageFallback: {
    width: 80,
    height: 120,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  cardName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E8E8E8',
    marginBottom: 4,
  },
  reversedText: {
    fontSize: 11,
    color: '#FFD700',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: '#D0D0D0',
    lineHeight: 20,
    marginBottom: 8,
  },
  keywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  keywordBadge: {
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  keywordText: {
    fontSize: 11,
    color: '#E8E8E8',
    fontWeight: '500',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsButtonText: {
    fontSize: 13,
    color: '#9B59B6',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(155, 89, 182, 0.2)',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
});
