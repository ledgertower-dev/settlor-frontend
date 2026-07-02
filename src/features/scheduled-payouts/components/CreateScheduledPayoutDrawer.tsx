'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, X } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { DatePicker, TimePicker } from '@/components/shared/date-time-picker'
import { cn } from '@/lib/core/utils'
import { getErrorMessage } from '@/lib/api/error-handler'
import { useMyWallets } from '@/features/payouts'
import { useBeneficiaries } from '@/features/beneficiaries'
import type { Beneficiary } from '@/features/beneficiaries'

import {
  payoutDetailsSchema,
  scheduleConfigSchema,
  type PayoutDetailsFormData,
  type ScheduleConfigFormData,
} from '../schemas/scheduled-payout.schema'
import {
  useCreateScheduledPayout,
  useUpdateScheduledPayout,
  useScheduledPayout,
} from '../model/use-scheduled-payouts'
import type {
  DayOfWeek,
  RecurringFrequency,
  Frequency,
  EndCondition,
  MonthMode,
  CreateScheduledPayoutRequest,
} from '../types'

interface CreateScheduledPayoutDrawerProps {
  open: boolean
  editPayoutId: string | null
  onOpenChange: (open: boolean) => void
}

type Step = 1 | 2

const DAYS_OF_WEEK: { value: DayOfWeek; label: string; num: number }[] = [
  { value: 'SUN', label: 'Sun', num: 0 },
  { value: 'MON', label: 'Mon', num: 1 },
  { value: 'TUE', label: 'Tue', num: 2 },
  { value: 'WED', label: 'Wed', num: 3 },
  { value: 'THU', label: 'Thu', num: 4 },
  { value: 'FRI', label: 'Fri', num: 5 },
  { value: 'SAT', label: 'Sat', num: 6 },
]

const DAY_OF_WEEK_MAP: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
}

const NUM_TO_DAY: Record<number, DayOfWeek> = {
  0: 'SUN',
  1: 'MON',
  2: 'TUE',
  3: 'WED',
  4: 'THU',
  5: 'FRI',
  6: 'SAT',
}

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string; description: string }[] = [
  { value: 'DAILY', label: 'Daily', description: 'Every day from start date' },
  { value: 'WEEKLY', label: 'Weekly', description: 'On a specific weekday' },
  { value: 'MONTHLY', label: 'Monthly', description: 'On a date or last working day' },
  { value: 'CUSTOM', label: 'Custom', description: 'Every N days' },
]

const labelStyles = 'text-sm font-normal capitalize'
const inputStyles =
  '!h-12 border-[0.4px] border-foreground/40 bg-secondary px-6 text-sm placeholder:text-muted-foreground'
const selectTriggerStyles =
  '!h-12 w-full border-[0.4px] border-foreground/40 bg-secondary px-6 text-sm'

