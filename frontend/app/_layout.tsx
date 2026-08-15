import React from 'react';
import { Stack } from 'expo-router';
import { SettingsProvider } from '../src/contexts/SettingsContext';
import { AppProvider } from '../src/contexts/AppContext';
import { UserProfileProvider } from '../src/context/UserProfileContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { UpdateNotification } from '../components/UpdateNotification';

// OfflineBanner намеренно не подключён: все гадания считаются локально,
// поэтому отсутствие сети ни на что не влияет и предупреждать о нём не о чем.
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <UserProfileProvider>
          <SettingsProvider>
            <UpdateNotification />
            <Stack screenOptions={{ headerShown: false }} />
          </SettingsProvider>
        </UserProfileProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}