'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EllipsisVertical, SquarePen, Trash2 } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { useResourcePermissions } from '@/features/access/model'
import { useBeneficiariesModalStore } from '../model/beneficiaries-ui-store'
import type { Beneficiary } from '../types'

interface BeneficiaryActionsProps {
  beneficiary: Beneficiary
}

export function BeneficiaryActions({ beneficiary }: BeneficiaryActionsProps) {
  const { openEditDrawer, openDeleteConfirm } = useBeneficiariesModalStore()
  const { canUpdate, canDelete } = useResourcePermissions('beneficiaries')

  if (!canUpdate && !canDelete) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-10 items-center justify-center rounded-md bg-accent text-muted-foreground transition-colors hover:bg-accent/80 hover:text-foreground"
          onClick={e => e.stopPropagation()}
        >
          <AppIcon icon={EllipsisVertical} size="sm" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] rounded-[10px] p-2.5 space-y-0">
        {canUpdate && (
          <DropdownMenuItem icon={SquarePen} showBorder onClick={() => openEditDrawer(beneficiary)}>
            Edit
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem
            icon={Trash2}
            iconBg="bg-status-red/10"
            iconColor="text-status-red"
            onClick={() => openDeleteConfirm(beneficiary)}
          >
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
