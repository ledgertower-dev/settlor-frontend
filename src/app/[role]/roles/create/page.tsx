import { CreateRole } from '@/features/roles'
import { PageWrapper } from '@/components/shared/page-wrapper'

export default function CreateRolePage() {
  return (
    <PageWrapper variant="plain" permission="roles:create" resource="roles">
      <CreateRole />
    </PageWrapper>
  )
}

export const metadata = {
  title: 'Create Role - Dashboard',
  description: 'Create a new role with permissions',
}
