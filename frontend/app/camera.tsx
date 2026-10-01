import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PalmCamera } from '../components/PalmCamera';
import { CapturedPalmPhoto } from '../components/palmCameraTypes';
import {
  HandShapeId,
  LineTrait,
  PalmFeatures,
  PalmLineId,
  HAND_SHAPE_OPTIONS,
  PALM_LINE_STEPS,
  isPalmFeaturesComplete,
} from '../src/utils/palmReading';
import { detectPalm, preloadPalmDetector } from '../src/utils/palmDetector';
import type { PalmAnalysis, PalmQualityIssue } from '../src/utils/palmVision';

// Хиромантия: снимок → автоматический разбор ладони → толкование.
// Ручное описание остаётся запасным путём, если руку не удалось
// распознать, и способом поправить распознанное.

type Phase = 'camera' | 'analyzing' | 'failed' | 'manual' | 'done';

const ISSUE_MESSAGES: Record<PalmQualityIssue, string> = {
  too_small: 'Ладонь получилась слишком маленькой — поднесите руку ближе, чтобы она заняла почти всю рамку.',
  too_dark: 'Снимок слишком тёмный — линии не видны. Встаньте к окну или включите свет.',
  too_bright: 'Снимок пересвечен — линии теряются. Уйдите от прямого солнца или вспышки.',
  blurry: 'Снимок размыт. Держите руку и телефон неподвижно и дайте камере сфокусироваться.',
  no_lines: 'На ладони не удалось разглядеть линии. Сфотографируйте раскрытую ладонь при ровном боковом свете.',
};

const BLOCKING_ISSUES: PalmQualityIssue[] = ['too_small', 'too_dark', 'no_lines'];

const DEPTH_OPTIONS: Array<{ id: LineTrait; title: string }> = [
  { id: 'deep', title: 'Глубокая, чёткая' },
  { id: 'shallow', title: 'Тонкая' },
];
const SHAPE_OPTIONS: Array<{ id: LineTrait; title: string }> = [
  { id: 'straight', title: 'Прямая' },
  { id: 'curved', title: 'Изогнутая' },
];
const EXTRA_OPTIONS: Array<{ id: LineTrait; title: string }> = [
  { id: 'broken', title: 'Разрывы' },
  { id: 'chained', title: 'Цепочка' },
  { id: 'forked', title: 'Раздвоение' },
];

