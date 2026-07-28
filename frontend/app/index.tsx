import React, { useEffect, useRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DailyCardWidget } from '../components/DailyCardWidget';
import { CosmicBackground } from '../components/CosmicBackground';
import { useUserProfile } from '../src/contexts/UserProfileContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string[];
  description: string;
}

interface Spread {
  id: string;
  name: string;
  description: string;
}

const CATEGORIES: Category[] = [
  { id: 'love', name: 'Любовь', icon: '💕', color: '#FF6B9D', gradient: ['rgba(255, 107, 157, 0.5)', 'rgba(255, 142, 155, 0.6)', 'rgba(196, 69, 105, 0.7)'], description: 'Вопросы сердца' },
  { id: 'career', name: 'Карьера', icon: '⭐', color: '#4ECDC4', gradient: ['rgba(78, 205, 196, 0.5)', 'rgba(69, 183, 209, 0.6)', 'rgba(38, 160, 180, 0.7)'], description: 'Профессиональный путь' },
  { id: 'finance', name: 'Финансы', icon: '✨', color: '#45B7D1', gradient: ['rgba(69, 183, 209, 0.5)', 'rgba(93, 173, 226, 0.6)', 'rgba(46, 134, 171, 0.7)'], description: 'Денежная энергия' },
  { id: 'general', name: 'Общие', icon: '🔮', color: '#9B59B6', gradient: ['rgba(155, 89, 182, 0.5)', 'rgba(187, 107, 217, 0.6)', 'rgba(108, 52, 131, 0.7)'], description: 'Жизненные вопросы' }
];

const SPREADS: Spread[] = [
  { id: 'one_card', name: 'Одна карта', description: 'Быстрый ответ на конкретный вопрос' },
  { id: 'three_cards', name: 'Три карты', description: 'Прошлое • Настоящее • Будущее' },
  { id: 'celtic_cross', name: 'Кельтский крест', description: 'Детальный анализ ситуации' }
];

interface MysticFeature {
  id: string;
  name: string;
  icon: string;
  description: string;
  route: string;
  color: string;
}

const MYSTIC_FEATURES: MysticFeature[] = [
  { id: 'compatibility', name: 'Гармония имен', icon: '💎', description: 'Звездная совместимость', route: '/compatibility', color: '#E74C3C' },
  { id: 'palmistry', name: 'Хиромантия', icon: '🤲', description: 'Гадание по ладони', route: '/camera', color: '#45B7D1' },
  { id: 'horoscope', name: 'Гороскоп', icon: '🌟', description: 'Прогноз на сегодня', route: '/horoscope', color: '#FFC107' },
  { id: 'astro', name: 'Астропсихология', icon: '✨', description: 'Портрет личности', route: '/astro-personality', color: '#9B59B6' },
  { id: 'runes', name: 'Руны', icon: 'ᚠ', description: 'Оракул викингов', route: '/runes', color: '#3498DB' },
  { id: 'numerology', name: 'Нумерология', icon: '🔢', description: 'Число судьбы', route: '/numerology', color: '#2ECC71' },
  { id: 'deck', name: 'Каталог колоды', icon: '🃏', description: 'Все 78 карт', route: '/deck', color: '#9B59B6' },
];

