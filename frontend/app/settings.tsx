import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StarryBackground } from '../components/StarryBackground';

export default function SettingsScreen() {
  const router = useRouter();
  
  // Settings state
  const [settings, setSettings] = useState({
    language: 'russian',
    notifications: true,
    soundEnabled: true,
    animations: true,
    darkMode: true,
    autoSave: true,
    vibration: true,
  });

  const languages = [
    { code: 'russian', name: 'Русский', flag: '🇷🇺' },
    { code: 'english', name: 'English', flag: '🇺🇸' },
    { code: 'ukrainian', name: 'Українська', flag: '🇺🇦' },
  ];

  const toggleSetting = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const selectLanguage = (languageCode: string) => {
    setSettings(prev => ({ ...prev, language: languageCode }));
    Alert.alert('Язык изменен', 'Перезапустите приложение для применения изменений');
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
            setSettings({
              language: 'russian',
              notifications: true,
              soundEnabled: true,
              animations: true,
              darkMode: true,
              autoSave: true,
              vibration: true,
            });
            Alert.alert('Готово', 'Настройки сброшены к значениям по умолчанию');
          }
        }
      ]
    );
  };

  const SettingRow = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onToggle,
    type = 'switch'
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value?: boolean | string;
    onToggle?: () => void;
    type?: 'switch' | 'button';
  }) => (
    <View style={styles.settingRow}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.settingRowGradient}
      >
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
          <Switch
            value={value as boolean}
            onValueChange={onToggle}
            trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#9B59B6' }}
            thumbColor={value ? '#BB6BD9' : 'rgba(255, 255, 255, 0.8)'}
            ios_backgroundColor="rgba(255, 255, 255, 0.2)"
          />
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

  const LanguageRow = ({ language, isSelected, onSelect }: {
    language: { code: string; name: string; flag: string };
    isSelected: boolean;
    onSelect: () => void;
  }) => (
    <TouchableOpacity onPress={onSelect} style={styles.languageRow}>
      <LinearGradient
        colors={isSelected ? 
          ['rgba(155, 89, 182, 0.2)', 'rgba(142, 68, 173, 0.1)'] :
          ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.languageRowGradient}
      >
        <View style={styles.languageContent}>
          <Text style={styles.languageFlag}>{language.flag}</Text>
          <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
            {language.name}
          </Text>
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
      
      <LinearGradient
        colors={['#000011', '#1a0033', '#2d1b69', '#0f0f23']}
        style={styles.background}
      >
        <StarryBackground />
        
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#E8E8E8" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Настройки</Text>
            <TouchableOpacity 
              style={styles.historyButton}
              onPress={() => router.push('/history')}
            >
              <Ionicons name="time" size={24} color="#E8E8E8" />
            </TouchableOpacity>
          </View>

          {/* Settings Sections */}
          <View style={styles.content}>
            
            {/* Language Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌍 Язык интерфейса</Text>
              <View style={styles.sectionContent}>
                {languages.map(language => (
                  <LanguageRow
                    key={language.code}
                    language={language}
                    isSelected={settings.language === language.code}
                    onSelect={() => selectLanguage(language.code)}
                  />
                ))}
              </View>
            </View>

            {/* Interface Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎨 Интерфейс</Text>
              <View style={styles.sectionContent}>
                <SettingRow
                  icon="moon"
                  title="Темная тема"
                  subtitle="Используется по умолчанию для мистической атмосферы"
                  value={settings.darkMode}
                  onToggle={() => toggleSetting('darkMode')}
                />
                
                <SettingRow
                  icon="sparkles"
                  title="Анимации"
                  subtitle="Плавные переходы и эффекты"
                  value={settings.animations}
                  onToggle={() => toggleSetting('animations')}
                />
              </View>
            </View>

            {/* Notifications Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔔 Уведомления</Text>
              <View style={styles.sectionContent}>
                <SettingRow
                  icon="notifications"
                  title="Уведомления"
                  subtitle="Напоминания и новые предсказания"
                  value={settings.notifications}
                  onToggle={() => toggleSetting('notifications')}
                />
                
                <SettingRow
                  icon="volume-high"
                  title="Звуки"
                  subtitle="Звуковые эффекты приложения"
                  value={settings.soundEnabled}
                  onToggle={() => toggleSetting('soundEnabled')}
                />
                
                <SettingRow
                  icon="phone-portrait"
                  title="Вибрация"
                  subtitle="Тактильная обратная связь"
                  value={settings.vibration}
                  onToggle={() => toggleSetting('vibration')}
                />
              </View>
            </View>

            {/* Data Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💾 Данные</Text>
              <View style={styles.sectionContent}>
                <SettingRow
                  icon="save"
                  title="Автосохранение"
                  subtitle="Автоматически сохранять результаты гаданий"
                  value={settings.autoSave}
                  onToggle={() => toggleSetting('autoSave')}
                />
              </View>
            </View>

            {/* Profile Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👤 Профиль</Text>
              <View style={styles.sectionContent}>
                <TouchableOpacity 
                  style={styles.profileButton}
                  onPress={() => router.push('/profile')}
                >
                  <LinearGradient
                    colors={['rgba(69, 183, 209, 0.9)', 'rgba(52, 152, 219, 1)']}
                    style={styles.profileButtonGradient}
                  >
                    <Ionicons name="person" size={20} color="#FFF" />
                    <Text style={styles.profileButtonText}>Редактировать профиль</Text>
                    <Ionicons name="chevron-forward" size={16} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Actions Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚙️ Действия</Text>
              <View style={styles.sectionContent}>
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={resetSettings}
                >
                  <LinearGradient
                    colors={['rgba(231, 76, 60, 0.8)', 'rgba(192, 57, 43, 0.9)']}
                    style={styles.resetButtonGradient}
                  >
                    <Ionicons name="refresh" size={20} color="#FFF" />
                    <Text style={styles.resetButtonText}>Сбросить настройки</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* App Info */}
            <View style={styles.appInfo}>
              <Text style={styles.appName}>TARO - Мистические предсказания</Text>
              <Text style={styles.appVersion}>Версия 1.0.0</Text>
              <Text style={styles.appDescription}>
                Древняя мудрость звезд в современном приложении
              </Text>
            </View>
            
            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>
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
  scrollView: {
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
  historyButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 15,
  },
  sectionContent: {
    gap: 12,
  },
  settingRow: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  settingRowGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E8E8E8',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  languageRow: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  languageRowGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  languageNameSelected: {
    color: '#E8E8E8',
    fontWeight: '600',
  },
  checkmark: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
  },
  profileButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  profileButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  resetButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
  },
  resetButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 20,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#BB6BD9',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 20,
  },
});