export function CreateScheduledPayoutDrawer({
  open,
  editPayoutId,
  onOpenChange,
}: CreateScheduledPayoutDrawerProps) {
  const [step, setStep] = useState<Step>(1)
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>('')

  const isEditMode = !!editPayoutId

  const createMutation = useCreateScheduledPayout()
  const updateMutation = useUpdateScheduledPayout()
  const isPending = createMutation.isPending || updateMutation.isPending
  const { data: editData } = useScheduledPayout(editPayoutId)
  const { data: wallets = [] } = useMyWallets(open)
  const { data: beneficiariesResponse } = useBeneficiaries({ per_page: 100 }, { enabled: open })
  const beneficiaries = beneficiariesResponse?.data?.items ?? []

  // Step 1 form
  const step1Form = useForm<PayoutDetailsFormData>({
    resolver: zodResolver(payoutDetailsSchema),
    defaultValues: {
      name: '',
      paymentMode: undefined,
      walletId: '',
      amount: '',
      beneficiaryName: '',
      accountNumber: '',
      ifsc: '',
      bankName: '',
      remarks: '',
      beneficiaryAddress: '',
      referenceId: '',
    },
  })

  // Step 2 form
  const step2Form = useForm<ScheduleConfigFormData>({
    resolver: zodResolver(scheduleConfigSchema),
    defaultValues: {
      scheduleType: 'ONE_TIME',
      executionDate: '',
      executionTime: '09:00',
      frequency: undefined,
      dayOfWeek: undefined,
      dayOfMonth: '',
      lastWorkingDay: false,
      intervalDays: '',
      startDate: '',
      endCondition: 'NEVER',
      endOccurrences: '',
      endDate: '',
    },
  })

  const scheduleType = step2Form.watch('scheduleType')
  const frequency = step2Form.watch('frequency')
  const endCondition = step2Form.watch('endCondition')
  const lastWorkingDay = step2Form.watch('lastWorkingDay')

  // Reset forms when opening in create mode
  useEffect(() => {
    if (open && !isEditMode) {
      step1Form.reset({
        name: '',
        paymentMode: undefined,
        walletId: '',
        amount: '',
        beneficiaryName: '',
        accountNumber: '',
        ifsc: '',
        bankName: '',
        remarks: '',
        beneficiaryAddress: '',
        referenceId: '',
      })
      step2Form.reset({
        scheduleType: 'ONE_TIME',
        executionDate: '',
        executionTime: '09:00',
        frequency: undefined,
        dayOfWeek: undefined,
        dayOfMonth: '',
        lastWorkingDay: false,
        intervalDays: '',
        startDate: '',
        endCondition: 'NEVER',
        endOccurrences: '',
        endDate: '',
      })
      setStep(1)
      setSelectedBeneficiary('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditMode])

  // Load edit data from API
  useEffect(() => {
    if (editData && isEditMode) {
      step1Form.reset({
        name: editData.name,
        paymentMode: editData.paymentMode as 'IMPS' | 'NEFT' | 'RTGS',
        walletId: editData.walletId,
        amount: String(editData.amount),
        beneficiaryName: editData.beneficiary.name,
        accountNumber: editData.beneficiary.account,
        ifsc: editData.beneficiary.ifsc,
        bankName: editData.beneficiary.bankName,
        remarks: editData.remarks,
        beneficiaryAddress: editData.beneficiary.address ?? '',
        referenceId: editData.referenceId ?? '',
      })

      const sched = editData.schedule
      const isOneTime = sched.frequency === 'ONE_TIME'
      step2Form.reset({
        scheduleType: isOneTime ? 'ONE_TIME' : 'RECURRING',
        executionDate: isOneTime ? sched.startDate : '',
        executionTime: sched.executionTime,
        frequency: isOneTime ? undefined : (sched.frequency as RecurringFrequency),
        dayOfWeek: sched.dayOfWeek != null ? NUM_TO_DAY[sched.dayOfWeek] : undefined,
        dayOfMonth: sched.dayOfMonth != null ? String(sched.dayOfMonth) : '',
        lastWorkingDay: sched.monthMode === 'LAST_WORKING_DAY',
        intervalDays: sched.intervalDays != null ? String(sched.intervalDays) : '',
        startDate: sched.startDate ?? '',
        endCondition: sched.endCondition as EndCondition,
        endOccurrences: sched.endAfterOccurrences != null ? String(sched.endAfterOccurrences) : '',
        endDate: sched.endOnDate ?? '',
      })
    }
  }, [editData, isEditMode, step1Form, step2Form])

  // Beneficiary lock state
  const isBeneficiaryLocked = selectedBeneficiary !== '' && selectedBeneficiary !== 'manual'

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setStep(1)
      setSelectedBeneficiary('')
      step1Form.reset()
      step2Form.reset()
    }, 300)
  }

  const handleStep1Continue = step1Form.handleSubmit(() => {
    setStep(2)
  })

  const handleStep2Save = step2Form.handleSubmit(scheduleData => {
    const payoutData = step1Form.getValues()
    const isOneTime = scheduleData.scheduleType === 'ONE_TIME'

    const payload: CreateScheduledPayoutRequest = {
      name: payoutData.name,
      payment_mode: payoutData.paymentMode as 'IMPS' | 'NEFT' | 'RTGS',
      wallet_id: payoutData.walletId,
      amount: Number(payoutData.amount),
      beneficiary_name: payoutData.beneficiaryName,
      beneficiary_account: payoutData.accountNumber,
      beneficiary_ifsc: payoutData.ifsc.toUpperCase(),
      bank_name: payoutData.bankName,
      beneficiary_address: payoutData.beneficiaryAddress || undefined,
      reference_id: payoutData.referenceId || undefined,
      remarks: payoutData.remarks,
      schedule: {
        frequency: isOneTime ? ('ONE_TIME' as Frequency) : (scheduleData.frequency as Frequency),
        execution_time: scheduleData.executionTime,
        start_date: isOneTime ? scheduleData.executionDate : scheduleData.startDate,
        end_condition: isOneTime ? 'NEVER' : (scheduleData.endCondition as EndCondition),
        ...(scheduleData.frequency === 'WEEKLY' && scheduleData.dayOfWeek
          ? { day_of_week: DAY_OF_WEEK_MAP[scheduleData.dayOfWeek] }
          : {}),
        ...(scheduleData.frequency === 'MONTHLY'
          ? {
              month_mode: (scheduleData.lastWorkingDay
                ? 'LAST_WORKING_DAY'
                : 'SPECIFIC_DATE') as MonthMode,
              ...(scheduleData.dayOfMonth && !scheduleData.lastWorkingDay
                ? { day_of_month: Number(scheduleData.dayOfMonth) }
                : {}),
            }
          : {}),
        ...(scheduleData.frequency === 'CUSTOM' && scheduleData.intervalDays
          ? { interval_days: Number(scheduleData.intervalDays) }
          : {}),
        ...(scheduleData.endCondition === 'AFTER_OCCURRENCES' && scheduleData.endOccurrences
          ? { end_after_occurrences: Number(scheduleData.endOccurrences) }
          : {}),
        ...(scheduleData.endCondition === 'ON_DATE' && scheduleData.endDate
          ? { end_on_date: scheduleData.endDate }
          : {}),
      },
    }

    if (isEditMode && editPayoutId) {
      updateMutation.mutate(
        { id: editPayoutId, data: payload },
        {
          onSuccess: () => {
            toast.success('Scheduled payout updated')
            handleClose()
          },
          onError: error => toast.error(getErrorMessage(error)),
        },
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Scheduled payout created')
          handleClose()
        },
        onError: error => toast.error(getErrorMessage(error)),
      })
    }
  })

  const monthlyOption = useMemo(() => {
    if (lastWorkingDay) return 'last-working-day'
    return 'specific-date'
  }, [lastWorkingDay])

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:w-[640px] sm:max-w-[640px] [&>button]:hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-5">
          <h2 className="text-lg font-medium text-foreground">
            {isEditMode ? 'Edit Scheduled Payout' : 'Create Scheduled Payout'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <AppIcon icon={X} />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-3 border-b border-foreground/10 px-6 pb-5 pt-2">
          <StepIndicator step={1} currentStep={step} label="Payout Details" />
          <div className="h-px flex-1 bg-foreground/10" />
          <StepIndicator step={2} currentStep={step} label="Schedule" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 1 ? (
            <Step1Content
              form={step1Form}
              wallets={wallets}
              beneficiaries={beneficiaries}
              selectedBeneficiary={selectedBeneficiary}
              onBeneficiarySelect={setSelectedBeneficiary}
              isBeneficiaryLocked={isBeneficiaryLocked}
              isPending={isPending}
            />
          ) : (
            <Step2Content
              form={step2Form}
              scheduleType={scheduleType as 'ONE_TIME' | 'RECURRING'}
              frequency={frequency as RecurringFrequency | undefined}
              endCondition={endCondition as EndCondition}
              monthlyOption={monthlyOption}
              isPending={isPending}
              onMonthlyOptionChange={(value: string) => {
                if (value === 'last-working-day') {
                  step2Form.setValue('lastWorkingDay', true)
                  step2Form.setValue('dayOfMonth', '')
                } else {
                  step2Form.setValue('lastWorkingDay', false)
                }
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-foreground/10 px-6 py-4">
          <div>
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <AppIcon icon={ArrowLeft} size="sm" />
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="h-[2.625rem] rounded-md border border-foreground/20 px-5 text-sm text-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            {step === 1 ? (
              <button
                type="button"
                onClick={handleStep1Continue}
                className="h-[2.625rem] rounded-md bg-button-bg px-5 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
              >
                Continue to Schedule →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStep2Save}
                disabled={isPending}
                className="h-[2.625rem] rounded-md bg-button-bg px-5 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save Scheduled Payout'}
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// --- Step Indicator ---

function StepIndicator({
  step,
  currentStep,
  label,
}: {
  step: number
  currentStep: number
  label: string
}) {
  const isActive = currentStep >= step
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'flex size-6 items-center justify-center rounded-full text-xs font-medium',
          isActive ? 'bg-button-bg text-primary-foreground' : 'bg-secondary text-muted-foreground',
        )}
      >
        {step}
      </span>
      <span
        className={cn(
          'text-sm',
          isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
        )}
      >
        {label}
      </span>
    </div>
  )
}

