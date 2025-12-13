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
import Constants from 'expo-constants';
import { CosmicBackground } from '../components/CosmicBackground';

interface UserProfile {
  id: string;
  name: string;
  birth_date: string;
  birth_time?: string;
  birth_place?: string;
  zodiac_sign: string;
  gender?: string;
  created_at: string;
  updated_at: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    birth_time: '',
    birth_place: '',
    gender: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const apiUrl = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${apiUrl}/api/profile`);
      
      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
        setFormData({
          name: profileData.name || '',
          birth_date: profileData.birth_date || '',
          birth_time: profileData.birth_time || '',
          birth_place: profileData.birth_place || '',
          gender: profileData.gender || '',
        });
      } else if (response.status !== 404) {
        console.error('Error loading profile:', response.status);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

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

    try {
      setIsLoading(true);
      const apiUrl = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;
      
      const profileData = {
        name: formData.name.trim(),
        birth_date: isoDate,
        birth_time: formData.birth_time.trim() || null,
        birth_place: formData.birth_place.trim() || null,
        gender: formData.gender.trim() || null,
      };

      const response = await fetch(`${apiUrl}/api/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const savedProfile = await response.json();
        setProfile(savedProfile);
        Alert.alert(
          'Успех',
          `Профиль сохранен!\nВаш знак зодиака: ${savedProfile.zodiac_sign}`,
          [{ text: 'ОК', onPress: () => router.back() }]
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Ошибка', 'Не удалось сохранить профиль');
      }
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
              {profile && (
                <View style={styles.zodiacContainer}>
                  <LinearGradient
                    colors={['rgba(155, 89, 182, 0.2)', 'rgba(142, 68, 173, 0.3)']}
                    style={styles.zodiacCard}
                  >
                    <Text style={styles.zodiacTitle}>🔮 Ваш знак зодиака</Text>
                    <Text style={styles.zodiacSign}>{profile.zodiac_sign}</Text>
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