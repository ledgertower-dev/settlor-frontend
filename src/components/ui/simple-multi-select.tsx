'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X, Search } from 'lucide-react'

import { cn } from '@/lib/core/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { logger } from '@/lib/core/logger'

export interface MultiSelectOption {
  label: string
  value: string
  description?: string
}

interface SimpleMultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  /** Optional callback for backend search - if provided, disables client-side filtering */
  onSearchChange?: (search: string) => void
  /** Show loading indicator during backend search */
  isSearchLoading?: boolean
}

export function SimpleMultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  className,
  disabled = false,
  onSearchChange,
  isSearchLoading = false,
}: SimpleMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const handleUnselect = (item: string) => {
    onChange(selected.filter(s => s !== item))
  }

  const handleSelect = (option: MultiSelectOption) => {
    logger.debug('SimpleMultiSelect selecting', { label: option.label, value: option.value })
    const isSelected = selected.includes(option.value)
    if (isSelected) {
      onChange(selected.filter(item => item !== option.value))
    } else {
      onChange([...selected, option.value])
    }
  }

  // Debounce backend search
  React.useEffect(() => {
    if (onSearchChange) {
      const timer = setTimeout(() => {
        onSearchChange(search)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [search, onSearchChange])

  // Use backend search if callback provided, otherwise client-side filter
  const filteredOptions = onSearchChange
    ? options
    : options.filter(
        option =>
          option.label.toLowerCase().includes(search.toLowerCase()) ||
          option.description?.toLowerCase().includes(search.toLowerCase()),
      )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between text-left font-normal min-h-10',
            !selected.length && 'text-muted-foreground',
            className,
          )}
          disabled={disabled}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.length === 0 && placeholder}
            {selected.map(item => {
              const option = options.find(option => option.value === item)
              return (
                <Badge
                  variant="secondary"
                  key={item}
                  className="mr-1 mb-1"
                  onClick={e => {
                    e.stopPropagation()
                    handleUnselect(item)
                  }}
                >
                  {option?.label}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus-visible:ring-[1px] focus-visible:ring-ring/30"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleUnselect(item)
                      }
                    }}
                    onMouseDown={e => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleUnselect(item)
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              )
            })}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2">
          <div className="flex items-center border rounded-md px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {isSearchLoading && (
              <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            )}
          </div>
        </div>
        <div className="max-h-64 overflow-auto">
          {isSearchLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
          ) : filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No items found.</div>
          ) : (
            filteredOptions.map(option => (
              <div
                key={option.value}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleSelect(option)}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selected.includes(option.value) ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
