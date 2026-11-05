import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        size === 'sm' && 'p-2',
        size === 'md' && 'p-8',
        size === 'lg' && 'p-16',
        className,
      )}
    >
      <Loader2
        className={cn(
          'animate-spin text-primary',
          size === 'sm' && 'size-4',
          size === 'md' && 'size-6',
          size === 'lg' && 'size-10',
        )}
      />
    </div>
  );
}

