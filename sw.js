const CACHE_NAME = 'kcd2-tools-v1';
const BASE = './'; // relative to sw.js location

const CACHE_URLS = [
  BASE, // './' -> index
  './index.html',
  './css/style.css',
  // deine JS-Dateien (aus index.html)
  './js/config.js',
  './js/language.js',
  './js/maps.js',
  './js/tabs.js',
  './js/recipes.js',
  './js/app.js',
  './pwa-registration.js',
  './manifest.json',
  // wichtige assets
  './assets/img/icons/icon-192x192.png',
  './assets/img/icons/icon-512x512.png',
  './assets/img/maps/map-kuttenberg-districts.png',
  './assets/img/maps/map-kuttenberg-underground.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // network-first for navigation, cache-first for others (simple strategy)
  if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(event.request).then(resp => {
        // update cache in background
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp.clone()));
        return resp;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(resp => {
        // optionally cache fetched items (omit large binaries if needed)
        return resp;
      }).catch(() => cached);
    })
  );
});
