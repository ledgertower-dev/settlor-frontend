import { useEffect, useRef } from 'react'
import { useHeaderStore } from './use-header-store'

/**
 * Wires the global header search bar to a local store's setSearch action.
 * Shows the search input on mount, syncs typed text into the local store
 * with a 300 ms debounce, and resets the header on unmount.
 */
export function useHeaderSearch(setSearch: (term: string) => void) {
  const setShowSearch = useHeaderStore(s => s.setShowSearch)
  const searchTerm = useHeaderStore(s => s.searchTerm)
  const resetHeader = useHeaderStore(s => s.reset)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setShowSearch(true)
    return () => {
      resetHeader()
    }
  }, [setShowSearch, resetHeader])

  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [searchTerm, setSearch])
}
