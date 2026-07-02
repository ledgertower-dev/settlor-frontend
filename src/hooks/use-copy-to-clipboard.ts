import { useCallback } from 'react'
import { toast } from 'sonner'

export function useCopyToClipboard() {
  const copy = useCallback((value: string, label: string) => {
    navigator.clipboard.writeText(value)
    toast.success(`${label} copied to clipboard`)
  }, [])

  return { copy }
}
