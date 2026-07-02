'use client'

import { Suspense } from 'react'
import { AuthPageLayout } from '@/features/auth/components/AuthPageLayout'
import { KycForm } from '@/features/kyc/components/KycForm'

export default function KycPage() {
  return (
    <AuthPageLayout>
      <Suspense>
        <KycForm />
      </Suspense>
    </AuthPageLayout>
  )
}
