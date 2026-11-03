import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { showAlert } from '../src/utils/alert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { MarkdownRenderer } from './MarkdownRenderer';
import { stripMarkdown } from '../src/utils/stripMarkdown';
import { favoritesStorage } from '../src/utils/storage';
import { readingHighlights } from '../src/utils/offlineApi';
import { ReadingShare, type ShareReading } from './ReadingShare';
import { taro } from './TaroPage';

interface ReadingInterpretationProps {
  reading: ShareReading;
  onBeforeFavorite?: () => Promise<void>;
}

export const ReadingInterpretation: React.FC<ReadingInterpretationProps> = ({
  reading,
  onBeforeFavorite,
}) => {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [sharing, setSharing] = useState(false);
  // Компонент используется только для только что созданного расклада,
  // поэтому на входе он никогда ещё не может быть в избранном
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const sections = parseInterpretationSections(reading.interpretation);
  const { summary, connection } = readingHighlights(reading.cards, reading.spread_type);

  const isExpanded = (sectionKey: string) => !!expandedSections[sectionKey];

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(stripMarkdown(reading.interpretation));
      showAlert('✅ Скопировано', 'Толкование скопировано в буфер обмена');
    } catch (error) {
      showAlert('Ошибка', 'Не удалось скопировать текст');
      console.error('Copy error:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    try {
      if (!isFavorite) await onBeforeFavorite?.();
      const nowFavorite = await favoritesStorage.toggleFavorite(reading.id);
      setIsFavorite(nowFavorite);
    } catch (error) {
      console.error('Toggle favorite error:', error);
      showAlert('Ошибка', 'Не удалось сохранить гадание в избранное');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>✨ Толкование</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Скопировать толкование" onPress={handleCopy} style={styles.actionIcon}>
            <Ionicons name="copy-outline" size={22} color="#9B59B6" />
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Поделиться раскладом" onPress={() => setSharing(true)} style={styles.actionIcon}>
            <Ionicons name="share-outline" size={22} color="#9B59B6" />
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'} onPress={handleToggleFavorite} style={styles.actionIcon} disabled={isTogglingFavorite}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#FF6B9D' : '#9B59B6'}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.highlights}>
        <Text style={styles.highlightTitle}>Короткий вывод</Text>
        <Text style={styles.highlightBody}>{summary}</Text>
        {!!connection && <>
          <Text style={styles.highlightTitle}>Как связаны карты</Text>
          <Text style={styles.highlightBody}>{connection}</Text>
        </>}
        <Pressable accessibilityRole="button" accessibilityLabel="Поделиться карточкой" onPress={() => setSharing(true)} style={styles.shareButton}>
          <Ionicons name="image-outline" size={19} color={taro.gold} />
          <Text style={styles.shareLabel}>Поделиться карточкой</Text>
        </Pressable>
      </View>

      {/* Quick Navigation */}
      {sections.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.navigation}
          contentContainerStyle={styles.navigationContent}
        >
          {sections.map((section, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.navButton,
                isExpanded(section.key) && styles.navButtonActive,
              ]}
              onPress={() => toggleSection(section.key)}
            >
              <Text
                style={[
                  styles.navButtonText,
                  isExpanded(section.key) && styles.navButtonTextActive,
                ]}
              >
                {section.icon} {section.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.content}>
        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <TouchableOpacity
              onPress={() => toggleSection(section.key)}
              style={styles.sectionHeader}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>
                {section.icon} {section.title}
              </Text>
              <Ionicons
                name={isExpanded(section.key) ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#9B59B6"
              />
            </TouchableOpacity>

            {isExpanded(section.key) && (
              <View style={styles.sectionContent}>
                <MarkdownRenderer content={section.content} />
              </View>
            )}
          </View>
        ))}

        {/* Reading Summary Card */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['rgba(155, 89, 182, 0.15)', 'rgba(155, 89, 182, 0.05)']}
            style={styles.summaryGradient}
          >
            <Text style={styles.summaryTitle}>💫 Помните</Text>
            <Text style={styles.summaryText}>
              Карты показывают возможности, но не неизбежность. Вы обладаете силой выбора и
              можете влиять на свою судьбу своими действиями и решениями.
            </Text>
            <Text style={styles.summaryFooter}>
              Перечитывайте это толкование регулярно - с каждым разом будут открываться новые
              слои понимания.
            </Text>
          </LinearGradient>
        </View>
      </View>
      {sharing && <ReadingShare reading={reading} summary={summary} connection={connection} onClose={() => setSharing(false)} />}
    </View>
  );
};

