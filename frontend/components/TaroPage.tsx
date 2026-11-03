import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CosmicBackground } from './CosmicBackground';

export const taro = {
  background: '#0C0717', panel: '#1A1129', border: '#392749',
  gold: '#EAC98B', text: '#FAF1E5', muted: '#BBAACD', accent: '#8653AF',
};

export function TaroPage({ title, subtitle, children }: React.PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <View style={styles.page}>
      <CosmicBackground />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: taro.background },
  content: { padding: 20, paddingTop: 26, paddingBottom: 36, gap: 16, width: '100%', maxWidth: 680, alignSelf: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: taro.gold },
  subtitle: { fontSize: 15, lineHeight: 22, color: taro.muted, marginTop: -8 },
});
