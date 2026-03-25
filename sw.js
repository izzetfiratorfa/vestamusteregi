const CACHE_NAME = 'vesta-v32';
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
  if (!e.request.url.startsWith('http')) return;

  // For navigation requests, try network first, fall back to cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // For images, cache first (good for item photos)
  if (e.request.destination === 'image') {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          if (response.ok) {
            try {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                try { cache.put(e.request, clone); } catch(err) {}
              });
            } catch(err) {}
          }
          return response;
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }

  // For API calls and other requests, network first
  e.respondWith(
    fetch(e.request).then(response => {
      if (response.ok && e.request.method === 'GET') {
        try {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            try { cache.put(e.request, clone); } catch(err) {}
          });
        } catch(err) {}
      }
      return response;
    }).catch(() => caches.match(e.request))
  );
});
