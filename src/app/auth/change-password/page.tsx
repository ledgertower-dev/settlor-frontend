'use client'

import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm'
import { AuthPageLayout } from '@/features/auth/components/AuthPageLayout'
import { AuthGuard } from '@/features/auth/components/AuthGuard'

export default function ChangePasswordPage() {
  return (
    <AuthGuard requirePasswordChange>
      <AuthPageLayout>
        <ChangePasswordForm />
      </AuthPageLayout>
    </AuthGuard>
  )
}
