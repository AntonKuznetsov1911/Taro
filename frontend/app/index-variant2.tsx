import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// ВАРИАНТ 2: МИНИМАЛИЗМ И ЭЛЕГАНТНОСТЬ
// Чистый, современный дизайн с акцентом на типографику и пространство

const CATEGORIES = [
  { id: 'love', name: 'Любовь', icon: 'heart', color: '#FF6B9D', accent: '#FFE5EC' },
  { id: 'career', name: 'Карьера', icon: 'briefcase', color: '#4ECDC4', accent: '#E0F7FA' },
  { id: 'finance', name: 'Финансы', icon: 'trending-up', color: '#45B7D1', accent: '#E3F2FD' },
  { id: 'general', name: 'Общее', icon: 'globe', color: '#9B59B6', accent: '#F3E5F5' }
];

const SPREAD_OPTIONS = [
  { id: 'one_card', name: 'Одна карта', subtitle: 'Быстрый ответ', cards: 1, icon: 'radio-button-on' },
  { id: 'three_cards', name: 'Три карты', subtitle: 'Прошлое • Настоящее • Будущее', cards: 3, icon: 'ellipsis-horizontal' },
  { id: 'celtic_cross', name: 'Кельтский крест', subtitle: 'Детальный анализ', cards: 10, icon: 'add' }
];

export default function MinimalistIndex() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedSpread, setSelectedSpread] = React.useState<string | null>(null);

  const CategoryButton = ({ category }: { category: any }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === category.id && { backgroundColor: category.accent, borderColor: category.color }
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
        <Ionicons name={category.icon} size={20} color="#FFFFFF" />
      </View>
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === category.id && { color: category.color, fontWeight: '600' }
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const SpreadOption = ({ spread }: { spread: any }) => (
    <TouchableOpacity
      style={[
        styles.spreadOption,
        selectedSpread === spread.id && styles.selectedSpreadOption
      ]}
      onPress={() => setSelectedSpread(spread.id)}
    >
      <View style={styles.spreadHeader}>
        <Ionicons 
          name={spread.icon} 
          size={24} 
          color={selectedSpread === spread.id ? '#9B59B6' : '#666'} 
        />
        <View style={styles.spreadText}>
          <Text style={[
            styles.spreadName,
            selectedSpread === spread.id && styles.selectedSpreadName
          ]}>
            {spread.name}
          </Text>
          <Text style={styles.spreadSubtitle}>{spread.subtitle}</Text>
        </View>
        <View style={[styles.cardCountBadge, selectedSpread === spread.id && styles.selectedCardCountBadge]}>
          <Text style={[
            styles.cardCountText,
            selectedSpread === spread.id && styles.selectedCardCountText
          ]}>
            {spread.cards}
          </Text>
        </View>
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
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      
      <View style={styles.background}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Clean Header */}
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>TARO</Text>
              <Text style={styles.subtitle}>Мудрость в простоте</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.historyButton}
              onPress={() => router.push('/history')}
            >
              <Ionicons name="time-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressStep, selectedCategory && styles.completedStep]}>
              <Text style={[styles.progressNumber, selectedCategory && styles.completedNumber]}>1</Text>
            </View>
            <View style={[styles.progressLine, selectedCategory && styles.completedLine]} />
            <View style={[styles.progressStep, selectedSpread && styles.completedStep]}>
              <Text style={[styles.progressNumber, selectedSpread && styles.completedNumber]}>2</Text>
            </View>
            <View style={[styles.progressLine, selectedCategory && selectedSpread && styles.completedLine]} />
            <View style={styles.progressStep}>
              <Text style={styles.progressNumber}>3</Text>
            </View>
          </View>

          {/* Step 1: Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Выберите тему</Text>
            <Text style={styles.sectionDescription}>
              Определите область, которая вас интересует
            </Text>
            
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((category) => (
                <CategoryButton key={category.id} category={category} />
              ))}
            </View>
          </View>

          {/* Step 2: Spread Selection */}
          {selectedCategory && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Выберите расклад</Text>
              <Text style={styles.sectionDescription}>
                Определите глубину анализа
              </Text>
              
              {SPREAD_OPTIONS.map((spread) => (
                <SpreadOption key={spread.id} spread={spread} />
              ))}
            </View>
          )}

          {/* Action Button */}
          {selectedCategory && selectedSpread && (
            <View style={styles.actionSection}>
              <TouchableOpacity style={styles.startButton} onPress={startReading}>
                <Text style={styles.startButtonText}>Начать гадание</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* Additional Services */}
          <View style={styles.servicesSection}>
            <Text style={styles.servicesSectionTitle}>Дополнительно</Text>
            
            <TouchableOpacity 
              style={styles.serviceButton}
              onPress={() => router.push('/compatibility')}
            >
              <View style={styles.serviceIconContainer}>
                <Ionicons name="people" size={20} color="#FF6B9D" />
              </View>
              <View style={styles.serviceText}>
                <Text style={styles.serviceName}>Совместимость имен</Text>
                <Text style={styles.serviceDescription}>Анализ гармонии отношений</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  background: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  titleSection: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '300',
  },
  historyButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedStep: {
    backgroundColor: '#9B59B6',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  completedNumber: {
    color: '#FFFFFF',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E8E8E8',
    marginHorizontal: 16,
  },
  completedLine: {
    backgroundColor: '#9B59B6',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 24,
    lineHeight: 22,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  spreadOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  selectedSpreadOption: {
    borderColor: '#9B59B6',
    backgroundColor: '#F8F5FF',
  },
  spreadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spreadText: {
    flex: 1,
    marginLeft: 16,
  },
  spreadName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  selectedSpreadName: {
    color: '#9B59B6',
  },
  spreadSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  cardCountBadge: {
    backgroundColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  selectedCardCountBadge: {
    backgroundColor: '#9B59B6',
  },
  cardCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  selectedCardCountText: {
    color: '#FFFFFF',
  },
  actionSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9B59B6',
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  servicesSection: {
    paddingHorizontal: 24,
  },
  servicesSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
  serviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  serviceText: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#7F8C8D',
  },
});