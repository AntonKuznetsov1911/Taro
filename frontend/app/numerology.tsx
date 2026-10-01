import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  calculateLifePathNumber,
  calculateDestinyNumber,
  calculateSoulNumber,
  calculatePersonalityNumber,
  calculatePersonalYear,
  hasNameLetters,
} from '../src/data/numerologyKnowledge';
import { useSettings } from '../src/contexts/SettingsContext';
import { useUserProfile } from '../src/contexts/UserProfileContext';
import { playComplete } from '../src/utils/sound';
import { showAlert } from '../src/utils/alert';

const pad = (n: number) => String(n).padStart(2, '0');

export default function NumerologyScreen() {
  const router = useRouter();
  const settings = useSettings();
  const { profile } = useUserProfile();

  // Если профиль заполнен — подставляем имя и дату рождения из него
  const profileBirth = profile?.isComplete ? new Date(profile.birthDate) : null;
  const [name, setName] = useState(profile?.isComplete ? profile.name : '');
  // Отдельные поля вместо системного календаря: @react-native-community/datetimepicker
  // в веб-версии ничего не рисует, и дата навсегда оставалась сегодняшней
  const [day, setDay] = useState(profileBirth ? pad(profileBirth.getDate()) : '');
  const [month, setMonth] = useState(profileBirth ? pad(profileBirth.getMonth() + 1) : '');
  const [year, setYear] = useState(profileBirth ? String(profileBirth.getFullYear()) : '');

  /** Проверенная дата в формате YYYY-MM-DD или null */
  const getDateString = (): string | null => {
    const d = Number(day), m = Number(month), y = Number(year);
    if (!d || !m || !y || year.length !== 4) return null;
    const date = new Date(y, m - 1, d);
    // 31.02 и подобные даты Date молча переносит на следующий месяц
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    if (y < 1900 || date > new Date()) return null;
    return `${y}-${pad(m)}-${pad(d)}`;
  };

  const handleAnalyze = () => {
    if (!hasNameLetters(name)) {
      showAlert('Внимание', 'Введите имя буквами — по ним считаются числа судьбы и души');
      return;
    }
    const dateString = getDateString();
    if (!dateString) {
      showAlert('Внимание', 'Введите настоящую дату рождения: день, месяц и год (например, 15.03.1990)');
      return;
    }

    // Расчёт завершён — мягкий восходящий перезвон
    void playComplete({
      soundEnabled: settings.soundEnabled,
      vibration: settings.vibration,
      volume: settings.effectsVolume,
    });

    router.push({
      pathname: '/numerology-result',
      params: {
        name: name.trim(),
        birthDate: dateString,
        lifePathNumber: calculateLifePathNumber(dateString),
        destinyNumber: calculateDestinyNumber(name),
        soulNumber: calculateSoulNumber(name),
        personalityNumber: calculatePersonalityNumber(name),
        personalYear: calculatePersonalYear(dateString),
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']} style={styles.background}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#E8E8E8" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Нумерология</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <LinearGradient colors={['rgba(46, 204, 113, 0.3)', 'rgba(39, 174, 96, 0.5)']} style={styles.iconGradient}>
                <Text style={styles.heroIcon}>🔢</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>Раскройте тайну чисел</Text>
            <Text style={styles.subtitle}>Узнайте свои главные числа судьбы</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ваше полное имя</Text>
              <TextInput
                style={styles.input}
                placeholder="Например: Иванова Мария Сергеевна"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Дата рождения</Text>
              <View style={styles.dateRow}>
                <TextInput
                  style={[styles.input, styles.dateField]}
                  placeholder="ДД"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={day}
                  onChangeText={t => setDay(t.replace(/\D/g, ''))}
                />
                <TextInput
                  style={[styles.input, styles.dateField]}
                  placeholder="ММ"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={month}
                  onChangeText={t => setMonth(t.replace(/\D/g, ''))}
                />
                <TextInput
                  style={[styles.input, styles.yearField]}
                  placeholder="ГГГГ"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={year}
                  onChangeText={t => setYear(t.replace(/\D/g, ''))}
                />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#2ECC71" />
              <Text style={styles.infoText}>Мы вычислим главные числа: Жизненного Пути (по дате), Судьбы, Души и Личности (по полному имени — лучше указать фамилию, имя и отчество) и вашего Личного Года</Text>
            </View>

            <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
              <LinearGradient colors={['rgba(46, 204, 113, 0.9)', 'rgba(39, 174, 96, 1)']} style={styles.buttonGradient}>
                <Ionicons name="sparkles" size={24} color="#FFF" />
                <Text style={styles.buttonText}>Рассчитать числа</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#E8E8E8' },
  content: { padding: 20 },
  heroSection: { alignItems: 'center', marginBottom: 40 },
  iconContainer: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', marginBottom: 20 },
  iconGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroIcon: { fontSize: 50 },
  title: { fontSize: 24, fontWeight: '700', color: '#E8E8E8', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' },
  form: { gap: 20 },
  inputGroup: { gap: 10 },
  label: { fontSize: 16, fontWeight: '600', color: '#E8E8E8' },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, padding: 15, color: '#E8E8E8', fontSize: 16, borderWidth: 1, borderColor: 'rgba(46,204,113,0.3)' },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateField: { width: 70, textAlign: 'center' },
  yearField: { flex: 1, textAlign: 'center' },
  dateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: 'rgba(46,204,113,0.3)' },
  dateText: { fontSize: 16, color: '#E8E8E8' },
  infoBox: { flexDirection: 'row', backgroundColor: 'rgba(46,204,113,0.15)', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: 'rgba(46,204,113,0.3)', gap: 10 },
  infoText: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  analyzeButton: { borderRadius: 25, overflow: 'hidden', marginTop: 20 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  buttonText: { fontSize: 18, fontWeight: '600', color: '#FFF' }
});
