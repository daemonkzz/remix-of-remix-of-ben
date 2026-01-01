import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnsavedIndicatorProps {
  hasUnsavedChanges: boolean;
  className?: string;
}

export const UnsavedIndicator = ({
  hasUnsavedChanges,
  className,
}: UnsavedIndicatorProps) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 text-xs font-normal transition-colors',
        hasUnsavedChanges
          ? 'border-amber-500/50 text-amber-600 dark:text-amber-400'
          : 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400',
        className
      )}
    >
      <Circle
        className={cn(
          'w-2 h-2 fill-current',
          hasUnsavedChanges ? 'text-amber-500' : 'text-emerald-500'
        )}
      />
      {hasUnsavedChanges ? 'Kaydedilmemiş' : 'Kaydedildi'}
    </Badge>
  );
};
