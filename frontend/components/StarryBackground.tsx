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

const STAR_LAYERS = {
  tiny: 400,
  small: 150,
  medium: 30,
  bright: 10,
};

const SHOOTING_STAR_COUNT = 2;

interface Star {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleDelay: number;
  layer: 'tiny' | 'small' | 'medium' | 'bright';
}

interface ShootingStar {
  id: string;
  startX: number;
  startY: number;
  angle: number;
  duration: number;
  delay: number;
}

const starColors = {
  blue: ['#c8e4ff', '#a8d4ff', '#7ec8e3'],
  white: ['#ffffff', '#f8f9fa', '#ecf0f1'],
  yellow: ['#fff8e7', '#fff3cd'],
};

const getRandomColor = (layer: string): string => {
  const rand = Math.random();
  if (layer === 'bright') {
    if (rand < 0.4) return starColors.blue[Math.floor(Math.random() * starColors.blue.length)];
    if (rand < 0.8) return starColors.white[Math.floor(Math.random() * starColors.white.length)];
    return starColors.yellow[Math.floor(Math.random() * starColors.yellow.length)];
  }
  if (rand < 0.7) return starColors.white[Math.floor(Math.random() * starColors.white.length)];
  return starColors.blue[Math.floor(Math.random() * starColors.blue.length)];
};

const generateStars = (): Star[] => {
  const stars: Star[] = [];

  const createStarsForLayer = (count: number, layer: 'tiny' | 'small' | 'medium' | 'bright') => {
    const sizeRanges = {
      tiny: [0.2, 0.5],
      small: [0.5, 1.0],
      medium: [1.0, 1.8],
      bright: [1.8, 2.8],
    };
    const opacityRanges = {
      tiny: [0.15, 0.4],
      small: [0.3, 0.6],
      medium: [0.5, 0.85],
      bright: [0.75, 1],
    };

    for (let i = 0; i < count; i++) {
      const [minSize, maxSize] = sizeRanges[layer];
      const [minOpacity, maxOpacity] = opacityRanges[layer];

      let y = Math.random() * height;
      const milkyWayBias = Math.random();
      if (milkyWayBias < 0.35) {
        y = height * 0.35 + Math.random() * height * 0.3;
      }

      stars.push({
        id: `${layer}-${i}`,
        x: Math.random() * width,
        y,
        size: Math.random() * (maxSize - minSize) + minSize,
        color: getRandomColor(layer),
        baseOpacity: Math.random() * (maxOpacity - minOpacity) + minOpacity,
        twinkleSpeed: Math.random() * 2000 + 2000,
        twinkleDelay: Math.random() * 4000,
        layer,
      });
    }
  };

  createStarsForLayer(STAR_LAYERS.tiny, 'tiny');
  createStarsForLayer(STAR_LAYERS.small, 'small');
  createStarsForLayer(STAR_LAYERS.medium, 'medium');
  createStarsForLayer(STAR_LAYERS.bright, 'bright');

  return stars;
};

