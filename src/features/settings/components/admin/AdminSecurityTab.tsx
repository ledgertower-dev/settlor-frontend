'use client'

import { ChangePasswordSection } from '../shared/ChangePasswordSection'
import { TwoFactorSection } from '../shared/TwoFactorSection'

export function AdminSecurityTab() {
  return (
    <div className="space-y-3.5">
      <ChangePasswordSection />
      <TwoFactorSection basePath="/admin/settings/security" />
    </div>
  )
}
