import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TaroPage, taro } from '../components/TaroPage';
import { CATEGORY_LENS, SPREADS, pluralCards, type CategoryId, type SpreadId } from '../src/data/spreads';

const categories: CategoryId[] = ['general', 'love', 'career', 'finance'];
const icons = { general: 'sparkles-outline', love: 'heart-outline', career: 'briefcase-outline', finance: 'wallet-outline' } as const;

export default function SpreadsScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryId>('general');
  const [spread, setSpread] = useState<SpreadId>('three_cards');
  return (
    <TaroPage title="Расклады" subtitle="Выберите тему и расположение карт.">
      <Text style={styles.section}>Тема вопроса</Text>
      <View style={styles.categories}>
        {categories.map(id => (
          <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: category === id }}
            onPress={() => setCategory(id)} style={[styles.category, category === id && styles.selected]}>
            <Ionicons name={icons[id]} color={taro.gold} size={20} />
            <Text style={styles.label}>{CATEGORY_LENS[id].name}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.section}>Расположение карт</Text>
      {Object.values(SPREADS).map(item => (
        <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: spread === item.id }}
          onPress={() => setSpread(item.id)} style={[styles.spread, spread === item.id && styles.selected]}>
          <View style={styles.description}>
            <Text style={styles.label}>{item.name}</Text>
            <Text style={styles.hint}>{pluralCards(item.cards)} · {item.positions.slice(0, 3).map(p => p.title).join(' · ')}</Text>
          </View>
          <Ionicons name={spread === item.id ? 'checkmark-circle' : 'ellipse-outline'} color={taro.gold} size={20} />
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" style={styles.primary}
        onPress={() => router.push({ pathname: '/question', params: { category, spread } })}>
        <Ionicons name="sparkles-outline" color={taro.background} size={20} />
        <Text style={styles.primaryText}>Начать гадание</Text>
      </Pressable>
    </TaroPage>
  );
}

const styles = StyleSheet.create({
  section: { color: taro.gold, fontSize: 15, fontWeight: '600' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  category: { flexBasis: '47%', flexGrow: 1, minHeight: 54, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 1, borderColor: taro.border, backgroundColor: taro.panel },
  selected: { backgroundColor: '#31203E', borderColor: '#A88353' },
  spread: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, padding: 14, borderWidth: 1, borderColor: taro.border, borderRadius: 15, backgroundColor: taro.panel },
  description: { flex: 1, gap: 4 },
  label: { color: taro.text, fontSize: 15, fontWeight: '600', flexShrink: 1 },
  hint: { color: taro.muted, fontSize: 12, lineHeight: 18 },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 54, padding: 13, borderRadius: 15, backgroundColor: taro.gold },
  primaryText: { color: taro.background, fontSize: 16, fontWeight: '700' },
});
