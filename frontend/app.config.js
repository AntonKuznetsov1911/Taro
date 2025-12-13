export default {
  expo: {
    name: 'Taro - Mystic Tarot App',
    slug: 'Taro',
    version: '1.1.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'taro',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    extra: {
      EXPO_PUBLIC_BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || 'https://taro-production-619b.up.railway.app',
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
    },
  },
};
