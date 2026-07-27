/**
 * Application configuration
 * Automatically detects GitHub Pages and uses offline mode
 */

// Check if running on GitHub Pages
const IS_GITHUB_PAGES = typeof window !== 'undefined' &&
  (window.location.hostname.includes('github.io') ||
   process.env.EXPO_PUBLIC_OFFLINE_MODE === 'true' ||
   process.env.GITHUB_PAGES === 'true');

export const CONFIG = {
  // Backend URL - empty for GitHub Pages (offline mode)
  BACKEND_URL: IS_GITHUB_PAGES ? '' : (process.env.EXPO_PUBLIC_BACKEND_URL || ''),
  API_URL: IS_GITHUB_PAGES ? '' : (process.env.EXPO_PUBLIC_BACKEND_URL ? `${process.env.EXPO_PUBLIC_BACKEND_URL}/api` : ''),

  // Feature flags
  OFFLINE_MODE: IS_GITHUB_PAGES,
  IS_GITHUB_PAGES,

  // App metadata
  APP_NAME: 'Taro - Mystic Tarot',
  APP_VERSION: '1.2.0',
};

export default CONFIG;
