'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api/error-handler'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { FormDialog } from '@/components/shared/form-dialog'
import { Plus, Search } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { StatusBadge } from '@/components/shared/status-badge'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/core/utils'
import { usePermission } from '@/features/access/hooks/usePermission'
import type { ProviderVirtualAccount } from '../types'
import {
  useProviderVirtualAccounts,
  useAddVirtualAccount,
  useImportVirtualAccounts,
} from '../model/use-providers'
import {
  addVirtualAccountSchema,
  type AddVirtualAccountFormData,
  importVirtualAccountsSchema,
  type ImportVirtualAccountsFormData,
} from '../schemas/virtual-account.schema'

type VaFilter = 'all' | 'FREE' | 'IN_USE'

const VA_FILTERS: { value: VaFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'FREE', label: 'Unassigned' },
  { value: 'IN_USE', label: 'In use' },
]

interface ProviderVirtualAccountsTabProps {
  providerId: string
}

const columns: ColumnDef<ProviderVirtualAccount>[] = [
  {
    key: 'vaCode',
    header: 'VA Code',
    cell: row => <span className="font-mono text-sm text-foreground">{row.vaCode}</span>,
    skeletonWidth: 'w-24',
  },
  {
    key: 'accountNumber',
    header: 'Account Number',
    cell: row => <span className="font-mono text-sm text-foreground">{row.accountNumber}</span>,
    skeletonWidth: 'w-36',
  },
  {
    key: 'ifsc',
    header: 'IFSC',
    cell: row => <span className="text-sm text-foreground">{row.ifsc}</span>,
    skeletonWidth: 'w-24',
  },
  {
    key: 'bankName',
    header: 'Bank',
    cell: row => <span className="text-sm text-foreground">{row.bankName || '-'}</span>,
    skeletonWidth: 'w-24',
  },
  {
    key: 'assignmentStatus',
    header: 'Status',
    cell: row => <StatusBadge status={row.assignmentStatus} />,
    skeletonWidth: 'w-28',
  },
]

