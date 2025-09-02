import React, { createContext, useContext, useMemo, useState } from 'react';

export type Settings = {
  language: 'russian' | 'english';
  notifications: boolean;
  soundEnabled: boolean;
  autoSave: boolean;
  vibration: boolean;
};

const defaultSettings: Settings = {
  language: 'russian',
  notifications: true,
  soundEnabled: true,
  autoSave: true,
  vibration: true,
};

export type SettingsContextType = Settings & {
  setLanguage: (val: Settings['language']) => void;
  setNotifications: (val: boolean) => void;
  setSoundEnabled: (val: boolean) => void;
  setAutoSave: (val: boolean) => void;
  setVibration: (val: boolean) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Settings>(defaultSettings);

  const value = useMemo<SettingsContextType>(
    () => ({
      ...state,
      setLanguage: (language) => setState((s) => ({ ...s, language })),
      setNotifications: (notifications) => setState((s) => ({ ...s, notifications })),
      setSoundEnabled: (soundEnabled) => setState((s) => ({ ...s, soundEnabled })),
      setAutoSave: (autoSave) => setState((s) => ({ ...s, autoSave })),
      setVibration: (vibration) => setState((s) => ({ ...s, vibration })),
    }),
    [state]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}