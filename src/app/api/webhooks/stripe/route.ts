import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Stripe signature missing' }, { status: 400 })
    }

    let event: any
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (webhookSecret && process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = require('stripe')
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      } catch {
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
      }
    } else {
      event = JSON.parse(body)
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const gatewayId = paymentIntent.id

        await prisma.payment.updateMany({
          where: { gatewayId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        })

        const payment = await prisma.payment.findFirst({
          where: { gatewayId },
          include: { invoice: true },
        })

        if (payment?.invoiceId) {
          await prisma.invoice.update({
            where: { id: payment.invoiceId },
            data: { status: 'PAID', paidAt: new Date() },
          })
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        await prisma.payment.updateMany({
          where: { gatewayId: paymentIntent.id },
          data: { status: 'FAILED' },
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
