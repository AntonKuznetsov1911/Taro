import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  StatusBar,
} from 'react-native';
import { showAlert } from '../src/utils/alert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { readingsStorage } from '../src/utils/storage';
import { stripMarkdown } from '../src/utils/stripMarkdown';
import {
  HAND_SHAPE_OPTIONS,
  LINE_TRAIT_OPTIONS,
  PALM_LINE_STEPS,
  PalmFeatures,
  PalmLineId,
  PalmSource,
  generatePalmReading,
  isPalmFeaturesComplete,
} from '../src/utils/palmReading';
import type { PalmMeasurements, Point } from '../src/utils/palmVision';

const LINE_COLORS: Record<PalmLineId, string> = {
  heart_line: '#FF6B9D',
  head_line: '#4ECDC4',
  life_line: '#2ECC71',
  fate_line: '#F1C40F',
};

const IMAGE_WIDTH = 300;
const LINE_THICKNESS = 3;

function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string' || !raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Отрезки для отрисовки найденных линий поверх снимка */
function buildSegments(lines: Array<{ id: PalmLineId; path: Point[] }>, width: number, height: number) {
  const segments: Array<{ key: string; left: number; top: number; width: number; angle: number; color: string }> = [];
  for (const line of lines) {
    for (let i = 0; i < line.path.length - 1; i++) {
      const a = { x: line.path[i].x * width, y: line.path[i].y * height };
      const b = { x: line.path[i + 1].x * width, y: line.path[i + 1].y * height };
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 0.5) continue;
      segments.push({
        key: `${line.id}-${i}`,
        left: (a.x + b.x) / 2 - len / 2,
        top: (a.y + b.y) / 2 - LINE_THICKNESS / 2,
        width: len,
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
        color: LINE_COLORS[line.id],
      });
    }
  }
  return segments;
}

