const CACHE_NAME = "expense-diary-v14";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/script.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

self.addEventListener("install", function(event) {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(FILES_TO_CACHE);
            })
    );

    self.skipWaiting();
});


self.addEventListener("activate", function(event) {

    event.waitUntil(
        caches.keys().then(function(cacheNames) {

            return Promise.all(

                cacheNames
                    .filter(function(name) {
                        return name !== CACHE_NAME;
                    })
                    .map(function(name) {
                        return caches.delete(name);
                    })

            );

        })
    );

    self.clients.claim();
});


self.addEventListener("fetch", function(event) {

    event.respondWith(

        caches.match(event.request)
            .then(function(response) {

                return response || fetch(event.request);

            })

    );

});
