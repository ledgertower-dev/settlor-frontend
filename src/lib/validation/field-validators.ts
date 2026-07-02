/**
 * Shared field-level Zod validators
 *
 * Import these reusable field schemas wherever you define a form schema instead
 * of copy-pasting the same regex and error messages. This ensures every feature
 * enforces exactly the same rules for the same field type.
 *
 * @example
 * import { zPhone, zIFSC, zAccountNumber, zPAN } from '@/lib/validation/field-validators'
 *
 * const mySchema = z.object({
 *   phone:         zPhone,
 *   ifsc:          zIFSC,
 *   accountNumber: zAccountNumber,
 *   pan:           zPAN,
 * })
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Phone / Mobile
// ---------------------------------------------------------------------------

/**
 * Indian mobile number — 10 digits starting with 6-9.
 * Accepts plain `9876543210` (no country code).
 *
 * Used in: signup, create-user, view-user, KYC (personal mobile)
 */
export const zPhone = z
  .string()
  .min(1, 'Mobile number is required')
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number (e.g. 9876543210)')

/**
 * Optional phone — same rules but the field is not required.
 */
export const zPhoneOptional = z
  .string()
  .optional()
  .refine(
    val => !val || /^[6-9]\d{9}$/.test(val),
    'Enter a valid 10-digit mobile number (e.g. 9876543210)',
  )

/**
 * Business mobile — same as personal mobile, requires a 10-digit number.
 * Used in: KYC business details.
 */
export const zBusinessPhone = zPhone

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

/**
 * Standard email address.
 */
export const zEmail = z.string().email('Please enter a valid email address')

/**
 * Required email with explicit "required" message before the format check.
 */
export const zEmailRequired = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')

// ---------------------------------------------------------------------------
// IFSC Code
// ---------------------------------------------------------------------------

/**
 * Indian IFSC code — 4 uppercase letters, digit 0, then 6 alphanumeric chars.
 * Pattern: `ABCD0123456`
 *
 * Used in: beneficiaries, bank accounts, whitelist accounts, scheduled payouts,
 *          virtual accounts, settings.
 */
export const zIFSC = z
  .string()
  .min(1, 'IFSC code is required')
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid IFSC code (e.g. SBIN0001234)')

/**
 * Optional IFSC — same rules, field is not required.
 */
export const zIFSCOptional = z
  .string()
  .optional()
  .refine(
    val => !val || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val),
    'Enter a valid IFSC code (e.g. SBIN0001234)',
  )

// ---------------------------------------------------------------------------
// Bank Account Number
// ---------------------------------------------------------------------------

/**
 * Indian bank account number — 9 to 18 digits only.
 *
 * Used in: beneficiaries, whitelist accounts, virtual accounts,
 *          scheduled payouts, settings bank accounts.
 */
export const zAccountNumber = z
  .string()
  .min(1, 'Account number is required')
  .regex(/^\d{9,18}$/, 'Account number must be 9–18 digits')

/**
 * Optional account number — same rules, field is not required.
 */
export const zAccountNumberOptional = z
  .string()
  .optional()
  .refine(val => !val || /^\d{9,18}$/.test(val), 'Account number must be 9–18 digits')

// ---------------------------------------------------------------------------
// PAN
// ---------------------------------------------------------------------------

/**
 * Indian PAN card — 5 letters, 4 digits, 1 letter (all uppercase).
 * Pattern: `ABCDE1234F`
 *
 * Used in: KYC (company PAN, promoter PAN).
 */
export const zPAN = z
  .string()
  .min(1, 'PAN is required')
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Enter a valid PAN (e.g. ABCDE1234F)')

/**
 * Optional PAN — same rules, field is not required.
 */
export const zPANOptional = z
  .string()
  .optional()
  .refine(val => !val || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val), 'Enter a valid PAN (e.g. ABCDE1234F)')

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

/**
 * Strong password — min 12 chars, at least one upper, lower, and digit.
 * Used in: signup, create-user, change-password, reset-password.
 */
export const zPassword = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one digit')

/**
 * Confirm-password field — just checks it's not empty; cross-field match
 * is enforced via `.refine()` on the parent object.
 */
export const zConfirmPassword = z.string().min(1, 'Please confirm your password')

// ---------------------------------------------------------------------------
// Name
// ---------------------------------------------------------------------------

/**
 * General person / entity name — at least 2 characters, max 100.
 */
export const zName = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name cannot exceed 100 characters')

// ---------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------

/**
 * Optional website URL — must start with http:// or https://.
 */
export const zWebsiteOptional = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine(val => !val || /^https?:\/\/.+\..+/.test(val), {
    message: 'Enter a valid URL (e.g. https://business.com)',
  })

// ---------------------------------------------------------------------------
// Date of Birth
// ---------------------------------------------------------------------------

/**
 * Optional date of birth — must be at least 18 years in the past.
 */
export const zDOBOptional = z
  .string()
  .optional()
  .refine(
    val => {
      if (!val) return true
      const dob = new Date(val)
      const today = new Date()
      let age = today.getFullYear() - dob.getFullYear()
      const monthDiff = today.getMonth() - dob.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--
      }
      return age >= 18
    },
    { message: 'Must be at least 18 years old' },
  )
