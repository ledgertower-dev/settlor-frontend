'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/core'

export interface SearchInputProps {
  /** Current search value */
  value: string
  /** Called when search value changes (debounced) */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Debounce delay in milliseconds */
  debounceMs?: number
  /** Optional className for the wrapper */
  className?: string
  /** Show loading indicator */
  isLoading?: boolean
}

/**
 * Debounced search input component
 * Automatically debounces input changes to reduce API calls
 *
 * @example
 * <SearchInput
 *   value={filters.search}
 *   onChange={setSearch}
 *   placeholder="Search users..."
 *   isLoading={isLoading}
 * />
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
  isLoading = false,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)

  // Sync local value with prop value when it changes externally
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Debounce the onChange callback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localValue, value, onChange, debounceMs])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
  }

  return (
    <div className={cn('relative', className)}>
      <AppIcon
        icon={Search}
        color="muted"
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
      />
      <Input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className="pl-9 pr-9"
      />
      {(localValue || isLoading) && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-4 w-4 p-0 hover:bg-transparent"
            >
              <AppIcon icon={X} color="muted" className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