const generateShootingStars = (): ShootingStar[] => {
  const shootingStars: ShootingStar[] = [];

  for (let i = 0; i < SHOOTING_STAR_COUNT; i++) {
    const startX = Math.random() * width * 0.9 + width * 0.05;
    const startY = -20;
    // Разные углы падения (65-115 градусов)
    const angle = Math.random() * 50 + 65;

    shootingStars.push({
      id: `shooting-${i}`,
      startX,
      startY,
      angle,
      duration: Math.random() * 150 + 100, // 100-250ms (в 3 раза быстрее)
      // Хаотичные интервалы
      delay: Math.random() * 25000 + Math.random() * 20000 + i * 18000,
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
    const minOpacity = star.layer === 'tiny' ? star.baseOpacity * 0.3 :
                       star.layer === 'small' ? star.baseOpacity * 0.4 :
                       star.baseOpacity * 0.6;

    opacity.value = withDelay(
      star.twinkleDelay,
      withRepeat(
        withSequence(
          withTiming(minOpacity, {
            duration: star.twinkleSpeed * 0.35,
            easing: Easing.inOut(Easing.sine),
          }),
          withTiming(star.baseOpacity * 1.1, {
            duration: star.twinkleSpeed * 0.3,
            easing: Easing.inOut(Easing.sine),
          }),
          withTiming(star.baseOpacity * 0.7, {
            duration: star.twinkleSpeed * 0.35,
            easing: Easing.inOut(Easing.sine),
          })
        ),
        -1,
        false
      )
    );

    if (star.layer === 'bright' || star.layer === 'medium') {
      scale.value = withDelay(
        star.twinkleDelay,
        withRepeat(
          withSequence(
            withTiming(0.95, {
              duration: star.twinkleSpeed * 0.35,
              easing: Easing.inOut(Easing.sine),
            }),
            withTiming(1.15, {
              duration: star.twinkleSpeed * 0.3,
              easing: Easing.inOut(Easing.sine),
            }),
            withTiming(1, {
              duration: star.twinkleSpeed * 0.35,
              easing: Easing.inOut(Easing.sine),
            })
          ),
          -1,
          false
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
          shadowRadius: star.layer === 'bright' ? star.size * 1.5 :
                       star.layer === 'medium' ? star.size : 0,
          shadowOpacity: star.layer === 'bright' ? 0.9 :
                        star.layer === 'medium' ? 0.6 : 0,
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
    const startX = Math.random() * width * 0.9 + width * 0.05;
    const startY = -20;
    const angle = Math.random() * 60 + 60;
    const radians = (angle * Math.PI) / 180;
    const distance = height * 0.7 + Math.random() * height * 0.3;

    translateX.value = startX;
    translateY.value = startY;

    const endX = startX + Math.cos(radians) * distance;
    const endY = startY + Math.sin(radians) * distance;

    const duration = Math.random() * 800 + 600;

    opacity.value = withSequence(
      withTiming(1, { duration: 50 }),
      withTiming(0.9, { duration: duration - 100 }),
      withTiming(0, { duration: 50 })
    );

    translateX.value = withTiming(endX, {
      duration,
      easing: Easing.out(Easing.quad),
    });

    translateY.value = withTiming(endY, {
      duration,
      easing: Easing.out(Easing.quad),
    }, (finished) => {
      if (finished) {
        const nextDelay = Math.random() * 18000 + 15000;
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
    <Animated.View style={[styles.shootingStar, animatedStyle]} />
  );
};

export const StarryBackground: React.FC = () => {
  const starsRef = useRef<Star[]>(generateStars());
  const shootingStarsRef = useRef<ShootingStar[]>(generateShootingStars());

  return (
    <View style={styles.container}>
      {/* Млечный Путь */}
      <View style={styles.milkyWay} />
      <View style={styles.dustLane} />

      {/* Туманности */}
      <View style={[styles.nebula, { left: '5%', top: '38%', backgroundColor: 'rgba(160, 80, 60, 0.06)' }]} />
      <View style={[styles.nebula, { right: '10%', top: '42%', backgroundColor: 'rgba(180, 130, 80, 0.04)', width: 160, height: 110 }]} />

      {/* Звёзды */}
      {starsRef.current.map((star) => (
        <StarComponent key={star.id} star={star} />
      ))}

      {/* Падающие звёзды */}
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
    backgroundColor: '#000000',
  },
  milkyWay: {
    position: 'absolute',
    left: -width * 0.1,
    top: height * 0.32,
    width: width * 1.2,
    height: height * 0.36,
    backgroundColor: 'rgba(180, 160, 140, 0.02)',
    borderRadius: 999,
    transform: [{ rotate: '-5deg' }],
  },
  dustLane: {
    position: 'absolute',
    left: 0,
    top: height * 0.44,
    width: width,
    height: height * 0.12,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    transform: [{ rotate: '-3deg' }],
  },
  nebula: {
    position: 'absolute',
    width: 140,
    height: 90,
    borderRadius: 999,
    opacity: 0.6,
  },
  star: {
    position: 'absolute',
    borderRadius: 50,
    shadowOffset: { width: 0, height: 0 },
  },
  shootingStar: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
});
