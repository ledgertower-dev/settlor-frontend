'use client'

import { ConfirmationCard } from '@/features/auth/components/ConfirmationCard'
import { AuthPageLayout } from '@/features/auth/components/AuthPageLayout'

export default function ConfirmationPage() {
  return (
    <AuthPageLayout>
      <ConfirmationCard />
    </AuthPageLayout>
  )
}
