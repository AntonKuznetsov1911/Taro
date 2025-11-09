import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Skeleton loader component for loading states
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#2C3E50',
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Skeleton for card loading state
 */
export const CardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.cardHeader}>
        <SkeletonLoader width={60} height={24} borderRadius={12} />
        <SkeletonLoader width={120} height={16} />
      </View>
      <SkeletonLoader width="100%" height={60} style={{ marginVertical: 10 }} />
      <View style={styles.cardFooter}>
        <SkeletonLoader width={80} height={20} />
        <SkeletonLoader width={100} height={20} />
      </View>
    </View>
  );
};

/**
 * Skeleton for history list
 */
export const HistoryListSkeleton: React.FC = () => {
  return (
    <View style={styles.listSkeleton}>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </View>
  );
};

/**
 * Skeleton for tarot card
 */
export const TarotCardSkeleton: React.FC = () => {
  return (
    <View style={styles.tarotCardSkeleton}>
      <SkeletonLoader width={200} height={300} borderRadius={15} />
      <SkeletonLoader width={150} height={20} style={{ marginTop: 10 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  cardSkeleton: {
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listSkeleton: {
    padding: 20,
  },
  tarotCardSkeleton: {
    alignItems: 'center',
    marginVertical: 10,
  },
});
