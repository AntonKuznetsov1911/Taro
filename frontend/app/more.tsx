import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TaroPage, taro } from '../components/TaroPage';

const features = [
  { href: '/deck', title: 'Каталог колоды', subtitle: 'Все 78 карт и их значения', icon: 'layers-outline' },
  { href: '/horoscope', title: 'Гороскоп', subtitle: 'Прогноз на сегодня', icon: 'sunny-outline' },
  { href: '/camera', title: 'Хиромантия', subtitle: 'Чтение линий ладони', icon: 'hand-left-outline' },
  { href: '/compatibility', title: 'Гармония имён', subtitle: 'Анализ совместимости', icon: 'heart-outline' },
  { href: '/astro-personality', title: 'Астропсихология', subtitle: 'Портрет личности', icon: 'planet-outline' },
  { href: '/runes', title: 'Руны', subtitle: 'Оракул викингов', icon: 'diamond-outline' },
  { href: '/numerology', title: 'Нумерология', subtitle: 'Число судьбы', icon: 'calculator-outline' },
  { href: '/settings', title: 'Настройки', subtitle: 'Профиль, звук и резервные копии', icon: 'settings-outline' },
] as const;

export default function MoreScreen() {
  const router = useRouter();
  return (
    <TaroPage title="Ещё" subtitle="Колода, практики и настройки">
      {features.map(item => (
        <Pressable key={item.href} accessibilityRole="button" onPress={() => router.push(item.href)}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={styles.icon}><Ionicons name={item.icon} size={21} color={taro.gold} /></View>
          <View style={styles.info}><Text style={styles.label}>{item.title}</Text><Text style={styles.hint}>{item.subtitle}</Text></View>
          <Ionicons name="chevron-forward" size={18} color={taro.muted} />
        </Pressable>
      ))}
    </TaroPage>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 12, borderWidth: 1, borderColor: taro.border, backgroundColor: taro.panel, borderRadius: 15 },
  pressed: { opacity: .78 },
  icon: { width: 39, height: 39, borderRadius: 12, backgroundColor: '#32213F', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 3 },
  label: { color: taro.text, fontSize: 16, fontWeight: '600' },
  hint: { color: taro.muted, fontSize: 13 },
});
