import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage utility for persistent data storage
 * Uses AsyncStorage for offline data persistence
 */

// Storage keys
export const STORAGE_KEYS = {
  READINGS: '@taro_readings',
  FAVORITES: '@taro_favorites',
  NOTES: '@taro_notes',
  TAGS: '@taro_tags',
  DAILY_CARD: '@taro_daily_card',
  USER_PREFERENCES: '@taro_preferences',
  CACHE_TIMESTAMP: '@taro_cache_timestamp',
  APP_VERSION: '@taro_app_version',
  ONBOARDING_COMPLETED: '@taro_onboarding',
};

// Generic storage operations
export const storage = {
  /**
   * Save data to AsyncStorage
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
      throw error;
    }
  },

  /**
   * Get data from AsyncStorage
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return null;
    }
  },

  /**
   * Remove item from AsyncStorage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      throw error;
    }
  },

  /**
   * Clear all AsyncStorage data
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },

  /**
   * Get all keys in AsyncStorage
   */
  async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  },
};

// Specialized storage for readings
export const readingsStorage = {
  async saveReadings(readings: any[]): Promise<void> {
    await storage.setItem(STORAGE_KEYS.READINGS, readings);
    await storage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, Date.now());
  },

  async getReadings(): Promise<any[]> {
    return (await storage.getItem(STORAGE_KEYS.READINGS)) || [];
  },

  async addReading(reading: any): Promise<void> {
    const readings = await this.getReadings();
    readings.unshift(reading); // Add to beginning
    await this.saveReadings(readings);
  },

  async deleteReading(readingId: string): Promise<void> {
    const readings = await this.getReadings();
    const filtered = readings.filter((r) => r.id !== readingId);
    await this.saveReadings(filtered);
  },

  async isCacheValid(maxAgeMs: number = 3600000): Promise<boolean> {
    // Default: 1 hour
    const timestamp = await storage.getItem<number>(STORAGE_KEYS.CACHE_TIMESTAMP);
    if (!timestamp) return false;
    return Date.now() - timestamp < maxAgeMs;
  },
};

// Favorites storage
export const favoritesStorage = {
  async saveFavorites(favorites: Set<string>): Promise<void> {
    await storage.setItem(STORAGE_KEYS.FAVORITES, Array.from(favorites));
  },

  async getFavorites(): Promise<Set<string>> {
    const favArray = await storage.getItem<string[]>(STORAGE_KEYS.FAVORITES);
    return new Set(favArray || []);
  },

  async toggleFavorite(readingId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    if (favorites.has(readingId)) {
      favorites.delete(readingId);
      await this.saveFavorites(favorites);
      return false;
    } else {
      favorites.add(readingId);
      await this.saveFavorites(favorites);
      return true;
    }
  },
};

// Notes storage
export const notesStorage = {
  async saveNotes(notes: { [key: string]: string }): Promise<void> {
    await storage.setItem(STORAGE_KEYS.NOTES, notes);
  },

  async getNotes(): Promise<{ [key: string]: string }> {
    return (await storage.getItem(STORAGE_KEYS.NOTES)) || {};
  },

  async saveNote(readingId: string, note: string): Promise<void> {
    const notes = await this.getNotes();
    notes[readingId] = note;
    await this.saveNotes(notes);
  },

  async deleteNote(readingId: string): Promise<void> {
    const notes = await this.getNotes();
    delete notes[readingId];
    await this.saveNotes(notes);
  },
};

// Tags storage
export const tagsStorage = {
  async saveTags(tags: { [key: string]: string[] }): Promise<void> {
    await storage.setItem(STORAGE_KEYS.TAGS, tags);
  },

  async getTags(): Promise<{ [key: string]: string[] }> {
    return (await storage.getItem(STORAGE_KEYS.TAGS)) || {};
  },

  async addTag(readingId: string, tag: string): Promise<void> {
    const tags = await this.getTags();
    if (!tags[readingId]) {
      tags[readingId] = [];
    }
    if (!tags[readingId].includes(tag)) {
      tags[readingId].push(tag);
      await this.saveTags(tags);
    }
  },

  async removeTag(readingId: string, tag: string): Promise<void> {
    const tags = await this.getTags();
    if (tags[readingId]) {
      tags[readingId] = tags[readingId].filter((t) => t !== tag);
      await this.saveTags(tags);
    }
  },
};

// Daily card storage
export const dailyCardStorage = {
  async saveDailyCard(card: any, date: string): Promise<void> {
    await storage.setItem(STORAGE_KEYS.DAILY_CARD, { card, date });
  },

  async getDailyCard(): Promise<{ card: any; date: string } | null> {
    return await storage.getItem(STORAGE_KEYS.DAILY_CARD);
  },

  async clearDailyCard(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.DAILY_CARD);
  },

  async isDailyCardValid(): Promise<boolean> {
    const data = await this.getDailyCard();
    if (!data) return false;
    const today = new Date().toDateString();
    return data.date === today;
  },
};

// User preferences storage
export const preferencesStorage = {
  async savePreferences(preferences: any): Promise<void> {
    await storage.setItem(STORAGE_KEYS.USER_PREFERENCES, preferences);
  },

  async getPreferences(): Promise<any> {
    return (
      (await storage.getItem(STORAGE_KEYS.USER_PREFERENCES)) || {
        soundEnabled: true,
        vibrationEnabled: true,
        notificationsEnabled: true,
        theme: 'dark',
      }
    );
  },
};

// App version tracking
export const versionStorage = {
  async saveVersion(version: string): Promise<void> {
    await storage.setItem(STORAGE_KEYS.APP_VERSION, version);
  },

  async getVersion(): Promise<string | null> {
    return await storage.getItem(STORAGE_KEYS.APP_VERSION);
  },

  async isFirstLaunch(): Promise<boolean> {
    const version = await this.getVersion();
    return version === null;
  },

  async isVersionUpdated(currentVersion: string): Promise<boolean> {
    const savedVersion = await this.getVersion();
    return savedVersion !== null && savedVersion !== currentVersion;
  },
};

// Onboarding storage
export const onboardingStorage = {
  async markOnboardingComplete(): Promise<void> {
    await storage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
  },

  async isOnboardingComplete(): Promise<boolean> {
    return (await storage.getItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED)) || false;
  },

  async resetOnboarding(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
  },
};
