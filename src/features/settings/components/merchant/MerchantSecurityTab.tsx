'use client'

import { ChangePasswordSection } from '../shared/ChangePasswordSection'
import { TwoFactorSection } from '../shared/TwoFactorSection'

export function MerchantSecurityTab() {
  return (
    <div className="space-y-3.5">
      <ChangePasswordSection />
      <TwoFactorSection basePath="/me/settings/security" />
    </div>
  )
}
