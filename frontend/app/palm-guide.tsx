import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PalmGuide } from '../components/PalmGuide';

export default function PalmGuideScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
        style={styles.background}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000011" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Руководство по хиромантии</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="book-outline" size={24} color="#9B59B6" />
          <Text style={styles.infoBannerText}>
            Изучите основы хиромантии: линии, холмы, формы руки и особые знаки
          </Text>
        </View>

        {/* Guide Component */}
        <PalmGuide />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8E8E8',
  },
  placeholder: {
    width: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(155, 89, 182, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(155, 89, 182, 0.3)',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 12,
    lineHeight: 18,
  },
});
