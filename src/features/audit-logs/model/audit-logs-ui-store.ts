import { createPaginationStoreWithActions } from '@/hooks/use-pagination-store'
import type { AuditLogCategory, AuditLogFilters, AuditLogStatus } from '../types/audit-log.types'

export const useAuditLogsUIStore = createPaginationStoreWithActions<
  AuditLogFilters,
  {
    setCategory: (category: AuditLogCategory) => void
    setStatus: (status?: AuditLogStatus) => void
    setDateFrom: (dateFrom: string) => void
    setDateTo: (dateTo: string) => void
    setMerchantFilter: (id: string, label: string) => void
  }
>(
  {
    category: 'auth',
    status: undefined,
    dateFrom: '',
    dateTo: '',
    merchantFilter: '',
    merchantFilterLabel: '',
    sort: 'created_at',
    order: 'desc',
  },
  set => ({
    setCategory: (category: AuditLogCategory) =>
      set(state => ({ ...state, filters: { ...state.filters, category, page: 1 } })),
    setStatus: (status?: AuditLogStatus) =>
      set(state => ({ ...state, filters: { ...state.filters, status, page: 1 } })),
    setDateFrom: (dateFrom: string) =>
      set(state => ({ ...state, filters: { ...state.filters, dateFrom, page: 1 } })),
    setDateTo: (dateTo: string) =>
      set(state => ({ ...state, filters: { ...state.filters, dateTo, page: 1 } })),
    setMerchantFilter: (merchantFilter: string, merchantFilterLabel: string) =>
      set(state => ({
        ...state,
        filters: { ...state.filters, merchantFilter, merchantFilterLabel, page: 1 },
      })),
  }),
)
