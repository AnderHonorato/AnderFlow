import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, unauthorizedResponse } from '@/lib/auth-utils'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user || (user.roleLevel || 0) < 80) return unauthorizedResponse()

  const body = await request.json()
  const { service } = body as { service: 'whatsapp' | 'email' | 'stripe' | 'anthropic' | 'deepseek' }

  if (!service) {
    return NextResponse.json({ error: 'Servico obrigatorio' }, { status: 400 })
  }

  const start = Date.now()

  try {
    switch (service) {
      case 'whatsapp': {
        // Just check if WhatsApp status endpoint responds
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const res = await fetch(`${baseUrl}/api/whatsapp/status`, { signal: controller.signal })
          clearTimeout(timeout)
          const data = await res.json()
          const isConnected = data.data?.status === 'connected'
          return NextResponse.json({
            data: { success: isConnected, message: isConnected ? 'WhatsApp conectado' : 'WhatsApp nao conectado', latencyMs: Date.now() - start },
          })
        } catch {
          clearTimeout(timeout)
          return NextResponse.json({ data: { success: false, message: 'Erro ao verificar WhatsApp', latencyMs: Date.now() - start } })
        }
      }

      case 'email': {
        if (!process.env.RESEND_API_KEY && !process.env.EMAIL_SERVER) {
          return NextResponse.json({ data: { success: false, message: 'API de email nao configurada', latencyMs: Date.now() - start } })
        }
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY || 're_test')
        try {
          await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'delivered@resend.dev',
            subject: 'Teste de integracao',
            text: 'Teste',
          })
          return NextResponse.json({ data: { success: true, message: 'Email configurado (Resend)', latencyMs: Date.now() - start } })
        } catch {
          return NextResponse.json({ data: { success: false, message: 'Falha ao enviar email teste', latencyMs: Date.now() - start } })
        }
      }

      case 'stripe': {
        if (!process.env.STRIPE_SECRET_KEY) {
          return NextResponse.json({ data: { success: false, message: 'Chave Stripe nao configurada', latencyMs: Date.now() - start } })
        }
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
        try {
          await stripe.balance.retrieve()
          return NextResponse.json({ data: { success: true, message: 'Stripe configurado', latencyMs: Date.now() - start } })
        } catch {
          return NextResponse.json({ data: { success: false, message: 'Falha na conexao com Stripe', latencyMs: Date.now() - start } })
        }
      }

      case 'anthropic': {
        if (!process.env.ANTHROPIC_API_KEY) {
          return NextResponse.json({ data: { success: false, message: 'Chave Anthropic nao configurada', latencyMs: Date.now() - start } })
        }
        return NextResponse.json({ data: { success: true, message: 'Anthropic configurado', latencyMs: Date.now() - start } })
      }

      case 'deepseek': {
        if (!process.env.DEEPSEEK_API_KEY) {
          return NextResponse.json({ data: { success: false, message: 'Chave DeepSeek nao configurada', latencyMs: Date.now() - start } })
        }
        try {
          const client = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: 'https://api.deepseek.com',
          })
          await client.models.list()
          return NextResponse.json({ data: { success: true, message: 'DeepSeek configurado', latencyMs: Date.now() - start } })
        } catch {
          return NextResponse.json({ data: { success: false, message: 'Falha na conexao com DeepSeek', latencyMs: Date.now() - start } })
        }
      }

      default:
        return NextResponse.json({ error: 'Servico desconhecido' }, { status: 400 })
    }
  } catch (err) {
    return NextResponse.json({ data: { success: false, message: 'Erro ao testar integracao', latencyMs: Date.now() - start } })
  }
}
