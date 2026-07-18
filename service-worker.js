// Service Worker for AgriRide PWA
const CACHE_NAME = 'agriride-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/login.html',
    '/booking.html',
    '/splash.html',
    '/styles.css',
    '/premium-theme.css',
    '/mobile.css',
    '/app.js',
    '/app.py',
    '/i18n.js',
    '/db.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap'
];

// Install event: cache resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(urlsToCache))
        .then(() => self.skipWaiting())
    );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event: serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // For GET requests
    if (event.request.method === 'GET') {
        event.respondWith(
            caches.match(event.request)
            .then(response => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // Otherwise fetch from network
                return fetch(event.request).then(response => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    // Cache successful responses
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                // Return offline page if available
                return caches.match('/index.html');
            })
        );
    }
});

// Background sync for offline submissions
self.addEventListener('sync', event => {
    if (event.tag === 'sync-bookings') {
        event.waitUntil(syncBookings());
    }
});

// Sync bookings function
async function syncBookings() {
    try {
        // Get pending bookings from IndexedDB
        const db = await openIndexedDB();
        const pendingBookings = await getPendingBookings(db);

        for (const booking of pendingBookings) {
            try {
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(booking)
                });

                if (response.ok) {
                    await markBookingAsSynced(db, booking.id);
                }
            } catch (error) {
                console.error('Failed to sync booking:', error);
            }
        }
    } catch (error) {
        console.error('Sync failed:', error);
        throw error;
    }
}

// IndexedDB helpers
function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('agriride-db', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pending-bookings')) {
                db.createObjectStore('pending-bookings', { keyPath: 'id' });
            }
        };
    });
}

function getPendingBookings(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['pending-bookings'], 'readonly');
        const store = transaction.objectStore('pending-bookings');
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function markBookingAsSynced(db, bookingId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['pending-bookings'], 'readwrite');
        const store = transaction.objectStore('pending-bookings');
        const request = store.delete(bookingId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}