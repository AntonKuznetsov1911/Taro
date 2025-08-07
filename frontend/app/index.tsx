import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'love', name: 'Любовь', icon: '❤️', color: '#FF6B9D', gradient: ['#FF6B9D', '#C44569'] },
  { id: 'career', name: 'Карьера', icon: '💼', color: '#4ECDC4', gradient: ['#4ECDC4', '#26A0B4'] },
  { id: 'finance', name: 'Финансы', icon: '💰', color: '#45B7D1', gradient: ['#45B7D1', '#2E86AB'] },
  { id: 'general', name: 'Общие', icon: '🔮', color: '#9B59B6', gradient: ['#9B59B6', '#6C3483'] }
];

const SPREADS = [
  {
    id: 'one_card',
    name: 'Одна карта',
    description: 'Быстрый ответ на вопрос',
    icon: '🎴',
    cards: 1
  },
  {
    id: 'three_cards',
    name: 'Три карты',
    description: 'Прошлое • Настоящее • Будущее',
    icon: '🃏',
    cards: 3
  },
  {
    id: 'celtic_cross',
    name: 'Кельтский крест',
    description: 'Подробный анализ ситуации',
    icon: '✨',
    cards: 10
  }
];

export default function Index() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedSpread, setSelectedSpread] = React.useState<string | null>(null);

  const CategoryCard = ({ category }: { category: any }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => setSelectedCategory(category.id)}
    >
      <LinearGradient
        colors={category.gradient}
        style={styles.categoryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.categoryIcon}>{category.icon}</Text>
        <Text style={styles.categoryName}>{category.name}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const SpreadCard = ({ spread }: { spread: any }) => (
    <TouchableOpacity
      style={[
        styles.spreadCard,
        selectedSpread === spread.id && styles.selectedSpreadCard
      ]}
      onPress={() => setSelectedSpread(spread.id)}
    >
      <View style={styles.spreadHeader}>
        <Text style={styles.spreadIcon}>{spread.icon}</Text>
        <Text style={styles.spreadName}>{spread.name}</Text>
        <Text style={styles.spreadCards}>{spread.cards} карт</Text>
      </View>
      <Text style={styles.spreadDescription}>{spread.description}</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.background}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>TARO</Text>
              <Text style={styles.subtitle}>Древняя мудрость в современном исполнении</Text>
            </View>
            <TouchableOpacity 
              style={styles.historyButton} 
              onPress={() => router.push('/history')}
            >
              <Ionicons name="time-outline" size={24} color="#9B59B6" />
            </TouchableOpacity>
          </View>

          {/* Mystical decoration */}
          <View style={styles.mysticalDecoration}>
            <Text style={styles.mysticalText}>✨ 🌙 ⭐ 🔮 ⭐ 🌙 ✨</Text>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Выберите категорию вопроса</Text>
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </View>
          </View>

          {/* Spread Selection */}
          {selectedCategory && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Выберите тип расклада</Text>
              {SPREADS.map((spread) => (
                <SpreadCard key={spread.id} spread={spread} />
              ))}
            </View>
          )}

          {/* Start Button */}
          {selectedCategory && selectedSpread && (
            <View style={styles.section}>
              <TouchableOpacity style={styles.startButton} onPress={startReading}>
                <LinearGradient
                  colors={['#9B59B6', '#8E44AD', '#6C3483']}
                  style={styles.startButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="sparkles" size={24} color="#FFF" style={styles.startButtonIcon} />
                  <Text style={styles.startButtonText}>Начать гадание</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom decoration */}
          <View style={styles.bottomDecoration}>
            <Text style={styles.bottomText}>
              "Карты не лгут, они лишь отражают истину вашего сердца"
            </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  historyButton: {
    padding: 8,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#E8E8E8',
    textAlign: 'center',
    letterSpacing: 4,
    textShadowColor: '#9B59B6',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#C8A2C8',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    fontStyle: 'italic',
    fontWeight: '300',
    letterSpacing: 1,
  },
  mysticalDecoration: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  mysticalText: {
    fontSize: 20,
    color: '#9B59B6',
    opacity: 0.7,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 15,
    textAlign: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 60) / 2,
    height: 120,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  categoryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  categoryIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  spreadCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#333',
  },
  selectedSpreadCard: {
    borderColor: '#9B59B6',
    backgroundColor: '#2a1b3d',
  },
  spreadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  spreadIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  spreadName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8E8E8',
    flex: 1,
  },
  spreadCards: {
    fontSize: 12,
    color: '#9B59B6',
    backgroundColor: '#9B59B633',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  spreadDescription: {
    fontSize: 14,
    color: '#B8B8B8',
    lineHeight: 20,
  },
  startButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  startButtonIcon: {
    marginRight: 10,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  bottomDecoration: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  bottomText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});