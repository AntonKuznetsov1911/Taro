import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { getOfflineDailyCard, generateTarotCardSVG, getOfflineCardBack, DailyAstrology } from '../src/utils/offlineApi';
import { TarotCard } from '../src/data/tarotCards';
import { useSettings } from '../src/contexts/SettingsContext';
import { playFlip, playReveal } from '../src/utils/sound';

interface DailyCardData {
  card: TarotCard;
  message: string;
  is_reversed: boolean;
  astrology: DailyAstrology;
}

interface DailyCardWidgetProps {
  onViewDetails?: () => void;
}

export const DailyCardWidget: React.FC<DailyCardWidgetProps> = ({ onViewDetails }) => {
  const [dailyCard, setDailyCard] = useState<DailyCardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [cardBackImage, setCardBackImage] = useState<string>('');
  const [cardFrontImage, setCardFrontImage] = useState<ImageSourcePropType | undefined>(undefined);
  const settings = useSettings();

  const scale = useSharedValue(0);
  const containerOpacity = useSharedValue(0);
  const flipProgress = useSharedValue(0);

  const revealChimeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadDailyCard();
    return () => {
      if (revealChimeTimer.current) clearTimeout(revealChimeTimer.current);
    };
  }, []);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    containerOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  const loadDailyCard = async () => {
    try {
      const cardBack = await getOfflineCardBack();
      setCardBackImage(cardBack);

      const data = await getOfflineDailyCard();
      setDailyCard(data);

      const cardImage = generateTarotCardSVG(data.card, data.is_reversed);
      setCardFrontImage(cardImage);
    } catch (error) {
      console.error('Ошибка загрузки карты дня:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReveal = () => {
    if (!revealed) {
      setRevealed(true);
      flipProgress.value = withTiming(1, { duration: 600 });

      const soundOptions = {
        soundEnabled: settings.soundEnabled,
        vibration: settings.vibration,
        volume: settings.effectsVolume,
      };
      // Сначала шорох переворота, затем — тёплый тон раскрытия
      void playFlip(soundOptions);
      revealChimeTimer.current = setTimeout(() => {
        void playReveal(soundOptions);
      }, 420);
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: containerOpacity.value,
  }));

  // Анимация рубашки карты (исчезает при перевороте)
  const backCardStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 0.5, 1], [0, 90, 90], Extrapolation.CLAMP);
    const opacity = interpolate(flipProgress.value, [0, 0.5], [1, 0], Extrapolation.CLAMP);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity,
      backfaceVisibility: 'hidden' as const,
    };
  });

  // Анимация лицевой стороны карты (появляется при перевороте)
  const frontCardStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 0.5, 1], [-90, -90, 0], Extrapolation.CLAMP);
    const opacity = interpolate(flipProgress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity,
      backfaceVisibility: 'hidden' as const,
    };
  });

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
        colors={['rgba(155, 89, 182, 0.08)', 'rgba(155, 89, 182, 0.02)']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.moonEmoji}>{dailyCard.astrology?.moon.emoji || '🌙'}</Text>
            <Text style={styles.title}>Карта дня</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.moonPhase}>{dailyCard.astrology?.moon.phaseNameRu || ''}</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
            })}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleReveal} activeOpacity={0.9}>
          <View style={styles.cardContainer}>
            {/* Рубашка карты */}
            <Animated.View style={[styles.cardFace, styles.cardBack, backCardStyle]}>
              {cardBackImage ? (
                <Image
                  source={{ uri: cardBackImage }}
                  style={styles.cardBackImage}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={['#2C3E50', '#34495E']}
                  style={styles.cardBackFallback}
                >
                  <Ionicons name="sparkles" size={32} color="#FFD700" />
                  <Text style={styles.tapText}>Нажмите</Text>
                </LinearGradient>
              )}
            </Animated.View>

            {/* Лицевая сторона */}
            <Animated.View style={[styles.cardFace, styles.cardFront, frontCardStyle]}>
              <View style={styles.revealedContent}>
                {cardFrontImage ? (
                  <Image
                    source={cardFrontImage}
                    // Перевёрнутая карта — тот же скан, развёрнутый на 180°
                    style={[styles.cardImage, dailyCard.is_reversed && styles.cardImageReversed]}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={['#9B59B6', '#8E44AD']}
                    style={styles.cardImageFallback}
                  >
                    <Text style={styles.cardNameFallback}>{dailyCard.card.name}</Text>
                  </LinearGradient>
                )}

                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{dailyCard.card.name}</Text>
                  {dailyCard.is_reversed && (
                    <Text style={styles.reversedText}>⟲ Перевёрнутая</Text>
                  )}
                  {dailyCard.astrology && (
                    <Text style={styles.moonInfo}>
                      {dailyCard.astrology.moon.moonSign.symbol} Луна в знаке {dailyCard.astrology.moon.moonSign.nameRu}
                    </Text>
                  )}
                  <Text style={styles.message} numberOfLines={2}>{dailyCard.message}</Text>
                  <View style={styles.keywords}>
                    {dailyCard.card.keywords.slice(0, 2).map((keyword, index) => (
                      <View key={index} style={styles.keywordBadge}>
                        <Text style={styles.keywordText}>{keyword}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradient: {
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.15)',
    borderRadius: 14,
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
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  moonEmoji: {
    fontSize: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E8E8E8',
  },
  moonPhase: {
    fontSize: 10,
    color: '#9B59B6',
    fontWeight: '500',
  },
  date: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  cardContainer: {
    height: 140,
    position: 'relative',
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardBack: {
    zIndex: 2,
  },
  cardFront: {
    zIndex: 1,
  },
  cardBackImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  cardBackFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  tapText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E8E8E8',
  },
  revealedContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 8,
    backgroundColor: 'rgba(30, 30, 30, 0.6)',
    borderRadius: 10,
  },
  cardImage: {
    width: 85,
    height: '100%',
    borderRadius: 6,
  },
  cardImageReversed: {
    transform: [{ rotate: '180deg' }],
  },
  cardImageFallback: {
    width: 85,
    height: '100%',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  cardNameFallback: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#E8E8E8',
    marginBottom: 2,
  },
  reversedText: {
    fontSize: 10,
    color: '#FFD700',
    marginBottom: 2,
  },
  moonInfo: {
    fontSize: 9,
    color: '#9B59B6',
    marginBottom: 3,
  },
  message: {
    fontSize: 11,
    color: '#C0C0C0',
    lineHeight: 16,
    marginBottom: 6,
  },
  keywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  keywordBadge: {
    backgroundColor: 'rgba(155, 89, 182, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  keywordText: {
    fontSize: 9,
    color: '#E8E8E8',
    fontWeight: '500',
  },
});
