import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AnimatedTarotCard } from '../components/AnimatedTarotCard';
import { CardFan } from '../components/CardFan';
import { ReadingInterpretation } from '../components/ReadingInterpretation';
import { taro } from '../components/TaroPage';
import { useSettings } from '../src/contexts/SettingsContext';
import { useUserProfile } from '../src/contexts/UserProfileContext';
import { resolveCategory, resolveSpread } from '../src/data/spreads';
import { generateOfflineTarotReading, generateTarotCardSVG, getOfflineCardBack, shuffleReadingCards, type DrawnCard } from '../src/utils/offlineApi';
import { showAlert } from '../src/utils/alert';
import { playFlip, playReveal, playSelect } from '../src/utils/sound';
import { readingsStorage } from '../src/utils/storage';

export default function ReadingScreen() {
  const params = useLocalSearchParams();
  const spread = resolveSpread(typeof params.spread === 'string' ? params.spread : undefined);
  const category = resolveCategory(typeof params.category === 'string' ? params.category : undefined);
  const question = typeof params.question === 'string' ? params.question.trim().slice(0, 500) : '';
  return <ReadingSession key={spread.id + category + question} spreadId={spread.id} category={category} question={question} />;
}

function ReadingSession({ spreadId, category, question }: { spreadId: string; category: string; question: string }) {
  const router = useRouter();
  const settings = useSettings();
  const { profile } = useUserProfile();
  const { width } = useWindowDimensions();
  const spread = resolveSpread(spreadId);
  const [id] = useState(() => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9));
  const [deck] = useState(() => shuffleReadingCards(Math.max(14, spread.cards + 4)));
  const [back, setBack] = useState('');
  const [drawn, setDrawn] = useState<DrawnCard[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [lifted, setLifted] = useState<number | null>(null);
  const [reading, setReading] = useState<ReturnType<typeof makeReading> | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chime = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stored = useRef(false);
  const saveInFlight = useRef<Promise<void> | null>(null);
  const compactWidth = spread.cards === 1 ? 190 : Math.min(140, Math.floor((width - 62) / 3));

  useEffect(() => {
    mounted.current = true;
    void getOfflineCardBack().then(uri => { if (mounted.current) setBack(uri); }).catch(() => undefined);
    return () => {
      mounted.current = false;
      if (pending.current) clearTimeout(pending.current);
      if (chime.current) clearTimeout(chime.current);
    };
  }, []);

  const sound = { soundEnabled: settings.soundEnabled, vibration: settings.vibration, volume: settings.effectsVolume };

  function makeReading(cards: DrawnCard[]) {
    const value = generateOfflineTarotReading(cards, question, spread.id, category, { profile });
    return {
      id, question: question || 'Общий расклад', category, spread_type: spread.id,
      cards: value.cards.map(card => ({ ...card, image: generateTarotCardSVG(card) })),
      positions: value.positions, interpretation: value.interpretation, created_at: value.timestamp,
    };
  }

  const save = (value = reading): Promise<void> => {
    if (!value || stored.current) return Promise.resolve();
    if (!saveInFlight.current) {
      setSaving(true);
      saveInFlight.current = readingsStorage.addReading(value).then(() => {
        stored.current = true;
        if (mounted.current) setSaved(true);
      }).finally(() => {
        saveInFlight.current = null;
        if (mounted.current) setSaving(false);
      });
    }
    return saveInFlight.current;
  };

  const saveFailed = () => {
    if (mounted.current) showAlert('Не удалось сохранить расклад', 'Проверьте свободное место и попробуйте ещё раз.');
  };

  const finish = (cards: DrawnCard[]) => {
    if (cards.length !== spread.cards) return;
    const result = makeReading(cards);
    setReading(result);
    if (settings.autoSave) void save(result).catch(saveFailed);
  };

  const flip = (count: number, final: boolean) => {
    setRevealed(count);
    void playFlip(sound);
    if (final) chime.current = setTimeout(() => { void playReveal(sound); }, 420);
    busy.current = false;
    setLifted(null);
  };

  const pick = (card: DrawnCard) => {
    if (busy.current || drawn.length >= spread.cards || drawn.some(item => item.id === card.id)) return;
    busy.current = true;
    setLifted(card.id);
    void playSelect(sound);
    const next = [...drawn, card];
    pending.current = setTimeout(() => {
      setDrawn(next);
      pending.current = setTimeout(() => {
        finish(next);
        flip(next.length, next.length === spread.cards);
      }, 210);
    }, 185);
  };

  const openAll = () => {
    if (busy.current || drawn.length >= spread.cards) return;
    busy.current = true;
    const ids = new Set(drawn.map(card => card.id));
    const next = [...drawn, ...deck.filter(card => !ids.has(card.id)).slice(0, spread.cards - drawn.length)];
    setDrawn(next);
    pending.current = setTimeout(() => {
      finish(next);
      flip(next.length, true);
    }, 225);
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={() => router.canGoBack() ? router.back() : router.replace('/spreads')} style={styles.back}>
          <Ionicons name="chevron-back" size={25} color={taro.gold} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>ВАШ РАСКЛАД</Text>
          <Text style={styles.title}>{spread.name}</Text>
        </View>
      </View>
      {question ? <Text style={styles.question}>«{question}»</Text> : null}
      {drawn.length < spread.cards && (
        <View style={styles.stage}>
          <View style={styles.stageHeader}>
            <Text style={styles.stageTitle}>Выберите карту</Text>
            <Text accessibilityLiveRegion="polite" style={styles.counter}>{drawn.length} / {spread.cards}</Text>
          </View>
          <Text style={styles.hint}>Следующая позиция — {spread.positions[drawn.length].title.toLowerCase()}</Text>
          <CardFan cards={deck} chosen={drawn} lifted={lifted} back={back} onPick={pick} />
          <Pressable accessibilityRole="button" onPress={openAll} disabled={lifted !== null} style={styles.secondary}>
            <Text style={styles.secondaryLabel}>Открыть все</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.slots}>
        {spread.positions.map((position, index) => {
          const card = drawn[index];
          return card ? (
            <AnimatedTarotCard key={position.title} card={{ ...card, image: generateTarotCardSVG(card) }}
              position={position.title} index={index} revealed={index < revealed} cardBackImage={back}
              width={compactWidth} entranceDelay={0} />
          ) : (
            <View key={position.title} style={[styles.slot, { width: compactWidth }]}>
              <View style={[styles.slotCard, { height: compactWidth * 1.5 }]}><Text style={styles.slotNumber}>{index + 1}</Text></View>
              <Text style={styles.slotTitle}>{position.title}</Text>
            </View>
          );
        })}
      </View>
      {reading && revealed === spread.cards && (
        <Animated.View entering={FadeIn.duration(400).delay(490)} style={styles.stage}>
          <ReadingInterpretation reading={reading} onBeforeFavorite={save} />
          {!saved && (
            <Pressable accessibilityRole="button" disabled={saving} style={styles.secondary} onPress={() => { void save().catch(saveFailed); }}>
              {saving ? <ActivityIndicator color={taro.gold} /> : <Text style={styles.secondaryLabel}>Сохранить расклад</Text>}
            </Pressable>
          )}
          <Pressable accessibilityRole="button" style={styles.secondary} onPress={async () => {
            await saveInFlight.current?.catch(() => undefined);
            if (mounted.current) router.navigate('/history');
          }}>
            <Text style={styles.secondaryLabel}>История</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => router.navigate('/')}>
            <Text style={styles.secondaryLabel}>На главную</Text>
          </Pressable>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: taro.background },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 16, paddingBottom: 35, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  back: { minWidth: 42, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, gap: 3 },
  eyebrow: { color: taro.gold, fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  title: { color: taro.text, fontSize: 28, fontWeight: '700' },
  question: { color: taro.muted, paddingHorizontal: 5, fontSize: 15, lineHeight: 22 },
  stage: { gap: 10 },
  stageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stageTitle: { color: taro.gold, fontSize: 20, fontWeight: '600' },
  counter: { color: taro.gold, fontSize: 13, backgroundColor: '#2D1A3B', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  hint: { color: taro.muted, fontSize: 13, lineHeight: 18 },
  secondary: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: taro.border, borderRadius: 12, backgroundColor: taro.panel, padding: 9 },
  secondaryLabel: { color: taro.gold, fontSize: 15, fontWeight: '600' },
  slots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', gap: 9 },
  slot: { alignItems: 'center', gap: 7, marginVertical: 8 },
  slotCard: { width: '100%', borderRadius: 10, borderWidth: 1, borderColor: taro.border, borderStyle: 'dashed', backgroundColor: '#140D21', justifyContent: 'center', alignItems: 'center' },
  slotNumber: { color: '#846793', fontSize: 19 },
  slotTitle: { textAlign: 'center', fontSize: 12, lineHeight: 17, color: taro.muted },
});
