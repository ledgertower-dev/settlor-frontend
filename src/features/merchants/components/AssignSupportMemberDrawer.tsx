'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { DrawerLayout } from '@/components/shared/drawer-layout'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/core/utils'
import { getErrorMessage } from '@/lib/api/error-handler'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import {
  useSupportMembers,
  useAssignSupportMembers,
  supportMemberKeys,
} from '../model/use-merchant-support'
import type { SupportMember } from '../types/merchant-support.types'

interface AssignSupportMemberDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  merchantId: string
  assignedMembers: SupportMember[]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function AssignSupportMemberDrawer({
  open,
  onOpenChange,
  merchantId,
  assignedMembers,
}: AssignSupportMemberDrawerProps) {
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useDebouncedSearch(searchQuery, setSearchQuery)

  const { data, isLoading } = useSupportMembers({ q: searchQuery, page: 1, per_page: 20 })
  const assignMutation = useAssignSupportMembers()

  // Initialize selected IDs and invalidate support members list when drawer opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(assignedMembers.map(m => m.id)))
      setSearchQuery('')
      setDebouncedSearch('')
      queryClient.invalidateQueries({ queryKey: supportMemberKeys.lists() })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const members = data?.data.items ?? []

  const selectedCount = selectedIds.size

  const toggleMember = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setSelectedIds(new Set())
      setSearchQuery('')
    }, 300)
  }

  const handleAssign = async () => {
    try {
      await assignMutation.mutateAsync({
        merchantId,
        supportUserIds: Array.from(selectedIds),
      })
      toast.success('Support members assigned successfully')
      handleClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const assignedIdSet = useMemo(() => new Set(assignedMembers.map(m => m.id)), [assignedMembers])

  const hasChanges = useMemo(() => {
    if (selectedIds.size !== assignedIdSet.size) return true
    for (const id of selectedIds) {
      if (!assignedIdSet.has(id)) return true
    }
    return false
  }, [selectedIds, assignedIdSet])

  return (
    <DrawerLayout
      open={open}
      onOpenChange={handleClose}
      title="Assign Support Member"
      footer={
        <div className="flex items-center justify-between border-t border-foreground/10 px-6 py-4">
          <p className="text-xs text-muted-foreground">{selectedCount} selected</p>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleClose}
              className="h-[2.625rem] rounded-md border border-foreground/20 px-5 text-sm text-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!hasChanges || assignMutation.isPending}
              className="h-[2.625rem] rounded-md bg-button-bg px-5 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:opacity-50"
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign Selected'}
            </button>
          </div>
        </div>
      }
    >
      {/* Search */}
      <div className="relative">
        <AppIcon
          icon={Search}
          size="sm"
          color="muted"
          className="absolute left-3 top-1/2 -translate-y-1/2"
        />
        <input
          type="text"
          placeholder="Search members..."
          value={debouncedSearch}
          onChange={e => setDebouncedSearch(e.target.value)}
          className="h-12 w-full rounded-md border border-foreground/20 bg-transparent pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[1px] focus-visible:ring-ring/30"
        />
      </div>

      {/* Member List */}
      <div className="mt-4 flex flex-col gap-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3.5 rounded-md border border-foreground/10 px-4 py-3.5"
            >
              <Skeleton className="size-4 rounded" />
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))
        ) : members.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {searchQuery ? `No members match "${searchQuery}"` : 'No members found'}
          </p>
        ) : (
          members.map(member => {
            const isSelected = selectedIds.has(member.id)
            return (
              <div
                key={member.id}
                role="button"
                tabIndex={0}
                onClick={() => toggleMember(member.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleMember(member.id)
                  }
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-3.5 rounded-md border px-4 py-3.5 transition-colors',
                  isSelected
                    ? 'border-button-bg bg-button-bg/5'
                    : 'border-foreground/20 hover:border-foreground/30',
                )}
              >
                <Checkbox
                  variant="green"
                  checked={isSelected}
                  onCheckedChange={() => toggleMember(member.id)}
                  onClick={e => e.stopPropagation()}
                />
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-button-bg text-xs font-semibold text-primary-foreground">
                  {getInitials(member.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </DrawerLayout>
  )
}
