import { MerchantDetail } from '@/features/merchants'
import { PageWrapper } from '@/components/shared/page-wrapper'

interface MerchantDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MerchantDetailPage({ params }: MerchantDetailPageProps) {
  const { id } = await params
  return (
    <PageWrapper variant="plain" permission="merchants:read" resource="merchants">
      <MerchantDetail merchantId={id} />
    </PageWrapper>
  )
}

export const metadata = {
  title: 'Merchant Details - Dashboard',
  description: 'View merchant account details',
}
