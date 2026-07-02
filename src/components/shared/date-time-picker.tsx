'use client'

import * as React from 'react'
import { format, isValid, parse } from 'date-fns'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'

import { cn } from '@/lib/core/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const fieldStyles =
  'flex h-12 w-full items-center justify-between gap-2 rounded-md border-[0.4px] border-foreground/40 bg-secondary px-6 text-sm outline-none data-[state=open]:border-ring data-[state=open]:ring-[1px] data-[state=open]:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50'

const DATE_FORMAT = 'yyyy-MM-dd'

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined
  const parsed = parse(value, DATE_FORMAT, new Date())
  return isValid(parsed) ? parsed : undefined
}

interface DatePickerProps {
  /** Value as `yyyy-MM-dd` (same format as native `<input type="date">`). */
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

/** Single-date picker built on the shadcn Calendar (same component used by the date-range filters). */
export function DatePicker({
  value,
  onChange,
  disabled,
  placeholder = 'Select date',
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = parseDate(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={placeholder}
          className={cn(fieldStyles, className)}
        >
          <span className={cn('whitespace-nowrap', !selected && 'text-muted-foreground')}>
            {selected ? format(selected, 'dd MMM yyyy') : placeholder}
          </span>
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={date => {
            onChange(date ? format(date, DATE_FORMAT) : '')
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')) // 01..12
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
const PERIODS = ['AM', 'PM']

type Period = 'AM' | 'PM'

/** Split a 24h `HH:mm` value into 12-hour display parts. Empty parts when unset/invalid. */
function to12h(value?: string): { hour: string; minute: string; period: Period | '' } {
  const [hhRaw, mmRaw] = (value ?? '').split(':')
  const h24 = Number(hhRaw)
  if (!hhRaw || mmRaw === undefined || Number.isNaN(h24)) {
    return { hour: '', minute: mmRaw ?? '', period: '' }
  }
  const period: Period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return { hour: h12.toString().padStart(2, '0'), minute: mmRaw, period }
}

/** Combine 12-hour parts back into a 24h `HH:mm` value. */
function to24h(hour: string, minute: string, period: Period): string {
  const h12 = Number(hour)
  const h24 = period === 'PM' ? (h12 === 12 ? 12 : h12 + 12) : h12 === 12 ? 0 : h12
  return `${h24.toString().padStart(2, '0')}:${minute}`
}

interface TimePickerProps {
  /** Value as 24-hour `HH:mm` (same format as native `<input type="time">`). */
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

/** 12-hour time picker — hour, minute and AM/PM columns in a single shadcn Popover. */
export function TimePicker({ value, onChange, disabled, className }: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  // When opened without a value we *preview* the current time (highlighted + centred)
  // but don't commit it — the field only changes once the user actually picks something.
  const [nowPreview, setNowPreview] = React.useState('')

  React.useEffect(() => {
    if (!open) {
      setNowPreview('')
      return
    }
    if (!value) {
      const now = new Date()
      const hh = now.getHours().toString().padStart(2, '0')
      const mm = now.getMinutes().toString().padStart(2, '0')
      setNowPreview(`${hh}:${mm}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const committed = to12h(value) // drives the trigger text — stays empty until the user picks
  const display = to12h(value || nowPreview) // drives column highlight + centring

  const setHour = (next: string) =>
    onChange(to24h(next, display.minute || '00', display.period || 'AM'))
  const setMinute = (next: string) =>
    onChange(to24h(display.hour || '12', next, display.period || 'AM'))
  const setPeriod = (next: Period) =>
    onChange(to24h(display.hour || '12', display.minute || '00', next))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="Select time"
          className={cn(fieldStyles, className)}
        >
          <span
            className={cn(
              'whitespace-nowrap tabular-nums',
              !committed.period && 'text-muted-foreground',
            )}
          >
            {committed.period
              ? `${committed.hour}:${committed.minute} ${committed.period}`
              : '--:-- --'}
          </span>
          <Clock className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex h-60 divide-x">
          <TimeColumn
            label="Hour"
            options={HOURS_12}
            selected={display.hour}
            open={open}
            loop
            onSelect={setHour}
          />
          <TimeColumn
            label="Minute"
            options={MINUTES}
            selected={display.minute}
            open={open}
            loop
            onSelect={setMinute}
          />
          <TimeColumn
            label="AM/PM"
            options={PERIODS}
            selected={display.period}
            open={open}
            onSelect={v => setPeriod(v as Period)}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

const ITEM_HEIGHT = 36 // px — must match the button height (h-9) below
const LOOP_COPIES = 3 // middle band + one buffer above/below; wrap recovers any overshoot

interface TimeColumnProps {
  label: string
  options: string[]
  selected: string
  open: boolean
  /** Repeat the list so it scrolls endlessly (e.g. 12 -> 01, 59 -> 00). */
  loop?: boolean
  onSelect: (value: string) => void
}

function TimeColumn({ label, options, selected, open, loop = false, onSelect }: TimeColumnProps) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const listId = React.useId()
  const cycleHeight = options.length * ITEM_HEIGHT
  // For looping we render LOOP_COPIES bands and keep the scroll position parked
  // in the middle band, jumping back by one cycle whenever it drifts to an edge.
  const bands = loop ? LOOP_COPIES : 1
  const midBand = Math.floor(bands / 2)

  const keepCentred = React.useCallback(() => {
    const list = listRef.current
    if (!list || !loop) return
    // Loop until back inside the middle band — handles any scroll delta (fast
    // flings included) in one synchronous step, before the browser paints.
    while (list.scrollTop < cycleHeight) list.scrollTop += cycleHeight
    while (list.scrollTop >= cycleHeight * (bands - 1)) list.scrollTop -= cycleHeight
  }, [loop, cycleHeight, bands])

  const scrollToIndex = React.useCallback(
    (index: number) => {
      const list = listRef.current
      if (!list || index < 0) return
      list.scrollTop =
        cycleHeight * midBand + index * ITEM_HEIGHT - list.clientHeight / 2 + ITEM_HEIGHT / 2
      keepCentred()
    },
    [cycleHeight, midBand, keepCentred],
  )

  // Centre the selected value once per open — as soon as a valid selection exists
  // (the current-time preview is applied right after the popover opens).
  const centeredRef = React.useRef(false)
  React.useEffect(() => {
    if (!open) {
      centeredRef.current = false
      return
    }
    if (centeredRef.current) return
    const index = options.indexOf(selected)
    if (index < 0) return
    scrollToIndex(index)
    centeredRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selected])

  // Manual wheel + touch handling — the drawer's scroll-lock (react-remove-scroll)
  // swallows these events on the portalled popover, so we drive the scroll ourselves.
  React.useEffect(() => {
    const list = listRef.current
    if (!list) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      list.scrollTop += e.deltaY
      keepCentred()
    }

    let lastTouchY = 0
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? lastTouchY
      e.preventDefault()
      list.scrollTop += lastTouchY - y
      lastTouchY = y
      keepCentred()
    }

    list.addEventListener('wheel', onWheel, { passive: false })
    list.addEventListener('touchstart', onTouchStart, { passive: true })
    list.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      list.removeEventListener('wheel', onWheel)
      list.removeEventListener('touchstart', onTouchStart)
      list.removeEventListener('touchmove', onTouchMove)
    }
  }, [keepCentred])

  // Keyboard support — the column is a single tab stop (listbox); arrows move the value.
  const move = (delta: number) => {
    const current = options.indexOf(selected)
    const from = current < 0 ? 0 : current
    const next = (from + delta + options.length) % options.length
    onSelect(options[next])
    scrollToIndex(next)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        move(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        move(-1)
        break
      case 'Home':
        e.preventDefault()
        onSelect(options[0])
        scrollToIndex(0)
        break
      case 'End':
        e.preventDefault()
        onSelect(options[options.length - 1])
        scrollToIndex(options.length - 1)
        break
    }
  }

  const rendered = loop
    ? Array.from({ length: bands }).flatMap((_, band) =>
        options.map(option => ({ option, band, key: `${band}-${option}` })),
      )
    : options.map(option => ({ option, band: 0, key: option }))

  const activeId = selected ? `${listId}-${midBand}-${selected}` : undefined

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label={label}
      aria-activedescendant={activeId}
      tabIndex={0}
      onScroll={keepCentred}
      onKeyDown={onKeyDown}
      className="no-scrollbar relative h-60 w-16 overflow-y-auto rounded-md px-1 outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="flex flex-col">
        {rendered.map(({ option, band, key }) => {
          const isSelected = selected === option
          return (
            <div
              key={key}
              id={`${listId}-${band}-${option}`}
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(option)}
              className="group flex h-9 w-full cursor-pointer items-center justify-center"
            >
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-md text-sm font-normal tabular-nums transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'group-hover:bg-accent group-hover:text-accent-foreground',
                )}
              >
                {option}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
