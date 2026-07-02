/**
 * Shared API Types and Utilities
 *
 * Standard response types and transformation utilities for the application RBAC backend API.
 * These types align with the backend response format documented in screen-wise-api-documentation.md
 */

// ============================================================================
// Core Response Types
// ============================================================================

/**
 * Standard success response wrapper
 * Used for all successful API responses
 */
export interface ApiResponse<T> {
  status: 'success'
  data: T
  meta?: {
    pagination?: PaginationMeta
  }
  message?: string
  timestamp: string
}

/**
 * Standard error response
 * Used for all error responses (4xx, 5xx)
 */
export interface ApiErrorResponse {
  status: 'error'
  error: {
    code: string
    message: string
    details?: Array<{
      field: string
      message: string
    }>
  }
  timestamp: string
}

/**
 * Pagination metadata
 * Included in meta.pagination for paginated list responses
 */
export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// ============================================================================
// Legacy Response Types (for backward compatibility)
// ============================================================================

/**
 * Legacy success response format (without status wrapper)
 * Some endpoints may still use this format
 */
export interface LegacySuccessResponse<T = unknown> {
  success: true
  [key: string]: T | true
}

/**
 * Legacy error response format (without status wrapper)
 * Some endpoints may still use this format
 */
export interface LegacyErrorResponse {
  success: false
  error: string
  code?: string
}

// ============================================================================
// Utility Response Types
// ============================================================================

/**
 * Empty data response (for operations that don't return data)
 * Used for DELETE, password changes, etc.
 */
export type EmptyDataResponse = ApiResponse<null>

/**
 * Paginated list response
 * Generic wrapper for any paginated list
 */
export interface PaginatedResponse<T> extends ApiResponse<{ items: T[] }> {
  meta: {
    pagination: PaginationMeta
  }
}

// ============================================================================
// Request Parameter Types
// ============================================================================

/**
 * Standard pagination parameters
 * Used for list endpoints that support pagination
 */
export interface PaginationParams {
  page?: number
  perPage?: number
}

/**
 * Standard search and sort parameters
 * Used for list endpoints that support filtering
 */
export interface SearchParams {
  q?: string
  sort?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Combined list query parameters
 */
export type ListQueryParams = PaginationParams & SearchParams

// ============================================================================
// Response Transformation Utilities
// ============================================================================

/**
 * Extracts data from a standard API response
 *
 * @param response - The API response wrapper
 * @returns The unwrapped data
 *
 * @example
 * const user = extractData(response) // { id: '123', name: 'John' }
 */
export function extractData<T>(response: ApiResponse<T>): T {
  return response.data
}

/**
 * Extracts pagination metadata from a paginated response
 *
 * @param response - The paginated API response
 * @returns The pagination metadata or null if not present
 *
 * @example
 * const pagination = extractPagination(response)
 * // { page: 1, perPage: 20, total: 50, totalPages: 3, ... }
 */
export function extractPagination<T>(response: ApiResponse<T>): PaginationMeta | null {
  return response.meta?.pagination ?? null
}

/**
 * Extracts items array from a paginated response
 *
 * @param response - The paginated API response
 * @returns The items array
 *
 * @example
 * const users = extractItems(response) // [{ id: '1', ... }, { id: '2', ... }]
 */
export function extractItems<T>(response: PaginatedResponse<T>): T[] {
  return response.data.items
}

/**
 * Extracts both items and pagination from a paginated response
 *
 * @param response - The paginated API response
 * @returns Object containing items and pagination metadata
 *
 * @example
 * const { items, pagination } = extractPaginatedData(response)
 */
export function extractPaginatedData<T>(response: PaginatedResponse<T>): {
  items: T[]
  pagination: PaginationMeta
} {
  return {
    items: response.data.items,
    pagination: response.meta.pagination,
  }
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Type guard to check if a response is an error response
 *
 * @param response - The response to check
 * @returns True if the response is an error response
 */
export function isApiErrorResponse(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    response.status === 'error' &&
    'error' in response
  )
}

/**
 * Type guard to check if a response is a legacy error response
 *
 * @param response - The response to check
 * @returns True if the response is a legacy error response
 */
export function isLegacyErrorResponse(response: unknown): response is LegacyErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false &&
    'error' in response
  )
}

