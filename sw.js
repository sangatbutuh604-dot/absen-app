// Service worker sederhana untuk aplikasi Absen
// Menyimpan file inti agar aplikasi tetap bisa dibuka walau sinyal internet lemah/hilang
const CACHE_NAME = 'absen-cache-v2';
const CORE_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Untuk file inti aplikasi: coba cache dulu, baru jaringan (biar cepat & bisa offline)
  // Untuk request lain (CDN library, dsb.): coba jaringan dulu, kalau gagal baru cache
  const req = event.request;
  const isCore = CORE_FILES.some(f => req.url.endsWith(f.replace('./','')));

  if (isCore) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  } else {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
