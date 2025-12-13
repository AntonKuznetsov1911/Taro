import React, { useState } from 'react';
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

interface PalmLine {
  id: string;
  name: string;
  start_x: number;
  start_y: number;
  end_x: number;
  end_y: number;
  color: string;
  description: string;
}

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
  const lines: PalmLine[] = palmLines ? JSON.parse(palmLines) : [];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Гадание по руке\n\nВопрос: ${question}\n\nТолкование:\n${interpretation}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSave = () => {
    // TODO: Implement saving to history
    Alert.alert('Сохранено', 'Результат гадания сохранен в историю');
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
              <Image source={{ uri: imageUri }} style={styles.palmImage} />
              {/* Optional: Overlay palm lines */}
              {showGuide && (
                <View style={styles.linesOverlay}>
                  {lines.map((line, index) => (
                    <View
                      key={index}
                      style={{
                        position: 'absolute',
                        left: line.start_x,
                        top: line.start_y,
                        width: 2,
                        height: Math.sqrt(
                          Math.pow(line.end_x - line.start_x, 2) +
                            Math.pow(line.end_y - line.start_y, 2)
                        ),
                        backgroundColor: line.color,
                      }}
                    />
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.guidButton}
              onPress={() => setShowGuide(!showGuide)}
            >
              <Text style={styles.guideButtonText}>
                {showGuide ? '🤲 Скрыть линии' : '✨ Показать линии'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Question */}
          <View style={styles.questionSection}>
            <Text style={styles.questionLabel}>Ваш вопрос:</Text>
            <Text style={styles.questionText}>{question}</Text>
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
              <MarkdownRenderer content={interpretation} />
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
            <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
              <LinearGradient
                colors={['rgba(46, 204, 113, 0.8)', 'rgba(39, 174, 96, 0.9)']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="bookmark" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>Сохранить</Text>
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
    width: 300,
    height: 400,
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
