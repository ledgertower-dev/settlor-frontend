import { PayoutsList } from '@/features/payouts'
import { PageWrapper } from '@/components/shared/page-wrapper'

export default function PayoutTransactionsPage() {
  return (
    <PageWrapper
      variant="plain"
      permission={['payouts:read', 'merchant:payouts:read']}
      resource="payout transactions"
    >
      <PayoutsList />
    </PageWrapper>
  )
}

export const metadata = {
  title: 'Payout Transactions - Dashboard',
  description: 'Manage and track payout requests',
}
