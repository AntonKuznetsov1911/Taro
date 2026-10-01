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

type DrawnLineId = PalmLineId | 'minor';

const LINE_COLORS: Record<DrawnLineId, string> = {
  heart_line: '#FF6B9D',
  head_line: '#4ECDC4',
  life_line: '#2ECC71',
  fate_line: '#F1C40F',
  minor: 'rgba(255, 255, 255, 0.85)',
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

/**
 * Участок снимка с ладонью (доли ширины и высоты): найденные линии с
 * запасом вокруг, в пропорциях 3:4 — чтобы ладонь была крупно
 */
function palmFocus(lines: Array<{ path: Point[] }>, photoW: number, photoH: number) {
  const pts = lines.flatMap(l => l.path);
  if (pts.length < 2) return null;
  const xs = pts.map(p => p.x * photoW), ys = pts.map(p => p.y * photoH);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  let w = (Math.max(...xs) - Math.min(...xs)) * 1.9;
  let h = (Math.max(...ys) - Math.min(...ys)) * 1.9;
  // Не слишком крупно и в пропорциях 3:4
  w = Math.max(w, h * 0.75, photoW * 0.35);
  h = w / 0.75;
  if (h > photoH) { h = photoH; w = h * 0.75; }
  if (w > photoW) { w = photoW; h = w / 0.75; }
  const x0 = Math.min(Math.max(0, cx - w / 2), photoW - w);
  const y0 = Math.min(Math.max(0, cy - h / 2), photoH - h);
  return { x: x0 / photoW, y: y0 / photoH, w: w / photoW, h: h / photoH };
}

/** Отрезки для отрисовки найденных линий поверх снимка */
function buildSegments(
  lines: Array<{ id: DrawnLineId; path: Point[] }>,
  width: number,
  height: number,
  offset: Point = { x: 0, y: 0 }
) {
  const segments: Array<{ key: string; left: number; top: number; width: number; angle: number; color: string }> = [];
  for (const line of lines) {
    for (let i = 0; i < line.path.length - 1; i++) {
      const a = { x: line.path[i].x * width - offset.x, y: line.path[i].y * height - offset.y };
      const b = { x: line.path[i + 1].x * width - offset.x, y: line.path[i + 1].y * height - offset.y };
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
  const enhancedUri = typeof params.enhancedUri === 'string' ? params.enhancedUri : '';
  const softPhoto = params.soft === '1';
  const source: PalmSource = params.source === 'auto' ? 'auto' : 'manual';

  const features = useMemo(() => parseJson<Partial<PalmFeatures>>(params.features, {}), [params.features]);
  const lines = useMemo(() => parseJson<Array<{ id: DrawnLineId; path: Point[] }>>(params.lines, []), [params.lines]);
  const measurements = useMemo(() => parseJson<PalmMeasurements | null>(params.measurements, null), [params.measurements]);
  const complete = isPalmFeaturesComplete(features);
  const minorCount = lines.filter(l => l.id === 'minor').length;
  const interpretation = useMemo(
    () => (complete ? generatePalmReading(features as PalmFeatures, source) : ''),
    [complete, features, source]
  );

  const photoW = Number(params.width) || 3;
  const photoH = Number(params.height) || 4;
  const [zoomed, setZoomed] = useState(true);
  const focus = useMemo(() => palmFocus(lines, photoW, photoH), [lines, photoW, photoH]);
  // Крупный план ладони: снимок растягивается так, чтобы её участок
  // заполнил рамку, лишнее обрезается
  const view = zoomed && focus
    ? {
        frameH: Math.round(IMAGE_WIDTH / 0.75),
        imgW: IMAGE_WIDTH / focus.w,
        imgH: (IMAGE_WIDTH / focus.w) * (photoH / photoW),
        left: -(focus.x * IMAGE_WIDTH) / focus.w,
        top: -(focus.y * (IMAGE_WIDTH / focus.w) * (photoH / photoW)),
      }
    : {
        frameH: Math.round((IMAGE_WIDTH * photoH) / photoW),
        imgW: IMAGE_WIDTH,
        imgH: Math.round((IMAGE_WIDTH * photoH) / photoW),
        left: 0,
        top: 0,
      };
  const imageHeight = view.frameH;
  const segments = useMemo(
    () => buildSegments(lines, view.imgW, view.imgH, { x: -view.left, y: -view.top }),
    [lines, view.imgW, view.imgH, view.left, view.top]
  );

  const [showLines, setShowLines] = useState(true);
  const [contrastView, setContrastView] = useState(false);
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
              <View style={[styles.imageWrap, { width: IMAGE_WIDTH + 4, height: imageHeight + 4 }]}>
                {imageUri ? (
                  <Image
                    source={{ uri: contrastView && enhancedUri ? enhancedUri : imageUri }}
                    style={{ position: 'absolute', left: view.left, top: view.top, width: view.imgW, height: view.imgH }}
                  />
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
              <View style={styles.toggleRow}>
                {!!enhancedUri && (
                  <TouchableOpacity style={[styles.toggle, contrastView && styles.toggleActive]} onPress={() => setContrastView(v => !v)}>
                    <Text style={styles.toggleText}>{contrastView ? 'Обычное фото' : 'Контраст'}</Text>
                  </TouchableOpacity>
                )}
                {!!focus && (
                  <TouchableOpacity style={[styles.toggle, !zoomed && styles.toggleActive]} onPress={() => setZoomed(v => !v)}>
                    <Text style={styles.toggleText}>{zoomed ? 'Весь снимок' : 'Крупно'}</Text>
                  </TouchableOpacity>
                )}
                {segments.length > 0 && (
                  <TouchableOpacity style={[styles.toggle, showLines && styles.toggleActive]} onPress={() => setShowLines(v => !v)}>
                    <Text style={styles.toggleText}>{showLines ? 'Без разметки' : 'Разметка'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {softPhoto && (
                <Text style={styles.softWarning}>
                  Снимок немного размыт — тонкие линии могли не попасть в разбор, а глубина может быть занижена.
                  Для точности переснимите при хорошем свете.
                </Text>
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
                {minorCount > 0 && (
                  <View style={styles.detectLine}>
                    <View style={[styles.dot, { backgroundColor: '#FFFFFF' }]} />
                    <Text style={styles.detectRow}>
                      <Text style={styles.detectLabel}>Другие линии: </Text>
                      {minorCount} (показаны белым; сеть обучена на главных линиях, поэтому мелкие видит не все)
                    </Text>
                  </View>
                )}
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
                  {params.method === 'net'
                    ? 'Линии нашла нейросеть, обученная на размеченных фотографиях ладоней (открытый проект «Fortune On Your Hand», лицензия Apache 2.0); глубина линий оценена по контрасту на снимке.'
                    : 'Линии найдены по контрасту складок на снимке — результат зависит от света и чёткости фото.'}
                  {' '}Хиромантия — традиция толкования, а не наука: используйте чтение как повод
                  задуматься о себе.
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
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 10 },
  toggle: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, backgroundColor: 'rgba(155,89,182,0.2)', borderWidth: 1, borderColor: 'transparent' },
  toggleActive: { borderColor: '#BB6BD9' },
  softWarning: { marginTop: 10, fontSize: 12, lineHeight: 17, color: '#F1C40F', textAlign: 'center', maxWidth: 340 },
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
