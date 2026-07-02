'use client'

import { Suspense } from 'react'
import { AdminAuditLogsPage } from '@/features/audit-logs/components/admin-audit-logs-page'
import { PageWrapper } from '@/components/shared/page-wrapper'

export default function AuditLogsPage() {
  return (
    <PageWrapper variant="plain" permission="audit_logs:read" resource="audit logs">
      <Suspense>
        <AdminAuditLogsPage />
      </Suspense>
    </PageWrapper>
  )
}
