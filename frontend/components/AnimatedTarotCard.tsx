import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface TarotCard {
  id: number;
  name: string;
  type: string;
  image?: ImageSourcePropType;
  keywords: string[];
  is_reversed: boolean;
}

interface AnimatedTarotCardProps {
  card: TarotCard;
  position: string;
  index: number;
  revealed: boolean;
  cardBackImage: string;
  onReveal: () => void;
}

export const AnimatedTarotCard: React.FC<AnimatedTarotCardProps> = ({
  card,
  position,
  index,
  revealed,
  cardBackImage,
  onReveal,
}) => {
  // Animation values
  const scale = useSharedValue(0);
  const rotateY = useSharedValue(revealed ? 180 : 0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  // Card entrance animation
  useEffect(() => {
    scale.value = withDelay(
      index * 150,
      withSpring(1, {
        damping: 12,
        stiffness: 100,
      })
    );

    opacity.value = withDelay(
      index * 150,
      withTiming(1, {
        duration: 400,
      })
    );

    translateY.value = withDelay(
      index * 150,
      withSpring(0, {
        damping: 10,
        stiffness: 80,
      })
    );
  }, []);

  // Flip animation when revealed
  useEffect(() => {
    if (revealed) {
      rotateY.value = withSequence(
        withTiming(90, {
          duration: 250,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        withTiming(180, {
          duration: 250,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      );
    }
  }, [revealed]);

  const cardContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ],
      opacity: opacity.value,
    };
  });

  const cardStyle = useAnimatedStyle(() => {
    const rotateYDeg = `${rotateY.value}deg`;

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: rotateYDeg },
      ],
    };
  });

  const frontFaceStyle = useAnimatedStyle(() => {
    const frontOpacity = interpolate(
      rotateY.value,
      [0, 90, 180],
      [1, 0, 0]
    );

    return {
      opacity: frontOpacity,
      backfaceVisibility: 'hidden' as const,
    };
  });

  const backFaceStyle = useAnimatedStyle(() => {
    const backOpacity = interpolate(
      rotateY.value,
      [0, 90, 180],
      [0, 0, 1]
    );

    return {
      opacity: backOpacity,
      // Без backfaceVisibility: 'hidden'. Родитель при открытии повёрнут на 180°,
      // и лицо карты доворачивается ещё на 180°, чтобы не быть зеркальным.
      // На вебе (react-native-web) у родителя нет transform-style: preserve-3d,
      // поэтому поворот ребёнка сплющивается в плоскость родителя и браузер
      // считает грань «обратной» — с 'hidden' лицевая сторона просто исчезала.
      // Какая грань видна, полностью решает opacity выше, так что скрытие
      // по backface не нужно ни на вебе, ни на нативе.
      transform: [{ rotateY: '180deg' }],
    };
  });

  return (
    <Animated.View style={[styles.cardContainer, cardContainerStyle]}>
      <TouchableOpacity
        onPress={!revealed ? onReveal : undefined}
        activeOpacity={revealed ? 1 : 0.8}
        disabled={revealed}
      >
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Card Back (Face Down) */}
          <Animated.View style={[styles.cardFace, styles.cardBack, frontFaceStyle]}>
            {cardBackImage && cardBackImage.startsWith('data:image') ? (
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
                <Text style={styles.cardBackIcon}>🌙</Text>
                <Text style={styles.tapToReveal}>Нажмите для открытия</Text>
              </LinearGradient>
            )}
          </Animated.View>

          {/* Card Front (Face Up) */}
          <Animated.View style={[styles.cardFace, styles.cardFront, backFaceStyle]}>
            {card.image ? (
              <View style={styles.cardContent}>
                <Image
                  source={card.image}
                  // Перевёрнутая карта — тот же скан, развёрнутый на 180°
                  style={[styles.cardImage, card.is_reversed && styles.cardImageReversed]}
                  resizeMode="cover"
                />
                <View style={styles.cardOverlay}>
                  <Text style={styles.cardName}>{card.name}</Text>
                  {card.is_reversed && (
                    <Text style={styles.reversedIndicator}>⚌ Перевёрнутая</Text>
                  )}
                </View>
              </View>
            ) : (
              <LinearGradient
                colors={card.is_reversed ? ['#8E44AD', '#6C3483'] : ['#9B59B6', '#8E44AD']}
                style={styles.cardImageFallback}
              >
                <Text style={styles.cardNameLarge}>{card.name}</Text>
                <Text style={styles.cardType}>
                  {card.type === 'major' ? 'Старший аркан' : 'Младший аркан'}
                </Text>
                {card.is_reversed && (
                  <Text style={styles.reversedIndicatorLarge}>⚌ Перевёрнутая</Text>
                )}
                <View style={styles.keywordsContainer}>
                  {card.keywords.slice(0, 3).map((keyword, i) => (
                    <Text key={i} style={styles.keyword}>
                      {keyword}
                    </Text>
                  ))}
                </View>
              </LinearGradient>
            )}
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>

      {/* Position Label */}
      <Animated.Text style={[styles.positionText, cardContainerStyle]}>
        {position}
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  card: {
    width: 200,
    height: 300,
    borderRadius: 15,
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardBack: {},
  cardFront: {},
  cardContent: {
    flex: 1,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageReversed: {
    transform: [{ rotate: '180deg' }],
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // Кроет нижнюю кромку скана с напечатанным английским названием,
    // иначе оно просвечивает сквозь русскую подпись
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    padding: 10,
  },
  cardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  reversedIndicator: {
    fontSize: 10,
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 2,
  },
  cardBackImage: {
    width: '100%',
    height: '100%',
  },
  cardBackFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  tapToReveal: {
    fontSize: 12,
    color: '#B8B8B8',
    textAlign: 'center',
  },
  cardImageFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardNameLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  cardType: {
    fontSize: 12,
    color: '#E8E8E8',
    opacity: 0.8,
    marginBottom: 15,
  },
  reversedIndicatorLarge: {
    fontSize: 12,
    color: '#FFD700',
    marginBottom: 10,
    fontWeight: '600',
  },
  keywordsContainer: {
    alignItems: 'center',
    gap: 5,
  },
  keyword: {
    fontSize: 12,
    color: '#E8E8E8',
    backgroundColor: '#FFFFFF33',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  positionText: {
    fontSize: 14,
    color: '#9B59B6',
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
});
