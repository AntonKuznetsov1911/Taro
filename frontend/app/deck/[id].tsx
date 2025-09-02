import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { playClick } from '../../src/utils/sound';
import { useSettings } from '../../src/contexts/SettingsContext';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type CardDetail = {
  id: number;
  name: string;
  name_en: string;
  type: string;
  suit?: string | null;
  image: string;
  keywords: string[];
  upright_meaning: string;
  reversed_meaning: string;
};

export default function CardDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reversed, setReversed] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const cardId = Number(id);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/card/${cardId}`);
        const data = await res.json();
        setCard(data.card);
        await fetchInterpretation(false);
      } catch (e) {
        console.error('Failed to load card', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cardId]);

  const fetchInterpretation = async (isReversed: boolean) => {
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/card-interpretation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: cardId, reversed: isReversed })
      });
      const data = await res.json();
      setInterpretation(data.interpretation);
    } catch (e) {
      // fallback: use built-in meanings
      if (card) {
        setInterpretation(isReversed ? card.reversed_meaning : card.upright_meaning);
      }
    }
  };

  const settings = useSettings();

  const onToggleReversed = async (val: boolean) => {
    setReversed(val);
    await playClick({ soundEnabled: settings.soundEnabled, vibration: settings.vibration });
    await fetchInterpretation(val);
  };

  if (loading || !card) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#0a0a0a", "#1a1a2e", "#16213e"]} style={styles.background}>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#9B59B6" />
            <Text style={styles.loadingText}>Загрузка карты...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#0a0a0a", "#1a1a2e", "#16213e"]} style={styles.background}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
            </TouchableOpacity>
            <Text style={styles.title}>{card.name}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.imageWrap}>
            {card.image ? (
              <Image source={{ uri: card.image }} style={styles.image} resizeMode="cover" />
            ) : (
              <LinearGradient colors={["#2C3E50", "#34495E"]} style={styles.imageFallback}>
                <Text style={styles.cardName}>{card.name}</Text>
              </LinearGradient>
            )}
          </View>

          <View style={styles.row}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{card.type === 'major' ? 'Старший аркан' : (card.suit || card.type)}</Text>
            </View>
            <View style={styles.spacer} />
            <View style={styles.switchRow}>
              <Text style={styles.label}>Перевернутая</Text>
              <Switch value={reversed} onValueChange={onToggleReversed} trackColor={{ false: '#666', true: '#9B59B6' }} thumbColor={reversed ? '#BB6BD9' : '#EEE'} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ключевые слова</Text>
            <View style={styles.keywords}>
              {card.keywords.map((k, i) => (
                <View style={styles.keyword} key={i}>
                  <Text style={styles.keywordText}>{k}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Значение</Text>
            <Text style={styles.meaning}>{reversed ? card.reversed_meaning : card.upright_meaning}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Толкование</Text>
            <Text style={styles.meaning}>{interpretation}</Text>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  backButton: { padding: 8, marginRight: 8 },
  title: { fontSize: 20, color: '#E8E8E8', fontWeight: '700', flex: 1 },
  imageWrap: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', height: 300, backgroundColor: '#111' },
  image: { width: '100%', height: '100%' },
  imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardName: { color: '#E8E8E8', fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 16 },
  badge: { backgroundColor: '#9B59B622', borderColor: '#9B59B6', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: '#E8E8E8', fontSize: 12 },
  spacer: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { color: '#E8E8E8' },
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: { color: '#E8E8E8', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  keywords: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keyword: { backgroundColor: '#FFFFFF22', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  keywordText: { color: '#E8E8E8', fontSize: 12 },
  meaning: { color: '#E8E8E8', fontSize: 14, lineHeight: 20 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#B8B8B8', marginTop: 8 },
});