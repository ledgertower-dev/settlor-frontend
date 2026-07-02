'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api/error-handler'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { RadioButton } from '@/components/shared/radio-button'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Copy, Lock, Plus, SquarePen, Trash2 } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { FormDialog } from '@/components/shared/form-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/core/utils'
import { usePermission } from '@/features/access/hooks/usePermission'
import {
  formatINR,
  type MerchantProvider,
  type RoutingRule,
} from '../types/merchant-provider.types'
import {
  useAvailableVirtualAccounts,
  useProviderConfigurations,
  useUpdateProviderConfigStatus,
  useUpdateVirtualAccount,
  useRemoveVirtualAccount,
  useUpdateReconciliationMode,
  useUpdateDailyAmountLimit,
  useRoutingRules,
  useAddRoutingRule,
  useUpdateRoutingRule,
  useDeleteRoutingRule,
} from '../model/use-merchant-provider-config'
import { useProviderChannels } from '@/features/providers'
import { AddProviderDrawer } from './AddProviderDrawer'

interface MerchantProviderConfigTabProps {
  merchantId: string
}

export function MerchantProviderConfigTab({ merchantId }: MerchantProviderConfigTabProps) {
  const canManage = usePermission('merchants:settings:update')
  const { data: providers = [] } = useProviderConfigurations(merchantId)
  const [showAddDrawer, setShowAddDrawer] = useState(false)
  const [ruleDialogProvider, setRuleDialogProvider] = useState<MerchantProvider | null>(null)
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null)
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<{
    provider: MerchantProvider
    rule: RoutingRule
  } | null>(null)
  const [changeVAProvider, setChangeVAProvider] = useState<MerchantProvider | null>(null)
  const [removeVAProvider, setRemoveVAProvider] = useState<MerchantProvider | null>(null)
  const [disableProvider, setDisableProvider] = useState<MerchantProvider | null>(null)

  const updateStatus = useUpdateProviderConfigStatus()
  const updateVA = useUpdateVirtualAccount()
  const removeVA = useRemoveVirtualAccount()
  const updateReconMode = useUpdateReconciliationMode()
  const addRule = useAddRoutingRule()
  const updateRule = useUpdateRoutingRule()
  const deleteRule = useDeleteRoutingRule()

  const handleToggleStatus = (provider: MerchantProvider) => {
    if (provider.status === 'ENABLED') {
      setDisableProvider(provider)
    } else {
      updateStatus.mutate(
        { merchantId, configId: provider.id, data: { status: 'ENABLED' } },
        {
          onSuccess: () => toast.success(`${provider.providerName} enabled`),
          onError: error => toast.error(getErrorMessage(error)),
        },
      )
    }
  }

  const handleReconciliationChange = (provider: MerchantProvider, mode: 'AUTO' | 'MANUAL') => {
    if (provider.reconciliationMode === mode) return
    updateReconMode.mutate(
      { merchantId, configId: provider.id, reconciliationMode: mode },
      {
        onSuccess: () => toast.success(`Reconciliation mode set to ${mode.toLowerCase()}`),
        onError: error => toast.error(getErrorMessage(error)),
      },
    )
  }

  const handleChangeVA = (configId: string, newVA: string) => {
    updateVA.mutate(
      { merchantId, configId, virtualAccountId: newVA },
      {
        onSuccess: () => toast.success('Virtual account updated'),
        onError: error => toast.error(getErrorMessage(error)),
      },
    )
  }

  const handleRemoveVA = (provider: MerchantProvider) => {
    setRemoveVAProvider(provider)
  }

  const confirmRemoveVA = () => {
    if (removeVAProvider) {
      removeVA.mutate(
        { merchantId, configId: removeVAProvider.id },
        {
          onSuccess: () => {
            toast.success('Virtual account removed')
            setRemoveVAProvider(null)
          },
          onError: error => toast.error(getErrorMessage(error)),
        },
      )
    }
  }

  const handleAddRule = (provider: MerchantProvider) => {
    setEditingRule(null)
    setRuleDialogProvider(provider)
  }

  const handleEditRule = (provider: MerchantProvider, rule: RoutingRule) => {
    setEditingRule(rule)
    setRuleDialogProvider(provider)
  }

  const handleDeleteRule = (provider: MerchantProvider, rule: RoutingRule) => {
    setDeleteRuleTarget({ provider, rule })
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-[10px] bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-foreground">Manage payment providers</h3>
            <p className="text-sm font-medium text-muted-foreground">
              Manage payment providers, routing rules, and reconciliation settings for this
              merchant.
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowAddDrawer(true)}
              className="flex h-[2.625rem] shrink-0 items-center gap-3.5 rounded-md bg-button-bg px-6 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
            >
              <AppIcon icon={Plus} size="sm" color="primary-foreground" />
              Add Provider
            </button>
          )}
        </div>
      </div>

      {/* Provider cards */}
      {providers.map(provider => (
        <ProviderCard
          key={provider.id}
          merchantId={merchantId}
          provider={provider}
          canManage={canManage}
          onToggleStatus={() => handleToggleStatus(provider)}
          onReconciliationChange={mode => handleReconciliationChange(provider, mode)}
          onAddRule={() => handleAddRule(provider)}
          onEditRule={rule => handleEditRule(provider, rule)}
          onDeleteRule={rule => handleDeleteRule(provider, rule)}
          onChangeVA={() => setChangeVAProvider(provider)}
          onRemoveVA={() => handleRemoveVA(provider)}
        />
      ))}

      {/* Add Provider Drawer */}
      <AddProviderDrawer
        open={showAddDrawer}
        onOpenChange={setShowAddDrawer}
        merchantId={merchantId}
        onAdd={() => {}}
      />

      {/* Add / Edit Routing Rule Dialog */}
      <RoutingRuleDialog
        open={!!ruleDialogProvider}
        onOpenChange={open => {
          if (!open) {
            setRuleDialogProvider(null)
            setEditingRule(null)
          }
        }}
        merchantId={merchantId}
        configId={ruleDialogProvider?.id ?? ''}
        providerId={ruleDialogProvider?.providerId ?? ''}
        providerName={ruleDialogProvider?.providerName ?? ''}
        rule={editingRule}
      />

      {/* Change Virtual Account Dialog */}
      <ChangeVADialog
        open={!!changeVAProvider}
        onOpenChange={open => !open && setChangeVAProvider(null)}
        merchantId={merchantId}
        provider={changeVAProvider}
        onSave={newVA => {
          if (changeVAProvider) {
            handleChangeVA(changeVAProvider.id, newVA)
          }
          setChangeVAProvider(null)
        }}
      />

      {/* Remove VA Confirmation Dialog */}
      <ConfirmDialog
        open={!!removeVAProvider}
        onOpenChange={open => !open && setRemoveVAProvider(null)}
        title="Remove virtual account?"
        description={
          <>
            This will remove{' '}
            <span className="font-medium text-foreground">
              {removeVAProvider?.virtualAccountLabel}
            </span>{' '}
            from{' '}
            <span className="font-medium text-foreground">{removeVAProvider?.providerName}</span>.
          </>
        }
        confirmLabel="Remove"
        pendingLabel="Removing..."
        variant="danger"
        isPending={removeVA.isPending}
        onConfirm={confirmRemoveVA}
      />

      {/* Disable Provider Dialog */}
      <DisableProviderDialog
        key={disableProvider?.id ?? ''}
        open={!!disableProvider}
        onOpenChange={open => !open && setDisableProvider(null)}
        providerName={disableProvider?.providerName ?? ''}
        isPending={updateStatus.isPending}
        onConfirm={reason => {
          if (disableProvider) {
            updateStatus.mutate(
              {
                merchantId,
                configId: disableProvider.id,
                data: { status: 'DISABLED', disabled_reason: reason },
              },
              {
                onSuccess: () => {
                  toast.success(`${disableProvider.providerName} disabled`)
                  setDisableProvider(null)
                },
                onError: error => toast.error(getErrorMessage(error)),
              },
            )
          }
        }}
      />

      {/* Delete Routing Rule Confirmation */}
      <ConfirmDialog
        open={!!deleteRuleTarget}
        onOpenChange={open => !open && setDeleteRuleTarget(null)}
        title="Delete routing rule?"
        description={
          <>
            This will permanently remove{' '}
            <span className="font-medium text-foreground">{deleteRuleTarget?.rule.name}</span>. This
            action cannot be undone.
          </>
        }
        confirmLabel="Delete rule"
        pendingLabel="Deleting..."
        variant="danger"
        isPending={deleteRule.isPending}
        onConfirm={() => {
          if (deleteRuleTarget) {
            deleteRule.mutate(
              {
                merchantId,
                configId: deleteRuleTarget.provider.id,
                ruleId: deleteRuleTarget.rule.id,
              },
              {
                onSuccess: () => {
                  toast.success('Routing rule deleted')
                  setDeleteRuleTarget(null)
                },
                onError: error => toast.error(getErrorMessage(error)),
              },
            )
          }
        }}
      />
    </div>
  )
}

