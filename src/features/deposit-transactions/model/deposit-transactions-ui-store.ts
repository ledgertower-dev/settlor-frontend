import { create } from 'zustand'
import { createPaginationStoreWithActions } from '@/hooks/use-pagination-store'
import type { PaginationFilters } from '@/lib/types/pagination.types'
import type { Deposit } from '../types'

// ============================================================================
// Pagination Store
// ============================================================================

interface DepositTransactionFilters extends PaginationFilters {
  statusFilter: string
  merchantFilter: string
  merchantFilterLabel: string
  modeFilter: string
  dateFrom: string
  dateTo: string
}

export const useDepositTransactionsPaginationStore = createPaginationStoreWithActions<
  DepositTransactionFilters,
  {
    setStatusFilter: (status: string) => void
    setMerchantFilter: (id: string, label: string) => void
    setModeFilter: (mode: string) => void
    setDateFrom: (date: string) => void
    setDateTo: (date: string) => void
    clearFilters: () => void
  }
>(
  {
    statusFilter: '',
    merchantFilter: '',
    merchantFilterLabel: '',
    modeFilter: '',
    dateFrom: '',
    dateTo: '',
  },
  set => ({
    setStatusFilter: (statusFilter: string) =>
      set(state => ({ ...state, filters: { ...state.filters, statusFilter, page: 1 } })),
    setMerchantFilter: (merchantFilter: string, merchantFilterLabel: string) =>
      set(state => ({
        ...state,
        filters: { ...state.filters, merchantFilter, merchantFilterLabel, page: 1 },
      })),
    setModeFilter: (modeFilter: string) =>
      set(state => ({ ...state, filters: { ...state.filters, modeFilter, page: 1 } })),
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
          merchantFilter: '',
          merchantFilterLabel: '',
          modeFilter: '',
          dateFrom: '',
          dateTo: '',
          page: 1,
        },
      })),
  }),
)

// ============================================================================
// Panel Store (detail sheet + create modal)
// ============================================================================

interface DepositTransactionsPanelStore {
  viewingDeposit: Deposit | null
  revertFormOpen: boolean
  createDepositOpen: boolean

  setViewingDeposit: (deposit: Deposit | null) => void
  setRevertFormOpen: (open: boolean) => void
  openCreateDeposit: () => void
  closeCreateDeposit: () => void
}

export const useDepositTransactionsPanelStore = create<DepositTransactionsPanelStore>(set => ({
  viewingDeposit: null,
  revertFormOpen: false,
  createDepositOpen: false,

  setViewingDeposit: (viewingDeposit: Deposit | null) =>
    set({ viewingDeposit, revertFormOpen: false }),
  setRevertFormOpen: (revertFormOpen: boolean) => set({ revertFormOpen }),
  openCreateDeposit: () => set({ createDepositOpen: true }),
  closeCreateDeposit: () => set({ createDepositOpen: false }),
}))

// Backward compatibility
export const useDepositTransactionsUIStore = useDepositTransactionsPanelStore
