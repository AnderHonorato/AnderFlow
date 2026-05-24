import { NextResponse } from 'next/server'
import { getSessionUser, isDeveloperOrAbove, unauthorizedResponse } from '@/lib/auth-utils'
import { getUserAdminBadges } from '@/lib/admin-badges'

export async function GET() {
  const user = await getSessionUser()
  if (!user || !isDeveloperOrAbove(user)) return unauthorizedResponse()

  const badges = await getUserAdminBadges(user.id)
  return NextResponse.json({ data: badges })
}
