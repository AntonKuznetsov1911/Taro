import React from 'react';
import { Stack } from 'expo-router';
import { SettingsProvider } from '../src/contexts/SettingsContext';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SettingsProvider>
  );
}