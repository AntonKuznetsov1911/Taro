import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { EnhancedHistoryCard } from '../components/EnhancedHistoryCard';
import { HistoryFilters } from '../components/HistoryFilters';
import { readingsStorage, favoritesStorage, notesStorage, tagsStorage } from '../src/utils/storage';

interface TarotCard {
  id: number;
  name: string;
  name_en: string;
  type: string;
  image: string;
  keywords: string[];
  upright_meaning: string;
  reversed_meaning: string;
  is_reversed: boolean;
}

interface TarotReading {
  id: string;
  question: string;
  category: string;
  spread_type: string;
  cards: TarotCard[];
  positions: string[];
  interpretation: string;
  created_at: string;
}

const CATEGORIES = {
  love: { name: 'Любовь', icon: '❤️', color: '#FF6B9D' },
  career: { name: 'Карьера', icon: '💼', color: '#4ECDC4' },
  finance: { name: 'Финансы', icon: '💰', color: '#45B7D1' },
  general: { name: 'Общие вопросы', icon: '🔮', color: '#9B59B6' }
};

const SPREADS = {
  one_card: 'Одна карта',
  three_cards: 'Три карты',
  celtic_cross: 'Кельтский крест'
};

export default function HistoryScreen() {
  const router = useRouter();
  const [readings, setReadings] = useState<TarotReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedReading, setExpandedReading] = useState<string | null>(null);

  // Enhanced features state
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [tags, setTags] = useState<{ [key: string]: string[] }>({});

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSpread, setSelectedSpread] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'category'>('date');

  useEffect(() => {
    fetchReadings();
    loadEnhancedData();
  }, []);

  const fetchReadings = async () => {
    try {
      // Load readings from local storage
      const storedReadings = await readingsStorage.getReadings();
      setReadings(storedReadings);
    } catch (error) {
      console.error('Error fetching readings:', error);
      // Don't show error alert for empty history
    } finally {
      setIsLoading(false);
    }
  };

  const loadEnhancedData = async () => {
    try {
      const [storedFavorites, storedNotes, storedTags] = await Promise.all([
        favoritesStorage.getFavorites(),
        notesStorage.getNotes(),
        tagsStorage.getTags()
      ]);
      setFavorites(storedFavorites);
      setNotes(storedNotes);
      setTags(storedTags);
    } catch (error) {
      console.error('Error loading enhanced data:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const toggleExpansion = (readingId: string) => {
    setExpandedReading(expandedReading === readingId ? null : readingId);
  };

  const toggleFavorite = async (readingId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(readingId)) {
      newFavorites.delete(readingId);
    } else {
      newFavorites.add(readingId);
    }
    setFavorites(newFavorites);
    await favoritesStorage.saveFavorites(newFavorites);
  };

  const saveNotes = async (readingId: string, note: string) => {
    const newNotes = { ...notes, [readingId]: note };
    setNotes(newNotes);
    await notesStorage.saveNotes(newNotes);
  };

  const addTag = async (readingId: string, tag: string) => {
    const newTags = {
      ...tags,
      [readingId]: [...(tags[readingId] || []), tag],
    };
    setTags(newTags);
    await tagsStorage.saveTags(newTags);
  };

  const removeTag = async (readingId: string, tag: string) => {
    const newTags = {
      ...tags,
      [readingId]: (tags[readingId] || []).filter((t) => t !== tag),
    };
    setTags(newTags);
    await tagsStorage.saveTags(newTags);
  };

  // Filter and sort readings
  const filteredReadings = readings
    .filter((reading) => {
      // Search filter
      if (searchQuery && !reading.question.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Category filter
      if (selectedCategory && reading.category !== selectedCategory) {
        return false;
      }
      // Spread filter
      if (selectedSpread && reading.spread_type !== selectedSpread) {
        return false;
      }
      // Favorites filter
      if (showFavoritesOnly && !favorites.has(reading.id)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return a.category.localeCompare(b.category);
      }
    });


  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#0a0a0a', '#1a1a2e', '#16213e']}
          style={styles.background}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9B59B6" />
            <Text style={styles.loadingText}>Загрузка истории...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
          </TouchableOpacity>
          <Text style={styles.title}>История гаданий</Text>
        </View>

        {/* Filters */}
        {readings.length > 0 && (
          <HistoryFilters
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            selectedSpread={selectedSpread}
            showFavoritesOnly={showFavoritesOnly}
            sortBy={sortBy}
            onSearchChange={setSearchQuery}
            onCategorySelect={setSelectedCategory}
            onSpreadSelect={setSelectedSpread}
            onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
            onSortChange={setSortBy}
          />
        )}

        {readings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔮</Text>
            <Text style={styles.emptyTitle}>Нет гаданий</Text>
            <Text style={styles.emptyText}>Ваша история гаданий пока пуста</Text>
            <TouchableOpacity
              style={styles.newReadingButton}
              onPress={() => router.push('/')}
            >
              <LinearGradient
                colors={['#9B59B6', '#8E44AD']}
                style={styles.newReadingButtonGradient}
              >
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.newReadingButtonText}>Создать гадание</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : filteredReadings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Ничего не найдено</Text>
            <Text style={styles.emptyText}>Попробуйте изменить фильтры поиска</Text>
            <TouchableOpacity
              style={styles.newReadingButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedSpread(null);
                setShowFavoritesOnly(false);
              }}
            >
              <LinearGradient
                colors={['#9B59B6', '#8E44AD']}
                style={styles.newReadingButtonGradient}
              >
                <Ionicons name="refresh" size={20} color="#FFF" />
                <Text style={styles.newReadingButtonText}>Сбросить фильтры</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.readingsContainer}>
              {filteredReadings.map((reading) => {
                const categoryInfo = CATEGORIES[reading.category as keyof typeof CATEGORIES] || CATEGORIES.general;
                const spreadName = SPREADS[reading.spread_type as keyof typeof SPREADS] || reading.spread_type;
                return (
                  <EnhancedHistoryCard
                    key={reading.id}
                    reading={reading}
                    isFavorite={favorites.has(reading.id)}
                    notes={notes[reading.id] || ''}
                    tags={tags[reading.id] || []}
                    onToggleFavorite={toggleFavorite}
                    onSaveNotes={saveNotes}
                    onAddTag={addTag}
                    onRemoveTag={removeTag}
                    onViewDetails={(r) => console.log('View details:', r.id)}
                    categoryInfo={categoryInfo}
                    spreadName={spreadName}
                  />
                );
              })}
            </View>
          </ScrollView>
        )}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 15,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E8E8E8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#E8E8E8',
    marginTop: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E8E8E8',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#B8B8B8',
    textAlign: 'center',
    marginBottom: 30,
  },
  newReadingButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  newReadingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    gap: 8,
  },
  newReadingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  readingsContainer: {
    padding: 20,
  },
  readingCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  readingInfo: {
    flex: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
  },
  readingDate: {
    fontSize: 12,
    color: '#666',
  },
  readingQuestion: {
    fontSize: 16,
    color: '#E8E8E8',
    lineHeight: 22,
    marginBottom: 10,
  },
  readingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spreadType: {
    fontSize: 12,
    color: '#9B59B6',
    backgroundColor: '#9B59B633',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  expandedContent: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cardsPreview: {
    marginBottom: 15,
  },
  cardsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 8,
  },
  cardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardPosition: {
    fontSize: 12,
    color: '#9B59B6',
    minWidth: 120,
  },
  cardName: {
    fontSize: 12,
    color: '#E8E8E8',
    flex: 1,
  },
  interpretationPreview: {},
  interpretationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 8,
  },
  interpretationText: {
    fontSize: 13,
    color: '#B8B8B8',
    lineHeight: 18,
  },
});