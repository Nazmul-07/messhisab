'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateShort } from '@/lib/date-utils';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import type { Transaction, Member } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, ShoppingBasket, Receipt } from 'lucide-react';

const TYPE_CONFIG = {
  bazar: {
    label: 'Bazar',
    icon: ShoppingBasket,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    badgeVariant: 'outline' as const,
    badgeClass: 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/5',
    amountSign: '-',
    amountColor: 'text-foreground',
  },
  deposit: {
    label: 'Deposit',
    icon: ArrowDownLeft,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    badgeVariant: 'outline' as const,
    badgeClass: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5',
    amountSign: '+',
    amountColor: 'text-emerald-500',
  },
  expense: {
    label: 'Expense',
    icon: Receipt,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    badgeVariant: 'outline' as const,
    badgeClass: 'border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/5',
    amountSign: '-',
    amountColor: 'text-foreground',
  },
  settlement: {
    label: 'Settlement',
    icon: ArrowUpRight,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    badgeVariant: 'outline' as const,
    badgeClass: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5',
    amountSign: '',
    amountColor: 'text-foreground',
  },
} as const;

interface RecentTransactionsProps {
  transactions: Transaction[];
  members: Member[];
}

export function RecentTransactions({ transactions, members }: RecentTransactionsProps) {
  const getMember = (id?: string) => members.find((m) => m.id === id);
  const recent = transactions.slice(0, 10);

  return (
    <Card className="border-border/60 bg-card flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">
            Recent Transactions
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] font-mono">
            {recent.length} of {transactions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Receipt className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No transactions</p>
            <p className="text-xs text-muted-foreground mt-1">
              Transactions will appear here once recorded.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {recent.map((tx) => {
              const cfg = TYPE_CONFIG[tx.type];
              const Icon = cfg.icon;
              const member = getMember(tx.memberId);
              return (
                <div
                  key={`${tx.type}-${tx.id}`}
                  className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-muted/30 transition-colors group"
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'size-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
                      cfg.bg,
                    )}
                  >
                    <Icon className={cn('size-4', cfg.color)} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate leading-snug">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {formatDateShort(tx.date)}
                      </span>
                      {member && (
                        <>
                          <span className="text-muted-foreground/40 text-xs">·</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {member.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount + badge */}
                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        'text-sm font-mono font-semibold tabular-nums',
                        cfg.amountColor,
                      )}
                    >
                      {cfg.amountSign}
                      {CURRENCY_SYMBOL}
                      {(tx.amountPaisa / 100).toLocaleString('en-BD', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    <div className="mt-0.5 flex justify-end">
                      <Badge
                        variant="outline"
                        className={cn('text-[9px] font-medium px-1.5 py-0 h-4', cfg.badgeClass)}
                      >
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
