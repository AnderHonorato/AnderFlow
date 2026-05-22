let webPush: any = null

async function getWebPush() {
  if (webPush) return webPush
  webPush = require('web-push')
  webPush.setVapidDetails(
    'mailto:admin@andero.com.br',
    process.env.VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
  )
  return webPush
}

export async function sendPushToUser(userId: string, title: string, body: string, url?: string) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } })
    if (subscriptions.length === 0) return { sent: 0 }

    const wp = await getWebPush()
    const payload = JSON.stringify({ title, body, url: url || '/' })

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        wp.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys as any },
          payload
        )
      )
    )

    return { sent: results.filter(r => r.status === 'fulfilled').length }
  } catch {
    return { sent: 0 }
  }
}
