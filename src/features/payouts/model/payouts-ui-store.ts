import { create } from 'zustand'
import { createPaginationStoreWithActions } from '@/hooks/use-pagination-store'
import type { PaginationFilters } from '@/lib/types/pagination.types'

// ============================================================================
// Pagination Store
// ============================================================================

interface PayoutFilters extends PaginationFilters {
  statusFilter: string
  paymentModeFilter: string
  dateFrom: string
  dateTo: string
}

export const usePayoutsPaginationStore = createPaginationStoreWithActions<
  PayoutFilters,
  {
    setStatusFilter: (status: string) => void
    setPaymentModeFilter: (mode: string) => void
    setDateFrom: (date: string) => void
    setDateTo: (date: string) => void
    clearFilters: () => void
  }
>({ statusFilter: '', paymentModeFilter: '', dateFrom: '', dateTo: '' }, set => ({
  setStatusFilter: (statusFilter: string) =>
    set(state => ({ ...state, filters: { ...state.filters, statusFilter, page: 1 } })),
  setPaymentModeFilter: (paymentModeFilter: string) =>
    set(state => ({ ...state, filters: { ...state.filters, paymentModeFilter, page: 1 } })),
  setDateFrom: (dateFrom: string) =>
    set(state => ({ ...state, filters: { ...state.filters, dateFrom, page: 1 } })),
  setDateTo: (dateTo: string) =>
    set(state => ({ ...state, filters: { ...state.filters, dateTo, page: 1 } })),
  clearFilters: () =>
    set(state => ({
      ...state,
      filters: {
        ...state.filters,
        search: '',
        statusFilter: '',
        paymentModeFilter: '',
        dateFrom: '',
        dateTo: '',
        page: 1,
      },
    })),
}))

// ============================================================================
// Modal Store
// ============================================================================

interface PayoutsModalStore {
  showCreateModal: boolean
  showBulkModal: boolean
  selectedPayoutId: string | null

  openCreateModal: () => void
  closeCreateModal: () => void
  openBulkModal: () => void
  closeBulkModal: () => void
  openDetailDrawer: (payoutId: string) => void
  closeDetailDrawer: () => void
}

export const usePayoutsModalStore = create<PayoutsModalStore>(set => ({
  showCreateModal: false,
  showBulkModal: false,
  selectedPayoutId: null,

  openCreateModal: () => set({ showCreateModal: true }),
  closeCreateModal: () => set({ showCreateModal: false }),
  openBulkModal: () => set({ showBulkModal: true }),
  closeBulkModal: () => set({ showBulkModal: false }),
  openDetailDrawer: (payoutId: string) => set({ selectedPayoutId: payoutId }),
  closeDetailDrawer: () => set({ selectedPayoutId: null }),
}))

// Backward compatibility
export const usePayoutsUIStore = usePayoutsModalStore
