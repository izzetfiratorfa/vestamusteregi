const CACHE_NAME = 'vesta-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Only handle http/https requests, skip chrome-extension etc.
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response.ok && e.request.method === 'GET') {
          try {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              try { cache.put(e.request, clone); } catch(err) {}
            });
          } catch(err) {}
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
