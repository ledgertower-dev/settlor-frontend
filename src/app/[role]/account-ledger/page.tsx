import { AccountLedgerList } from '@/features/account-ledger'
import { PageWrapper } from '@/components/shared/page-wrapper'

export default function AccountLedgerPage() {
  return (
    <PageWrapper
      variant="plain"
      permission={['ledger:read', 'merchant:ledger:read']}
      resource="account ledger"
    >
      <AccountLedgerList />
    </PageWrapper>
  )
}

export const metadata = {
  title: 'Account Ledger - Dashboard',
  description: 'Wallet operations across payouts and deposits with running balances',
}
