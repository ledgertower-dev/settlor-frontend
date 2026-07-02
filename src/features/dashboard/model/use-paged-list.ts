import { useState } from 'react'

export interface PagedList<T> {
  /** Items on the current page. */
  pageItems: T[]
  /** Zero-based current page index (clamped to valid range). */
  page: number
  pageCount: number
  hasPrev: boolean
  hasNext: boolean
  prev: () => void
  next: () => void
}

/**
 * Paginates a list `perPage` items at a time for a simple prev/next carousel.
 * The page index self-clamps when the list shrinks, so it never points past the end.
 */
export function usePagedList<T>(items: T[], perPage: number): PagedList<T> {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(items.length / perPage))
  const current = Math.min(page, pageCount - 1)
  const start = current * perPage

  return {
    pageItems: items.slice(start, start + perPage),
    page: current,
    pageCount,
    hasPrev: current > 0,
    hasNext: current < pageCount - 1,
    prev: () => setPage(p => Math.max(0, p - 1)),
    next: () => setPage(p => Math.min(pageCount - 1, p + 1)),
  }
}
