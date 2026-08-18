/**
 * Abit — qBittorrent WebUI Service Worker
 * Provides offline shell caching and enables native PWA installation across browsers.
 */

const CACHE_NAME = 'abit-pwa-v2.0.1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './favicon.ico',
    './favicon-16x16.png',
    './favicon-32x32.png',
    './apple-touch-icon.png',
    './apple-touch-icon-precomposed.png',
    './icon-192.png',
    './icon-512.png',
    './assets/icon.svg'
];

// Install: Cache core static assets & activate immediately
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS).catch(err => {
                console.warn('[Abit SW] Pre-caching partial assets:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate: Clean up outdated caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Pass dynamic qBittorrent API requests directly to network; cache static assets
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // 1. NEVER cache qBittorrent backend API calls, login or action requests
    if (url.pathname.startsWith('/api/') || request.method !== 'GET') {
        return;
    }

    // 2. Static assets & Shell: Network first with Cache fallback
    event.respondWith(
        fetch(request)
            .then(networkResponse => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    if (request.headers.get('accept')?.includes('text/html')) {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});
