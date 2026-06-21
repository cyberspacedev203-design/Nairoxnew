// Minimal safe service worker. Avoid importing third-party scripts directly.
self.addEventListener('install', (event) => {
    // Activate immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    self.clients.claim();
});

// No-op fetch handler to avoid interfering with app unless explicitly extended
self.addEventListener('fetch', (event) => {
    // Intentionally empty — extend if you need offline caching or background sync.
});
