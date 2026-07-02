import { NextResponse } from 'next/server'

/**
 * Health check endpoint for Docker container health monitoring
 * Used by Docker Compose and orchestration tools to verify service status
 *
 * @returns JSON response with status and timestamp
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'settlor-frontend',
  })
}
