import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserProfile } from '../src/contexts/UserProfileContext';
import { ZODIAC_SIGNS } from '../src/utils/astrology';
import { markOnboardingSeen } from '../src/utils/onboarding';
import { WelcomeBackdrop, CrystalOrb, GoldIcon } from '../components/WelcomeArtwork';

// Заголовок приветствия — «золотая» надпись с мягким свечением.
// На вебе пробуем настоящий градиент по буквам (background-clip: text),
// на остальных платформах остаётся сплошное золото с тенью.
const supportsGradientText =
  Platform.OS === 'web' &&
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  (CSS.supports('-webkit-background-clip', 'text') || CSS.supports('background-clip', 'text'));

const goldGradientText: any = supportsGradientText
  ? {
      backgroundImage: 'linear-gradient(178deg, #FFF8E2 0%, #F6DCA0 38%, #E0B45E 68%, #B98431 100%)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent',
    }
  : null;

const titleGlow: any =
  Platform.OS === 'web'
    ? { filter: 'drop-shadow(0 0 14px rgba(255,196,96,0.45)) drop-shadow(0 2px 3px rgba(0,0,0,0.55))' }
    : null;

type Step = 'welcome' | 'name' | 'gender' | 'birthdate' | 'birthtime' | 'complete';

export default function OnboardingScreen() {
  const router = useRouter();
  const { saveProfile } = useUserProfile();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null);
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthHour, setBirthHour] = useState('');
  const [birthMinute, setBirthMinute] = useState('');
  const [knowsBirthTime, setKnowsBirthTime] = useState<boolean | null>(null);

  const handleNext = async () => {
    switch (step) {
      case 'welcome':
        setStep('name');
        break;
      case 'name':
        if (name.trim()) setStep('gender');
        break;
      case 'gender':
        if (gender) setStep('birthdate');
        break;
      case 'birthdate':
        if (birthDay && birthMonth && birthYear) {
          setStep('birthtime');
        }
        break;
      case 'birthtime':
        await handleSaveProfile();
        setStep('complete');
        break;
      case 'complete':
        router.replace('/');
        break;
    }
  };

  const handleSkip = async () => {
    // Без этой отметки главный экран сразу вернёт нас обратно на онбординг
    await markOnboardingSeen();
    router.replace('/');
  };

  const handleSaveProfile = async () => {
    try {
      const birthDate = new Date(
        parseInt(birthYear),
        parseInt(birthMonth) - 1,
        parseInt(birthDay)
      ).toISOString();

      const birthTime = knowsBirthTime && birthHour && birthMinute
        ? `${birthHour.padStart(2, '0')}:${birthMinute.padStart(2, '0')}`
        : undefined;

      await saveProfile({
        name: name.trim(),
        gender: gender!,
        birthDate,
        birthTime,
      });
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
    }
  };

  const getZodiacPreview = () => {
    if (!birthDay || !birthMonth || !birthYear) return null;
    try {
      const date = new Date(parseInt(birthYear), parseInt(birthMonth) - 1, parseInt(birthDay));
      if (isNaN(date.getTime())) return null;

      const month = date.getMonth() + 1;
      const day = date.getDate();

      const signIndex =
        (month === 3 && day >= 21) || (month === 4 && day <= 19) ? 0 :
        (month === 4 && day >= 20) || (month === 5 && day <= 20) ? 1 :
        (month === 5 && day >= 21) || (month === 6 && day <= 20) ? 2 :
        (month === 6 && day >= 21) || (month === 7 && day <= 22) ? 3 :
        (month === 7 && day >= 23) || (month === 8 && day <= 22) ? 4 :
        (month === 8 && day >= 23) || (month === 9 && day <= 22) ? 5 :
        (month === 9 && day >= 23) || (month === 10 && day <= 22) ? 6 :
        (month === 10 && day >= 23) || (month === 11 && day <= 21) ? 7 :
        (month === 11 && day >= 22) || (month === 12 && day <= 21) ? 8 :
        (month === 12 && day >= 22) || (month === 1 && day <= 19) ? 9 :
        (month === 1 && day >= 20) || (month === 2 && day <= 18) ? 10 : 11;

      return ZODIAC_SIGNS[signIndex];
    } catch {
      return null;
    }
  };

  const zodiacPreview = getZodiacPreview();
  const isWelcome = step === 'welcome';

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <View style={styles.welcomeStep}>
            {/* Хрустальный шар с галактикой на резной золотой подставке.
                Всё нарисовано в SVG — офлайн, без картинок и шрифтов. */}
            <View style={styles.orbWrap} pointerEvents="none">
              <CrystalOrb />
            </View>

            <View style={styles.welcomeTitleWrap} pointerEvents="none">
              <Text style={styles.welcomeTitle}>Добро пожаловать в Таро</Text>
            </View>

            <Text style={styles.welcomeSubtitle}>
              Для точных персонализированных прогнозов нам нужно узнать вас немного лучше
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <View style={styles.featureIconWrap}>
                  <GoldIcon name="moon" />
                </View>
                <Text style={styles.featureText}>Персональный лунный календарь</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIconWrap}>
                  <GoldIcon name="star" />
                </View>
                <Text style={styles.featureText}>Прогнозы на основе вашей натальной карты</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIconWrap}>
                  <GoldIcon name="candle" />
                </View>
                <Text style={styles.featureText}>Таро с учётом вашей энергетики</Text>
              </View>
            </View>
          </View>
        );

      case 'name':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Как вас зовут?</Text>
            <Text style={styles.stepSubtitle}>
              Имя важно для энергетической настройки
            </Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Введите ваше имя"
              placeholderTextColor="#666"
              autoFocus
            />
          </View>
        );

      case 'gender':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Ваш пол</Text>
            <Text style={styles.stepSubtitle}>
              Это влияет на интерпретацию некоторых аспектов
            </Text>
            <View style={styles.genderOptions}>
              <TouchableOpacity
                style={[styles.genderOption, gender === 'female' && styles.genderOptionSelected]}
                onPress={() => setGender('female')}
              >
                <Text style={styles.genderIcon}>♀</Text>
                <Text style={[styles.genderText, gender === 'female' && styles.genderTextSelected]}>
                  Женский
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderOption, gender === 'male' && styles.genderOptionSelected]}
                onPress={() => setGender('male')}
              >
                <Text style={styles.genderIcon}>♂</Text>
                <Text style={[styles.genderText, gender === 'male' && styles.genderTextSelected]}>
                  Мужской
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.otherGenderOption, gender === 'other' && styles.genderOptionSelected]}
              onPress={() => setGender('other')}
            >
              <Text style={[styles.genderText, gender === 'other' && styles.genderTextSelected]}>
                Не указывать
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'birthdate':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Дата рождения</Text>
            <Text style={styles.stepSubtitle}>
              Для расчёта вашего знака зодиака и натальной карты
            </Text>
            <View style={styles.dateInputs}>
              <TextInput
                style={[styles.dateInput, styles.dayInput]}
                value={birthDay}
                onChangeText={(t) => setBirthDay(t.replace(/\D/g, '').slice(0, 2))}
                placeholder="ДД"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                maxLength={2}
              />
              <TextInput
                style={[styles.dateInput, styles.monthInput]}
                value={birthMonth}
                onChangeText={(t) => setBirthMonth(t.replace(/\D/g, '').slice(0, 2))}
                placeholder="ММ"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                maxLength={2}
              />
              <TextInput
                style={[styles.dateInput, styles.yearInput]}
                value={birthYear}
                onChangeText={(t) => setBirthYear(t.replace(/\D/g, '').slice(0, 4))}
                placeholder="ГГГГ"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            {zodiacPreview && (
              <View style={styles.zodiacPreview}>
                <Text style={styles.zodiacSymbol}>{zodiacPreview.symbol}</Text>
                <Text style={styles.zodiacName}>{zodiacPreview.nameRu}</Text>
                <Text style={styles.zodiacElement}>{zodiacPreview.elementRu}</Text>
              </View>
            )}
          </View>
        );

      case 'birthtime':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Время рождения</Text>
            <Text style={styles.stepSubtitle}>
              Для расчёта асцендента и точных домов (опционально)
            </Text>

            <View style={styles.knowTimeOptions}>
              <TouchableOpacity
                style={[styles.knowTimeOption, knowsBirthTime === true && styles.knowTimeOptionSelected]}
                onPress={() => setKnowsBirthTime(true)}
              >
                <Text style={[styles.knowTimeText, knowsBirthTime === true && styles.knowTimeTextSelected]}>
                  Знаю время
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.knowTimeOption, knowsBirthTime === false && styles.knowTimeOptionSelected]}
                onPress={() => setKnowsBirthTime(false)}
              >
                <Text style={[styles.knowTimeText, knowsBirthTime === false && styles.knowTimeTextSelected]}>
                  Не знаю
                </Text>
              </TouchableOpacity>
            </View>

            {knowsBirthTime && (
              <View style={styles.timeInputs}>
                <TextInput
                  style={[styles.dateInput, styles.timeInput]}
                  value={birthHour}
                  onChangeText={(t) => setBirthHour(t.replace(/\D/g, '').slice(0, 2))}
                  placeholder="ЧЧ"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.timeSeparator}>:</Text>
                <TextInput
                  style={[styles.dateInput, styles.timeInput]}
                  value={birthMinute}
                  onChangeText={(t) => setBirthMinute(t.replace(/\D/g, '').slice(0, 2))}
                  placeholder="ММ"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            )}

            {knowsBirthTime === false && (
              <Text style={styles.noTimeNote}>
                Без времени рождения мы не сможем рассчитать асцендент, но остальные прогнозы будут работать
              </Text>
            )}
          </View>
        );

      case 'complete':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.completeEmoji}>✨</Text>
            <Text style={styles.completeTitle}>Профиль создан!</Text>
            {zodiacPreview && (
              <View style={styles.profileSummary}>
                <Text style={styles.summaryName}>{name}</Text>
                <View style={styles.summaryZodiac}>
                  <Text style={styles.summaryZodiacSymbol}>{zodiacPreview.symbol}</Text>
                  <Text style={styles.summaryZodiacName}>{zodiacPreview.nameRu}</Text>
                </View>
                <Text style={styles.summaryElement}>
                  Стихия: {zodiacPreview.elementRu} | Планета: {zodiacPreview.rulingPlanetRu}
                </Text>
              </View>
            )}
            <Text style={styles.completeSubtitle}>
              Теперь все прогнозы будут персонализированы специально для вас
            </Text>
          </View>
        );
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'welcome': return true;
      case 'name': return name.trim().length > 0;
      case 'gender': return gender !== null;
      case 'birthdate':
        const day = parseInt(birthDay);
        const month = parseInt(birthMonth);
        const year = parseInt(birthYear);
        return day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= new Date().getFullYear();
      case 'birthtime': return knowsBirthTime !== null;
      case 'complete': return true;
      default: return false;
    }
  };

  const getButtonText = () => {
    switch (step) {
      case 'welcome': return 'Начать';
      case 'complete': return 'Открыть приложение';
      default: return 'Далее';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={isWelcome ? ['#05030C', '#160B2E', '#0A0518'] : ['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.background}
      >
        {/*
          Приветственный шаг рисуется во весь экран, поэтому его фон живёт здесь,
          а не внутри ScrollView с отступами — иначе картинка не была бы full-bleed
          и не заходила бы под кнопку «Начать».

          WelcomeBackdrop сам решает, что показать:
          • есть файл assets/onboarding-welcome.png — он растягивается на весь экран
            и накрывается тёмной вуалью (см. src/utils/onboardingWelcomeImage.ts);
          • файла нет — рисуется мистическая сцена: ночное небо с туманностью,
            звёзды с бликами, бархатные портьеры и рубашки карт Таро.
          Слой не перехватывает нажатия (pointerEvents="none"), чтобы кнопки
          под ним оставались доступными.
        */}
        {isWelcome && <WelcomeBackdrop />}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Progress indicator */}
            {step !== 'welcome' && step !== 'complete' && (
              <View style={styles.progress}>
                {['name', 'gender', 'birthdate', 'birthtime'].map((s, i) => (
                  <View
                    key={s}
                    style={[
                      styles.progressDot,
                      ['name', 'gender', 'birthdate', 'birthtime'].indexOf(step) >= i && styles.progressDotActive
                    ]}
                  />
                ))}
              </View>
            )}

            {renderStep()}
          </ScrollView>

          <View style={styles.bottomContainer}>
            {step !== 'welcome' && step !== 'complete' && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
              >
                <Text style={styles.skipText}>Пропустить</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.nextButton,
                isWelcome && styles.nextButtonWelcome,
                !canProceed() && styles.nextButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <LinearGradient
                colors={canProceed() ? ['#9B59B6', '#8E44AD'] : ['#444', '#333']}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>{getButtonText()}</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 30 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333' },
  progressDotActive: { backgroundColor: '#9B59B6', width: 24 },

  stepContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },

  // ── Приветственный шаг: мистический постер ──
  welcomeStep: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  orbWrap: {
    width: '100%',
    maxWidth: 268,
    aspectRatio: 300 / 372,
    marginBottom: 6,
  },
  // Ширина подобрана так, чтобы заголовок разбивался на две сбалансированные
  // строки — «Добро пожаловать» / «в Таро» (текст при этом не меняется).
  welcomeTitleWrap: {
    marginBottom: 14,
    maxWidth: 300,
    ...titleGlow,
  },
  welcomeTitle: {
    fontSize: 32,
    lineHeight: 42,
    fontWeight: '600',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: Platform.select({
      web: 'Georgia, "Times New Roman", "Palatino Linotype", serif',
      ios: 'Georgia',
      default: 'serif',
    }),
    color: '#F6DFA0',
    textShadowColor: 'rgba(255,190,80,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    ...goldGradientText,
  },
  welcomeSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: '#EFE0C8',
    textAlign: 'center',
    marginBottom: 26,
    maxWidth: 310,
    paddingHorizontal: 8,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  featureList: { gap: 18, alignSelf: 'center', alignItems: 'flex-start' },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 14, maxWidth: 300 },
  featureIconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ filter: 'drop-shadow(0 0 7px rgba(255,192,90,0.6))' } as any)
      : null),
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: '#F0E2CB',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },

  stepTitle: { fontSize: 24, fontWeight: 'bold', color: '#E8E8E8', textAlign: 'center', marginBottom: 10 },
  stepSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 30, paddingHorizontal: 20 },

  textInput: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#E8E8E8',
    borderWidth: 1,
    borderColor: '#333',
    textAlign: 'center',
  },

  genderOptions: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  genderOption: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  genderOptionSelected: { borderColor: '#9B59B6', backgroundColor: '#9B59B620' },
  genderIcon: { fontSize: 32, marginBottom: 8, color: '#E8E8E8' },
  genderText: { fontSize: 16, color: '#888' },
  genderTextSelected: { color: '#E8E8E8', fontWeight: '600' },
  otherGenderOption: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },

  dateInputs: { flexDirection: 'row', gap: 10 },
  dateInput: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#E8E8E8',
    borderWidth: 1,
    borderColor: '#333',
    textAlign: 'center',
  },
  dayInput: { width: 60 },
  monthInput: { width: 60 },
  yearInput: { width: 90 },

  zodiacPreview: {
    marginTop: 30,
    alignItems: 'center',
    backgroundColor: '#9B59B620',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#9B59B640',
  },
  zodiacSymbol: { fontSize: 48 },
  zodiacName: { fontSize: 20, fontWeight: 'bold', color: '#E8E8E8', marginTop: 8 },
  zodiacElement: { fontSize: 14, color: '#9B59B6', marginTop: 4 },

  knowTimeOptions: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  knowTimeOption: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  knowTimeOptionSelected: { borderColor: '#9B59B6', backgroundColor: '#9B59B620' },
  knowTimeText: { fontSize: 16, color: '#888' },
  knowTimeTextSelected: { color: '#E8E8E8', fontWeight: '600' },

  timeInputs: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeInput: { width: 60 },
  timeSeparator: { fontSize: 24, color: '#E8E8E8' },
  noTimeNote: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 20, paddingHorizontal: 20 },

  completeEmoji: { fontSize: 80, marginBottom: 20 },
  completeTitle: { fontSize: 28, fontWeight: 'bold', color: '#E8E8E8', marginBottom: 20 },
  completeSubtitle: { fontSize: 15, color: '#888', textAlign: 'center', paddingHorizontal: 20 },
  profileSummary: {
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#9B59B640',
  },
  summaryName: { fontSize: 22, fontWeight: 'bold', color: '#E8E8E8', marginBottom: 10 },
  summaryZodiac: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  summaryZodiacSymbol: { fontSize: 32 },
  summaryZodiacName: { fontSize: 20, color: '#9B59B6', fontWeight: '600' },
  summaryElement: { fontSize: 13, color: '#888' },

  bottomContainer: { padding: 20, gap: 10 },
  skipButton: { alignItems: 'center', padding: 10 },
  skipText: { fontSize: 14, color: '#888' },
  nextButton: { borderRadius: 25, overflow: 'hidden' },
  nextButtonWelcome: {
    borderWidth: 1,
    borderColor: 'rgba(231,194,113,0.55)',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 6px 22px rgba(120,50,190,0.45), 0 0 16px rgba(231,194,113,0.18)' } as any)
      : null),
  },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  nextButtonText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
});
