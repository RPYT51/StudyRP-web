const CACHE = "studyrp-web-v3";
const CORE = ["./", "./index.html", "./assets/css/style.css", "./assets/js/app.js", "./assets/img/icon.svg", "./manifest.json"];
const urls = CORE.map(path => new URL(path, self.registration.scope).href);

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(
    urls.map(url => new Request(url, { cache: "reload" }))
  )));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith("studyrp-web-") && key !== CACHE).map(key => caches.delete(key))
  )));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || !urls.includes(event.request.url)) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request))
    .then(response => response || fetch(event.request)));
});