// --- Step 1: Payout Details ---

interface MerchantWallet {
  id: string
  walletCode: string
  providerName: string
  availableBalance: number
}

function Step1Content({
  form,
  wallets,
  beneficiaries,
  selectedBeneficiary,
  onBeneficiarySelect,
  isBeneficiaryLocked,
  isPending,
}: {
  form: ReturnType<typeof useForm<PayoutDetailsFormData>>
  wallets: MerchantWallet[]
  beneficiaries: Beneficiary[]
  selectedBeneficiary: string
  onBeneficiarySelect: (value: string) => void
  isBeneficiaryLocked: boolean
  isPending: boolean
}) {
  const handleBeneficiarySelect = (value: string) => {
    onBeneficiarySelect(value)
    if (value === 'manual') {
      form.setValue('beneficiaryName', '')
      form.setValue('accountNumber', '')
      form.setValue('ifsc', '')
      form.setValue('bankName', '')
    } else {
      const selected = beneficiaries.find(b => b.id === value)
      if (selected) {
        form.setValue('beneficiaryName', selected.beneficiaryName)
        form.setValue('accountNumber', selected.accountNumber)
        form.setValue('ifsc', selected.ifsc)
        form.setValue('bankName', selected.bankName)
      }
    }
  }

  return (
    <Form {...form}>
      <div className="flex flex-col gap-6">
        {/* Payout Details Section */}
        <div className="flex flex-col gap-4 rounded-lg border border-foreground/10 bg-secondary/50 p-4">
          <p className="text-sm font-medium text-foreground">Payout Details</p>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>
                  Schedule Name<span className="-ml-1 text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Monthly Salary"
                    className={inputStyles}
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-3.5">
            <FormField
              control={form.control}
              name="paymentMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>
                    Payment Mode<span className="-ml-1 text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger className={selectTriggerStyles}>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="IMPS">IMPS</SelectItem>
                      <SelectItem value="NEFT">NEFT</SelectItem>
                      <SelectItem value="RTGS">RTGS</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="walletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>
                    Wallet<span className="-ml-1 text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger className={selectTriggerStyles}>
                        <SelectValue placeholder="Select wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.length === 0 ? (
                        <div className="px-3.5 py-2.5 text-sm text-muted-foreground">
                          No wallets found. Please create a wallet first.
                        </div>
                      ) : (
                        wallets.map(w => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.providerName} ({w.walletCode})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>
                  Amount (₹)<span className="-ml-1 text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="0.00"
                    inputMode="decimal"
                    className={inputStyles}
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Beneficiary Section */}
        <div className="flex flex-col gap-4 rounded-lg border border-foreground/10 bg-secondary/50 p-4">
          <p className="text-sm font-medium text-foreground">Beneficiary</p>

          <div className="flex flex-col gap-1.5">
            <label className={cn(labelStyles, 'text-muted-foreground')}>
              Pre-configured Beneficiary
            </label>
            <Select value={selectedBeneficiary} onValueChange={handleBeneficiarySelect}>
              <SelectTrigger className={selectTriggerStyles}>
                <SelectValue placeholder="Select or enter manually" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">— Enter manually —</SelectItem>
                {beneficiaries.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.beneficiaryName} — {b.accountNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isBeneficiaryLocked && (
              <p className="text-xs text-muted-foreground">
                Selecting a beneficiary will auto-fill and lock the fields below
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-3.5">
            <FormField
              control={form.control}
              name="beneficiaryName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>
                    Beneficiary Name<span className="-ml-1 text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Full name"
                      className={inputStyles}
                      {...field}
                      disabled={isPending || isBeneficiaryLocked}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>
                    Account Number<span className="-ml-1 text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Account number"
                      className={inputStyles}
                      {...field}
                      disabled={isPending || isBeneficiaryLocked}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-3.5">
            <FormField
              control={form.control}
              name="ifsc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>
                    IFSC<span className="-ml-1 text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. SBIN0006000"
                      className={inputStyles}
                      {...field}
                      onChange={e => field.onChange(e.target.value.toUpperCase())}
                      disabled={isPending || isBeneficiaryLocked}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>
                    Bank Name<span className="-ml-1 text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Bank name"
                      className={inputStyles}
                      {...field}
                      disabled={isPending || isBeneficiaryLocked}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>
                  Remarks<span className="-ml-1 text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Purpose of payment"
                    className={inputStyles}
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Optional Details Section */}
        <div className="flex flex-col gap-4 rounded-lg border border-foreground/10 bg-secondary/50 p-4">
          <p className="text-sm font-medium text-foreground">Optional Details</p>

          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-3.5">
            <FormField
              control={form.control}
              name="beneficiaryAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>Beneficiary Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional"
                      className={inputStyles}
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>Reference ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional"
                      className={inputStyles}
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </Form>
  )
}

