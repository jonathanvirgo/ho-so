/**
 * Service Worker for Survey System PWA
 */

const CACHE_NAME = 'survey-system-v1';
const STATIC_CACHE = 'survey-static-v1';
const DYNAMIC_CACHE = 'survey-dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/css/bootstrap.min.css',
    '/css/survey-system.css',
    '/css/form-builder.css',
    '/css/survey-analytics.css',
    '/css/multi-page-survey.css',
    '/js/jquery.min.js',
    '/js/bootstrap.bundle.min.js',
    '/js/form-builder.js',
    '/js/survey-analytics.js',
    '/js/conditional-logic.js',
    '/js/form-validation.js',
    '/js/multi-page-survey.js',
    '/js/file-upload.js',
    '/js/modern-features.js',
    '/images/logo.png',
    '/manifest.json'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Caching static files...');
                return cache.addAll(STATIC_FILES);
            })
            .catch((error) => {
                console.error('Failed to cache static files:', error);
            })
    );
    
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                // Take control of all clients
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip external requests
    if (url.origin !== location.origin) {
        return;
    }
    
    // Handle different types of requests
    if (isStaticAsset(request.url)) {
        // Static assets - cache first strategy
        event.respondWith(cacheFirst(request));
    } else if (isAPIRequest(request.url)) {
        // API requests - network first strategy
        event.respondWith(networkFirst(request));
    } else if (isSurveyPage(request.url)) {
        // Survey pages - stale while revalidate strategy
        event.respondWith(staleWhileRevalidate(request));
    } else {
        // Default - network first strategy
        event.respondWith(networkFirst(request));
    }
});

// Cache first strategy - for static assets
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache first strategy failed:', error);
        
        // Return offline fallback if available
        return getOfflineFallback(request);
    }
}

// Network first strategy - for dynamic content
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Network first strategy failed:', error);
        
        // Try to serve from cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline fallback
        return getOfflineFallback(request);
    }
}

// Stale while revalidate strategy - for survey pages
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Fetch from network in background
    const networkResponsePromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch((error) => {
            console.error('Background fetch failed:', error);
        });
    
    // Return cached response immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Otherwise wait for network response
    try {
        return await networkResponsePromise;
    } catch (error) {
        return getOfflineFallback(request);
    }
}

// Get offline fallback response
async function getOfflineFallback(request) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/survey/')) {
        // Return offline survey page
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Survey - Offline</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .offline-message { max-width: 400px; margin: 0 auto; }
                    .icon { font-size: 4rem; color: #ffc107; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="offline-message">
                    <div class="icon">📱</div>
                    <h2>You're Offline</h2>
                    <p>This survey is not available offline. Please check your internet connection and try again.</p>
                    <button onclick="window.location.reload()">Retry</button>
                </div>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
    
    // Generic offline page
    return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Offline</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .offline-message { max-width: 400px; margin: 0 auto; }
                .icon { font-size: 4rem; color: #dc3545; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="offline-message">
                <div class="icon">🌐</div>
                <h2>No Internet Connection</h2>
                <p>Please check your internet connection and try again.</p>
                <button onclick="window.location.reload()">Retry</button>
            </div>
        </body>
        </html>
    `, {
        headers: { 'Content-Type': 'text/html' }
    });
}

// Helper functions
function isStaticAsset(url) {
    return url.includes('/css/') || 
           url.includes('/js/') || 
           url.includes('/images/') || 
           url.includes('/fonts/') ||
           url.endsWith('.css') ||
           url.endsWith('.js') ||
           url.endsWith('.png') ||
           url.endsWith('.jpg') ||
           url.endsWith('.jpeg') ||
           url.endsWith('.gif') ||
           url.endsWith('.svg') ||
           url.endsWith('.woff') ||
           url.endsWith('.woff2');
}

function isAPIRequest(url) {
    return url.includes('/api/') || url.includes('/ajax/');
}

function isSurveyPage(url) {
    return url.includes('/survey/') && !url.includes('/api/');
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
    if (event.tag === 'survey-submission') {
        console.log('Background sync: survey-submission');
        event.waitUntil(syncSurveySubmissions());
    }
});

// Sync offline survey submissions
async function syncSurveySubmissions() {
    try {
        // Get pending submissions from IndexedDB or localStorage
        const pendingSubmissions = await getPendingSubmissions();
        
        for (const submission of pendingSubmissions) {
            try {
                const response = await fetch('/api/survey/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(submission.data)
                });
                
                if (response.ok) {
                    // Remove successful submission
                    await removePendingSubmission(submission.id);
                    console.log('Synced offline submission:', submission.id);
                }
            } catch (error) {
                console.error('Failed to sync submission:', submission.id, error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Get pending submissions (placeholder - implement with IndexedDB)
async function getPendingSubmissions() {
    // This would typically use IndexedDB
    // For now, return empty array
    return [];
}

// Remove pending submission (placeholder - implement with IndexedDB)
async function removePendingSubmission(id) {
    // This would typically remove from IndexedDB
    console.log('Removing pending submission:', id);
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);
    
    const options = {
        body: 'You have a new survey to complete',
        icon: '/images/icon-192x192.png',
        badge: '/images/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Open Survey',
                icon: '/images/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/images/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Survey System', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        // Open the survey
        event.waitUntil(
            clients.openWindow('/surveys')
        );
    } else if (event.action === 'close') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_SURVEY') {
        // Cache specific survey for offline access
        const surveyUrl = event.data.url;
        caches.open(DYNAMIC_CACHE)
            .then(cache => cache.add(surveyUrl))
            .then(() => {
                event.ports[0].postMessage({ success: true });
            })
            .catch(error => {
                event.ports[0].postMessage({ success: false, error: error.message });
            });
    }
});
