import { create } from 'zustand'
import type { AdjustmentLogFilters } from '../types'

interface WalletAdjustmentsUIState {
  // Adjustment log table filters
  filters: AdjustmentLogFilters
  setPage: (page: number) => void
  setPerPage: (perPage: number) => void

  // Drawer state
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void

  // Drawer form: selected merchant + wallet
  selectedMerchantId: string
  selectedMerchantLabel: string
  selectedWalletId: string | null
  setMerchant: (id: string, label: string) => void
  setWallet: (walletId: string | null) => void

  reset: () => void
}

const DEFAULT_FILTERS: AdjustmentLogFilters = {
  page: 1,
  perPage: 15,
}

export const useWalletAdjustmentsUIStore = create<WalletAdjustmentsUIState>(set => ({
  filters: DEFAULT_FILTERS,
  drawerOpen: false,
  selectedMerchantId: '',
  selectedMerchantLabel: '',
  selectedWalletId: null,

  setPage: (page: number) => set(state => ({ filters: { ...state.filters, page } })),

  setPerPage: (perPage: number) =>
    set(state => ({ filters: { ...state.filters, perPage, page: 1 } })),

  openDrawer: () =>
    set({
      drawerOpen: true,
      selectedMerchantId: '',
      selectedMerchantLabel: '',
      selectedWalletId: null,
    }),

  closeDrawer: () =>
    set({
      drawerOpen: false,
      selectedMerchantId: '',
      selectedMerchantLabel: '',
      selectedWalletId: null,
    }),

  setMerchant: (id: string, label: string) =>
    set({
      selectedMerchantId: id,
      selectedMerchantLabel: label,
      selectedWalletId: null,
    }),

  setWallet: (walletId: string | null) => set({ selectedWalletId: walletId }),

  reset: () =>
    set({
      filters: DEFAULT_FILTERS,
      drawerOpen: false,
      selectedMerchantId: '',
      selectedMerchantLabel: '',
      selectedWalletId: null,
    }),
}))
