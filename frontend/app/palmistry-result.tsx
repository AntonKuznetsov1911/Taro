import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { readingsStorage } from '../src/utils/storage';
import { stripMarkdown } from '../src/utils/stripMarkdown';

// Совпадает с PalmLine из src/utils/offlineApi.ts
interface PalmLine {
  name: string;
  description: string;
  color: string;
  points: number[][];
}

// Размеры превью ладони (см. styles.palmImage)
const PALM_IMAGE_WIDTH = 300;
const PALM_IMAGE_HEIGHT = 400;
const OVERLAY_PADDING = 24;
const LINE_THICKNESS = 3;

interface Segment {
  key: string;
  left: number;
  top: number;
  width: number;
  angle: number;
  color: string;
}

const isValidPoint = (point: unknown): point is number[] =>
  Array.isArray(point) &&
  point.length >= 2 &&
  Number.isFinite(point[0]) &&
  Number.isFinite(point[1]);

/**
 * Переводит координаты линий из системы координат генератора
 * в пиксели превью и возвращает готовые сегменты для отрисовки.
 */
const buildSegments = (lines: PalmLine[]): Segment[] => {
  const usableLines = lines
    .map((line) => ({
      line,
      points: Array.isArray(line?.points) ? line.points.filter(isValidPoint) : [],
    }))
    .filter((item) => item.points.length >= 2);

  if (usableLines.length === 0) return [];

  const allPoints = usableLines.flatMap((item) => item.points);
  const xs = allPoints.map((p) => p[0]);
  const ys = allPoints.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const availableWidth = PALM_IMAGE_WIDTH - OVERLAY_PADDING * 2;
  const availableHeight = PALM_IMAGE_HEIGHT - OVERLAY_PADDING * 2;

  const scale = Math.min(
    spanX > 0 ? availableWidth / spanX : availableWidth,
    spanY > 0 ? availableHeight / spanY : availableHeight
  );

  const offsetX = OVERLAY_PADDING + (availableWidth - spanX * scale) / 2;
  const offsetY = OVERLAY_PADDING + (availableHeight - spanY * scale) / 2;

  const project = (point: number[]) => ({
    x: offsetX + (point[0] - minX) * scale,
    y: offsetY + (point[1] - minY) * scale,
  });

  const segments: Segment[] = [];

  usableLines.forEach((item, lineIndex) => {
    for (let i = 0; i < item.points.length - 1; i++) {
      const from = project(item.points[i]);
      const to = project(item.points[i + 1]);
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length < 1) continue;

      segments.push({
        key: `${lineIndex}-${i}`,
        left: (from.x + to.x) / 2 - length / 2,
        top: (from.y + to.y) / 2 - LINE_THICKNESS / 2,
        width: length,
        angle: (Math.atan2(dy, dx) * 180) / Math.PI,
        color: item.line.color || '#9B59B6',
      });
    }
  });

  return segments;
};

const parsePalmLines = (raw?: string): PalmLine[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PalmLine[]) : [];
  } catch (error) {
    console.error('Error parsing palm lines:', error);
    return [];
  }
};

