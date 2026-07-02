import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface SkeletonTableProps {
  columns: { width: string }[]
  rows?: number
}

export function SkeletonTable({ columns, rows = 8 }: SkeletonTableProps) {
  return (
    <div className="overflow-hidden rounded-md border-[0.4px] border-foreground/15 bg-card shadow-[var(--shadow-card)]">
      <Table>
        <TableHeader>
          <TableRow className="border-foreground/15 bg-secondary hover:bg-secondary dark:bg-muted/50 dark:hover:bg-muted/50">
            {columns.map((col, i) => (
              <TableHead key={i} className="h-[3.5rem] px-6">
                <Skeleton className={`h-4 ${col.width}`} />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, i) => (
            <TableRow key={i} className="border-foreground/15 hover:bg-transparent">
              {columns.map((col, j) => (
                <TableCell key={j} className="h-[3.875rem] px-6 py-[0.9375rem]">
                  <Skeleton className={`h-4 ${col.width}`} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
