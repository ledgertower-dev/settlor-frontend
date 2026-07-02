'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { FormDrawer } from '@/components/shared/form-drawer'
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { AsyncSearchSelect } from '@/components/shared/async-search-select'
import { merchantsService, merchantKeys } from '@/features/merchants'

import { INPUT_CLASSNAME } from '@/lib/core/styles'
import { formatINR } from '@/lib/core/format'
import { getErrorMessage } from '@/lib/api/error-handler'
import { adjustmentSchema, type AdjustmentFormData } from '../schemas/adjustment.schema'
import { useCreateAdjustment, useMerchantWallets } from '../model/use-wallet-adjustments'
import { useWalletAdjustmentsUIStore } from '../model/wallet-adjustments-ui-store'

const FORM_ID = 'add-adjustment-form'

const selectTriggerStyles =
  'w-full rounded-md border-[0.4px] border-foreground/40 bg-secondary pl-6 pr-3.5'

export function AddAdjustmentDrawer() {
  const {
    drawerOpen,
    closeDrawer,
    selectedMerchantId,
    selectedMerchantLabel,
    selectedWalletId,
    setMerchant,
    setWallet,
  } = useWalletAdjustmentsUIStore()

  const createAdjustment = useCreateAdjustment()

  const { data: wallets = [], isLoading: walletsLoading } = useMerchantWallets(selectedMerchantId)

  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      direction: undefined,
      amount: undefined,
      remarks: '',
    },
  })

  const handleClose = () => {
    if (createAdjustment.isPending) return
    form.reset()
    closeDrawer()
  }

  const onSubmit = async (data: AdjustmentFormData) => {
    if (!selectedMerchantId || !selectedWalletId) return

    try {
      await createAdjustment.mutateAsync({
        merchantId: selectedMerchantId,
        walletId: selectedWalletId,
        payload: {
          direction: data.direction,
          amount: data.amount,
          remarks: data.remarks,
        },
      })
      toast.success('Wallet adjustment created successfully')
      form.reset()
      closeDrawer()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <FormDrawer
      open={drawerOpen}
      onOpenChange={handleClose}
      title="Add Adjustment"
      formId={FORM_ID}
      isPending={createAdjustment.isPending}
      submitLabel="Submit"
      pendingLabel="Submitting..."
      submitDisabled={!selectedMerchantId || !selectedWalletId}
    >
      <div className="space-y-6">
        {/* Merchant selector */}
        <div className="grid gap-2">
          <Label className="text-sm font-normal text-foreground">
            Merchant<span className="-ml-1 text-destructive">*</span>
          </Label>
          <AsyncSearchSelect
            value={selectedMerchantId}
            valueLabel={selectedMerchantLabel}
            onChange={(id, label) => setMerchant(id, label)}
            queryKey={merchantKeys.list({ status: 'ACTIVE' })}
            queryFn={({ page, q, per_page }) =>
              merchantsService.getMerchants({ page, q, per_page, status: 'ACTIVE' })
            }
            mapOption={m => ({ id: m.id, label: m.name, subtitle: m.code })}
            searchPlaceholder="Search merchants..."
            emptyMessage="No merchants found."
            className="w-full"
            modal
          />
        </div>

        {/* Wallet selector */}
        <div className="grid gap-2">
          <Label className="text-sm font-normal text-foreground">
            Wallet<span className="-ml-1 text-destructive">*</span>
          </Label>
          <Select
            value={selectedWalletId ?? ''}
            onValueChange={value => setWallet(value || null)}
            disabled={!selectedMerchantId || walletsLoading}
          >
            <SelectTrigger size="lg" className={selectTriggerStyles}>
              <SelectValue placeholder={walletsLoading ? 'Loading wallets...' : 'Select wallet'} />
            </SelectTrigger>
            <SelectContent>
              {wallets.map(w => (
                <SelectItem key={w.walletId} value={w.walletId}>
                  {w.providerName} ({formatINR(w.balance)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {wallets.length === 0 && !walletsLoading && selectedMerchantId && (
            <p className="text-xs text-muted-foreground">No wallets found for this merchant.</p>
          )}
        </div>

        {/* Form fields */}
        <Form {...form}>
          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="direction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-normal text-foreground">
                    Payment Type<span className="-ml-1 text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      value={field.value ?? ''}
                      onValueChange={val => {
                        if (val) field.onChange(val)
                      }}
                      disabled={createAdjustment.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      <ToggleGroupItem
                        value="CREDIT"
                        className="h-12 flex-1 text-sm data-[state=on]:border-button-bg data-[state=on]:bg-button-bg/10 data-[state=on]:text-button-bg hover:data-[state=on]:bg-button-bg/10 hover:data-[state=on]:text-button-bg"
                      >
                        Credit
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="DEBIT"
                        className="h-12 flex-1 text-sm data-[variant=outline]:border-l data-[state=on]:border-button-bg data-[state=on]:bg-button-bg/10 data-[state=on]:text-button-bg hover:data-[state=on]:bg-button-bg/10 hover:data-[state=on]:text-button-bg"
                      >
                        Debit
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-normal text-foreground">
                    Amount<span className="-ml-1 text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Enter amount"
                      className={`${INPUT_CLASSNAME} text-sm font-normal`}
                      {...field}
                      onChange={e => {
                        const val = e.target.value
                        field.onChange(val === '' ? undefined : Number(val))
                      }}
                      value={field.value ?? ''}
                      disabled={createAdjustment.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-normal text-foreground">
                    Remarks<span className="-ml-1 text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter remarks for this adjustment"
                      className="min-h-[6.25rem] resize-none border-[0.4px] border-foreground/40 bg-secondary px-6 py-3.5 text-sm"
                      {...field}
                      disabled={createAdjustment.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
    </FormDrawer>
  )
}
