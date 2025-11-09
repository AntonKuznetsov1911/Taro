import React from 'react';
import { Stack } from 'expo-router';
import { SettingsProvider } from '../src/contexts/SettingsContext';
import { AppProvider } from '../src/contexts/AppContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineBanner } from '../components/OfflineBanner';
import { UpdateNotification } from '../components/UpdateNotification';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <SettingsProvider>
          <OfflineBanner />
          <UpdateNotification />
          <Stack screenOptions={{ headerShown: false }} />
        </SettingsProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}