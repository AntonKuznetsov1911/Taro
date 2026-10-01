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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CosmicBackground } from '../components/CosmicBackground';
import { useUserProfile } from '../src/contexts/UserProfileContext';
import { getZodiacSign, getCurrentSunSign, ZodiacSign, ZODIAC_SIGNS } from '../src/utils/astrology';
import { buildTransitHoroscope, Reasoned, TransitHoroscope } from '../src/utils/transitHoroscope';
import { getDailyCard } from '../src/utils/offlineApi';

// Гороскоп строится по реальным положениям планет (см. transitHoroscope.ts).
// Раньше текст выбирался из трёх заготовок по числу месяца, а прогнозы
// любви, карьеры и здоровья, счастливые числа и цвета были одинаковы для
// всех знаков.

const SAVED_SIGN_KEY = '@taro_horoscope_sign';

async function loadSavedSign(): Promise<ZodiacSign | null> {
  try {
    const saved = await AsyncStorage.getItem(SAVED_SIGN_KEY);
    if (!saved) return null;
    return ZODIAC_SIGNS.find(s => s.name === saved) ?? null;
  } catch {
    return null;
  }
}

async function saveSign(name: string): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVED_SIGN_KEY, name);
  } catch {
    // Знак останется выбранным в текущей сессии даже если запись не удалась
  }
}

