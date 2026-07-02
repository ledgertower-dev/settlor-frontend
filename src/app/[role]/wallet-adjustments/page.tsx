import { WalletAdjustmentsPage } from '@/features/wallet-adjustments'
import { PageWrapper } from '@/components/shared/page-wrapper'

export default function WalletAdjustmentsRoutePage() {
  return (
    <PageWrapper variant="plain" permission="wallets:adjust" resource="wallet adjustments">
      <WalletAdjustmentsPage />
    </PageWrapper>
  )
}

export const metadata = {
  title: 'Wallet Adjustment - Dashboard',
  description: 'Credit or debit merchant wallets manually',
}
