'use client'

import { Suspense } from 'react'
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'
import { AuthPageLayout } from '@/features/auth/components/AuthPageLayout'

function ResetPasswordContent() {
  return <ResetPasswordForm />
}

export default function ResetPasswordPage() {
  return (
    <AuthPageLayout>
      <Suspense>
        <ResetPasswordContent />
      </Suspense>
    </AuthPageLayout>
  )
}
