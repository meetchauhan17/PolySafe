/**
 * PolySafe PWA Service Worker — v1.0.0
 * ──────────────────────────────────────
 * Precaches app shell, fonts, and icons.
 * Implements Stale-While-Revalidate runtime caching for GET API endpoints.
 */

const CACHE_NAME = 'polysafe-shell-v1';
const API_CACHE_NAME = 'polysafe-api-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// Install Event: precache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching app shell assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache non-critical failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: prune old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
            console.log('[SW] Deleting stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: handle requests
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Handle SPA navigation requests: Network First, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Handle API GET requests: Stale-While-Revalidate
  const isApiRequest = url.pathname.startsWith('/patient') ||
    url.pathname.startsWith('/medicine') ||
    url.pathname.startsWith('/analytics') ||
    url.pathname.startsWith('/connection') ||
    url.pathname.startsWith('/caregiver') ||
    url.pathname.startsWith('/interaction-flag');

  if (isApiRequest) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Static Assets / Fonts / Icons: Cache First with Network Fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      });
    }).catch(() => {
      if (request.destination === 'image') {
        return caches.match('/favicon.svg');
      }
    })
  );
});
