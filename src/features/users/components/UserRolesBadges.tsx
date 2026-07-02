import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Role {
  id: string
  name: string
}

interface UserRolesBadgesProps {
  roles?: Role[]
}

export function UserRolesBadges({ roles }: UserRolesBadgesProps) {
  if (!roles || roles.length === 0) {
    return <span className="text-sm italic text-muted-foreground">No roles</span>
  }

  const visibleRoles = roles.slice(0, 2)
  const remainingRoles = roles.slice(2)
  const hasMoreRoles = remainingRoles.length > 0

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visibleRoles.map(role => (
        <Badge key={role.id} variant="secondary">
          {role.name}
        </Badge>
      ))}
      {hasMoreRoles && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="cursor-default">
              +{remainingRoles.length} more
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{remainingRoles.map(role => role.name).join(', ')}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
