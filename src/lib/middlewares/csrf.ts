export function checkCsrf(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  if (!appUrl) return true
  const allowed = [appUrl, 'http://localhost:3000', 'http://localhost:3001']
  if (origin && !allowed.some(u => origin.startsWith(u))) return false
  if (!origin && referer && !allowed.some(u => referer.startsWith(u))) return false
  return true
}
