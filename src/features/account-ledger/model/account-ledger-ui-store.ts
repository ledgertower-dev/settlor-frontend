import { createPaginationStoreWithActions } from '@/hooks/use-pagination-store'
import type { PaginationFilters } from '@/lib/types/pagination.types'

interface LedgerFilters extends PaginationFilters {
  /** Active tab — 'payout' | 'deposit' | 'all'. */
  tab: string
  merchantFilter: string
  merchantFilterLabel: string
  providerFilter: string
  providerFilterLabel: string
  dateFrom: string
  dateTo: string
}

export const useAccountLedgerPaginationStore = createPaginationStoreWithActions<
  LedgerFilters,
  {
    setTab: (tab: string) => void
    setMerchantFilter: (id: string, label: string) => void
    setProviderFilter: (id: string, label: string) => void
    setDateFrom: (date: string) => void
    setDateTo: (date: string) => void
    clearFilters: () => void
  }
>(
  {
    tab: 'payout',
    merchantFilter: '',
    merchantFilterLabel: '',
    providerFilter: '',
    providerFilterLabel: '',
    dateFrom: '',
    dateTo: '',
  },
  set => ({
    setTab: (tab: string) =>
      set(state => ({ ...state, filters: { ...state.filters, tab, page: 1 } })),
    setMerchantFilter: (merchantFilter: string, merchantFilterLabel: string) =>
      set(state => ({
        ...state,
        filters: { ...state.filters, merchantFilter, merchantFilterLabel, page: 1 },
      })),
    setProviderFilter: (providerFilter: string, providerFilterLabel: string) =>
      set(state => ({
        ...state,
        filters: { ...state.filters, providerFilter, providerFilterLabel, page: 1 },
      })),
    setDateFrom: (dateFrom: string) =>
      set(state => ({ ...state, filters: { ...state.filters, dateFrom, page: 1 } })),
    setDateTo: (dateTo: string) =>
      set(state => ({ ...state, filters: { ...state.filters, dateTo, page: 1 } })),
    clearFilters: () =>
      set(state => ({
        ...state,
        filters: {
          ...state.filters,
          merchantFilter: '',
          merchantFilterLabel: '',
          providerFilter: '',
          providerFilterLabel: '',
          dateFrom: '',
          dateTo: '',
          page: 1,
        },
      })),
  }),
)
