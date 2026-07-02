'use client'

import { useSearchParams } from 'next/navigation'
import { use } from 'react'
import { UserDetail } from '@/features/users'
import { PageWrapper } from '@/components/shared/page-wrapper'

interface UserDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const mode = (searchParams.get('mode') as 'view' | 'edit') || 'view'

  return (
    <PageWrapper permission="users:read" resource="users">
      <UserDetail userId={id} mode={mode} />
    </PageWrapper>
  )
}
