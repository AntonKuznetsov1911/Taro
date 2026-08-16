import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  Alert,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '../components/CosmicBackground';
import { useSettings } from '../src/contexts/SettingsContext';
import { useUserProfile } from '../src/contexts/UserProfileContext';

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettings();
  const { profile, clearProfile } = useUserProfile();

  const [trackWidth, setTrackWidth] = useState(1);
  const thumbLeft = Math.max(0, Math.min(trackWidth - 20, trackWidth * settings.effectsVolume - 10));
  const fillWidth = Math.max(0, Math.min(trackWidth, trackWidth * settings.effectsVolume));

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        const v = Math.max(0, Math.min(1, x / trackWidth));
        settings.setEffectsVolume(v);
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const v = Math.max(0, Math.min(1, x / trackWidth));
        settings.setEffectsVolume(v);
      },
    })
  ).current;

  const languages = [
    { code: 'russian', name: 'Русский', flag: '🇷🇺' },
  ];

  const toggle = (key: 'notifications' | 'soundEnabled' | 'autoSave' | 'vibration') => {
    switch (key) {
      case 'notifications':
        settings.setNotifications(!settings.notifications);
        break;
      case 'soundEnabled':
        settings.setSoundEnabled(!settings.soundEnabled);
        break;
      case 'autoSave':
        settings.setAutoSave(!settings.autoSave);
        break;
      case 'vibration':
        settings.setVibration(!settings.vibration);
        break;
    }
  };

  const selectLanguage = (languageCode: 'russian' | 'english') => {
    settings.setLanguage(languageCode);
  };

  const resetSettings = () => {
    Alert.alert(
      'Сбросить настройки',
      'Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: () => {
            settings.setLanguage('russian');
            settings.setNotifications(true);
            settings.setSoundEnabled(true);
            settings.setAutoSave(true);
            settings.setVibration(true);
            settings.setEffectsVolume(0.7);
            Alert.alert('Готово', 'Настройки сброшены к значениям по умолчанию');
          },
        },
      ]
    );
  };

  const SettingRow = ({ icon, title, subtitle, value, onToggle, type = 'switch' }: {
    icon: string; title: string; subtitle?: string; value?: boolean | string; onToggle?: () => void; type?: 'switch' | 'button';
  }) => (
    <View style={styles.settingRow}>
      <LinearGradient colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']} style={styles.settingRowGradient}>
        <View style={styles.settingLeft}>
          <View style={styles.settingIconContainer}>
            <Ionicons name={icon as any} size={20} color="#BB6BD9" />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>{title}</Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        {type === 'switch' && (
          <Switch value={value as boolean} onValueChange={onToggle} trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#9B59B6' }} thumbColor={value ? '#BB6BD9' : 'rgba(255, 255, 255, 0.8)'} ios_backgroundColor="rgba(255, 255, 255, 0.2)" />
        )}
        {type === 'button' && (
          <TouchableOpacity onPress={onToggle} style={styles.settingButton}>
            <Text style={styles.settingButtonText}>{value}</Text>
            <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );

  const LanguageRow = ({ language, isSelected, onSelect }: { language: { code: string; name: string; flag: string }; isSelected: boolean; onSelect: () => void; }) => (
    <TouchableOpacity onPress={onSelect} style={styles.languageRow}>
      <LinearGradient
        colors={isSelected ? ['rgba(155, 89, 182, 0.2)', 'rgba(142, 68, 173, 0.1)'] : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.languageRowGradient}
      >
        <View style={styles.languageContent}>
          <Text style={styles.languageFlag}>{language.flag}</Text>
          <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>{language.name}</Text>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark" size={20} color="#BB6BD9" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000011" />
      <LinearGradient colors={["#000011", "#1a0033", "#2d1b69", "#0f0f23"]} style={styles.background}>
        <CosmicBackground />
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Настройки</Text>
            <TouchableOpacity style={styles.historyButton} onPress={() => router.push('/history')}>
              <Ionicons name="time" size={24} color="#E8E8E8" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Профиль пользователя */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👤 Ваш профиль</Text>
              <View style={styles.sectionContent}>
                {profile?.isComplete ? (
                  <View style={styles.profileCard}>
                    <LinearGradient
                      colors={['rgba(155, 89, 182, 0.2)', 'rgba(142, 68, 173, 0.1)']}
                      style={styles.profileCardGradient}
                    >
                      <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{profile.name}</Text>
                        <View style={styles.profileZodiac}>
                          <Text style={styles.profileZodiacSymbol}>{profile.sunSign?.symbol}</Text>
                          <Text style={styles.profileZodiacName}>{profile.sunSign?.nameRu}</Text>
                        </View>
                        <Text style={styles.profileBirthDate}>
                          {new Date(profile.birthDate).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                      <View style={styles.profileActions}>
                        <TouchableOpacity
                          style={styles.profileEditButton}
                          onPress={() => router.push('/onboarding')}
                        >
                          <Ionicons name="pencil" size={16} color="#BB6BD9" />
                          <Text style={styles.profileEditText}>Изменить</Text>
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.createProfileButton}
                    onPress={() => router.push('/onboarding')}
                  >
                    <LinearGradient
                      colors={['#9B59B6', '#8E44AD']}
                      style={styles.createProfileGradient}
                    >
                      <Ionicons name="person-add" size={20} color="#FFF" />
                      <Text style={styles.createProfileText}>Создать профиль</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌍 Язык интерфейса</Text>
              <View style={styles.sectionContent}>
                {languages.map(language => (
                  <LanguageRow key={language.code} language={language} isSelected onSelect={() => selectLanguage(language.code as 'russian' | 'english')} />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔔 Уведомления</Text>
              <View style={styles.sectionContent}>
                <SettingRow icon="notifications" title="Уведомления" subtitle="Напоминания и новые предсказания" value={settings.notifications} onToggle={() => toggle('notifications')} />
                <SettingRow icon="volume-high" title="Звуки" subtitle="Звуковые эффекты приложения" value={settings.soundEnabled} onToggle={() => toggle('soundEnabled')} />
                <SettingRow icon="phone-portrait" title="Вибрация" subtitle="Тактильная обратная связь" value={settings.vibration} onToggle={() => toggle('vibration')} />

                {/* Volume slider */}
                <View style={{ marginTop: 8 }}>
                  <Text style={{ color: '#B8B8B8', marginBottom: 6 }}>Громкость эффектов</Text>
                  <View style={styles.sliderRow}>
                    <Ionicons name="volume-low" size={16} color="#B8B8B8" />
                    <View style={styles.sliderTrack} onLayout={onTrackLayout} {...panResponder.panHandlers}>
                      <View style={[styles.sliderFill, { width: fillWidth }]} />
                      <View style={[styles.sliderThumb, { left: thumbLeft }]} />
                    </View>
                    <Ionicons name="volume-high" size={16} color="#B8B8B8" />
                    <Text style={styles.sliderValue}>{Math.round(settings.effectsVolume * 100)}%</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💾 Данные</Text>
              <View style={styles.sectionContent}>
                <SettingRow icon="save" title="Автосохранение" subtitle="Автоматически сохранять результаты гаданий" value={settings.autoSave} onToggle={() => toggle('autoSave')} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚙️ Действия</Text>
              <View style={styles.sectionContent}>
                <TouchableOpacity style={styles.resetButton} onPress={resetSettings}>
                  <LinearGradient colors={["rgba(231, 76, 60, 0.8)", "rgba(192, 57, 43, 0.9)"]} style={styles.resetButtonGradient}>
                    <Ionicons name="refresh" size={20} color="#FFF" />
                    <Text style={styles.resetButtonText}>Сбросить настройки</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.appInfo}>
              <Text style={styles.appName}>TARO - Мистические предсказания</Text>
              <Text style={styles.appVersion}>Версия 1.0.0</Text>
              <Text style={styles.appDescription}>Древняя мудрость звезд в современном приложении</Text>
            </View>

            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#E8E8E8' },
  historyButton: { padding: 8 },
  content: { padding: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#E8E8E8', marginBottom: 15 },
  sectionContent: { gap: 12 },
  settingRow: { borderRadius: 15, overflow: 'hidden' },
  settingRowGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 15 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingIconContainer: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(155, 89, 182, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingTextContainer: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '500', color: '#E8E8E8', marginBottom: 2 },
  settingSubtitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', lineHeight: 16 },
  settingButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingButtonText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' },
  languageRow: { borderRadius: 12, overflow: 'hidden' },
  languageRowGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12 },
  languageContent: { flexDirection: 'row', alignItems: 'center' },
  languageFlag: { fontSize: 24, marginRight: 12 },
  languageName: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)' },
  languageNameSelected: { color: '#E8E8E8', fontWeight: '600' },
  checkmark: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  profileButton: { borderRadius: 15, overflow: 'hidden', elevation: 5 },
  profileButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 10 },
  profileButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF', flex: 1, textAlign: 'center' },
  profileCard: { borderRadius: 15, overflow: 'hidden' },
  profileCardGradient: { padding: 16, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(155, 89, 182, 0.3)' },
  profileInfo: { alignItems: 'center', marginBottom: 12 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#E8E8E8', marginBottom: 8 },
  profileZodiac: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  profileZodiacSymbol: { fontSize: 24 },
  profileZodiacName: { fontSize: 16, color: '#BB6BD9', fontWeight: '600' },
  profileBirthDate: { fontSize: 13, color: 'rgba(255, 255, 255, 0.6)' },
  profileActions: { alignItems: 'center' },
  profileEditButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(155, 89, 182, 0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  profileEditText: { fontSize: 14, color: '#BB6BD9', fontWeight: '500' },
  createProfileButton: { borderRadius: 15, overflow: 'hidden' },
  createProfileGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 10 },
  createProfileText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  resetButton: { borderRadius: 15, overflow: 'hidden', elevation: 5 },
  resetButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 10 },
  resetButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  appInfo: { alignItems: 'center', paddingVertical: 30, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)', marginTop: 20 },
  appName: { fontSize: 18, fontWeight: '600', color: '#BB6BD9', marginBottom: 4 },
  appVersion: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 8 },
  appDescription: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', fontStyle: 'italic' },
  bottomSpacing: { height: 20 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sliderTrack: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, overflow: 'hidden', position: 'relative' },
  sliderFill: { height: '100%', backgroundColor: '#9B59B6' },
  sliderThumb: { position: 'absolute', top: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#BB6BD9', borderWidth: 2, borderColor: '#EEE' },
  sliderValue: { color: '#E8E8E8', width: 46, textAlign: 'right' },
});