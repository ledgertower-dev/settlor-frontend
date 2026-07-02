'use client'

import { UsersList } from '@/features/users'
import { PageWrapper } from '@/components/shared/page-wrapper'

export default function UsersPage() {
  return (
    <PageWrapper variant="plain" permission="users:read" resource="users">
      <UsersList />
    </PageWrapper>
  )
}
