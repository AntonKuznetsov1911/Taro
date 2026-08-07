// Register Service Worker for PWA functionality
(function() {
  const BASE_PATH = '/Taro';

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` })
        .then(function(registration) {
          console.log('[PWA] Service Worker registered successfully:', registration.scope);

          // Check for updates periodically
          registration.update();
          setInterval(() => registration.update(), 60 * 60 * 1000); // Check every hour

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version available');
              }
            });
          });
        })
        .catch(function(error) {
          console.warn('[PWA] Service Worker registration failed:', error);
        });
    });
  }

  // Detect if app can be installed
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] Install prompt available');
    e.preventDefault();
    deferredPrompt = e;

    // Dispatch custom event for React components to listen
    window.dispatchEvent(new CustomEvent('pwa-installable', { detail: { prompt: e } }));
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });

  // Export for use in React components
  window.installPWA = async function() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User response:', outcome);
      deferredPrompt = null;
      return outcome;
    }
    return null;
  };

  // Check if already in standalone mode
  window.isPWAInstalled = function() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  };

  console.log('[PWA] PWA registration script loaded');
  console.log('[PWA] Already installed:', window.isPWAInstalled());
})();
