import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getNumberMeaning } from '../src/data/numerologyKnowledge';

export default function NumerologyResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { name, lifePathNumber, destinyNumber, soulNumber, personalYear } = params;

  // Параметр может отсутствовать при прямом переходе — приводим безопасно
  const toNumber = (value: unknown): number | null => {
    if (typeof value !== 'string' || value.trim() === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const lifePathValue = toNumber(lifePathNumber);
  const destinyValue = toNumber(destinyNumber);
  const soulValue = toNumber(soulNumber);
  const yearValue = toNumber(personalYear);

  const lifePath = lifePathValue !== null ? getNumberMeaning(lifePathValue) : undefined;
  const destiny = destinyValue !== null ? getNumberMeaning(destinyValue) : undefined;
  const soul = soulValue !== null ? getNumberMeaning(soulValue) : undefined;
  const year = yearValue !== null ? getNumberMeaning(yearValue) : undefined;

  const hasData = Boolean(lifePath || destiny || soul || year);

  const handleShare = async () => {
    try {
      await Share.share({ message: `Моя нумерология:\nЧисло Жизненного Пути: ${lifePathNumber}\nЧисло Судьбы: ${destinyNumber}\nЧисло Души: ${soulNumber}\nЛичный Год: ${personalYear}` });
    } catch (error) {
      console.error(error);
    }
  };

  const NumberCard = ({ number, title, data }: any) => (
    <View style={styles.numberCard}>
      <LinearGradient colors={['rgba(46,204,113,0.15)', 'rgba(39,174,96,0.1)']} style={styles.cardGradient}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberValue}>{number}</Text>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{data?.titleRu}</Text>
        <Text style={styles.cardDescription}>{data?.personality}</Text>
      </LinearGradient>
    </View>
  );

  if (!hasData) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']} style={styles.background}>
          <StatusBar barStyle="light-content" />
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#E8E8E8" /></TouchableOpacity>
            <Text style={styles.headerTitle}>Ваши числа</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.emptyState}>
            <Ionicons name="calculator-outline" size={64} color="#2ECC71" />
            <Text style={styles.emptyTitle}>Расчёт не найден</Text>
            <Text style={styles.emptyText}>
              Нумерологические данные недоступны. Введите имя и дату рождения, чтобы получить ваш портрет.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.replace('/numerology')}>
              <LinearGradient colors={['#2ECC71', '#27AE60']} style={styles.emptyButtonGradient}>
                <Ionicons name="sparkles" size={20} color="#FFF" />
                <Text style={styles.emptyButtonText}>Рассчитать числа</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']} style={styles.background}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#E8E8E8" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Ваши числа</Text>
          <TouchableOpacity onPress={handleShare}><Ionicons name="share-outline" size={24} color="#E8E8E8" /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroSection}>
            {!!name && <Text style={styles.name}>{name}</Text>}
            <Text style={styles.subtitle}>Нумерологический портрет</Text>
          </View>

          {!!lifePath && <NumberCard number={lifePathValue} title="Число Жизненного Пути" data={lifePath} />}
          {!!destiny && <NumberCard number={destinyValue} title="Число Судьбы" data={destiny} />}
          {!!soul && <NumberCard number={soulValue} title="Число Души" data={soul} />}
          {!!year && <NumberCard number={yearValue} title="Личный Год" data={year} />}

          {lifePath && (
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Детальный анализ</Text>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Сильные стороны:</Text>
                {lifePath.strengths.map((s, i) => (
                  <Text key={i} style={styles.listItem}>• {s}</Text>
                ))}
                <Text style={styles.detailLabel}>Вызовы:</Text>
                {lifePath.challenges.map((c, i) => (
                  <Text key={i} style={styles.listItem}>• {c}</Text>
                ))}
                <Text style={styles.detailLabel}>Карьера:</Text>
                {lifePath.career.map((c, i) => (
                  <Text key={i} style={styles.listItem}>• {c}</Text>
                ))}
                <Text style={styles.detailLabel}>Отношения:</Text>
                <Text style={styles.detailText}>{lifePath.relationships}</Text>
                <Text style={styles.detailLabel}>Жизненный путь:</Text>
                <Text style={styles.detailText}>{lifePath.lifePath}</Text>
                <Text style={styles.detailLabel}>Духовное значение:</Text>
                <Text style={styles.detailText}>{lifePath.spiritualMeaning}</Text>
              </View>
            </View>
          )}
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
  content: { padding: 20, gap: 15 },
  heroSection: { alignItems: 'center', marginBottom: 20 },
  name: { fontSize: 28, fontWeight: '700', color: '#E8E8E8' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' },
  numberCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 15 },
  cardGradient: { padding: 20, borderWidth: 1, borderColor: 'rgba(46,204,113,0.3)', borderRadius: 20 },
  numberBadge: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(46,204,113,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  numberValue: { fontSize: 32, fontWeight: '700', color: '#2ECC71' },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#E8E8E8', marginBottom: 5 },
  cardSubtitle: { fontSize: 16, color: '#2ECC71', marginBottom: 10 },
  cardDescription: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  detailsSection: { marginTop: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#E8E8E8', marginBottom: 15 },
  detailCard: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: 'rgba(46,204,113,0.3)', gap: 10 },
  detailLabel: { fontSize: 16, fontWeight: '600', color: '#2ECC71', marginTop: 10 },
  listItem: { fontSize: 14, color: 'rgba(255,255,255,0.8)', paddingLeft: 10 },
  detailText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 15 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#E8E8E8', textAlign: 'center' },
  emptyText: { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22 },
  emptyButton: { borderRadius: 25, overflow: 'hidden', marginTop: 10 },
  emptyButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 30, gap: 8 },
  emptyButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' }
});
