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
const STAR_COUNT = 120; // Увеличено общее количество звезд
const SHOOTING_STAR_COUNT = 2; // Уменьшено количество движущихся звезд
const CONSTELLATION_COUNT = 8; // Количество созвездий
const GALAXY_STARS = 30; // Звезды для галактики

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDuration: number;
  type: 'static' | 'moving' | 'constellation' | 'galaxy';
  constellationId?: number;
}

// Генерация созвездий
const generateConstellations = (): Star[] => {
  const constellationStars: Star[] = [];
  
  for (let c = 0; c < CONSTELLATION_COUNT; c++) {
    // Центр созвездия
    const centerX = Math.random() * (width - 100) + 50;
    const centerY = Math.random() * (height - 100) + 50;
    const starsInConstellation = Math.random() * 4 + 3; // 3-6 звезд в созвездии
    
    for (let s = 0; s < starsInConstellation; s++) {
      const angle = (s / starsInConstellation) * Math.PI * 2;
      const distance = Math.random() * 40 + 20; // Расстояние от центра
      
      constellationStars.push({
        id: `constellation-${c}-${s}`,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        size: Math.random() * 2 + 2, // Размер от 2 до 4
        opacity: Math.random() * 0.4 + 0.6, // Прозрачность от 0.6 до 1
        animationDuration: Math.random() * 2000 + 4000, // 4-6 секунд
        type: 'constellation',
        constellationId: c
      });
    }
  }
  
  return constellationStars;
};

// Генерация галактики
const generateGalaxy = (): Star[] => {
  const galaxyStars: Star[] = [];
  const galaxyX = width * 0.8; // Правый верхний угол
  const galaxyY = height * 0.2;
  
  for (let i = 0; i < GALAXY_STARS; i++) {
    const angle = (i / GALAXY_STARS) * Math.PI * 4; // 2 оборота спирали
    const distance = (i / GALAXY_STARS) * 60; // Увеличиваем расстояние
    
    galaxyStars.push({
      id: `galaxy-${i}`,
      x: galaxyX + Math.cos(angle) * distance,
      y: galaxyY + Math.sin(angle) * distance * 0.7, // Сплюснутая спираль
      size: Math.random() * 1.5 + 0.5, // Мелкие звезды
      opacity: Math.random() * 0.6 + 0.4,
      animationDuration: Math.random() * 3000 + 3000, // 3-6 секунд
      type: 'galaxy'
    });
  }
  
  return galaxyStars;
};

// Генерация случайных звезд
const generateStars = (): Star[] => {
  const stars: Star[] = [];
  
  // Обычные статичные мерцающие звезды
  for (let i = 0; i < STAR_COUNT - SHOOTING_STAR_COUNT; i++) {
    stars.push({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5, // Размер от 0.5 до 2.5 (мельче)
      opacity: Math.random() * 0.8 + 0.2, // Прозрачность от 0.2 до 1
      animationDuration: Math.random() * 4000 + 3000, // 3-7 секунд (медленнее)
      type: 'static'
    });
  }
  
  // Движущиеся звезды с разными траекториями
  for (let i = 0; i < SHOOTING_STAR_COUNT; i++) {
    const startSide = Math.floor(Math.random() * 4); // 0: слева, 1: сверху, 2: справа, 3: снизу
    let startX, startY;
    
    switch(startSide) {
      case 0: // слева
        startX = -20;
        startY = Math.random() * height;
        break;
      case 1: // сверху
        startX = Math.random() * width;
        startY = -20;
        break;
      case 2: // справа
        startX = width + 20;
        startY = Math.random() * height;
        break;
      case 3: // снизу
        startX = Math.random() * width;
        startY = height + 20;
        break;
    }
    
    stars.push({
      id: `moving-${i}`,
      x: startX,
      y: startY,
      size: Math.random() * 1.5 + 1.5, // Размер от 1.5 до 3
      opacity: 0.9,
      animationDuration: Math.random() * 12000 + 8000, // 8-20 секунд (медленнее)
      type: 'moving'
    });
  }
  
  // Добавляем созвездия
  stars.push(...generateConstellations());
  
  // Добавляем галактику
  stars.push(...generateGalaxy());
  
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
    boxShadow: '0px 0px 2px rgba(255, 255, 255, 0.8)',
    elevation: 2,
  },
});