import { useEffect, useState } from 'react'

/**
 * Debounced search hook — keeps a local value in sync with an external
 * store value, but delays pushing changes upstream by `delay` ms.
 *
 * @param storeValue  The current value from the Zustand / parent store
 * @param setStoreValue  Setter that pushes the value to the store (triggers API calls, etc.)
 * @param delay  Debounce delay in milliseconds (default 300)
 * @returns [localValue, setLocalValue] — bind these to the input
 *
 * @example
 * const [search, setSearchLocal] = useDebouncedSearch(filters.search, setSearch)
 * <Input value={search} onChange={e => setSearchLocal(e.target.value)} />
 */
export function useDebouncedSearch(
  storeValue: string,
  setStoreValue: (v: string) => void,
  delay = 300,
) {
  const [localValue, setLocalValue] = useState(storeValue)

  // Sync local ← store when the store value changes externally (e.g. clearFilters)
  useEffect(() => {
    setLocalValue(storeValue)
  }, [storeValue])

  // Debounce local → store
  useEffect(() => {
    if (localValue === storeValue) return
    const timer = setTimeout(() => {
      setStoreValue(localValue)
    }, delay)
    return () => clearTimeout(timer)
  }, [localValue, storeValue, setStoreValue, delay])

  return [localValue, setLocalValue] as const
}
