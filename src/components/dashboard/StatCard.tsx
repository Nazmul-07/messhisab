'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { formatCurrency, formatCurrencyCompact } from '@/lib/currency';

interface StatCardProps {
  title: string;
  value?: string | number;
  valuePaisa?: number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  subtitle?: string;
  change?: { value: string; label: string; positive?: boolean };
  compact?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  valuePaisa,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  subtitle,
  change,
  compact = false,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'border-border/60 bg-card relative overflow-hidden transition-all duration-200',
        'hover:border-border hover:shadow-md group cursor-default',
        className,
      )}
    >
      {/* Top shimmer on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest truncate">
              {title}
            </p>
            <div className="mt-2">
              {valuePaisa !== undefined ? (
                <span className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums tracking-tight leading-none">
                  {compact ? formatCurrencyCompact(valuePaisa) : formatCurrency(valuePaisa)}
                </span>
              ) : (
                <span className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-none">
                  {value}
                </span>
              )}
            </div>

            {change && (
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded-full font-mono',
                    change.positive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-500 border border-red-500/20',
                  )}
                >
                  {change.value}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">{change.label}</span>
              </div>
            )}

            {subtitle && !change && (
              <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{subtitle}</p>
            )}
          </div>

          <div
            className={cn(
              'size-10 sm:size-11 rounded-xl flex items-center justify-center shrink-0',
              'border border-white/5 shadow-sm transition-transform duration-200 group-hover:scale-110',
              iconBg,
            )}
          >
            <Icon className={cn('size-[18px] sm:size-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
