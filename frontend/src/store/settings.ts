import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SettingsState = {
  soundEnabled: boolean;
  vibration: boolean;
  notifications: boolean;
  autoSave: boolean;
  language: 'russian' | 'english';
  setSoundEnabled: (val: boolean) => void;
  setVibration: (val: boolean) => void;
  setNotifications: (val: boolean) => void;
  setAutoSave: (val: boolean) => void;
  setLanguage: (val: 'russian' | 'english') => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      vibration: true,
      notifications: true,
      autoSave: true,
      language: 'russian',
      setSoundEnabled: (val) => set({ soundEnabled: val }),
      setVibration: (val) => set({ vibration: val }),
      setNotifications: (val) => set({ notifications: val }),
      setAutoSave: (val) => set({ autoSave: val }),
      setLanguage: (val) => set({ language: val }),
    }),
    {
      name: 'taro-settings',
      getStorage: () => AsyncStorage,
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        vibration: state.vibration,
        notifications: state.notifications,
        autoSave: state.autoSave,
        language: state.language,
      }),
    }
  )
);