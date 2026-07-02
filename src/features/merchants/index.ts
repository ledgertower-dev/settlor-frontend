// Components
export { MerchantsList } from './components/MerchantsList'
export { MerchantDetail } from './components/MerchantDetail'
export { MerchantOverviewTab } from './components/MerchantOverviewTab'
export { MerchantProviderConfigTab } from './components/MerchantProviderConfigTab'
export { AddProviderDrawer } from './components/AddProviderDrawer'
export { MerchantSupportTab } from './components/MerchantSupportTab'
export { AssignSupportMemberDrawer } from './components/AssignSupportMemberDrawer'

// Types
export type {
  Merchant,
  MerchantDetail as MerchantDetailType,
  MerchantStatus,
  MerchantTab,
  MerchantFilters,
} from './types'
export { TAB_STATUS_MAP } from './types'

export type {
  MerchantWalletBreakdown,
  MerchantProvider,
  RoutingRule,
  AvailableProvider,
  SupportedRail,
  AvailableVirtualAccount,
} from './types/merchant-provider.types'
export { formatINR } from './types/merchant-provider.types'

// KYC Types
export type {
  KycProfile,
  KycDocument,
  KycDetailResponse,
  KycProfileStatus,
  KycDocumentStatus,
  ReviewDocumentPayload,
} from './types/merchant-kyc.types'

// Support Types
export type {
  SupportMember,
  SupportMemberListParams,
  AssignSupportMembersRequest,
} from './types/merchant-support.types'

// Hooks
export {
  useMerchants,
  useMerchantDetail,
  useUpdateMerchantStatus,
  merchantKeys,
} from './model/use-merchants'
export { useMerchantsUIStore } from './model/merchants-ui-store'
export {
  useProviderConfigurations,
  useAvailableProviders,
  useAvailableVirtualAccounts,
  useAddProviderConfiguration,
  useUpdateProviderConfigStatus,
  useUpdateVirtualAccount,
  useUpdateReconciliationMode,
  useUpdateDailyAmountLimit,
  providerConfigKeys,
} from './model/use-merchant-provider-config'
export {
  useMerchantKyc,
  useReviewDocument,
  useFinalizeApprove,
  useRequestResubmission,
  merchantKycKeys,
} from './model/use-merchant-kyc'
export {
  useSupportMembers,
  useAssignedSupportMembers,
  useAssignSupportMembers,
  supportMemberKeys,
} from './model/use-merchant-support'

// Cross-feature public API
export { merchantsService } from './api/merchants.api'
export { useCalculateFee } from './model/use-merchant-fees'
