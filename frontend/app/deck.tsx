import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type CardItem = {
  id: number;
  name: string;
  name_en: string;
  type: string;
  suit?: string | null;
  image: string;
  keywords: string[];
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

  useEffect(() => {
    const load = async () =&gt; {
      try {
        const res = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/deck`);
        const data = await res.json();
        setCards(data.cards || []);
      } catch (e) {
        console.error('Failed to load deck', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() =&gt; {
    const q = query.trim().toLowerCase();
    return cards.filter((c) =&gt; {
      const suitOk = suit === 'all' ? true : (c.suit || c.type) === suit;
      const qOk = !q
        ? true
        : c.name.toLowerCase().includes(q) ||
          c.name_en.toLowerCase().includes(q) ||
          (c.keywords || []).some((k) =&gt; k.toLowerCase().includes(q));
      return suitOk &amp;&amp; qOk;
    });
  }, [cards, query, suit]);

  const renderItem = ({ item }: { item: CardItem }) =&gt; (
    &lt;TouchableOpacity style={styles.card} onPress={() =&gt; router.push(`/deck/${item.id}`)} activeOpacity={0.8}&gt;
      {item.image ? (
        &lt;Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" /&gt;
      ) : (
        &lt;LinearGradient colors={["#2C3E50", "#34495E"]} style={styles.cardFallback}&gt;
          &lt;Text style={styles.cardName}&gt;{item.name}&lt;/Text&gt;
        &lt;/LinearGradient&gt;
      )}
      &lt;View style={styles.cardLabel}&gt;
        &lt;Text style={styles.cardLabelText} numberOfLines={1}&gt;{item.name}&lt;/Text&gt;
      &lt;/View&gt;
    &lt;/TouchableOpacity&gt;
  );

  return (
    &lt;SafeAreaView style={styles.container}&gt;
      &lt;LinearGradient colors={["#0a0a0a", "#1a1a2e", "#16213e"]} style={styles.background}&gt;
        &lt;KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}&gt;
          &lt;View style={styles.header}&gt;
            &lt;TouchableOpacity onPress={() =&gt; router.back()} style={styles.backButton}&gt;
              &lt;Ionicons name="arrow-back" size={24} color="#E8E8E8" /&gt;
            &lt;/TouchableOpacity&gt;
            &lt;Text style={styles.title}&gt;Каталог колоды&lt;/Text&gt;
            &lt;View style={{ width: 24 }} /&gt;
          &lt;/View&gt;

          &lt;View style={styles.searchRow}&gt;
            &lt;Ionicons name="search" size={18} color="#9B59B6" /&gt;
            &lt;TextInput
              placeholder="Поиск по названию или ключевым словам"
              placeholderTextColor="#9B59B6AA"
              style={styles.input}
              value={query}
              onChangeText={setQuery}
            /&gt;
          &lt;/View&gt;

          &lt;View style={styles.filters}&gt;
            {SUIT_FILTERS.map((f) =&gt; {
              const active = suit === f.key;
              return (
                &lt;TouchableOpacity key={f.key} onPress={() =&gt; setSuit(f.key)} style={[styles.filterChip, active &amp;&amp; styles.filterChipActive]}&gt;
                  &lt;Text style={[styles.filterText, active &amp;&amp; styles.filterTextActive]}&gt;{f.label}&lt;/Text&gt;
                &lt;/TouchableOpacity&gt;
              );
            })}
          &lt;/View&gt;

          {loading ? (
            &lt;View style={styles.loadingWrap}&gt;
              &lt;ActivityIndicator size="large" color="#9B59B6" /&gt;
              &lt;Text style={styles.loadingText}&gt;Загрузка колоды...&lt;/Text&gt;
            &lt;/View&gt;
          ) : (
            &lt;FlatList
              contentContainerStyle={styles.listContent}
              data={filtered}
              numColumns={2}
              keyExtractor={(it) =&gt; String(it.id)}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
            /&gt;
          )}
        &lt;/KeyboardAvoidingView&gt;
      &lt;/LinearGradient&gt;
    &lt;/SafeAreaView&gt;
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
  cardName: { color: '#E8E8E8', fontSize: 14, textAlign: 'center' },
  cardLabel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 6, paddingHorizontal: 8 },
  cardLabelText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#B8B8B8', marginTop: 8 },
});