/**
 * Abit — qBittorrent WebUI Service Worker
 * Provides instant shell caching, Stale-While-Revalidate loading and enables PWA installation.
 */

const CACHE_NAME = 'abit-pwa-v2.0.3';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './favicon.ico',
    './favicon-16x16.png',
    './favicon-32x32.png',
    './apple-touch-icon.png',
    './icon-192.png',
    './icon-512.png',
    './icon.svg'
];

// Install: Pre-cache core shell assets with individual error resilience
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return Promise.allSettled(
                STATIC_ASSETS.map(url => cache.add(url).catch(err => {
                    console.debug('[Abit SW] Pre-caching asset skipped:', url);
                }))
            );
        }).then(() => self.skipWaiting())
    );
});

// Activate: Clean up outdated caches immediately
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Pass dynamic qBittorrent API requests directly to network; use Stale-While-Revalidate for static assets
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // 1. NEVER intercept or cache qBittorrent backend API calls, login or POST/PUT/DELETE requests
    if (url.pathname.includes('/api/') || request.method !== 'GET') {
        return;
    }

    // 2. Static Assets: Stale-While-Revalidate (Instant response from cache + background refresh)
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            const fetchPromise = fetch(request)
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
                    if (!cachedResponse && request.headers.get('accept')?.includes('text/html')) {
                        return caches.match('./index.html') || caches.match('./');
                    }
                });

            // Return cached response instantly (0ms) if available, otherwise wait for network
            return cachedResponse || fetchPromise;
        })
    );
});

// Handle notification clicks: focus or open Abit PWA window
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('./');
            }
        })
    );
});
