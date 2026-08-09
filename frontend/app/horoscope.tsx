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
import { CosmicBackground } from '../components/CosmicBackground';
import { useUserProfile } from '../src/context/UserProfileContext';

interface HoroscopeResult {
  id: string;
  date: string;
  zodiac_sign: string;
  horoscope_text: string;
  mood_rating: number;
  love_forecast: string;
  career_forecast: string;
  health_forecast: string;
  lucky_numbers: number[];
  lucky_color: string;
}

const { width: screenWidth } = Dimensions.get('window');

// Zodiac sign data
const ZODIAC_SIGNS = [
  { name: 'Овен', start: [3, 21], end: [4, 19], element: 'fire' },
  { name: 'Телец', start: [4, 20], end: [5, 20], element: 'earth' },
  { name: 'Близнецы', start: [5, 21], end: [6, 20], element: 'air' },
  { name: 'Рак', start: [6, 21], end: [7, 22], element: 'water' },
  { name: 'Лев', start: [7, 23], end: [8, 22], element: 'fire' },
  { name: 'Дева', start: [8, 23], end: [9, 22], element: 'earth' },
  { name: 'Весы', start: [9, 23], end: [10, 22], element: 'air' },
  { name: 'Скорпион', start: [10, 23], end: [11, 21], element: 'water' },
  { name: 'Стрелец', start: [11, 22], end: [12, 21], element: 'fire' },
  { name: 'Козерог', start: [12, 22], end: [1, 19], element: 'earth' },
  { name: 'Водолей', start: [1, 20], end: [2, 18], element: 'air' },
  { name: 'Рыбы', start: [2, 19], end: [3, 20], element: 'water' },
];