// --- Provider Card Sub-component ---

function ProviderCard({
  merchantId,
  provider,
  canManage,
  onToggleStatus,
  onReconciliationChange,
  onAddRule,
  onEditRule,
  onDeleteRule,
  onChangeVA,
  onRemoveVA,
}: {
  merchantId: string
  provider: MerchantProvider
  canManage: boolean
  onToggleStatus: () => void
  onReconciliationChange: (mode: 'AUTO' | 'MANUAL') => void
  onAddRule: () => void
  onEditRule: (rule: RoutingRule) => void
  onDeleteRule: (rule: RoutingRule) => void
  onChangeVA: () => void
  onRemoveVA: () => void
}) {
  const { data: routingRules = [] } = useRoutingRules(merchantId, provider.id)
  const updateDailyLimit = useUpdateDailyAmountLimit()
  // Resync the input when the saved value changes upstream (e.g. after a
  // successful PATCH refetch). Pattern: react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [dailyLimitInput, setDailyLimitInput] = useState<string>(
    provider.dailyAmountLimit > 0 ? String(provider.dailyAmountLimit) : '',
  )
  const [lastSeenLimit, setLastSeenLimit] = useState<number>(provider.dailyAmountLimit)
  if (provider.dailyAmountLimit !== lastSeenLimit) {
    setLastSeenLimit(provider.dailyAmountLimit)
    setDailyLimitInput(provider.dailyAmountLimit > 0 ? String(provider.dailyAmountLimit) : '')
  }

  const parsedDailyLimit = parseInt(dailyLimitInput) || 0
  const dailyLimitDirty = parsedDailyLimit !== provider.dailyAmountLimit
  const handleSaveDailyLimit = () => {
    if (!dailyLimitDirty) return
    updateDailyLimit.mutate(
      { merchantId, configId: provider.id, dailyAmountLimit: parsedDailyLimit },
      {
        onSuccess: () =>
          toast.success(
            parsedDailyLimit > 0
              ? `Daily payout limit set to ${formatINR(parsedDailyLimit)}`
              : 'Daily payout limit removed',
          ),
        onError: () => toast.error('Failed to update daily payout limit'),
      },
    )
  }

  const { copy: handleCopy } = useCopyToClipboard()

  const initials = provider.providerName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)

  const ruleCount = routingRules.length
  const isEnabled = provider.status === 'ENABLED'

  return (
    <div
      className={cn(
        'flex flex-col gap-6 rounded-[10px] bg-card p-6',
        isEnabled ? 'border border-transparent dark:border-input' : 'border border-status-red',
      )}
    >
      {/* Provider header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex size-[46px] shrink-0 items-center justify-center rounded-[11px] bg-foreground text-sm font-medium capitalize text-background">
            {initials}
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <p className="text-sm font-medium capitalize text-foreground">
                {provider.providerName}
              </p>
              <span
                className={cn(
                  'rounded-full px-3.5 py-1 text-xs',
                  isEnabled
                    ? 'bg-status-green/10 text-status-green'
                    : 'bg-status-red/10 text-status-red',
                )}
              >
                {isEnabled ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {ruleCount} routing rule{ruleCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-foreground">
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
          {canManage && (
            <Switch
              variant={isEnabled ? 'green' : 'red'}
              size="lg"
              checked={isEnabled}
              onCheckedChange={onToggleStatus}
            />
          )}
        </div>
      </div>

      {/* Deposit Section */}
      <div className="flex flex-col gap-3">
        <p className="text-lg font-medium text-foreground">Deposit</p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left card: Wallet ID + Reconciliation */}
          <div className="flex flex-col gap-3.5 rounded-[10px] bg-secondary px-6 py-3.5">
            {/* Wallet ID */}
            <div className="flex flex-col gap-2.5">
              <p className="text-xs capitalize text-muted-foreground">Wallet ID</p>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-medium text-foreground">{provider.walletCode}</span>
                <button
                  onClick={() => handleCopy(provider.walletCode, 'Wallet ID')}
                  aria-label="Copy Wallet ID"
                  className="flex size-[34px] items-center justify-center rounded-[11px] bg-accent text-muted-foreground transition-colors hover:text-foreground"
                >
                  <AppIcon icon={Copy} size="sm" />
                </button>
              </div>
            </div>

            {/* Reconciliation Mode */}
            <div
              className={cn(
                'flex flex-col gap-2.5',
                (!isEnabled || !canManage) && 'pointer-events-none opacity-50',
              )}
            >
              <p className="text-xs capitalize text-muted-foreground">Reconciliation mode</p>
              <div className="inline-flex w-fit items-center rounded-full border-[0.5px] border-foreground/20 bg-card p-[6px] shadow-[2px_2px_4px_0px_rgba(0,0,0,0.02)]">
                <button
                  onClick={() => onReconciliationChange('AUTO')}
                  className={cn(
                    'rounded-[46px] px-6 py-[10px] text-sm leading-none transition-colors',
                    provider.reconciliationMode === 'AUTO'
                      ? 'bg-foreground font-medium text-background'
                      : 'text-foreground',
                  )}
                >
                  Auto
                </button>
                <button
                  onClick={() => onReconciliationChange('MANUAL')}
                  className={cn(
                    'rounded-[46px] px-6 py-[11px] text-sm leading-none transition-colors',
                    provider.reconciliationMode === 'MANUAL'
                      ? 'bg-foreground font-medium text-background'
                      : 'text-foreground',
                  )}
                >
                  Manual
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {provider.reconciliationMode === 'AUTO'
                  ? 'Deposits from trusted source banks are credited automatically'
                  : 'All incoming deposits go to the ops review queue before crediting'}
              </p>
            </div>
          </div>

          {/* Right card: Virtual Account + Daily Payout Limit */}
          <div className="flex flex-col gap-3.5 rounded-[10px] bg-secondary px-6 py-3.5">
            {/* Virtual Account */}
            <div className="flex flex-col gap-2.5">
              <p className="text-xs capitalize text-muted-foreground">Virtual Account</p>
              {provider.hasVirtualAccountMapping ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-medium text-foreground">
                      {provider.virtualAccountLabel}
                    </span>
                    <button
                      onClick={() => handleCopy(provider.virtualAccountLabel, 'Virtual Account')}
                      aria-label="Copy Virtual Account"
                      className="flex size-[34px] items-center justify-center rounded-[11px] bg-accent text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <AppIcon icon={Copy} size="sm" />
                    </button>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onChangeVA}
                        className="flex items-center gap-2 rounded-md border border-foreground/40 bg-accent px-6 py-2 text-xs text-foreground transition-colors hover:bg-accent/80"
                      >
                        <AppIcon icon={SquarePen} size="sm" />
                        Change
                      </button>
                      <button
                        onClick={onRemoveVA}
                        className="flex items-center gap-2 rounded-md border border-status-red bg-status-red/5 px-3.5 py-2 text-xs text-status-red transition-colors hover:bg-status-red/10"
                      >
                        <AppIcon icon={Trash2} size="sm" color="red" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">No virtual account assigned</span>
                  {canManage && (
                    <button
                      onClick={onChangeVA}
                      className="flex items-center gap-2 rounded-md border border-foreground/40 bg-accent px-6 py-2 text-xs text-foreground transition-colors hover:bg-accent/80"
                    >
                      <AppIcon icon={Plus} size="sm" />
                      Assign
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Daily Payout Limit */}
            <div
              className={cn(
                'flex flex-col gap-2.5',
                (!isEnabled || !canManage) && 'pointer-events-none opacity-50',
              )}
            >
              <p className="text-xs capitalize text-muted-foreground">Daily Payout Limit</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  placeholder="0 = unlimited"
                  value={dailyLimitInput}
                  onChange={e => setDailyLimitInput(e.target.value)}
                  disabled={!canManage}
                  className="h-12 w-full max-w-[271px] rounded-[10px] border border-foreground/20 bg-card px-6 text-sm font-medium text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[1px] focus-visible:ring-ring/30"
                />
                {dailyLimitDirty && canManage && (
                  <button
                    onClick={handleSaveDailyLimit}
                    disabled={updateDailyLimit.isPending}
                    className="rounded-md bg-button-bg px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:opacity-50"
                  >
                    {updateDailyLimit.isPending ? 'Saving…' : 'Save'}
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Total per-provider payout per day across all routing rules
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Routing Rules Section */}
      <div className={cn('flex flex-col gap-3', !isEnabled && 'pointer-events-none opacity-50')}>
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-foreground">Routing rules ({ruleCount})</h4>
          {canManage && (
            <button
              onClick={onAddRule}
              className="flex items-center gap-3.5 rounded-md bg-button-bg px-6 py-2.5 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
            >
              <AppIcon icon={Plus} size="sm" color="primary-foreground" />
              Add Rule
            </button>
          )}
        </div>
        {routingRules.length > 0 && (
          <div className="flex flex-col gap-3">
            {routingRules.map(rule => (
              <RuleCard
                key={rule.id}
                rule={rule}
                canManage={canManage}
                onEdit={() => onEditRule(rule)}
                onDelete={() => onDeleteRule(rule)}
              />
            ))}
          </div>
        )}
        <div className="flex items-center justify-center gap-2">
          <AppIcon icon={Lock} size="sm" color="muted" />
          <p className="text-xs text-muted-foreground">
            Provider is permanent. Toggle to enable or disable, it cannot be removed
          </p>
        </div>
      </div>
    </div>
  )
}

