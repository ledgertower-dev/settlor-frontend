'use client'

import { SignupForm } from '@/features/auth/components/SignupForm'
import { AuthPageLayout } from '@/features/auth/components/AuthPageLayout'

export default function SignupPage() {
  return (
    <AuthPageLayout>
      <SignupForm />
    </AuthPageLayout>
  )
}
