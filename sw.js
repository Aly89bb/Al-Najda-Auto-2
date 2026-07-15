// AL Najda Auto BRCC — service worker
const CACHE='najda-brcc-v1';
const SHELL=['./','./index.html','./manifest.json','./najda-icon-192.png','./najda-icon-512.png','./najda-logo-icon.svg','./najda-hero-1.jpg','./najda-hero-2.jpg','./najda-landing-bottom.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return; // bypass supabase, tiles, CDNs
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp));return r;}).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp));return res;}).catch(()=>r)));
});

// ── Web Push ──────────────────────────────────────────────────
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: 'AL Najda Auto BRCC', body: e.data ? e.data.text() : '' }; }
  const title = d.title || 'AL Najda Auto BRCC';
  const opts = {
    body: d.body || '',
    icon: './najda-icon-192.png',
    badge: './najda-icon-192.png',
    vibrate: [40, 60, 140],
    tag: d.tag || 'brcc',
    renotify: true,
    data: { url: d.url || './' }
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
