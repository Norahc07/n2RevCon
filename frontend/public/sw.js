/**
 * Service Worker for Push Notifications
 * This file is automatically registered by Vite PWA plugin
 */

// Listen for push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/n2RevConLogo.png',
    badge: '/n2RevConLogo.png',
    vibrate: [200, 100, 200],
    tag: 'n2revcon-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('n2 RevCon', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