/**
 * Extracts error message from various error formats
 *
 * @param error - The error object (can be ApiErrorResponse, AxiosError, Error, or unknown)
 * @returns A user-friendly error message
 *
 * @example
 * try {
 *   await api.createUser(data)
 * } catch (error) {
 *   const message = extractErrorMessage(error)
 *   toast.error(message)
 * }
 */
export function extractErrorMessage(error: unknown): string {
  // Handle standard API error response
  if (isApiErrorResponse(error)) {
    return error.error.message
  }

  // Handle legacy API error response
  if (isLegacyErrorResponse(error)) {
    return error.error
  }

  // Handle axios error with response
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null
  ) {
    const response = error.response as { data?: unknown }

    // Try to extract from response data
    if (isApiErrorResponse(response.data)) {
      return response.data.error.message
    }

    if (isLegacyErrorResponse(response.data)) {
      return response.data.error
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error
  }

  // Fallback for unknown error types
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Extracts error code from API error responses
 *
 * @param error - The error object
 * @returns The error code or 'UNKNOWN_ERROR' if not found
 *
 * @example
 * const code = extractErrorCode(error)
 * if (code === 'INVALID_CREDENTIALS') {
 *   // Handle invalid credentials
 * }
 */
export function extractErrorCode(error: unknown): string {
  // Handle standard API error response
  if (isApiErrorResponse(error)) {
    return error.error.code
  }

  // Handle legacy API error response
  if (isLegacyErrorResponse(error)) {
    return error.code ?? 'UNKNOWN_ERROR'
  }

  // Handle axios error with response
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null
  ) {
    const response = error.response as { data?: unknown }

    if (isApiErrorResponse(response.data)) {
      return response.data.error.code
    }

    if (isLegacyErrorResponse(response.data)) {
      return response.data.code ?? 'UNKNOWN_ERROR'
    }
  }

  return 'UNKNOWN_ERROR'
}

/**
 * Extracts validation error details from API error responses
 *
 * @param error - The error object
 * @returns Array of field-level validation errors or empty array
 *
 * @example
 * const details = extractValidationErrors(error)
 * details.forEach(({ field, message }) => {
 *   form.setError(field, { message })
 * })
 */
export function extractValidationErrors(error: unknown): Array<{ field: string; message: string }> {
  // Handle standard API error response with details
  if (isApiErrorResponse(error) && error.error.details) {
    return error.error.details
  }

  // Handle axios error with response
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null
  ) {
    const response = error.response as { data?: unknown }

    if (isApiErrorResponse(response.data) && response.data.error.details) {
      return response.data.error.details
    }
  }

  return []
}

/**
 * Throws a standardized error with extracted message
 * Use this in API service functions to re-throw errors consistently
 *
 * @param error - The error to handle
 * @throws Error with extracted message
 *
 * @example
 * try {
 *   const response = await apiClient.get('/users')
 *   return response.data
 * } catch (error) {
 *   handleApiError(error) // Re-throws with clean message
 * }
 */
export function handleApiError(error: unknown): never {
  const message = extractErrorMessage(error)
  const code = extractErrorCode(error)

  const enhancedError = new Error(message) as Error & { code: string }
  enhancedError.code = code

  throw enhancedError
}

// ============================================================================
// Field Name Transformation Utilities
// ============================================================================

/**
 * Maps backend field names to frontend equivalents
 * Used to maintain consistent naming conventions
 */
const FIELD_NAME_MAP: Record<string, string> = {
  // Backend uses these names in some endpoints
  requiresPasswordChange: 'mustChangePassword',
  // Add more mappings as needed
}

/**
 * Transforms backend field names to frontend equivalents
 *
 * @param obj - The object with backend field names
 * @returns New object with frontend field names
 *
 * @example
 * const user = transformFieldNames({
 *   id: '123',
 *   requiresPasswordChange: true
 * })
 * // { id: '123', mustChangePassword: true }
 */
export function transformFieldNames<T extends Record<string, unknown>>(obj: T): T {
  const transformed = { ...obj } as Record<string, unknown>

  for (const [backendName, frontendName] of Object.entries(FIELD_NAME_MAP)) {
    if (backendName in transformed) {
      transformed[frontendName] = transformed[backendName]
      delete transformed[backendName]
    }
  }

  return transformed as T
}

// ============================================================================
// HTTP Status Code Constants
// ============================================================================

/**
 * Standard HTTP status codes used by the API
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const

/**
 * Type for HTTP status codes
 */
export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS]

// Error codes live in a single place: the `ErrorCode` enum in ./error-handler.
