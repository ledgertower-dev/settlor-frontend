'use client'

import { BlockedCard } from '@/features/auth/components/BlockedCard'
import { AuthPageLayout } from '@/features/auth/components/AuthPageLayout'

export default function BlockedPage() {
  return (
    <AuthPageLayout>
      <BlockedCard />
    </AuthPageLayout>
  )
}
