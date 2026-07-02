'use client'

import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'
import { AuthPageLayout } from '@/features/auth/components/AuthPageLayout'

export default function ForgotPasswordPage() {
  return (
    <AuthPageLayout>
      <ForgotPasswordForm />
    </AuthPageLayout>
  )
}
