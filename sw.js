// sw.js — Service Worker (network-first for guest data, cache-first for assets)
const CACHE = 'wedding-seating-v3';
const ALWAYS_FRESH = ['guests.js']; // always fetch latest guest list from network

self.addEventListener('install', e => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  // Clear ALL old caches on activate
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Always fetch guests.js fresh from network — never serve from cache
  if (ALWAYS_FRESH.some(f => url.includes(f))) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(() =>
        caches.match(e.request)
      )
    );
    return;
  }

  // Everything else: network first, fall back to cache
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.status === 200 && e.request.method === 'GET') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
