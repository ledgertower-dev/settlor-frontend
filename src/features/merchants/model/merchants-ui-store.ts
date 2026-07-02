import { createPaginationStoreWithActions } from '@/hooks/use-pagination-store'
import type { MerchantFilters, MerchantTab } from '../types'

type MerchantsUIActions = {
  setTab: (tab: MerchantTab) => void
}

export const useMerchantsUIStore = createPaginationStoreWithActions<
  MerchantFilters,
  MerchantsUIActions
>(
  {
    tab: 'approved',
  },
  set => ({
    setTab: (tab: MerchantTab) =>
      set(state => ({
        filters: {
          ...state.filters,
          tab,
          page: 1,
        },
      })),
  }),
)
