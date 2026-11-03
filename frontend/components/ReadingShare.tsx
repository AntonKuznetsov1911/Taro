import React, { useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { resolveSpread } from '../src/data/spreads';
import { getTarotCardImageById } from '../src/utils/tarotCardAssets';
import { showAlert } from '../src/utils/alert';
import { captureReadingImage } from '../src/utils/captureReadingImage';
import type { DrawnCard } from '../src/utils/offlineApi';
import { taro } from './TaroPage';

export type ShareReading = {
  id: string;
  question: string;
  spread_type: string;
  created_at: string;
  interpretation: string;
  cards: DrawnCard[];
};

export function ReadingShare({ reading, summary, connection, onClose }: {
  reading: ShareReading; summary: string; connection: string; onClose: () => void;
}) {
  const [withQuestion, setWithQuestion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set());
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const busy = useRef(false);
  const preview = useRef<View>(null);
  const name = resolveSpread(reading.spread_type).name;
  const date = new Date(reading.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const ready = loaded.size === reading.cards.length && layout.width > 0;
  const largeCards = reading.cards.length <= 3;
  const imageWidth = (Math.max(layout.width, 200) - 28) * (largeCards ? .29 : .18);
  const imageHeight = Math.round((largeCards ? Math.min(imageWidth, 105) : imageWidth) * 1.5);

  const shareImage = async () => {
    if (!ready || busy.current || !preview.current) return;
    busy.current = true;
    setLoading(true);
    try {
      // Capture the committed preview after any recent privacy switch update.
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const uri = await captureReadingImage(preview.current, 1080, Math.round(1080 * layout.height / layout.width));
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = 'Таро — расклад.png';
        link.click();
      } else {
        if (!(await Sharing.isAvailableAsync())) throw new Error('На устройстве нет меню отправки');
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Поделиться раскладом' });
      }
    } catch (error) {
      console.warn('Taro card export failed', error instanceof Error ? error.message : error);
      showAlert('Карточка расклада', 'Не удалось подготовить изображение. Попробуйте ещё раз.');
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  const shareText = async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    const cards = reading.cards.map(card => card.name + (card.is_reversed ? ' (перевёрнутая)' : '')).join(', ');
    try {
      await Share.share({ message: ['Таро · ' + name, withQuestion ? reading.question : '', cards, summary, connection].filter(Boolean).join('\n\n') });
    } catch {
      showAlert('Карточка расклада', 'Не удалось поделиться текстом.');
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={() => { if (!busy.current) onClose(); }}>
      <View style={styles.backdrop}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>Карточка расклада</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Закрыть карточку" disabled={loading} onPress={onClose} style={styles.close}>
                <Ionicons name="close" size={23} color={taro.gold} />
              </Pressable>
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Показывать мой вопрос</Text>
              <Switch accessibilityLabel="Показывать мой вопрос" value={withQuestion} onValueChange={setWithQuestion} disabled={loading}
                trackColor={{ true: '#8260A2', false: '#473A51' }} thumbColor={withQuestion ? taro.gold : '#CEC4D7'} />
            </View>
            <View ref={preview} collapsable={false} testID="reading-share-preview" onLayout={({ nativeEvent }) => setLayout(nativeEvent.layout)}>
              <LinearGradient colors={['#241537', '#100B1B']} style={styles.preview}>
                <Text style={styles.mark}>✦  Т А Р О  ✦</Text>
                <Text style={styles.spread}>{name}</Text>
                <Text style={styles.date}>{date}</Text>
                {withQuestion && <Text numberOfLines={4} style={styles.question}>«{reading.question}»</Text>}
                <View style={styles.cards}>
                  {reading.cards.map(card => (
                    <View key={card.id} style={[styles.card, largeCards && styles.largeCard]}>
                      <Image source={getTarotCardImageById(card.id)} resizeMode="contain"
                        onLoadEnd={() => setLoaded(items => items.has(card.id) ? items : new Set([...items, card.id]))}
                        style={[styles.cardImage, { height: imageHeight }, card.is_reversed && styles.reversed]} />
                      <Text numberOfLines={2} style={styles.cardLabel}>{card.name}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.rule} />
                <Text style={styles.summary}>{summary}</Text>
              </LinearGradient>
            </View>
            <Pressable accessibilityRole="button" disabled={!ready || loading} onPress={() => { void shareImage(); }}
              style={[styles.share, (!ready || loading) && styles.disabled]}>
              <Text style={styles.shareLabel}>{loading ? 'Готовим карточку…' : Platform.OS === 'web' ? 'Сохранить изображение' : 'Поделиться изображением'}</Text>
            </Pressable>
            {Platform.OS !== 'web' && <Pressable accessibilityRole="button" disabled={loading} onPress={() => { void shareText(); }} style={styles.textButton}>
              <Text style={styles.textLabel}>Поделиться текстом</Text>
            </Pressable>}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#050209DF' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 32 },
  sheet: { width: '100%', maxWidth: 460, alignSelf: 'center', backgroundColor: taro.panel, borderColor: taro.border, borderWidth: 1, borderRadius: 19, padding: 12, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { color: taro.text, fontSize: 18, fontWeight: '700', flexShrink: 1 },
  close: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42, gap: 6 },
  switchLabel: { color: taro.muted, fontSize: 14, flexShrink: 1 },
  preview: { borderColor: '#9C7850', borderWidth: 1, padding: 13, alignItems: 'center', gap: 8, backgroundColor: '#170D25' },
  mark: { color: taro.gold, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  spread: { color: taro.text, fontWeight: '700', fontSize: 22, textAlign: 'center' },
  date: { color: taro.muted, fontSize: 12, textAlign: 'center' },
  question: { color: taro.text, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  cards: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', paddingVertical: 5 },
  card: { width: '18%', gap: 4, alignItems: 'center' },
  largeCard: { width: '29%', maxWidth: 105 },
  cardImage: { width: '100%', borderRadius: 3 },
  reversed: { transform: [{ rotate: '180deg' }] },
  cardLabel: { color: taro.gold, fontSize: 9, lineHeight: 12, textAlign: 'center' },
  rule: { width: '48%', height: 1, backgroundColor: '#9C7850' },
  summary: { fontSize: 13, lineHeight: 19, color: taro.text, textAlign: 'center' },
  share: { minHeight: 48, borderRadius: 12, backgroundColor: taro.gold, alignItems: 'center', justifyContent: 'center', padding: 8 },
  shareLabel: { color: taro.background, fontSize: 14, fontWeight: '700' },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  textLabel: { color: taro.gold, fontSize: 14, fontWeight: '600' },
  disabled: { opacity: .5 },
});
