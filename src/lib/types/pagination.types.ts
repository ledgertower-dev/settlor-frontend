/**
 * Shared Pagination Types
 * Standardized types for pagination across all features
 */

/**
 * Base pagination parameters for API requests
 */
export interface BasePaginationParams {
  /** Search query string */
  search?: string
  /** Page number (1-indexed) */
  page?: number
  /** Number of items per page */
  perPage?: number
  /** Field to sort by */
  sort?: string
  /** Sort direction */
  sortOrder?: 'asc' | 'desc'
}

/**
 * Flat pagination metadata structure
 * This is the inner structure from the backend response
 */
export interface PaginationMeta {
  /** Current page number */
  page: number
  /** Items per page */
  perPage: number
  /** Total number of items */
  total: number
  /** Total number of pages */
  totalPages: number
  /** Whether there is a next page */
  hasNextPage: boolean
  /** Whether there is a previous page */
  hasPrevPage: boolean
}

/**
 * Standard paginated response structure
 */
export interface PaginatedResponse<T> {
  data: {
    items: T[]
  }
  meta: {
    pagination: PaginationMeta
  }
}

/**
 * Pagination filter state for UI stores
 */
export interface PaginationFilters {
  /** Search query */
  search: string
  /** Current page */
  page: number
  /** Items per page */
  perPage: number
  /** Sort field */
  sort?: string
  /** Sort order */
  sortOrder?: 'asc' | 'desc'
}

/**
 * Pagination store actions
 */
export interface PaginationStoreActions {
  /** Set current page */
  setPage: (page: number) => void
  /** Set items per page (resets to page 1) */
  setPerPage: (perPage: number) => void
  /** Set search query (resets to page 1) */
  setSearch: (search: string) => void
  /** Set sorting (resets to page 1) */
  setSort: (sort: string, sortOrder: 'asc' | 'desc') => void
  /** Reset all filters to defaults */
  resetFilters: () => void
}

/**
 * Combined pagination store state
 */
export interface PaginationStore<
  TFilters extends PaginationFilters = PaginationFilters,
> extends PaginationStoreActions {
  /** Current filter state */
  filters: TFilters
}

/**
 * Options per page selector
 */
export const ITEMS_PER_PAGE_OPTIONS = [10, 15, 20, 50, 100] as const

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  perPage: 15,
  search: '',
} as const
