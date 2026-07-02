'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import { X } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { useAuthStore } from '@/features/auth'

import { useApproveDeposit, useRejectDeposit } from '../model/use-deposit-transactions'
import { getErrorMessage } from '@/lib/api/error-handler'
import { useDepositTransactionsPanelStore } from '../model/deposit-transactions-ui-store'
import { DepositTransactionDetailsCard } from './DepositTransactionDetailsCard'
import { DepositRevertForm } from './DepositRevertForm'

// ============================================================================
// Remark Dialog — used by approve and reject
// ============================================================================

interface RemarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  submitting: boolean
  onSubmit: (remark: string) => void
}

function RemarkDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  submitting,
  onSubmit,
}: RemarkDialogProps) {
  const [remark, setRemark] = useState('')
  const [touched, setTouched] = useState(false)
  const trimmed = remark.trim()
  const error = touched && !trimmed ? 'Remark is required' : ''

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setRemark('')
      setTouched(false)
    }
    onOpenChange(next)
  }

  const handleSubmit = () => {
    setTouched(true)
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      pendingLabel="Submitting..."
      isPending={submitting}
      confirmDisabled={!trimmed}
      onConfirm={handleSubmit}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="deposit-remark" className="text-sm text-foreground">
          Remark<span className="-ml-1 text-destructive">*</span>
        </Label>
        <Textarea
          id="deposit-remark"
          placeholder="Add a remark for this action"
          className="min-h-24 resize-none"
          value={remark}
          onChange={e => setRemark(e.target.value)}
          disabled={submitting}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </ConfirmDialog>
  )
}

// ============================================================================
// Footer Actions — vary by status. Admin-only.
// ============================================================================

interface FooterActionsProps {
  status: string
  onApproveClick: () => void
  onRejectClick: () => void
  onRevertClick: () => void
}

function FooterActions({
  status,
  onApproveClick,
  onRejectClick,
  onRevertClick,
}: FooterActionsProps) {
  if (status === 'PENDING') {
    return (
      <div className="flex justify-end gap-[14px]">
        <Button
          className="w-36 bg-status-red text-white hover:bg-status-red/90"
          onClick={onRejectClick}
        >
          Reject
        </Button>
        <Button className="w-36" onClick={onApproveClick}>
          Approve
        </Button>
      </div>
    )
  }

  if (status === 'APPROVED') {
    return (
      <div className="flex justify-end gap-[14px]">
        <Button
          variant="outline"
          className="w-36 border-status-red text-status-red hover:bg-status-red/10 hover:text-status-red"
          onClick={onRevertClick}
        >
          Revert
        </Button>
      </div>
    )
  }

  // REJECTED — read-only
  return null
}

// ============================================================================
// Main Sheet
// ============================================================================

export function DepositTransactionDetailsSheet() {
  const viewingDeposit = useDepositTransactionsPanelStore(s => s.viewingDeposit)
  const setViewingDeposit = useDepositTransactionsPanelStore(s => s.setViewingDeposit)
  const revertFormOpen = useDepositTransactionsPanelStore(s => s.revertFormOpen)
  const setRevertFormOpen = useDepositTransactionsPanelStore(s => s.setRevertFormOpen)

  const user = useAuthStore(s => s.user)
  const isAdmin = user?.accountType !== 'MERCHANT'

  const approveMutation = useApproveDeposit()
  const rejectMutation = useRejectDeposit()

  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const isOpen = viewingDeposit !== null

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setViewingDeposit(null)
    }
  }

  const handleApproveSubmit = async (remark: string) => {
    if (!viewingDeposit) return
    try {
      await approveMutation.mutateAsync({ id: viewingDeposit.id, data: { remark } })
      toast.success('Deposit approved')
      setApproveOpen(false)
      setViewingDeposit(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleRejectSubmit = async (remark: string) => {
    if (!viewingDeposit) return
    try {
      await rejectMutation.mutateAsync({ id: viewingDeposit.id, data: { remarks: remark } })
      toast.success('Deposit rejected')
      setRejectOpen(false)
      setViewingDeposit(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleRevertClick = () => {
    setRevertFormOpen(true)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:w-[640px] sm:max-w-[640px] [&>button]:hidden"
      >
        {viewingDeposit ? (
          <div className="flex h-full flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <h2 className="text-lg font-medium text-foreground">Deposit details</h2>
                <p className="text-sm text-muted-foreground">
                  Merchant : {viewingDeposit.merchantName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="cursor-pointer rounded-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <AppIcon icon={X} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex flex-col gap-5">
                <DepositTransactionDetailsCard tx={viewingDeposit} />

                {revertFormOpen && isAdmin && <DepositRevertForm depositId={viewingDeposit.id} />}

                {!revertFormOpen && isAdmin && (
                  <FooterActions
                    status={viewingDeposit.status}
                    onApproveClick={() => setApproveOpen(true)}
                    onRejectClick={() => setRejectOpen(true)}
                    onRevertClick={handleRevertClick}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Deposit not found.</p>
          </div>
        )}
      </SheetContent>

      {/* Approve dialog — admin only */}
      {isAdmin && (
        <RemarkDialog
          key={`approve-${viewingDeposit?.id}`}
          open={approveOpen}
          onOpenChange={setApproveOpen}
          title="Approve this deposit?"
          description="Add a remark explaining this approval. This action can't be undone."
          confirmLabel="Approve"
          submitting={approveMutation.isPending}
          onSubmit={handleApproveSubmit}
        />
      )}

      {/* Reject dialog — admin only */}
      {isAdmin && (
        <RemarkDialog
          key={`reject-${viewingDeposit?.id}`}
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          title="Reject this deposit?"
          description="Add a remark explaining this rejection. This action can't be undone."
          confirmLabel="Reject"
          submitting={rejectMutation.isPending}
          onSubmit={handleRejectSubmit}
        />
      )}
    </Sheet>
  )
}
