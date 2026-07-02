'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useActiveMaintenance } from '@/features/settings'

export function MaintenanceGuard() {
  const { data: maintenance } = useActiveMaintenance()
  const router = useRouter()

  useEffect(() => {
    if (maintenance?.status === 'IN_PROGRESS') {
      router.push('/auth/maintenance')
    }
  }, [maintenance, router])

  return null
}
