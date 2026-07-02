/**
 * Shared formatting utilities
 */

/**
 * Format number as INR currency: ₹ 1,00,000.00
 */
export function formatINR(amount: number): string {
  return `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Format ISO date string: "21 Apr 2026, 02:30 PM"
 */
export function formatDate(iso?: string): string {
  if (!iso) return 'N/A'
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${day} ${month} ${year}, ${time}`
}

/**
 * Format ISO date string to separate date and time parts
 * Returns { date: "21/04/2026", time: "02:30 PM" }
 */
export function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return { time, date }
}

/**
 * Format Date as YYYY-MM-DD using local time: "2026-04-21"
 */
export function formatISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Convert a local YYYY-MM-DD date string to an RFC3339 timestamp at the
 * start of that day in the user's local timezone
 * Example: "2026-04-21" → "2026-04-20T18:30:00.000Z" for IST.
 */
export function toRFC3339DayStart(localISODate: string): string {
  return new Date(`${localISODate}T00:00:00`).toISOString()
}

/**
 * Convert a local YYYY-MM-DD date string to an RFC3339 timestamp at the
 * end of that day in the user's local timezone (returned as UTC ISO).
 */
export function toRFC3339DayEnd(localISODate: string): string {
  return new Date(`${localISODate}T23:59:59.999`).toISOString()
}

/**
 * Format byte count for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Format ISO date string with seconds: "21 Apr 2026, 02:30:45 PM"
 */
export function formatFullDateTime(iso: string): string {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  )
}
