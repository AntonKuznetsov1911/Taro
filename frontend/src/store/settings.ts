import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SettingsState = {
  soundEnabled: boolean;
  vibration: boolean;
  notifications: boolean;
  autoSave: boolean;
  language: 'russian' | 'english';
  setSoundEnabled: (val: boolean) =&gt; void;
  setVibration: (val: boolean) =&gt; void;
  setNotifications: (val: boolean) =&gt; void;
  setAutoSave: (val: boolean) =&gt; void;
  setLanguage: (val: 'russian' | 'english') =&gt; void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) =&gt; ({
      soundEnabled: true,
      vibration: true,
      notifications: true,
      autoSave: true,
      language: 'russian',
      setSoundEnabled: (val) =&gt; set({ soundEnabled: val }),
      setVibration: (val) =&gt; set({ vibration: val }),
      setNotifications: (val) =&gt; set({ notifications: val }),
      setAutoSave: (val) =&gt; set({ autoSave: val }),
      setLanguage: (val) =&gt; set({ language: val }),
    }),
    {
      name: 'taro-settings',
      getStorage: () =&gt; AsyncStorage,
      partialize: (state) =&gt; ({
        soundEnabled: state.soundEnabled,
        vibration: state.vibration,
        notifications: state.notifications,
        autoSave: state.autoSave,
        language: state.language,
      }),
    }
  )
);