// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('[PWA] Service Worker registered successfully:', registration.scope);

        // Check for updates periodically
        registration.update();
        setInterval(() => registration.update(), 60 * 60 * 1000); // Check every hour
      })
      .catch(function(error) {
        console.warn('[PWA] Service Worker registration failed:', error);
      });
  });
}

// Detect if app can be installed
let deferredPrompt;

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

console.log('[PWA] PWA registration script loaded');
