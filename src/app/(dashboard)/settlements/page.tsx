'use client';

// ============================================================
// MessHisab — Settlements Page
// Complete member settlement ledger, live preview vs finalized state,
// precise integer paisa accounting, rounding audit, & admin closing
// ============================================================

import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Lock,
  Unlock,
  Search,
  Scale,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  BadgeCheck,
  Check,
} from 'lucide-react';
import { useBazarStore } from '@/stores/bazar.store';
import { useDepositsStore } from '@/stores/deposits.store';
import { useExpensesStore } from '@/stores/expenses.store';
import { useMealsStore } from '@/stores/meals.store';
import { useMembersStore } from '@/stores/members.store';
import { useAppStore } from '@/stores/app.store';
import { useSettlementsStore } from '@/stores/settlements.store';
import {
  calculateMonthlyStats,
  calculateMemberSettlement,
  getMemberMealSummary,
  calculateSettlementAudit,
} from '@/lib/calculations';
import { formatMonthYear, formatDate } from '@/lib/date-utils';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MonthSelector } from '@/components/shared/MonthSelector';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { SettlementStatus } from '@/lib/types';

export default function SettlementsPage() {
  const { selectedMonth } = useAppStore();
  const { entries: bazarEntries } = useBazarStore();
  const { deposits } = useDepositsStore();
  const { expenses } = useExpensesStore();
  const { records: mealRecords } = useMealsStore();
  const { members } = useMembersStore();

  const {
    isMonthClosed,
    getClosingRecord,
    closeMonth,
    reopenMonth,
    getMemberStatus,
    setMemberPaymentStatus,
  } = useSettlementsStore();

  const [closeMonthOpen, setCloseMonthOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [closingNote, setClosingNote] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'payable' | 'receivable' | 'settled'>('all');

  const monthKey = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`;
  const isClosed = isMonthClosed(monthKey);
  const closingRecord = getClosingRecord(monthKey);

  const activeMembers = useMemo(
    () => members.filter((m) => m.status === 'active'),
    [members],
  );

  // Core calculations
  const stats = useMemo(() => {
    return calculateMonthlyStats(
      bazarEntries,
      expenses,
      deposits,
      mealRecords,
      activeMembers,
      selectedMonth,
    );
  }, [bazarEntries, expenses, deposits, mealRecords, activeMembers, selectedMonth]);

  const mealSummaries = useMemo(() => {
    return activeMembers.map((m) =>
      getMemberMealSummary(mealRecords, m.id, selectedMonth),
    );
  }, [activeMembers, mealRecords, selectedMonth]);

  const settlements = useMemo(() => {
    return activeMembers.map((m) => {
      const base = calculateMemberSettlement(
        m,
        mealSummaries.find((s) => s.memberId === m.id)!,
        stats.mealRatePaisa,
        expenses,
        deposits,
        bazarEntries,
        activeMembers,
        mealSummaries,
        selectedMonth,
      );

      // Check persisted status
      const savedStatus = getMemberStatus(monthKey, m.id);
      if (savedStatus) {
        return { ...base, status: savedStatus };
      }
      if (isClosed) {
        return { ...base, status: 'settled' as SettlementStatus };
      }
      return base;
    });
  }, [
    activeMembers,
    mealSummaries,
    stats,
    expenses,
    deposits,
    bazarEntries,
    selectedMonth,
    monthKey,
    isClosed,
    getMemberStatus,
  ]);

  // Mathematical Audit & Reconciliation
  const audit = useMemo(() => {
    return calculateSettlementAudit(
      settlements,
      stats.totalBazarCostPaisa,
      stats.totalOtherExpensesPaisa,
    );
  }, [settlements, stats]);

  // Filtered members list
  const filteredSettlements = useMemo(() => {
    return settlements.filter((s) => {
      const member = members.find((m) => m.id === s.memberId);
      if (!member) return false;

      // Status filter
      if (filterType === 'payable' && s.netBalancePaisa <= 0) return false;
      if (filterType === 'receivable' && s.netBalancePaisa >= 0) return false;
      if (filterType === 'settled' && s.status !== 'settled') return false;

      // Search filter
      const text = `${member.name} ${member.email}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [settlements, members, filterType, search]);

  const handleToggleMemberSettled = (memberId: string, currentStatus: SettlementStatus) => {
    const nextStatus: SettlementStatus = currentStatus === 'settled' ? 'pending' : 'settled';
    setMemberPaymentStatus(monthKey, memberId, nextStatus);
    const memberName = members.find((m) => m.id === memberId)?.name;
    if (nextStatus === 'settled') {
      toast.success(`Settlement marked complete for ${memberName}`);
    } else {
      toast.info(`Settlement marked pending for ${memberName}`);
    }
  };

  const handleConfirmClose = () => {
    closeMonth(monthKey, {
      closedByMemberName: 'Md Nazmul Hosen (Admin)',
      totalPayablePaisa: audit.totalPayablePaisa,
      totalReceivablePaisa: audit.totalReceivablePaisa,
      roundingVariancePaisa: audit.roundingVariancePaisa,
      note: closingNote || `Month finalized with ${activeMembers.length} active members.`,
    });
    setCloseMonthOpen(false);
    setClosingNote('');
    toast.success(`Accounts officially finalized and closed for ${formatMonthYear(selectedMonth.year, selectedMonth.month)}!`);
  };

  const handleConfirmReopen = () => {
    reopenMonth(monthKey);
    setReopenOpen(false);
    toast.info(`Accounts reopened in Preview mode for ${formatMonthYear(selectedMonth.year, selectedMonth.month)}.`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Monthly Settlements</h1>
            {isClosed ? (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 py-0.5">
                <Lock className="size-3" /> Finalized & Closed
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 gap-1.5 py-0.5 animate-pulse">
                <Scale className="size-3" /> Preview Mode (Live)
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Individual member ledger, dues collection, refunds, & audit closing for {formatMonthYear(selectedMonth.year, selectedMonth.month)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="sm:hidden">
            <MonthSelector />
          </div>
          {isClosed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReopenOpen(true)}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Unlock className="size-4" /> Re-open Month
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setCloseMonthOpen(true)}
              className="gap-2 shadow-sm"
            >
              <CheckCircle2 className="size-4" /> Close Monthly Accounts
            </Button>
          )}
        </div>
      </div>

      {/* Mode Alert / Notice */}
      {isClosed && closingRecord ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 dark:text-emerald-200">
          <div className="flex items-start gap-2.5">
            <BadgeCheck className="size-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                Official Settlement Record — Locked
              </p>
              <p className="opacity-90 mt-0.5">
                Closed by <span className="font-medium">{closingRecord.closedByMemberName}</span> on {formatDate(closingRecord.closedAt.split('T')[0])}. {closingRecord.note}
              </p>
            </div>
          </div>
          <div className="shrink-0 font-mono text-[11px] opacity-80">
            Audit Equilibrium: {audit.roundingVariancePaisa === 0 ? 'Exact 0.00 Variance' : `৳${(audit.roundingVariancePaisa / 100).toFixed(2)}`}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <Info className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-300">
                Real-Time Settlement Preview (Ongoing Month)
              </p>
              <p className="opacity-90 mt-0.5">
                This ledger updates dynamically as daily meals, bazar purchases, or deposits are recorded. Click <span className="font-semibold">Close Monthly Accounts</span> when the billing month ends to finalize all member balances.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 shrink-0 text-[11px]">
            Unsettled Live Draft
          </Badge>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
              <span>Total Member Dues</span>
              <ArrowDownLeft className="size-3.5 text-rose-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
              {CURRENCY_SYMBOL}{(audit.totalPayablePaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Payable by {settlements.filter((s) => s.netBalancePaisa > 0).length} members
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
              <span>Total Refunds</span>
              <ArrowUpRight className="size-3.5 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {CURRENCY_SYMBOL}{(audit.totalReceivablePaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Refundable to {settlements.filter((s) => s.netBalancePaisa < 0).length} members
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
              <span>Net Variance</span>
              <Scale className="size-3.5 text-cyan-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {CURRENCY_SYMBOL}{(Math.abs(audit.totalPayablePaisa - audit.totalReceivablePaisa) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cashbox residual surplus/deficit
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
              <span>Rounding Precision</span>
              <span className="text-[10px] text-muted-foreground font-mono">Paisa Check</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-mono tabular-nums text-cyan-600 dark:text-cyan-400">
              {audit.roundingVariancePaisa === 0 ? '৳0.00' : `${CURRENCY_SYMBOL}${(audit.roundingVariancePaisa / 100).toFixed(2)}`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {audit.roundingVariancePaisa === 0 ? '✓ 100% Exact match' : 'Sub-paisa fractional remainder'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={(v) => setFilterType((v as typeof filterType) ?? 'all')}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({settlements.length})</SelectItem>
              <SelectItem value="payable">Owing Dues ({settlements.filter((s) => s.netBalancePaisa > 0).length})</SelectItem>
              <SelectItem value="receivable">Refunds ({settlements.filter((s) => s.netBalancePaisa < 0).length})</SelectItem>
              <SelectItem value="settled">Settled ({settlements.filter((s) => s.status === 'settled').length})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Detailed Settlement Ledger */}
      <Card className="border-border">
        <CardHeader className="pb-3 pt-4 px-5 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span>Member-Wise Financial Breakdown</span>
              <Badge variant="secondary" className="text-[11px] font-mono">
                Rate: {CURRENCY_SYMBOL}{(stats.mealRatePaisa / 100).toFixed(2)}/meal
              </Badge>
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              Showing {filteredSettlements.length} of {settlements.length} members
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                  <th className="text-left text-xs font-semibold px-5 py-3 uppercase tracking-wider">Member</th>
                  <th className="text-right text-xs font-semibold px-3 py-3 uppercase tracking-wider">Meals</th>
                  <th className="text-right text-xs font-semibold px-3 py-3 uppercase tracking-wider">Meal Cost</th>
                  <th className="text-right text-xs font-semibold px-3 py-3 uppercase tracking-wider hidden sm:table-cell">Shared Exp</th>
                  <th className="text-right text-xs font-semibold px-3 py-3 uppercase tracking-wider">Total Charge</th>
                  <th className="text-right text-xs font-semibold px-3 py-3 uppercase tracking-wider hidden sm:table-cell">Deposits</th>
                  <th className="text-right text-xs font-semibold px-3 py-3 uppercase tracking-wider hidden md:table-cell">Personal Paid</th>
                  <th className="text-right text-xs font-semibold px-3 py-3 uppercase tracking-wider">Net Balance</th>
                  <th className="text-center text-xs font-semibold px-3 py-3 uppercase tracking-wider">Status</th>
                  <th className="text-right text-xs font-semibold px-5 py-3 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSettlements.map((s) => {
                  const member = members.find((m) => m.id === s.memberId);
                  if (!member) return null;
                  const isSettled = s.status === 'settled';
                  const isPayable = s.netBalancePaisa > 0;
                  const isZero = s.netBalancePaisa === 0;

                  return (
                    <tr key={s.memberId} className="hover:bg-muted/25 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7 shrink-0">
                            <AvatarFallback
                              className="text-[10px] font-bold text-white"
                              style={{ background: member.avatarColor }}
                            >
                              {member.avatarInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground leading-none">{member.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {s.totalMeals.toFixed(1)}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs text-foreground whitespace-nowrap">
                        {CURRENCY_SYMBOL}{(s.mealCostPaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs text-foreground hidden sm:table-cell whitespace-nowrap">
                        {CURRENCY_SYMBOL}{(s.sharedExpensesPaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                        {CURRENCY_SYMBOL}{(s.totalCostPaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 hidden sm:table-cell whitespace-nowrap">
                        {CURRENCY_SYMBOL}{(s.depositsPaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs text-cyan-600 dark:text-cyan-400 hidden md:table-cell whitespace-nowrap">
                        {s.memberPaidExpensesPaisa > 0
                          ? `${CURRENCY_SYMBOL}${(s.memberPaidExpensesPaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs font-bold whitespace-nowrap">
                        <span
                          className={cn(
                            isZero
                              ? 'text-muted-foreground'
                              : isPayable
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400',
                          )}
                        >
                          {isZero
                            ? '৳0.00'
                            : isPayable
                            ? `Owes ৳${(s.netBalancePaisa / 100).toFixed(2)}`
                            : `Gets ৳${(Math.abs(s.netBalancePaisa) / 100).toFixed(2)}`}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] capitalize font-medium py-0 px-2',
                            isSettled
                              ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                              : isZero
                              ? 'border-border text-muted-foreground bg-muted/40'
                              : isPayable
                              ? 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10'
                              : 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
                          )}
                        >
                          {isSettled ? 'Settled ✓' : isZero ? 'Zero Due' : isPayable ? 'Due' : 'Refund'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Button
                          size="xs"
                          variant={isSettled ? 'ghost' : 'outline'}
                          onClick={() => handleToggleMemberSettled(s.memberId, s.status)}
                          className={cn(
                            'h-7 text-xs',
                            isSettled
                              ? 'text-muted-foreground hover:text-foreground'
                              : 'text-primary border-primary/30 hover:bg-primary/10',
                          )}
                        >
                          {isSettled ? (
                            <span className="flex items-center gap-1">
                              <Check className="size-3 text-emerald-500" /> Settled
                            </span>
                          ) : (
                            'Mark Settled'
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30 font-semibold text-xs">
                  <td className="px-5 py-3 text-foreground">Total Ledger Totals</td>
                  <td className="px-3 py-3 text-right font-mono text-muted-foreground">
                    {stats.totalMeals.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-foreground">
                    {CURRENCY_SYMBOL}{(audit.totalMealCostChargedPaisa / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-foreground hidden sm:table-cell">
                    {CURRENCY_SYMBOL}{(audit.totalSharedExpensesChargedPaisa / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-foreground font-bold">
                    {CURRENCY_SYMBOL}{(audit.totalMemberChargesPaisa / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 hidden sm:table-cell">
                    {CURRENCY_SYMBOL}{(audit.totalDepositsPaisa / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-cyan-600 dark:text-cyan-400 hidden md:table-cell">
                    {CURRENCY_SYMBOL}{(audit.totalMemberAdvancesPaisa / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold">
                    <span className={audit.totalPayablePaisa >= audit.totalReceivablePaisa ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                      {CURRENCY_SYMBOL}{((audit.totalPayablePaisa - audit.totalReceivablePaisa) / 100).toFixed(2)}
                    </span>
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog: Close Month */}
      <ConfirmDialog
        open={closeMonthOpen}
        onOpenChange={setCloseMonthOpen}
        title={`Finalize & Close Accounts: ${formatMonthYear(selectedMonth.year, selectedMonth.month)}`}
        description={`This action audits and locks the financial ledger for ${formatMonthYear(selectedMonth.year, selectedMonth.month)}. Total member dues to collect: ৳${(audit.totalPayablePaisa / 100).toFixed(2)} across ${settlements.filter((s) => s.netBalancePaisa > 0).length} members. Total refunds to disburse: ৳${(audit.totalReceivablePaisa / 100).toFixed(2)}. Are you sure you want to close this month?`}
        confirmLabel="Finalize & Lock Accounts"
        variant="default"
        onConfirm={handleConfirmClose}
      />

      {/* Confirmation Dialog: Re-open Month */}
      <ConfirmDialog
        open={reopenOpen}
        onOpenChange={setReopenOpen}
        title={`Re-open Accounts for ${formatMonthYear(selectedMonth.year, selectedMonth.month)}?`}
        description="Re-opening will return this month to dynamic Preview Mode so adjustments to meals, bills, or deposits can be made."
        confirmLabel="Re-open Month"
        variant="default"
        onConfirm={handleConfirmReopen}
      />
    </div>
  );
}
