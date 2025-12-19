import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
  colorMap?: Record<string, string>;
  labelMap?: Record<string, string>;
}

export function StatusBadge({ status, className, colorMap, labelMap }: StatusBadgeProps) {
  const colorClass = colorMap ? colorMap[status] : 'bg-gray-100 text-gray-800';
  const label = labelMap ? labelMap[status] : status;

  return (
    <Badge variant="outline" className={cn('capitalize font-medium', colorClass, className)}>
      {label}
    </Badge>
  );
}
