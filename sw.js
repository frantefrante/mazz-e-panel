self.addEventListener('push', e => {
  const d = e.data?.json() || {};
  e.waitUntil(self.registration.showNotification(d.title || 'Mazz e Panell', {
    body: d.body || 'Nuovo contenuto disponibile',
    icon: '/logo mazz.png',
    badge: '/logo mazz.png',
    data: { url: '/' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/'));
});
