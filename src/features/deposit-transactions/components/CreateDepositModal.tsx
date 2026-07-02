'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { FileText, X } from 'lucide-react'

import { AppIcon } from '@/components/shared/app-icon'
import { Button } from '@/components/ui/button'
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
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { uploadsService } from '@/lib/api/uploads.api'
import { formatFileSize } from '@/lib/core/format'

import {
  useCreateDeposit,
  useMyVirtualAccounts,
  useMyBankAccounts,
} from '../model/use-deposit-mutations'
import { useDepositTransactionsPanelStore } from '../model/deposit-transactions-ui-store'
import { createDepositSchema, type CreateDepositFormData } from '../schemas'
import { getErrorMessage } from '@/lib/api/error-handler'

export function CreateDepositModal() {
  const open = useDepositTransactionsPanelStore(s => s.createDepositOpen)
  const closeCreateDeposit = useDepositTransactionsPanelStore(s => s.closeCreateDeposit)

  const bankAccountsQuery = useMyBankAccounts('DEPOSIT', open)
  const bankAccounts = useMemo(() => bankAccountsQuery.data ?? [], [bankAccountsQuery.data])

  const virtualAccountsQuery = useMyVirtualAccounts(open)
  const virtualAccounts = useMemo(
    () => virtualAccountsQuery.data ?? [],
    [virtualAccountsQuery.data],
  )
  const [selectedVAId, setSelectedVAId] = useState<string>('')

  // Auto-select first VA when data loads, or when modal opens with fresh data
  useEffect(() => {
    if (virtualAccounts.length > 0 && !selectedVAId) {
      setSelectedVAId(virtualAccounts[0].id)
    }
  }, [virtualAccounts, selectedVAId])

  const destinationAccount = virtualAccounts.find(va => va.id === selectedVAId) ?? null

  const createDeposit = useCreateDeposit()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  const form = useForm<CreateDepositFormData>({
    resolver: zodResolver(createDepositSchema),
    defaultValues: {
      amount: '',
      fromBankAccountId: '',
      utr: '',
      paymentScreenshotId: '',
    },
  })

  // Cleanup the object URL when file changes or modal closes.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const resetState = () => {
    form.reset({
      amount: '',
      fromBankAccountId: '',
      utr: '',
      paymentScreenshotId: '',
    })
    setSelectedVAId('')
    setFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    setUploadProgress(0)
    setUploading(false)
  }

  const handleClose = () => {
    if (uploading || createDeposit.isPending) return
    resetState()
    closeCreateDeposit()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    if (!picked) return

    setFile(picked)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(picked))
    setUploadProgress(0)
    setUploading(true)
    form.setValue('paymentScreenshotId', '', { shouldValidate: false })

    try {
      const uploaded = await uploadsService.uploadFile(picked, percent =>
        setUploadProgress(percent),
      )
      form.setValue('paymentScreenshotId', uploaded.id, { shouldValidate: true })
      setUploadProgress(100)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
      setUploadProgress(0)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = () => {
    if (uploading) return
    setFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    setUploadProgress(0)
    form.setValue('paymentScreenshotId', '', { shouldValidate: true })
  }

  const onSubmit = async (data: CreateDepositFormData) => {
    if (!destinationAccount) {
      toast.error('No virtual account assigned to this merchant')
      return
    }

    try {
      await createDeposit.mutateAsync({
        amount: Number(data.amount),
        from_bank_account_id: data.fromBankAccountId,
        mode: 'MANUAL',
        reference: data.utr,
        screenshot_upload_id: data.paymentScreenshotId,
        virtual_account_id: destinationAccount.id,
      })
      toast.success('Deposit request submitted')
      resetState()
      closeCreateDeposit()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const isImage = !!file && file.type.startsWith('image/')
  const fileSizeLabel = file ? formatFileSize(file.size) : ''
  const submitting = createDeposit.isPending

  const labelStyles = 'text-sm font-normal capitalize text-foreground'
  const inputStyles =
    '!h-12 border-[0.4px] border-foreground/40 bg-secondary px-6 text-sm placeholder:text-muted-foreground'
  const selectTriggerStyles =
    '!h-12 w-full min-w-0 border-[0.4px] border-foreground/40 bg-secondary px-6 text-sm'

  return (
    <FormDialog
      open={open}
      onOpenChange={o => (!o ? handleClose() : null)}
      title="Create deposit"
      formId="create-deposit-form"
      isPending={submitting}
      submitLabel="Save changes"
      pendingLabel="Submitting..."
      submitDisabled={uploading || !destinationAccount}
      size="lg"
      scrollable
      showCloseButton={false}
    >
      <Form {...form}>
        <form
          id="create-deposit-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex min-w-0 flex-col gap-6"
        >
          {/* Deposit Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>
                  Deposit Amount<span className="-ml-1 text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter Deposit Amount"
                    className={inputStyles}
                    inputMode="decimal"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Destination Wallet */}
          <div className="flex min-w-0 flex-col gap-3.5">
            {virtualAccounts.length > 1 && (
              <FormItem>
                <FormLabel className={labelStyles}>
                  Destination Wallet<span className="-ml-1 text-destructive">*</span>
                </FormLabel>
                <Select
                  value={selectedVAId}
                  onValueChange={setSelectedVAId}
                  disabled={virtualAccountsQuery.isLoading}
                >
                  <SelectTrigger className={selectTriggerStyles}>
                    <SelectValue
                      placeholder={
                        virtualAccountsQuery.isLoading
                          ? 'Loading wallets...'
                          : 'Select destination wallet'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {virtualAccounts.map(va => (
                      <SelectItem key={va.id} value={va.id}>
                        {va.bankName} • {va.accountNumber} ({va.accountHolderName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}

            {/* Beneficiary info card */}
            <div className="flex flex-col gap-3.5 rounded-md bg-secondary p-6 text-sm">
              {virtualAccountsQuery.isLoading ? (
                <p className="text-muted-foreground">Loading destination account...</p>
              ) : destinationAccount ? (
                <>
                  <BeneficiaryRow label="Bank name" value={destinationAccount.bankName} />
                  <BeneficiaryRow
                    label="Account name"
                    value={destinationAccount.accountHolderName}
                  />
                  <BeneficiaryRow label="Account number" value={destinationAccount.accountNumber} />
                  <BeneficiaryRow label="IFSC" value={destinationAccount.ifsc} />
                  {destinationAccount.accountType ? (
                    <BeneficiaryRow label="Account type" value={destinationAccount.accountType} />
                  ) : null}
                </>
              ) : (
                <p className="text-muted-foreground">
                  No active virtual account found for this merchant.
                </p>
              )}
            </div>
          </div>

          {/* From Bank Account */}
          <FormField
            control={form.control}
            name="fromBankAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>
                  From Bank Account<span className="-ml-1 text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={bankAccountsQuery.isLoading}
                >
                  <FormControl>
                    <SelectTrigger className={selectTriggerStyles}>
                      <SelectValue
                        placeholder={
                          bankAccountsQuery.isLoading
                            ? 'Loading bank accounts...'
                            : 'Select bank account'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bankAccounts.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No bank accounts found
                      </SelectItem>
                    ) : (
                      bankAccounts.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.bankName} • {b.accountNumber} ({b.accountHolderName})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* UTR */}
          <FormField
            control={form.control}
            name="utr"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>
                  UTR<span className="-ml-1 text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter UTR" className={inputStyles} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Payment Screenshot */}
          <FormField
            control={form.control}
            name="paymentScreenshotId"
            render={() => (
              <FormItem>
                <FormLabel className={labelStyles}>
                  Payment Screenshot<span className="-ml-1 text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-3">
                    <div className="flex h-12 items-center justify-between rounded-md border-[0.4px] border-foreground/40 bg-secondary pl-6 pr-2">
                      <span
                        className={
                          file
                            ? 'truncate text-sm text-foreground'
                            : 'truncate text-sm text-muted-foreground'
                        }
                      >
                        {uploading
                          ? `Uploading... ${uploadProgress}%`
                          : file
                            ? file.name
                            : 'No file chosen'}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-sm border-[0.4px] border-foreground/40 bg-card text-sm font-normal"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || submitting}
                      >
                        Choose file
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>

                    {(uploading || (file && uploadProgress > 0 && uploadProgress < 100)) && (
                      <Progress value={uploadProgress} className="h-2" />
                    )}

                    {file && !uploading && (
                      <div className="flex items-start gap-3 rounded-md border-[0.4px] border-foreground/40 bg-secondary p-3">
                        {isImage && previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt={file.name}
                            className="h-24 w-24 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-md bg-muted">
                            <AppIcon icon={FileText} size="xl" color="muted" />
                          </div>
                        )}
                        <div className="flex flex-1 flex-col gap-1">
                          <p className="truncate text-sm text-foreground">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{fileSizeLabel}</p>
                          <p className="text-xs text-status-green">Uploaded</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={handleRemoveFile}
                          disabled={submitting}
                          aria-label="Remove file"
                        >
                          <AppIcon icon={X} size="sm" />
                        </Button>
                      </div>
                    )}
                  </div>
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

function BeneficiaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <p className="w-[8.75rem] text-muted-foreground">{label} :</p>
      <p className="font-medium capitalize text-foreground">{value}</p>
    </div>
  )
}
