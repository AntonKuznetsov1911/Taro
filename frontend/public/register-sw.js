// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/Taro/sw.js')
      .then(function(registration) {
        console.log('🔮 Service Worker registered:', registration.scope);
      })
      .catch(function(error) {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}
