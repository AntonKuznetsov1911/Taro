import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { generateOfflineAstroPersonality } from '../src/utils/offlineApi';

const MYSTICAL_MESSAGES = [
  '✨ Звёзды выстраиваются в уникальный узор...',
  '🌙 Луна шепчет секреты вашей души...',
  '🔮 Карты Таро раскрывают свои тайны...',
  '🌟 Вселенная собирает ваш энергетический портрет...',
  '💫 Космические вибрации резонируют с вашей сутью...',
  '🎴 Архетипы проявляют свои грани...',
  '✨ Сплетаются нити вашей судьбы...',
  '🌠 Раскрывается карта вашей личности...',
];

export default function AstroAnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [currentMessage, setCurrentMessage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const rotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const starOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    startAnimations();

    // Rotate message every 3 seconds
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % MYSTICAL_MESSAGES.length);
    }, 3000);

    // Call API
    performAnalysis();

    return () => {
      clearInterval(messageInterval);
    };
  }, []);

  const startAnimations = () => {
    // Rotation animation for main circle
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Star twinkle
    Animated.loop(
      Animated.sequence([
        Animated.timing(starOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(starOpacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const performAnalysis = async () => {
    try {
      const answersData = params.answers ? JSON.parse(params.answers as string) : {};

      // Use offline astro personality analysis
      const result = await generateOfflineAstroPersonality(answersData, params.name as string || undefined);

      // Wait at least 3 seconds for dramatic effect
      setTimeout(() => {
        router.replace({
          pathname: '/astro-result',
          params: {
            analysisId: result.id,
            personalityAnalysis: result.personality_analysis,
            dominantArcana: JSON.stringify(result.dominant_arcana),
            characterTraits: JSON.stringify(result.character_traits),
            lifePath: result.life_path,
            currentPhase: result.current_phase,
            advice: result.advice,
          },
        });
      }, 3000);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Не удалось создать анализ. Попробуйте еще раз.');
      setTimeout(() => {
        router.back();
      }, 3000);
    }
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
        style={styles.background}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000011" />

        <View style={styles.content}>
          {/* Animated Stars Background */}
          <View style={styles.starsContainer}>
            {[...Array(20)].map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.star,
                  {
                    opacity: starOpacity,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  },
                ]}
              >
                <Ionicons name="star" size={8 + Math.random() * 12} color="#9B59B6" />
              </Animated.View>
            ))}
          </View>

          {/* Main Circle Animation */}
          <View style={styles.circleContainer}>
            {/* Outer rotating circles */}
            <Animated.View
              style={[
                styles.outerCircle,
                {
                  transform: [{ rotate: spin }],
                },
              ]}
            >
              <View style={styles.circleRing} />
            </Animated.View>

            <Animated.View
              style={[
                styles.middleCircle,
                {
                  transform: [
                    {
                      rotate: rotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['360deg', '0deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.circleRing} />
            </Animated.View>

            {/* Center pulsing icon */}
            <Animated.View
              style={[
                styles.centerIcon,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.3)', 'rgba(142, 68, 173, 0.5)']}
                style={styles.centerIconGradient}
              >
                <Ionicons name="sparkles" size={60} color="#9B59B6" />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Message Text */}
          <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]}>
            <Text style={styles.messageText}>{MYSTICAL_MESSAGES[currentMessage]}</Text>
            <Text style={styles.submessageText}>Создаём ваш астропсихологический портрет</Text>
          </Animated.View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="#E74C3C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Loading Dots */}
          <View style={styles.dotsContainer}>
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    opacity: rotation.interpolate({
                      inputRange: [i / 3, (i + 1) / 3],
                      outputRange: [0.3, 1],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
  },
  circleContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  outerCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleRing: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    borderWidth: 2,
    borderColor: 'rgba(155, 89, 182, 0.4)',
    borderStyle: 'dashed',
  },
  centerIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    elevation: 20,
  },
  centerIconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 26,
  },
  submessageText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    marginLeft: 10,
    flex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9B59B6',
    marginHorizontal: 6,
  },
});
