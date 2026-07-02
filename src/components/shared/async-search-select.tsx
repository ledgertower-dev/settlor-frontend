'use client'

import { useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'

import { SearchSelect } from './search-select'
import type { SearchSelectOption } from './search-select'

interface PaginatedResult<T> {
  data: { items: T[] }
  meta: { pagination: { page: number; totalPages: number } }
}

interface AsyncSearchSelectProps<T> {
  /** Selected option id, or empty string for none. */
  value: string
  /** Display label for the currently selected option. */
  valueLabel: string
  /** Called with the picked option's (id, label); ('', '') means cleared. */
  onChange: (id: string, label: string) => void
  /** React Query key array. The debounced search param is appended internally. */
  queryKey: readonly unknown[]
  /** Fetch function called with page number and optional search query. */
  queryFn: (params: { page: number; q?: string; per_page: number }) => Promise<PaginatedResult<T>>
  /** Transform each fetched item into a select option. */
  mapOption: (item: T) => SearchSelectOption
  /** Items per page (default 15). */
  perPage?: number
  /** Stale time in ms (default 30000). */
  staleTime?: number
  className?: string
  popoverClassName?: string
  modal?: boolean
  placeholder?: React.ReactNode
  searchPlaceholder?: string
  emptyMessage?: string
  clearable?: boolean
  disabled?: boolean
}

export function AsyncSearchSelect<T>({
  value,
  valueLabel,
  onChange,
  queryKey,
  queryFn,
  mapOption,
  perPage = 15,
  staleTime = 30_000,
  className,
  popoverClassName,
  modal = false,
  placeholder = 'Select option',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  clearable,
  disabled,
}: AsyncSearchSelectProps<T>) {
  const [searchQ, setSearchQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQ.trim()), 300)
    return () => clearTimeout(t)
  }, [searchQ])

  const { data, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [...queryKey, { q: debouncedQ || undefined, per_page: perPage }, 'infinite'],
    queryFn: ({ pageParam }) =>
      queryFn({ page: pageParam, q: debouncedQ || undefined, per_page: perPage }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const { page, totalPages } = lastPage.meta.pagination
      return page < totalPages ? page + 1 : undefined
    },
    staleTime,
  })

  const options = useMemo(
    () => (data?.pages ?? []).flatMap(page => page.data.items.map(mapOption)),
    [data, mapOption],
  )

  return (
    <SearchSelect
      value={value}
      valueLabel={valueLabel}
      onChange={onChange}
      options={options}
      isLoading={isFetching && !isFetchingNextPage}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      onSearchChange={setSearchQ}
      className={className}
      popoverClassName={popoverClassName}
      modal={modal}
      clearable={clearable}
      disabled={disabled}
      onLoadMore={() => fetchNextPage()}
      hasMore={!!hasNextPage}
      isLoadingMore={isFetchingNextPage}
    />
  )
}
