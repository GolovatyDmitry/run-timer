/* Service worker для таймера — офлайн и запуск как приложение.
   Меняй версию кэша при обновлении ассетов, чтобы клиенты забрали новое. */
const CACHE = 'run-timer-v5';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  // НЕ вызываем skipWaiting здесь — ждём, пока страница разрешит обновление (баннер)
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// страница просит применить обновление немедленно
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      // кэшируем удачные ответы, включая шрифты и NoSleep с CDN — для офлайна
      const copy = res.clone();
      if (res.ok || res.type === 'opaque') caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
