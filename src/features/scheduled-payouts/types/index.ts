// ============================================================================
// Enums
// ============================================================================

export type ScheduleType = 'ONE_TIME' | 'RECURRING'

export type Frequency = 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'

export type DayOfWeek = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT'

export type PaymentMode = 'IMPS' | 'NEFT' | 'RTGS'

export type ScheduledPayoutStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'PROCESSING'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'COMPLETED'

export type EndCondition = 'NEVER' | 'AFTER_OCCURRENCES' | 'ON_DATE'

export type MonthMode = 'SPECIFIC_DATE' | 'LAST_WORKING_DAY'

// ============================================================================
// Backend Types (snake_case — raw API response)
// ============================================================================

export interface BackendScheduledPayoutListItem {
  id: string
  name: string
  payment_mode: string
  wallet_id: string
  amount: number
  currency: string
  recipient: string
  frequency: string
  frequency_label: string
  next_run_at: string | null
  status: string
}

export interface BackendSchedule {
  frequency: string
  execution_time: string
  start_date: string
  day_of_week: number | null
  day_of_month: number | null
  month_mode: string | null
  interval_days: number | null
  end_condition: string
  end_after_occurrences: number | null
  end_on_date: string | null
  timezone: string
}

export interface BackendBeneficiary {
  name: string
  account: string
  ifsc: string
  bank_name: string
  address: string
}

export interface BackendScheduledPayoutDetail {
  id: string
  name: string
  payment_mode: string
  wallet_id: string
  amount: number
  currency: string
  beneficiary: BackendBeneficiary
  reference_id: string
  remarks: string
  schedule: BackendSchedule
  frequency_label: string
  next_run_at: string | null
  last_run_at: string | null
  occurrences_count: number
  status: string
  created_at: string
  updated_at: string
}

export interface BackendScheduledPayoutsListResponse {
  success: boolean
  data: BackendScheduledPayoutListItem[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface BackendScheduledPayoutDetailResponse {
  success: boolean
  data: BackendScheduledPayoutDetail
}

// ============================================================================
// Frontend Types (camelCase — transformed for UI)
// ============================================================================

export interface ScheduledPayoutListItem {
  id: string
  name: string
  paymentMode: string
  walletId: string
  amount: number
  currency: string
  recipient: string
  frequency: string
  frequencyLabel: string
  nextRunAt: string | null
  status: ScheduledPayoutStatus
}

export interface ScheduledPayoutSchedule {
  frequency: Frequency
  executionTime: string
  startDate: string
  dayOfWeek: number | null
  dayOfMonth: number | null
  monthMode: MonthMode | null
  intervalDays: number | null
  endCondition: EndCondition
  endAfterOccurrences: number | null
  endOnDate: string | null
  timezone: string
}

export interface ScheduledPayoutBeneficiary {
  name: string
  account: string
  ifsc: string
  bankName: string
  address: string
}

export interface ScheduledPayoutDetail {
  id: string
  name: string
  paymentMode: string
  walletId: string
  amount: number
  currency: string
  beneficiary: ScheduledPayoutBeneficiary
  referenceId: string
  remarks: string
  schedule: ScheduledPayoutSchedule
  frequencyLabel: string
  nextRunAt: string | null
  lastRunAt: string | null
  occurrencesCount: number
  status: ScheduledPayoutStatus
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Request Types
// ============================================================================

export type ScheduledPayoutTab = 'all' | 'recurring' | 'one_time'

export interface ScheduledPayoutListParams {
  q?: string
  page?: number
  per_page?: number
  type?: string
  status?: string
  frequency?: string
}

export interface CreateScheduledPayoutRequest {
  name: string
  payment_mode: PaymentMode
  wallet_id: string
  amount: number
  beneficiary_name: string
  beneficiary_account: string
  beneficiary_ifsc: string
  bank_name: string
  beneficiary_address?: string
  reference_id?: string
  remarks: string
  schedule: {
    frequency: Frequency
    execution_time: string
    start_date?: string
    day_of_week?: number
    day_of_month?: number
    month_mode?: MonthMode
    interval_days?: number
    end_condition: EndCondition
    end_after_occurrences?: number
    end_on_date?: string
    timezone?: string
  }
}

export type UpdateScheduledPayoutRequest = CreateScheduledPayoutRequest

// ============================================================================
// Run History Types
// ============================================================================

export interface ScheduledPayoutRun {
  amount: number
  currency: string
  ranAt: string
  status: string
  transactionCode: string
  transactionId: string
  utr: string
  errorCode: string
  failureReason: string
}

export interface RunHistorySchedule {
  id: string
  name: string
  amount: number
  currency: string
  frequency: string
  frequencyLabel: string
  nextRunAt: string | null
  paymentMode: string
  recipient: string
  status: string
  walletId: string
}

export interface RunHistoryStats {
  totalRuns: number
  successful: number
  failed: number
}

export interface RunHistoryData {
  runs: ScheduledPayoutRun[]
  schedule: RunHistorySchedule
  stats: RunHistoryStats
}

export interface BackendRunHistoryResponse {
  success: boolean
  data: {
    runs: Array<{
      amount: number
      currency: string
      ran_at: string
      status: string
      transaction_code: string
      transaction_id: string
      utr: string
      error_code: string
      failure_reason: string
    }>
    schedule: {
      id: string
      name: string
      amount: number
      currency: string
      frequency: string
      frequency_label: string
      next_run_at: string | null
      payment_mode: string
      recipient: string
      status: string
      wallet_id: string
    }
    stats: {
      total_runs: number
      successful: number
      failed: number
    }
  }
}
