import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Stack, usePathname } from 'expo-router';
import { SettingsProvider } from '../src/contexts/SettingsContext';
import { AppProvider } from '../src/contexts/AppContext';
import { UserProfileProvider } from '../src/contexts/UserProfileContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { UpdateNotification } from '../components/UpdateNotification';
import { InstallPWAPrompt } from '../components/InstallPWAPrompt';
import { recoverBackupRestore } from '../src/utils/backup';
import { onAppSessionRestart } from '../src/utils/appSession';

// Баннер установки прижат к низу экрана и перехватывает нажатия под собой:
// на онбординге под ним оказывалась кнопка «Начать», на других экранах —
// кнопки действий. Показываем его только на главной, где в списке заложен
// нижний отступ под его высоту.
function InstallPrompt() {
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '';
  if (!isHome) return null;
  return <InstallPWAPrompt />;
}

function AppSession() {
  const [generation, setGeneration] = useState(0);
  useEffect(() => onAppSessionRestart(() => setGeneration(value => value + 1)), []);
  return <AppProvider key={generation}>
        <SettingsProvider>
          <UserProfileProvider>
            <UpdateNotification />
            <Stack screenOptions={{ headerShown: false }} />
            <InstallPrompt />
          </UserProfileProvider>
        </SettingsProvider>
      </AppProvider>;
}

function StorageGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const recover = () => {
    setError('');
    void recoverBackupRestore().then(() => setReady(true)).catch(() => setError('Не удалось восстановить данные после прерванного импорта.'));
  };
  useEffect(recover, []);
  if (ready) return <>{children}</>;
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
    {error ? <><Text style={{ color: '#E8E8E8', textAlign: 'center' }}>{error}</Text><TouchableOpacity onPress={recover} style={{ padding: 20 }}><Text style={{ color: '#BB6BD9' }}>Повторить</Text></TouchableOpacity></> : <ActivityIndicator color="#BB6BD9" />}
  </View>;
}

export default function RootLayout() {
  const Frame = Platform.OS === 'android' ? SafeAreaView : View;
  return <SafeAreaProvider><Frame style={{ flex: 1, backgroundColor: '#000011' }}><ErrorBoundary><StorageGate><AppSession /></StorageGate></ErrorBoundary></Frame></SafeAreaProvider>;
}
