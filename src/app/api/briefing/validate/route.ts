import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ valid: false, clientId: null }, { status: 400 })
    }

    const { payload } = await jwtVerify(token, secret)

    if (payload.type !== 'briefing' || !payload.clientId) {
      return NextResponse.json({ valid: false, clientId: null })
    }

    return NextResponse.json({ valid: true, clientId: payload.clientId as string })
  } catch {
    return NextResponse.json({ valid: false, clientId: null })
  }
}
