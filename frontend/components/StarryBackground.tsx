import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Конфигурация звезд
const STAR_COUNT = 80; // Общее количество звезд
const SHOOTING_STAR_COUNT = 3; // Количество движущихся звезд

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDuration: number;
  type: 'static' | 'moving';
}

// Генерация случайных звезд
const generateStars = (): Star[] => {
  const stars: Star[] = [];
  
  // Статичные мерцающие звезды
  for (let i = 0; i < STAR_COUNT - SHOOTING_STAR_COUNT; i++) {
    stars.push({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1, // Размер от 1 до 4
      opacity: Math.random() * 0.8 + 0.2, // Прозрачность от 0.2 до 1
      animationDuration: Math.random() * 3000 + 2000, // 2-5 секунд
      type: 'static'
    });
  }
  
  // Движущиеся звезды
  for (let i = STAR_COUNT - SHOOTING_STAR_COUNT; i < STAR_COUNT; i++) {
    stars.push({
      id: i,
      x: -20, // Начальная позиция за экраном
      y: Math.random() * height * 0.7, // В верхней части экрана
      size: Math.random() * 2 + 2, // Размер от 2 до 4
      opacity: 0.9,
      animationDuration: Math.random() * 8000 + 6000, // 6-14 секунд
      type: 'moving'
    });
  }
  
  return stars;
};

interface StarComponentProps {
  star: Star;
}

const StarComponent: React.FC<StarComponentProps> = ({ star }) => {
  const opacity = useSharedValue(star.opacity);
  const translateX = useSharedValue(star.x);
  const translateY = useSharedValue(star.y);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (star.type === 'static') {
      // Мерцание статичных звезд
      opacity.value = withRepeat(
        withSequence(
          withTiming(star.opacity * 0.3, {
            duration: star.animationDuration,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(star.opacity, {
            duration: star.animationDuration,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );

      // Легкое пульсирование размера
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, {
            duration: star.animationDuration * 1.5,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: star.animationDuration * 1.5,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );
    } else {
      // Движение звезд-комет
      const moveStars = () => {
        translateX.value = withTiming(width + 50, {
          duration: star.animationDuration,
          easing: Easing.linear,
        }, (finished) => {
          if (finished) {
            runOnJS(() => {
              // Перезапуск движения
              translateX.value = -20;
              translateY.value = Math.random() * height * 0.7;
              setTimeout(moveStars, Math.random() * 3000 + 1000); // Пауза между пролетами
            })();
          }
        });
      };
      
      // Запуск движения с задержкой
      setTimeout(moveStars, Math.random() * 5000);
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.star,
        {
          width: star.size,
          height: star.size,
        },
        animatedStyle,
      ]}
    />
  );
};

export const StarryBackground: React.FC = () => {
  const starsRef = useRef<Star[]>(generateStars());

  return (
    <View style={styles.container}>
      {starsRef.current.map((star) => (
        <StarComponent key={star.id} star={star} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 0, // Фон
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
});