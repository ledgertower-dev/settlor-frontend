/**
 * Shared, framework-agnostic helpers for the bulk-upload modals
 * (immediate payouts + scheduled payouts). Pure functions only.
 */

import type { CsvColumnCheck } from '@/lib/core/csv'

export interface BulkErrorItem {
  field: string // "row_<n>.<field>" for row errors, or "row_0"/other for file-level
  message: string
}

export interface BulkErrorGroup {
  message: string
  count: number
  rowLevel: boolean
}

/** Border + text colour for a batch status pill. */
export function batchTone(status?: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'border-status-green text-status-green'
    case 'PARTIALLY_COMPLETED':
      return 'border-status-orange text-status-orange'
    case 'FAILED':
      return 'border-status-red text-status-red'
    default:
      return 'border-status-teal text-status-teal'
  }
}

/** Text colour for a per-row result status. */
export function rowStatusTone(status: string): string {
  if (status === 'SUCCESS') return 'text-status-green'
  if (status === 'FAILED') return 'text-status-red'
  return 'text-muted-foreground'
}

/** Set of data-row numbers that have a field-level error. */
export function errorRowSet(errors: BulkErrorItem[]): Set<number> {
  const set = new Set<number>()
  errors.forEach(e => {
    const m = e.field.match(/^row_(\d+)\./)
    if (m) set.add(Number(m[1]))
  })
  return set
}

/** Collapse repeated error messages into counts; file-level errors carry no row count. */
export function groupErrors(errors: BulkErrorItem[]): BulkErrorGroup[] {
  return Array.from(
    errors.reduce((m, e) => {
      const g = m.get(e.message) ?? { count: 0, rowLevel: true }
      g.count += 1
      if (!/^row_\d+\./.test(e.field)) g.rowLevel = false
      return m.set(e.message, g)
    }, new Map<string, { count: number; rowLevel: boolean }>()),
    ([message, g]) => ({ message, count: g.count, rowLevel: g.rowLevel }),
  ).sort((a, b) => b.count - a.count)
}

/** Map of data-row number → its field error messages (for the hover tooltip). */
export function rowErrorMap(errors: BulkErrorItem[]): Map<number, string[]> {
  return errors.reduce((m, e) => {
    const mm = e.field.match(/^row_(\d+)\.(.+)$/)
    if (mm) {
      const n = Number(mm[1])
      const arr = m.get(n) ?? []
      arr.push(`${mm[2]}: ${e.message}`)
      m.set(n, arr)
    }
    return m
  }, new Map<number, string[]>())
}

/** File-level error messages (field doesn't target a specific row, e.g. "row_0"). */
export function fileLevelErrors(errors: BulkErrorItem[]): string[] {
  return errors.filter(e => !/^row_\d+\./.test(e.field)).map(e => e.message)
}

/** Build the user-facing bullet messages from a client-side CSV column check. */
export function bulkColumnMessages(check: CsvColumnCheck): string[] {
  const messages: string[] = []
  check.unrecognisedColumns.forEach(c =>
    messages.push(`Unrecognised column "${c}". Please download the latest template.`),
  )
  check.missingColumns.forEach(c =>
    messages.push(`Missing required column "${c}". Please download the latest template.`),
  )
  if (check.emptyValueRows.length > 0) {
    const nums = check.emptyValueRows.map(r => r.row)
    const preview = nums.slice(0, 15).join(', ')
    const more = nums.length > 15 ? `, +${nums.length - 15} more` : ''
    messages.push(`Missing required values in row${nums.length > 1 ? 's' : ''}: ${preview}${more}.`)
  }
  return messages
}
