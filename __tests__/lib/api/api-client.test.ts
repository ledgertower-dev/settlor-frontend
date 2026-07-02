// Mock env
jest.mock('../../../src/lib/core/env', () => ({
  env: {
    NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3001',
    NODE_ENV: 'test',
  },
}))

import apiClient from '../../../src/lib/api/api-client'

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Instance Configuration', () => {
    it('should have correct base URL', () => {
      expect(apiClient.defaults.baseURL).toBe('http://localhost:3001/api/v1')
    })

    it('should have correct timeout', () => {
      expect(apiClient.defaults.timeout).toBe(30000)
    })

    it('should have correct default Content-Type header', () => {
      expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
    })

    it('should have correct default Accept header', () => {
      expect(apiClient.defaults.headers['Accept']).toBe('application/json')
    })
  })

  describe('Request Interceptor', () => {
    it('should have request interceptors configured', () => {
      const requestInterceptors = (
        apiClient.interceptors.request as unknown as { handlers: unknown[] }
      ).handlers
      expect(requestInterceptors.length).toBeGreaterThan(0)
    })
  })

  describe('Response Interceptor', () => {
    it('should have response interceptors configured', () => {
      const responseInterceptors = (
        apiClient.interceptors.response as unknown as { handlers: unknown[] }
      ).handlers
      expect(responseInterceptors.length).toBeGreaterThan(0)
    })

    it('should reject 401 errors on auth endpoints', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
        config: {
          url: '/auth/login',
          headers: {},
          _retry: false,
        },
      }

      const responseInterceptors = (
        apiClient.interceptors.response as unknown as {
          handlers: Array<{ rejected: (error: unknown) => Promise<unknown> }>
        }
      ).handlers

      const errorHandler = responseInterceptors[0]?.rejected

      if (errorHandler) {
        await expect(errorHandler(mockError)).rejects.toBeDefined()
      }
    })
  })
})
