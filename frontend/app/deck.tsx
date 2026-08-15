import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FULL_TAROT_DECK, TarotCard } from '../src/data/tarotCards';
import { generateTarotCardSVG } from '../src/utils/offlineApi';

type CardItem = TarotCard & {
  image?: string;
};

const SUIT_FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'major', label: 'Старшие' },
  { key: 'wands', label: 'Жезлы' },
  { key: 'cups', label: 'Кубки' },
  { key: 'swords', label: 'Мечи' },
  { key: 'pentacles', label: 'Пентакли' },
] as const;

type SuitKey = typeof SUIT_FILTERS[number]['key'];

export default function DeckScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [suit, setSuit] = useState<SuitKey>('all');
  const [cardImages, setCardImages] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const load = async () => {
      try {
        // Полная колода из 78 карт — данные встроены, сеть не нужна
        const offlineCards: CardItem[] = FULL_TAROT_DECK.map(card => ({
          ...card,
          image: undefined
        }));
        setCards(offlineCards);

        // Generate images for cards
        const images: { [key: number]: string } = {};
        offlineCards.forEach(card => {
          images[card.id] = generateTarotCardSVG(card, false);
        });
        setCardImages(images);
      } catch (e) {
        console.error('Failed to load deck', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      const suitOk = suit === 'all' ? true : (c.suit || c.type) === suit;
      const qOk = !q
        ? true
        : c.name.toLowerCase().includes(q) ||
          c.name_en.toLowerCase().includes(q) ||
          (c.keywords || []).some((k) => k.toLowerCase().includes(q));
      return suitOk && qOk;
    });
  }, [cards, query, suit]);

  const renderItem = ({ item }: { item: CardItem }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/deck/${item.id}`)} activeOpacity={0.8}>
      {cardImages[item.id] ? (
        <Image source={{ uri: cardImages[item.id] }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <LinearGradient colors={["#2C3E50", "#34495E"]} style={styles.cardFallback}>
          <Text style={styles.cardEmoji}>🎴</Text>
          <Text style={styles.cardName}>{item.name}</Text>
        </LinearGradient>
      )}
      <View style={styles.cardLabel}>
        <Text style={styles.cardLabelText} numberOfLines={1}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#0a0a0a", "#1a1a2e", "#16213e"]} style={styles.background}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
            </TouchableOpacity>
            <Text style={styles.title}>Каталог колоды</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color="#9B59B6" />
            <TextInput
              placeholder="Поиск по названию или ключевым словам"
              placeholderTextColor="#9B59B6AA"
              style={styles.input}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <View style={styles.filters}>
            {SUIT_FILTERS.map((f) => {
              const active = suit === f.key;
              return (
                <TouchableOpacity key={f.key} onPress={() => setSuit(f.key)} style={[styles.filterChip, active && styles.filterChipActive]}>
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#9B59B6" />
              <Text style={styles.loadingText}>Загрузка колоды...</Text>
            </View>
          ) : (
            <FlatList
              contentContainerStyle={styles.listContent}
              data={filtered}
              numColumns={2}
              keyExtractor={(it) => String(it.id)}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>Карты не найдены</Text>
                </View>
              }
            />
          )}
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  backButton: { padding: 8, marginRight: 8 },
  title: { fontSize: 20, color: '#E8E8E8', fontWeight: '700' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: '#9B59B633', gap: 8, backgroundColor: '#1e1e1e'
  },
  input: { flex: 1, color: '#E8E8E8', fontSize: 14 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: '#9B59B633' },
  filterChipActive: { backgroundColor: '#9B59B622', borderColor: '#9B59B6' },
  filterText: { color: '#B8B8B8', fontSize: 12 },
  filterTextActive: { color: '#E8E8E8', fontWeight: '600' },
  listContent: { paddingHorizontal: 12, paddingBottom: 24 },
  card: { flex: 1, margin: 8, height: 220, borderRadius: 14, overflow: 'hidden', backgroundColor: '#111' },
  cardImage: { width: '100%', height: '100%' },
  cardFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 40, marginBottom: 8 },
  cardName: { color: '#E8E8E8', fontSize: 14, textAlign: 'center', paddingHorizontal: 8 },
  cardLabel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 6, paddingHorizontal: 8 },
  cardLabelText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#B8B8B8', marginTop: 8 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 50 },
  emptyText: { color: '#B8B8B8', fontSize: 16 },
});