// Animated Category Card Component
const CategoryCard = ({ category, isSelected, onPress, index }: {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.categoryCardWrapper,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={category.gradient as any}
          style={styles.categoryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.categoryContent}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryDescription}>{category.description}</Text>
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Animated Feature Button Component
const FeatureButton = ({ feature, index }: { feature: MysticFeature; index: number }) => {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(translateXAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }, { translateX: translateXAnim }],
      }}
    >
      <TouchableOpacity
        style={styles.featureButton}
        onPress={() => router.push(feature.route as any)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.15)',
            'rgba(255, 255, 255, 0.05)',
            `${feature.color}30`,
          ]}
          style={styles.featureGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.featureIcon}>{feature.icon}</Text>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureName}>{feature.name}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function CosmicIndex() {
  const router = useRouter();
  const { profile, isLoading, hasProfile, getGreeting, isBirthday } = useUserProfile();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedSpread, setSelectedSpread] = React.useState<string | null>(null);

  // Редирект на онбординг для новых пользователей
  useEffect(() => {
    if (!isLoading && !hasProfile) {
      router.replace('/onboarding');
    }
  }, [isLoading, hasProfile]);

  // Header animation
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(titleScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const startReading = () => {
    if (selectedCategory && selectedSpread) {
      router.push({
        pathname: '/question',
        params: { category: selectedCategory, spread: selectedSpread }
      });
    }
  };

  // Показываем загрузку пока проверяем профиль
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9B59B6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000011" />

      {/* Cosmic Background */}
      <CosmicBackground />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header with personalized greeting */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: titleOpacity,
                transform: [{ scale: titleScale }],
              }
            ]}
          >
            {profile?.name && (
              <Text style={styles.greeting}>{getGreeting()}</Text>
            )}
            {isBirthday() && (
              <Text style={styles.birthdayText}>🎂 С Днём Рождения! 🎂</Text>
            )}
            <Text style={styles.mainTitle}>ТARO</Text>
            <View style={styles.subtitleContainer}>
              {profile?.sunSign ? (
                <Text style={styles.subtitle}>
                  {profile.sunSign.symbol} {profile.sunSign.nameRu} • Древняя мудрость звезд
                </Text>
              ) : (
                <Text style={styles.subtitle}>✨ Древняя мудрость звезд ✨</Text>
              )}
            </View>
          </Animated.View>

          {/* Daily Card Widget */}
          <View style={styles.widgetContainer}>
            <DailyCardWidget />
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Выберите область гадания</Text>
            <Text style={styles.sectionSubtitle}>Звезды подскажут путь к ответам</Text>

            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((category, index) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory === category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  index={index}
                />
              ))}
            </View>
          </View>

          {/* Spread Selection */}
          {selectedCategory && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Выберите расклад</Text>
              <Text style={styles.sectionSubtitle}>Различные способы получить ответы</Text>

              {SPREADS.map((spread, index) => (
                <TouchableOpacity
                  key={spread.id}
                  style={[
                    styles.spreadCard,
                    selectedSpread === spread.id && styles.spreadCardSelected
                  ]}
                  onPress={() => setSelectedSpread(spread.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.spreadContent}>
                    <Text style={[
                      styles.spreadName,
                      selectedSpread === spread.id && styles.spreadNameSelected
                    ]}>
                      {spread.name}
                    </Text>
                    <Text style={styles.spreadDescription}>{spread.description}</Text>
                  </View>
                  {selectedSpread === spread.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#9B59B6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Start Reading Button */}
          {selectedCategory && selectedSpread && (
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.startButton}
                onPress={startReading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#9B59B6', '#8E44AD', '#6C3483']}
                  style={styles.startButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="sparkles" size={24} color="#FFF" />
                  <Text style={styles.startButtonText}>Начать гадание</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Mystic Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Мистические практики</Text>

            {MYSTIC_FEATURES.map((feature, index) => (
              <FeatureButton key={feature.id} feature={feature} index={index} />
            ))}
          </View>

          {/* Quote */}
          <View style={styles.quoteSection}>
            <Text style={styles.quoteText}>
              "В бесконечности космоса скрыты ответы на все вопросы души"
            </Text>
          </View>

          {/* Bottom Padding */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000011',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000011',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#9B59B6',
    marginBottom: 5,
    fontWeight: '500',
  },
  birthdayText: {
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 12,
    textShadowColor: '#9B59B6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
    marginBottom: 15,
  },
  subtitleContainer: {
    backgroundColor: 'rgba(155, 89, 182, 0.25)',
    borderRadius: 25,
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  subtitle: {
    fontSize: 14,
    color: '#E8E8E8',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 1,
  },
  widgetContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(155, 89, 182, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  categoryCardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 5,
  },
  categoryCard: {
    width: '100%',
    height: 130,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  categoryCardSelected: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  categoryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContent: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  categoryIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -50,
    right: -50,
  },
  spreadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  spreadCardSelected: {
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    borderColor: '#9B59B6',
  },
  spreadContent: {
    flex: 1,
  },
  spreadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  spreadNameSelected: {
    color: '#BB6BD9',
  },
  spreadDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  startButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
    gap: 10,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  featureButton: {
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  featureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  quoteSection: {
    paddingHorizontal: 30,
    paddingVertical: 30,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
});
