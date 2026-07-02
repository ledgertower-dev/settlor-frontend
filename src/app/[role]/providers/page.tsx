import { ProvidersList } from '@/features/providers'
import { PageWrapper } from '@/components/shared/page-wrapper'

export default function ProvidersPage() {
  return (
    <PageWrapper variant="plain" permission="providers:read" resource="providers">
      <ProvidersList />
    </PageWrapper>
  )
}

export const metadata = {
  title: 'Providers - Dashboard',
  description: 'Manage provider channels and virtual account pools',
}
