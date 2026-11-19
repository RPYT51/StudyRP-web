// Retira o cache offline da versão pública enquanto a prévia estiver fechada.
self.addEventListener("install", event => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("studyrp-app-")).map(key => caches.delete(key)));
    await self.registration.unregister();
  })());
});
