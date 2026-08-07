#!/usr/bin/env node

/**
 * Post-build script to inject PWA meta tags and service worker registration
 * into the Expo web build output
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

// Base path for GitHub Pages
const BASE_PATH = '/Taro';

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
    <meta name="msapplication-TileImage" content="${BASE_PATH}/icon-192.png">

    <!-- PWA Manifest -->
    <link rel="manifest" href="${BASE_PATH}/manifest.json">
    <link rel="apple-touch-icon" href="${BASE_PATH}/icon-192.png">
    <link rel="apple-touch-icon" sizes="192x192" href="${BASE_PATH}/icon-192.png">
    <link rel="apple-touch-icon" sizes="512x512" href="${BASE_PATH}/icon-512.png">

    <!-- Splash screens for iOS -->
    <link rel="apple-touch-startup-image" href="${BASE_PATH}/icon-512.png">
`;

const pwaScript = `
    <!-- Service Worker Registration -->
    <script src="${BASE_PATH}/register-sw.js"></script>
`;

function injectPWA() {
  console.log('🔮 Injecting PWA configuration...');

  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found in dist folder');
    process.exit(1);
  }

  let html = fs.readFileSync(indexPath, 'utf8');

  // Remove old PWA tags if present (for re-injection)
  html = html.replace(/<!-- PWA Meta Tags -->[\s\S]*?<!-- Splash screens for iOS -->[\s\S]*?icon-512\.png">/g, '');
  html = html.replace(/<!-- Service Worker Registration -->[\s\S]*?register-sw\.js"><\/script>/g, '');

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
      `    <meta name="description" content="Профессиональное астрологическое приложение с гаданием на картах Таро, персонализированными гороскопами и лунным календарём">\n</head>`
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

// Also inject into all other HTML files
function injectIntoAllHtmlFiles() {
  console.log('📄 Processing all HTML files...');

  const htmlFiles = fs.readdirSync(distPath).filter(f => f.endsWith('.html'));

  htmlFiles.forEach(file => {
    if (file === 'index.html') return; // Already processed

    const filePath = path.join(distPath, file);
    let html = fs.readFileSync(filePath, 'utf8');

    // Only inject if not already present
    if (!html.includes('rel="manifest"')) {
      html = html.replace('</head>', pwaHead + '</head>');
      html = html.replace('</body>', pwaScript + '</body>');
      fs.writeFileSync(filePath, html);
      console.log(`  ✓ ${file}`);
    }
  });

  console.log('✅ All HTML files processed');
}

// Main
try {
  copyPWAFiles();
  injectPWA();
  injectIntoAllHtmlFiles();
  console.log('🎉 PWA build complete!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
