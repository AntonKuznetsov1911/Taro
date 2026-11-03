import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TaroPage, taro } from '../components/TaroPage';
import { DailyCardWidget } from '../components/DailyCardWidget';
import { useUserProfile } from '../src/contexts/UserProfileContext';
import { wasOnboardingSeen } from '../src/utils/onboarding';

export default function TodayScreen() {
  const router = useRouter();
  const { profile, isLoading, hasProfile, getGreeting, isBirthday } = useUserProfile();
  useEffect(() => {
    if (isLoading || hasProfile) return;
    let cancelled = false;
    void wasOnboardingSeen().then(seen => {
      if (!cancelled && !seen) router.replace('/onboarding');
    });
    return () => { cancelled = true; };
  }, [isLoading, hasProfile, router]);

  if (isLoading) return <View style={styles.loading}><ActivityIndicator color={taro.gold} /></View>;
  return (
    <TaroPage title="Сегодня" subtitle={profile?.name ? getGreeting() : 'Откройте карту дня или задайте свой вопрос.'}>
      {isBirthday() && <Text style={styles.birthday}>С днём рождения!</Text>}
      <DailyCardWidget onViewDetails={() => router.navigate('/journal')} />
      <Pressable accessibilityRole="button" onPress={() => router.navigate('/spreads')} style={styles.primary}>
        <Ionicons name="sparkles-outline" size={22} color={taro.background} />
        <Text style={styles.primaryLabel}>Сделать расклад</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.navigate('/journal')} style={styles.journal}>
        <Ionicons name="book-outline" size={22} color={taro.gold} />
        <View style={styles.journalText}>
          <Text style={styles.journalTitle}>Календарь карты дня</Text>
          <Text style={styles.subtitle}>Открытые карты и ваши заметки</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={taro.muted} />
      </Pressable>
    </TaroPage>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: taro.background },
  birthday: { color: taro.gold, fontSize: 16, fontWeight: '600' },
  primary: { minHeight: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: taro.gold, borderRadius: 15, padding: 12 },
  primaryLabel: { fontSize: 17, fontWeight: '700', color: taro.background },
  journal: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: taro.panel, borderRadius: 15, borderColor: taro.border, borderWidth: 1, padding: 14 },
  journalText: { flex: 1, gap: 4 },
  journalTitle: { color: taro.text, fontSize: 16, fontWeight: '600' },
  subtitle: { color: taro.muted, fontSize: 13 },
});
