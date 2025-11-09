import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ReadingInterpretationProps {
  interpretation: string;
  question: string;
  category: string;
  spreadType: string;
}

export const ReadingInterpretation: React.FC<ReadingInterpretationProps> = ({
  interpretation,
  question,
  category,
  spreadType,
}) => {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    overview: true,
    details: true,
    interactions: true,
    recommendations: true,
    conclusion: true,
  });

  const sections = parseInterpretationSections(interpretation);

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleShare = async () => {
    try {
      const shareContent = `🔮 Гадание Таро

Вопрос: "${question}"
Расклад: ${spreadType}

${interpretation}

---
Приложение Taro - мистические гадания
`;

      const result = await Share.share({
        message: shareContent,
        title: 'Моё гадание Таро',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось поделиться гаданием');
      console.error('Share error:', error);
    }
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(interpretation);
      Alert.alert('✅ Скопировано', 'Толкование скопировано в буфер обмена');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось скопировать текст');
      console.error('Copy error:', error);
    }
  };

  const handleSave = () => {
    // This will be connected to a favorites/saved readings feature
    Alert.alert('💫 Сохранено', 'Гадание добавлено в избранное');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>✨ Толкование</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleCopy} style={styles.actionIcon}>
            <Ionicons name="copy-outline" size={22} color="#9B59B6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.actionIcon}>
            <Ionicons name="share-outline" size={22} color="#9B59B6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.actionIcon}>
            <Ionicons name="heart-outline" size={22} color="#9B59B6" />
          </TouchableOpacity>
        </View>
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
                expandedSections[section.key] && styles.navButtonActive,
              ]}
              onPress={() => toggleSection(section.key)}
            >
              <Text
                style={[
                  styles.navButtonText,
                  expandedSections[section.key] && styles.navButtonTextActive,
                ]}
              >
                {section.icon} {section.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
      >
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
                name={expandedSections[section.key] ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#9B59B6"
              />
            </TouchableOpacity>

            {expandedSections[section.key] && (
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
      </ScrollView>
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

  // Split by ## headers
  const parts = interpretation.split(/(?=##\s)/);

  for (const part of parts) {
    const lines = part.trim().split('\n');
    if (lines.length === 0) continue;

    const firstLine = lines[0];

    // Check if it's a header
    if (firstLine.startsWith('## ')) {
      const title = firstLine.substring(3).trim();
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
      } else if (title.includes('пророчество') || title.includes('Заключ')) {
        key = 'conclusion';
        icon = '🌙';
      }

      sections.push({ key, title, icon, content });
    } else {
      // Content before first header
      if (part.trim()) {
        sections.push({
          key: 'intro',
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
