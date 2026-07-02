import { BeneficiariesList } from '@/features/beneficiaries'
import { PageWrapper } from '@/components/shared/page-wrapper'

export default function BeneficiariesPage() {
  return (
    <PageWrapper variant="plain" permission="merchant:beneficiaries:read" resource="beneficiaries">
      <BeneficiariesList />
    </PageWrapper>
  )
}

export const metadata = {
  title: 'Beneficiary Management - Dashboard',
  description: 'Manage saved bank beneficiaries for payouts',
}
