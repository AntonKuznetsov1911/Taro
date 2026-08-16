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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CosmicBackground } from '../components/CosmicBackground';
import { useUserProfile } from '../src/contexts/UserProfileContext';
import { getDailyAstrology, getRetrogradePlanets, getZodiacSign, ZodiacSign, ZODIAC_SIGNS } from '../src/utils/astrology';
import { getRandomCards } from '../src/data/tarotCards';

interface HoroscopeData {
  zodiacSign: ZodiacSign;
  date: string;
  moodRating: number;
  horoscopeText: string;
  loveForecast: string;
  careerForecast: string;
  healthForecast: string;
  luckyNumbers: number[];
  luckyColors: string[];
  moonPhase: string;
  moonSign: string;
  dayEnergy: string;
  favorableActivities: string[];
  unfavorableActivities: string[];
  retrograde: string[];
}

const { width: screenWidth } = Dimensions.get('window');

// Тексты гороскопов для каждого знака
const HOROSCOPE_TEXTS: { [key: string]: string[] } = {
  aries: [
    "Сегодня ваша энергия на пике! Смело беритесь за новые проекты. Звезды благоприятствуют активным действиям и решительным шагам.",
    "День полон возможностей для проявления лидерских качеств. Ваша харизма привлекает нужных людей. Действуйте интуитивно.",
    "Импульсивность может привести к неожиданным результатам — как положительным, так и нет. Прежде чем действовать, сделайте паузу.",
  ],
  taurus: [
    "Практичность — ваш главный козырь сегодня. Финансовые вопросы решаются в вашу пользу. Доверяйте своему чутью в денежных делах.",
    "День благоприятен для творчества и наслаждения красотой. Позвольте себе маленькие радости — они зарядят вас энергией.",
    "Стабильность важна, но не бойтесь небольших перемен. Они могут привести к приятным сюрпризам.",
  ],
  gemini: [
    "Общение — ключ к успеху сегодня. Новые знакомства могут перерасти в важные связи. Будьте открыты к диалогу.",
    "Ваш острый ум поможет найти нестандартные решения. Не бойтесь высказывать свои идеи — их оценят по достоинству.",
    "Информация приходит со всех сторон. Фильтруйте важное от второстепенного. Сосредоточьтесь на главном.",
  ],
  cancer: [
    "Интуиция обострена. Прислушивайтесь к внутреннему голосу — он не обманет. Семья и близкие нуждаются в вашем внимании.",
    "Эмоции могут быть интенсивными. Найдите способ выразить их творчески. Дом — ваше убежище сегодня.",
    "Заботьтесь о себе так же, как заботитесь о других. Ваше благополучие — основа для помощи близким.",
  ],
  leo: [
    "Сияйте! Сегодня вы в центре внимания, и это заслуженно. Творческая энергия бьет ключом. Не скрывайте свои таланты.",
    "Щедрость души привлекает к вам людей. Но не забывайте о собственных границах. Благородство не значит самопожертвование.",
    "Лидерство требует мудрости. Слушайте советы, но принимайте решения самостоятельно. Ваша уверенность вдохновляет других.",
  ],
  virgo: [
    "Детали важны, но не теряйте общую картину. Ваша аналитичность поможет разобраться в сложной ситуации.",
    "Здоровье требует внимания. Маленькие изменения в режиме дня принесут большие результаты. Начните с малого.",
    "Перфекционизм может стать препятствием. Иногда 'достаточно хорошо' — это действительно достаточно.",
  ],
  libra: [
    "Гармония в отношениях — ваш приоритет. Найдите баланс между своими желаниями и потребностями партнера.",
    "Эстетика и красота вдохновляют вас сегодня. Окружите себя приятными вещами. Это не прихоть — это необходимость.",
    "Решения даются непросто, но откладывать их нельзя. Доверьтесь своему чувству справедливости.",
  ],
  scorpio: [
    "Трансформация продолжается. То, что казалось проблемой, становится возможностью. Примите перемены.",
    "Глубокие эмоции требуют выхода. Найдите безопасный способ их выразить. Творчество или физическая активность помогут.",
    "Интуиция острая как никогда. Вы видите скрытое от других. Используйте это знание мудро.",
  ],
  sagittarius: [
    "Оптимизм — ваша суперсила сегодня. Даже в сложных ситуациях вы найдете повод для улыбки. Заражайте других позитивом.",
    "Тяга к приключениям сильна. Если не можете путешествовать физически — исследуйте новые идеи и концепции.",
    "Философские размышления приносят важные инсайты. Поделитесь своей мудростью с теми, кто готов слушать.",
  ],
  capricorn: [
    "Дисциплина и упорство приносят плоды. Ваши долгосрочные планы начинают реализовываться. Не сбавляйте темп.",
    "Карьерные вопросы требуют внимания. Покажите свою компетентность. Ваш профессионализм не останется незамеченным.",
    "Ответственность — это не бремя, а привилегия. Те, кто доверяет вам, знают цену вашему слову.",
  ],
  aquarius: [
    "Оригинальные идеи приходят легко. Не бойтесь быть другим — именно это делает вас особенным.",
    "Социальные связи укрепляются. Ваши друзья — ваша сила. Вместе вы можете изменить мир к лучшему.",
    "Свобода мысли важна, но не забывайте о практических аспектах. Мечты нуждаются в фундаменте.",
  ],
  pisces: [
    "Творческая энергия на подъеме. Музыка, искусство, поэзия — все формы самовыражения благоприятны сегодня.",
    "Интуиция и сны несут важные послания. Ведите дневник сновидений — там могут быть ответы на ваши вопросы.",
    "Эмпатия — ваш дар, но защищайте свои границы. Не все проблемы других — ваша ответственность.",
  ],
};

