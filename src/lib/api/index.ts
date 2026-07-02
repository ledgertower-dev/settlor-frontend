// API utilities
export { default as apiClient } from './api-client'

// API types
export type {
  ApiResponse,
  ApiErrorResponse,
  PaginationMeta,
  EmptyDataResponse,
  PaginatedResponse,
  LegacySuccessResponse,
  LegacyErrorResponse,
  PaginationParams,
  SearchParams,
  ListQueryParams,
  HttpStatus,
} from './types'

// API utilities
export {
  extractData,
  extractPagination,
  extractItems,
  extractPaginatedData,
  isApiErrorResponse,
  isLegacyErrorResponse,
  extractErrorMessage,
  extractErrorCode,
  extractValidationErrors,
  handleApiError,
  transformFieldNames,
  HTTP_STATUS,
} from './types'

// Error handling utilities
export * from './error-handler'

// Pagination utilities
export * from './api-utils'

// Uploads (presign → PUT → confirm)
export { uploadsService } from './uploads.api'
export type { UploadedFile } from './uploads.api'
