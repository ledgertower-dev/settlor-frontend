import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js Proxy for Authentication & Role-Based Routing (Next.js 16+)
 *
 * - Protects dashboard routes by checking for csrf_token cookie (set by backend in cookie auth mode)
 * - Validates role prefix in URL matches the user's account type from leopay_role cookie
 * - Redirects old flat routes (e.g. /dashboard) to role-prefixed versions
 */

// Valid role prefixes
const VALID_ROLE_PREFIXES = ['/admin', '/merchant']

// Old flat routes that should redirect to role-prefixed versions
const OLD_FLAT_ROUTES = [
  '/dashboard',
  '/merchants',
  '/payouts',
  '/deposit-payout',
  '/payout-transactions',
  '/roles',
  '/permissions',
  '/audit-logs',
  '/users',
]

// Auth routes configuration
const AUTH_ROUTE_PREFIX = '/auth'
const AUTH_ROUTES_ALLOW_AUTHENTICATED = [
  '/auth/change-password',
  '/auth/maintenance',
  '/auth/blocked',
]

// Cookie names
const CSRF_TOKEN_COOKIE = 'csrf_token'
const ROLE_COOKIE = 'leopay_role'

/**
 * Check if the path starts with a valid role prefix.
 */
function isRolePrefixedRoute(pathname: string): boolean {
  return VALID_ROLE_PREFIXES.some(
    prefix => pathname.startsWith(prefix + '/') || pathname === prefix,
  )
}

/**
 * Check if the path is an old flat route (without role prefix).
 */
function isOldFlatRoute(pathname: string): boolean {
  return OLD_FLAT_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const csrfToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value
  const role = request.cookies.get(ROLE_COOKIE)?.value || 'admin'
  const isLoggedIn = !!csrfToken

  // Handle root path redirect based on auth status
  if (pathname === '/') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
    } else {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // Redirect old flat routes to role-prefixed versions
  if (isOldFlatRoute(pathname)) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(`/${role}${pathname}`, request.url))
    } else {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Check role-prefixed routes
  if (isRolePrefixedRoute(pathname)) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Validate role prefix matches cookie role
    const urlRole = pathname.split('/')[1] // "admin" or "merchant"

    if (urlRole !== role) {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
    }
  }

  // Redirect authenticated users away from auth pages (except change-password)
  const isAuthRoute = pathname.startsWith(AUTH_ROUTE_PREFIX)
  const isAllowedAuthRoute = AUTH_ROUTES_ALLOW_AUTHENTICATED.some(route =>
    pathname.startsWith(route),
  )

  if (isAuthRoute && !isAllowedAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