const LOVE_FORECASTS = [
  "Романтика витает в воздухе. Открытое сердце притягивает любовь.",
  "Укрепляйте существующие связи. Маленькие знаки внимания значат много.",
  "Время для честного разговора с партнером. Искренность укрепит отношения.",
  "Самолюбие — основа здоровых отношений. Позаботьтесь о себе.",
  "Неожиданная встреча может изменить вашу личную жизнь.",
];

const CAREER_FORECASTS = [
  "Профессиональный рост на горизонте. Покажите свои лучшие качества.",
  "Новые проекты требуют внимания. Ваша инициатива будет оценена.",
  "Коммуникация с коллегами важна. Командная работа принесет успех.",
  "Финансовые вопросы решаются в вашу пользу. Будьте внимательны к деталям.",
  "Время для обучения и развития. Инвестируйте в свои навыки.",
];

const HEALTH_FORECASTS = [
  "Энергия в балансе. Поддерживайте режим сна и питания.",
  "Физическая активность поднимет настроение. Прогулка на свежем воздухе полезна.",
  "Стресс может накапливаться. Найдите время для релаксации.",
  "Интуитивное питание — ваш друг сегодня. Слушайте тело.",
  "Ментальное здоровье так же важно, как физическое. Медитация поможет.",
];

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

