import { Suspense } from 'react'
import { MerchantsList } from '@/features/merchants'
import { PageWrapper } from '@/components/shared/page-wrapper'

export default function MerchantsPage() {
  return (
    <PageWrapper variant="plain" permission="merchants:read" resource="merchants">
      <Suspense>
        <MerchantsList />
      </Suspense>
    </PageWrapper>
  )
}

export const metadata = {
  title: 'Merchants - Dashboard',
  description: 'Manage merchant accounts and access',
}
