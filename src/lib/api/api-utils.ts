import type { BasePaginationParams, PaginationMeta } from '@/lib/types/pagination.types'

/**
 * API Utility Functions
 * Helper functions for building API requests with pagination
 */

/**
 * Build URLSearchParams from pagination filters
 * Automatically filters out undefined values and converts types
 *
 * @param params Pagination parameters
 * @returns URLSearchParams ready for API request
 *
 * @example
 * const params = buildPaginationParams({
 *   search: 'john',
 *   page: 2,
 *   perPage: 15,
 *   sort: 'email',
 *   sortOrder: 'asc'
 * })
 * const url = `/users?${params.toString()}`
 */
export function buildPaginationParams(params?: BasePaginationParams): URLSearchParams {
  const queryParams = new URLSearchParams()

  if (!params) {
    return queryParams
  }

  // Add search param
  if (params.search) {
    queryParams.append('q', params.search)
  }

  // Add page param
  if (params.page !== undefined && params.page !== null) {
    queryParams.append('page', params.page.toString())
  }

  // Add per_page param (backend expects snake_case)
  if (params.perPage !== undefined && params.perPage !== null) {
    queryParams.append('per_page', params.perPage.toString())
  }

  // Add sort param
  if (params.sort) {
    queryParams.append('sort', params.sort)
  }

  // Add sortOrder param
  if (params.sortOrder) {
    queryParams.append('sortOrder', params.sortOrder)
  }

  return queryParams
}

/**
 * Build query string from a flat key-value record
 * Skips undefined, null, and empty string values.
 * Returns "?key=value&..." or empty string.
 *
 * @example
 * buildFilterQueryString({ status: 'active', q: '', page: 2 })
 * // "?status=active&page=2"
 */
export function buildFilterQueryString(
  filters?: Record<string, string | number | boolean | undefined | null>,
): string {
  if (!filters) return ''
  const qp = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qp.append(key, value.toString())
    }
  })
  const qs = qp.toString()
  return qs ? `?${qs}` : ''
}

/**
 * Build query string from pagination filters
 * Returns an empty string if no params, otherwise returns "?key=value&..."
 *
 * @param params Pagination parameters
 * @returns Query string with leading "?" or empty string
 *
 * @example
 * const queryString = buildPaginationQueryString({ page: 1, perPage: 15 })
 * const url = `/users${queryString}` // "/users?page=1&perPage=15"
 */
export function buildPaginationQueryString(params?: BasePaginationParams): string {
  const queryParams = buildPaginationParams(params)
  const queryString = queryParams.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * Build URLSearchParams with additional custom filters
 * Merges pagination params with custom filters
 *
 * @param paginationParams Standard pagination parameters
 * @param customFilters Additional filter key-value pairs
 * @returns URLSearchParams with all filters
 *
 * @example
 * const params = buildPaginationParamsWithFilters(
 *   { page: 1, perPage: 15, search: 'active' },
 *   { status: 'active', role: 'admin' }
 * )
 * // Results in: ?page=1&perPage=15&search=active&status=active&role=admin
 */
export function buildPaginationParamsWithFilters(
  paginationParams?: BasePaginationParams,
  customFilters?: Record<string, string | number | boolean | undefined | null>,
): URLSearchParams {
  const queryParams = buildPaginationParams(paginationParams)

  if (customFilters) {
    Object.entries(customFilters).forEach(([key, value]) => {
      // Skip undefined and null values
      if (value !== undefined && value !== null) {
        // Skip empty strings, but allow false, 0, and other falsy values
        if (typeof value === 'string' && value === '') {
          return
        }
        queryParams.append(key, value.toString())
      }
    })
  }

  return queryParams
}

/**
 * Normalize backend snake_case pagination meta to frontend camelCase PaginationMeta.
 * All paginated API responses share the same meta shape — use this instead of
 * per-service normalization functions.
 */
export function normalizePaginationMeta(raw: {
  page: number
  per_page: number
  total: number
  total_pages: number
}): PaginationMeta {
  return {
    page: raw.page,
    perPage: raw.per_page,
    total: raw.total,
    totalPages: raw.total_pages,
    hasNextPage: raw.page < raw.total_pages,
    hasPrevPage: raw.page > 1,
  }
}
