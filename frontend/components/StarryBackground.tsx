import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const STAR_COUNT = 150;
const SHOOTING_STAR_COUNT = 2;

interface Star {
  id: string | number;
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinkleDuration: number;
  twinkleDelay: number;
  twinkleIntensity: number;
  color: string;
}

interface ShootingStar {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  delay: number;
}

const generateStars = (): Star[] => {
  const stars: Star[] = [];
  const starColors = ['#FFFFFF', '#FFF8E7', '#E6F0FF', '#FFE4C4', '#B0C4DE'];

  for (let i = 0; i < STAR_COUNT; i++) {
    const sizeRandom = Math.random();
    const isBright = sizeRandom > 0.85;

    stars.push({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: isBright ? Math.random() * 2 + 1.5 : Math.random() * 1.2 + 0.3,
      baseOpacity: isBright ? Math.random() * 0.3 + 0.7 : Math.random() * 0.4 + 0.2,
      twinkleDuration: Math.random() * 3000 + 2000, // 2-5 секунд
      twinkleDelay: Math.random() * 5000,
      twinkleIntensity: isBright ? 0.4 : 0.2,
      color: starColors[Math.floor(Math.random() * starColors.length)],
    });
  }

  return stars;
};

const generateShootingStars = (): ShootingStar[] => {
  const shootingStars: ShootingStar[] = [];

  for (let i = 0; i < SHOOTING_STAR_COUNT; i++) {
    const side = Math.floor(Math.random() * 3);
    let startX: number, startY: number, endX: number, endY: number;

    switch (side) {
      case 0: // Сверху вправо-вниз
        startX = Math.random() * width * 0.5;
        startY = -20;
        endX = startX + Math.random() * width * 0.5 + 100;
        endY = height * 0.6 + Math.random() * height * 0.3;
        break;
      case 1: // Справа влево-вниз
        startX = width + 20;
        startY = Math.random() * height * 0.3;
        endX = Math.random() * width * 0.3;
        endY = startY + height * 0.4 + Math.random() * height * 0.3;
        break;
      default: // Сверху влево-вниз
        startX = Math.random() * width * 0.5 + width * 0.5;
        startY = -20;
        endX = startX - Math.random() * width * 0.4 - 50;
        endY = height * 0.5 + Math.random() * height * 0.4;
    }

    shootingStars.push({
      id: `shooting-${i}`,
      startX,
      startY,
      endX,
      endY,
      duration: Math.random() * 2000 + 1500, // 1.5-3.5 секунды пролета
      delay: Math.random() * 20000 + 15000 + i * 15000, // 15-35+ секунд между звездами
    });
  }

  return shootingStars;
};

interface StarComponentProps {
  star: Star;
}

const StarComponent: React.FC<StarComponentProps> = ({ star }) => {
  const opacity = useSharedValue(star.baseOpacity);
  const scale = useSharedValue(1);

  useEffect(() => {
    const minOpacity = Math.max(0.1, star.baseOpacity - star.twinkleIntensity);
    const maxOpacity = Math.min(1, star.baseOpacity + star.twinkleIntensity * 0.5);

    opacity.value = withDelay(
      star.twinkleDelay,
      withRepeat(
        withSequence(
          withTiming(minOpacity, {
            duration: star.twinkleDuration * 0.4,
            easing: Easing.inOut(Easing.sine),
          }),
          withTiming(maxOpacity, {
            duration: star.twinkleDuration * 0.3,
            easing: Easing.inOut(Easing.sine),
          }),
          withTiming(star.baseOpacity * 0.85, {
            duration: star.twinkleDuration * 0.3,
            easing: Easing.inOut(Easing.sine),
          })
        ),
        -1,
        false
      )
    );

    if (star.size > 1.5) {
      scale.value = withDelay(
        star.twinkleDelay,
        withRepeat(
          withSequence(
            withTiming(0.9, {
              duration: star.twinkleDuration * 0.5,
              easing: Easing.inOut(Easing.sine),
            }),
            withTiming(1.15, {
              duration: star.twinkleDuration * 0.5,
              easing: Easing.inOut(Easing.sine),
            })
          ),
          -1,
          true
        )
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: star.x,
          top: star.y,
          width: star.size,
          height: star.size,
          backgroundColor: star.color,
          shadowColor: star.color,
          shadowRadius: star.size > 1.5 ? 3 : 1,
          shadowOpacity: star.size > 1.5 ? 0.8 : 0.4,
        },
        animatedStyle,
      ]}
    />
  );
};

