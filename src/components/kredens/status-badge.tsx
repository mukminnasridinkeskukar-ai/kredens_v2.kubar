import { Badge } from '@/components/ui/badge'
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('border font-medium', STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground', className)}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
