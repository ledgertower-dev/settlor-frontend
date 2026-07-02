import { DepositTransactionsList } from '@/features/deposit-transactions'
import { PageWrapper } from '@/components/shared/page-wrapper'

export default function DepositTransactionsPage() {
  return (
    <PageWrapper
      variant="plain"
      permission={['deposits:read', 'merchant:deposits:read']}
      resource="deposit transactions"
    >
      <DepositTransactionsList />
    </PageWrapper>
  )
}

export const metadata = {
  title: 'Deposit Payout - Dashboard',
  description: 'View and manage deposit payouts',
}