// Horoscope templates for each zodiac sign
const HOROSCOPE_TEMPLATES: { [key: string]: string[] } = {
  'Овен': [
    'Сегодня звезды благоприятствуют вашей энергии и решительности. Ваша природная смелость поможет преодолеть любые препятствия. Доверяйте интуиции в принятии решений.',
    'День обещает быть динамичным и продуктивным. Ваша лидерская натура проявится в полной мере. Не бойтесь брать инициативу в свои руки.',
    'Космические энергии усиливают вашу харизму. Это отличное время для новых начинаний и смелых шагов. Окружающие будут восхищаться вашей уверенностью.',
  ],
  'Телец': [
    'Сегодня важно сохранять спокойствие и рассудительность. Ваша практичность будет вознаграждена. Материальные вопросы решатся благоприятно.',
    'Звезды советуют уделить внимание финансовым делам. Ваша надежность привлекает нужных людей. Романтические отношения выходят на новый уровень.',
    'День благоприятен для творческих занятий и отдыха. Позвольте себе насладиться красотой жизни. Гармония в душе отразится на всех сферах.',
  ],
  'Близнецы': [
    'Ваше общение сегодня будет особенно эффективным. Новые контакты могут принести интересные возможности. Интеллектуальная деятельность принесет удовлетворение.',
    'Звезды усиливают вашу любознательность. Это отличный день для обучения и обмена идеями. Будьте открыты новой информации.',
    'Коммуникативные способности на высоте. Переговоры и встречи пройдут успешно. Ваша гибкость ума поможет найти нестандартные решения.',
  ],
  'Рак': [
    'Сегодня важно прислушаться к своим эмоциям. Семейные дела требуют внимания. Ваша заботливость будет особенно оценена близкими.',
    'Интуиция сегодня работает безошибочно. Доверяйте своим чувствам в принятии решений. Домашний уют принесет гармонию и спокойствие.',
    'Звезды усиливают вашу эмпатию. Помощь другим принесет удовлетворение и вам. Романтические отношения наполнены теплотой.',
  ],
  'Лев': [
    'Ваша творческая энергия сегодня на пике. Самовыражение принесет радость и признание. Не стесняйтесь быть в центре внимания.',
    'День благоприятен для демонстрации своих талантов. Ваша щедрость и великодушие привлекают восхищение. Любовные дела развиваются позитивно.',
    'Звезды усиливают вашу харизму и обаяние. Лидерские качества помогут вдохновить других. Это время для грандиозных планов.',
  ],
  'Дева': [
    'Сегодня ваша внимательность к деталям особенно полезна. Работа над проектами принесет результаты. Здоровье требует заботы и внимания.',
    'Звезды благоприятствуют аналитической работе. Ваша практичность поможет решить сложные задачи. Порядок во всем принесет душевное спокойствие.',
    'День подходит для планирования и организации. Ваша методичность будет вознаграждена. Не забывайте о заботе о себе.',
  ],
  'Весы': [
    'Гармония в отношениях — ваш приоритет сегодня. Дипломатические способности помогут в переговорах. Красота и искусство вдохновляют.',
    'Звезды усиливают ваше чувство справедливости. Партнерские отношения выходят на новый уровень. Эстетические удовольствия приносят радость.',
    'День благоприятен для социальных контактов. Ваше обаяние и такт помогут завоевать симпатии. Романтика в воздухе.',
  ],
  'Скорпион': [
    'Сегодня ваша интуиция особенно сильна. Глубинные трансформации приносят освобождение. Тайны раскрываются в нужное время.',
    'Звезды усиливают вашу проницательность. Страстная натура найдет выражение. Финансовые вопросы решаются благоприятно.',
    'День подходит для глубокого самоанализа. Ваша сила воли поможет достичь целей. Не бойтесь перемен — они к лучшему.',
  ],
  'Стрелец': [
    'Оптимизм и жажда приключений сегодня на высоте. Расширение горизонтов принесет новые возможности. Философские размышления приносят озарения.',
    'Звезды благоприятствуют путешествиям и обучению. Ваш энтузиазм заразителен. Удача сопутствует смелым начинаниям.',
    'День обещает интересные знакомства и открытия. Ваша честность и прямота ценятся окружающими. Мечты начинают сбываться.',
  ],
  'Козерог': [
    'Сегодня важно сосредоточиться на долгосрочных целях. Ваша дисциплинированность приносит результаты. Карьерные перспективы улучшаются.',
    'Звезды усиливают вашу амбициозность. Терпеливая работа будет вознаграждена. Авторитет среди коллег растет.',
    'День благоприятен для серьезных дел и планирования. Ваша надежность привлекает нужных партнеров. Стабильность укрепляется.',
  ],
  'Водолей': [
    'Оригинальные идеи сегодня особенно востребованы. Ваша независимость помогает видеть мир по-новому. Дружеские связи приносят радость.',
    'Звезды усиливают вашу изобретательность. Гуманитарные инициативы найдут поддержку. Будущее выглядит многообещающе.',
    'День подходит для инноваций и экспериментов. Ваша прогрессивность вдохновляет других. Свобода мысли ведет к открытиям.',
  ],
  'Рыбы': [
    'Сегодня творческое вдохновение наполняет вас. Интуиция работает безошибочно. Духовные практики приносят гармонию.',
    'Звезды усиливают вашу чувствительность. Сострадание и эмпатия помогают понимать других. Художественное самовыражение приносит радость.',
    'День благоприятен для мечтаний и визуализации. Ваша мудрость помогает в сложных ситуациях. Романтика окутывает вас.',
  ],
};

// Love forecasts
const LOVE_FORECASTS: { [key: string]: string[] } = {
  fire: ['Страсть и романтика наполняют ваш день', 'Смелость в чувствах принесет радость', 'Яркие эмоции и признания'],
  earth: ['Стабильность в отношениях укрепляется', 'Практические дела с партнером', 'Надежность ценится больше всего'],
  air: ['Интересные разговоры с любимыми', 'Легкость в общении и флирт', 'Новые знакомства возможны'],
  water: ['Глубокие эмоциональные связи', 'Интуиция подсказывает правильный путь', 'Романтические мечты сбываются'],
};

// Career forecasts
const CAREER_FORECASTS: { [key: string]: string[] } = {
  fire: ['Лидерство и инициатива вознаграждаются', 'Смелые проекты получают поддержку', 'Энергия для достижения целей'],
  earth: ['Стабильный прогресс в делах', 'Финансовые вопросы решаются позитивно', 'Надежность открывает двери'],
  air: ['Успешные переговоры и встречи', 'Новые идеи впечатляют коллег', 'Коммуникация — ключ к успеху'],
  water: ['Интуитивные решения верны', 'Творческие проекты продвигаются', 'Эмоциональный интеллект помогает'],
};

// Health forecasts
const HEALTH_FORECASTS: { [key: string]: string[] } = {
  fire: ['Энергия на высоте, но избегайте перенапряжения', 'Активный отдых принесет пользу', 'Следите за давлением'],
  earth: ['Стабильное самочувствие', 'Правильное питание важно', 'Прогулки на свежем воздухе'],
  air: ['Дыхательные практики полезны', 'Избегайте стрессов', 'Ментальное здоровье требует внимания'],
  water: ['Эмоциональное равновесие важно', 'Водные процедуры полезны', 'Медитация и релаксация'],
};

