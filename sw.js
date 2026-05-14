// Service Worker — Portal Escolar U.E. Edith Nair
const CACHE_NAME = 'portal-edith-v2';
const PRECACHE = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/css/style.css',
  '/css/animations.css',
  '/js/data.js',
  '/js/dashboard.js',
  '/js/firebase-config.js',
  '/img/favicon.png',
  '/img/logo.png',
  '/img/logo1.png',
  '/img/logo2.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
