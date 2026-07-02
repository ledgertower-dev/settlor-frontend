import type { PayoutPayload } from './codegen'

/** Default payout used for the docs code samples and the playground's initial form. */
export const DEFAULT_PAYOUT: PayoutPayload = {
  amount: 100.5,
  payment_mode: 'IMPS',
  beneficiary_name: 'John Doe',
  beneficiary_account: '1234567890',
  beneficiary_ifsc: 'HDFC0001234',
  bank_name: 'HDFC Bank',
  beneficiary_address: 'Mumbai, MH',
  reference_id: 'INV-2026-04-001',
  remarks: 'Invoice settlement',
}

/**
 * Deterministic dummy credentials for the "Fill sample keys" button. These are
 * NOT real keys — they only exist so a developer can see the envelope mechanics
 * (and round-trip the decrypt tester) without pasting production secrets.
 */
export const SAMPLE_API_KEY = 'a720d3c9e954b8146c036aee93c7c03ceaac1ded4000eb60fb92030f36d1a07c'
export const SAMPLE_SALT_KEY = '380781ea7a2ee91921ca80895d4d04a488ba89f89787227c5aa61ac6647ebf1a'