export function ProviderVirtualAccountsTab({ providerId }: ProviderVirtualAccountsTabProps) {
  const [search, setSearch] = useState('')
  const [vaFilter, setVaFilter] = useState<VaFilter>('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const canManage = usePermission('providers:manage')

  const { data: vaData, isLoading } = useProviderVirtualAccounts(providerId)
  const virtualAccounts = useMemo(() => vaData?.data ?? [], [vaData?.data])

  const totalCount = virtualAccounts.length
  const freeCount = virtualAccounts.filter(va => va.assignmentStatus === 'FREE').length
  const inUseCount = virtualAccounts.filter(va => va.assignmentStatus === 'IN_USE').length

  const filteredVAs = useMemo(() => {
    return virtualAccounts.filter(va => {
      const matchesSearch =
        !search ||
        va.vaCode.toLowerCase().includes(search.toLowerCase()) ||
        va.accountNumber.includes(search) ||
        va.ifsc.toLowerCase().includes(search.toLowerCase()) ||
        (va.merchantName && va.merchantName.toLowerCase().includes(search.toLowerCase()))
      const matchesFilter = vaFilter === 'all' || va.assignmentStatus === vaFilter
      return matchesSearch && matchesFilter
    })
  }, [virtualAccounts, search, vaFilter])

  return (
    <div className="space-y-3.5">
      {/* Stats row */}
      <div className="flex items-center gap-6 rounded-md border-[0.5px] border-foreground/20 bg-card px-6 py-4 shadow-[var(--shadow-card)] dark:bg-card">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-semibold text-foreground">{totalCount}</span>
          <span className="text-sm text-muted-foreground">Total</span>
        </div>
        <div className="h-6 w-px bg-foreground/10" />
        <div className="flex items-center gap-2">
          <span className="text-2xl font-semibold text-status-teal">{freeCount}</span>
          <span className="text-sm text-muted-foreground">Unassigned</span>
        </div>
        <div className="h-6 w-px bg-foreground/10" />
        <div className="flex items-center gap-2">
          <span className="text-2xl font-semibold text-foreground">{inUseCount}</span>
          <span className="text-sm text-muted-foreground">In Use</span>
        </div>
      </div>

      {/* Search + Filters + Actions + Table */}
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="relative h-12 flex-1">
            <AppIcon
              icon={Search}
              size="sm"
              color="muted"
              className="absolute left-6 top-1/2 -translate-y-1/2"
            />
            <Input
              placeholder="Search virtual accounts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-full border-[0.5px] border-foreground/20 pl-12 pr-3.5"
            />
          </div>
          <div className="flex h-12 items-center gap-1 rounded-md border-[0.5px] border-foreground/20 bg-card px-1.5">
            {VA_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setVaFilter(f.value)}
                className={cn(
                  'rounded-md px-4 py-2 text-sm transition-colors',
                  vaFilter === f.value
                    ? 'bg-button-bg text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          {canManage && (
            <button
              onClick={() => setImportDialogOpen(true)}
              className="flex h-[2.625rem] items-center gap-2 rounded-md border border-foreground/20 px-4 text-sm text-foreground transition-colors hover:bg-accent"
            >
              Bulk import
            </button>
          )}
          {canManage && (
            <button
              onClick={() => setAddDialogOpen(true)}
              className="flex h-[2.625rem] items-center gap-2 rounded-md bg-button-bg px-4 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
            >
              <AppIcon icon={Plus} size="sm" color="primary-foreground" />
              Add VA
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={filteredVAs}
          rowKey={row => row.id}
          isLoading={isLoading}
          emptyMessage="No virtual accounts found"
          containerClassName="border-0 shadow-none bg-transparent rounded-none"
        />
      </div>

      <AddVADialog open={addDialogOpen} onOpenChange={setAddDialogOpen} providerId={providerId} />
      <ImportVADialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        providerId={providerId}
      />
    </div>
  )
}

// --- Add VA Dialog ---

const labelStyles = 'text-sm font-normal capitalize text-foreground'
const inputStyles =
  '!h-12 border-[0.4px] border-foreground/40 bg-secondary px-6 text-sm placeholder:text-muted-foreground'

function AddVADialog({
  open,
  onOpenChange,
  providerId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerId: string
}) {
  const addVA = useAddVirtualAccount()

  const form = useForm<AddVirtualAccountFormData>({
    resolver: zodResolver(addVirtualAccountSchema),
    defaultValues: {
      accountNumber: '',
      ifsc: '',
    },
  })

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      form.reset({ accountNumber: '', ifsc: '' })
    }, 300)
  }

  const onSubmit = async (data: AddVirtualAccountFormData) => {
    try {
      await addVA.mutateAsync({
        providerId,
        data: {
          account_number: data.accountNumber.trim(),
          ifsc: data.ifsc.trim().toUpperCase(),
        },
      })
      toast.success('Virtual account added')
      handleClose()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={o => (!o ? handleClose() : null)}
      title="Add virtual account"
      description="Add a new virtual account to this provider's pool"
      formId="add-va-form"
      isPending={addVA.isPending}
      submitLabel="Add virtual account"
      pendingLabel="Adding..."
      size="md-lg"
      scrollable
      showCloseButton={false}
    >
      <Form {...form}>
        <form
          id="add-va-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>Account Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="10-18 digit account number"
                    maxLength={18}
                    className={inputStyles}
                    onInput={e => {
                      const input = e.currentTarget
                      input.value = input.value.replace(/\D/g, '')
                      field.onChange(input.value)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ifsc"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>IFSC Code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. UTIB0000001"
                    maxLength={11}
                    className={inputStyles}
                    onInput={e => {
                      const input = e.currentTarget
                      input.value = input.value.toUpperCase()
                      field.onChange(input.value)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormDialog>
  )
}

// --- Bulk Import Dialog ---

function ImportVADialog({
  open,
  onOpenChange,
  providerId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerId: string
}) {
  const importVAs = useImportVirtualAccounts()

  const form = useForm<ImportVirtualAccountsFormData>({
    resolver: zodResolver(importVirtualAccountsSchema),
    defaultValues: {
      csvContent: '',
    },
  })

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      form.reset({ csvContent: '' })
    }, 300)
  }

  const onSubmit = async (data: ImportVirtualAccountsFormData) => {
    try {
      await importVAs.mutateAsync({
        providerId,
        csvContent: data.csvContent.trim(),
      })
      toast.success('Virtual accounts imported')
      handleClose()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={o => (!o ? handleClose() : null)}
      title="Bulk import virtual accounts"
      description="Paste CSV content with virtual account details to import in bulk"
      formId="import-va-form"
      isPending={importVAs.isPending}
      submitLabel="Import"
      pendingLabel="Importing..."
      size="md-lg"
      scrollable
      showCloseButton={false}
    >
      <Form {...form}>
        <form
          id="import-va-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          {/* CSV Format hint */}
          <div className="rounded-md border border-dashed border-foreground/20 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Expected format:{' '}
              <span className="font-mono font-semibold text-foreground">
                account_number,ifsc,account_holder_name,bank_name
              </span>
            </p>
          </div>

          <FormField
            control={form.control}
            name="csvContent"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>CSV Content</FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    placeholder={`account_number,ifsc,account_holder_name,bank_name\n9212000012345601,UTIB0000001,John Doe,Axis Bank`}
                    rows={8}
                    className="w-full rounded-md border-[0.4px] border-foreground/40 bg-secondary px-6 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[1px] focus-visible:ring-ring/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormDialog>
  )
}
