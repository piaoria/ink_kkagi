const CACHE_VERSION = 'ink-kkagi-v2';
const APP_SHELL = [
  '/ink_kkagi/manifest.webmanifest',
  '/ink_kkagi/icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_VERSION)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('/ink_kkagi/', responseClone));
          return response;
        })
        .catch(() => caches.match('/ink_kkagi/')),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          const shouldCache =
            response.ok &&
            new URL(event.request.url).origin === self.location.origin;

          if (shouldCache) {
            const responseClone = response.clone();
            caches
              .open(CACHE_VERSION)
              .then((cache) => cache.put(event.request, responseClone));
          }

          return response;
        })
        .catch(() => caches.match('/ink_kkagi/'));
    }),
  );
});
