import React, { createContext, useContext, useEffect, useState } from 'react';
import { getVersionInfo, saveCurrentVersion, VersionInfo } from '../utils/versionCheck';
import { preferencesStorage } from '../utils/storage';
import { haptics } from '../utils/haptics';

interface AppContextValue {
  versionInfo: VersionInfo | null;
  isInitialized: boolean;
  preferences: UserPreferences;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
}

interface UserPreferences {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'dark' | 'light';
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

/**
 * App-wide context provider for global state
 */
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    soundEnabled: true,
    vibrationEnabled: true,
    notificationsEnabled: true,
    theme: 'dark',
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Get version info
      const vInfo = await getVersionInfo();
      setVersionInfo(vInfo);

      // Save current version
      await saveCurrentVersion();

      // Load user preferences
      const storedPreferences = await preferencesStorage.getPreferences();
      setPreferences(storedPreferences);

      // Configure haptics based on preferences
      haptics.setEnabled(storedPreferences.vibrationEnabled);

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsInitialized(true); // Continue anyway
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    await preferencesStorage.savePreferences(updated);

    // Update haptics if vibration setting changed
    if ('vibrationEnabled' in newPreferences) {
      haptics.setEnabled(newPreferences.vibrationEnabled!);
    }
  };

  return (
    <AppContext.Provider
      value={{
        versionInfo,
        isInitialized,
        preferences,
        updatePreferences,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

/**
 * Hook to use app context
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
