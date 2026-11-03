// GitHub Pages base path - set to repo name for GitHub Pages deployment
const GITHUB_PAGES_BASE = process.env.GITHUB_PAGES === 'true' ? '/Taro' : '';

export default {
  expo: {
    name: 'Таро',
    slug: 'Taro',
    version: '1.4.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'taro',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    updates: { enabled: false },
    extra: {
      // For GitHub Pages, we use offline mode (no backend needed)
      EXPO_PUBLIC_BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || '',
      EXPO_PUBLIC_OFFLINE_MODE: 'true',
      GITHUB_PAGES: process.env.GITHUB_PAGES || 'false',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.antonkuznetsov.taro',
    },
    android: {
      package: 'com.antonkuznetsov.taro',
      versionCode: 4,
      permissions: ['android.permission.CAMERA', 'android.permission.VIBRATE'],
      blockedPermissions: ['android.permission.RECORD_AUDIO', 'android.permission.READ_MEDIA_IMAGES', 'android.permission.READ_MEDIA_VIDEO', 'android.permission.READ_MEDIA_AUDIO', 'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.SYSTEM_ALERT_WINDOW'],
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#10091f',
      },
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: 'resize',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
      // Base path for GitHub Pages
      basePath: GITHUB_PAGES_BASE,
    },
    plugins: [
      './plugins/with-taro-android',
      'expo-router',
      ['expo-camera', { cameraPermission: 'Камера нужна, чтобы сфотографировать ладонь. Снимки обрабатываются на устройстве.', recordAudioAndroid: false, barcodeScannerEnabled: false }],
      ['expo-notifications', { color: '#BB6BD9' }],
      ['expo-build-properties', { android: { minSdkVersion: 24, compileSdkVersion: 36, targetSdkVersion: 36, buildToolsVersion: '36.0.0', useLegacyPackaging: true, enableMinifyInReleaseBuilds: true, enableShrinkResourcesInReleaseBuilds: true, extraProguardRules: '-keep class com.google.mediapipe.** { *; }\n-keep class ai.onnxruntime.** { *; }\n-keep class com.google.protobuf.** { *; }\n-keep class expo.modules.notifications.** { *; }\n-keep class com.antonkuznetsov.taro.vision.** { *; }\n-keep class com.antonkuznetsov.taro.MainApplication { *; }\n-keep interface com.facebook.react.ReactHost { *; }\n# Optional MediaPipe profiling/template APIs; HandLandmarker does not use them.\n-dontwarn com.google.mediapipe.proto.CalculatorProfileProto$CalculatorProfile\n-dontwarn com.google.mediapipe.proto.GraphTemplateProto$CalculatorGraphTemplate' } }],
      [
        'expo-splash-screen',
        {
          image: './assets/images/icon.png',
          imageWidth: 160,
          resizeMode: 'contain',
          backgroundColor: '#000011',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      baseUrl: GITHUB_PAGES_BASE,
    },
  },
};
