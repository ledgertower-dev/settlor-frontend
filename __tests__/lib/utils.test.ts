import { cn } from '../../src/lib/core/utils'

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('a', undefined as unknown as string, null as unknown as string, 'b', 'a')).toContain(
      'a',
    )
    expect(cn('a', 'b')).toContain('b')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
  })

  it('handles conditional classes', () => {
    const result = cn('base', { conditional: true, hidden: false })
    expect(result).toContain('base')
    expect(result).toContain('conditional')
    expect(result).not.toContain('hidden')
  })

  it('merges conflicting Tailwind classes', () => {
    const result = cn('p-2 p-4')
    expect(result).toBe('p-4')
  })
})
