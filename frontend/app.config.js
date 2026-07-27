// GitHub Pages base path - set to repo name for GitHub Pages deployment
const GITHUB_PAGES_BASE = process.env.GITHUB_PAGES === 'true' ? '/Taro' : '';

export default {
  expo: {
    name: 'Taro - Mystic Tarot App',
    slug: 'Taro',
    version: '1.2.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'taro',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    extra: {
      // For GitHub Pages, we use offline mode (no backend needed)
      EXPO_PUBLIC_BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || '',
      EXPO_PUBLIC_OFFLINE_MODE: process.env.GITHUB_PAGES === 'true' ? 'true' : 'false',
      GITHUB_PAGES: process.env.GITHUB_PAGES || 'false',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.antonkuznetsov.taro',
    },
    android: {
      package: 'com.antonkuznetsov.taro',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#000',
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
      // Base path for GitHub Pages
      basePath: GITHUB_PAGES_BASE,
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#000',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      baseUrl: GITHUB_PAGES_BASE,
    },
  },
};
