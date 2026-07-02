'use client'

import { useState } from 'react'
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Minus,
  Pencil,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { cn } from '@/lib/core/utils'
import type { ItemizedArrayChange } from '../types/audit-log.types'

interface ItemizedChangesListProps {
  changes: ItemizedArrayChange[]
}

const changeTypeConfig: Record<
  ItemizedArrayChange['changeType'],
  {
    icon: LucideIcon
    bgColor: string
    textColor: string
    borderColor: string
    label: string
  }
> = {
  added: {
    icon: Plus,
    bgColor: 'bg-status-green/15',
    textColor: 'text-status-green',
    borderColor: 'border-status-green/40',
    label: 'Added',
  },
  removed: {
    icon: Minus,
    bgColor: 'bg-status-red/15',
    textColor: 'text-status-red',
    borderColor: 'border-status-red/40',
    label: 'Removed',
  },
  modified: {
    icon: Pencil,
    bgColor: 'bg-status-teal/15',
    textColor: 'text-status-teal',
    borderColor: 'border-status-teal/40',
    label: 'Modified',
  },
  reordered: {
    icon: ArrowUpDown,
    bgColor: 'bg-status-orange/15',
    textColor: 'text-status-orange',
    borderColor: 'border-status-orange/40',
    label: 'Moved',
  },
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return 'None'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.length === 0 ? 'None' : value.join(', ')
  return String(value)
}

function ItemizedChangeItem({ change }: { change: ItemizedArrayChange }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = changeTypeConfig[change.changeType]
  const Icon = config.icon

  const hasDetails = change.fieldChanges && change.fieldChanges.length > 0

  return (
    <li className={cn('border-l-2 pl-3 py-1.5', config.borderColor)}>
      <div className="flex items-start gap-2">
        <span
          className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium shrink-0',
            config.bgColor,
            config.textColor,
          )}
        >
          <AppIcon icon={Icon} className="h-3 w-3 mr-1" />
          {config.label}
        </span>
        <span className="text-sm flex-1">{change.summary}</span>
        {hasDetails && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground p-0.5 shrink-0"
            aria-label={isExpanded ? 'Hide details' : 'Show details'}
          >
            {isExpanded ? (
              <AppIcon icon={ChevronUp} className="h-4 w-4" />
            ) : (
              <AppIcon icon={ChevronDown} className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {isExpanded && change.fieldChanges && (
        <ul className="mt-2 ml-4 space-y-1 text-xs text-muted-foreground">
          {change.fieldChanges.map((fc, idx) => (
            <li key={idx} className="flex flex-wrap gap-1">
              <span className="font-medium">{fc.label}:</span>
              <span className="text-status-red line-through">
                {fc.oldDisplayValue ?? formatFieldValue(fc.oldValue)}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-status-green">
                {fc.newDisplayValue ?? formatFieldValue(fc.newValue)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export function ItemizedChangesList({ changes }: ItemizedChangesListProps) {
  if (!changes || changes.length === 0) {
    return null
  }

  return (
    <ul className="mt-2 space-y-1.5">
      {changes.map((change, index) => (
        <ItemizedChangeItem key={`${change.itemId}-${index}`} change={change} />
      ))}
    </ul>
  )
}
