import { ScheduledPayoutsList } from '@/features/scheduled-payouts'
import { PageWrapper } from '@/components/shared/page-wrapper'

export default function ScheduledPayoutsPage() {
  return (
    <PageWrapper
      variant="plain"
      permission={['scheduled_payouts:read', 'merchant:scheduled_payouts:read']}
      resource="scheduled payouts"
    >
      <ScheduledPayoutsList />
    </PageWrapper>
  )
}

export const metadata = {
  title: 'Scheduled Payouts - Dashboard',
  description: 'Create and manage scheduled one-time and recurring payouts',
}
