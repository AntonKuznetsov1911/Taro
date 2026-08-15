const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// // Exclude unnecessary directories from file watching
// config.watchFolders = [__dirname];
// config.resolver.blacklistRE = /(.*)\/(__tests__|android|ios|build|dist|.git|node_modules\/.*\/android|node_modules\/.*\/ios|node_modules\/.*\/windows|node_modules\/.*\/macos)(\/.*)?$/;

// // Alternative: use a more aggressive exclusion pattern
// config.resolver.blacklistRE = /node_modules\/.*\/(android|ios|windows|macos|__tests__|\.git|.*\.android\.js|.*\.ios\.js)$/;

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 2;

// Приложение работает полностью офлайн, а expo-camera при импорте своего веб-сканера
// QR поднимает Worker с importScripts на cdn.jsdelivr.net — независимо от того,
// включён сканер или нет. QR мы не используем, поэтому подменяем модуль заглушкой,
// иначе экран камеры уходит в сеть и падает без интернета.
const path = require('path');

const QR_SCANNER_STUB = path.resolve(__dirname, 'src/stubs/useWebQRScanner.js');
// expo-camera импортирует сканер относительным путём ('./web/useWebQRScanner'),
// поэтому сверяем ещё и модуль, из которого пришёл запрос.
const QR_SCANNER_MODULE = /(^|[\\/])web[\\/]useWebQRScanner(\.[jt]sx?)?$/;

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const fromExpoCamera = (context.originModulePath || '').includes('expo-camera');
  if (fromExpoCamera && QR_SCANNER_MODULE.test(moduleName)) {
    return { type: 'sourceFile', filePath: QR_SCANNER_STUB };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
