// Service worker: lets the portfolio install as an app and open offline.
// The site's own files are fetched fresh from the network first (so updates show up right away) and
// fall back to the saved copy when offline; fonts and the icon font are served from the cache and
// refreshed in the background. Bump VERSION to drop old caches.
const VERSION = 'v2';
const CACHE = 'lyn-' + VERSION;
const CORE = ['./', 'index.html', 'style.css', 'script.js', 'assets/lyn-photo.jpg', 'manifest.webmanifest',
              'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
const CDN = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys()
        .then(keys => Promise.all(keys.filter(k => k.startsWith('lyn-') && k !== CACHE).map(k => caches.delete(k))))
        .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;                       // contact form, chat, etc. go straight to the network
    const url = new URL(req.url);

    // own files: network first, saved copy when offline
    if (url.origin === self.location.origin) {
        const key = req.mode === 'navigate' ? 'index.html' : req;
        e.respondWith(fetch(req)
            .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); } return res; })
            .catch(() => caches.match(key)));
        return;
    }

    // font / icon CDNs: answer from cache, refresh in the background
    if (CDN.includes(url.hostname)) {
        e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => {
            const fresh = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
            return hit || fresh;
        })));
    }
});
