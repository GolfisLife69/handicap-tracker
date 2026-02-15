// Golf HCP Service Worker - Offline Support
const CACHE_NAME = 'golf-hcp-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Installation: Cache alle Assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Aktivierung: Alte Caches löschen
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch: Cache-First, Netzwerk als Fallback
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) {
                    // Im Hintergrund aktualisieren (stale-while-revalidate)
                    fetch(event.request)
                        .then(response => {
                            if (response && response.status === 200) {
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(event.request, response));
                            }
                        })
                        .catch(() => {}); // Offline? Kein Problem.
                    return cached;
                }
                return fetch(event.request);
            })
    );
});
