import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'

  const storageOrigins = (process.env.NEXT_PUBLIC_STORAGE_ORIGINS || 'https://minio.settlor.xyz')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .join(' ')

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src 'self' data: blob: https://via.placeholder.com ${apiUrl} ${storageOrigins}`,
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' ${apiUrl} ${wsUrl} ${wsUrl.replace('ws', 'wss')} ${storageOrigins}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  const response = NextResponse.next()
  const { pathname } = new URL(request.url)

  // Prevent caching of runtime env config — values change per deployment
  if (pathname === '/__env.js') {
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
  }

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  return response
}

export const config = {
  matcher: '/:path*',
}
