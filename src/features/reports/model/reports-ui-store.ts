import { createPaginationStoreWithActions } from '@/hooks/use-pagination-store'
import type { PaginationFilters } from '@/lib/types/pagination.types'

// ============================================================================
// Pagination Store
// ============================================================================

type ReportFilters = PaginationFilters

export const useReportsPaginationStore = createPaginationStoreWithActions<
  ReportFilters,
  {
    clearFilters: () => void
  }
>({}, set => ({
  clearFilters: () =>
    set(state => ({
      ...state,
      filters: {
        ...state.filters,
        search: '',
        page: 1,
      },
    })),
}))