// --- Routing Rule Card ---

function RuleCard({
  rule,
  canManage,
  onEdit,
  onDelete,
}: {
  rule: RoutingRule
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const commissionLabel =
    rule.commissionType === 'PERCENT'
      ? `${rule.commissionValue.toFixed(2)}%`
      : `${rule.commissionValue.toFixed(2)}₹`
  const gstLabel = rule.gstMode === 'INCLUDING_GST' ? '(incl. GST)' : '(excl. GST)'

  return (
    <div className="flex items-center justify-between rounded-md border border-foreground/10 px-5 py-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">{rule.name}</p>
        <div className="flex flex-wrap items-center gap-2">
          {rule.rails.map(rail => (
            <span
              key={rail}
              className="rounded-full bg-status-teal/15 px-3 py-0.5 text-xs font-medium text-status-teal"
            >
              {rail}
            </span>
          ))}
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs font-medium text-foreground">{commissionLabel}</span>
          <span className="text-xs text-muted-foreground">{gstLabel}</span>
          {(rule.minAmount > 0 || rule.maxAmount > 0) && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {formatINR(rule.minAmount)} – {formatINR(rule.maxAmount)}
              </span>
            </>
          )}
        </div>
      </div>
      {canManage && (
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={onEdit}
            aria-label="Edit routing rule"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <AppIcon icon={SquarePen} />
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete routing rule"
            className="text-muted-foreground transition-colors hover:text-status-red"
          >
            <AppIcon icon={Trash2} />
          </button>
        </div>
      )}
    </div>
  )
}

