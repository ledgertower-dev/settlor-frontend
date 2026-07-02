import { create } from 'zustand'
import {
  DEFAULT_PAGINATION,
  type PaginationFilters,
  type PaginationStore,
} from '@/lib/types/pagination.types'

/**
 * Create a pagination store with Zustand
 * Provides reusable pagination state management with auto-reset to page 1
 *
 * @param additionalFilters Additional filter fields specific to the feature
 * @returns Zustand store hook
 *
 * @example
 * // Basic usage
 * interface UserFilters extends PaginationFilters {
 *   status?: 'active' | 'inactive'
 * }
 *
 * export const useUsersUIStore = createPaginationStore<UserFilters>({
 *   status: undefined
 * })
 *
 * // In component
 * const { filters, setPage, setSearch, resetFilters } = useUsersUIStore()
 */
export function createPaginationStore<TFilters extends PaginationFilters = PaginationFilters>(
  additionalFilters?: Partial<Omit<TFilters, 'search' | 'page' | 'perPage'>>,
) {
  const defaultFilters = {
    ...DEFAULT_PAGINATION,
    ...(additionalFilters || {}),
  } as TFilters

  return create<PaginationStore<TFilters>>(set => ({
    filters: defaultFilters,

    setPage: (page: number) => {
      set(state => ({
        filters: {
          ...state.filters,
          page,
        },
      }))
    },

    setPerPage: (perPage: number) => {
      set(state => ({
        filters: {
          ...state.filters,
          perPage,
          page: 1, // Reset to page 1 when changing perPage
        },
      }))
    },

    setSearch: (search: string) => {
      set(state => ({
        filters: {
          ...state.filters,
          search,
          page: 1, // Reset to page 1 when searching
        },
      }))
    },

    setSort: (sort: string, sortOrder: 'asc' | 'desc') => {
      set(state => ({
        filters: {
          ...state.filters,
          sort,
          sortOrder,
          page: 1, // Reset to page 1 when changing sort
        },
      }))
    },

    resetFilters: () => {
      set({ filters: defaultFilters })
    },
  }))
}

/**
 * Create a pagination store with custom filter setters
 * Use this when you need additional filter-specific setter methods
 *
 * @param defaultFilters Default filter values
 * @param customActions Additional actions beyond standard pagination
 * @returns Zustand store hook
 *
 * @example
 * interface StoreFilters extends PaginationFilters {
 *   isActive?: boolean
 * }
 *
 * interface StoreActions {
 *   setIsActive: (isActive: boolean | undefined) => void
 * }
 *
 * export const useStoresUIStore = createPaginationStoreWithActions<
 *   StoreFilters,
 *   StoreActions
 * >(
 *   { isActive: undefined },
 *   (set) => ({
 *     setIsActive: (isActive) => set((state) => ({
 *       filters: { ...state.filters, isActive, page: 1 }
 *     }))
 *   })
 * )
 */
export function createPaginationStoreWithActions<
  TFilters extends PaginationFilters = PaginationFilters,
  TActions extends Record<string, (...args: any[]) => void> = Record<string, never>,
>(
  additionalFilters?: Partial<Omit<TFilters, 'search' | 'page' | 'perPage'>>,
  customActions?: (
    set: (
      partial:
        | Partial<PaginationStore<TFilters> & TActions>
        | ((
            state: PaginationStore<TFilters> & TActions,
          ) => Partial<PaginationStore<TFilters> & TActions>),
    ) => void,
  ) => TActions,
) {
  const defaultFilters = {
    ...DEFAULT_PAGINATION,
    ...(additionalFilters || {}),
  } as TFilters

  return create<PaginationStore<TFilters> & TActions>(set => ({
    filters: defaultFilters,

    setPage: (page: number) => {
      set(state => ({
        ...state,
        filters: {
          ...state.filters,
          page,
        },
      }))
    },

    setPerPage: (perPage: number) => {
      set(state => ({
        ...state,
        filters: {
          ...state.filters,
          perPage,
          page: 1,
        },
      }))
    },

    setSearch: (search: string) => {
      set(state => ({
        ...state,
        filters: {
          ...state.filters,
          search,
          page: 1,
        },
      }))
    },

    setSort: (sort: string, sortOrder: 'asc' | 'desc') => {
      set(state => ({
        ...state,
        filters: {
          ...state.filters,
          sort,
          sortOrder,
          page: 1,
        },
      }))
    },

    resetFilters: () => {
      set({ filters: defaultFilters } as Partial<PaginationStore<TFilters> & TActions>)
    },

    ...(customActions ? customActions(set) : ({} as TActions)),
  }))
}
