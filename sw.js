const CACHE_NAME = 'gym-app-v3';

// Archivos estáticos de la App
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './topoFit.jpg',
  './app.js'
];

// Instalación: guardar la estructura base de la app
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activación: borrar cachés antiguas si se actualiza la versión
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptor de peticiones (Network-First con fallback a Cache)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si hay internet y la petición es hacia Apps Script (o recursos de la app), guarda/actualiza en caché
        if (event.request.url.includes('script.google.com') || event.request.url.includes('googleusercontent.com')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Si NO hay internet (falla fetch), busca y entrega la última respuesta guardada en caché
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Si no existe caché específica pero es una navegación, entrega index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
