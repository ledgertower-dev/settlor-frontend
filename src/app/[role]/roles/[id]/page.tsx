import { RoleDetail } from '@/features/roles'
import { PageWrapper } from '@/components/shared/page-wrapper'

interface RoleDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  const { id } = await params
  return (
    <PageWrapper variant="plain" permission="roles:read" resource="roles">
      <RoleDetail roleId={id} />
    </PageWrapper>
  )
}

export const metadata = {
  title: 'Role Details - Dashboard',
  description: 'View and manage role details and permissions',
}