// --- Add Routing Rule Dialog ---

const RAILS_OPTIONS = [
  { value: 'IMPS', label: 'IMPS', description: 'Immediate Payment Service' },
  { value: 'NEFT', label: 'NEFT', description: 'National Electronic Funds Transfer' },
  { value: 'RTGS', label: 'RTGS', description: 'Real-Time Gross Settlement' },
]

function RoutingRuleDialog({
  open,
  onOpenChange,
  merchantId,
  configId,
  providerId,
  providerName,
  rule,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  merchantId: string
  configId: string
  providerId: string
  providerName: string
  rule: RoutingRule | null
}) {
  const isEdit = !!rule
  const { data: channels = [] } = useProviderChannels(providerId)
  const addRuleMutation = useAddRoutingRule()
  const updateRuleMutation = useUpdateRoutingRule()
  const isSubmitting = addRuleMutation.isPending || updateRuleMutation.isPending

  const [name, setName] = useState('')
  const [channel, setChannel] = useState('')
  const [selectedRails, setSelectedRails] = useState<string[]>([])
  const [commissionType, setCommissionType] = useState<'PERCENT' | 'FLAT'>('PERCENT')
  const [commissionValue, setCommissionValue] = useState('')
  const [gstMode, setGstMode] = useState<'INCLUDING_GST' | 'EXCLUDING_GST'>('INCLUDING_GST')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  const resetForm = () => {
    setName('')
    setChannel('')
    setSelectedRails([])
    setCommissionType('PERCENT')
    setCommissionValue('')
    setGstMode('INCLUDING_GST')
    setMinAmount('')
    setMaxAmount('')
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm()
    onOpenChange(nextOpen)
  }

  // Populate form when editing
  if (open && name === '' && rule?.name) {
    setName(rule.name)
    setChannel(rule.providerChannelId)
    setSelectedRails(rule.rails)
    setCommissionType(rule.commissionType)
    setCommissionValue(String(rule.commissionValue))
    setGstMode(rule.gstMode)
    setMinAmount(rule.minAmount ? String(rule.minAmount) : '')
    setMaxAmount(rule.maxAmount ? String(rule.maxAmount) : '')
  }

  const handleToggleRail = (rail: string) => {
    setSelectedRails(prev => (prev.includes(rail) ? prev.filter(r => r !== rail) : [...prev, rail]))
  }

  const parsedValue = parseFloat(commissionValue) || 0
  const gstRate = 0.18
  let netValue: number
  let gstValue: number
  let totalValue: number

  if (gstMode === 'INCLUDING_GST') {
    netValue = parsedValue / (1 + gstRate)
    gstValue = parsedValue - netValue
    totalValue = parsedValue
  } else {
    netValue = parsedValue
    gstValue = parsedValue * gstRate
    totalValue = parsedValue + gstValue
  }

  const suffix = commissionType === 'PERCENT' ? '%' : ''

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Rule name is required')
      return
    }
    if (!channel) {
      toast.error('Please select a channel')
      return
    }
    if (selectedRails.length === 0) {
      toast.error('Please select at least one rail')
      return
    }

    const payload = {
      provider_channel_id: channel,
      name: name.trim(),
      rails: selectedRails,
      commission_type: commissionType,
      commission_value: parsedValue,
      gst_mode: gstMode,
      gst_percent_bps: 1800,
      min_amount: parseInt(minAmount) || 0,
      max_amount: parseInt(maxAmount) || 0,
      priority: rule?.priority ?? 100,
      is_active: rule?.isActive ?? true,
    }

    try {
      if (isEdit && rule) {
        await updateRuleMutation.mutateAsync({
          merchantId,
          configId,
          ruleId: rule.id,
          data: payload,
        })
        toast.success('Routing rule updated')
      } else {
        await addRuleMutation.mutateAsync({
          merchantId,
          configId,
          data: payload,
        })
        toast.success('Routing rule added')
      }
      handleOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={isEdit ? 'Edit routing rule' : 'Add routing rule'}
      description={`For ${providerName}`}
      formId="routing-rule-form"
      isPending={isSubmitting}
      submitLabel={isEdit ? 'Save changes' : 'Save rule'}
      pendingLabel={isEdit ? 'Saving...' : 'Adding...'}
      size="lg"
      scrollable
      showCloseButton={false}
    >
      <form id="routing-rule-form" onSubmit={handleFormSubmit} className="flex flex-col gap-5">
        {/* Rule Name */}
        <fieldset className="rounded-md border border-foreground/20 p-5">
          <p className="text-sm font-medium text-foreground">Rule name</p>
          <p className="mt-1 text-xs text-muted-foreground">A short label to identify this rule.</p>
          <div className="mt-3">
            <input
              placeholder="e.g. IMPS channel"
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-12 w-full rounded-md border border-foreground/20 bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[1px] focus-visible:ring-ring/30"
            />
          </div>
        </fieldset>

        {/* Channel Section */}
        <fieldset className="rounded-md border border-foreground/20 p-5">
          <p className="text-sm font-medium text-foreground">Channel</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick the routing channel for this rule.
          </p>
          <div className="mt-3">
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="!h-12 w-full">
                <SelectValue placeholder="Select a channel" />
              </SelectTrigger>
              <SelectContent>
                {channels.map(ch => (
                  <SelectItem key={ch.id} value={ch.id}>
                    {ch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </fieldset>

        {/* Routing Rails Section */}
        <fieldset className="rounded-md border border-foreground/20 p-5">
          <p className="text-sm font-medium text-foreground">Routing rails</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tick the rails this rule should support.
          </p>
          <div className="mt-3 flex flex-col">
            {RAILS_OPTIONS.map((rail, idx) => (
              <label
                key={rail.value}
                className={cn(
                  'flex cursor-pointer items-center gap-3 py-3.5',
                  idx < RAILS_OPTIONS.length - 1 && 'border-b border-foreground/10',
                )}
              >
                <Checkbox
                  variant="green"
                  checked={selectedRails.includes(rail.value)}
                  onCheckedChange={() => handleToggleRail(rail.value)}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{rail.label}</p>
                  <p className="text-xs text-muted-foreground">{rail.description}</p>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Commission Section */}
        <fieldset className="rounded-md border border-foreground/20 p-5">
          <p className="text-sm font-medium text-foreground">Commission</p>
          <p className="mt-1 text-xs text-muted-foreground">
            How commission is calculated for this rule.
          </p>

          {/* Type */}
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-foreground">Type</p>
            <div className="flex items-center gap-6">
              <RadioButton
                size="sm"
                label="Percentage"
                selected={commissionType === 'PERCENT'}
                onSelect={() => setCommissionType('PERCENT')}
              />
              <RadioButton
                size="sm"
                label="Value"
                selected={commissionType === 'FLAT'}
                onSelect={() => setCommissionType('FLAT')}
              />
            </div>
          </div>

          {/* Value */}
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-foreground">Value</p>
            <input
              type="number"
              placeholder="Value"
              value={commissionValue}
              onChange={e => setCommissionValue(e.target.value)}
              className="h-12 w-full rounded-md border border-foreground/20 bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[1px] focus-visible:ring-ring/30"
            />
          </div>

          {/* GST */}
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-foreground">GST</p>
            <div className="flex items-center gap-6">
              <RadioButton
                size="sm"
                label="Including GST"
                selected={gstMode === 'INCLUDING_GST'}
                onSelect={() => setGstMode('INCLUDING_GST')}
              />
              <RadioButton
                size="sm"
                label="Excluding GST"
                selected={gstMode === 'EXCLUDING_GST'}
                onSelect={() => setGstMode('EXCLUDING_GST')}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 rounded-md border border-dashed border-foreground/15 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Commission ({gstMode === 'INCLUDING_GST' ? 'including' : 'excluding'} GST):{' '}
              <span className="font-semibold text-foreground">
                {totalValue.toFixed(2)}
                {suffix}
              </span>{' '}
              · Net {netValue.toFixed(2)}
              {suffix} · GST {gstValue.toFixed(2)}
              {suffix}
            </p>
          </div>
        </fieldset>

        {/* Payout Limit Section */}
        <fieldset className="rounded-md border border-foreground/20 p-5">
          <p className="text-sm font-medium text-foreground">Payout limit</p>
          <p className="mt-1 text-xs text-muted-foreground">Per-transaction floor and ceiling.</p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Min</p>
              <input
                type="number"
                placeholder="e.g. 100"
                value={minAmount}
                onChange={e => setMinAmount(e.target.value)}
                className="h-12 w-full rounded-md border border-foreground/20 bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[1px] focus-visible:ring-ring/30"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Max</p>
              <input
                type="number"
                placeholder="e.g. 200000"
                value={maxAmount}
                onChange={e => setMaxAmount(e.target.value)}
                className="h-12 w-full rounded-md border border-foreground/20 bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[1px] focus-visible:ring-ring/30"
              />
            </div>
          </div>
        </fieldset>
      </form>
    </FormDialog>
  )
}

// --- Disable Provider Dialog (uses ConfirmDialog with children for reason textarea) ---

function DisableProviderDialog({
  open,
  onOpenChange,
  providerName,
  isPending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerName: string
  isPending: boolean
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setReason('')
    onOpenChange(nextOpen)
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={`Disable ${providerName}?`}
      description="This will pause all routing to this provider. You can re-enable it later."
      confirmLabel="Disable provider"
      pendingLabel="Disabling..."
      variant="danger"
      isPending={isPending}
      onConfirm={() => onConfirm(reason)}
    >
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Reason (optional)</p>
        <textarea
          placeholder="e.g. Paused for review"
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-foreground/20 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[1px] focus-visible:ring-ring/30"
        />
      </div>
    </ConfirmDialog>
  )
}

// --- Change Virtual Account Dialog ---

function ChangeVADialog({
  open,
  onOpenChange,
  merchantId,
  provider,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  merchantId: string
  provider: MerchantProvider | null
  onSave: (newVA: string) => void
}) {
  const [selectedVA, setSelectedVA] = useState('')
  const { data: vaOptions = [] } = useAvailableVirtualAccounts(
    merchantId,
    provider?.providerId ?? '',
    open && !!provider,
  )

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setSelectedVA('')
    onOpenChange(nextOpen)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedVA) {
      onSave(selectedVA)
      setSelectedVA('')
    }
  }

  if (!provider) return null

  const filteredVaOptions = provider.hasVirtualAccountMapping
    ? vaOptions.filter(va => va.id !== provider.virtualAccountId)
    : vaOptions

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={
        provider.hasVirtualAccountMapping ? 'Change virtual account' : 'Assign virtual account'
      }
      description={
        provider.hasVirtualAccountMapping
          ? `Reassign the deposit VA for ${provider.providerName}.`
          : `Assign a deposit VA for ${provider.providerName}.`
      }
      formId="change-va-form"
      isPending={false}
      submitLabel="Save change"
      pendingLabel="Saving..."
      submitDisabled={!selectedVA}
      showCloseButton={false}
      className="sm:max-w-[520px]"
    >
      <form id="change-va-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Current VA — only show if mapping exists */}
        {provider.hasVirtualAccountMapping && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-status-teal">
              Current
            </p>
            <div className="rounded-md border border-foreground/20 bg-secondary px-4 py-3">
              <span className="font-mono text-sm font-semibold text-foreground">
                {provider.virtualAccountLabel}
              </span>
            </div>
          </div>
        )}

        {/* New VA Select */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">New virtual account</p>
          <Select value={selectedVA} onValueChange={setSelectedVA}>
            <SelectTrigger className="!h-12 w-full">
              <SelectValue placeholder="Select a virtual account" />
            </SelectTrigger>
            <SelectContent>
              {filteredVaOptions.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No other virtual accounts available
                </SelectItem>
              ) : (
                filteredVaOptions.map(va => (
                  <SelectItem key={va.id} value={va.id}>
                    {va.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Only unassigned virtual accounts from this provider&apos;s pool are shown.
          </p>
        </div>
      </form>
    </FormDialog>
  )
}
