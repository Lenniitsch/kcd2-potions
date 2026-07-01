var CACHE_NAME = 'kcd2-v12';

var PRECACHE_URLS = [
    './',
    'css/tailwind.css',
    'css/style.css',
    'js/main.js',
    'js/state.js',
    'js/dom.js',
    'js/i18n.js',
    'js/recipes.js',
    'js/ui-header.js',
    'js/ui-tabs.js',
    'js/ui-filter.js',
    'js/ui-recipe-card.js',
    'js/ui-timer.js',
    'js/ui-recipe-list.js',
    'js/ui-maps.js',
    'js/ui-settings.js',
    'data/recipes.json',
    'data/locales/de.json',
    'data/locales/it.json',
    'data/locales/en.json',
    'manifest.json',
    'pwa-registration.js',
    'js/vendor/zoomist.umd.js',
    'css/vendor/zoomist.css',
    'assets/fonts/oldlondon-webfont.woff2',
    'assets/fonts/oldlondon-webfont.woff',
    'assets/fonts/oldlondon-webfont.ttf',
    'assets/img/noise.png',
    'assets/img/maps/map-kuttenberg-districts.webp',
    'assets/img/maps/map-kuttenberg-underground.webp',
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return Promise.all(
                PRECACHE_URLS.map(function (url) {
                    return cache.add(url).catch(function (err) {
                        console.warn('SW: pre-cache failed for', url, err);
                    });
                })
            );
        }).then(function () {
            if (!self.clients || self.clients.length === 0) {
                self.skipWaiting();
            }
        })
    );
});

self.addEventListener('message', function (event) {
    var action =
        (event.data && event.data.action) ||
        (event.data && event.data.type) ||
        event.data;
    if (action === 'skipWaiting' || action === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (key) {
                    return key !== CACHE_NAME;
                }).map(function (key) {
                    return caches.delete(key);
                })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function (event) {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).then(function (resp) {
                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, resp.clone());
                });
                return resp;
            }).catch(function () {
                return caches.match('./');
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function (cached) {
            var networkFetch = fetch(event.request).then(function (resp) {
                if (resp && resp.ok) {
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, resp.clone());
                    });
                }
                return resp;
            });
            return cached || networkFetch;
        })
    );
});
