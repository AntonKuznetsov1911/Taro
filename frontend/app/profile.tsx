import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '../components/CosmicBackground';
import { useUserProfile, UserProfile } from '../src/context/UserProfileContext';

// Zodiac sign calculation
const ZODIAC_SIGNS = [
  { name: 'Козерог', start: [12, 22], end: [1, 19] },
  { name: 'Водолей', start: [1, 20], end: [2, 18] },
  { name: 'Рыбы', start: [2, 19], end: [3, 20] },
  { name: 'Овен', start: [3, 21], end: [4, 19] },
  { name: 'Телец', start: [4, 20], end: [5, 20] },
  { name: 'Близнецы', start: [5, 21], end: [6, 20] },
  { name: 'Рак', start: [6, 21], end: [7, 22] },
  { name: 'Лев', start: [7, 23], end: [8, 22] },
  { name: 'Дева', start: [8, 23], end: [9, 22] },
  { name: 'Весы', start: [9, 23], end: [10, 22] },
  { name: 'Скорпион', start: [10, 23], end: [11, 21] },
  { name: 'Стрелец', start: [11, 22], end: [12, 21] },
];

function getZodiacSign(birthDate: string): string {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (const sign of ZODIAC_SIGNS) {
    const [startMonth, startDay] = sign.start;
    const [endMonth, endDay] = sign.end;

    if (sign.name === 'Козерог') {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
        return sign.name;
      }
    } else {
      if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
        return sign.name;
      }
    }
  }

  return 'Неизвестно';
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile: savedProfile, saveProfile: saveProfileToContext, isLoading: contextLoading } = useUserProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [zodiacSign, setZodiacSign] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    birth_time: '',
    birth_place: '',
    gender: '',
  });

  useEffect(() => {
    if (savedProfile) {
      // Convert ISO date to DD.MM.YYYY format for display
      let displayDate = '';
      if (savedProfile.birthDate) {
        const date = new Date(savedProfile.birthDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        displayDate = `${day}.${month}.${year}`;
      }

      setFormData({
        name: savedProfile.name || '',
        birth_date: displayDate,
        birth_time: savedProfile.birthTime || '',
        birth_place: savedProfile.birthPlace || '',
        gender: savedProfile.gender || '',
      });

      if (savedProfile.zodiacSign) {
        setZodiacSign(savedProfile.zodiacSign);
      } else if (savedProfile.birthDate) {
        setZodiacSign(getZodiacSign(savedProfile.birthDate));
      }
    }
  }, [savedProfile]);

  const saveProfile = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите ваше имя');
      return;
    }

    if (!formData.birth_date.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите дату рождения в формате ДД.ММ.ГГГГ');
      return;
    }

    // Validate and convert date format
    const dateRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
    const dateMatch = formData.birth_date.match(dateRegex);

    if (!dateMatch) {
      Alert.alert('Ошибка', 'Неверный формат даты. Используйте ДД.ММ.ГГГГ');
      return;
    }

    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    const year = dateMatch[3];
    const isoDate = `${year}-${month}-${day}`;

    // Calculate zodiac sign
    const calculatedZodiac = getZodiacSign(isoDate);
    setZodiacSign(calculatedZodiac);

    try {
      setIsLoading(true);

      const profileData: UserProfile = {
        name: formData.name.trim(),
        birthDate: isoDate,
        birthTime: formData.birth_time.trim() || undefined,
        birthPlace: formData.birth_place.trim() || undefined,
        zodiacSign: calculatedZodiac,
        gender: formData.gender.trim() || undefined,
      };

      await saveProfileToContext(profileData);

      Alert.alert(
        'Успех',
        `Профиль сохранен!\nВаш знак зодиака: ${calculatedZodiac}`,
        [{ text: 'ОК', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить профиль');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBirthDate = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');

    // Add dots automatically
    let formatted = '';
    for (let i = 0; i < digits.length && i < 8; i++) {
      if (i === 2 || i === 4) {
        formatted += '.';
      }
      formatted += digits[i];
    }

    return formatted;
  };

  const formatTime = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');

    // Add colon automatically
    let formatted = '';
    for (let i = 0; i < digits.length && i < 4; i++) {
      if (i === 2) {
        formatted += ':';
      }
      formatted += digits[i];
    }

    return formatted;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000011" />

      <LinearGradient
        colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
        style={styles.background}
      >
        <CosmicBackground />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Профиль</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Profile Form */}
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>✨ Настройте персональные прогнозы</Text>
                <Text style={styles.formSubtitle}>
                  Введите ваши данные для более точных предсказаний
                </Text>
              </View>

              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Имя *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Введите ваше имя"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  maxLength={50}
                />
              </View>

              {/* Birth Date Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Дата рождения *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.birth_date}
                  onChangeText={(text) => setFormData({ ...formData, birth_date: formatBirthDate(text) })}
                  placeholder="ДД.ММ.ГГГГ"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="numeric"
                  maxLength={10}
                />
                <Text style={styles.inputHint}>Например: 15.03.1990</Text>
              </View>

              {/* Birth Time Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Время рождения</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.birth_time}
                  onChangeText={(text) => setFormData({ ...formData, birth_time: formatTime(text) })}
                  placeholder="ЧЧ:ММ"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="numeric"
                  maxLength={5}
                />
                <Text style={styles.inputHint}>Для более точных предсказаний (опционально)</Text>
              </View>

              {/* Birth Place Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Место рождения</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.birth_place}
                  onChangeText={(text) => setFormData({ ...formData, birth_place: text })}
                  placeholder="Город, страна"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  maxLength={100}
                />
              </View>

              {/* Gender Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Пол</Text>
                <View style={styles.genderContainer}>
                  {['Мужской', 'Женский', 'Не указывать'].map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.genderButton,
                        formData.gender === gender && styles.selectedGenderButton
                      ]}
                      onPress={() => setFormData({ ...formData, gender })}
                    >
                      <Text style={[
                        styles.genderButtonText,
                        formData.gender === gender && styles.selectedGenderButtonText
                      ]}>
                        {gender}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Current Zodiac Sign */}
              {zodiacSign && (
                <View style={styles.zodiacContainer}>
                  <LinearGradient
                    colors={['rgba(155, 89, 182, 0.2)', 'rgba(142, 68, 173, 0.3)']}
                    style={styles.zodiacCard}
                  >
                    <Text style={styles.zodiacTitle}>🔮 Ваш знак зодиака</Text>
                    <Text style={styles.zodiacSign}>{zodiacSign}</Text>
                  </LinearGradient>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                onPress={saveProfile}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ?
                    ['rgba(100, 100, 100, 0.7)', 'rgba(80, 80, 80, 0.9)'] :
                    ['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 1)']}
                  style={styles.saveButtonGradient}
                >
                  {isLoading ? (
                    <Text style={styles.saveButtonText}>Сохраняется...</Text>
                  ) : (
                    <>
                      <Ionicons name="save" size={20} color="#FFF" />
                      <Text style={styles.saveButtonText}>Сохранить профиль</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
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
  placeholder: {
    width: 40,
  },
  formContainer: {
    padding: 20,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8E8E8',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#BB6BD9',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#E8E8E8',
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  inputHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    fontStyle: 'italic',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
    alignItems: 'center',
  },
  selectedGenderButton: {
    backgroundColor: 'rgba(155, 89, 182, 0.3)',
    borderColor: '#9B59B6',
  },
  genderButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  selectedGenderButtonText: {
    color: '#E8E8E8',
    fontWeight: '600',
  },
  zodiacContainer: {
    marginVertical: 20,
  },
  zodiacCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.4)',
  },
  zodiacTitle: {
    fontSize: 16,
    color: '#E8E8E8',
    marginBottom: 8,
  },
  zodiacSign: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#BB6BD9',
  },
  saveButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 20,
    elevation: 10,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});
