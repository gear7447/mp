/* Service Worker — cache hors-ligne
   Incrémenter CACHE_NAME à chaque déploiement pour forcer la mise à jour. */
const CACHE_NAME = 'entraineur-v19';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './css/app.css',
  './js/supabase.min.js',
  './js/supabase-client.js',
  './js/constants.js',
  './js/storage.js',
  './js/library.js',
  './js/editor.js',
  './js/session.js',
  './js/recap.js',
  './js/settings.js',
  './js/stats.js',
  './js/data.js',
  './js/notes.js',
  './js/auth.js',
  './js/physique.js',
  './js/tours.js',
  './js/mentalisme-data.js',
  './js/mentalisme.js',
  './js/budget.js',
  './js/app.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Cache-first : sert depuis le cache, retombe sur le réseau si absent. */
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
