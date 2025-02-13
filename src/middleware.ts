import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Sadece basit path kontrolü yapalım
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')

  return NextResponse.next()
}

// Middleware'in hangi path'lerde çalışacağını belirtiyoruz
export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*']
} 