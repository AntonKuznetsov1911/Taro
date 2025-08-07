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
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

// ВАРИАНТ 3: ИНТЕРАКТИВНЫЕ КАРТЫ И АНИМАЦИИ
// Игровой подход с анимированными элементами и интерактивными картами

const CATEGORIES = [
  { 
    id: 'love', 
    name: 'Любовь', 
    icon: '💖', 
    color: '#FF6B9D', 
    gradient: ['#FF6B9D', '#FF8E9B'],
    description: 'Дела сердечные',
    cardEmoji: '🌹'
  },
  { 
    id: 'career', 
    name: 'Карьера', 
    icon: '🏆', 
    color: '#4ECDC4', 
    gradient: ['#4ECDC4', '#45B7D1'],
    description: 'Профессиональный рост',
    cardEmoji: '💼'
  },
  { 
    id: 'finance', 
    name: 'Финансы', 
    icon: '💰', 
    color: '#45B7D1', 
    gradient: ['#45B7D1', '#5DADE2'],
    description: 'Денежная удача',
    cardEmoji: '💎'
  },
  { 
    id: 'general', 
    name: 'Общие', 
    icon: '🔮', 
    color: '#9B59B6', 
    gradient: ['#9B59B6', '#BB6BD9'],
    description: 'Все о жизни',
    cardEmoji: '✨'
  }
];

const CARD_SPREADS = [
  {
    id: 'one_card',
    name: 'Быстрая карта',
    emoji: '🎴',
    color: '#FF6B9D',
    description: 'Один вопрос — один ответ',
    preview: ['🂠']
  },
  {
    id: 'three_cards',
    name: 'Тройка судьбы',
    emoji: '🎯',
    color: '#4ECDC4',
    description: 'Прошлое, настоящее, будущее',
    preview: ['🂠', '🂠', '🂠']
  },
  {
    id: 'celtic_cross',
    name: 'Магический крест',
    emoji: '✨',
    color: '#9B59B6',
    description: 'Полная картина судьбы',
    preview: ['🂠', '🂠', '🂠', '🂠', '🂠']
  }
];

