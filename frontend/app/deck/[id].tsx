import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity, ActivityIndicator, Switch, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { playClick } from '../../src/utils/sound';
import { useSettings } from '../../src/contexts/SettingsContext';
import { getCardById, TarotCard } from '../../src/data/tarotCards';
import { generateTarotCardSVG } from '../../src/utils/offlineApi';

// Generate detailed interpretation for a card
function generateCardInterpretation(card: TarotCard, isReversed: boolean): string {
  const baseMeaning = isReversed ? card.reversed_meaning : card.upright_meaning;

  const introductions = [
    `${card.name} несёт глубокое послание для вас.`,
    `Энергия карты «${card.name}» влияет на вашу текущую ситуацию.`,
    `${card.name} открывает важные аспекты вашего пути.`,
  ];

  const advices = [
    `Обратите внимание на тему «${card.keywords[0]}» в вашей жизни.`,
    `Ключевой аспект сейчас — ${card.keywords.slice(0, 2).join(' и ')}.`,
    `Сосредоточьтесь на развитии качества «${card.keywords[0]}».`,
  ];

  const conclusions = [
    'Доверяйте своей интуиции и следуйте внутреннему голосу.',
    'Примите эту мудрость и интегрируйте её в свои действия.',
    'Карта указывает на время для размышлений и принятия решений.',
  ];

  const dayIndex = new Date().getDate();

  return `${introductions[dayIndex % introductions.length]}

${baseMeaning}

${isReversed ? '⚠️ В перевёрнутом положении карта призывает к осторожности и самоанализу. ' : '✨ В прямом положении карта приносит позитивную энергию. '}${advices[dayIndex % advices.length]}

${conclusions[dayIndex % conclusions.length]}`;
}

export default function CardDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [card, setCard] = useState<TarotCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [reversed, setReversed] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [cardImage, setCardImage] = useState<ImageSourcePropType | undefined>(undefined);
  const cardId = Number(id);

  const settings = useSettings();

  useEffect(() => {
    const load = async () => {
      try {
        // Load card from offline data
        const foundCard = getCardById(cardId);
        if (foundCard) {
          setCard(foundCard);
          setCardImage(generateTarotCardSVG(foundCard, false));
          setInterpretation(generateCardInterpretation(foundCard, false));
        }
      } catch (e) {
        console.error('Failed to load card', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cardId]);

  const onToggleReversed = async (val: boolean) => {
    setReversed(val);
    await playClick({ soundEnabled: settings.soundEnabled, vibration: settings.vibration, volume: settings.effectsVolume });
    if (card) {
      setCardImage(generateTarotCardSVG(card, val));
      setInterpretation(generateCardInterpretation(card, val));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#0a0a0a", "#1a1a2e", "#16213e"]} style={styles.background}>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#9B59B6" />
            <Text style={styles.loadingText}>Загрузка карты...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Неизвестный id (например, из старой ссылки) — показываем выход, а не вечный спиннер
  if (!card) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#0a0a0a", "#1a1a2e", "#16213e"]} style={styles.background}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
            </TouchableOpacity>
            <Text style={styles.title}>Карта не найдена</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.loadingWrap}>
            <Text style={styles.cardEmoji}>🃏</Text>
            <Text style={styles.loadingText}>
              Такой карты нет в колоде. Вернитесь в каталог и выберите другую.
            </Text>
            <TouchableOpacity style={styles.notFoundButton} onPress={() => router.replace('/deck')}>
              <LinearGradient colors={["#9B59B6", "#8E44AD"]} style={styles.notFoundButtonGradient}>
                <Ionicons name="albums" size={18} color="#FFF" />
                <Text style={styles.notFoundButtonText}>В каталог колоды</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#0a0a0a", "#1a1a2e", "#16213e"]} style={styles.background}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
            </TouchableOpacity>
            <Text style={styles.title}>{card.name}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.imageWrap}>
            {cardImage ? (
              <Image
                source={cardImage}
                style={[styles.image, reversed && styles.imageReversed]}
                resizeMode="contain"
              />
            ) : (
              <LinearGradient colors={["#2C3E50", "#34495E"]} style={styles.imageFallback}>
                <Text style={styles.cardEmoji}>🎴</Text>
                <Text style={styles.cardName}>{card.name}</Text>
              </LinearGradient>
            )}
          </View>

          <View style={styles.row}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{card.type === 'major' ? 'Старший аркан' : (card.suit || card.type)}</Text>
            </View>
            <View style={styles.spacer} />
            <View style={styles.switchRow}>
              <Text style={styles.label}>Перевернутая</Text>
              <Switch value={reversed} onValueChange={onToggleReversed} trackColor={{ false: '#666', true: '#9B59B6' }} thumbColor={reversed ? '#BB6BD9' : '#EEE'} />
            </View>
          </View>

          {!!card.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Образ карты</Text>
              <Text style={styles.description}>{card.description}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ключевые слова</Text>
            <View style={styles.keywords}>
              {card.keywords.map((k, i) => (
                <View style={styles.keyword} key={i}>
                  <Text style={styles.keywordText}>{k}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Значение</Text>
            <Text style={styles.meaning}>{reversed ? card.reversed_meaning : card.upright_meaning}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Толкование</Text>
            <Text style={styles.meaning}>{interpretation}</Text>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  backButton: { padding: 8, marginRight: 8 },
  title: { fontSize: 20, color: '#E8E8E8', fontWeight: '700', flex: 1 },
  imageWrap: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', height: 300, backgroundColor: '#111' },
  image: { width: '100%', height: '100%' },
  imageReversed: { transform: [{ rotate: '180deg' }] },
  imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 60, marginBottom: 10 },
  cardName: { color: '#E8E8E8', fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 16 },
  badge: { backgroundColor: '#9B59B622', borderColor: '#9B59B6', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: '#E8E8E8', fontSize: 12 },
  spacer: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { color: '#E8E8E8' },
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: { color: '#E8E8E8', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  keywords: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keyword: { backgroundColor: '#FFFFFF22', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  keywordText: { color: '#E8E8E8', fontSize: 12 },
  meaning: { color: '#E8E8E8', fontSize: 14, lineHeight: 20 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#B8B8B8', marginTop: 8, textAlign: 'center', paddingHorizontal: 30 },
  description: { color: '#D6C9E8', fontSize: 14, lineHeight: 21, fontStyle: 'italic' },
  notFoundButton: { marginTop: 24, borderRadius: 25, overflow: 'hidden' },
  notFoundButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  notFoundButtonText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
