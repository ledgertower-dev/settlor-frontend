import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/lib/core/env'
import { logger } from '@/lib/core/logger'

/**
 * Clear all auth-related client state before hard redirect to login.
 * This prevents stale Zustand/React Query data from causing
 * redirect loops after auto-logout (401).
 */
function clearAuthState() {
  if (typeof window === 'undefined') return

  try {
    // Clear cookies used by proxy middleware for auth checks
    document.cookie = 'csrf_token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'leopay_role=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT'
  } catch {
    // Fail silently — redirect will still happen
  }
}

/**
 * API Client Configuration
 *
 * Configured axios instance for the application RBAC backend
 */

/**
 * Create axios instance with base configuration
 */
const apiClient = axios.create({
  baseURL: `${env.NEXT_PUBLIC_API_BASE_URL}/api/v1`,
  timeout: 30000, // 30 seconds
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Auth-Mode': 'cookie',
  },
})

/**
 * Read the CSRF token from the csrf_token cookie (not httpOnly).
 * Required on POST/PUT/PATCH/DELETE requests in cookie auth mode.
 */
function getCsrfToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/csrf_token=([^;]+)/)
  return match ? match[1] : ''
}

// Track if we're currently refreshing the token to avoid multiple refresh requests
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string) => void
  reject: (reason: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })

  failedQueue = []
}

/**
 * Request Interceptor
 * Adds CSRF token to mutation requests and handles FormData
 */
apiClient.interceptors.request.use(
  config => {
    // Add CSRF token for mutation requests (POST/PUT/PATCH/DELETE)
    const method = config.method?.toUpperCase()
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = getCsrfToken()
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken
      }
    }

    // IMPORTANT: For FormData uploads, remove Content-Type header
    // This lets the browser auto-set it with the correct multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug('API Request', { method: config.method?.toUpperCase(), url: config.url })
    }
    return config
  },
  error => {
    logger.error('Request interceptor error', { error: String(error) })
    return Promise.reject(error)
  },
)

/**
 * Response Interceptor
 * Handles response transformation and error handling
 */
apiClient.interceptors.response.use(
  response => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('API Response', { status: response.status, url: response.config.url })
    }
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
      _skipAuthRetry?: boolean
    }

    if (process.env.NODE_ENV === 'development') {
      logger.warn('API Error', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
      })

      if (error.response?.data) {
        logger.warn('Error Response Data', { data: error.response.data as Record<string, unknown> })
      }
    }

    // Handle 403 with AUTH_ACCOUNT_LOCKED — redirect to blocked page
    if (error.response?.status === 403) {
      const data = error.response.data as { error?: { code?: string } } | undefined
      if (data?.error?.code === 'AUTH_ACCOUNT_LOCKED') {
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/blocked')) {
          window.location.href = '/auth/blocked'
        }
        return Promise.reject(error)
      }
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Allow specific requests to skip auth retry (e.g. OTP validation)
      if (originalRequest._skipAuthRetry) {
        return Promise.reject(error)
      }

      // Skip refresh for credential validation errors (e.g. revert transaction)
      const errorCode = (error.response.data as { error?: { code?: string } })?.error?.code
      if (errorCode === 'AUTH_INVALID_CREDENTIALS') {
        return Promise.reject(error)
      }

      // Skip refresh for login, refresh, and auth endpoints
      const isAuthEndpoint = originalRequest.url?.startsWith('/auth/')

      if (isAuthEndpoint) {
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.includes('/auth/login') &&
          !window.location.pathname.startsWith('/api-docs')
        ) {
          clearAuthState()
          window.location.href = '/auth/login'
        }
        return Promise.reject(error)
      }

      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            if (originalRequest.data instanceof FormData) {
              delete originalRequest.headers['Content-Type']
            }
            return apiClient(originalRequest)
          })
          .catch(err => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Attempt to refresh via cookies
        await axios.post(
          `${env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true, headers: { 'X-Auth-Mode': 'cookie' } },
        )

        if (originalRequest.data instanceof FormData) {
          delete originalRequest.headers['Content-Type']
        }

        processQueue(null, 'refreshed')
        isRefreshing = false

        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        isRefreshing = false

        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.includes('/auth/login') &&
          !window.location.pathname.startsWith('/api-docs')
        ) {
          clearAuthState()
          window.location.href = '/auth/login'
        }

        return Promise.reject(refreshError)
      }
    }

    // Handle network errors
    if (!error.response) {
      logger.error('Network Error', { message: error.message })
    }

    return Promise.reject(error)
  },
)

export default apiClient
