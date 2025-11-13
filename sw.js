// Service Worker for Push Notifications
// Handles background push notifications and offline caching

const CACHE_NAME = 'shukria-v1';
const urlsToCache = [
  '/v1/',
  '/v1/index.html',
  '/v1/css/style.css',
  '/v1/css/notifications.css',
  '/v1/css/journey.css',
  '/v1/js/main.js',
  '/v1/js/notification-service.js',
  '/v1/js/journey-engine.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the fetched response
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // Return offline page if available
        return caches.match('/v1/index.html');
      })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  let notificationData = {
    title: 'Shukria Notification',
    body: 'You have a new update',
    icon: '/v1/assets/shukria-logo.png',
    badge: '/v1/assets/badge-icon.png',
    tag: 'default',
    requireInteraction: false,
    data: {
      url: '/v1/index.html'
    }
  };

  // Parse notification data from push event
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.message || payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        tag: payload.tag || payload.category || notificationData.tag,
        requireInteraction: payload.priority === 'critical',
        data: {
          url: payload.actionUrl || '/v1/index.html',
          notificationId: payload.id,
          category: payload.category
        },
        actions: payload.actions || []
      };

      // Add default actions based on category
      if (payload.category === 'financial' && !notificationData.actions.length) {
        notificationData.actions = [
          { action: 'view', title: 'View Details', icon: '/v1/assets/view-icon.png' },
          { action: 'dismiss', title: 'Dismiss', icon: '/v1/assets/dismiss-icon.png' }
        ];
      }
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: notificationData.actions,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/v1/index.html';
  const action = event.action;

  if (action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if a window is already open
        for (let client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event (tracking)
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event);
  
  // Track notification dismissal
  const notificationData = event.notification.data;
  if (notificationData?.notificationId) {
    // Send analytics event
    fetch('/v1/api/notification_track.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: notificationData.notificationId,
        action: 'dismissed',
        timestamp: Date.now()
      })
    }).catch((error) => {
      console.error('[Service Worker] Failed to track dismissal:', error);
    });
  }
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    const response = await fetch('/v1/api/notification_sync.php');
    const notifications = await response.json();
    
    for (const notification of notifications) {
      await self.registration.showNotification(notification.title, {
        body: notification.message,
        icon: notification.icon || '/v1/assets/shukria-logo.png',
        data: notification
      });
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Handle messages from the client
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});

// Periodic background sync (experimental)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(syncNotifications());
  }
});

console.log('[Service Worker] Loaded and ready');
