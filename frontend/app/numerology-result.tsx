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

  const lifePath = getNumberMeaning(Number(lifePathNumber));
  const destiny = getNumberMeaning(Number(destinyNumber));
  const soul = getNumberMeaning(Number(soulNumber));
  const year = getNumberMeaning(Number(personalYear));

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
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.subtitle}>Нумерологический портрет</Text>
          </View>

          <NumberCard number={lifePathNumber} title="Число Жизненного Пути" data={lifePath} />
          <NumberCard number={destinyNumber} title="Число Судьбы" data={destiny} />
          <NumberCard number={soulNumber} title="Число Души" data={soul} />
          <NumberCard number={personalYear} title="Личный Год" data={year} />

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
  detailText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20 }
});
