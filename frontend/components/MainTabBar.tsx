import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { taro } from './TaroPage';

const tabs = [
  { href: '/', label: 'Сегодня', icon: 'moon-outline' },
  { href: '/spreads', label: 'Расклады', icon: 'layers-outline' },
  { href: '/journal', label: 'Дневник', icon: 'book-outline' },
  { href: '/more', label: 'Ещё', icon: 'grid-outline' },
] as const;

export function MainTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const active = pathname === '/history' ? '/journal' : pathname;
  if (!tabs.some(tab => tab.href === active)) return null;
  return (
    <View accessibilityRole="tablist" style={styles.bar}>
      {tabs.map(tab => {
        const selected = active === tab.href;
        const color = selected ? taro.gold : taro.muted;
        return (
          <Pressable
            key={tab.href} accessibilityRole="tab" accessibilityLabel={tab.label}
            accessibilityState={{ selected }} onPress={() => { if (pathname !== tab.href) router.navigate(tab.href); }}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <View style={[styles.icon, selected && styles.activeIcon]}><Ionicons name={tab.icon} size={22} color={color} /></View>
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: '#130D20', borderTopWidth: 1, borderColor: taro.border, paddingHorizontal: 8, paddingVertical: 5 },
  tab: { flex: 1, minHeight: 53, gap: 2, alignItems: 'center', justifyContent: 'center' },
  icon: { paddingHorizontal: 15, paddingVertical: 3, borderRadius: 15 },
  activeIcon: { backgroundColor: '#33213F' },
  label: { fontSize: 11, fontWeight: '600' },
  pressed: { opacity: .75 },
});