function ReasonedItem({ item }: { item: Reasoned }) {
  return (
    <View style={styles.reasoned}>
      <Text style={styles.reasonedText}>{item.text}</Text>
      <Text style={styles.basisText}>🔭 {item.basis}</Text>
    </View>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{icon} {title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function HoroscopeScreen() {
  const router = useRouter();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const [isLoading, setIsLoading] = useState(true);
  const [horoscope, setHoroscope] = useState<TransitHoroscope | null>(null);
  const [isPickingSign, setIsPickingSign] = useState(false);
  const [chosenSign, setChosenSign] = useState<ZodiacSign | null>(null);

  useEffect(() => {
    if (profileLoading) return;

    let cancelled = false;
    (async () => {
      const saved = await loadSavedSign();
      if (!cancelled) {
        setChosenSign(saved);
        generateHoroscope(saved);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profileLoading, profile]);

  const chooseSign = async (sign: ZodiacSign) => {
    setChosenSign(sign);
    setIsPickingSign(false);
    await saveSign(sign.name);
    generateHoroscope(sign);
  };

  const generateHoroscope = (signOverride?: ZodiacSign | null) => {
    setIsLoading(true);
    // Даём экрану показать индикатор: расчёт эфемерид занимает доли секунды
    setTimeout(() => {
      try {
        // Знак: выбранный вручную → из профиля → текущий солнечный
        let sign: ZodiacSign;
        if (signOverride) sign = signOverride;
        else if (profile?.birthDate) sign = getZodiacSign(new Date(profile.birthDate));
        else sign = getCurrentSunSign();
        setHoroscope(buildTransitHoroscope(sign, new Date()));
      } catch (error) {
        console.error('Error generating horoscope:', error);
        setHoroscope(null);
      } finally {
        setIsLoading(false);
      }
    }, 50);
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const background = (children: React.ReactNode) => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000011" />
      <LinearGradient colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']} style={styles.background}>
        <CosmicBackground />
        {children}
      </LinearGradient>
    </SafeAreaView>
  );

  if (isPickingSign) {
    return background(
      <>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => setIsPickingSign(false)}>
            <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Гороскоп</Text>
          <View style={styles.headerButton} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.pickerTitle}>Выберите ваш знак зодиака</Text>
          <View style={styles.signGrid}>
            {ZODIAC_SIGNS.map((sign) => (
              <TouchableOpacity key={sign.name} style={styles.signCard} onPress={() => chooseSign(sign)} activeOpacity={0.8}>
                <Text style={styles.signEmoji}>{sign.symbol}</Text>
                <Text style={styles.signName}>{sign.nameRu}</Text>
                <Text style={styles.signElement}>{sign.elementRu}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 30 }} />
        </ScrollView>
      </>
    );
  }

  if (isLoading || profileLoading) {
    return background(
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#9B59B6" />
        <Text style={styles.loadingTitle}>Рассчитываю положение планет...</Text>
      </View>
    );
  }

  if (!horoscope) {
    return background(
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={64} color="#E74C3C" />
        <Text style={styles.loadingTitle}>Не удалось рассчитать гороскоп</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => generateHoroscope(chosenSign)}>
          <Text style={styles.primaryButtonText}>Попробовать снова</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { card, isReversed } = getDailyCard(horoscope.date);
  const balanceColor = horoscope.balance >= 7 ? '#2ECC71' : horoscope.balance >= 4 ? '#F1C40F' : '#E74C3C';

  return background(
    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Гороскоп</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/onboarding')}>
          <Ionicons name="person" size={24} color="#E8E8E8" />
        </TouchableOpacity>
      </View>

      {/* Знак и баланс дня */}
      <View style={styles.hero}>
        <View style={styles.heroSign}>
          <Text style={styles.zodiacEmoji}>{horoscope.sign.symbol}</Text>
          <Text style={styles.zodiacName}>{horoscope.sign.nameRu}</Text>
          <Text style={styles.heroDate}>{formatDate(horoscope.date)}</Text>
          {!!profile?.name && <Text style={styles.heroName}>для {profile.name}</Text>}
          <TouchableOpacity style={styles.changeSignButton} onPress={() => setIsPickingSign(true)}>
            <Ionicons name="swap-horizontal" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={styles.changeSignText}>Сменить знак</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.heroBalance}>
          <Text style={[styles.balanceValue, { color: balanceColor }]}>{horoscope.balance}/10</Text>
          <Text style={styles.balanceLabel}>Баланс аспектов</Text>
          <Text style={styles.balanceBasis}>{horoscope.balanceBasis}</Text>
        </View>
      </View>

      <Section icon="🌙" title="Главное сегодня">
        <ReasonedItem item={horoscope.day} />
      </Section>

      <Section icon="☀️" title="Тема месяца">
        <ReasonedItem item={horoscope.month} />
      </Section>

      <Section icon="💕" title="Любовь и отношения">
        {horoscope.love.map((item, i) => <ReasonedItem key={i} item={item} />)}
      </Section>

      <Section icon="💼" title="Работа и деньги">
        {horoscope.work.map((item, i) => <ReasonedItem key={i} item={item} />)}
      </Section>

      <Section icon="⚡" title="Энергия и здоровье">
        {horoscope.energy.map((item, i) => <ReasonedItem key={i} item={item} />)}
      </Section>

      <Section icon="🔭" title="Небо сегодня">
        <Text style={styles.skyLine}>{horoscope.sky.moon}</Text>
        <Text style={styles.skyLine}>{horoscope.sky.lunarDay}</Text>
        <Text style={styles.skyNote}>{horoscope.sky.lunarDayEssence}</Text>
        <Text style={styles.skyLine}>{horoscope.sky.planets.join(' · ')}</Text>
        {horoscope.sky.retrogrades.map((line, i) => (
          <Text key={i} style={styles.retrogradeText}>⚠️ {line}</Text>
        ))}
        {horoscope.sky.upcoming.length > 0 && (
          <>
            <Text style={styles.subTitle}>Скоро на небе</Text>
            {horoscope.sky.upcoming.map((line, i) => (
              <Text key={i} style={styles.skyLine}>• {line}</Text>
            ))}
          </>
        )}
      </Section>

      <Section icon="📅" title="По лунному календарю">
        <Text style={styles.subTitle}>✅ Благоприятно</Text>
        {horoscope.favorable.map((a, i) => <Text key={i} style={styles.skyLine}>• {a}</Text>)}
        <Text style={styles.subTitle}>⛔ Лучше отложить</Text>
        {horoscope.unfavorable.map((a, i) => <Text key={i} style={styles.skyLine}>• {a}</Text>)}
      </Section>

      <Section icon="🎴" title="Карта дня">
        <Text style={styles.reasonedText}>
          {card.name}{isReversed ? ' (перевёрнутая)' : ''}: {(isReversed ? card.reversed_meaning : card.upright_meaning).split(',').slice(0, 2).join(',').toLowerCase()}.
        </Text>
        <Text style={styles.basisText}>Одна карта на день для всех — та же, что на главном экране</Text>
      </Section>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#9B59B6" />
        <Text style={styles.infoText}>
          Как составлен гороскоп: положения Солнца, Луны и планет рассчитаны астрономически
          точно, по ним — ваши солнечные дома (ваш знак — 1-й дом) и аспекты к вашему знаку.
          Толкования следуют астрологической традиции; научных подтверждений того, что
          планеты влияют на события, нет — используйте гороскоп как повод задуматься,
          а не как предсказание.
        </Text>
      </View>

      <TouchableOpacity style={[styles.primaryButton, { alignSelf: 'center' }]} onPress={() => router.push('/reading')}>
        <Text style={styles.primaryButtonText}>Сделать расклад Таро</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  scrollView: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, gap: 16 },
  loadingTitle: { fontSize: 17, color: '#E8E8E8', textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerButton: { width: 40, padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#E8E8E8' },
  hero: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 12 },
  heroSign: {
    flex: 1.2,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(155, 89, 182, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  zodiacEmoji: { fontSize: 44, color: '#E8E8E8' },
  zodiacName: { fontSize: 22, fontWeight: '700', color: '#E8E8E8', marginTop: 4 },
  heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4, textAlign: 'center' },
  heroName: { fontSize: 13, color: '#BB6BD9', marginTop: 4 },
  changeSignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  changeSignText: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  heroBalance: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  balanceValue: { fontSize: 30, fontWeight: '700' },
  balanceLabel: { fontSize: 13, color: '#E8E8E8', marginTop: 2 },
  balanceBasis: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6, textAlign: 'center' },
  section: { marginHorizontal: 16, marginTop: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#E8E8E8', marginBottom: 8 },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.25)',
    gap: 6,
  },
  reasoned: { marginBottom: 8 },
  reasonedText: { fontSize: 15, lineHeight: 22, color: '#E8E8E8' },
  basisText: { fontSize: 12, color: 'rgba(187, 107, 217, 0.95)', marginTop: 4 },
  skyLine: { fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.88)' },
  skyNote: { fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic' },
  retrogradeText: { fontSize: 13, lineHeight: 19, color: '#F5B041', marginTop: 4 },
  subTitle: { fontSize: 14, fontWeight: '600', color: '#BB6BD9', marginTop: 8 },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 18,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(155, 89, 182, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18, color: 'rgba(255,255,255,0.75)' },
  primaryButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: 'rgba(142, 68, 173, 0.95)',
  },
  primaryButtonText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  pickerTitle: { fontSize: 18, color: '#E8E8E8', textAlign: 'center', marginVertical: 16 },
  signGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingHorizontal: 12 },
  signCard: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  signEmoji: { fontSize: 28, color: '#E8E8E8' },
  signName: { fontSize: 14, fontWeight: '600', color: '#E8E8E8', marginTop: 4 },
  signElement: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
});
