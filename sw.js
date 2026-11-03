// Service worker - Base Territorial
// Aumente a VERSAO a cada atualização do site para forçar os aparelhos a baixarem os arquivos novos.
const VERSAO = 'bt-v1';
const ARQUIVOS = [
  './', 'index.html', 'setoresABT.html', 'setoresAJA.html', 'previsao.html', 'escala.html',
  'mapaABT.html', 'mapaAJA.html', 'background.png', 'favicon.ico',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSAO).then(c => Promise.all(ARQUIVOS.map(a => c.add(a).catch(() => {}))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Só mexe em arquivos do próprio site; Supabase, Google Sheets, CDNs, mapas etc. vão direto para a rede (dados sempre atuais)
  if (url.origin !== location.origin) return;

  // Rede primeiro; se estiver sem internet, usa a cópia guardada
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) {
        const copia = res.clone();
        caches.open(VERSAO).then(c => c.put(req, copia));
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
