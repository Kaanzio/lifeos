const CACHE_NAME = 'lifeos-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './manifest.json',
    './js/app.js',
    './js/auth.js',
    './js/books.js',
    './js/dashboard.js',
    './js/exams.js',
    './js/games.js',
    './js/habits.js',
    './js/lessons.js',
    './js/notes.js',
    './js/notifications.js',
    './js/planning.js',
    './js/pomodoro.js',
    './js/profile.js',
    './js/schedule.js',
    './js/shows.js',
    './js/sites.js',
    './js/storage.js',
    './js/youtube.js',
    './js/drive-sync.js'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching all assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate Event - Cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

// Fetch Event - Serve from Cache, Fallback to Network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached response if found
                if (response) {
                    return response;
                }
                // Otherwise fetch from network
                return fetch(event.request);
            })
    );
});