function parseFeatures(raw: unknown): Partial<PalmFeatures> {
  if (typeof raw !== 'string' || !raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  // С экрана результата можно вернуться поправить распознанное
  const editUri = typeof params.imageUri === 'string' ? params.imageUri : '';
  const [captured, setCaptured] = useState<CapturedPalmPhoto | null>(
    editUri ? { uri: editUri, base64: '' } : null
  );
  const [phase, setPhase] = useState<Phase>(editUri ? 'manual' : 'camera');
  const [features, setFeatures] = useState<Partial<PalmFeatures>>(() => parseFeatures(params.features));
  const [notice, setNotice] = useState('');

  useEffect(() => {
    preloadPalmDetector();
  }, []);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  const openResult = useCallback(
    (photo: CapturedPalmPhoto, f: PalmFeatures, analysis: PalmAnalysis | null, size?: { width: number; height: number }) => {
      router.push({
        pathname: '/palmistry-result',
        params: {
          imageUri: photo.uri,
          features: JSON.stringify(f),
          source: analysis ? 'auto' : 'manual',
          lines: analysis ? JSON.stringify(analysis.lines.map(l => ({ id: l.id, path: l.path }))) : '[]',
          measurements: analysis ? JSON.stringify(analysis.measurements) : '',
          width: String(size?.width ?? photo.width ?? ''),
          height: String(size?.height ?? photo.height ?? ''),
        },
      });
    },
    [router]
  );

  const handleCaptured = useCallback(
    async (photo: CapturedPalmPhoto) => {
      setCaptured(photo);
      setNotice('');
      setPhase('analyzing');
      const result = await detectPalm(photo.uri);

      if (!result.ok) {
        if (result.error === 'unsupported' || result.error === 'load_failed') {
          setNotice(
            result.error === 'load_failed'
              ? 'Не удалось загрузить распознавание руки (нужен интернет при первом запуске). Опишите ладонь сами — это займёт минуту.'
              : 'На этом устройстве автоматическое распознавание недоступно. Опишите ладонь сами — это займёт минуту.'
          );
          setPhase('manual');
        } else {
          setNotice(
            result.error === 'no_hand'
              ? 'Рука на снимке не найдена. Сфотографируйте раскрытую ладонь целиком, вместе с пальцами.'
              : result.error === 'back_of_hand'
                ? 'Похоже, на снимке тыльная сторона руки. Разверните руку ладонью к камере и сфотографируйте ещё раз.'
                : 'Не удалось прочитать снимок. Попробуйте ещё раз.'
          );
          setPhase('failed');
        }
        return;
      }

      const { analysis } = result;
      const blocking = analysis.issues.filter(i => BLOCKING_ISSUES.includes(i));
      if (blocking.length) {
        // Снимок непригоден — распознанному не доверяем, поля остаются пустыми
        setFeatures({});
        setNotice(ISSUE_MESSAGES[blocking[0]]);
        setPhase('failed');
        return;
      }
      setFeatures(analysis.features);
      setPhase('done');
      openResult(photo, analysis.features, analysis, { width: result.width, height: result.height });
    },
    [openResult]
  );

  const retake = useCallback(() => {
    setCaptured(null);
    setFeatures({});
    setNotice('');
    setPhase('camera');
  }, []);

  // ---------- Ручное описание ----------

  const lineTraits = (id: PalmLineId): LineTrait[] => {
    const v = features[id];
    return Array.isArray(v) ? v : [];
  };

  const TRAIT_ORDER: LineTrait[] = ['deep', 'shallow', 'straight', 'curved', 'broken', 'chained', 'forked'];
  const setLineTraits = (id: PalmLineId, traits: LineTrait[]) => {
    // Порядок как в описании: глубина, форма, особенности
    const sorted = [...traits].sort((a, b) => TRAIT_ORDER.indexOf(a) - TRAIT_ORDER.indexOf(b));
    setFeatures(prev => ({ ...prev, [id]: sorted }));
    setNotice('');
  };

  const pickExclusive = (id: PalmLineId, group: LineTrait[], value: LineTrait) => {
    const rest = lineTraits(id).filter(t => !group.includes(t));
    setLineTraits(id, [value, ...rest]);
  };

  const toggleExtra = (id: PalmLineId, value: LineTrait) => {
    const traits = lineTraits(id);
    setLineTraits(id, traits.includes(value) ? traits.filter(t => t !== value) : [...traits, value]);
  };

  const submitManual = () => {
    if (!captured) return;
    const depthMissing = PALM_LINE_STEPS.some(step => {
      if (step.id === 'fate_line' && features.fate_line === 'none') return false;
      return !lineTraits(step.id).some(t => t === 'deep' || t === 'shallow');
    });
    if (!features.hand || depthMissing || !isPalmFeaturesComplete(features)) {
      setNotice('Отметьте форму руки и глубину каждой линии (или «Не вижу» для линии судьбы).');
      return;
    }
    openResult(captured, features, null);
  };

  if (phase === 'camera' || !captured) {
    return <PalmCamera onCaptured={photo => void handleCaptured(photo)} onBack={goBack} />;
  }

  const chip = (selected: boolean, title: string, onPress: () => void, key: string) => (
    <TouchableOpacity key={key} style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']} style={styles.background}>
        <StatusBar barStyle="light-content" backgroundColor="#000011" />

        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={retake} disabled={phase === 'analyzing'}>
            <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ваша ладонь</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Image
            source={{ uri: captured.uri }}
            style={[styles.previewImage, phase === 'manual' && styles.previewImageSmall]}
            resizeMode="contain"
          />

          {phase === 'analyzing' && (
            <View style={styles.statusBox}>
              <ActivityIndicator size="large" color="#9B59B6" />
              <Text style={styles.statusTitle}>Распознаю руку и линии...</Text>
              <Text style={styles.statusText}>
                Первый раз загружается модель распознавания (около 8 МБ), дальше всё работает без интернета.
              </Text>
            </View>
          )}

          {phase === 'failed' && (
            <View style={styles.statusBox}>
              <Ionicons name="alert-circle-outline" size={40} color="#F1C40F" />
              <Text style={styles.statusText}>{notice}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={retake}>
                <Ionicons name="camera" size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>Переснять</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkButton} onPress={() => { setNotice(''); setPhase('manual'); }}>
                <Text style={styles.linkButtonText}>Описать ладонь вручную</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'done' && (
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>Ладонь распознана.</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={retake}>
                <Ionicons name="camera" size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>Новый снимок</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkButton} onPress={() => setPhase('manual')}>
                <Text style={styles.linkButtonText}>Поправить распознанное</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'manual' && (
            <>
              <Text style={styles.manualTitle}>Опишите, что видите на ладони</Text>
              {!!notice && <Text style={styles.notice}>{notice}</Text>}

              <View style={styles.group}>
                <Text style={styles.groupTitle}>Форма руки</Text>
                <View style={styles.chips}>
                  {HAND_SHAPE_OPTIONS.map(o => (
                    <TouchableOpacity
                      key={o.id}
                      style={[styles.chipWide, features.hand === o.id && styles.chipSelected]}
                      onPress={() => setFeatures(prev => ({ ...prev, hand: o.id as HandShapeId }))}
                    >
                      <Text style={[styles.chipText, features.hand === o.id && styles.chipTextSelected]}>{o.title}</Text>
                      <Text style={styles.chipHint}>{o.hint}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {PALM_LINE_STEPS.map(step => {
                const traits = lineTraits(step.id);
                const none = step.id === 'fate_line' && features.fate_line === 'none';
                return (
                  <View key={step.id} style={styles.group}>
                    <Text style={styles.groupTitle}>{step.title}</Text>
                    <Text style={styles.groupHint}>{step.where}</Text>
                    <View style={styles.chips}>
                      {DEPTH_OPTIONS.map(o => chip(!none && traits.includes(o.id), o.title, () => pickExclusive(step.id, ['deep', 'shallow'], o.id), o.id))}
                      {step.optional && chip(none, 'Не вижу', () => setFeatures(prev => ({ ...prev, fate_line: 'none' })), 'none')}
                    </View>
                    {!none && (
                      <View style={styles.chips}>
                        {SHAPE_OPTIONS.map(o => chip(traits.includes(o.id), o.title, () => pickExclusive(step.id, ['straight', 'curved'], o.id), o.id))}
                        {EXTRA_OPTIONS.map(o => chip(traits.includes(o.id), o.title, () => toggleExtra(step.id, o.id), o.id))}
                      </View>
                    )}
                  </View>
                );
              })}

              <TouchableOpacity style={[styles.primaryButton, { alignSelf: 'stretch' }]} onPress={submitManual}>
                <Ionicons name="sparkles" size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>Получить толкование</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkButton} onPress={retake}>
                <Text style={styles.linkButtonText}>Сделать новый снимок</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000011' },
  background: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#E8E8E8' },
  placeholder: { width: 40 },
  content: { alignItems: 'center', padding: 20, paddingBottom: 40 },
  previewImage: {
    width: 300,
    height: 400,
    borderRadius: 18,
    backgroundColor: '#000',
    marginBottom: 20,
  },
  previewImageSmall: { width: 180, height: 240 },
  statusBox: { alignItems: 'center', gap: 12, maxWidth: 340 },
  statusTitle: { fontSize: 17, fontWeight: '600', color: '#E8E8E8', textAlign: 'center' },
  statusText: { fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  manualTitle: { fontSize: 17, fontWeight: '600', color: '#E8E8E8', marginBottom: 6 },
  notice: { fontSize: 13, color: '#F1C40F', textAlign: 'center', marginVertical: 6, maxWidth: 360 },
  group: { width: '100%', maxWidth: 380, marginTop: 16 },
  groupTitle: { fontSize: 16, fontWeight: '600', color: '#E8E8E8' },
  groupHint: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipWide: {
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipSelected: { backgroundColor: 'rgba(155, 89, 182, 0.45)', borderColor: '#BB6BD9' },
  chipText: { fontSize: 13, color: 'rgba(255, 255, 255, 0.85)' },
  chipTextSelected: { color: '#FFF', fontWeight: '600' },
  chipHint: { fontSize: 11, color: 'rgba(255, 255, 255, 0.55)', marginTop: 2 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 25,
    backgroundColor: 'rgba(142, 68, 173, 0.95)',
  },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  linkButton: { paddingVertical: 12 },
  linkButtonText: { fontSize: 14, color: '#BB6BD9', fontWeight: '600' },
});
