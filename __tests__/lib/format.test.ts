import {
  formatINR,
  formatDate,
  formatISODate,
  formatFileSize,
  toRFC3339DayStart,
  toRFC3339DayEnd,
} from '@/lib/core/format'

describe('formatINR', () => {
  it('formats with ₹, two decimals and Indian grouping', () => {
    expect(formatINR(0)).toBe('₹ 0.00')
    expect(formatINR(1234.5)).toBe('₹ 1,234.50')
    expect(formatINR(100000)).toBe('₹ 1,00,000.00')
  })

  it('handles negative amounts', () => {
    expect(formatINR(-500)).toBe('₹ -500.00')
  })
})

describe('formatISODate', () => {
  it('formats a local Date as zero-padded YYYY-MM-DD', () => {
    expect(formatISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(formatISODate(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('formatDate', () => {
  it('returns N/A for missing input', () => {
    expect(formatDate()).toBe('N/A')
    expect(formatDate(undefined)).toBe('N/A')
  })
})

describe('formatFileSize', () => {
  it('formats bytes, KB and MB', () => {
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(2048)).toBe('2.0 KB')
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})

describe('toRFC3339DayStart / toRFC3339DayEnd', () => {
  it('returns UTC ISO strings spanning exactly one day', () => {
    const start = toRFC3339DayStart('2026-04-21')
    const end = toRFC3339DayEnd('2026-04-21')

    expect(start.endsWith('Z')).toBe(true)
    expect(end.endsWith('Z')).toBe(true)
    // End (23:59:59.999) minus start (00:00:00.000) — the TZ offset cancels out.
    expect(new Date(end).getTime() - new Date(start).getTime()).toBe(86_399_999)
  })
})
