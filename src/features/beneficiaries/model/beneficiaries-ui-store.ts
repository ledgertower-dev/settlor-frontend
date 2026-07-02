import { create } from 'zustand'
import { createPaginationStore } from '@/hooks/use-pagination-store'
import type { Beneficiary } from '../types'

// ============================================================================
// Pagination Store
// ============================================================================

export const useBeneficiariesPaginationStore = createPaginationStore()

// ============================================================================
// Modal Store
// ============================================================================

interface BeneficiariesModalStore {
  showCreateDrawer: boolean
  editBeneficiary: Beneficiary | null
  deleteTarget: Beneficiary | null
  openCreateDrawer: () => void
  openEditDrawer: (b: Beneficiary) => void
  closeDrawer: () => void
  openDeleteConfirm: (b: Beneficiary) => void
  closeDeleteConfirm: () => void
}

export const useBeneficiariesModalStore = create<BeneficiariesModalStore>(set => ({
  showCreateDrawer: false,
  editBeneficiary: null,
  deleteTarget: null,
  openCreateDrawer: () => set({ showCreateDrawer: true, editBeneficiary: null }),
  openEditDrawer: (b: Beneficiary) => set({ showCreateDrawer: true, editBeneficiary: b }),
  closeDrawer: () => set({ showCreateDrawer: false, editBeneficiary: null }),
  openDeleteConfirm: (b: Beneficiary) => set({ deleteTarget: b }),
  closeDeleteConfirm: () => set({ deleteTarget: null }),
}))
