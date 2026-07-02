'use client'

import { useRef, useState, type ReactNode } from 'react'
import { format, startOfDay, subDays } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/core/utils'
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'

const FULL_PRESETS = [
  { value: 'all', label: 'All', fixedWidth: true },
  { value: 'today', label: 'Today', fixedWidth: true },
  { value: 'yesterday', label: 'Yesterday', fixedWidth: true },
  { value: 'last-7-days', label: 'Last 7 days', fixedWidth: false },
] as const

const MINIMAL_PRESETS = [{ value: 'today', label: 'Today', fixedWidth: false }] as const

export interface DateFilterValue {
  preset: string
  from?: string
  to?: string
}

interface DashboardDateFilterProps {
  className?: string
  variant?: 'full' | 'minimal'
  onChange?: (value: DateFilterValue) => void
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function resolvePreset(preset: string): { from?: string; to?: string } {
  const today = startOfDay(new Date())
  switch (preset) {
    case 'today':
      return { from: toDateString(today), to: toDateString(today) }
    case 'yesterday': {
      const yesterday = subDays(today, 1)
      return { from: toDateString(yesterday), to: toDateString(yesterday) }
    }
    case 'last-7-days':
      return { from: toDateString(subDays(today, 6)), to: toDateString(today) }
    case 'all':
    default:
      return {}
  }
}

export function DashboardDateFilter({
  className,
  variant = 'full',
  onChange,
}: DashboardDateFilterProps) {
  const presets = variant === 'minimal' ? MINIMAL_PRESETS : FULL_PRESETS
  const defaultSelected = variant === 'minimal' ? 'today' : 'today'
  const clearDefault = variant === 'minimal' ? 'today' : 'all'

  const [selected, setSelected] = useState(defaultSelected)
  const [range, setRange] = useState<DateRange | undefined>(undefined)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const ignoreCloseRef = useRef(false)

  const handlePresetClick = (value: string) => {
    setSelected(value)
    setRange(undefined)
    const resolved = resolvePreset(value)
    onChange?.({ preset: value, ...resolved })
  }

  const handleRangeSelect = (newRange: DateRange | undefined) => {
    setRange(newRange)
    if (newRange?.from && newRange?.to) {
      setSelected('custom')
    }
  }

  const handlePopoverChange = (open: boolean) => {
    if (!open && ignoreCloseRef.current) return
    setPopoverOpen(open)
  }

  const handleApply = () => {
    if (range?.from && range?.to) {
      onChange?.({
        preset: 'custom',
        from: toDateString(range.from),
        to: toDateString(range.to),
      })
    }
    setPopoverOpen(false)
  }

  const handleClear = () => {
    setRange(undefined)
    setSelected(clearDefault)
    setPopoverOpen(false)
    const resolved = resolvePreset(clearDefault)
    onChange?.({ preset: clearDefault, ...resolved })
  }

  const customLabel =
    selected === 'custom' && range?.from && range?.to
      ? `${format(range.from, 'dd/MM/yy')} - ${format(range.to, 'dd/MM/yy')}`
      : 'Select date range'

  const calendarPopover = (trigger: ReactNode) => (
    <Popover open={popoverOpen} onOpenChange={handlePopoverChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar mode="range" selected={range} onSelect={handleRangeSelect} numberOfMonths={1} />
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
          <Button size="sm" disabled={!range?.from || !range?.to} onClick={handleApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )

  // Breakdown card — a single bordered "Select date range" button.
  if (variant === 'minimal') {
    return calendarPopover(
      <button
        type="button"
        className={cn(
          'flex h-11 items-center gap-2.5 rounded-md border border-input bg-card px-4 text-sm text-foreground outline-none',
          className,
        )}
      >
        <AppIcon icon={CalendarIcon} className="size-5 text-muted-foreground" />
        <span className="whitespace-nowrap">{customLabel}</span>
        <ChevronDown className="size-4 text-muted-foreground" strokeWidth={1.5} />
      </button>,
    )
  }

  // Full filter — white pill bar with a dark active pill.
  return (
    <div
      className={cn(
        'scrollbar-none flex items-center gap-1 overflow-x-auto rounded-full border border-transparent bg-card px-2 py-2 shadow-[var(--shadow-card)] dark:border-input',
        className,
      )}
    >
      {presets.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => handlePresetClick(option.value)}
          className={cn(
            'flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-5 text-sm transition-colors',
            selected === option.value
              ? 'bg-tab-active font-medium text-tab-active-foreground'
              : 'text-foreground hover:bg-accent/50',
          )}
        >
          {option.label}
        </button>
      ))}

      {calendarPopover(
        <button
          type="button"
          className={cn(
            'flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm outline-none transition-colors',
            selected === 'custom'
              ? 'bg-tab-active font-medium text-tab-active-foreground'
              : 'text-foreground hover:bg-accent/50',
          )}
        >
          <span>{customLabel}</span>
          <AppIcon
            icon={CalendarIcon}
            className={cn(
              'size-5',
              selected === 'custom' ? 'text-tab-active-foreground' : 'text-foreground',
            )}
          />
        </button>,
      )}
    </div>
  )
}
