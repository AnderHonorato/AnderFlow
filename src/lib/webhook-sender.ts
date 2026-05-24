import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function sendWebhook(event: string, payload: Record<string, unknown>) {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { isActive: true, events: { has: event } },
    })

    for (const endpoint of endpoints) {
      let lastError: Error | null = null

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const body = JSON.stringify(payload)
          const signature = crypto
            .createHmac('sha256', endpoint.secret)
            .update(body)
            .digest('hex')

          const response = await fetch(endpoint.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Signature': signature,
              'X-Event': event,
              'X-Delivery-Id': `${endpoint.id}-${Date.now()}`,
            },
            body,
            signal: AbortSignal.timeout(10000),
          })

          await prisma.webhookDelivery.create({
            data: {
              endpointId: endpoint.id,
              event,
              payload: payload as any,
              statusCode: response.status,
              success: response.ok,
            },
          })

          if (response.ok) break
          lastError = new Error(`HTTP ${response.status}`)
        } catch (err: any) {
          lastError = err
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 1000 * attempt))
          }
        }
      }

      if (lastError) {
        await prisma.webhookDelivery.create({
          data: {
            endpointId: endpoint.id,
            event,
            payload: payload as any,
            statusCode: null,
            success: false,
          },
        })
      }
    }
  } catch (err) {
    console.error('[webhook-sender]', err)
  }
}
