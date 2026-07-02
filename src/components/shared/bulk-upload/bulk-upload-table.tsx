'use client'

import { cn } from '@/lib/core/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/** A small labelled stat tile used in the review/result summaries. */
export function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border-[0.4px] border-foreground/40 bg-secondary px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-medium text-foreground', tone)}>{value}</span>
    </div>
  )
}

/** Leading per-row status dot; red (with a tooltip of issues) when flagged, else green. */
export function StatusDot({ flagged, tips }: { flagged: boolean; tips: string[] }) {
  if (!flagged) {
    return <span className="inline-block size-2 rounded-full bg-status-green" />
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-block size-2 cursor-help rounded-full bg-status-red" />
      </TooltipTrigger>
      <TooltipContent className="max-w-[18rem]">
        <ul className="flex flex-col gap-0.5">
          {tips.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}

export interface BulkTableRow {
  key: number
  highlight?: boolean
  cells: React.ReactNode[]
}

/** Compact, horizontally-scrollable table for parsed/result rows. */
export function RowsTable({ headers, rows }: { headers: string[]; rows: BulkTableRow[] }) {
  return (
    <div className="max-h-72 overflow-auto rounded-md border-[0.4px] border-foreground/20">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-table-header-bg text-muted-foreground">
          <tr>
            {headers.map(h => (
              <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr
              key={r.key}
              className={cn('border-t border-table-row-border', r.highlight && 'bg-status-red/5')}
            >
              {r.cells.map((c, i) => (
                <td key={i} className="whitespace-nowrap px-3 py-2 text-foreground">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
