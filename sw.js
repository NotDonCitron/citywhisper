const CACHE_NAME = 'citywhisper-v2';
const ASSETS_STATIC = [
  '/',
  '/citywhisper_prototype.html',
  '/manifest.json',
  '/static/js/db.js',
  '/static/fallback.svg',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap'
];

// Cache for dynamic assets (downloaded tours)
const ASSETS_DYNAMIC = 'citywhisper-assets-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_STATIC))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME && key !== ASSETS_DYNAMIC)
            .map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Static Assets: Cache-First
  if (ASSETS_STATIC.some(asset => event.request.url.includes(asset)) || 
      url.hostname === 'cdn.tailwindcss.com' || 
      url.hostname === 'unpkg.com' || 
      url.hostname === 'fonts.googleapis.com') {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchRes.clone());
            return fetchRes;
          });
        });
      })
    );
    return;
  }

  // 2. Dynamic Assets (Images, Audio): Cache-First
  if (event.request.url.includes('/static/audio/') || 
      event.request.url.includes('/static/images/') ||
      event.request.url.includes('/proxy_image')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // 3. API calls (/pois, /route): Network-First, then fallback to Cache
  if (event.request.url.includes('/pois') || event.request.url.includes('/route')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // 4. Map Tiles: Cache-First with Network Fallback
  if (url.hostname.includes('basemaps.cartocdn.com')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(fetchRes => {
          return caches.open('citywhisper-map-tiles').then(cache => {
            cache.put(event.request, fetchRes.clone());
            return fetchRes;
          });
        });
      })
    );
    return;
  }

  // Default: Network-First
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
