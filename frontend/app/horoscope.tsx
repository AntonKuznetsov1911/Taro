import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { CosmicBackground } from '../components/CosmicBackground';

interface HoroscopeResult {
  id: string;
  user_profile_id: string;
  date: string;
  zodiac_sign: string;
  horoscope_text: string;
  mood_rating: number;
  love_forecast: string;
  career_forecast: string;
  health_forecast: string;
  lucky_numbers: number[];
  lucky_color: string;
  created_at: string;
}

const { width: screenWidth } = Dimensions.get('window');

export default function HoroscopeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [horoscope, setHoroscope] = useState<HoroscopeResult | null>(null);
  const [hasProfile, setHasProfile] = useState(true);

  useEffect(() => {
    loadHoroscope();
  }, []);

  const loadHoroscope = async () => {
    try {
      setIsLoading(true);
      const apiUrl = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;
      
      const response = await fetch(`${apiUrl}/api/horoscope`);
      
      if (response.ok) {
        const horoscopeData = await response.json();
        setHoroscope(horoscopeData);
        setHasProfile(true);
      } else if (response.status === 404) {
        setHasProfile(false);
      } else {
        Alert.alert('Ошибка', 'Не удалось загрузить гороскоп');
      }
    } catch (error) {
      console.error('Error loading horoscope:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить гороскоп');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getMoodEmoji = (rating: number) => {
    if (rating >= 9) return '🌟';
    if (rating >= 8) return '😊';
    if (rating >= 7) return '🙂';
    if (rating >= 6) return '😐';
    return '😕';
  };

  const getZodiacEmoji = (sign: string) => {
    const emojiMap: { [key: string]: string } = {
      'Овен': '♈',
      'Телец': '♉',
      'Близнецы': '♊',
      'Рак': '♋',
      'Лев': '♌',
      'Дева': '♍',
      'Весы': '♎',
      'Скорпион': '♏',
      'Стрелец': '♐',
      'Козерог': '♑',
      'Водолей': '♒',
      'Рыбы': '♓',
    };
    return emojiMap[sign] || '✨';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
          style={styles.background}
        >
          <CosmicBackground />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9B59B6" />
            <Text style={styles.loadingTitle}>Составляю ваш гороскоп...</Text>
            <Text style={styles.loadingSubtext}>
              Звезды шепчут о вашем дне
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!hasProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
          style={styles.background}
        >
          <CosmicBackground />
          
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Гороскоп</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.noProfileContainer}>
            <Text style={styles.noProfileIcon}>🔮</Text>
            <Text style={styles.noProfileTitle}>Создайте профиль</Text>
            <Text style={styles.noProfileText}>
              Для персонализированного гороскопа необходимо указать ваши данные рождения
            </Text>
            
            <TouchableOpacity 
              style={styles.createProfileButton}
              onPress={() => router.push('/profile')}
            >
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)']}
                style={styles.createProfileButtonGradient}
              >
                <Ionicons name="person-add" size={20} color="#FFF" />
                <Text style={styles.createProfileButtonText}>Создать профиль</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!horoscope) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
          style={styles.background}
        >
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={80} color="#E74C3C" />
            <Text style={styles.errorText}>Не удалось загрузить гороскоп</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadHoroscope}>
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
            <Text style={styles.headerTitle}>Гороскоп</Text>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => router.push('/profile')}
            >
              <Ionicons name="person" size={24} color="#E8E8E8" />
            </TouchableOpacity>
          </View>

          {/* Horoscope Header */}
          <View style={styles.horoscopeHeader}>
            <View style={styles.zodiacSection}>
              <Text style={styles.zodiacEmoji}>{getZodiacEmoji(horoscope.zodiac_sign)}</Text>
              <Text style={styles.zodiacSign}>{horoscope.zodiac_sign}</Text>
              <Text style={styles.horoscopeDate}>{formatDate(horoscope.date)}</Text>
            </View>

            <View style={styles.moodSection}>
              <Text style={styles.moodEmoji}>{getMoodEmoji(horoscope.mood_rating)}</Text>
              <Text style={styles.moodText}>Настроение дня</Text>
              <Text style={styles.moodRating}>{horoscope.mood_rating}/10</Text>
            </View>
          </View>

          {/* Lucky Elements */}
          <View style={styles.luckySection}>
            <Text style={styles.luckySectionTitle}>🍀 Счастливые символы дня</Text>
            
            <View style={styles.luckyRow}>
              <View style={styles.luckyItem}>
                <LinearGradient
                  colors={['rgba(155, 89, 182, 0.2)', 'rgba(142, 68, 173, 0.3)']}
                  style={styles.luckyItemGradient}
                >
                  <Text style={styles.luckyItemTitle}>Цвет</Text>
                  <Text style={styles.luckyItemValue}>{horoscope.lucky_color}</Text>
                </LinearGradient>
              </View>
              
              <View style={styles.luckyItem}>
                <LinearGradient
                  colors={['rgba(69, 183, 209, 0.2)', 'rgba(52, 152, 219, 0.3)']}
                  style={styles.luckyItemGradient}
                >
                  <Text style={styles.luckyItemTitle}>Числа</Text>
                  <Text style={styles.luckyItemValue}>
                    {horoscope.lucky_numbers.slice(0, 3).join(', ')}
                  </Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Main Horoscope */}
          <View style={styles.horoscopeSection}>
            <Text style={styles.horoscopeSectionTitle}>✨ Ваш гороскоп</Text>
            <View style={styles.horoscopeContainer}>
              <Text style={styles.horoscopeText}>{horoscope.horoscope_text}</Text>
            </View>
          </View>

          {/* Quick Forecasts */}
          <View style={styles.forecastsSection}>
            <Text style={styles.forecastsSectionTitle}>🔮 Краткие прогнозы</Text>
            
            <View style={styles.forecastItem}>
              <LinearGradient
                colors={['rgba(255, 107, 157, 0.2)', 'rgba(196, 69, 105, 0.3)']}
                style={styles.forecastGradient}
              >
                <Text style={styles.forecastIcon}>💕</Text>
                <View style={styles.forecastContent}>
                  <Text style={styles.forecastTitle}>Любовь</Text>
                  <Text style={styles.forecastText}>{horoscope.love_forecast}</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.forecastItem}>
              <LinearGradient
                colors={['rgba(78, 205, 196, 0.2)', 'rgba(38, 160, 180, 0.3)']}
                style={styles.forecastGradient}
              >
                <Text style={styles.forecastIcon}>💼</Text>
                <View style={styles.forecastContent}>
                  <Text style={styles.forecastTitle}>Карьера</Text>
                  <Text style={styles.forecastText}>{horoscope.career_forecast}</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.forecastItem}>
              <LinearGradient
                colors={['rgba(46, 204, 113, 0.2)', 'rgba(39, 174, 96, 0.3)']}
                style={styles.forecastGradient}
              >
                <Text style={styles.forecastIcon}>🌿</Text>
                <View style={styles.forecastContent}>
                  <Text style={styles.forecastTitle}>Здоровье</Text>
                  <Text style={styles.forecastText}>{horoscope.health_forecast}</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={loadHoroscope}
            >
              <LinearGradient
                colors={['rgba(69, 183, 209, 0.9)', 'rgba(52, 152, 219, 1)']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="refresh" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>Обновить</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.historyButton}
              onPress={() => router.push('/history')}
            >
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="time" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>История</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

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
  settingsButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  horoscopeHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zodiacSection: {
    alignItems: 'center',
    flex: 1,
  },
  zodiacEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  zodiacSign: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#BB6BD9',
    marginBottom: 4,
  },
  horoscopeDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  moodSection: {
    alignItems: 'center',
    flex: 1,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  moodRating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
  },
  luckySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  luckySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    marginBottom: 15,
  },
  luckyRow: {
    flexDirection: 'row',
    gap: 15,
  },
  luckyItem: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  luckyItemGradient: {
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
  },
  luckyItemTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  luckyItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
  },
  horoscopeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  horoscopeSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    marginBottom: 15,
  },
  horoscopeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  horoscopeText: {
    fontSize: 14,
    color: '#E8E8E8',
    lineHeight: 20,
    textAlign: 'left',
  },
  forecastsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  forecastsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    marginBottom: 15,
  },
  forecastItem: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 12,
  },
  forecastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
  },
  forecastIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  forecastContent: {
    flex: 1,
  },
  forecastTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 4,
  },
  forecastText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
  },
  refreshButton: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 10,
  },
  historyButton: {
    flex: 1,
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
    fontSize: 14,
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
  },
  noProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noProfileIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  noProfileTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    marginBottom: 15,
  },
  noProfileText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  createProfileButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 10,
  },
  createProfileButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createProfileButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
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