import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { drawRunes, isReversed, RUNE_SPREADS } from '../src/data/runesKnowledge';

export default function RunesScreen() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [selectedSpread, setSelectedSpread] = useState<'one' | 'three' | 'cross'>('one');

  const handleDraw = () => {
    if (!question.trim()) {
      alert('Задайте вопрос рунам');
      return;
    }

    const spreadCounts = { one: 1, three: 3, cross: 6 };
    const runes = drawRunes(spreadCounts[selectedSpread]);
    const reversed = runes.map(() => isReversed());

    router.push({
      pathname: '/runes-result',
      params: {
        question,
        spreadType: selectedSpread,
        runes: JSON.stringify(runes.map(r => r.id)),
        reversed: JSON.stringify(reversed)
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']} style={styles.background}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#E8E8E8" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Руны</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <LinearGradient colors={['rgba(52, 152, 219, 0.3)', 'rgba(41, 128, 185, 0.5)']} style={styles.iconGradient}>
                <Text style={styles.heroIcon}>ᚠ</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>Древняя мудрость викингов</Text>
            <Text style={styles.subtitle}>Elder Futhark - 25 священных рун</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ваш вопрос рунам</Text>
              <TextInput
                style={styles.input}
                placeholder="Что вас волнует?.."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={question}
                onChangeText={setQuestion}
                multiline
              />
            </View>

            <View style={styles.spreadsSection}>
              <Text style={styles.label}>Выберите расклад</Text>
              {Object.entries(RUNE_SPREADS).map(([key, spread]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.spreadCard, selectedSpread === key && styles.selectedSpread]}
                  onPress={() => setSelectedSpread(key as any)}
                >
                  <Text style={styles.spreadName}>{spread.nameRu}</Text>
                  <Text style={styles.spreadDesc}>{spread.description}</Text>
                  {selectedSpread === key && <View style={styles.selectedIndicator} />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.drawButton} onPress={handleDraw}>
              <LinearGradient colors={['rgba(52, 152, 219, 0.9)', 'rgba(41, 128, 185, 1)']} style={styles.buttonGradient}>
                <Ionicons name="hand-right" size={24} color="#FFF" />
                <Text style={styles.buttonText}>Вытянуть руны</Text>
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
  heroIcon: { fontSize: 60, color: '#3498DB' },
  title: { fontSize: 24, fontWeight: '700', color: '#E8E8E8', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' },
  form: { gap: 25 },
  inputGroup: { gap: 10 },
  label: { fontSize: 16, fontWeight: '600', color: '#E8E8E8' },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, padding: 15, color: '#E8E8E8', fontSize: 16, borderWidth: 1, borderColor: 'rgba(52,152,219,0.3)', minHeight: 80, textAlignVertical: 'top' },
  spreadsSection: { gap: 12 },
  spreadCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, padding: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', position: 'relative' },
  selectedSpread: { borderColor: '#3498DB', backgroundColor: 'rgba(52,152,219,0.15)' },
  spreadName: { fontSize: 16, fontWeight: '600', color: '#E8E8E8', marginBottom: 6 },
  spreadDesc: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  selectedIndicator: { position: 'absolute', top: 15, right: 15, width: 24, height: 24, borderRadius: 12, backgroundColor: '#3498DB' },
  drawButton: { borderRadius: 25, overflow: 'hidden', marginTop: 10 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  buttonText: { fontSize: 18, fontWeight: '600', color: '#FFF' }
});
