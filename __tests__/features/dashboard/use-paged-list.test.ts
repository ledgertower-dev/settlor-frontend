import { act, renderHook } from '@testing-library/react'
import { usePagedList } from '@/features/dashboard/model/use-paged-list'

describe('usePagedList', () => {
  it('handles an empty list', () => {
    const { result } = renderHook(() => usePagedList<number>([], 3))
    expect(result.current.pageCount).toBe(1)
    expect(result.current.pageItems).toEqual([])
    expect(result.current.hasPrev).toBe(false)
    expect(result.current.hasNext).toBe(false)
  })

  it('returns a single page when the items fit', () => {
    const { result } = renderHook(() => usePagedList([1, 2], 3))
    expect(result.current.pageCount).toBe(1)
    expect(result.current.pageItems).toEqual([1, 2])
    expect(result.current.hasNext).toBe(false)
  })

  it('paginates and navigates next/prev, clamping at the ends', () => {
    const { result } = renderHook(() => usePagedList([1, 2, 3, 4, 5], 2))

    expect(result.current.pageCount).toBe(3)
    expect(result.current.pageItems).toEqual([1, 2])
    expect(result.current.hasPrev).toBe(false)
    expect(result.current.hasNext).toBe(true)

    act(() => result.current.next())
    expect(result.current.page).toBe(1)
    expect(result.current.pageItems).toEqual([3, 4])
    expect(result.current.hasPrev).toBe(true)

    act(() => result.current.next())
    expect(result.current.page).toBe(2)
    expect(result.current.pageItems).toEqual([5])
    expect(result.current.hasNext).toBe(false)

    // next() at the last page is a no-op
    act(() => result.current.next())
    expect(result.current.page).toBe(2)

    act(() => result.current.prev())
    expect(result.current.page).toBe(1)
  })

  it('clamps prev at the first page', () => {
    const { result } = renderHook(() => usePagedList([1, 2, 3], 1))
    act(() => result.current.prev())
    expect(result.current.page).toBe(0)
  })

  it('self-clamps the current page when the list shrinks', () => {
    const { result, rerender } = renderHook(({ items }) => usePagedList(items, 2), {
      initialProps: { items: [1, 2, 3, 4, 5] },
    })

    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current.page).toBe(2)

    // The list shrinks to a single page — the reported page clamps into range.
    rerender({ items: [1] })
    expect(result.current.page).toBe(0)
    expect(result.current.pageItems).toEqual([1])
  })
})
