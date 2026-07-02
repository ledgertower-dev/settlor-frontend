'use client'

import { Suspense } from 'react'
import { AuthPageLayout } from '@/features/auth/components/AuthPageLayout'
import { KycResubmitForm } from '@/features/kyc/components/KycResubmitForm'

export default function KycResubmitPage() {
  return (
    <AuthPageLayout>
      <Suspense>
        <KycResubmitForm />
      </Suspense>
    </AuthPageLayout>
  )
}
