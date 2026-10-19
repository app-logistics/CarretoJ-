const CACHE_NAME = 'carretoja-v2';
const STATIC_ASSETS = ['./carretoja.html', './manifest.json', './icon-192.png', './icon-512.png'];
const CACHE_DOMAINS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'unpkg.com', 'basemaps.cartocdn.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // APIs de rota e endereço: sempre rede
  if (url.hostname.includes('openrouteservice.org') || url.hostname.includes('nominatim')) return;
  // fontes, Leaflet e mapas: cache primeiro
  if (CACHE_DOMAINS.some(d => url.hostname.includes(d))) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok) { const cl = r.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, cl)); }
      return r;
    })));
    return;
  }
  // app: rede primeiro, cache se estiver sem internet
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const cl = r.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, cl)); }
    return r;
  }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(hit => hit || caches.match('./carretoja.html'))));
});
