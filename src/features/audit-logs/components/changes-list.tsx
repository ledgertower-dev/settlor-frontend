'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import type { FieldChange } from '../types/audit-log.types'
import { ItemizedChangesList } from './itemized-changes-list'

interface ChangesListProps {
  changes?: FieldChange[]
}

const MAX_VISIBLE_ITEMS = 3

function formatScalarValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'N/A'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'string') {
    return value
  }

  return String(value)
}

function formatArrayValue(arr: unknown[]): string {
  if (arr.length === 0) return 'None'
  return arr.map(item => formatScalarValue(item)).join(', ')
}

interface ArrayValueDisplayProps {
  values: unknown[]
  variant: 'old' | 'new'
}

function ArrayValueDisplay({ values, variant }: ArrayValueDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (values.length === 0) {
    return <span className="text-muted-foreground italic">None</span>
  }

  const displayValues = isExpanded ? values : values.slice(0, MAX_VISIBLE_ITEMS)
  const hasMore = values.length > MAX_VISIBLE_ITEMS
  const textClass = variant === 'old' ? 'text-status-red line-through' : 'text-status-green'

  return (
    <span className={textClass}>
      {displayValues.map(item => formatScalarValue(item)).join(', ')}
      {hasMore && !isExpanded && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-1 h-5 px-1 text-xs"
          onClick={() => setIsExpanded(true)}
        >
          <AppIcon icon={ChevronDown} className="mr-1 h-3 w-3" />+
          {values.length - MAX_VISIBLE_ITEMS} more
        </Button>
      )}
      {hasMore && isExpanded && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-1 h-5 px-1 text-xs"
          onClick={() => setIsExpanded(false)}
        >
          <AppIcon icon={ChevronUp} className="mr-1 h-3 w-3" />
          Show less
        </Button>
      )}
    </span>
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'N/A'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (Array.isArray(value)) {
    return formatArrayValue(value)
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'object') {
    // For objects, show key-value pairs more readably
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return 'Empty'
    return entries.map(([k, v]) => `${k}: ${formatScalarValue(v)}`).join(', ')
  }

  return String(value)
}

export function ChangesList({ changes }: ChangesListProps) {
  if (!changes || changes.length === 0) {
    return <span className="text-muted-foreground text-sm">No details</span>
  }

  return (
    <ul className="space-y-2 text-sm">
      {changes.map((change, index) => {
        const oldValue = change.oldDisplayValue ?? change.oldValue
        const newValue = change.newDisplayValue ?? change.newValue
        const isArrayChange = Array.isArray(oldValue) || Array.isArray(newValue)
        const hasItemizedChanges = change.itemizedChanges && change.itemizedChanges.length > 0

        return (
          <li key={index} className="border-b border-border pb-2 last:border-b-0 last:pb-0">
            <span className="font-medium">{change.label}:</span>{' '}
            {hasItemizedChanges ? (
              // Render itemized changes for array fields
              <div>
                <span className="text-muted-foreground">
                  {change.oldDisplayValue} → {change.newDisplayValue}
                </span>
                <ItemizedChangesList changes={change.itemizedChanges!} />
              </div>
            ) : isArrayChange ? (
              <div className="mt-1 space-y-1">
                <div>
                  <span className="text-muted-foreground text-xs">Previous: </span>
                  <ArrayValueDisplay
                    values={Array.isArray(oldValue) ? oldValue : [oldValue]}
                    variant="old"
                  />
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Updated: </span>
                  <ArrayValueDisplay
                    values={Array.isArray(newValue) ? newValue : [newValue]}
                    variant="new"
                  />
                </div>
              </div>
            ) : (
              <>
                <span className="text-status-red line-through">{formatValue(oldValue)}</span>
                {' → '}
                <span className="text-status-green">{formatValue(newValue)}</span>
              </>
            )}
          </li>
        )
      })}
    </ul>
  )
}
