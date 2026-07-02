import { useEffect } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'

/**
 * Standard paginated response shape
 * { data: { items: T[] }, meta: { pagination: { total, totalPages } } }
 */
interface PaginatedData {
  data: {
    items: unknown[]
  }
  meta?: {
    pagination: {
      total: number
      totalPages: number
    }
  }
}

interface UsePaginatedQueryOptions<TData extends PaginatedData> {
  query: UseQueryResult<TData, Error>
  setPage: (page: number) => void
  currentPage: number
}

/**
 * Hook to handle pagination reset when current page becomes empty after deletion.
 * Automatically navigates to the previous valid page when all items on the
 * current page are deleted but items exist on previous pages.
 */
export function usePaginatedQuery<TData extends PaginatedData>({
  query,
  setPage,
  currentPage,
}: UsePaginatedQueryOptions<TData>) {
  const { data, isSuccess, isFetching } = query

  useEffect(() => {
    if (!isSuccess || isFetching || !data || currentPage <= 1) {
      return
    }

    const items = data.data?.items
    const pagination = data.meta?.pagination
    if (!items || !pagination) {
      return
    }

    // Only reset if current page is empty but there are items on other pages
    if (items.length === 0 && pagination.total > 0) {
      const correctPage = Math.min(currentPage - 1, pagination.totalPages || 1)
      setPage(correctPage)
    }
  }, [isSuccess, isFetching, data, currentPage, setPage])

  return query
}
