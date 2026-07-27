import { checkNetworkConnection } from '../hooks/useNetworkStatus';
import {
  generateOfflineTarotReading,
  generateOfflineCompatibility,
  generateOfflineHoroscope,
  getOfflineTarotDeck,
  isBackendAvailable,
} from './offlineApi';

// Check if running on GitHub Pages (no backend available)
const IS_GITHUB_PAGES = typeof window !== 'undefined' &&
  (window.location.hostname.includes('github.io') ||
   process.env.EXPO_PUBLIC_OFFLINE_MODE === 'true');

// Backend URL - empty for GitHub Pages
const EXPO_PUBLIC_BACKEND_URL = IS_GITHUB_PAGES ? '' : 'https://taro-production-619b.up.railway.app';

// Force offline mode on GitHub Pages
let forceOfflineMode = IS_GITHUB_PAGES;

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class APIError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
}

/**
 * Check if we should use offline mode
 */
export function isOfflineMode(): boolean {
  return forceOfflineMode || IS_GITHUB_PAGES || !EXPO_PUBLIC_BACKEND_URL;
}

/**
 * Set offline mode manually
 */
export function setOfflineMode(offline: boolean): void {
  forceOfflineMode = offline;
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, exponentialBackoff = true } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      const delay = exponentialBackoff ? retryDelay * Math.pow(2, attempt) : retryDelay;
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Enhanced fetch with retry logic and error handling
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions?: RetryOptions
): Promise<Response> {
  // If in offline mode, throw to trigger offline fallback
  if (isOfflineMode()) {
    throw new NetworkError('Offline mode - using local data');
  }

  const isConnected = await checkNetworkConnection();
  if (!isConnected) {
    throw new NetworkError('No internet connection');
  }

  return retryWithBackoff(async () => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new APIError(
          `HTTP error! status: ${response.status}`,
          response.status
        );
      }

      return response;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new NetworkError('Network error');
      }
      throw error;
    }
  }, retryOptions);
}

/**
 * Smart API client that automatically falls back to offline mode
 */
