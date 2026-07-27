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
  tiny: 300,
  small: 100,
  medium: 35,
  bright: 15,
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
  endX: number;
  endY: number;
  duration: number;
  delay: number;
}

const starColors = {
  blue: ['#a8d4ff', '#7ec8e3', '#5dade2', '#85c1e9'],
  white: ['#ffffff', '#f8f9fa', '#ecf0f1', '#fdfefe'],
  yellow: ['#fff3cd', '#ffeaa7', '#f9e79f'],
  orange: ['#ffcc80', '#ffb74d', '#ffa726'],
};

const getRandomColor = (layer: string): string => {
  const rand = Math.random();
  if (layer === 'bright') {
    if (rand < 0.4) return starColors.blue[Math.floor(Math.random() * starColors.blue.length)];
    if (rand < 0.7) return starColors.white[Math.floor(Math.random() * starColors.white.length)];
    if (rand < 0.9) return starColors.yellow[Math.floor(Math.random() * starColors.yellow.length)];
    return starColors.orange[Math.floor(Math.random() * starColors.orange.length)];
  }
  if (rand < 0.6) return starColors.white[Math.floor(Math.random() * starColors.white.length)];
  if (rand < 0.85) return starColors.blue[Math.floor(Math.random() * starColors.blue.length)];
  return starColors.yellow[Math.floor(Math.random() * starColors.yellow.length)];
};

const generateStars = (): Star[] => {
  const stars: Star[] = [];

  const createStarsForLayer = (count: number, layer: 'tiny' | 'small' | 'medium' | 'bright') => {
    const sizeRanges = {
      tiny: [0.3, 0.8],
      small: [0.8, 1.5],
      medium: [1.5, 2.5],
      bright: [2.5, 4],
    };
    const opacityRanges = {
      tiny: [0.2, 0.5],
      small: [0.4, 0.7],
      medium: [0.6, 0.9],
      bright: [0.8, 1],
    };

    for (let i = 0; i < count; i++) {
      const [minSize, maxSize] = sizeRanges[layer];
      const [minOpacity, maxOpacity] = opacityRanges[layer];

      let y = Math.random() * height;
      const milkyWayBias = Math.random();
      if (milkyWayBias < 0.4) {
        y = height * 0.35 + Math.random() * height * 0.3;
      }

      stars.push({
        id: `${layer}-${i}`,
        x: Math.random() * width,
        y,
        size: Math.random() * (maxSize - minSize) + minSize,
        color: getRandomColor(layer),
        baseOpacity: Math.random() * (maxOpacity - minOpacity) + minOpacity,
        twinkleSpeed: Math.random() * 2000 + 1500,
        twinkleDelay: Math.random() * 3000,
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
    const startFromTop = Math.random() < 0.7;
    let startX: number, startY: number, endX: number, endY: number;

    if (startFromTop) {
      startX = Math.random() * width * 0.8 + width * 0.1;
      startY = -20;
      endX = startX + (Math.random() - 0.5) * width * 0.5;
      endY = height * 0.6 + Math.random() * height * 0.3;
    } else {
      const fromLeft = Math.random() < 0.5;
      startX = fromLeft ? -20 : width + 20;
      startY = Math.random() * height * 0.4;
      endX = fromLeft ? width * 0.6 : width * 0.4;
      endY = height * 0.5 + Math.random() * height * 0.4;
    }

    shootingStars.push({
      id: `shooting-${i}`,
      startX,
      startY,
      endX,
      endY,
      duration: Math.random() * 1500 + 1000,
      delay: Math.random() * 20000 + 15000 + i * 15000,
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
                       star.layer === 'small' ? star.baseOpacity * 0.5 :
                       star.baseOpacity * 0.7;

    opacity.value = withDelay(
      star.twinkleDelay,
      withRepeat(
        withSequence(
          withTiming(minOpacity, {
            duration: star.twinkleSpeed * 0.4,
            easing: Easing.inOut(Easing.sine),
          }),
          withTiming(star.baseOpacity, {
            duration: star.twinkleSpeed * 0.3,
            easing: Easing.inOut(Easing.sine),
          }),
          withTiming(star.baseOpacity * 0.8, {
            duration: star.twinkleSpeed * 0.3,
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
            withTiming(0.9, {
              duration: star.twinkleSpeed * 0.4,
              easing: Easing.inOut(Easing.sine),
            }),
            withTiming(1.2, {
              duration: star.twinkleSpeed * 0.3,
              easing: Easing.inOut(Easing.sine),
            }),
            withTiming(1, {
              duration: star.twinkleSpeed * 0.3,
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
          shadowRadius: star.layer === 'bright' ? star.size * 2 :
                       star.layer === 'medium' ? star.size : 0,
          shadowOpacity: star.layer === 'bright' ? 1 :
                        star.layer === 'medium' ? 0.8 : 0,
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
    const startFromTop = Math.random() < 0.7;
    let newStartX: number, newStartY: number, newEndX: number, newEndY: number;

    if (startFromTop) {
      newStartX = Math.random() * width * 0.8 + width * 0.1;
      newStartY = -20;
      newEndX = newStartX + (Math.random() - 0.5) * width * 0.5;
      newEndY = height * 0.6 + Math.random() * height * 0.3;
    } else {
      const fromLeft = Math.random() < 0.5;
      newStartX = fromLeft ? -20 : width + 20;
      newStartY = Math.random() * height * 0.4;
      newEndX = fromLeft ? width * 0.6 : width * 0.4;
      newEndY = height * 0.5 + Math.random() * height * 0.4;
    }

    translateX.value = newStartX;
    translateY.value = newStartY;

    const duration = Math.random() * 1500 + 1000;

    opacity.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(1, { duration: duration - 200 }),
      withTiming(0, { duration: 120 })
    );

    translateX.value = withTiming(newEndX, {
      duration,
      easing: Easing.out(Easing.quad),
    });

    translateY.value = withTiming(newEndY, {
      duration,
      easing: Easing.out(Easing.quad),
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
    <Animated.View style={[styles.shootingStar, animatedStyle]} />
  );
};

export const StarryBackground: React.FC = () => {
  const starsRef = useRef<Star[]>(generateStars());
  const shootingStarsRef = useRef<ShootingStar[]>(generateShootingStars());

  return (
    <View style={styles.container}>
      {/* Млечный Путь - фоновое свечение */}
      <View style={styles.milkyWay} />
      <View style={styles.dustLane} />

      {/* Туманности */}
      <View style={[styles.nebula, { left: '5%', top: '35%', backgroundColor: 'rgba(180, 100, 80, 0.08)' }]} />
      <View style={[styles.nebula, { right: '10%', top: '40%', backgroundColor: 'rgba(200, 150, 100, 0.06)', width: 200, height: 150 }]} />

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
    top: height * 0.3,
    width: width * 1.2,
    height: height * 0.4,
    backgroundColor: 'rgba(200, 180, 160, 0.03)',
    borderRadius: 999,
    transform: [{ rotate: '-5deg' }],
  },
  dustLane: {
    position: 'absolute',
    left: 0,
    top: height * 0.42,
    width: width,
    height: height * 0.16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    transform: [{ rotate: '-3deg' }],
  },
  nebula: {
    position: 'absolute',
    width: 150,
    height: 100,
    borderRadius: 999,
    opacity: 0.5,
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
    shadowRadius: 6,
  },
});
