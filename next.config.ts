import type { NextConfig } from 'next'

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
}

export default nextConfig