function parseInterpretationSections(interpretation: string): Array<{
  key: string;
  title: string;
  icon: string;
  content: string;
}> {
  const sections: Array<{ key: string; title: string; icon: string; content: string }> = [];

  // Разбиваем по заголовкам второго уровня («## »). Важно не задевать «### »:
  // заголовки третьего уровня остаются внутри содержимого и рендерятся
  // компонентом MarkdownRenderer.
  const parts: string[] = [];
  let current: string[] = [];

  for (const line of (interpretation ?? '').split('\n')) {
    if (/^##(?!#)\s/.test(line)) {
      if (current.length > 0) parts.push(current.join('\n'));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) parts.push(current.join('\n'));

  for (const part of parts) {
    const lines = part.trim().split('\n');
    if (lines.length === 0) continue;

    const firstLine = lines[0];

    // Check if it's a header
    if (/^##(?!#)\s/.test(firstLine)) {
      // Заголовок секции показывается обычным <Text>, поэтому markdown из него убираем
      const title = stripMarkdown(firstLine.replace(/^##\s*/, ''));
      const content = lines.slice(1).join('\n').trim();

      let key = 'section';
      let icon = '📄';

      // Determine section type
      if (title.includes('энергетика') || title.includes('Общая')) {
        key = 'overview';
        icon = '🔮';
      } else if (title.includes('толкование') || title.includes('карт')) {
        key = 'details';
        icon = '📖';
      } else if (title.includes('Взаимодействие') || title.includes('взаимосвязей')) {
        key = 'interactions';
        icon = '🔗';
      } else if (title.includes('рекомендации') || title.includes('план')) {
        key = 'recommendations';
        icon = '💫';
      } else if (title.includes('Космическ')) {
        key = 'cosmos';
        icon = '🌙';
      } else if (title.includes('пророчество') || title.includes('Заключ')) {
        key = 'conclusion';
        icon = '🌙';
      }

      // Ключ должен быть уникальным: одинаковые разделы иначе сворачиваются вместе
      sections.push({ key: `${key}-${sections.length}`, title, icon, content });
    } else {
      // Content before first header
      if (part.trim()) {
        sections.push({
          key: `intro-${sections.length}`,
          title: 'Введение',
          icon: '✨',
          content: part.trim(),
        });
      }
    }
  }

  return sections;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#E8E8E8',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIcon: {
    padding: 8,
    backgroundColor: 'rgba(155, 89, 182, 0.15)',
    borderRadius: 8,
  },
  navigation: {
    marginBottom: 15,
    maxHeight: 50,
  },
  navigationContent: {
    gap: 8,
    paddingHorizontal: 2,
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  navButtonActive: {
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    borderColor: '#9B59B6',
  },
  navButtonText: {
    fontSize: 13,
    color: '#B8B8B8',
    fontWeight: '500',
  },
  navButtonTextActive: {
    color: '#E8E8E8',
  },
  content: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  highlights: { gap: 9, padding: 13, marginBottom: 12, borderWidth: 1, borderColor: taro.border, backgroundColor: taro.panel, borderRadius: 14 },
  highlightTitle: { color: taro.gold, fontSize: 15, fontWeight: '700' },
  highlightBody: { color: taro.text, fontSize: 15, lineHeight: 23 },
  shareButton: { minHeight: 44, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: '#836147', borderRadius: 11, marginTop: 3, padding: 8 },
  shareLabel: { color: taro.gold, fontWeight: '600' },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(155, 89, 182, 0.05)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    flex: 1,
  },
  sectionContent: {
    padding: 16,
    paddingTop: 8,
  },
  summaryCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#D0D0D0',
    lineHeight: 22,
    marginBottom: 12,
  },
  summaryFooter: {
    fontSize: 13,
    color: '#9B59B6',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
