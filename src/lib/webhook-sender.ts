import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function sendWebhook(event: string, payload: Record<string, unknown>) {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { isActive: true, events: { has: event } },
    })

    for (const endpoint of endpoints) {
      let lastError: Error | null = null
      let lastStatusCode: number | null = null
      let lastResponseBody: string | null = null

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
              'X-Delivery-Id': `${endpoint.id}-${Date.now()}-${attempt}`,
            },
            body,
            signal: AbortSignal.timeout(10000),
          })

          lastStatusCode = response.status
          try { lastResponseBody = await response.text() } catch { lastResponseBody = null }

          await prisma.webhookDelivery.create({
            data: {
              endpointId: endpoint.id,
              event,
              payload: payload as any,
              statusCode: response.status,
              responseBody: lastResponseBody,
              success: response.ok,
              attempts: attempt,
            },
          })

          if (response.ok) break
          lastError = new Error(`HTTP ${response.status}`)
        } catch (err: any) {
          lastError = err
          lastStatusCode = null
          lastResponseBody = err.message || null
        }

        if (attempt < 3) {
          const delay = attempt === 1 ? 5000 : 15000
          await new Promise(r => setTimeout(r, delay))
        }
      }

      if (lastError) {
        await prisma.webhookDelivery.create({
          data: {
            endpointId: endpoint.id,
            event,
            payload: payload as any,
            statusCode: lastStatusCode,
            responseBody: lastResponseBody,
            success: false,
            attempts: 3,
          },
        })
      }
    }
  } catch (err) {
    console.error('[webhook-sender]', err)
  }
}
