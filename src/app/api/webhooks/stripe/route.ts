import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

let stripe: any = null
let Stripe: any = null
if (process.env.STRIPE_SECRET_KEY) {
  Stripe = require('stripe')
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature || !stripe) {
      return NextResponse.json({ error: 'Stripe signature missing or not configured' }, { status: 400 })
    }

    let event: any
    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch {
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
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
