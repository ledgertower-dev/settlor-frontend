'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PayoutDetailProps {
  payoutId: string
}

/**
 * PayoutDetail page redirects to the list page and opens the drawer.
 * The detail view is shown in a drawer, not a separate page.
 */
export function PayoutDetail({ payoutId }: PayoutDetailProps) {
  const router = useRouter()

  useEffect(() => {
    router.replace('/payout-transactions')
  }, [router, payoutId])

  return null
}
