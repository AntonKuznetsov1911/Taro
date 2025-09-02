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

  useEffect(() =&gt; {
    const load = async () =&gt; {
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

  const fetchInterpretation = async (isReversed: boolean) =&gt; {
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

  const onToggleReversed = async (val: boolean) =&gt; {
    setReversed(val);
    await playClick({ soundEnabled: settings.soundEnabled, vibration: settings.vibration });
    await fetchInterpretation(val);
  };

  if (loading || !card) {
    return (
      &lt;SafeAreaView style={styles.container}&gt;
        &lt;LinearGradient colors={["#0a0a0a", "#1a1a2e", "#16213e"]} style={styles.background}&gt;
          &lt;View style={styles.loadingWrap}&gt;
            &lt;ActivityIndicator size="large" color="#9B59B6" /&gt;
            &lt;Text style={styles.loadingText}&gt;Загрузка карты...&lt;/Text&gt;
          &lt;/View&gt;
        &lt;/LinearGradient&gt;
      &lt;/SafeAreaView&gt;
    );
  }

  return (
    &lt;SafeAreaView style={styles.container}&gt;
      &lt;LinearGradient colors={["#0a0a0a", "#1a1a2e", "#16213e"]} style={styles.background}&gt;
        &lt;ScrollView showsVerticalScrollIndicator={false}&gt;
          &lt;View style={styles.header}&gt;
            &lt;TouchableOpacity onPress={() =&gt; router.back()} style={styles.backButton}&gt;
              &lt;Ionicons name="arrow-back" size={24} color="#E8E8E8" /&gt;
            &lt;/TouchableOpacity&gt;
            &lt;Text style={styles.title}&gt;{card.name}&lt;/Text&gt;
            &lt;View style={{ width: 24 }} /&gt;
          &lt;/View&gt;

          &lt;View style={styles.imageWrap}&gt;
            {card.image ? (
              &lt;Image source={{ uri: card.image }} style={styles.image} resizeMode="cover" /&gt;
            ) : (
              &lt;LinearGradient colors={["#2C3E50", "#34495E"]} style={styles.imageFallback}&gt;
                &lt;Text style={styles.cardName}&gt;{card.name}&lt;/Text&gt;
              &lt;/LinearGradient&gt;
            )}
          &lt;/View&gt;

          &lt;View style={styles.row}&gt;
            &lt;View style={styles.badge}&gt;
              &lt;Text style={styles.badgeText}&gt;{card.type === 'major' ? 'Старший аркан' : (card.suit || card.type)}&lt;/Text&gt;
            &lt;/View&gt;
            &lt;View style={styles.spacer} /&gt;
            &lt;View style={styles.switchRow}&gt;
              &lt;Text style={styles.label}&gt;Перевернутая&lt;/Text&gt;
              &lt;Switch value={reversed} onValueChange={onToggleReversed} trackColor={{ false: '#666', true: '#9B59B6' }} thumbColor={reversed ? '#BB6BD9' : '#EEE'} /&gt;
            &lt;/View&gt;
          &lt;/View&gt;

          &lt;View style={styles.section}&gt;
            &lt;Text style={styles.sectionTitle}&gt;Ключевые слова&lt;/Text&gt;
            &lt;View style={styles.keywords}&gt;
              {card.keywords.map((k, i) =&gt; (
                &lt;View style={styles.keyword} key={i}&gt;
                  &lt;Text style={styles.keywordText}&gt;{k}&lt;/Text&gt;
                &lt;/View&gt;
              ))}
            &lt;/View&gt;
          &lt;/View&gt;

          &lt;View style={styles.section}&gt;
            &lt;Text style={styles.sectionTitle}&gt;Значение&lt;/Text&gt;
            &lt;Text style={styles.meaning}&gt;{reversed ? card.reversed_meaning : card.upright_meaning}&lt;/Text&gt;
          &lt;/View&gt;

          &lt;View style={styles.section}&gt;
            &lt;Text style={styles.sectionTitle}&gt;Толкование&lt;/Text&gt;
            &lt;Text style={styles.meaning}&gt;{interpretation}&lt;/Text&gt;
          &lt;/View&gt;

          &lt;View style={{ height: 24 }} /&gt;
        &lt;/ScrollView&gt;
      &lt;/LinearGradient&gt;
    &lt;/SafeAreaView&gt;
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