export default function PalmistryResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const imageUri = typeof params.imageUri === 'string' ? params.imageUri : '';
  const source: PalmSource = params.source === 'auto' ? 'auto' : 'manual';

  const features = useMemo(() => parseJson<Partial<PalmFeatures>>(params.features, {}), [params.features]);
  const lines = useMemo(() => parseJson<Array<{ id: PalmLineId; path: Point[] }>>(params.lines, []), [params.lines]);
  const measurements = useMemo(() => parseJson<PalmMeasurements | null>(params.measurements, null), [params.measurements]);
  const complete = isPalmFeaturesComplete(features);
  const interpretation = useMemo(
    () => (complete ? generatePalmReading(features as PalmFeatures, source) : ''),
    [complete, features, source]
  );

  const photoW = Number(params.width) || 3;
  const photoH = Number(params.height) || 4;
  const imageHeight = Math.round((IMAGE_WIDTH * photoH) / photoW);
  const segments = useMemo(() => buildSegments(lines, IMAGE_WIDTH, imageHeight), [lines, imageHeight]);

  const [showLines, setShowLines] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const traitTitle = (id: string) => LINE_TRAIT_OPTIONS.find(o => o.id === id)?.title.toLowerCase() ?? id;
  const hand = HAND_SHAPE_OPTIONS.find(h => h.id === features.hand);

  const handleShare = async () => {
    try {
      await Share.share({ message: `Чтение ладони\n\n${stripMarkdown(interpretation)}` });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSave = async () => {
    if (isSaving || isSaved) return;
    try {
      setIsSaving(true);
      await readingsStorage.addReading({
        id: `palmistry-${Date.now()}`,
        question: hand ? `Чтение ладони · ${hand.title.toLowerCase()} рука` : 'Чтение ладони',
        category: 'general',
        spread_type: 'palmistry',
        cards: [],
        positions: [],
        palm_features: features,
        image_uri: imageUri,
        interpretation,
        created_at: new Date().toISOString(),
      });
      setIsSaved(true);
      showAlert('Сохранено', 'Чтение ладони сохранено в историю');
    } catch (error) {
      console.error('Error saving palmistry reading:', error);
      showAlert('Ошибка', 'Не удалось сохранить результат. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  };

  const editFeatures = () => {
    router.push({ pathname: '/camera', params: { imageUri, features: JSON.stringify(features) } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']} style={styles.background}>
        <StatusBar barStyle="light-content" backgroundColor="#000011" />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          >
            <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Чтение ладони</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare} disabled={!complete}>
            <Ionicons name="share-outline" size={24} color="#E8E8E8" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!complete ? (
            <View style={styles.empty}>
              <Ionicons name="hand-left-outline" size={56} color="#9B59B6" />
              <Text style={styles.emptyTitle}>Толкование недоступно</Text>
              <Text style={styles.emptyText}>Сфотографируйте ладонь, чтобы получить чтение.</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/camera')}>
                <Text style={styles.primaryButtonText}>Сфотографировать ладонь</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Снимок с найденными линиями */}
              <View style={styles.imageWrap}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={{ width: IMAGE_WIDTH, height: imageHeight }} />
                ) : (
                  <View style={[styles.imagePlaceholder, { width: IMAGE_WIDTH, height: imageHeight }]}>
                    <Ionicons name="hand-left-outline" size={56} color="#9B59B6" />
                  </View>
                )}
                {showLines && (
                  <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    {segments.map(seg => (
                      <View
                        key={seg.key}
                        style={{
                          position: 'absolute',
                          left: seg.left,
                          top: seg.top,
                          width: seg.width,
                          height: LINE_THICKNESS,
                          borderRadius: LINE_THICKNESS / 2,
                          backgroundColor: seg.color,
                          transform: [{ rotate: `${seg.angle}deg` }],
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>
              {segments.length > 0 && (
                <TouchableOpacity style={styles.toggle} onPress={() => setShowLines(v => !v)}>
                  <Text style={styles.toggleText}>{showLines ? 'Скрыть линии' : 'Показать найденные линии'}</Text>
                </TouchableOpacity>
              )}

              {/* Что распознано */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{source === 'auto' ? '🔍 Что распознано на снимке' : '✍️ Ваше описание'}</Text>
                {hand && (
                  <Text style={styles.detectRow}>
                    <Text style={styles.detectLabel}>Форма руки: </Text>
                    {hand.title} — {hand.hint.toLowerCase()}
                    {measurements
                      ? ` (длина ладони к ширине ${measurements.palmRatio.toFixed(2)}, средний палец ${Math.round(measurements.fingerRatio * 100)}% длины ладони)`
                      : ''}
                  </Text>
                )}
                {PALM_LINE_STEPS.map(step => {
                  const traits = features[step.id];
                  return (
                    <View key={step.id} style={styles.detectLine}>
                      <View style={[styles.dot, { backgroundColor: LINE_COLORS[step.id] }]} />
                      <Text style={styles.detectRow}>
                        <Text style={styles.detectLabel}>{step.title}: </Text>
                        {traits === 'none' ? 'не выражена' : Array.isArray(traits) ? traits.map(traitTitle).join(', ') : '—'}
                      </Text>
                    </View>
                  );
                })}
                <TouchableOpacity style={styles.editButton} onPress={editFeatures}>
                  <Ionicons name="create-outline" size={16} color="#BB6BD9" />
                  <Text style={styles.editText}>Не согласны? Поправить</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <MarkdownRenderer content={interpretation} />
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#9B59B6" />
                <Text style={styles.infoText}>
                  Линии находятся автоматически по контрасту складок на снимке — результат
                  зависит от света и чёткости фото. Хиромантия — традиция толкования, а не
                  наука: используйте чтение как повод задуматься о себе.
                </Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: isSaved ? 'rgba(39,174,96,0.6)' : 'rgba(39,174,96,0.9)' }]}
                  onPress={handleSave}
                  disabled={isSaving || isSaved}
                >
                  <Ionicons name={isSaved ? 'checkmark' : 'bookmark'} size={20} color="#FFF" />
                  <Text style={styles.actionText}>{isSaving ? 'Сохранение...' : isSaved ? 'Сохранено' : 'Сохранить'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: 'rgba(142, 68, 173, 0.95)' }]}
                  onPress={() => router.replace('/camera')}
                >
                  <Ionicons name="camera" size={20} color="#FFF" />
                  <Text style={styles.actionText}>Новый снимок</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: { padding: 8, width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#E8E8E8' },
  content: { alignItems: 'center', padding: 16, paddingBottom: 40 },
  imageWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(155, 89, 182, 0.6)',
    backgroundColor: '#000',
  },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  toggle: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 16, backgroundColor: 'rgba(155,89,182,0.2)' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#E8E8E8' },
  card: {
    alignSelf: 'stretch',
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#E8E8E8', marginBottom: 10 },
  detectLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  detectRow: { flex: 1, fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.88)', marginBottom: 6 },
  detectLabel: { fontWeight: '600', color: '#E8E8E8' },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  editText: { fontSize: 14, color: '#BB6BD9', fontWeight: '600' },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(155, 89, 182, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18, color: 'rgba(255,255,255,0.75)' },
  actions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 20 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 25,
  },
  actionText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  empty: { alignItems: 'center', gap: 12, marginTop: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#E8E8E8' },
  emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  primaryButton: { marginTop: 10, paddingVertical: 14, paddingHorizontal: 26, borderRadius: 25, backgroundColor: 'rgba(142, 68, 173, 0.95)' },
  primaryButtonText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
