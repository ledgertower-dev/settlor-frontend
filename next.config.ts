import type { NextConfig } from 'next'

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'

// Comma-separated list of storage hosts that serve presigned upload/download
const storageOrigins = (process.env.NEXT_PUBLIC_STORAGE_ORIGINS || 'https://minio.settlor.xyz')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .join(' ')

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `img-src 'self' data: blob: https://via.placeholder.com ${apiUrl} ${storageOrigins}`,
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src 'self' ${apiUrl} ${wsUrl} ${wsUrl.replace('ws', 'wss')} ${storageOrigins}`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
]

const nextConfig: NextConfig = {
  // Enable standalone output for minimal Docker images
  output: 'standalone',

  // Configure external image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
      },
    ],
  },

  async redirects() {
    return [
      {
        source: '/reset-password',
        destination: '/auth/reset-password',
        permanent: false,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
