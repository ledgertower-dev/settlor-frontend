/**
 * Unified API Error Handler
 *
 * Provides consistent error handling across all API services
 */

import { logger } from '@/lib/core/logger'

export interface ApiError {
  code: string
  message: string
  details?: Array<{
    field: string
    message: string
  }>
  meta?: Record<string, unknown>
}

export interface ApiErrorResponse {
  status: 'error'
  error: ApiError
  timestamp: string
}

/**
 * Standard error codes used across the application
 */
export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Authorization errors
  FORBIDDEN = 'FORBIDDEN',
  ACCESS_DENIED = 'ACCESS_DENIED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',

  // System errors
  SYSTEM_RESOURCE_LOCKED = 'SYSTEM_RESOURCE_LOCKED',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.UNAUTHORIZED]: 'You are not authorized to perform this action',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please log in again',
  [ErrorCode.FORBIDDEN]: 'Access denied. You can only view and manage stores you are assigned to.',
  [ErrorCode.ACCESS_DENIED]:
    "You don't have permission to access this resource. Contact your administrator if you need access.",
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You do not have sufficient permissions',
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again',
  [ErrorCode.INVALID_INPUT]: 'The provided data is invalid',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found',
  [ErrorCode.CONFLICT]: 'This action conflicts with existing data',
  [ErrorCode.DUPLICATE_RESOURCE]: 'A resource with this information already exists',
  [ErrorCode.SYSTEM_RESOURCE_LOCKED]: 'This system resource cannot be modified',
  [ErrorCode.SERVER_ERROR]: 'A server error occurred. Please try again later',
  [ErrorCode.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection',
  [ErrorCode.TIMEOUT_ERROR]: 'The request timed out. Please try again',
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred',
}

/**
 * Parse API error from various error formats
 */
