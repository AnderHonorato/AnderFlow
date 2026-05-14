import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function getSessionUser(request?: NextRequest) {
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) return null

  return {
    id: token.id as string,
    email: token.email as string,
    name: token.name as string,
    role: token.role as string,
  }
}

export function isAdmin(user: any): boolean {
  return user?.role === 'ADMIN' || user?.role === 'DEVELOPER'
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
}
