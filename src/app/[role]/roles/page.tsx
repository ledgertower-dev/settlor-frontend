import { RolesList } from '@/features/roles'
import { PageWrapper } from '@/components/shared/page-wrapper'

export default function RolesPage() {
  return (
    <PageWrapper variant="plain" permission="roles:read" resource="roles">
      <RolesList />
    </PageWrapper>
  )
}

export const metadata = {
  title: 'Roles - Dashboard',
  description: 'Manage roles and permissions',
}
