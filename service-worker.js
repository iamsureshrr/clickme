self.addEventListener("install", (event) => {
    console.log("Service Worker Installed");
    event.waitUntil(
        caches.open("v1").then((cache) => cache.addAll(["/", "/index.html"]))
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});
