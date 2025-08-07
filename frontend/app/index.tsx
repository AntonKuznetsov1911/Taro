import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// ВАРИАНТ 1: КОСМИЧЕСКИЙ МИСТИЦИЗМ
// Элегантный дизайн с акцентом на космические элементы, звезды, туманности

const CATEGORIES = [
  { id: 'love', name: 'Любовь', icon: '💫', color: '#FF6B9D', gradient: ['#FF6B9D', '#FF8E9B', '#C44569'], description: 'Вопросы сердца' },
  { id: 'career', name: 'Карьера', icon: '⭐', color: '#4ECDC4', gradient: ['#4ECDC4', '#45B7D1', '#26A0B4'], description: 'Профессиональный путь' },
  { id: 'finance', name: 'Финансы', icon: '✨', color: '#45B7D1', gradient: ['#45B7D1', '#5DADE2', '#2E86AB'], description: 'Денежная энергия' },
  { id: 'general', name: 'Общие', icon: '🌟', color: '#9B59B6', gradient: ['#9B59B6', '#BB6BD9', '#6C3483'], description: 'Жизненные вопросы' }
];

const SPREADS = [
  { id: 'one_card', name: 'Одна карта', description: 'Быстрый ответ на конкретный вопрос' },
  { id: 'three_cards', name: 'Три карты', description: 'Прошлое • Настоящее • Будущее' },
  { id: 'celtic_cross', name: 'Кельтский крест', description: 'Детальный анализ ситуации' }
];

export default function CosmicIndex() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedSpread, setSelectedSpread] = React.useState<string | null>(null);

  const CategoryCard = ({ category }: { category: any }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => setSelectedCategory(category.id)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={category.gradient}
        style={styles.categoryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
          <View style={styles.categoryBlur}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryDescription}>{category.description}</Text>
          </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const startQuickReading = () => {
    if (selectedCategory) {
      router.push({
        pathname: '/question',
        params: { category: selectedCategory, spread: 'one_card' }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000011" />
      
      <LinearGradient
        colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
        style={styles.background}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Cosmic Header */}
          <View style={styles.header}>
            <View style={styles.cosmicTitleContainer}>
              <Text style={styles.mainTitle}>ТARO</Text>
              <View style={styles.cosmicSubtitle}>
                <Text style={styles.subtitle}>✨ Древняя мудрость звезд ✨</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.floatingHistoryButton} 
              onPress={() => router.push('/history')}
            >
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.3)', 'rgba(142, 68, 173, 0.5)']}
                style={styles.historyButtonGradient}
              >
                <Ionicons name="time-outline" size={22} color="#E8E8E8" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Floating cosmic particles */}
          <View style={styles.particlesContainer}>
            <Text style={[styles.particle, { top: 120, left: 50 }]}>✦</Text>
            <Text style={[styles.particle, { top: 200, right: 80 }]}>⭐</Text>
            <Text style={[styles.particle, { top: 300, left: 30 }]}>✨</Text>
            <Text style={[styles.particle, { top: 150, right: 40 }]}>💫</Text>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Выберите область гадания</Text>
              <Text style={styles.sectionSubtitle}>Звезды подскажут путь к ответам</Text>
            </View>
            
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </View>
          </View>

          {/* Quick Reading Section */}
          {selectedCategory && (
            <View style={styles.quickSection}>
              <TouchableOpacity style={styles.quickReadingButton} onPress={startQuickReading}>
                <LinearGradient
                  colors={['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)', 'rgba(108, 52, 131, 1)']}
                  style={styles.quickButtonGradient}
                >
                  <Ionicons name="flash" size={24} color="#FFF" />
                  <Text style={styles.quickButtonText}>Быстрое гадание</Text>
                  <Text style={styles.quickButtonSubtext}>Одна карта • Мгновенный ответ</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Cosmic Compatibility */}
          <View style={styles.compatibilitySection}>
            <Text style={styles.compatibilityTitle}>Космическая совместимость</Text>
            <TouchableOpacity 
              style={styles.compatibilityButton} 
              onPress={() => router.push('/compatibility')}
            >
              <LinearGradient
                colors={['rgba(231, 76, 60, 0.8)', 'rgba(192, 57, 43, 0.9)', 'rgba(169, 50, 38, 1)']}
                style={styles.compatibilityGradient}
              >
                <Text style={styles.compatibilityIcon}>💕</Text>
                <View>
                  <Text style={styles.compatibilityText}>Гармония имен</Text>
                  <Text style={styles.compatibilitySubtext}>Звездная совместимость по именам</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Cosmic Quote */}
          <View style={styles.quoteSection}>
            <View style={styles.quoteContainer}>
              <Text style={styles.quoteText}>
                "В бесконечности космоса скрыты ответы на все вопросы души"
              </Text>
              <Text style={styles.quoteAuthor}>— Древняя мудрость</Text>
            </View>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
  },
  cosmicTitleContainer: {
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 8,
    textShadowColor: '#9B59B6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 10,
  },
  cosmicSubtitle: {
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  subtitle: {
    fontSize: 14,
    color: '#E8E8E8',
    textAlign: 'center',
    fontWeight: '300',
  },
  floatingHistoryButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  historyButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: 400,
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    zIndex: 2,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#B8B8B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  categoryCard: {
    width: (width - 55) / 2,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  categoryGradient: {
    flex: 1,
  },
  categoryBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  quickSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  quickReadingButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 10,
  },
  quickButtonGradient: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
  },
  quickButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 5,
  },
  quickButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  compatibilitySection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  compatibilityTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    marginBottom: 15,
  },
  compatibilityButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
  },
  compatibilityGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 25,
  },
  compatibilityIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  compatibilityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  compatibilitySubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  quoteSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  quoteContainer: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quoteText: {
    fontSize: 14,
    color: '#E8E8E8',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 10,
  },
  quoteAuthor: {
    fontSize: 12,
    color: '#9B59B6',
    textAlign: 'center',
  },
});