export default function PalmistryResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { imageUri, question, interpretation, palmLines } = params as {
    imageUri: string;
    question: string;
    interpretation: string;
    palmLines: string;
  };

  const [showGuide, setShowGuide] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const lines: PalmLine[] = useMemo(() => parsePalmLines(palmLines), [palmLines]);
  const segments: Segment[] = useMemo(() => buildSegments(lines), [lines]);
  const hasInterpretation =
    typeof interpretation === 'string' && interpretation.trim().length > 0;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Гадание по руке\n\nВопрос: ${question}\n\nТолкование:\n${stripMarkdown(interpretation)}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      const reading = {
        id: `palmistry-${Date.now()}`,
        question: question || 'Гадание по руке',
        category: 'general',
        spread_type: 'palmistry',
        cards: [],
        positions: [],
        lines,
        image_uri: imageUri || '',
        interpretation: hasInterpretation ? interpretation : '',
        created_at: new Date().toISOString(),
      };

      await readingsStorage.addReading(reading);

      Alert.alert('Сохранено', 'Результат гадания сохранен в историю');
    } catch (error) {
      console.error('Error saving palmistry reading:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить результат. Попробуйте еще раз.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
        style={styles.background}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000011" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          >
            <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Результат гадания</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#E8E8E8" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Palm Image */}
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.palmImage} />
              ) : (
                <View style={[styles.palmImage, styles.palmImagePlaceholder]}>
                  <Ionicons name="hand-left-outline" size={64} color="#9B59B6" />
                  <Text style={styles.palmImagePlaceholderText}>Снимок недоступен</Text>
                </View>
              )}
              {/* Optional: Overlay palm lines */}
              {showGuide && segments.length > 0 && (
                <View style={styles.linesOverlay} pointerEvents="none">
                  {segments.map((segment) => (
                    <View
                      key={segment.key}
                      style={{
                        position: 'absolute',
                        left: segment.left,
                        top: segment.top,
                        width: segment.width,
                        height: LINE_THICKNESS,
                        borderRadius: LINE_THICKNESS / 2,
                        backgroundColor: segment.color,
                        transform: [{ rotate: `${segment.angle}deg` }],
                      }}
                    />
                  ))}
                </View>
              )}
            </View>

            {segments.length > 0 ? (
              <TouchableOpacity
                style={styles.guidButton}
                onPress={() => setShowGuide(!showGuide)}
              >
                <Text style={styles.guideButtonText}>
                  {showGuide ? '🤲 Скрыть линии' : '✨ Показать линии'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noLinesText}>Линии ладони не распознаны</Text>
            )}
          </View>

          {/* Question */}
          <View style={styles.questionSection}>
            <Text style={styles.questionLabel}>Ваш вопрос:</Text>
            <Text style={styles.questionText}>{question || 'Вопрос не указан'}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Interpretation */}
          <View style={styles.interpretationSection}>
            <View style={styles.interpretationHeader}>
              <Ionicons name="sparkles" size={24} color="#9B59B6" />
              <Text style={styles.interpretationTitle}>Толкование</Text>
            </View>

            <View style={styles.interpretationContent}>
              {hasInterpretation ? (
                <MarkdownRenderer content={interpretation} />
              ) : (
                <View style={styles.emptyInterpretation}>
                  <Ionicons name="moon-outline" size={32} color="#9B59B6" />
                  <Text style={styles.emptyInterpretationTitle}>
                    Толкование недоступно
                  </Text>
                  <Text style={styles.emptyInterpretationText}>
                    Похоже, результат гадания был открыт напрямую. Сделайте новый снимок
                    ладони, чтобы получить толкование.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyInterpretationButton}
                    onPress={() => router.push('/camera')}
                  >
                    <Text style={styles.emptyInterpretationButtonText}>
                      Новое гадание
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#9B59B6" />
            <Text style={styles.infoText}>
              Помните, что хиромантия - это искусство толкования, а не точная наука.
              Линии на ладони могут меняться со временем в зависимости от ваших решений и действий.
            </Text>
          </View>

          {/* Palm Lines Details */}
          {lines.length > 0 && (
            <View style={styles.linesSection}>
              <Text style={styles.linesSectionTitle}>Обнаруженные линии:</Text>
              {lines.map((line, index) => (
                <View key={index} style={styles.lineItem}>
                  <View
                    style={[
                      styles.lineColorIndicator,
                      { backgroundColor: line.color },
                    ]}
                  />
                  <View style={styles.lineInfo}>
                    <Text style={styles.lineName}>{line.name}</Text>
                    <Text style={styles.lineDescription}>{line.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSave}
              disabled={isSaving}
            >
              <LinearGradient
                colors={
                  isSaving
                    ? ['rgba(100, 100, 100, 0.5)', 'rgba(80, 80, 80, 0.7)']
                    : ['rgba(46, 204, 113, 0.8)', 'rgba(39, 174, 96, 0.9)']
                }
                style={styles.actionButtonGradient}
              >
                <Ionicons name="bookmark" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/camera')}
            >
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="camera" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>Новое гадание</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8E8E8',
  },
  shareButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(155, 89, 182, 0.5)',
  },
  palmImage: {
    width: PALM_IMAGE_WIDTH,
    height: PALM_IMAGE_HEIGHT,
  },
  palmImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(155, 89, 182, 0.12)',
  },
  palmImagePlaceholderText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 12,
  },
  noLinesText: {
    marginTop: 15,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  emptyInterpretation: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  emptyInterpretationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyInterpretationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyInterpretationButton: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.6)',
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
  },
  emptyInterpretationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8E8E8',
  },
  linesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  guidButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.5)',
  },
  guideButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8E8E8',
  },
  questionSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#E8E8E8',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(155, 89, 182, 0.3)',
    marginHorizontal: 20,
    marginVertical: 25,
  },
  interpretationSection: {
    paddingHorizontal: 20,
  },
  interpretationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  interpretationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8E8E8',
    marginLeft: 10,
  },
  interpretationContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(155, 89, 182, 0.15)',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginTop: 25,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    marginLeft: 10,
  },
  linesSection: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  linesSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 15,
  },
  lineItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.2)',
  },
  lineColorIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  lineInfo: {
    flex: 1,
  },
  lineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 5,
  },
  lineDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 30,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 10,
  },
  actionButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
});
