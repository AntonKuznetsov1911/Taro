import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StarryBackground } from '../components/StarryBackground';
import Constants from 'expo-constants';

const EXPO_PUBLIC_BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface TarotCard {
  id: number;
  name: string;
  name_en: string;
  type: string;
  image: string;
  keywords: string[];
  upright_meaning: string;
  reversed_meaning: string;
  is_reversed: boolean;
}

export default function CardTestScreen() {
  const [card, setCard] = useState<TarotCard | null>(null);
  const [cardBack, setCardBack] = useState<string>('');
  const [revealed, setRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTestCard();
    loadCardBack();
  }, []);

  const loadTestCard = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/reading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'love',
          spread_type: 'one_card',
          question: 'Тестовый вопрос',
        }),
      });

      const data = await response.json();
      console.log('Test card loaded:', data.cards[0]);
      console.log('Image data length:', data.cards[0].image?.length);
      console.log('Image data starts with:', data.cards[0].image?.substring(0, 50));
      setCard(data.cards[0]);
    } catch (error) {
      console.error('Error loading test card:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить карту');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCardBack = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/card-back`);
      const data = await response.json();
      setCardBack(data.image);
      console.log('Card back loaded, length:', data.image?.length);
    } catch (error) {
      console.error('Error loading card back:', error);
    }
  };

  const handleCardPress = () => {
    setRevealed(!revealed);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
          style={styles.background}
        >
          <StarryBackground />
          <Text style={styles.loadingText}>Загрузка карты...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
        style={styles.background}
      >
        <StarryBackground />
        
        <View style={styles.content}>
          <Text style={styles.title}>🔮 Тест Карты Таро</Text>
          
          <TouchableOpacity 
            style={styles.cardContainer} 
            onPress={handleCardPress}
            activeOpacity={0.8}
          >
            {revealed && card ? (
              <View style={styles.cardContent}>
                {card.image && card.image.startsWith('data:image/svg+xml;base64,') ? (
                  <Image
                    source={{ uri: card.image }}
                    style={styles.cardImage}
                    resizeMode="contain"
                  />
                ) : (
                  <LinearGradient
                    colors={['#9B59B6', '#8E44AD']}
                    style={styles.cardImageFallback}
                  >
                    <Text style={styles.cardName}>{card.name}</Text>
                    <Text style={styles.cardKeywords}>
                      {card.keywords.join(', ')}
                    </Text>
                  </LinearGradient>
                )}
                
                <View style={styles.cardOverlay}>
                  <Text style={styles.cardNameOverlay}>{card.name}</Text>
                </View>
              </View>
            ) : (
              <Image
                source={{ uri: cardBack }}
                style={styles.cardImage}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
          
          <Text style={styles.instruction}>
            {revealed ? 'Нажмите чтобы закрыть' : 'Нажмите чтобы открыть'} карту
          </Text>
          
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Статус: {card ? 'Карта загружена' : 'Карта не загружена'}
            </Text>
            <Text style={styles.debugText}>
              Изображение: {card?.image ? 'Есть' : 'Нет'} 
              {card?.image && ` (${card.image.length} символов)`}
            </Text>
            <Text style={styles.debugText}>
              Тип изображения: {card?.image?.substring(0, 30)}...
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
  },
  cardContainer: {
    width: 200,
    height: 300,
    marginBottom: 30,
    borderRadius: 15,
    elevation: 8,
    boxShadow: '0px 4px 15px rgba(155, 89, 182, 0.5)',
  },
  cardContent: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  cardImageFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  cardKeywords: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  cardNameOverlay: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  instruction: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  debugInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  debugText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 5,
    opacity: 0.7,
  },
});