export const api = {
  /**
   * GET request with automatic offline fallback
   */
  async get<T>(endpoint: string, retryOptions?: RetryOptions): Promise<T> {
    if (isOfflineMode()) {
      return handleOfflineRequest(endpoint, 'GET') as T;
    }

    try {
      const response = await fetchWithRetry(
        `${EXPO_PUBLIC_BACKEND_URL}${endpoint}`,
        { method: 'GET' },
        retryOptions
      );
      return response.json();
    } catch (error) {
      console.log('API GET failed, using offline fallback:', error);
      return handleOfflineRequest(endpoint, 'GET') as T;
    }
  },

  /**
   * POST request with automatic offline fallback
   */
  async post<T>(
    endpoint: string,
    data: any,
    retryOptions?: RetryOptions
  ): Promise<T> {
    if (isOfflineMode()) {
      return handleOfflineRequest(endpoint, 'POST', data) as T;
    }

    try {
      const response = await fetchWithRetry(
        `${EXPO_PUBLIC_BACKEND_URL}${endpoint}`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        retryOptions
      );
      return response.json();
    } catch (error) {
      console.log('API POST failed, using offline fallback:', error);
      return handleOfflineRequest(endpoint, 'POST', data) as T;
    }
  },

  /**
   * PUT request with automatic offline fallback
   */
  async put<T>(
    endpoint: string,
    data: any,
    retryOptions?: RetryOptions
  ): Promise<T> {
    if (isOfflineMode()) {
      return handleOfflineRequest(endpoint, 'PUT', data) as T;
    }

    try {
      const response = await fetchWithRetry(
        `${EXPO_PUBLIC_BACKEND_URL}${endpoint}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
        retryOptions
      );
      return response.json();
    } catch (error) {
      console.log('API PUT failed, using offline fallback:', error);
      return handleOfflineRequest(endpoint, 'PUT', data) as T;
    }
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, retryOptions?: RetryOptions): Promise<T> {
    if (isOfflineMode()) {
      return { success: true } as T;
    }

    const response = await fetchWithRetry(
      `${EXPO_PUBLIC_BACKEND_URL}${endpoint}`,
      { method: 'DELETE' },
      retryOptions
    );
    return response.json();
  },
};

/**
 * Handle offline requests using local data
 */
async function handleOfflineRequest(endpoint: string, method: string, data?: any): Promise<any> {
  // Health check
  if (endpoint.includes('/health')) {
    return { status: 'offline', mode: 'local' };
  }

  // Tarot deck
  if (endpoint.includes('/api/deck') || endpoint.includes('/deck')) {
    const deck = await getOfflineTarotDeck();
    return { cards: deck, total: deck.length };
  }

  // Tarot reading
  if (endpoint.includes('/api/reading') || endpoint.includes('/reading')) {
    const cardCount = data?.spread_type === 'celtic_cross' ? 10 :
                      data?.spread_type === 'three_cards' ? 3 : 1;
    const result = await generateOfflineTarotReading(data?.question, cardCount);
    return {
      id: Date.now().toString(),
      cards: result.cards,
      interpretation: result.interpretation,
      question: result.question,
      created_at: result.timestamp,
    };
  }

  // Compatibility
  if (endpoint.includes('/api/compatibility') || endpoint.includes('/compatibility')) {
    const analysis = await generateOfflineCompatibility(data?.name1 || 'Person 1', data?.name2 || 'Person 2');
    return {
      id: Date.now().toString(),
      name1: data?.name1,
      name2: data?.name2,
      compatibility_score: Math.floor(Math.random() * 30) + 70,
      analysis,
    };
  }

  // Horoscope
  if (endpoint.includes('/api/horoscope') || endpoint.includes('/horoscope')) {
    const horoscope = await generateOfflineHoroscope(data?.zodiac_sign || 'Unknown');
    return {
      id: Date.now().toString(),
      horoscope_text: horoscope,
      zodiac_sign: data?.zodiac_sign,
      date: new Date().toISOString(),
      mood_rating: Math.floor(Math.random() * 3) + 7,
      lucky_numbers: [7, 12, 21, 33, 42],
      lucky_color: 'purple',
    };
  }

  // Categories
  if (endpoint.includes('/api/categories') || endpoint.includes('/categories')) {
    return {
      categories: [
        { id: 'love', name: 'Love', icon: '❤️', color: '#FF6B9D' },
        { id: 'career', name: 'Career', icon: '💼', color: '#4ECDC4' },
        { id: 'finance', name: 'Finance', icon: '💰', color: '#45B7D1' },
        { id: 'general', name: 'General', icon: '🔮', color: '#9B59B6' },
      ],
    };
  }

  // Spreads
  if (endpoint.includes('/api/spreads') || endpoint.includes('/spreads')) {
    return {
      spreads: {
        one_card: { name: 'One Card', cards_count: 1, positions: ['Answer'] },
        three_cards: { name: 'Three Cards', cards_count: 3, positions: ['Past', 'Present', 'Future'] },
        celtic_cross: { name: 'Celtic Cross', cards_count: 10, positions: ['Situation', 'Challenge', 'Past', 'Future', 'Above', 'Below', 'Advice', 'External', 'Hopes', 'Outcome'] },
      },
    };
  }

  // Default response
  return { status: 'ok', offline: true };
}

/**
 * Cached fetch
 */
const cache = new Map<string, { data: any; timestamp: number }>();

export async function cachedFetch<T>(
  url: string,
  maxAgeMs: number = 300000,
  retryOptions?: RetryOptions
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(url);

  if (cached && now - cached.timestamp < maxAgeMs) {
    return cached.data;
  }

  try {
    const response = await fetchWithRetry(url, {}, retryOptions);
    const data = await response.json();
    cache.set(url, { data, timestamp: now });
    return data;
  } catch (error) {
    // Return cached data if available, even if expired
    if (cached) {
      return cached.data;
    }
    throw error;
  }
}

export function clearCache(): void {
  cache.clear();
}

export function removeCacheEntry(url: string): void {
  cache.delete(url);
}

/**
 * Initialize API - check backend availability
 */
export async function initializeApi(): Promise<void> {
  if (IS_GITHUB_PAGES) {
    console.log('Running on GitHub Pages - using offline mode');
    forceOfflineMode = true;
    return;
  }

  try {
    const available = await isBackendAvailable(EXPO_PUBLIC_BACKEND_URL);
    if (!available) {
      console.log('Backend not available - switching to offline mode');
      forceOfflineMode = true;
    }
  } catch (error) {
    console.log('Backend check failed - using offline mode');
    forceOfflineMode = true;
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  initializeApi();
}