/** Гороскоп без астрологических расчётов — на случай, если они недоступны */
function buildFallbackHoroscope(sign: ZodiacSign | null, userName?: string): HoroscopeData {
  const zodiacSign = sign ?? ZODIAC_SIGNS[0];
  const today = new Date();
  const dayIndex = today.getDate() % 3;
  const forecastIndex = (today.getDate() + today.getMonth()) % 5;
  const texts = HOROSCOPE_TEXTS[zodiacSign.name.toLowerCase()] || HOROSCOPE_TEXTS['aries'];

  let text = texts[dayIndex];
  if (userName) {
    text = `${userName}, ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  }

  return {
    zodiacSign,
    date: today.toISOString(),
    moodRating: 7,
    horoscopeText: text,
    loveForecast: LOVE_FORECASTS[forecastIndex],
    careerForecast: CAREER_FORECASTS[forecastIndex],
    healthForecast: HEALTH_FORECASTS[forecastIndex],
    luckyNumbers: [(today.getDate() % 9) + 1, ((today.getDate() * 3) % 9) + 1],
    luckyColors: ['Фиолетовый', 'Серебристый'],
    moonPhase: '',
    moonSign: '',
    dayEnergy: '',
    favorableActivities: [],
    unfavorableActivities: [],
    retrograde: [],
  };
}

export default function HoroscopeScreen() {
  const router = useRouter();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const [isLoading, setIsLoading] = useState(true);
  const [horoscope, setHoroscope] = useState<HoroscopeData | null>(null);
  const [isPickingSign, setIsPickingSign] = useState(false);
  const [chosenSign, setChosenSign] = useState<ZodiacSign | null>(null);

  useEffect(() => {
    if (profileLoading) return;

    let cancelled = false;
    (async () => {
      const saved = await loadSavedSign();
      if (!cancelled) {
        setChosenSign(saved);
        await generateHoroscope(saved);
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
    await generateHoroscope(sign);
  };

  const generateHoroscope = async (signOverride?: ZodiacSign | null) => {
    setIsLoading(true);

    try {
      // Имитация загрузки
      await new Promise(resolve => setTimeout(resolve, 800));

      // Знак: выбранный вручную → из профиля → текущий солнечный
      let zodiacSign: ZodiacSign;
      if (signOverride) {
        zodiacSign = signOverride;
      } else if (profile?.birthDate) {
        const birthDate = new Date(profile.birthDate);
        zodiacSign = getZodiacSign(birthDate);
      } else {
        zodiacSign = getDailyAstrology().sunSign;
      }

      const astrology = getDailyAstrology();
    const retrograde = getRetrogradePlanets();
    const card = getRandomCards(1)[0];

    // Выбираем тексты на основе даты для консистентности в течение дня
    const today = new Date();
    const dayIndex = today.getDate() % 3;
    const forecastIndex = (today.getDate() + today.getMonth()) % 5;

    const signKey = zodiacSign.name.toLowerCase();
    const horoscopeTexts = HOROSCOPE_TEXTS[signKey] || HOROSCOPE_TEXTS['aries'];

    // Персонализированный текст
    let personalizedText = horoscopeTexts[dayIndex];
    if (profile?.name) {
      personalizedText = `${profile.name}, ${personalizedText.charAt(0).toLowerCase()}${personalizedText.slice(1)}`;
    }

    // Добавляем контекст карты Таро
    personalizedText += `\n\n🎴 Карта дня — ${card.name} — усиливает энергии: ${card.keywords.slice(0, 2).join(' и ')}.`;

    // Рассчитываем рейтинг настроения на основе астрологии
    let moodRating = 7;
    if (astrology.overallEnergy === 'high') moodRating = 9;
    else if (astrology.overallEnergy === 'low') moodRating = 5;
    if (retrograde.length > 0) moodRating -= 1;
    if (astrology.moon.isWaxing) moodRating += 1;
    moodRating = Math.min(10, Math.max(1, moodRating));

    const horoscopeData: HoroscopeData = {
      zodiacSign,
      date: today.toISOString(),
      moodRating,
      horoscopeText: personalizedText,
      loveForecast: LOVE_FORECASTS[forecastIndex],
      careerForecast: CAREER_FORECASTS[forecastIndex],
      healthForecast: HEALTH_FORECASTS[forecastIndex],
      luckyNumbers: astrology.luckyNumbers,
      luckyColors: astrology.luckyColors,
      moonPhase: astrology.moon.phaseNameRu,
      moonSign: astrology.moon.moonSign.nameRu,
      dayEnergy: astrology.energyDescription,
      favorableActivities: astrology.favorableActivities,
      unfavorableActivities: astrology.unfavorableActivities,
      retrograde,
    };

      setHoroscope(horoscopeData);
    } catch (error) {
      // Астрологические расчёты не должны ронять экран: показываем
      // гороскоп без лунных данных, но с текстом для знака
      console.error('Error generating horoscope:', error);
      setHoroscope(buildFallbackHoroscope(signOverride ?? chosenSign, profile?.name));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
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

  if (isPickingSign) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
          style={styles.background}
        >
          <CosmicBackground />
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => setIsPickingSign(false)}>
              <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Гороскоп</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.pickerTitle}>Выберите ваш знак зодиака</Text>
            <View style={styles.signGrid}>
              {ZODIAC_SIGNS.map((sign) => (
                <TouchableOpacity
                  key={sign.name}
                  style={styles.signCard}
                  onPress={() => chooseSign(sign)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(155, 89, 182, 0.18)', 'rgba(142, 68, 173, 0.28)']}
                    style={styles.signCardGradient}
                  >
                    <Text style={styles.signEmoji}>{sign.symbol}</Text>
                    <Text style={styles.signName}>{sign.nameRu}</Text>
                    <Text style={styles.signElement}>{sign.elementRu}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: 30 }} />
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (isLoading || profileLoading) {
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
              Звёзды шепчут о вашем дне
            </Text>
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
            <Text style={styles.errorText}>Не удалось составить гороскоп</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => generateHoroscope(chosenSign)}>
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
              onPress={() => router.push('/onboarding')}
            >
              <Ionicons name="person" size={24} color="#E8E8E8" />
            </TouchableOpacity>
          </View>

          {/* Horoscope Header */}
          <View style={styles.horoscopeHeader}>
            <View style={styles.zodiacSection}>
              <Text style={styles.zodiacEmoji}>{horoscope.zodiacSign.symbol}</Text>
              <Text style={styles.zodiacSign}>{horoscope.zodiacSign.nameRu}</Text>
              <Text style={styles.horoscopeDate}>{formatDate(horoscope.date)}</Text>
              {profile?.name && (
                <Text style={styles.userName}>для {profile.name}</Text>
              )}
              <TouchableOpacity
                style={styles.changeSignButton}
                onPress={() => setIsPickingSign(true)}
              >
                <Ionicons name="swap-horizontal" size={16} color="rgba(255,255,255,0.85)" />
                <Text style={styles.changeSignText}>Сменить знак</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.moodSection}>
              <Text style={styles.moodEmoji}>{getMoodEmoji(horoscope.moodRating)}</Text>
              <Text style={styles.moodText}>Энергия дня</Text>
              <Text style={styles.moodRating}>{horoscope.moodRating}/10</Text>
            </View>
          </View>

          {/* Moon Info */}
          <View style={styles.moonSection}>
            <LinearGradient
              colors={['rgba(155, 89, 182, 0.15)', 'rgba(142, 68, 173, 0.25)']}
              style={styles.moonGradient}
            >
              <Text style={styles.moonTitle}>🌙 Лунный календарь</Text>
              <View style={styles.moonRow}>
                <View style={styles.moonItem}>
                  <Text style={styles.moonLabel}>Фаза</Text>
                  <Text style={styles.moonValue}>{horoscope.moonPhase}</Text>
                </View>
                <View style={styles.moonItem}>
                  <Text style={styles.moonLabel}>Луна в знаке</Text>
                  <Text style={styles.moonValue}>{horoscope.moonSign}</Text>
                </View>
              </View>
              {horoscope.retrograde.length > 0 && (
                <View style={styles.retrogradeSection}>
                  <Text style={styles.retrogradeText}>
                    ⚠️ Ретроград: {horoscope.retrograde.join(', ')}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Lucky Elements */}
          <View style={styles.luckySection}>
            <Text style={styles.luckySectionTitle}>🍀 Счастливые символы</Text>

            <View style={styles.luckyRow}>
              <View style={styles.luckyItem}>
                <LinearGradient
                  colors={['rgba(155, 89, 182, 0.2)', 'rgba(142, 68, 173, 0.3)']}
                  style={styles.luckyItemGradient}
                >
                  <Text style={styles.luckyItemTitle}>Цвета</Text>
                  <Text style={styles.luckyItemValue}>
                    {horoscope.luckyColors.slice(0, 2).join(', ')}
                  </Text>
                </LinearGradient>
              </View>

              <View style={styles.luckyItem}>
                <LinearGradient
                  colors={['rgba(69, 183, 209, 0.2)', 'rgba(52, 152, 219, 0.3)']}
                  style={styles.luckyItemGradient}
                >
                  <Text style={styles.luckyItemTitle}>Числа</Text>
                  <Text style={styles.luckyItemValue}>
                    {horoscope.luckyNumbers.slice(0, 3).join(', ')}
                  </Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Main Horoscope */}
          <View style={styles.horoscopeSection}>
            <Text style={styles.horoscopeSectionTitle}>✨ Ваш гороскоп</Text>
            <View style={styles.horoscopeContainer}>
              <Text style={styles.horoscopeText}>{horoscope.horoscopeText}</Text>
            </View>
          </View>

          {/* Activities */}
          <View style={styles.activitiesSection}>
            <View style={styles.activityBlock}>
              <Text style={styles.activityTitle}>✅ Благоприятно сегодня</Text>
              {horoscope.favorableActivities.slice(0, 3).map((activity, index) => (
                <Text key={index} style={styles.activityItem}>• {activity}</Text>
              ))}
            </View>
            <View style={styles.activityBlock}>
              <Text style={styles.activityTitleNegative}>⛔ Лучше отложить</Text>
              {horoscope.unfavorableActivities.map((activity, index) => (
                <Text key={index} style={styles.activityItem}>• {activity}</Text>
              ))}
            </View>
          </View>

          {/* Quick Forecasts */}
          <View style={styles.forecastsSection}>
            <Text style={styles.forecastsSectionTitle}>🔮 Сферы жизни</Text>

            <View style={styles.forecastItem}>
              <LinearGradient
                colors={['rgba(255, 107, 157, 0.2)', 'rgba(196, 69, 105, 0.3)']}
                style={styles.forecastGradient}
              >
                <Text style={styles.forecastIcon}>💕</Text>
                <View style={styles.forecastContent}>
                  <Text style={styles.forecastTitle}>Любовь</Text>
                  <Text style={styles.forecastText}>{horoscope.loveForecast}</Text>
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
                  <Text style={styles.forecastText}>{horoscope.careerForecast}</Text>
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
                  <Text style={styles.forecastText}>{horoscope.healthForecast}</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => generateHoroscope(chosenSign)}
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
              onPress={() => router.push('/reading')}
            >
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="card" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>Гадание</Text>
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
  placeholder: {
    width: 40,
  },
  pickerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E8E8E8',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  signGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  signCard: {
    width: '48%',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 12,
  },
  signCardGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
  },
  signEmoji: {
    fontSize: 32,
    marginBottom: 6,
    color: '#E8E8E8',
  },
  signName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
  },
  signElement: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  changeSignButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  changeSignText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8E8E8',
  },
  settingsButton: {
    padding: 8,
  },
  horoscopeHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 25,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zodiacSection: {
    alignItems: 'center',
    flex: 1,
  },
  zodiacEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  zodiacSign: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#BB6BD9',
    marginBottom: 4,
  },
  horoscopeDate: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  userName: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 4,
    fontStyle: 'italic',
  },
  moodSection: {
    alignItems: 'center',
    flex: 1,
  },
  moodEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  moodText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  moodRating: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8E8E8',
  },
  moonSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  moonGradient: {
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  moonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    marginBottom: 12,
  },
  moonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  moonItem: {
    alignItems: 'center',
  },
  moonLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  moonValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#BB6BD9',
  },
  retrogradeSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  retrogradeText: {
    fontSize: 13,
    color: '#E74C3C',
    textAlign: 'center',
  },
  luckySection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  luckySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    marginBottom: 12,
  },
  luckyRow: {
    flexDirection: 'row',
    gap: 12,
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
    marginBottom: 15,
  },
  horoscopeSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    marginBottom: 12,
  },
  horoscopeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  horoscopeText: {
    fontSize: 15,
    color: '#E8E8E8',
    lineHeight: 24,
  },
  activitiesSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  activityBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2ECC71',
    marginBottom: 8,
  },
  activityTitleNegative: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E74C3C',
    marginBottom: 8,
  },
  activityItem: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  forecastsSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  forecastsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    marginBottom: 12,
  },
  forecastItem: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
  },
  forecastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
  },
  forecastIcon: {
    fontSize: 24,
    marginRight: 14,
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
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  refreshButton: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  historyButton: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
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
