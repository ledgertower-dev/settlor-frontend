'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { MaintenanceCard } from '@/features/auth/components/MaintenanceCard'
import { AuthPageLayout } from '@/features/auth/components/AuthPageLayout'
import { useActiveMaintenance, maintenanceKeys } from '@/features/settings/model/use-maintenance'

export default function MaintenancePage() {
  const { data: maintenance, isLoading } = useActiveMaintenance()
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isLoading && maintenance?.status !== 'IN_PROGRESS') {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() })
      router.push('/auth/login')
    }
  }, [maintenance, isLoading, router, queryClient])

  return (
    <AuthPageLayout>
      <MaintenanceCard
        name={maintenance?.name}
        description={maintenance?.description}
        endsAt={maintenance?.toAt}
      />
    </AuthPageLayout>
  )
}
