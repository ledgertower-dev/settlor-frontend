'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useRolePath } from '@/hooks/use-role-prefix'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { ChevronRight, Search } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { cn } from '@/lib/core/utils'
import type { Provider } from '../types'
import { useProviders } from '../model/use-providers'

type TypeFilter = 'all' | 'BANK' | 'PSP'

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'BANK', label: 'Banks' },
  { value: 'PSP', label: 'PSPs' },
]

const columns: ColumnDef<Provider>[] = [
  {
    key: 'provider',
    header: 'Provider',
    cell: row => (
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-button-bg text-xs text-primary-foreground">
          {row.shortCode?.slice(0, 2).toUpperCase() || row.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-foreground">{row.name}</span>
          <span className="text-xs text-muted-foreground">{row.code}</span>
        </div>
      </div>
    ),
    skeletonWidth: 'w-48',
  },
  {
    key: 'type',
    header: 'Type',
    cell: row => <StatusBadge status={row.type} variant="plain" />,
    skeletonWidth: 'w-16',
  },
  {
    key: 'service',
    header: 'Service',
    cell: row => (
      <span className="text-sm text-foreground">{row.service?.replace(/_/g, ' ') || '-'}</span>
    ),
    skeletonWidth: 'w-28',
  },
  {
    key: 'status',
    header: 'Status',
    cell: row => <StatusBadge status={row.status} />,
    skeletonWidth: 'w-20',
  },
  {
    key: 'action',
    header: '',
    cell: () => <AppIcon icon={ChevronRight} size="sm" color="muted" />,
    headerClassName: 'w-10',
    cellClassName: 'w-10',
    skeletonWidth: 'w-4',
  },
]

export function ProvidersList() {
  const router = useRouter()
  const rolePath = useRolePath()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const { data: providers = [], isLoading } = useProviders()

  const filteredProviders = useMemo(() => {
    return providers.filter(p => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || p.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [providers, search, typeFilter])

  const handleRowClick = (provider: Provider) => {
    router.push(rolePath(`/providers/${provider.id}`))
  }

  return (
    <div className="space-y-5">
      {/* Table card */}
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        {/* Title + Search + Type Filter */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium text-foreground">Providers</h2>
            <p className="text-sm text-muted-foreground">
              Manage provider channels and virtual account pools
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 cursor-text rounded-[11px] bg-search-bg px-3.5 h-12 w-full sm:w-[280px]">
              <AppIcon icon={Search} size="sm" color="muted" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </label>
            <div className="flex items-center gap-1 rounded-[11px] border-[0.5px] border-foreground/20 bg-card px-1.5 py-1.5">
              {TYPE_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setTypeFilter(f.value)}
                  className={cn(
                    'rounded-md px-4 py-2 text-sm transition-colors',
                    typeFilter === f.value
                      ? 'bg-button-bg text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredProviders}
          rowKey={row => row.id}
          onRowClick={handleRowClick}
          isLoading={isLoading}
          containerClassName="border-0 shadow-none bg-transparent rounded-none"
          emptyMessage="No providers found"
        />
      </div>
    </div>
  )
}
