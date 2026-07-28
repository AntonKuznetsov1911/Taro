import React from 'react';
import { Stack } from 'expo-router';
import { SettingsProvider } from '../src/contexts/SettingsContext';
import { AppProvider } from '../src/contexts/AppContext';
import { UserProfileProvider } from '../src/contexts/UserProfileContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineBanner } from '../components/OfflineBanner';
import { UpdateNotification } from '../components/UpdateNotification';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <SettingsProvider>
          <UserProfileProvider>
            <OfflineBanner />
            <UpdateNotification />
            <Stack screenOptions={{ headerShown: false }} />
          </UserProfileProvider>
        </SettingsProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}