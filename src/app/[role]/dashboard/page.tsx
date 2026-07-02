'use client'

import { MerchantDashboard } from '@/features/dashboard/components/MerchantDashboard'
import { PageWrapper } from '@/components/shared/page-wrapper'

export default function DashboardPage() {
  return (
    <PageWrapper variant="plain" className="pt-2">
      <MerchantDashboard />
    </PageWrapper>
  )
}
