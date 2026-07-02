'use client'

import { Suspense } from 'react'
import { SettingsPage } from '@/features/settings'
import { PageWrapper } from '@/components/shared/page-wrapper'

export default function SettingsRoute() {
  return (
    <PageWrapper variant="plain">
      <Suspense>
        <SettingsPage />
      </Suspense>
    </PageWrapper>
  )
}
