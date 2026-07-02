'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { FormDialog } from '@/components/shared/form-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { createPayoutSchema, type CreatePayoutFormData } from '../schemas'
import { useCreatePayout, useMyWallets } from '../model/use-payouts'
import type { CreatePayoutRequest, PaymentMode } from '../types'
import { useCalculateFee } from '@/features/merchants'
import { useBeneficiaries } from '@/features/beneficiaries'
import { logger } from '@/lib/core/logger'
import { getErrorMessage, parseApiError } from '@/lib/api/error-handler'

interface CreatePayoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'NEFT', label: 'NEFT' },
  { value: 'IMPS', label: 'IMPS' },
  { value: 'RTGS', label: 'RTGS' },
  { value: 'UPI', label: 'UPI' },
]

function formatCurrency(amount: number) {
  return `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function CreatePayoutModal({ open, onOpenChange }: CreatePayoutModalProps) {
  const form = useForm<CreatePayoutFormData>({
    resolver: zodResolver(createPayoutSchema),
    defaultValues: {
      paymentMode: undefined,
      amount: '',
      beneficiaryName: '',
      beneficiaryAccount: '',
      beneficiaryIfsc: '',
      beneficiaryAddress: '',
      bankName: '',
      referenceId: '',
      remarks: '',
    },
  })

  const createPayout = useCreatePayout()
  const { data: wallets = [] } = useMyWallets(open)
  const [selectedWalletId, setSelectedWalletId] = useState('')
  const [balanceError, setBalanceError] = useState('')
  const watchedAmount = useWatch({ control: form.control, name: 'amount' })
  const watchedPaymentMode = useWatch({ control: form.control, name: 'paymentMode' })
  const amountValue = Number(watchedAmount) || 0

  // Resolve effective wallet ID: user selection, else the primary wallet
  // (is_default), else the first wallet.
  const effectiveWalletId = useMemo(() => {
    if (selectedWalletId && wallets.some(w => w.id === selectedWalletId)) return selectedWalletId
    const primary = wallets.find(w => w.isDefault)
    return primary?.id ?? wallets[0]?.id ?? ''
  }, [selectedWalletId, wallets])

  const selectedWallet = wallets.find(w => w.id === effectiveWalletId)

  // Pre-configured beneficiary selector — auto-fills and locks the beneficiary
  // fields (mirrors the Create Scheduled Payout drawer).
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('')
  const { data: beneficiariesResponse } = useBeneficiaries({ per_page: 100 }, { enabled: open })
  const beneficiaries = beneficiariesResponse?.data?.items ?? []
  const isBeneficiaryLocked = selectedBeneficiary !== '' && selectedBeneficiary !== 'manual'

  const handleBeneficiarySelect = (value: string) => {
    setSelectedBeneficiary(value)
    if (value === 'manual') {
      form.setValue('beneficiaryName', '')
      form.setValue('beneficiaryAccount', '')
      form.setValue('beneficiaryIfsc', '')
      form.setValue('bankName', '')
    } else {
      const selected = beneficiaries.find(b => b.id === value)
      if (selected) {
        form.setValue('beneficiaryName', selected.beneficiaryName)
        form.setValue('beneficiaryAccount', selected.accountNumber)
        form.setValue('beneficiaryIfsc', selected.ifsc)
        form.setValue('bankName', selected.bankName)
      }
    }
  }

  const [debouncedAmount, setDebouncedAmount] = useState(0)
  useEffect(() => {
    const delay = amountValue === 0 ? 0 : 500
    const t = setTimeout(() => setDebouncedAmount(amountValue), delay)
    return () => clearTimeout(t)
  }, [amountValue])

  const {
    data: feeCalc,
    isFetching: isFeeLoading,
    error: feeError,
  } = useCalculateFee({
    amount: debouncedAmount,
    walletId: effectiveWalletId,
    paymentMode: (watchedPaymentMode as 'NEFT' | 'IMPS' | 'RTGS' | 'UPI' | undefined) ?? '',
  })

  // Surface fee-calculation errors (e.g. NO_ROUTING_RULE) inline, the same way
  // the insufficient-balance message is shown.
  const feeErrorMessage =
    amountValue > 0 && watchedPaymentMode && !isFeeLoading && feeError
      ? getErrorMessage(feeError)
      : ''

  // The wallet is debited the fee-inclusive deduction (amount + fees), so the
  // balance check must compare against that total, not just the requested amount.
  const availableBalance = selectedWallet?.availableBalance ?? 0
  const totalDeduction = amountValue > 0 ? (feeCalc?.netAmount ?? amountValue) : 0
  const insufficientBalance =
    amountValue > 0 && !isFeeLoading && !feeError && totalDeduction > availableBalance
  const insufficientBalanceMessage = insufficientBalance
    ? `Insufficient balance. Available: ${formatCurrency(availableBalance)}, Required: ${formatCurrency(totalDeduction)}`
    : ''

  const handleClose = () => {
    if (createPayout.isPending) return
    form.reset()
    setSelectedWalletId('')
    setSelectedBeneficiary('')
    setBalanceError('')
    onOpenChange(false)
  }

  const onSubmit = async (data: CreatePayoutFormData) => {
    try {
      setBalanceError('')

      if (!selectedWallet) {
        setBalanceError('Please select a wallet')
        return
      }

      // Fee-calc / insufficient-balance errors are shown inline; block submit.
      if (feeErrorMessage || insufficientBalance) {
        return
      }

      const amount = Number(data.amount)

      const payload: CreatePayoutRequest = {
        amount,
        bank_name: data.bankName,
        beneficiary_account: data.beneficiaryAccount,
        beneficiary_ifsc: data.beneficiaryIfsc.toUpperCase(),
        beneficiary_name: data.beneficiaryName,
        beneficiary_address: data.beneficiaryAddress || '',
        payment_mode: data.paymentMode as PaymentMode,
        reference_id: data.referenceId || '',
        remarks: data.remarks || '',
        wallet_id: selectedWallet.id,
      }

      await createPayout.mutateAsync(payload)
      toast.success('Payout created successfully')
      handleClose()
    } catch (error) {
      logger.error('Create payout error', { error: String(error) })
      const apiError = parseApiError(error)
      if (apiError.code === 'DAILY_LIMIT_REACHED') {
        setBalanceError(apiError.message)
        return
      }
      toast.error(getErrorMessage(error))
    }
  }

  const labelStyles = 'text-sm font-normal capitalize'
  const inputStyles =
    '!h-12 border-[0.4px] border-foreground/40 bg-secondary px-6 text-sm placeholder:text-muted-foreground'
  const selectTriggerStyles =
    '!h-12 w-full min-w-0 border-[0.4px] border-foreground/40 bg-secondary px-6 text-sm'

  return (
    <FormDialog
      open={open}
      onOpenChange={handleClose}
      title="Create payout"
      formId="create-payout-form"
      isPending={createPayout.isPending}
      submitDisabled={!!feeErrorMessage || insufficientBalance || isFeeLoading}
      submitLabel="Create Payout"
      pendingLabel="Creating..."
      size="lg"
      scrollable
      showCloseButton={false}
    >
      {/* Wallet Selector */}
      <div className="grid min-w-0 gap-6">
        <div className="grid min-w-0 gap-2">
          <Label className={labelStyles}>
            Select Wallet<span className="-ml-1 text-destructive">*</span>
          </Label>
          <Select value={effectiveWalletId} onValueChange={setSelectedWalletId}>
            <SelectTrigger className={selectTriggerStyles}>
              <SelectValue placeholder="Select wallet" />
            </SelectTrigger>
            <SelectContent>
              {wallets.map(w => (
                <SelectItem key={w.id} value={w.id}>
                  {w.providerName} ({w.walletCode}) — {formatCurrency(w.availableBalance)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Balance Info */}
        <div className="grid gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 items-stretch gap-3.5">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-normal text-foreground">Payout Balance</p>
              <div className="flex flex-1 flex-col justify-center rounded-md border-[0.4px] border-foreground/40 bg-secondary px-6 py-3.5">
                <p className="text-2xl">{formatCurrency(selectedWallet?.availableBalance ?? 0)}</p>
                <p className="mt-3.5 text-xs text-muted-foreground">Available balance</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-normal capitalize text-foreground">Payout Deduction</p>
              <div className="rounded-md border-[0.4px] border-foreground/40 bg-secondary px-6 py-3.5">
                <p className="text-2xl">
                  {formatCurrency(amountValue > 0 ? (feeCalc?.netAmount ?? amountValue) : 0)}
                </p>
                <p className="mt-3.5 text-xs text-muted-foreground">Amount will be deducted</p>
                {amountValue > 0 && (isFeeLoading || (feeCalc?.fee ?? 0) > 0) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {`Fees ${isFeeLoading ? '...' : formatCurrency(feeCalc!.fee)}`}
                  </p>
                )}
              </div>
            </div>
          </div>
          {balanceError && <p className="text-sm text-destructive">{balanceError}</p>}
          {feeErrorMessage && <p className="text-sm text-destructive">{feeErrorMessage}</p>}
          {insufficientBalanceMessage && (
            <p className="text-sm text-destructive">{insufficientBalanceMessage}</p>
          )}
        </div>
      </div>

      <Form {...form}>
        <form
          id="create-payout-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          {/* Row 1: Payment Mode + Requested Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-3.5">
            <FormField
              control={form.control}
              name="paymentMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>
                    Payment Mode<span className="-ml-1 text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={createPayout.isPending}
                  >
                    <FormControl>
                      <SelectTrigger className={selectTriggerStyles}>
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_MODES.map(mode => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>
                    Requested Amount<span className="-ml-1 text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter amount"
                      className={inputStyles}
                      {...field}
                      disabled={createPayout.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Pre-configured Beneficiary */}
          <div className="flex flex-col gap-2">
            <label className={`${labelStyles}`}>Pre-configured Beneficiary</label>
            <Select
              value={selectedBeneficiary}
              onValueChange={handleBeneficiarySelect}
              disabled={createPayout.isPending}
            >
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
                Selecting a beneficiary auto-fills and locks the fields below.
              </p>
            )}
          </div>

          {/* Row 2: Beneficiary Name + Account */}
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
                      placeholder="Enter Beneficiary Name"
                      className={inputStyles}
                      {...field}
                      disabled={createPayout.isPending || isBeneficiaryLocked}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="beneficiaryAccount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>
                    Beneficiary Account<span className="-ml-1 text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Beneficiary Account"
                      className={inputStyles}
                      {...field}
                      disabled={createPayout.isPending || isBeneficiaryLocked}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Row 3: Beneficiary IFSC + Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-3.5">
            <FormField
              control={form.control}
              name="beneficiaryIfsc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>
                    Beneficiary IFSC<span className="-ml-1 text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Beneficiary IFSC"
                      className={inputStyles}
                      {...field}
                      onChange={e => field.onChange(e.target.value.toUpperCase())}
                      disabled={createPayout.isPending || isBeneficiaryLocked}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="beneficiaryAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>Beneficiary Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Beneficiary Address"
                      className={inputStyles}
                      {...field}
                      disabled={createPayout.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Row 4: Bank Name + Reference ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-3.5">
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
                      placeholder="Enter Bank Name"
                      className={inputStyles}
                      {...field}
                      disabled={createPayout.isPending || isBeneficiaryLocked}
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
                      placeholder="Enter Ref ID"
                      className={inputStyles}
                      {...field}
                      disabled={createPayout.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Row 5: Remarks (full width) */}
          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>
                  Remarks<span className="-ml-1 text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-[6.25rem] resize-none border-[0.4px] border-foreground/40 bg-secondary px-6 py-3.5 text-sm"
                    {...field}
                    disabled={createPayout.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormDialog>
  )
}