export default function InteractiveIndex() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedSpread, setSelectedSpread] = React.useState<string | null>(null);
  const [animatedValue] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const CategoryCard = ({ category, index }: { category: any; index: number }) => {
    const isSelected = selectedCategory === category.id;
    
    return (
      <TouchableOpacity
        style={[styles.categoryCard, isSelected && styles.selectedCategoryCard]}
        onPress={() => setSelectedCategory(category.id)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={category.gradient}
          style={styles.categoryGradient}
        >
          <View style={styles.categoryContent}>
            <Text style={styles.categoryCardEmoji}>{category.cardEmoji}</Text>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryDescription}>{category.description}</Text>
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const SpreadCard = ({ spread }: { spread: any }) => {
    const isSelected = selectedSpread === spread.id;
    
    return (
      <TouchableOpacity
        style={[styles.spreadCard, isSelected && styles.selectedSpreadCard]}
        onPress={() => setSelectedSpread(spread.id)}
        activeOpacity={0.8}
      >
        <View style={styles.spreadHeader}>
          <Text style={styles.spreadEmoji}>{spread.emoji}</Text>
          <View style={styles.spreadInfo}>
            <Text style={[styles.spreadName, isSelected && { color: spread.color }]}>
              {spread.name}
            </Text>
            <Text style={styles.spreadDescription}>{spread.description}</Text>
          </View>
        </View>
        
        <View style={styles.cardPreviewContainer}>
          {spread.preview.map((card: string, index: number) => (
            <Animated.View
              key={index}
              style={[
                styles.previewCard,
                {
                  transform: [{
                    rotateY: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg']
                    })
                  }],
                  opacity: animatedValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 0.7, 1]
                  })
                }
              ]}
            >
              <Text style={styles.previewCardText}>{card}</Text>
            </Animated.View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const startMagicReading = () => {
    if (selectedCategory && selectedSpread) {
      router.push({
        pathname: '/question',
        params: { category: selectedCategory, spread: selectedSpread }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a0040" />
      
      <LinearGradient
        colors={['#1a0040', '#2d1b69', '#1a0040']}
        style={styles.background}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Magical Header */}
          <View style={styles.header}>
            <Animated.View 
              style={[
                styles.magicalTitle,
                {
                  transform: [{
                    scale: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.05]
                    })
                  }]
                }
              ]}
            >
              <Text style={styles.mainTitle}>🔮 TARO 🔮</Text>
              <Text style={styles.subtitle}>Магия в ваших руках</Text>
            </Animated.View>
            
            <TouchableOpacity 
              style={styles.magicalHistoryButton}
              onPress={() => router.push('/history')}
            >
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.8)', 'rgba(142, 68, 173, 1)']}
                style={styles.historyButtonGradient}
              >
                <Ionicons name="library" size={22} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Floating magical elements */}
          <Animated.View 
            style={[
              styles.floatingElements,
              {
                opacity: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8]
                })
              }
            ]}
          >
            <Text style={[styles.floatingElement, { top: 100, left: 30 }]}>✨</Text>
            <Text style={[styles.floatingElement, { top: 180, right: 50 }]}>🌙</Text>
            <Text style={[styles.floatingElement, { top: 250, left: 70 }]}>⭐</Text>
            <Text style={[styles.floatingElement, { top: 320, right: 80 }]}>💫</Text>
          </Animated.View>

          {/* Interactive Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎭 Выберите свою судьбу</Text>
            <Text style={styles.sectionSubtitle}>Каждая карта хранит тайны</Text>
            
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map((category, index) => (
                <CategoryCard key={category.id} category={category} index={index} />
              ))}
            </View>
          </View>

          {/* Magical Spread Selection */}
          {selectedCategory && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎲 Выберите способ гадания</Text>
              <Text style={styles.sectionSubtitle}>Разные пути к истине</Text>
              
              {CARD_SPREADS.map((spread) => (
                <SpreadCard key={spread.id} spread={spread} />
              ))}
            </View>
          )}

          {/* Magical Action Button */}
          {selectedCategory && selectedSpread && (
            <Animated.View 
              style={[
                styles.magicalActionSection,
                {
                  transform: [{
                    scale: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1]
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity style={styles.magicalButton} onPress={startMagicReading}>
                <LinearGradient
                  colors={['#FF6B9D', '#9B59B6', '#4ECDC4']}
                  style={styles.magicalButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.magicalButtonIcon}>🌟</Text>
                  <Text style={styles.magicalButtonText}>Начать магию</Text>
                  <Text style={styles.magicalButtonSubtext}>Карты зовут вас</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Magic Compatibility */}
          <View style={styles.compatibilitySection}>
            <Text style={styles.compatibilityTitle}>💕 Магия совместимости</Text>
            <TouchableOpacity 
              style={styles.compatibilityCard}
              onPress={() => router.push('/compatibility')}
            >
              <LinearGradient
                colors={['rgba(255, 107, 157, 0.9)', 'rgba(192, 57, 43, 0.8)']}
                style={styles.compatibilityGradient}
              >
                <View style={styles.compatibilityContent}>
                  <Text style={styles.compatibilityEmoji}>👥💖</Text>
                  <Text style={styles.compatibilityText}>Узнать совместимость</Text>
                  <Text style={styles.compatibilitySubtext}>Тайны имен и судеб</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Magical Quote */}
          <View style={styles.quoteSection}>
            <View style={styles.magicalQuote}>
              <Text style={styles.quoteIcon}>🔮</Text>
              <Text style={styles.quoteText}>
                "Магия живет в тех, кто верит в чудеса"
              </Text>
              <Text style={styles.quoteMagic}>✨ Древние маги ✨</Text>
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
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    position: 'relative',
  },
  magicalTitle: {
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 6,
    textShadowColor: '#FF6B9D',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E8E8E8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  magicalHistoryButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  historyButtonGradient: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingElements: {
    position: 'absolute',
    width: '100%',
    height: 400,
    zIndex: 1,
  },
  floatingElement: {
    position: 'absolute',
    fontSize: 20,
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    zIndex: 2,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#B8B8B8',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  categoryCard: {
    width: (width - 55) / 2,
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  selectedCategoryCard: {
    elevation: 12,
    shadowOpacity: 0.6,
  },
  categoryGradient: {
    flex: 1,
  },
  categoryContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    position: 'relative',
  },
  categoryCardEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  categoryIcon: {
    fontSize: 28,
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
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  spreadCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedSpreadCard: {
    borderColor: '#9B59B6',
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
  },
  spreadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  spreadEmoji: {
    fontSize: 32,
    marginRight: 15,
  },
  spreadInfo: {
    flex: 1,
  },
  spreadName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  spreadDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardPreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  previewCard: {
    width: 30,
    height: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCardText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  magicalActionSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  magicalButton: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  magicalButtonGradient: {
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 30,
  },
  magicalButtonIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  magicalButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  magicalButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  compatibilitySection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  compatibilityTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  compatibilityCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
  },
  compatibilityGradient: {
    padding: 20,
  },
  compatibilityContent: {
    alignItems: 'center',
  },
  compatibilityEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  compatibilityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  compatibilitySubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  quoteSection: {
    paddingHorizontal: 30,
    paddingVertical: 40,
    alignItems: 'center',
  },
  magicalQuote: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quoteIcon: {
    fontSize: 28,
    marginBottom: 15,
  },
  quoteText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 15,
  },
  quoteMagic: {
    fontSize: 12,
    color: '#9B59B6',
    textAlign: 'center',
    fontWeight: '600',
  },
});