// Lucky colors
const LUCKY_COLORS: { [key: string]: string[] } = {
  fire: ['Красный', 'Оранжевый', 'Золотой', 'Алый'],
  earth: ['Зеленый', 'Коричневый', 'Бежевый', 'Терракотовый'],
  air: ['Голубой', 'Желтый', 'Серебристый', 'Лавандовый'],
  water: ['Синий', 'Бирюзовый', 'Морской', 'Фиолетовый'],
};

function getZodiacSign(birthDate: string): { name: string; element: string } | null {
  if (!birthDate) return null;

  const date = new Date(birthDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (const sign of ZODIAC_SIGNS) {
    const [startMonth, startDay] = sign.start;
    const [endMonth, endDay] = sign.end;

    if (sign.name === 'Козерог') {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
        return { name: sign.name, element: sign.element };
      }
    } else {
      if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
        return { name: sign.name, element: sign.element };
      }
    }
  }

  return null;
}

function generateHoroscope(zodiacSign: string, element: string): HoroscopeResult {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));

  // Use day of year to select templates (consistent for the day)
  const templates = HOROSCOPE_TEMPLATES[zodiacSign] || HOROSCOPE_TEMPLATES['Овен'];
  const horoscopeIndex = dayOfYear % templates.length;

  const loveForecasts = LOVE_FORECASTS[element] || LOVE_FORECASTS.fire;
  const careerForecasts = CAREER_FORECASTS[element] || CAREER_FORECASTS.fire;
  const healthForecasts = HEALTH_FORECASTS[element] || HEALTH_FORECASTS.fire;
  const colors = LUCKY_COLORS[element] || LUCKY_COLORS.fire;

  // Generate lucky numbers based on day
  const luckyNumbers: number[] = [];
  for (let i = 0; i < 5; i++) {
    luckyNumbers.push(((dayOfYear * (i + 1) * 7) % 49) + 1);
  }

  return {
    id: `horoscope-${dayOfYear}`,
    date: today.toISOString(),
    zodiac_sign: zodiacSign,
    horoscope_text: templates[horoscopeIndex],
    mood_rating: 6 + (dayOfYear % 5), // 6-10
    love_forecast: loveForecasts[dayOfYear % loveForecasts.length],
    career_forecast: careerForecasts[dayOfYear % careerForecasts.length],
    health_forecast: healthForecasts[dayOfYear % healthForecasts.length],
    lucky_numbers: [...new Set(luckyNumbers)].slice(0, 3),
    lucky_color: colors[dayOfYear % colors.length],
  };
}

export default function HoroscopeScreen() {
  const router = useRouter();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const [isLoading, setIsLoading] = useState(true);
  const [horoscope, setHoroscope] = useState<HoroscopeResult | null>(null);
  const [hasProfile, setHasProfile] = useState(true);
  const [zodiacInfo, setZodiacInfo] = useState<{ name: string; element: string } | null>(null);

  useEffect(() => {
    // Wait for profile to finish loading first
    if (!profileLoading) {
      loadHoroscope();
    }

    // Fallback timeout - if still loading after 5 seconds, show no profile screen
    const timeout = setTimeout(() => {
      if (isLoading) {
        setHasProfile(false);
        setIsLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [profile, profileLoading]);

  const loadHoroscope = async () => {
    setIsLoading(true);

    // Brief visual delay (reduced from 1000ms)
    await new Promise(resolve => setTimeout(resolve, 300));

    if (!profile?.birthDate) {
      setHasProfile(false);
      setIsLoading(false);
      return;
    }

    const zodiac = getZodiacSign(profile.birthDate);
    if (!zodiac) {
      setHasProfile(false);
      setIsLoading(false);
      return;
    }

    setZodiacInfo(zodiac);
    setHasProfile(true);

    const generatedHoroscope = generateHoroscope(zodiac.name, zodiac.element);
    setHoroscope(generatedHoroscope);
    setIsLoading(false);
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
              Для персонализированного гороскопа необходимо указать вашу дату рождения
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
              onPress={() => router.push('/')}
            >
              <LinearGradient
                colors={['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="home" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>На главную</Text>
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
