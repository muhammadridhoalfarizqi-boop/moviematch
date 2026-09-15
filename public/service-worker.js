const CACHE_NAME = 'moviematch-v6';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-16.png',
  '/icons/icon-32.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js',
  'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(async cache => {
    await cache.addAll(PRECACHE_ASSETS);
    await Promise.allSettled(CDN_ASSETS.map(asset => cache.add(asset)));
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  const host = requestUrl.hostname;
  const isApi = host.includes('api.themoviedb.org') || host.includes('supabase.co') || host.includes('opensubtitles.com') || host.includes('mymemory.translated.net');
  const isStaticRemote = host.includes('image.tmdb.org') || host.includes('images.unsplash.com') || host.includes('upload.wikimedia.org') || host.includes('ui-avatars.com') || host.includes('jsdelivr.net') || host.includes('fonts.googleapis.com') || host.includes('fonts.gstatic.com');
  if (isApi) { event.respondWith(networkFirst(event.request)); return; }
  if (isStaticRemote) { event.respondWith(cacheFirst(event.request)); return; }
  event.respondWith(networkFirst(event.request).catch(() => caches.match('/index.html')));
});
async function networkFirst(request) {
  try { const response = await fetch(request); if (response && response.ok) saveToCache(request, response.clone()); return response; }
  catch (e) { const cached = await caches.match(request); return cached || Response.error(); }
}
async function cacheFirst(request) {
  const cached = await caches.match(request); if (cached) return cached;
  const response = await fetch(request); if (response && response.ok) saveToCache(request, response.clone()); return response;
}
function saveToCache(request, response) { caches.open(CACHE_NAME).then(cache => cache.put(request, response)).catch(() => {}); }
