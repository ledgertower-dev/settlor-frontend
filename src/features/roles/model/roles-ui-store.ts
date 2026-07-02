import { create } from 'zustand'
import { createPaginationStore } from '@/hooks/use-pagination-store'
import type { PaginationFilters } from '@/lib/types/pagination.types'

/**
 * Roles Pagination Store
 *
 * Manages pagination, search, and sorting state for the roles list
 */
export const useRolesPaginationStore = createPaginationStore<PaginationFilters>()

/**
 * Roles Modal Store
 *
 * Manages modal visibility and selected role state separately from pagination
 * This keeps modal state independent from list filtering/pagination
 *
 * NOTE: This store manages UI state only, not server data.
 * Server data is managed by React Query hooks in use-roles.ts.
 */
interface RolesModalStore {
  // Modal states
  createModalOpen: boolean
  editModalOpen: boolean
  deleteDialogOpen: boolean

  // Selected role ID
  selectedRoleId: string | null

  // Form/editing states
  isEditingDetails: boolean
  permissionChanges: Record<string, boolean> // Track permission checkbox changes

  // Actions
  openCreateModal: () => void
  closeCreateModal: () => void
  openEditModal: (roleId: string) => void
  closeEditModal: () => void
  openDeleteDialog: (roleId: string) => void
  closeDeleteDialog: () => void
  setEditingDetails: (editing: boolean) => void
  setPermissionChanges: (changes: Record<string, boolean>) => void
  resetPermissionChanges: () => void
  clearSelection: () => void
}

export const useRolesModalStore = create<RolesModalStore>(set => ({
  // Initial State
  createModalOpen: false,
  editModalOpen: false,
  deleteDialogOpen: false,
  selectedRoleId: null,
  isEditingDetails: false,
  permissionChanges: {},

  // Modal Actions
  openCreateModal: () => {
    set({ createModalOpen: true })
  },

  closeCreateModal: () => {
    set({ createModalOpen: false })
  },

  openEditModal: (roleId: string) => {
    set({
      editModalOpen: true,
      selectedRoleId: roleId,
      isEditingDetails: false,
      permissionChanges: {},
    })
  },

  closeEditModal: () => {
    set({
      editModalOpen: false,
      selectedRoleId: null,
      isEditingDetails: false,
      permissionChanges: {},
    })
  },

  openDeleteDialog: (roleId: string) => {
    set({
      deleteDialogOpen: true,
      selectedRoleId: roleId,
    })
  },

  closeDeleteDialog: () => {
    set({
      deleteDialogOpen: false,
      selectedRoleId: null,
    })
  },

  // Editing State Actions
  setEditingDetails: (editing: boolean) => {
    set({ isEditingDetails: editing })
  },

  setPermissionChanges: (changes: Record<string, boolean>) => {
    set({ permissionChanges: changes })
  },

  resetPermissionChanges: () => {
    set({ permissionChanges: {} })
  },

  clearSelection: () => {
    set({
      selectedRoleId: null,
      isEditingDetails: false,
      permissionChanges: {},
    })
  },
}))

// Backward compatibility export (for existing code that uses useRolesUIStore)
export const useRolesUIStore = useRolesModalStore
