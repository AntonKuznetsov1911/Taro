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
const CONSTELLATION_COUNT = 4; // Уменьшено количество созвездий с 8 до 4
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
    const starsInConstellation = Math.random() * 2 + 3; // 3-4 звезды в созвездии (было 3-6)
    
    for (let s = 0; s < starsInConstellation; s++) {
      const angle = (s / starsInConstellation) * Math.PI * 2;
      const distance = Math.random() * 35 + 15; // Немного ближе друг к другу
      
      constellationStars.push({
        id: `constellation-${c}-${s}`,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        size: Math.random() * 1.5 + 1.5, // Размер от 1.5 до 3 (немного меньше)
        opacity: Math.random() * 0.3 + 0.7, // Прозрачность от 0.7 до 1
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
      // Мерцание обычных звезд
      opacity.value = withRepeat(
        withSequence(
          withTiming(star.opacity * 0.2, {
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
    } else if (star.type === 'constellation') {
      // Синхронное мерцание созвездий
      const constellationDelay = (star.constellationId || 0) * 1000; // Задержка между созвездиями
      
      setTimeout(() => {
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

        // Легкое пульсирование размера для созвездий
        scale.value = withRepeat(
          withSequence(
            withTiming(1.5, {
              duration: star.animationDuration * 0.8,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(1, {
              duration: star.animationDuration * 0.8,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          false
        );
      }, constellationDelay);
    } else if (star.type === 'galaxy') {
      // Галактические звезды мерцают быстрее
      opacity.value = withRepeat(
        withSequence(
          withTiming(star.opacity * 0.5, {
            duration: star.animationDuration * 0.5,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(star.opacity, {
            duration: star.animationDuration * 0.5,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );

      // Медленное вращение галактики
      scale.value = withRepeat(
        withTiming(1.2, {
          duration: star.animationDuration * 2,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      // Движение звезд-комет с разными траекториями
      const moveStars = () => {
        // Определяем конечную точку в зависимости от стартовой позиции
        let endX, endY;
        
        if (star.x <= 0) { // Слева
          endX = width + 50;
          endY = Math.random() * height;
        } else if (star.x >= width) { // Справа
          endX = -50;
          endY = Math.random() * height;
        } else if (star.y <= 0) { // Сверху
          endX = Math.random() * width;
          endY = height + 50;
        } else { // Снизу
          endX = Math.random() * width;
          endY = -50;
        }
        
        translateX.value = withTiming(endX, {
          duration: star.animationDuration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Более естественная кривая
        }, (finished) => {
          if (finished) {
            runOnJS(() => {
              // Перезапуск движения с большей паузой
              const startSide = Math.floor(Math.random() * 4);
              let newStartX, newStartY;
              
              switch(startSide) {
                case 0: // слева
                  newStartX = -20;
                  newStartY = Math.random() * height;
                  break;
                case 1: // сверху
                  newStartX = Math.random() * width;
                  newStartY = -20;
                  break;
                case 2: // справа
                  newStartX = width + 20;
                  newStartY = Math.random() * height;
                  break;
                case 3: // снизу
                  newStartX = Math.random() * width;
                  newStartY = height + 20;
                  break;
              }
              
              translateX.value = newStartX;
              translateY.value = newStartY;
              setTimeout(moveStars, Math.random() * 15000 + 10000); // Пауза 10-25 секунд
            })();
          }
        });

        translateY.value = withTiming(endY, {
          duration: star.animationDuration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      };
      
      // Запуск движения с большой задержкой
      setTimeout(moveStars, Math.random() * 20000 + 10000); // 10-30 секунд до первого пролета
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

  // Разные стили для разных типов звезд
  const getStarStyle = () => {
    switch (star.type) {
      case 'constellation':
        return {
          backgroundColor: '#FFD700', // Золотистый для созвездий
          boxShadow: '0px 0px 3px rgba(255, 215, 0, 0.8)',
        };
      case 'galaxy':
        return {
          backgroundColor: '#E6E6FA', // Лавандовый для галактики
          boxShadow: '0px 0px 2px rgba(230, 230, 250, 0.6)',
        };
      case 'moving':
        return {
          backgroundColor: '#87CEEB', // Небесно-голубой для движущихся
          boxShadow: '0px 0px 4px rgba(135, 206, 235, 0.9)',
        };
      default:
        return {
          backgroundColor: '#FFFFFF',
          boxShadow: '0px 0px 2px rgba(255, 255, 255, 0.8)',
        };
    }
  };

  return (
    <Animated.View
      style={[
        styles.star,
        {
          width: star.size,
          height: star.size,
          ...getStarStyle(),
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
    borderRadius: 50,
    elevation: 2,
  },
});