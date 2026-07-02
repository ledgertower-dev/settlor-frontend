'use client'

import { useCallback, useRef, useState } from 'react'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'

import { AppIcon } from '@/components/shared/app-icon'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/core/utils'

export interface SearchSelectOption {
  id: string
  label: string
  subtitle?: string
}

interface SearchSelectProps {
  /** Selected option id, or empty string for none. */
  value: string
  /** Display label for the currently selected option. */
  valueLabel: string
  /** Called with the picked option's (id, label); ('', '') means cleared. */
  onChange: (id: string, label: string) => void
  /** The list of options to display. */
  options: SearchSelectOption[]
  /** Whether options are currently loading. */
  isLoading?: boolean
  /** Placeholder text for the trigger button. */
  placeholder?: React.ReactNode
  /** Placeholder text for the search input. */
  searchPlaceholder?: string
  /** Message shown when no options match. */
  emptyMessage?: string
  /** Called when the search input changes (for server-side filtering). */
  onSearchChange?: (query: string) => void
  /** Whether the selected value can be cleared. */
  clearable?: boolean
  className?: string
  /** Extra classes for the popover dropdown. */
  popoverClassName?: string
  /** Set to true when used inside a modal (Sheet/Dialog). */
  modal?: boolean
  /** Disable the select trigger. */
  disabled?: boolean
  /** Called when the user scrolls near the bottom of the list. */
  onLoadMore?: () => void
  /** Whether there are more items to load. */
  hasMore?: boolean
  /** Whether the next page is currently loading. */
  isLoadingMore?: boolean
}

export function SearchSelect({
  value,
  valueLabel,
  onChange,
  options,
  isLoading = false,
  placeholder = 'Select option',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  onSearchChange,
  clearable = true,
  className,
  popoverClassName,
  modal = false,
  disabled = false,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = listRef.current
    if (!el || !hasMore || isLoadingMore || !onLoadMore) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      onLoadMore()
    }
  }, [hasMore, isLoadingMore, onLoadMore])

  const handleInputChange = (value: string) => {
    setInput(value)
    onSearchChange?.(value)
  }

  const handlePick = (id: string, label: string) => {
    onChange(id, label)
    setOpen(false)
    setInput('')
    onSearchChange?.('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('', '')
  }

  // Client-side filter when no onSearchChange (server-side) is provided
  const filtered =
    onSearchChange || !input.trim()
      ? options
      : options.filter(
          o =>
            o.label.toLowerCase().includes(input.toLowerCase()) ||
            o.subtitle?.toLowerCase().includes(input.toLowerCase()),
        )

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-select-list"
          disabled={disabled}
          className={cn(
            'flex h-12 w-[13.75rem] items-center justify-between rounded-md border-[0.5px] border-foreground/20 bg-secondary px-6 text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-ring data-[state=open]:ring-[1px] data-[state=open]:ring-ring/30',
            className,
          )}
        >
          <span className={cn('truncate text-sm capitalize', !value && 'text-muted-foreground')}>
            {value ? valueLabel : placeholder}
          </span>
          <span className="ml-2 flex shrink-0 items-center gap-1">
            {clearable && value && (
              <span
                role="button"
                aria-label="Clear selection"
                onClick={handleClear}
                className="rounded p-0.5 hover:bg-muted"
              >
                <AppIcon icon={X} color="muted" className="h-4 w-4" />
              </span>
            )}
            <AppIcon icon={ChevronsUpDown} color="muted" className="h-4 w-4" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-[260px] rounded-md border border-filter-border bg-card p-3.5 shadow-[0px_6px_18px_-8px_rgba(10,23,41,0.06)]',
          popoverClassName,
        )}
        align="start"
        sideOffset={6}
      >
        <div className="flex flex-col gap-4">
          {/* Search input */}
          <div className="flex items-center gap-2 rounded-md bg-search-bg px-3.5 py-3.5">
            <AppIcon icon={Search} size="sm" color="muted" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              autoFocus
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Results */}
          <div
            ref={listRef}
            id="search-select-list"
            onScroll={handleScroll}
            className="flex max-h-[240px] flex-col overflow-y-auto"
          >
            {isLoading && filtered.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">Searching...</p>
            ) : filtered.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
              <>
                {filtered.map(option => {
                  const isSelected = value === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handlePick(option.id, option.label)}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-2 rounded-[11px] py-2.5 px-3.5 text-left transition-colors hover:bg-accent',
                        isSelected && 'bg-accent',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium capitalize text-foreground">
                          {option.label}
                        </span>
                        {option.subtitle && (
                          <span className="block text-xs text-muted-foreground">
                            {option.subtitle}
                          </span>
                        )}
                      </div>
                      {isSelected && <AppIcon icon={Check} size="sm" color="default" />}
                    </button>
                  )
                })}
                {isLoadingMore && (
                  <p className="py-2 text-center text-sm text-muted-foreground">Loading more...</p>
                )}
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
