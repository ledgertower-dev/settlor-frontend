import { GeneratedReportsList } from '@/features/reports'
import { PageWrapper } from '@/components/shared/page-wrapper'

export default function GeneratedReportsPage() {
  return (
    <PageWrapper variant="plain" permission="reports:read" resource="generated reports">
      <GeneratedReportsList />
    </PageWrapper>
  )
}

export const metadata = {
  title: 'Generated Reports - Dashboard',
  description: 'View and download exported reports',
}
