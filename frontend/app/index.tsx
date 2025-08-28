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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StarryBackground } from '../components/StarryBackground';

// Base64 изображения таро The Lovers
const TAROT_LOVERS_BASE64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKRwqFyI0NDMrKy8vLzBAMD8/Pz8/QEA=';

const { width } = Dimensions.get('window');

// ВАРИАНТ 1: КОСМИЧЕСКИЙ МИСТИЦИЗМ
// Элегантный дизайн с акцентом на космические элементы, звезды, туманности

const CATEGORIES = [
  { id: 'love', name: 'Любовь', icon: '💫', color: '#FF6B9D', gradient: ['rgba(255, 107, 157, 0.4)', 'rgba(255, 142, 155, 0.5)', 'rgba(196, 69, 105, 0.6)'], description: 'Вопросы сердца' },
  { id: 'career', name: 'Карьера', icon: '⭐', color: '#4ECDC4', gradient: ['rgba(78, 205, 196, 0.4)', 'rgba(69, 183, 209, 0.5)', 'rgba(38, 160, 180, 0.6)'], description: 'Профессиональный путь' },
  { id: 'finance', name: 'Финансы', icon: '✨', color: '#45B7D1', gradient: ['rgba(69, 183, 209, 0.4)', 'rgba(93, 173, 226, 0.5)', 'rgba(46, 134, 171, 0.6)'], description: 'Денежная энергия' },
  { id: 'general', name: 'Общие', icon: '🌟', color: '#9B59B6', gradient: ['rgba(155, 89, 182, 0.4)', 'rgba(187, 107, 217, 0.5)', 'rgba(108, 52, 131, 0.6)'], description: 'Жизненные вопросы' }
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
            {selectedCategory === category.id && (
              <View style={styles.selectedCategoryIndicator}>
                <View style={styles.crystalGlassIndicator}>
                  <LinearGradient
                    colors={[
                      'rgba(255, 255, 255, 0.6)',
                      'rgba(255, 255, 255, 0.2)',
                      'rgba(255, 255, 255, 0.4)',
                    ]}
                    style={styles.crystalGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View style={styles.crystalReflection} />
                </View>
              </View>
            )}
          </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const SpreadCard = ({ spread }: { spread: any }) => (
    <TouchableOpacity
      style={[styles.spreadCard, selectedSpread === spread.id && styles.selectedSpreadCard]}
      onPress={() => setSelectedSpread(spread.id)}
      activeOpacity={0.8}
    >
      <View style={styles.spreadContent}>
        <Text style={[styles.spreadName, selectedSpread === spread.id && styles.selectedSpreadName]}>
          {spread.name}
        </Text>
        <Text style={styles.spreadDescription}>{spread.description}</Text>
        {selectedSpread === spread.id && (
          <View style={styles.selectedIndicator}>
            <View style={styles.crystalGlassIndicator}>
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.6)',
                  'rgba(255, 255, 255, 0.2)',
                  'rgba(255, 255, 255, 0.4)',
                ]}
                style={styles.crystalGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.crystalReflection} />
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const startReading = () => {
    if (selectedCategory && selectedSpread) {
      router.push({
        pathname: '/question',
        params: { category: selectedCategory, spread: selectedSpread }
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
        {/* Звездное небо как фон */}
        <StarryBackground />
        
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
              style={styles.floatingSettingsButton} 
              onPress={() => router.push('/settings')}
            >
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.3)', 'rgba(142, 68, 173, 0.5)']}
                style={styles.settingsButtonGradient}
              >
                <Ionicons name="settings-outline" size={22} color="#E8E8E8" />
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

          {/* Spread Selection */}
          {selectedCategory && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Выберите расклад</Text>
                <Text style={styles.sectionSubtitle}>Различные способы получить ответы</Text>
              </View>
              
              {SPREADS.map((spread) => (
                <SpreadCard key={spread.id} spread={spread} />
              ))}
            </View>
          )}

          {/* Main Reading Button */}
          {selectedCategory && selectedSpread && (
            <View style={styles.quickSection}>
              <TouchableOpacity style={styles.mainReadingButton} onPress={startReading}>
                <LinearGradient
                  colors={['rgba(69, 183, 209, 0.9)', 'rgba(52, 152, 219, 1)', 'rgba(41, 128, 185, 1)']}
                  style={styles.quickButtonGradient}
                >
                  <Ionicons name="sparkles" size={24} color="#FFF" />
                  <Text style={styles.quickButtonText}>Начать гадание</Text>
                  <Text style={styles.quickButtonSubtext}>Получить полное толкование</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Cosmic Compatibility */}
          <View style={styles.compatibilitySection}>
            <Text style={styles.compatibilityTitle}>Мистические практики</Text>
            
            {/* Name Harmony Button */}
            <TouchableOpacity 
              style={styles.compatibilityButton} 
              onPress={() => router.push('/compatibility')}
            >
              <View style={styles.diamondGlassContainer}>
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.25)',
                    'rgba(255, 255, 255, 0.1)',
                    'rgba(255, 255, 255, 0.05)',
                    'rgba(231, 76, 60, 0.2)'
                  ]}
                  style={styles.diamondGlassGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.compatibilityIcon}>💎</Text>
                  <View>
                    <Text style={styles.compatibilityText}>Гармония имен</Text>
                    <Text style={styles.compatibilitySubtext}>Звездная совместимость по именам</Text>
                  </View>
                </LinearGradient>
                
                {/* Алмазные грани - reflections */}
                <View style={styles.diamondFacet1} />
                <View style={styles.diamondFacet2} />
                <View style={styles.diamondFacet3} />
                <View style={styles.diamondFacet4} />
                
                {/* Центральный бриллиантовый блик */}
                <View style={styles.diamondSparkle}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.3)']}
                    style={styles.sparkleGradient}
                  />
                </View>
              </View>
            </TouchableOpacity>

            {/* Palmistry Button */}
            <TouchableOpacity 
              style={[styles.compatibilityButton, styles.palmistryButton]} 
              onPress={() => router.push('/camera')}
            >
              <View style={styles.palmistryGlassContainer}>
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.25)',
                    'rgba(255, 255, 255, 0.1)',
                    'rgba(255, 255, 255, 0.05)',
                    'rgba(69, 183, 209, 0.2)'
                  ]}
                  style={styles.palmistryGlassGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.compatibilityIcon}>🤲</Text>
                  <View>
                    <Text style={styles.compatibilityText}>Хиромантия</Text>
                    <Text style={styles.compatibilitySubtext}>Гадание по линиям ладони</Text>
                  </View>
                </LinearGradient>
                
                {/* Мистические линии как у ладони */}
                <View style={styles.palmLine1} />
                <View style={styles.palmLine2} />
                <View style={styles.palmLine3} />
                <View style={styles.palmLine4} />
                
                {/* Центральный мистический символ */}
                <View style={styles.palmSymbol}>
                  <LinearGradient
                    colors={['rgba(69, 183, 209, 0.9)', 'rgba(52, 152, 219, 0.6)']}
                    style={styles.palmSymbolGradient}
                  />
                </View>
              </View>
            </TouchableOpacity>

            {/* Horoscope Button */}
            <TouchableOpacity 
              style={[styles.compatibilityButton, styles.horoscopeButton]} 
              onPress={() => router.push('/horoscope')}
            >
              <View style={styles.horoscopeGlassContainer}>
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.25)',
                    'rgba(255, 255, 255, 0.1)',
                    'rgba(255, 255, 255, 0.05)',
                    'rgba(255, 193, 7, 0.2)'
                  ]}
                  style={styles.horoscopeGlassGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.compatibilityIcon}>🌟</Text>
                  <View>
                    <Text style={styles.compatibilityText}>Гороскоп</Text>
                    <Text style={styles.compatibilitySubtext}>Персональный прогноз на сегодня</Text>
                  </View>
                </LinearGradient>
                
                {/* Звездные созвездия */}
                <View style={styles.star1} />
                <View style={styles.star2} />
                <View style={styles.star3} />
                <View style={styles.star4} />
                <View style={styles.star5} />
                
                {/* Центральная звезда */}
                <View style={styles.centerStar}>
                  <LinearGradient
                    colors={['rgba(255, 193, 7, 0.9)', 'rgba(255, 152, 0, 0.6)']}
                    style={styles.centerStarGradient}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Cosmic Quote */}
          <View style={styles.quoteSection}>
            <View style={styles.quoteContainer}>
              <Text style={styles.quoteText}>
                "В бесконечности космоса скрыты ответы на все вопросы души"
              </Text>
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
    textShadow: '0px 0px 20px #9B59B6',
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
  floatingSettingsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  settingsButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
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
    boxShadow: '0px 4px 10px rgba(155, 89, 182, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  mainReadingButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 10,
  },
  spreadCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  selectedSpreadCard: {
    borderColor: '#9B59B6',
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
  },
  spreadContent: {
    flex: 1,
  },
  spreadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  selectedSpreadName: {
    color: '#BB6BD9',
  },
  spreadDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  selectedCategoryIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  crystalGlassIndicator: {
    width: 24,
    height: 24,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.3)',
    elevation: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  crystalGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  crystalReflection: {
    position: 'absolute',
    top: 1,
    left: 1,
    width: 8,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 4,
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
    elevation: 10,
    position: 'relative',
  },
  diamondGlassContainer: {
    position: 'relative',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.3), inset 0px 1px 0px rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(15px)',
  },
  diamondGlassGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderRadius: 18,
  },
  // Алмазные грани для создания эффекта огранки
  diamondFacet1: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 1,
    transform: 'rotate(15deg)',
  },
  diamondFacet2: {
    position: 'absolute',
    top: 5,
    right: 0,
    width: 40,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 1,
    transform: 'rotate(-25deg)',
  },
  diamondFacet3: {
    position: 'absolute',
    bottom: 8,
    left: 15,
    width: 30,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 1,
    transform: 'rotate(45deg)',
  },
  diamondFacet4: {
    position: 'absolute',
    bottom: 0,
    right: 20,
    width: 25,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
    transform: 'rotate(-35deg)',
  },
  // Центральный бриллиантовый блик
  diamondSparkle: {
    position: 'absolute',
    top: 8,
    left: 15,
    width: 12,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  sparkleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
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
  // Palmistry Button Styles
  palmistryButton: {
    marginTop: 15,
  },
  palmistryGlassContainer: {
    position: 'relative',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(69, 183, 209, 0.4)',
    backgroundColor: 'rgba(69, 183, 209, 0.08)',
    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.3), inset 0px 1px 0px rgba(69, 183, 209, 0.3)',
    backdropFilter: 'blur(15px)',
  },
  palmistryGlassGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderRadius: 18,
  },
  // Мистические линии ладони
  palmLine1: {
    position: 'absolute',
    top: 8,
    left: 20,
    width: 50,
    height: 1.5,
    backgroundColor: 'rgba(69, 183, 209, 0.6)',
    borderRadius: 1,
    transform: [{ rotate: '10deg' }],
  },
  palmLine2: {
    position: 'absolute',
    top: 15,
    left: 25,
    width: 40,
    height: 1,
    backgroundColor: 'rgba(52, 152, 219, 0.5)',
    borderRadius: 1,
    transform: [{ rotate: '-5deg' }],
  },
  palmLine3: {
    position: 'absolute',
    bottom: 12,
    left: 30,
    width: 35,
    height: 1.5,
    backgroundColor: 'rgba(69, 183, 209, 0.7)',
    borderRadius: 1,
    transform: [{ rotate: '20deg' }],
  },
  palmLine4: {
    position: 'absolute',
    bottom: 5,
    right: 25,
    width: 30,
    height: 1,
    backgroundColor: 'rgba(52, 152, 219, 0.4)',
    borderRadius: 1,
    transform: [{ rotate: '-15deg' }],
  },
  // Центральный мистический символ
  palmSymbol: {
    position: 'absolute',
    top: 10,
    right: 15,
    width: 10,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  palmSymbolGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  // Horoscope Button Styles
  horoscopeButton: {
    marginTop: 15,
  },
  horoscopeGlassContainer: {
    position: 'relative',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 193, 7, 0.4)',
    backgroundColor: 'rgba(255, 193, 7, 0.08)',
    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.3), inset 0px 1px 0px rgba(255, 193, 7, 0.3)',
    backdropFilter: 'blur(15px)',
  },
  horoscopeGlassGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderRadius: 18,
  },
  // Созвездия звезд
  star1: {
    position: 'absolute',
    top: 8,
    left: 20,
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255, 193, 7, 0.8)',
    borderRadius: 2,
  },
  star2: {
    position: 'absolute',
    top: 15,
    left: 35,
    width: 3,
    height: 3,
    backgroundColor: 'rgba(255, 152, 0, 0.7)',
    borderRadius: 1.5,
  },
  star3: {
    position: 'absolute',
    top: 10,
    right: 30,
    width: 3,
    height: 3,
    backgroundColor: 'rgba(255, 193, 7, 0.6)',
    borderRadius: 1.5,
  },
  star4: {
    position: 'absolute',
    bottom: 10,
    left: 25,
    width: 2,
    height: 2,
    backgroundColor: 'rgba(255, 152, 0, 0.5)',
    borderRadius: 1,
  },
  star5: {
    position: 'absolute',
    bottom: 15,
    right: 40,
    width: 2,
    height: 2,
    backgroundColor: 'rgba(255, 193, 7, 0.6)',
    borderRadius: 1,
  },
  // Центральная звезда
  centerStar: {
    position: 'absolute',
    top: 12,
    right: 15,
    width: 8,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  centerStarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  // Palmistry Button Styles
  palmistryButton: {
    marginTop: 15,
  },
  palmistryGlassContainer: {
    position: 'relative',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(69, 183, 209, 0.4)',
    backgroundColor: 'rgba(69, 183, 209, 0.08)',
    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.3), inset 0px 1px 0px rgba(69, 183, 209, 0.3)',
    backdropFilter: 'blur(15px)',
  },
  palmistryGlassGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderRadius: 18,
  },
  // Мистические линии ладони
  palmLine1: {
    position: 'absolute',
    top: 8,
    left: 20,
    width: 50,
    height: 1.5,
    backgroundColor: 'rgba(69, 183, 209, 0.6)',
    borderRadius: 1,
    transform: 'rotate(10deg)',
  },
  palmLine2: {
    position: 'absolute',
    top: 15,
    left: 25,
    width: 40,
    height: 1,
    backgroundColor: 'rgba(52, 152, 219, 0.5)',
    borderRadius: 1,
    transform: 'rotate(-5deg)',
  },
  palmLine3: {
    position: 'absolute',
    bottom: 12,
    left: 30,
    width: 35,
    height: 1.5,
    backgroundColor: 'rgba(69, 183, 209, 0.7)',
    borderRadius: 1,
    transform: 'rotate(20deg)',
  },
  palmLine4: {
    position: 'absolute',
    bottom: 5,
    right: 25,
    width: 30,
    height: 1,
    backgroundColor: 'rgba(52, 152, 219, 0.4)',
    borderRadius: 1,
    transform: 'rotate(-15deg)',
  },
  // Центральный мистический символ
  palmSymbol: {
    position: 'absolute',
    top: 10,
    right: 15,
    width: 10,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  palmSymbolGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
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
  },
});