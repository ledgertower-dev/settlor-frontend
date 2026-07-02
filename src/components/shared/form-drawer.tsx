'use client'

import { DrawerLayout } from '@/components/shared/drawer-layout'
import { FormFooter } from '@/components/shared/form-footer'

interface FormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
  formId: string
  isPending: boolean
  submitLabel: string
  pendingLabel: string
  submitDisabled?: boolean
  cancelDisabled?: boolean
  width?: string
}

export function FormDrawer({
  open,
  onOpenChange,
  title,
  children,
  formId,
  isPending,
  submitLabel,
  pendingLabel,
  submitDisabled,
  cancelDisabled,
  width,
}: FormDrawerProps) {
  return (
    <DrawerLayout
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      width={width}
      footer={
        <FormFooter
          onCancel={() => onOpenChange(false)}
          isPending={isPending}
          submitLabel={submitLabel}
          pendingLabel={pendingLabel}
          submitDisabled={submitDisabled}
          cancelDisabled={cancelDisabled}
          formId={formId}
          variant="drawer"
        />
      }
    >
      {children}
    </DrawerLayout>
  )
}
