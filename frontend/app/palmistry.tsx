import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import { CosmicBackground } from '../components/CosmicBackground';

const { width: screenWidth } = Dimensions.get('window');

interface PalmLine {
  name: string;
  description: string;
  color: string;
  points: number[][];
}

interface PalmistryResult {
  id: string;
  question: string;
  image_base64: string;
  lines: PalmLine[];
  interpretation: string;
  created_at: string;
}

export default function PalmistryScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<PalmistryResult | null>(null);

  useEffect(() => {
    analyzePalm();
  }, []);

  const analyzePalm = async () => {
    if (!imageUri) {
      Alert.alert('Ошибка', 'Изображение не найдено');
      router.back();
      return;
    }

    try {
      setIsLoading(true);

      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.readAsDataURL(blob);
      });

      // Send to backend for analysis
      const apiUrl = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;
      const palmResponse = await fetch(`${apiUrl}/api/palmistry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: base64,
          question: 'Расскажите о моей судьбе по линиям руки',
        }),
      });

      if (!palmResponse.ok) {
        throw new Error('Network error');
      }

      const palmResult = await palmResponse.json();
      setResult(palmResult);
    } catch (error) {
      console.error('Error analyzing palm:', error);
      Alert.alert('Ошибка', 'Не удалось проанализировать изображение. Попробуйте еще раз.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const renderLineLegend = () => {
    if (!result) return null;

    return (
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Анализируемые линии:</Text>
        {result.lines.map((line, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.colorIndicator, { backgroundColor: line.color }]} />
            <View style={styles.legendText}>
              <Text style={styles.lineName}>{line.name}</Text>
              <Text style={styles.lineDescription}>{line.description}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
          style={styles.background}
        >
          <CosmicBackground />
          <StatusBar barStyle="light-content" backgroundColor="#000011" />
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9B59B6" />
            <Text style={styles.loadingTitle}>Анализирую линии судьбы...</Text>
            <Text style={styles.loadingSubtext}>
              Древние духи изучают энергии Вашей ладони
            </Text>
            
            <View style={styles.loadingSteps}>
              <Text style={styles.loadingStep}>✨ Распознавание линий руки</Text>
              <Text style={styles.loadingStep}>🔮 Анализ космических знаков</Text>
              <Text style={styles.loadingStep}>⭐ Составление предсказания</Text>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!result) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
          style={styles.background}
        >
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={80} color="#E74C3C" />
            <Text style={styles.errorText}>Не удалось проанализировать изображение</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
              <Text style={styles.retryButtonText}>Попробовать снова</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000011" />
      
      <LinearGradient
        colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
        style={styles.background}
      >
        <CosmicBackground />
        
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Хиромантия</Text>
            <TouchableOpacity 
              style={styles.homeButton}
              onPress={() => router.push('/')}
            >
              <Ionicons name="home" size={24} color="#E8E8E8" />
            </TouchableOpacity>
          </View>

          {/* Palm Image */}
          <View style={styles.palmSection}>
            <View style={styles.palmImageContainer}>
              <Image source={{ uri: imageUri }} style={styles.palmImage} />
            </View>
          </View>

          {/* Lines Legend */}
          {renderLineLegend()}

          {/* Interpretation */}
          <View style={styles.interpretationSection}>
            <View style={styles.interpretationHeader}>
              <Text style={styles.interpretationTitle}>🔮 Предсказание по линиям ладони</Text>
              <Text style={styles.interpretationSubtitle}>Мудрость древних духов</Text>
            </View>
            
            <View style={styles.interpretationContainer}>
              <Text style={styles.interpretationText}>{result.interpretation}</Text>
            </View>
          </View>

          {/* Save to History */}
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.historyButton}
              onPress={() => router.push('/history')}
            >
              <LinearGradient
                colors={['rgba(69, 183, 209, 0.9)', 'rgba(52, 152, 219, 1)']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="time" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>Посмотреть историю</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
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
  scrollView: {
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
  homeButton: {
    padding: 8,
  },
  palmSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  palmImageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  palmImage: {
    width: 280,
    height: 350,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(155, 89, 182, 0.5)',
  },
  legendContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 15,
    textAlign: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  legendText: {
    flex: 1,
  },
  lineName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 2,
  },
  lineDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
  },
  interpretationSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  interpretationHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  interpretationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    marginBottom: 5,
  },
  interpretationSubtitle: {
    fontSize: 14,
    color: '#BB6BD9',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  interpretationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  interpretationText: {
    fontSize: 14,
    color: '#E8E8E8',
    lineHeight: 20,
    textAlign: 'left',
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  historyButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 10,
  },
  actionButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#BB6BD9',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 30,
  },
  loadingSteps: {
    alignItems: 'center',
  },
  loadingStep: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginVertical: 5,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#E8E8E8',
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(155, 89, 182, 0.9)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});