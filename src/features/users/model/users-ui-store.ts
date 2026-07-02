import { create } from 'zustand'
import { createPaginationStoreWithActions } from '@/hooks/use-pagination-store'
import type { PaginationFilters } from '@/lib/types/pagination.types'
import type { User } from '@/lib/types/api-types'

/**
 * Users Tab & Pagination Store
 *
 * Manages tab, pagination, and search state for the users list
 */
export type UserTab = 'active' | 'blocked'

interface UsersPaginationFilters extends PaginationFilters {
  tab: UserTab
}

type UsersPaginationActions = {
  setTab: (tab: UserTab) => void
}

export const useUsersPaginationStore = createPaginationStoreWithActions<
  UsersPaginationFilters,
  UsersPaginationActions
>(
  {
    tab: 'active',
  },
  set => ({
    setTab: (tab: UserTab) =>
      set(state => ({
        filters: {
          ...state.filters,
          tab,
          page: 1,
        },
      })),
  }),
)

/**
 * Users Modal Store
 *
 * Manages modal visibility and selected user state
 */
type ModalType = 'create' | 'view' | 'edit' | 'manage-teams' | 'manage-roles' | 'temp-password'

interface TempPasswordData {
  password: string
  userId: string
  userName: string
}

interface UsersModalStore {
  openModal: ModalType | null
  selectedUser: User | null
  tempPasswordData: TempPasswordData | null

  openCreateModal: () => void
  openViewModal: (user: User) => void
  openEditModal: (user: User) => void
  openTempPasswordModal: (data: TempPasswordData) => void
  closeModal: () => void
  clearTempPassword: () => void
}

export const useUsersModalStore = create<UsersModalStore>(set => ({
  openModal: null,
  selectedUser: null,
  tempPasswordData: null,

  openCreateModal: () =>
    set({
      openModal: 'create',
      selectedUser: null,
    }),

  openViewModal: (user: User) =>
    set({
      openModal: 'view',
      selectedUser: user,
    }),

  openEditModal: (user: User) =>
    set({
      openModal: 'edit',
      selectedUser: user,
    }),

  openTempPasswordModal: (data: TempPasswordData) =>
    set({
      openModal: 'temp-password',
      tempPasswordData: data,
    }),

  closeModal: () =>
    set({
      openModal: null,
      selectedUser: null,
    }),

  clearTempPassword: () =>
    set({
      tempPasswordData: null,
    }),
}))

// Backward compatibility export
export const useUsersUIStore = useUsersModalStore
