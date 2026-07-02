import { create } from 'zustand'
import { createPaginationStoreWithActions } from '@/hooks/use-pagination-store'
import type { PaginationFilters } from '@/lib/types/pagination.types'

// ============================================================================
// Pagination Store
// ============================================================================

interface ScheduledPayoutFilters extends PaginationFilters {
  typeFilter: string
  statusFilter: string
}

export const useScheduledPayoutsPaginationStore = createPaginationStoreWithActions<
  ScheduledPayoutFilters,
  {
    setTypeFilter: (type: string) => void
    setStatusFilter: (status: string) => void
    clearFilters: () => void
  }
>({ typeFilter: 'all', statusFilter: '' }, set => ({
  setTypeFilter: (typeFilter: string) =>
    set(state => ({ ...state, filters: { ...state.filters, typeFilter, page: 1 } })),
  setStatusFilter: (statusFilter: string) =>
    set(state => ({ ...state, filters: { ...state.filters, statusFilter, page: 1 } })),
  clearFilters: () =>
    set(state => ({
      ...state,
      filters: {
        ...state.filters,
        search: '',
        typeFilter: 'all',
        statusFilter: '',
        page: 1,
      },
    })),
}))

// ============================================================================
// Modal Store
// ============================================================================

interface ScheduledPayoutsModalStore {
  showCreateDrawer: boolean
  editPayoutId: string | null
  showBulkModal: boolean

  openCreateDrawer: () => void
  openEditDrawer: (id: string) => void
  closeDrawer: () => void
  openBulkModal: () => void
  closeBulkModal: () => void
}

export const useScheduledPayoutsModalStore = create<ScheduledPayoutsModalStore>(set => ({
  showCreateDrawer: false,
  editPayoutId: null,
  showBulkModal: false,

  openCreateDrawer: () => set({ showCreateDrawer: true, editPayoutId: null }),
  openEditDrawer: (id: string) => set({ showCreateDrawer: true, editPayoutId: id }),
  closeDrawer: () => set({ showCreateDrawer: false, editPayoutId: null }),
  openBulkModal: () => set({ showBulkModal: true }),
  closeBulkModal: () => set({ showBulkModal: false }),
}))

// ============================================================================
// Run History Store
// ============================================================================

interface RunHistoryStore {
  historyPayoutId: string | null
  openRunHistory: (id: string) => void
  closeRunHistory: () => void
}

export const useRunHistoryStore = create<RunHistoryStore>(set => ({
  historyPayoutId: null,
  openRunHistory: (id: string) => set({ historyPayoutId: id }),
  closeRunHistory: () => set({ historyPayoutId: null }),
}))
