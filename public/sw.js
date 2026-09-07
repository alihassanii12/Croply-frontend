/* eslint-disable no-undef */

const CACHE_NAME = 'croply-v1';

// Service Worker Installation
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(() => {
      console.log('Service Worker: Installed');
    })
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Service Worker Activation
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim();
    })
  );
});

// Push Event Handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  const options = {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'croply-notification',
    requireInteraction: false,
    actions: []
  };

  if (event.data) {
    try {
      const data = event.data.json();
      
      options.body = data.body || data.message || 'New notification from Croply';
      options.icon = data.icon || options.icon;
      options.data = data.data || {};
      
      // Add action buttons for different notification types
      if (data.type === 'new_listing') {
        options.actions = [
          {
            action: 'view',
            title: 'View Listing'
          }
        ];
      } else if (data.type === 'new_message') {
        options.actions = [
          {
            action: 'reply',
            title: 'Reply'
          }
        ];
      }

      event.waitUntil(
        self.registration.showNotification(
          data.title || 'Croply',
          options
        )
      );
    } catch (err) {
      console.error('Service Worker: Error parsing push data:', err);
      
      // Fallback notification
      event.waitUntil(
        self.registration.showNotification(
          'Croply',
          {
            ...options,
            body: 'You have a new notification'
          }
        )
      );
    }
  } else {
    // No data payload - show generic notification
    event.waitUntil(
      self.registration.showNotification(
        'Croply',
        {
          ...options,
          body: 'You have a new notification'
        }
      )
    );
  }
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Determine the URL to navigate to
      let url = '/marketplace';
      
      if (data.listing_id) {
        if (action === 'reply' || data.type === 'new_message') {
          url = `/marketplace/${data.listing_id}/chat`;
        } else {
          url = `/marketplace`;
        }
      }

      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(url.split('/')[1]) && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Notification Close Handler
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed');
  
  // Track notification dismissal if needed
  const data = event.notification.data || {};
  if (data.tracking_id) {
    // Could send analytics event here
    console.log('Notification dismissed:', data.tracking_id);
  }
});

// Background Sync (for future use)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Could implement background tasks here
      Promise.resolve()
    );
  }
});

// Message Handler (for communication with main thread)
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});