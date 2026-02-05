const CACHE_NAME = 'hcp-tracker-v1';
const urlsToCache = [
  './',
  './index.html'
];

// Installation - Cache anlegen
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Aktivierung - Alte Caches löschen
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Offline-First Strategie
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache gefunden? Zurückgeben
        if (response) {
          return response;
        }

        // Sonst: Netzwerk versuchen
        return fetch(event.request)
          .then((response) => {
            // Ungültige Response?
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Response klonen und cachen
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Offline und nicht im Cache
            return new Response('Offline - Bitte später erneut versuchen', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
