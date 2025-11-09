import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface HistoryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  selectedSpread: string | null;
  onSpreadSelect: (spread: string | null) => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  sortBy: 'date' | 'category';
  onSortChange: (sort: 'date' | 'category') => void;
}

const CATEGORIES = [
  { id: 'love', name: 'Любовь', icon: '❤️', color: '#FF6B9D' },
  { id: 'career', name: 'Карьера', icon: '💼', color: '#4ECDC4' },
  { id: 'finance', name: 'Финансы', icon: '💰', color: '#45B7D1' },
  { id: 'general', name: 'Общие', icon: '🔮', color: '#9B59B6' },
];

const SPREADS = [
  { id: 'one_card', name: 'Одна карта' },
  { id: 'three_cards', name: 'Три карты' },
  { id: 'celtic_cross', name: 'Кельтский крест' },
];

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  selectedSpread,
  onSpreadSelect,
  showFavoritesOnly,
  onToggleFavorites,
  sortBy,
  onSortChange,
}) => {
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Поиск по вопросам..."
          placeholderTextColor="#666"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        {/* Favorites Toggle */}
        <TouchableOpacity
          style={[styles.filterButton, showFavoritesOnly && styles.filterButtonActive]}
          onPress={onToggleFavorites}
        >
          <Ionicons
            name={showFavoritesOnly ? 'heart' : 'heart-outline'}
            size={18}
            color={showFavoritesOnly ? '#FF6B9D' : '#666'}
          />
          <Text
            style={[styles.filterButtonText, showFavoritesOnly && styles.filterButtonTextActive]}
          >
            Избранное
          </Text>
        </TouchableOpacity>

        {/* Sort */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => onSortChange(sortBy === 'date' ? 'category' : 'date')}
        >
          <Ionicons
            name={sortBy === 'date' ? 'time-outline' : 'folder-outline'}
            size={18}
            color="#666"
          />
          <Text style={styles.filterButtonText}>
            {sortBy === 'date' ? 'По дате' : 'По категории'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Filters */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Категория:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryButtons}>
            <TouchableOpacity
              style={[styles.categoryButton, !selectedCategory && styles.categoryButtonActive]}
              onPress={() => onCategorySelect(null)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  !selectedCategory && styles.categoryButtonTextActive,
                ]}
              >
                Все
              </Text>
            </TouchableOpacity>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === cat.id && styles.categoryButtonActive,
                ]}
                onPress={() => onCategorySelect(selectedCategory === cat.id ? null : cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === cat.id && styles.categoryButtonTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Spread Filters */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Расклад:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.spreadButtons}>
            <TouchableOpacity
              style={[styles.spreadButton, !selectedSpread && styles.spreadButtonActive]}
              onPress={() => onSpreadSelect(null)}
            >
              <Text
                style={[
                  styles.spreadButtonText,
                  !selectedSpread && styles.spreadButtonTextActive,
                ]}
              >
                Все
              </Text>
            </TouchableOpacity>
            {SPREADS.map((spread) => (
              <TouchableOpacity
                key={spread.id}
                style={[
                  styles.spreadButton,
                  selectedSpread === spread.id && styles.spreadButtonActive,
                ]}
                onPress={() => onSpreadSelect(selectedSpread === spread.id ? null : spread.id)}
              >
                <Text
                  style={[
                    styles.spreadButtonText,
                    selectedSpread === spread.id && styles.spreadButtonTextActive,
                  ]}
                >
                  {spread.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Active Filters Count */}
      {(searchQuery || selectedCategory || selectedSpread || showFavoritesOnly) && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={() => {
            onSearchChange('');
            onCategorySelect(null);
            onSpreadSelect(null);
            if (showFavoritesOnly) onToggleFavorites();
          }}
        >
          <Ionicons name="close-circle-outline" size={16} color="#9B59B6" />
          <Text style={styles.clearFiltersText}>Сбросить фильтры</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#E8E8E8',
  },
  clearButton: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    borderColor: '#FF6B9D',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FF6B9D',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#9B59B6',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    borderColor: '#9B59B6',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryButtonText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#E8E8E8',
  },
  spreadButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  spreadButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  spreadButtonActive: {
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    borderColor: '#9B59B6',
  },
  spreadButtonText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  spreadButtonTextActive: {
    color: '#E8E8E8',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  clearFiltersText: {
    fontSize: 13,
    color: '#9B59B6',
    fontWeight: '600',
  },
});