// --- Step 2: Schedule Configuration ---

function Step2Content({
  form,
  scheduleType,
  frequency,
  endCondition,
  monthlyOption,
  isPending,
  onMonthlyOptionChange,
}: {
  form: ReturnType<typeof useForm<ScheduleConfigFormData>>
  scheduleType: 'ONE_TIME' | 'RECURRING'
  frequency: RecurringFrequency | undefined
  endCondition: EndCondition
  monthlyOption: string
  isPending: boolean
  onMonthlyOptionChange: (value: string) => void
}) {
  const { setValue, watch } = form

  return (
    <Form {...form}>
      <div className="flex flex-col gap-6">
        {/* Schedule Type Toggle */}
        <div className="flex flex-col gap-4 rounded-lg border border-foreground/10 bg-secondary/50 p-4">
          <p className="text-sm font-medium text-foreground">Schedule Type</p>
          <div className="flex rounded-lg border border-foreground/10 bg-background p-1">
            <button
              type="button"
              onClick={() => setValue('scheduleType', 'ONE_TIME')}
              className={cn(
                'flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all',
                scheduleType === 'ONE_TIME'
                  ? 'bg-button-bg text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              One-Time
            </button>
            <button
              type="button"
              onClick={() => setValue('scheduleType', 'RECURRING')}
              className={cn(
                'flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all',
                scheduleType === 'RECURRING'
                  ? 'bg-button-bg text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Recurring
            </button>
          </div>
        </div>

        {/* One-Time Configuration */}
        {scheduleType === 'ONE_TIME' && (
          <div className="flex flex-col gap-4 rounded-lg border border-foreground/10 bg-secondary/50 p-4">
            <p className="text-sm font-medium text-foreground">Execution</p>
            <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-3.5">
              <FormField
                control={form.control}
                name="executionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyles}>
                      Execution Date<span className="-ml-1 text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Execution date"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="executionTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyles}>
                      Execution Time<span className="-ml-1 text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <TimePicker
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Recurring Configuration */}
        {scheduleType === 'RECURRING' && (
          <>
            {/* Frequency Selection */}
            <div className="flex flex-col gap-4 rounded-lg border border-foreground/10 bg-secondary/50 p-4">
              <p className="text-sm font-medium text-foreground">
                Frequency <span className="text-destructive">*</span>
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {FREQUENCY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue('frequency', opt.value, { shouldValidate: true })}
                    className={cn(
                      'flex flex-col gap-1 rounded-lg border px-4 py-3.5 text-left transition-all',
                      frequency === opt.value
                        ? 'border-button-bg bg-button-bg/5 shadow-sm'
                        : 'border-foreground/10 bg-background hover:border-foreground/20',
                    )}
                  >
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  </button>
                ))}
              </div>
              {form.formState.errors.frequency && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.frequency.message}
                </p>
              )}

              {/* Weekly — Day of Week */}
              {frequency === 'WEEKLY' && (
                <div className="flex flex-col gap-2.5 border-t border-foreground/10 pt-4">
                  <label className={cn(labelStyles, 'text-muted-foreground')}>
                    Day of Week <span className="text-destructive">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => setValue('dayOfWeek', day.value, { shouldValidate: true })}
                        className={cn(
                          'size-10 rounded-full border text-sm font-medium transition-all',
                          watch('dayOfWeek') === day.value
                            ? 'border-button-bg bg-button-bg text-primary-foreground shadow-sm'
                            : 'border-foreground/10 bg-background text-foreground hover:border-foreground/20',
                        )}
                      >
                        {day.label.charAt(0) + day.label.charAt(1)}
                      </button>
                    ))}
                  </div>
                  {form.formState.errors.dayOfWeek && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.dayOfWeek.message}
                    </p>
                  )}
                </div>
              )}

              {/* Monthly Options */}
              {frequency === 'MONTHLY' && (
                <div className="flex flex-col gap-3 border-t border-foreground/10 pt-4">
                  <label className={cn(labelStyles, 'text-muted-foreground')}>Monthly Option</label>
                  <div className="flex flex-col gap-2.5">
                    <div
                      className={cn(
                        'rounded-lg border px-4 py-3 transition-all',
                        monthlyOption === 'specific-date'
                          ? 'border-button-bg bg-button-bg/5'
                          : 'border-foreground/10 bg-background hover:border-foreground/20',
                      )}
                    >
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="monthlyOption"
                          checked={monthlyOption === 'specific-date'}
                          onChange={() => onMonthlyOptionChange('specific-date')}
                          className="accent-[hsl(var(--button-bg))]"
                        />
                        <span className="text-sm text-foreground">Specific date of month</span>
                      </label>
                      {monthlyOption === 'specific-date' && (
                        <div className="mt-3 ml-7">
                          <FormField
                            control={form.control}
                            name="dayOfMonth"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={31}
                                    placeholder="Day (1-31)"
                                    className={cn(inputStyles, 'w-32')}
                                    {...field}
                                    onChange={e => {
                                      field.onChange(e)
                                      form.trigger('dayOfMonth')
                                    }}
                                    disabled={isPending}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    <label
                      className={cn(
                        'flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-3 transition-all',
                        monthlyOption === 'last-working-day'
                          ? 'border-button-bg bg-button-bg/5'
                          : 'border-foreground/10 bg-background hover:border-foreground/20',
                      )}
                    >
                      <input
                        type="radio"
                        name="monthlyOption"
                        checked={monthlyOption === 'last-working-day'}
                        onChange={() => onMonthlyOptionChange('last-working-day')}
                        className="accent-[hsl(var(--button-bg))]"
                      />
                      <span className="text-sm text-foreground">Last working day of month</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Custom — Interval Days */}
              {frequency === 'CUSTOM' && (
                <div className="border-t border-foreground/10 pt-4">
                  <FormField
                    control={form.control}
                    name="intervalDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelStyles}>
                          Interval<span className="-ml-1 text-destructive">*</span>
                        </FormLabel>
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm text-muted-foreground">Every</span>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="N"
                              className={cn(inputStyles, 'w-32')}
                              {...field}
                              disabled={isPending}
                            />
                          </FormControl>
                          <span className="text-sm text-muted-foreground">day(s)</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Start Date & Time */}
            <div className="flex flex-col gap-4 rounded-lg border border-foreground/10 bg-secondary/50 p-4">
              <p className="text-sm font-medium text-foreground">Start Date & Time</p>
              <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-3.5">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelStyles}>
                        Start Date<span className="-ml-1 text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Start date"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="executionTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelStyles}>
                        Execution Time<span className="-ml-1 text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <TimePicker
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* End Condition */}
            <div className="flex flex-col gap-4 rounded-lg border border-foreground/10 bg-secondary/50 p-4">
              <p className="text-sm font-medium text-foreground">End Condition</p>
              <div className="flex flex-col gap-2.5">
                <label
                  className={cn(
                    'flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-3 transition-all',
                    endCondition === 'NEVER'
                      ? 'border-button-bg bg-button-bg/5'
                      : 'border-foreground/10 bg-background hover:border-foreground/20',
                  )}
                >
                  <input
                    type="radio"
                    name="endCondition"
                    checked={endCondition === 'NEVER'}
                    onChange={() => setValue('endCondition', 'NEVER')}
                    className="accent-[hsl(var(--button-bg))]"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">Never</span>
                    <span className="text-xs text-muted-foreground">Continues indefinitely</span>
                  </div>
                </label>

                <div
                  className={cn(
                    'rounded-lg border px-4 py-3 transition-all',
                    endCondition === 'AFTER_OCCURRENCES'
                      ? 'border-button-bg bg-button-bg/5'
                      : 'border-foreground/10 bg-background hover:border-foreground/20',
                  )}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="endCondition"
                      checked={endCondition === 'AFTER_OCCURRENCES'}
                      onChange={() => setValue('endCondition', 'AFTER_OCCURRENCES')}
                      className="accent-[hsl(var(--button-bg))]"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">After N occurrences</span>
                      <span className="text-xs text-muted-foreground">
                        Stop after a set number of runs
                      </span>
                    </div>
                  </label>
                  {endCondition === 'AFTER_OCCURRENCES' && (
                    <div className="mt-3 ml-7">
                      <FormField
                        control={form.control}
                        name="endOccurrences"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                placeholder="Number of occurrences"
                                className={cn(inputStyles, 'w-48')}
                                {...field}
                                onChange={e => {
                                  field.onChange(e)
                                  form.trigger('endOccurrences')
                                }}
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    'rounded-lg border px-4 py-3 transition-all',
                    endCondition === 'ON_DATE'
                      ? 'border-button-bg bg-button-bg/5'
                      : 'border-foreground/10 bg-background hover:border-foreground/20',
                  )}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="endCondition"
                      checked={endCondition === 'ON_DATE'}
                      onChange={() => setValue('endCondition', 'ON_DATE')}
                      className="accent-[hsl(var(--button-bg))]"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">On specific date</span>
                      <span className="text-xs text-muted-foreground">Stop on a chosen date</span>
                    </div>
                  </label>
                  {endCondition === 'ON_DATE' && (
                    <div className="mt-3 ml-7">
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="End date"
                                disabled={isPending}
                                className="w-48"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Form>
  )
}
