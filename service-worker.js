<<<<<<< HEAD
const CACHE_NAME = 'estilo-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './config-imagens.json'
];

self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)))
);
self.addEventListener('fetch', e =>
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)))
);
=======
const CACHE_NAME = 'estilo-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './config-imagens.json'
];

self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)))
);
self.addEventListener('fetch', e =>
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)))
);
>>>>>>> ce9f0bb48177bddb44dd69b505e3e2b2212956a7
