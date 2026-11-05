'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import type { Member, MemberSettlement } from '@/lib/types';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';

interface MemberSummaryTableProps {
  settlements: MemberSettlement[];
  members: Member[];
}

function BalanceBadge({ netBalancePaisa }: { netBalancePaisa: number }) {
  if (netBalancePaisa === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <CheckCircle2 className="size-3.5" />
        <span className="text-xs font-medium font-mono">Settled</span>
      </div>
    );
  }
  if (netBalancePaisa > 0) {
    return (
      <div className="flex items-center gap-1 text-red-500">
        <TrendingUp className="size-3.5" />
        <span className="text-xs font-semibold font-mono tabular-nums">
          {CURRENCY_SYMBOL}{(netBalancePaisa / 100).toFixed(0)} due
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-emerald-500">
      <TrendingDown className="size-3.5" />
      <span className="text-xs font-semibold font-mono tabular-nums">
        {CURRENCY_SYMBOL}{Math.abs(netBalancePaisa / 100).toFixed(0)} owed
      </span>
    </div>
  );
}

export function MemberSummaryTable({ settlements, members }: MemberSummaryTableProps) {
  const getMember = (id: string) => members.find((m) => m.id === id);

  // Sort: highest payable first, then settled, then receivable
  const sorted = [...settlements].sort((a, b) => b.netBalancePaisa - a.netBalancePaisa);

  return (
    <Card className="border-border/60 bg-card flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">
            Member Summary
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] font-mono">
            {settlements.length} members
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20">
                <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 sm:px-5 py-2.5 uppercase tracking-wider">
                  Member
                </th>
                <th className="text-right text-[11px] font-semibold text-muted-foreground px-3 py-2.5 uppercase tracking-wider">
                  Meals
                </th>
                <th className="text-right text-[11px] font-semibold text-muted-foreground px-3 py-2.5 uppercase tracking-wider hidden sm:table-cell">
                  Cost
                </th>
                <th className="text-right text-[11px] font-semibold text-muted-foreground px-3 py-2.5 uppercase tracking-wider hidden md:table-cell">
                  Deposits
                </th>
                <th className="text-right text-[11px] font-semibold text-muted-foreground px-4 sm:px-5 py-2.5 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sorted.map((s) => {
                const member = getMember(s.memberId);
                if (!member) return null;
                return (
                  <tr
                    key={s.memberId}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    {/* Member */}
                    <td className="px-4 sm:px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7 shrink-0">
                          <AvatarFallback
                            className="text-[10px] font-bold text-white"
                            style={{ backgroundColor: member.avatarColor }}
                          >
                            {member.avatarInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground leading-none text-sm truncate">
                            {member.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {member.role === 'admin' ? (
                              <span className="text-primary font-medium">Admin</span>
                            ) : (
                              'Member'
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Meals */}
                    <td className="px-3 py-3 text-right">
                      <span className="font-mono tabular-nums text-foreground text-sm">
                        {s.totalMeals.toFixed(1)}
                      </span>
                    </td>

                    {/* Total Cost */}
                    <td className="px-3 py-3 text-right hidden sm:table-cell">
                      <span className="font-mono tabular-nums text-foreground text-sm">
                        {CURRENCY_SYMBOL}{(s.totalCostPaisa / 100).toFixed(0)}
                      </span>
                    </td>

                    {/* Deposits */}
                    <td className="px-3 py-3 text-right hidden md:table-cell">
                      <span className="font-mono tabular-nums text-emerald-500 text-sm">
                        +{CURRENCY_SYMBOL}{(s.depositsPaisa / 100).toFixed(0)}
                      </span>
                    </td>

                    {/* Net Balance */}
                    <td className="px-4 sm:px-5 py-3 text-right">
                      <BalanceBadge netBalancePaisa={s.netBalancePaisa} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer summary row */}
        {settlements.length > 0 && (
          <div className="border-t border-border/60 bg-muted/10 px-4 sm:px-5 py-3 flex flex-wrap gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Cost</p>
              <p className="font-mono font-semibold text-sm text-foreground mt-0.5">
                {CURRENCY_SYMBOL}
                {(settlements.reduce((s, m) => s + m.totalCostPaisa, 0) / 100).toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Deposits</p>
              <p className="font-mono font-semibold text-sm text-emerald-500 mt-0.5">
                +{CURRENCY_SYMBOL}
                {(settlements.reduce((s, m) => s + m.depositsPaisa, 0) / 100).toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Net</p>
              <p
                className={cn(
                  'font-mono font-semibold text-sm mt-0.5',
                  settlements.reduce((s, m) => s + m.netBalancePaisa, 0) > 0
                    ? 'text-red-500'
                    : 'text-emerald-500',
                )}
              >
                {CURRENCY_SYMBOL}
                {Math.abs(settlements.reduce((s, m) => s + m.netBalancePaisa, 0) / 100).toFixed(0)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
