#!/usr/bin/env node

/**
 * Post-build script to inject PWA meta tags and service worker registration
 * into the Expo web build output
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

// PWA meta tags and links to inject
const pwaHead = `
    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#9B59B6">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Таро">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="application-name" content="Таро">
    <meta name="msapplication-TileColor" content="#9B59B6">
    <meta name="msapplication-TileImage" content="/icon-192.png">

    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json">
    <link rel="apple-touch-icon" href="/icon-192.png">
    <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png">
    <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png">

    <!-- Splash screens for iOS -->
    <link rel="apple-touch-startup-image" href="/icon-512.png">
`;

const pwaScript = `
    <!-- Service Worker Registration -->
    <script src="/register-sw.js"></script>
`;

function injectPWA() {
  console.log('🔮 Injecting PWA configuration...');

  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found in dist folder');
    process.exit(1);
  }

  let html = fs.readFileSync(indexPath, 'utf8');

  // Check if already injected
  if (html.includes('rel="manifest"')) {
    console.log('✅ PWA already configured');
    return;
  }

  // Inject meta tags before </head>
  html = html.replace('</head>', pwaHead + '</head>');

  // Inject service worker script before </body>
  html = html.replace('</body>', pwaScript + '</body>');

  // Update title if empty
  if (html.includes('<title data-rh="true"></title>')) {
    html = html.replace(
      '<title data-rh="true"></title>',
      '<title>Таро - Мистическое Астрологическое Приложение</title>'
    );
  }

  // Add description meta tag if missing
  if (!html.includes('name="description"')) {
    html = html.replace(
      '</head>',
      '    <meta name="description" content="Профессиональное астрологическое приложение с гаданием на картах Таро, персонализированными гороскопами и лунным календарём">\n</head>'
    );
  }

  fs.writeFileSync(indexPath, html);
  console.log('✅ PWA configuration injected successfully');
}

// Copy PWA files to dist
function copyPWAFiles() {
  console.log('📦 Copying PWA files to dist...');

  const publicPath = path.join(__dirname, '..', 'public');
  const filesToCopy = ['manifest.json', 'sw.js', 'register-sw.js', 'icon-192.png', 'icon-512.png'];

  filesToCopy.forEach(file => {
    const src = path.join(publicPath, file);
    const dest = path.join(distPath, file);

    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ ${file}`);
    } else {
      console.warn(`  ⚠ ${file} not found`);
    }
  });

  console.log('✅ PWA files copied');
}

// Main
try {
  copyPWAFiles();
  injectPWA();
  console.log('🎉 PWA build complete!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
