import { create } from 'zustand'

interface HeaderState {
  showSearch: boolean
  searchTerm: string
  setShowSearch: (val: boolean) => void
  setSearchTerm: (val: string) => void
  reset: () => void
}

export const useHeaderStore = create<HeaderState>(set => ({
  showSearch: false,
  searchTerm: '',
  setShowSearch: (val: boolean) => set({ showSearch: val }),
  setSearchTerm: (val: string) => set({ searchTerm: val }),
  reset: () => set({ showSearch: false, searchTerm: '' }),
}))
