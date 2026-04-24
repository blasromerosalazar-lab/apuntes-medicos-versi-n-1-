const CACHE_NAME = `mednotes-v${new Date().getTime()}`;
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './hand_model.glb',
  './bioquimica_esquema.svg'
];

// Instalación: Guarda todo en el búnker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Intentamos agregar los recursos fijos
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Algunos archivos no se pudieron cachear en install:', err);
      });
    })
  );
  self.skipWaiting();
});

// Estrategia Cache-First: Si está en la tablet, no lo busques en internet
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Guardar nuevas peticiones válidas (como librerías dinámicas o archivos de Vite)
          if (event.request.method === 'GET' && fetchResponse.status === 200 && (event.request.url.startsWith('http') || event.request.url.startsWith('https'))) {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      });
    }).catch(() => {
      // Fallback si no hay red ni cache
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
