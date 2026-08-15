import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@taro_settings';

export type Settings = {
  language: 'russian' | 'english';
  notifications: boolean;
  soundEnabled: boolean;
  autoSave: boolean;
  vibration: boolean;
  effectsVolume: number; // 0..1
};

const defaultSettings: Settings = {
  language: 'russian',
  notifications: true,
  soundEnabled: true,
  autoSave: true,
  vibration: true,
  effectsVolume: 0.7,
};

export type SettingsContextType = Settings & {
  setLanguage: (val: Settings['language']) => void;
  setNotifications: (val: boolean) => void;
  setSoundEnabled: (val: boolean) => void;
  setAutoSave: (val: boolean) => void;
  setVibration: (val: boolean) => void;
  setEffectsVolume: (val: number) => void; // 0..1
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Settings>(defaultSettings);
  const isHydrated = useRef(false);

  // Загружаем сохранённые настройки один раз при старте
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (!cancelled && stored) {
          const parsed = JSON.parse(stored);
          // Мержим с дефолтами, чтобы новые поля не оказались undefined
          setState((s) => ({ ...s, ...parsed }));
        }
      } catch {
        // Остаёмся на значениях по умолчанию
      } finally {
        isHydrated.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Пишем только после гидратации, иначе дефолты затрут сохранённое
  useEffect(() => {
    if (!isHydrated.current) return;
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(state)).catch(() => {
      // Настройки продолжат работать в текущей сессии
    });
  }, [state]);

  const value = useMemo<SettingsContextType>(
    () => ({
      ...state,
      setLanguage: (language) => setState((s) => ({ ...s, language })),
      setNotifications: (notifications) => setState((s) => ({ ...s, notifications })),
      setSoundEnabled: (soundEnabled) => setState((s) => ({ ...s, soundEnabled })),
      setAutoSave: (autoSave) => setState((s) => ({ ...s, autoSave })),
      setVibration: (vibration) => setState((s) => ({ ...s, vibration })),
      setEffectsVolume: (effectsVolume) => setState((s) => ({ ...s, effectsVolume })),
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