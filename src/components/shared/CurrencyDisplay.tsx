import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { CURRENCY_SYMBOL } from '@/lib/constants';

interface CurrencyDisplayProps {
  paisa: number;
  className?: string;
  compact?: boolean;
  showSign?: boolean;
  colorize?: boolean; // positive=green, negative=red
}

export function CurrencyDisplay({
  paisa,
  className,
  compact = false,
  showSign = false,
  colorize = false,
}: CurrencyDisplayProps) {
  const formatted = compact
    ? `${CURRENCY_SYMBOL}${Math.abs(paisa / 100).toLocaleString('en-BD', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`
    : formatCurrency(Math.abs(paisa));

  const sign = showSign ? (paisa >= 0 ? '+' : '−') : paisa < 0 ? '−' : '';

  return (
    <span
      className={cn(
        'font-mono tabular-nums',
        colorize && paisa > 0 && 'text-destructive',
        colorize && paisa < 0 && 'text-emerald-500',
        colorize && paisa === 0 && 'text-muted-foreground',
        className,
      )}
    >
      {sign}{formatted}
    </span>
  );
}

