'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { AuthPageLayout } from '@/features/auth/components/AuthPageLayout'
import { useActiveMaintenance } from '@/features/settings/model/use-maintenance'

export default function LoginPage() {
  const { data: maintenance } = useActiveMaintenance()
  const router = useRouter()

  useEffect(() => {
    if (maintenance?.status === 'IN_PROGRESS') {
      router.push('/auth/maintenance')
    }
  }, [maintenance, router])

  return (
    <AuthPageLayout>
      <LoginForm />
    </AuthPageLayout>
  )
}
