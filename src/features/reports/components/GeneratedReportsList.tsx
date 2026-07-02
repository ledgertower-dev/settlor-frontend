'use client'

import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { StatusBadge } from '@/components/shared/status-badge'
import { RefreshButton } from '@/components/shared/refresh-button'
import { useResourcePermissions } from '@/features/access/model'

import { useReports, useDownloadReport } from '../model/use-reports'
import { useReportsPaginationStore } from '../model/reports-ui-store'
import { formatDateTime } from '@/lib/core/format'
import type { Report } from '../types'

function formatDateOnly(iso: string): string {
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function GeneratedReportsList() {
  const { filters, setPage, setPerPage } = useReportsPaginationStore()
  const { canExport } = useResourcePermissions('reports')

  const queryParams = useMemo(
    () => ({
      q: filters.search || undefined,
      page: filters.page,
      per_page: filters.perPage,
    }),
    [filters],
  )

  const { data, isLoading, isFetching, refetch } = useReports(queryParams)
  const { mutate: downloadReport, isPending: isDownloading } = useDownloadReport()

  const reports = data?.data?.items ?? []
  const pagination = data?.meta?.pagination

  const handleDownload = useCallback(
    (report: Report) => {
      downloadReport(report.id, {
        onSuccess: () => {
          toast.success('Report downloaded successfully.')
        },
        onError: () => {
          toast.error('Failed to download report. Please try again.')
        },
      })
    },
    [downloadReport],
  )

  const columns: ColumnDef<Report>[] = useMemo(() => {
    const cols: ColumnDef<Report>[] = [
      {
        key: 'sno',
        header: 'S.No',
        skeletonWidth: 'w-8',
        width: '60px',
        cell: (_row, index) => (
          <span className="text-sm">
            {pagination
              ? (pagination.page - 1) * pagination.perPage + (index ?? 0) + 1
              : (index ?? 0) + 1}
          </span>
        ),
      },
      {
        key: 'reportType',
        header: 'Report Type',
        skeletonWidth: 'w-28',
        cell: row => <span className="text-sm">{row.reportTypeLabel}</span>,
      },
      {
        key: 'filterSummary',
        header: 'Filter Summary',
        skeletonWidth: 'w-32',
        noTruncate: true,
        widthFull: true,
        cell: row => {
          if (!row.filterSummary) return <span className="text-sm text-muted-foreground">—</span>
          const lines = row.filterSummary.split(/;\s*/).filter(Boolean)
          return (
            <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
              {lines.map((line, i) => {
                const dateMatch = line.match(
                  /^(Date range:\s*)(.+T[\d:.]+Z?)\s*[–—]\s*(.+T[\d:.]+Z?)$/,
                )
                if (dateMatch) {
                  return (
                    <span key={i}>
                      {dateMatch[1]}
                      {formatDateOnly(dateMatch[2])} – {formatDateOnly(dateMatch[3])}
                    </span>
                  )
                }
                return <span key={i}>{line}</span>
              })}
            </div>
          )
        },
      },
      {
        key: 'requestedBy',
        header: 'Requested By',
        skeletonWidth: 'w-24',
        cell: row => <span className="text-sm">{row.requestedByEmail || '—'}</span>,
      },
      {
        key: 'generatedAt',
        header: 'Generated At',
        skeletonWidth: 'w-28',
        cell: row => {
          const { time, date } = formatDateTime(row.generatedAt)
          return (
            <div className="text-sm leading-relaxed">
              <p>{time}</p>
              <p className="text-muted-foreground">{date}</p>
            </div>
          )
        },
      },
      {
        key: 'status',
        header: 'Status',
        skeletonWidth: 'w-20',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        cell: row => <StatusBadge status={row.status} />,
      },
    ]

    if (canExport) {
      cols.push({
        key: 'action',
        header: 'Action',
        skeletonWidth: 'w-20',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        cell: row =>
          row.canDownload ? (
            <Button
              variant="tableAction"
              size="tableAction"
              disabled={isDownloading}
              onClick={e => {
                e.stopPropagation()
                handleDownload(row)
              }}
            >
              Download
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
      })
    }

    return cols
  }, [pagination, isDownloading, handleDownload, canExport])

  return (
    <div className="space-y-5">
      {/* Table card */}
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium text-foreground">Generated Reports</h2>
            <p className="text-sm text-muted-foreground">
              View and download your exported reports.
            </p>
          </div>
          <RefreshButton onRefresh={() => refetch()} isFetching={isFetching} />
        </div>

        <DataTable
          columns={columns}
          data={reports}
          rowKey={row => row.id}
          isLoading={isLoading || isFetching}
          loadingRows={filters.perPage}
          emptyMessage="No generated reports found."
          containerClassName="border-0 shadow-none bg-transparent rounded-none"
        />

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="mt-8">
            <DataTablePagination
              pagination={pagination}
              onPageChange={setPage}
              onPerPageChange={pp => {
                setPerPage(pp)
                setPage(1)
              }}
              itemLabel="reports"
            />
          </div>
        )}
      </div>
    </div>
  )
}
