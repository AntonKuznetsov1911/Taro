import React from 'react';
import { Stack, usePathname } from 'expo-router';
import { SettingsProvider } from '../src/contexts/SettingsContext';
import { AppProvider } from '../src/contexts/AppContext';
import { UserProfileProvider } from '../src/contexts/UserProfileContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { UpdateNotification } from '../components/UpdateNotification';
import { InstallPWAPrompt } from '../components/InstallPWAPrompt';

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

// OfflineBanner намеренно не подключён: все гадания считаются локально,
// поэтому отсутствие сети ни на что не влияет и предупреждать о нём не о чем.
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <SettingsProvider>
          <UserProfileProvider>
            <UpdateNotification />
            <Stack screenOptions={{ headerShown: false }} />
            <InstallPrompt />
          </UserProfileProvider>
        </SettingsProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}
