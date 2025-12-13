import { checkNetworkConnection } from '../hooks/useNetworkStatus';

const EXPO_PUBLIC_BACKEND_URL = 'https://taro-production-619b.up.railway.app';

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

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = exponentialBackoff ? retryDelay * Math.pow(2, attempt) : retryDelay;

      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);

      // Wait before retrying
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
  // Check network connectivity first
  const isConnected = await checkNetworkConnection();
  if (!isConnected) {
    throw new NetworkError('Нет подключения к интернету');
  }

  // Perform fetch with retry
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
        // Network error
        throw new NetworkError('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  }, retryOptions);
}

/**
 * API client with built-in retry and error handling
 */
export const api = {
  /**
   * GET request with retry
   */
  async get<T>(endpoint: string, retryOptions?: RetryOptions): Promise<T> {
    const response = await fetchWithRetry(
      `${EXPO_PUBLIC_BACKEND_URL}${endpoint}`,
      { method: 'GET' },
      retryOptions
    );
    return response.json();
  },

  /**
   * POST request with retry
   */
  async post<T>(
    endpoint: string,
    data: any,
    retryOptions?: RetryOptions
  ): Promise<T> {
    const response = await fetchWithRetry(
      `${EXPO_PUBLIC_BACKEND_URL}${endpoint}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      retryOptions
    );
    return response.json();
  },

  /**
   * PUT request with retry
   */
  async put<T>(
    endpoint: string,
    data: any,
    retryOptions?: RetryOptions
  ): Promise<T> {
    const response = await fetchWithRetry(
      `${EXPO_PUBLIC_BACKEND_URL}${endpoint}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      retryOptions
    );
    return response.json();
  },

  /**
   * DELETE request with retry
   */
  async delete<T>(endpoint: string, retryOptions?: RetryOptions): Promise<T> {
    const response = await fetchWithRetry(
      `${EXPO_PUBLIC_BACKEND_URL}${endpoint}`,
      { method: 'DELETE' },
      retryOptions
    );
    return response.json();
  },
};

/**
 * Cached fetch - fetches data and caches it
 */
const cache = new Map<string, { data: any; timestamp: number }>();

export async function cachedFetch<T>(
  url: string,
  maxAgeMs: number = 300000, // 5 minutes default
  retryOptions?: RetryOptions
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(url);

  // Return cached data if valid
  if (cached && now - cached.timestamp < maxAgeMs) {
    return cached.data;
  }

  // Fetch new data
  const response = await fetchWithRetry(url, {}, retryOptions);
  const data = await response.json();

  // Update cache
  cache.set(url, { data, timestamp: now });

  return data;
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Remove specific cache entry
 */
export function removeCacheEntry(url: string): void {
  cache.delete(url);
}