export function parseApiError(error: unknown): ApiError {
  // Default error
  let apiError: ApiError = {
    code: ErrorCode.UNKNOWN_ERROR,
    message: ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR],
  }

  if (error && typeof error === 'object') {
    // Axios error with response
    if ('response' in error && error.response && typeof error.response === 'object') {
      const response = error.response as { data?: unknown; status?: number }

      // Extract from response data
      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>

        // Extract meta if present
        const meta = data.meta as Record<string, unknown> | undefined

        // Standard API error format
        if (data.status === 'error' && data.error && typeof data.error === 'object') {
          const errorData = data.error as Record<string, unknown>
          apiError = {
            code: (errorData.code as string) || ErrorCode.UNKNOWN_ERROR,
            message: (errorData.message as string) || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR],
            details: errorData.details as Array<{ field: string; message: string }> | undefined,
            meta,
          }
        }
        // Backend error format (success: false, error: { code, message })
        else if (data.success === false && data.error && typeof data.error === 'object') {
          const errorData = data.error as Record<string, unknown>
          apiError = {
            code: (errorData.code as string) || ErrorCode.UNKNOWN_ERROR,
            message: (errorData.message as string) || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR],
            details: errorData.details as Array<{ field: string; message: string }> | undefined,
            meta,
          }
        }
        // Backend error format (success: false, error: string)
        else if (data.success === false) {
          apiError = {
            code: (data.code as string) || ErrorCode.UNKNOWN_ERROR,
            message:
              (data.error as string) ||
              (data.message as string) ||
              ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR],
          }
        }
        // Message as array (NestJS validation errors)
        else if (Array.isArray(data.message)) {
          apiError = {
            code: ErrorCode.VALIDATION_ERROR,
            message: data.message.join(', '),
          }
        }
        // Simple message format
        else if (typeof data.message === 'string') {
          apiError = {
            code: ErrorCode.UNKNOWN_ERROR,
            message: data.message,
          }
        }
      }

      // Map HTTP status codes to error codes
      if (response.status) {
        switch (response.status) {
          case 401:
            apiError.code =
              apiError.code === ErrorCode.UNKNOWN_ERROR ? ErrorCode.UNAUTHORIZED : apiError.code
            break
          case 403:
            // Handle ACCESS_DENIED from backend or fallback to FORBIDDEN
            if (apiError.code === ErrorCode.UNKNOWN_ERROR) {
              apiError.code = ErrorCode.ACCESS_DENIED
            } else if (apiError.code === 'ACCESS_DENIED') {
              apiError.code = ErrorCode.ACCESS_DENIED
            }
            break
          case 404:
            apiError.code =
              apiError.code === ErrorCode.UNKNOWN_ERROR ? ErrorCode.NOT_FOUND : apiError.code
            break
          case 409:
            apiError.code =
              apiError.code === ErrorCode.UNKNOWN_ERROR ? ErrorCode.CONFLICT : apiError.code
            break
          case 422:
            apiError.code =
              apiError.code === ErrorCode.UNKNOWN_ERROR ? ErrorCode.VALIDATION_ERROR : apiError.code
            break
          case 429:
            apiError.code = ErrorCode.TIMEOUT_ERROR
            break
          default:
            if (response.status >= 500) {
              apiError.code = ErrorCode.SERVER_ERROR
            }
        }
      }
    }

    // Network errors or re-thrown errors from throwApiError
    else if ('code' in error) {
      const errorCode = error.code as string
      if (errorCode === 'ECONNABORTED') {
        apiError.code = ErrorCode.TIMEOUT_ERROR
      } else if (errorCode === 'NETWORK_ERROR' || errorCode === 'ERR_NETWORK') {
        apiError.code = ErrorCode.NETWORK_ERROR
      } else if (errorCode) {
        // Handle re-thrown errors from throwApiError (plain Error with .code property)
        apiError.code = errorCode
      }
    }

    // Use error.message as fallback — also override the default "unknown" message
    if ('message' in error && typeof error.message === 'string' && error.message) {
      // Always prefer the actual error message over the generic default
      if (!apiError.message || apiError.message === ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR]) {
        apiError.message = error.message
      }
    }
  }

  // Use generic message only as final fallback if no specific message was provided
  if (!apiError.message || apiError.message === ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR]) {
    if (ERROR_MESSAGES[apiError.code as ErrorCode]) {
      apiError.message = ERROR_MESSAGES[apiError.code as ErrorCode]
    }
  }

  return apiError
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: unknown): ApiErrorResponse {
  const apiError = parseApiError(error)

  return {
    status: 'error',
    error: apiError,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Throw a standardized error
 */
export function throwApiError(error: unknown): never {
  const apiError = parseApiError(error)
  logger.error('API error', { code: apiError.code, message: apiError.message })

  // For validation errors with field-level details, surface the specific messages
  let message = apiError.message
  if (apiError.details?.length) {
    message = apiError.details.map(d => `${d.field}: ${d.message}`).join(', ')
  }

  const errorMessage = new Error(message) as Error & {
    code?: string
    details?: Array<{ field: string; message: string }>
    meta?: Record<string, unknown>
  }
  errorMessage.code = apiError.code
  errorMessage.details = apiError.details
  errorMessage.meta = apiError.meta
  throw errorMessage
}

/**
 * Check if error is a specific type
 */
export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  const apiError = parseApiError(error)
  return apiError.code === code
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  const apiError = parseApiError(error)
  return apiError.message
}

/**
 * Check if error is a permission/access denied error
 */
export function isPermissionError(error: unknown): boolean {
  const apiError = parseApiError(error)
  return (
    apiError.code === ErrorCode.FORBIDDEN ||
    apiError.code === ErrorCode.ACCESS_DENIED ||
    apiError.code === ErrorCode.INSUFFICIENT_PERMISSIONS ||
    apiError.code === 'ACCESS_DENIED' ||
    apiError.code === 'FORBIDDEN'
  )
}

/**
 * Get permission error message
 */
export function getPermissionErrorMessage(error: unknown): string {
  if (!isPermissionError(error)) {
    return getErrorMessage(error)
  }

  const apiError = parseApiError(error)

  // If backend provided a specific message, use it
  if (
    apiError.message &&
    apiError.message !== ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR] &&
    apiError.message !== 'An unexpected error occurred'
  ) {
    return apiError.message
  }

  // Otherwise use a friendly default
  return ERROR_MESSAGES[ErrorCode.ACCESS_DENIED]
}