interface ShootingStarComponentProps {
  star: ShootingStar;
}

const ShootingStarComponent: React.FC<ShootingStarComponentProps> = ({ star }) => {
  const translateX = useSharedValue(star.startX);
  const translateY = useSharedValue(star.startY);
  const opacity = useSharedValue(0);

  const animateShootingStar = () => {
    opacity.value = 0;
    translateX.value = star.startX;
    translateY.value = star.startY;

    // Случайные новые координаты для следующего пролета
    const side = Math.floor(Math.random() * 3);
    let newStartX: number, newStartY: number, newEndX: number, newEndY: number;

    switch (side) {
      case 0:
        newStartX = Math.random() * width * 0.5;
        newStartY = -20;
        newEndX = newStartX + Math.random() * width * 0.5 + 100;
        newEndY = height * 0.6 + Math.random() * height * 0.3;
        break;
      case 1:
        newStartX = width + 20;
        newStartY = Math.random() * height * 0.3;
        newEndX = Math.random() * width * 0.3;
        newEndY = newStartY + height * 0.4 + Math.random() * height * 0.3;
        break;
      default:
        newStartX = Math.random() * width * 0.5 + width * 0.5;
        newStartY = -20;
        newEndX = newStartX - Math.random() * width * 0.4 - 50;
        newEndY = height * 0.5 + Math.random() * height * 0.4;
    }

    translateX.value = newStartX;
    translateY.value = newStartY;

    const duration = Math.random() * 2000 + 1500;

    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(1, { duration: duration - 300 }),
      withTiming(0, { duration: 200 })
    );

    translateX.value = withTiming(newEndX, {
      duration: duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    translateY.value = withTiming(newEndY, {
      duration: duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }, (finished) => {
      if (finished) {
        const nextDelay = Math.random() * 20000 + 18000;
        runOnJS(setTimeout)(animateShootingStar, nextDelay);
      }
    });
  };

  useEffect(() => {
    setTimeout(animateShootingStar, star.delay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.shootingStar,
        animatedStyle,
      ]}
    />
  );
};

export const StarryBackground: React.FC = () => {
  const starsRef = useRef<Star[]>(generateStars());
  const shootingStarsRef = useRef<ShootingStar[]>(generateShootingStars());

  return (
    <View style={styles.container}>
      {/* Тонкие туманности */}
      <View style={[styles.nebula, { left: '5%', top: '10%', width: 200, height: 200, backgroundColor: 'rgba(80, 40, 100, 0.04)' }]} />
      <View style={[styles.nebula, { right: '10%', bottom: '25%', width: 250, height: 250, backgroundColor: 'rgba(40, 60, 100, 0.03)' }]} />

      {/* Далекие планеты */}
      <View style={[styles.planet, { right: '10%', top: '12%', width: 20, height: 20, backgroundColor: '#8B4513' }]} />
      <View style={[styles.planet, { left: '8%', bottom: '20%', width: 14, height: 14, backgroundColor: '#CD853F' }]} />

      {/* Статичные далекие звезды */}
      {[...Array(40)].map((_, i) => (
        <View
          key={`distant-${i}`}
          style={[
            styles.distantStar,
            {
              left: Math.random() * width,
              top: Math.random() * height,
              opacity: Math.random() * 0.25 + 0.1,
            },
          ]}
        />
      ))}

      {/* Основные мерцающие звезды */}
      {starsRef.current.map((star) => (
        <StarComponent key={star.id} star={star} />
      ))}

      {/* Падающие звезды */}
      {shootingStarsRef.current.map((star) => (
        <ShootingStarComponent key={star.id} star={star} />
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
    zIndex: 0,
    backgroundColor: '#000005',
  },
  star: {
    position: 'absolute',
    borderRadius: 50,
    shadowOffset: { width: 0, height: 0 },
  },
  shootingStar: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  nebula: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.5,
  },
  planet: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  distantStar: {
    position: 'absolute',
    width: 0.8,
    height: 0.8,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
  },
});
