import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  calculateLifePathNumber,
  calculateDestinyNumber,
  calculateSoulNumber,
  calculatePersonalYear,
  getNumberMeaning
} from '../src/data/numerologyKnowledge';

export default function NumerologyScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleAnalyze = () => {
    if (!name.trim()) {
      alert('Пожалуйста, введите ваше имя');
      return;
    }

    const dateString = birthDate.toISOString().split('T')[0];
    const lifePathNumber = calculateLifePathNumber(dateString);
    const destinyNumber = calculateDestinyNumber(name);
    const soulNumber = calculateSoulNumber(name);
    const personalYear = calculatePersonalYear(dateString);

    router.push({
      pathname: '/numerology-result',
      params: {
        name,
        birthDate: dateString,
        lifePathNumber,
        destinyNumber,
        soulNumber,
        personalYear
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
                placeholder="Например: Иван Петров"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Дата рождения</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateText}>{birthDate.toLocaleDateString('ru-RU')}</Text>
                <Ionicons name="calendar-outline" size={20} color="#2ECC71" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={birthDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setBirthDate(selectedDate);
                  }}
                />
              )}
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#2ECC71" />
              <Text style={styles.infoText}>Мы вычислим 4 главных числа: Жизненного Пути, Судьбы, Души и Личного Года</Text>
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
  dateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: 'rgba(46,204,113,0.3)' },
  dateText: { fontSize: 16, color: '#E8E8E8' },
  infoBox: { flexDirection: 'row', backgroundColor: 'rgba(46,204,113,0.15)', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: 'rgba(46,204,113,0.3)', gap: 10 },
  infoText: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  analyzeButton: { borderRadius: 25, overflow: 'hidden', marginTop: 20 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  buttonText: { fontSize: 18, fontWeight: '600', color: '#FFF' }
});
