self.addEventListener('push', (e: any) => {
  const data = e.data?.json()
  if (!data) return

  const options: NotificationOptions = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
  }

  e.waitUntil(self.registration.showNotification(data.title || 'Andero', options))
})

self.addEventListener('notificationclick', (e: any) => {
  e.notification.close()
  const url = e.notification.data?.url || '/'

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr: any[]) => {
      const existing = clientsArr.find((c: any) => c.url.includes(url) && 'focus' in c)
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})
