/** Section ids + titles, shared by the page content and the sidebar scrollspy. */
export interface NavItem {
  id: string
  title: string
}

export const NAV_SECTIONS: NavItem[] = [
  { id: 'overview', title: 'Overview' },
  { id: 'authentication', title: 'Authentication' },
  { id: 'encryption', title: 'Encryption spec' },
  { id: 'initiate-payout', title: 'Initiate a payout' },
  { id: 'check-status', title: 'Check payout status' },
  { id: 'check-balance', title: 'Check balance' },
  { id: 'webhooks', title: 'Webhooks' },
  { id: 'playground', title: 'Playground' },
  { id: 'errors', title: 'Error reference' },
  { id: 'pitfalls', title: 'Rate limits & pitfalls' },
]
