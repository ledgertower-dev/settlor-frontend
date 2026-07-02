'use client'

import * as React from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { WandSparkles } from 'lucide-react'

import { AppIcon } from '@/components/shared/app-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Callout } from './DocsSection'
import { CodeTabs } from './CodeTabs'
import { EncryptionPreview } from './EncryptionPreview'
import { generateCode, payloadToCompactJson, type PayoutPayload } from '../lib/codegen'
import { DEFAULT_PAYOUT, SAMPLE_API_KEY, SAMPLE_SALT_KEY } from '../lib/samples'

const formSchema = z.object({
  apiKey: z.string(),
  saltKey: z.string(),
  amount: z.number().positive('must be greater than 0'),
  payment_mode: z.enum(['NEFT', 'IMPS', 'RTGS']),
  beneficiary_name: z.string().min(1).max(120),
  beneficiary_account: z.string().min(6).max(34),
  beneficiary_ifsc: z.string().length(11, 'must be exactly 11 characters'),
  bank_name: z.string().min(1).max(120),
  beneficiary_address: z.string().max(255).optional(),
  reference_id: z.string().max(64).optional(),
  remarks: z.string().max(255).optional(),
  wallet_id: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

function buildPayload(v: FormValues): PayoutPayload {
  const amount = Number(v.amount)
  const payload: PayoutPayload = {
    amount: Number.isFinite(amount) ? amount : 0,
    payment_mode: v.payment_mode,
    beneficiary_name: v.beneficiary_name,
    beneficiary_account: v.beneficiary_account,
    beneficiary_ifsc: v.beneficiary_ifsc,
    bank_name: v.bank_name,
  }
  if (v.beneficiary_address?.trim()) payload.beneficiary_address = v.beneficiary_address.trim()
  if (v.reference_id?.trim()) payload.reference_id = v.reference_id.trim()
  if (v.remarks?.trim()) payload.remarks = v.remarks.trim()
  if (v.wallet_id?.trim()) payload.wallet_id = v.wallet_id.trim()
  return payload
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  )
}

export function PayoutPlayground() {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      apiKey: '',
      saltKey: '',
      ...DEFAULT_PAYOUT,
    },
  })

  const values = useWatch({ control }) as FormValues
  const payload = buildPayload(values)
  const plaintext = payloadToCompactJson(payload)
  const prettyPlaintext = JSON.stringify(payload, null, 2)

  const codeSamples = [
    { label: 'curl', lang: 'bash', code: generateCode('curl', payload) },
    { label: 'Node.js', lang: 'javascript', code: generateCode('node', payload) },
    { label: 'Python', lang: 'python', code: generateCode('python', payload) },
  ]

  function fillSampleKeys() {
    setValue('apiKey', SAMPLE_API_KEY, { shouldValidate: true })
    setValue('saltKey', SAMPLE_SALT_KEY, { shouldValidate: true })
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        {/* Left: request builder */}
        <form className="min-w-0 space-y-5" onSubmit={e => e.preventDefault()}>
          <Callout tone="warning">
            <p className="font-medium">Runs entirely in your browser — nothing is sent anywhere.</p>
            <p className="text-[13px]">
              Use <strong>dev/test</strong> credentials only. Never paste a production salt_key into
              any browser.
            </p>
          </Callout>

          <div className="space-y-4 rounded-lg border border-foreground/15 bg-secondary p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Credentials</h4>
              <Button
                type="button"
                size="sm"
                onClick={fillSampleKeys}
                className="bg-button-bg text-primary-foreground hover:bg-button-bg/90"
              >
                <AppIcon icon={WandSparkles} size="sm" color="primary-foreground" />
                Fill sample keys
              </Button>
            </div>
            <Field label="api_key" htmlFor="apiKey" hint="Public identifier; bound as the GCM AAD.">
              <Input
                id="apiKey"
                placeholder="64-char hex"
                autoComplete="off"
                spellCheck={false}
                className="font-mono text-xs"
                {...register('apiKey')}
              />
            </Field>
            <Field
              label="salt_key"
              htmlFor="saltKey"
              hint="64-char hex; hex-decodes to the 32-byte AES key."
            >
              <Input
                id="saltKey"
                placeholder="64-char hex"
                autoComplete="off"
                spellCheck={false}
                className="font-mono text-xs"
                {...register('saltKey')}
              />
            </Field>
          </div>

          <div className="space-y-4 rounded-lg border border-foreground/15 bg-secondary p-4">
            <h4 className="text-sm font-semibold">Payout request</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="amount (INR)" htmlFor="amount" error={errors.amount?.message}>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                />
              </Field>
              <Field label="payment_mode" error={errors.payment_mode?.message}>
                <Controller
                  control={control}
                  name="payment_mode"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" aria-label="Select payment mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IMPS">IMPS</SelectItem>
                        <SelectItem value="NEFT">NEFT</SelectItem>
                        <SelectItem value="RTGS">RTGS</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
            <Field
              label="beneficiary_name"
              htmlFor="beneficiary_name"
              error={errors.beneficiary_name?.message}
            >
              <Input id="beneficiary_name" {...register('beneficiary_name')} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="beneficiary_account"
                htmlFor="beneficiary_account"
                error={errors.beneficiary_account?.message}
              >
                <Input id="beneficiary_account" {...register('beneficiary_account')} />
              </Field>
              <Field
                label="beneficiary_ifsc"
                htmlFor="beneficiary_ifsc"
                error={errors.beneficiary_ifsc?.message}
              >
                <Input id="beneficiary_ifsc" {...register('beneficiary_ifsc')} />
              </Field>
            </div>
            <Field label="bank_name" htmlFor="bank_name" error={errors.bank_name?.message}>
              <Input id="bank_name" {...register('bank_name')} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="reference_id"
                htmlFor="reference_id"
                hint="optional, unique per merchant"
              >
                <Input id="reference_id" {...register('reference_id')} />
              </Field>
              <Field label="remarks" htmlFor="remarks" hint="optional">
                <Input id="remarks" {...register('remarks')} />
              </Field>
            </div>
          </div>
        </form>

        {/* Right: encryption preview */}
        <div className="min-w-0 rounded-lg border border-foreground/15 bg-secondary p-4">
          <h4 className="mb-3 text-sm font-semibold">Encryption preview</h4>
          <EncryptionPreview
            apiKey={values.apiKey ?? ''}
            saltKey={values.saltKey ?? ''}
            plaintext={prettyPlaintext}
          />
        </div>
      </div>

      {/* Full-width generated code */}
      <div className="min-w-0 rounded-lg border border-foreground/15 bg-secondary p-4">
        <h4 className="mb-3 text-sm font-semibold">Generated code</h4>
        <CodeTabs samples={codeSamples} />
      </div>
    </div>
  )
}
