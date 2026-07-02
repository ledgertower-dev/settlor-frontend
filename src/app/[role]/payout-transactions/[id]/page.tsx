import { PayoutDetail } from '@/features/payouts'
import { PageWrapper } from '@/components/shared/page-wrapper'

interface PayoutDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PayoutDetailPage({ params }: PayoutDetailPageProps) {
  const { id } = await params
  return (
    <PageWrapper
      permission={['payouts:read', 'merchant:payouts:read']}
      resource="payout transactions"
    >
      <PayoutDetail payoutId={id} />
    </PageWrapper>
  )
}

export const metadata = {
  title: 'Payout Details - Dashboard',
  description: 'View payout details and status',
}
