import { Suspense } from 'react'
import { ProviderDetail } from '@/features/providers'
import { PageWrapper } from '@/components/shared/page-wrapper'

interface ProviderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProviderDetailPage({ params }: ProviderDetailPageProps) {
  const { id } = await params
  return (
    <PageWrapper variant="plain" permission="providers:read" resource="providers">
      <Suspense>
        <ProviderDetail providerId={id} />
      </Suspense>
    </PageWrapper>
  )
}

export const metadata = {
  title: 'Provider Details - Dashboard',
  description: 'View provider details, channels, and virtual accounts',
}
