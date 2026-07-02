'use client'

import { useEffect } from 'react'
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
import { getErrorMessage } from '@/lib/api/error-handler'
import { useCreateBeneficiary, useUpdateBeneficiary } from '../model/use-beneficiaries'
import { beneficiarySchema, type BeneficiaryFormData } from '../schemas/beneficiary.schema'
import type { Beneficiary, CreateBeneficiaryRequest, UpdateBeneficiaryRequest } from '../types'

const labelStyles = 'text-sm font-normal capitalize'
const inputStyles =
  '!h-12 border-[0.4px] border-foreground/40 bg-secondary px-6 text-sm placeholder:text-muted-foreground'

interface CreateBeneficiaryDrawerProps {
  open: boolean
  editBeneficiary: Beneficiary | null
  onOpenChange: (open: boolean) => void
}

export function CreateBeneficiaryDrawer({
  open,
  editBeneficiary,
  onOpenChange,
}: CreateBeneficiaryDrawerProps) {
  const isEditMode = !!editBeneficiary
  const createMutation = useCreateBeneficiary()
  const updateMutation = useUpdateBeneficiary()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<BeneficiaryFormData>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      beneficiaryName: '',
      accountNumber: '',
      ifsc: '',
      bankName: '',
      address: '',
    },
  })

  useEffect(() => {
    if (editBeneficiary && open) {
      form.reset({
        beneficiaryName: editBeneficiary.beneficiaryName,
        accountNumber: editBeneficiary.accountNumber,
        ifsc: editBeneficiary.ifsc,
        bankName: editBeneficiary.bankName,
        address: editBeneficiary.address,
      })
    }
  }, [editBeneficiary, open, form])

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      form.reset({
        beneficiaryName: '',
        accountNumber: '',
        ifsc: '',
        bankName: '',
        address: '',
      })
    }, 300)
  }

  const handleSave = form.handleSubmit(data => {
    if (isEditMode) {
      const payload: UpdateBeneficiaryRequest = {
        beneficiary_name: data.beneficiaryName,
        account_number: data.accountNumber,
        ifsc: data.ifsc,
        bank_name: data.bankName,
        address: data.address ?? '',
      }

      updateMutation.mutate(
        { id: editBeneficiary.id, data: payload },
        {
          onSuccess: () => {
            toast.success('Beneficiary updated successfully')
            handleClose()
          },
          onError: error => toast.error(getErrorMessage(error)),
        },
      )
    } else {
      const payload: CreateBeneficiaryRequest = {
        beneficiary_name: data.beneficiaryName,
        account_number: data.accountNumber,
        ifsc: data.ifsc,
        bank_name: data.bankName,
        address: data.address ?? '',
      }

      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Beneficiary created successfully')
          handleClose()
        },
        onError: error => toast.error(getErrorMessage(error)),
      })
    }
  })

  return (
    <FormDrawer
      open={open}
      onOpenChange={handleClose}
      title={isEditMode ? 'Edit Beneficiary' : 'Add Beneficiary'}
      formId="create-beneficiary-form"
      isPending={isPending}
      submitLabel={isEditMode ? 'Update Beneficiary' : 'Save Beneficiary'}
      pendingLabel="Saving..."
    >
      <Form {...form}>
        <form id="create-beneficiary-form" onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-lg border border-foreground/10 bg-secondary/50 p-4">
            <p className="text-sm font-medium text-foreground">Bank Account Details</p>

            <FormField
              control={form.control}
              name="beneficiaryName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>Beneficiary Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter beneficiary name"
                      className={inputStyles}
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
                  <FormLabel className={labelStyles}>Account Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter account number"
                      className={inputStyles}
                      onInput={e => {
                        const input = e.currentTarget
                        input.value = input.value.replace(/\D/g, '')
                        field.onChange(input.value)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ifsc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>IFSC Code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter IFSC code"
                      className={inputStyles}
                      onInput={e => {
                        const input = e.currentTarget
                        input.value = input.value.toUpperCase()
                        field.onChange(input.value)
                      }}
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
                  <FormLabel className={labelStyles}>Bank Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter bank name" className={inputStyles} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>Address (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter address" className={inputStyles} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </FormDrawer>
  )
}
