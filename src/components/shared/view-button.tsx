import { Button } from '@/components/ui/button'

interface ViewButtonProps {
  onClick: () => void
}

export function ViewButton({ onClick }: ViewButtonProps) {
  return (
    <Button variant="tableAction" size="tableAction" onClick={onClick}>
      View
    </Button>
  )
}
