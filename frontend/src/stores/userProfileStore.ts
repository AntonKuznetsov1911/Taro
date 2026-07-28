/**
 * Хранилище профиля пользователя
 * Содержит данные для персонализированных астрологических прогнозов
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getZodiacSign, ZodiacSign, ZODIAC_SIGNS } from '../utils/astrology';

const STORAGE_KEY = '@taro_user_profile';

export interface UserProfile {
  // Основные данные
  name: string;
  gender: 'male' | 'female' | 'other';

  // Дата и время рождения
  birthDate: string; // ISO date string
  birthTime?: string; // HH:MM format, опционально

  // Место рождения
  birthPlace?: string;
  birthLatitude?: number;
  birthLongitude?: number;

  // Вычисляемые данные (сохраняем для быстрого доступа)
  sunSign: ZodiacSign;

  // Мета
  createdAt: string;
  updatedAt: string;
  isComplete: boolean;
}

export interface PartialUserProfile {
  name?: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  birthLatitude?: number;
  birthLongitude?: number;
}

class UserProfileStore {
  private profile: UserProfile | null = null;
  private listeners: Set<() => void> = new Set();

  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Восстанавливаем ZodiacSign объект
        if (parsed.sunSign && typeof parsed.sunSign === 'object') {
          const signIndex = ZODIAC_SIGNS.findIndex(s => s.name === parsed.sunSign.name);
          if (signIndex >= 0) {
            parsed.sunSign = ZODIAC_SIGNS[signIndex];
          }
        }
        this.profile = parsed;
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    }
  }

  getProfile(): UserProfile | null {
    return this.profile;
  }

  hasProfile(): boolean {
    return this.profile !== null && this.profile.isComplete;
  }

  async saveProfile(data: PartialUserProfile): Promise<UserProfile> {
    const now = new Date().toISOString();

    // Вычисляем знак зодиака
    let sunSign: ZodiacSign = ZODIAC_SIGNS[0];
    if (data.birthDate) {
      sunSign = getZodiacSign(new Date(data.birthDate));
    }

    const isComplete = !!(data.name && data.gender && data.birthDate);

    const newProfile: UserProfile = {
      name: data.name || this.profile?.name || '',
      gender: data.gender || this.profile?.gender || 'other',
      birthDate: data.birthDate || this.profile?.birthDate || '',
      birthTime: data.birthTime || this.profile?.birthTime,
      birthPlace: data.birthPlace || this.profile?.birthPlace,
      birthLatitude: data.birthLatitude || this.profile?.birthLatitude,
      birthLongitude: data.birthLongitude || this.profile?.birthLongitude,
      sunSign,
      createdAt: this.profile?.createdAt || now,
      updatedAt: now,
      isComplete,
    };

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
      this.profile = newProfile;
      this.notifyListeners();
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      throw error;
    }

    return newProfile;
  }

  async clearProfile(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      this.profile = null;
      this.notifyListeners();
    } catch (error) {
      console.error('Ошибка удаления профиля:', error);
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Получить возраст пользователя
  getAge(): number | null {
    if (!this.profile?.birthDate) return null;
    const birth = new Date(this.profile.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  // Получить персонализированное обращение
  getGreeting(): string {
    if (!this.profile?.name) return 'Дорогой искатель';

    const hour = new Date().getHours();
    let timeGreeting = '';

    if (hour >= 5 && hour < 12) {
      timeGreeting = 'Доброе утро';
    } else if (hour >= 12 && hour < 17) {
      timeGreeting = 'Добрый день';
    } else if (hour >= 17 && hour < 22) {
      timeGreeting = 'Добрый вечер';
    } else {
      timeGreeting = 'Доброй ночи';
    }

    return `${timeGreeting}, ${this.profile.name}`;
  }

  // Проверить, день рождения ли сегодня
  isBirthday(): boolean {
    if (!this.profile?.birthDate) return false;
    const birth = new Date(this.profile.birthDate);
    const today = new Date();
    return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate();
  }

  // Получить дни до дня рождения
  getDaysToBirthday(): number | null {
    if (!this.profile?.birthDate) return null;
    const birth = new Date(this.profile.birthDate);
    const today = new Date();

    const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = nextBirthday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export const userProfileStore = new UserProfileStore();
