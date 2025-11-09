import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { RUNES, RUNE_SPREADS } from '../src/data/runesKnowledge';

export default function RunesResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { question, spreadType, runes, reversed } = params;

  const runeIds = JSON.parse(runes as string);
  const isReversed = JSON.parse(reversed as string);
  const drawnRunes = runeIds.map((id: string) => RUNES.find(r => r.id === id));
  const spread = RUNE_SPREADS[spreadType as keyof typeof RUNE_SPREADS];

  const handleShare = async () => {
    try {
      const text = drawnRunes.map((r: any, i: number) =>
        `${spread.positions[i]}: ${r.symbol} ${r.nameRu}${isReversed[i] ? ' (перевёрнута)' : ''}`
      ).join('\n');
      await Share.share({ message: `Гадание на рунах\nВопрос: ${question}\n\n${text}` });
    } catch (error) {
      console.error(error);
    }
  };

  const RuneCard = ({ rune, position, reversed }: any) => (
    <View style={styles.runeCard}>
      <LinearGradient colors={['rgba(52,152,219,0.15)', 'rgba(41,128,185,0.1)']} style={styles.cardGradient}>
        <Text style={styles.position}>{position}</Text>
        <View style={[styles.runeSymbolContainer, reversed && styles.reversedRune]}>
          <Text style={styles.runeSymbol}>{rune.symbol}</Text>
        </View>
        <Text style={styles.runeName}>{rune.nameRu} ({rune.name})</Text>
        {reversed && <Text style={styles.reversedLabel}>Перевёрнута</Text>}
        <Text style={styles.runeKeywords}>{rune.keywords.slice(0, 3).join(' • ')}</Text>
        <View style={styles.divider} />
        <Text style={styles.runeMeaning}>{reversed ? rune.reversedMeaning : rune.uprightMeaning}</Text>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']} style={styles.background}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#E8E8E8" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Толкование рун</Text>
          <TouchableOpacity onPress={handleShare}><Ionicons name="share-outline" size={24} color="#E8E8E8" /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.questionSection}>
            <Text style={styles.spreadTitle}>{spread.nameRu}</Text>
            <Text style={styles.question}>"{question}"</Text>
          </View>

          {drawnRunes.map((rune: any, index: number) => (
            <RuneCard key={index} rune={rune} position={spread.positions[index]} reversed={isReversed[index]} />
          ))}

          {drawnRunes[0] && (
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Детальный анализ первой руны</Text>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Совет:</Text>
                <Text style={styles.detailText}>{drawnRunes[0].advice}</Text>
                <Text style={styles.detailLabel}>Отношения:</Text>
                <Text style={styles.detailText}>{drawnRunes[0].relationship}</Text>
                <Text style={styles.detailLabel}>Карьера:</Text>
                <Text style={styles.detailText}>{drawnRunes[0].career}</Text>
                <Text style={styles.detailLabel}>Духовное значение:</Text>
                <Text style={styles.detailText}>{drawnRunes[0].spiritualMeaning}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#3498DB" />
            <Text style={styles.infoText}>
              Руны - древний оракул викингов. Перевёрнутая руна указывает на блокировку или обратную энергию.
            </Text>
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
  content: { padding: 20, gap: 15 },
  questionSection: { alignItems: 'center', marginBottom: 20 },
  spreadTitle: { fontSize: 20, fontWeight: '600', color: '#3498DB', marginBottom: 10 },
  question: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', textAlign: 'center' },
  runeCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 15 },
  cardGradient: { padding: 20, borderWidth: 1, borderColor: 'rgba(52,152,219,0.3)', borderRadius: 20 },
  position: { fontSize: 14, color: '#3498DB', fontWeight: '600', marginBottom: 15 },
  runeSymbolContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(52,152,219,0.2)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 15, borderWidth: 2, borderColor: '#3498DB' },
  reversedRune: { transform: [{ rotate: '180deg' }] },
  runeSymbol: { fontSize: 48, color: '#3498DB', fontWeight: '600' },
  runeName: { fontSize: 18, fontWeight: '600', color: '#E8E8E8', textAlign: 'center', marginBottom: 5 },
  reversedLabel: { fontSize: 12, color: '#E74C3C', textAlign: 'center', marginBottom: 10 },
  runeKeywords: { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 15 },
  divider: { height: 1, backgroundColor: 'rgba(52,152,219,0.3)', marginVertical: 15 },
  runeMeaning: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  detailsSection: { marginTop: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#E8E8E8', marginBottom: 15 },
  detailCard: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: 'rgba(52,152,219,0.3)', gap: 10 },
  detailLabel: { fontSize: 16, fontWeight: '600', color: '#3498DB', marginTop: 10 },
  detailText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  infoBox: { flexDirection: 'row', backgroundColor: 'rgba(52,152,219,0.15)', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: 'rgba(52,152,219,0.3)', gap: 10, marginTop: 20 },
  infoText: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 18 }
});
