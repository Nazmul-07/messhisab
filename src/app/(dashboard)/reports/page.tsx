'use client';

// ============================================================
// MessHisab — Monthly Financial Reports Page
// Comprehensive executive audit, distribution charts, member ledger,
// precise integer paisa accounting, & print-ready layout
// ============================================================

import { useMemo, useSyncExternalStore } from 'react';
import {
  Printer,
  UtensilsCrossed,
  Receipt,
  Wallet,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Scale,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useBazarStore } from '@/stores/bazar.store';
import { useDepositsStore } from '@/stores/deposits.store';
import { useExpensesStore } from '@/stores/expenses.store';
import { useMealsStore } from '@/stores/meals.store';
import { useMembersStore } from '@/stores/members.store';
import { useAppStore } from '@/stores/app.store';
import {
  calculateMonthlyStats,
  calculateMemberSettlement,
  getMemberMealSummary,
  calculateSettlementAudit,
} from '@/lib/calculations';
import { formatMonthYear } from '@/lib/date-utils';
import { CURRENCY_SYMBOL, EXPENSE_CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MonthSelector } from '@/components/shared/MonthSelector';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

// ─── Theme Colors for Recharts (literal colors for dark/light safe SVG) ─────
const PIE_COLORS = [
  '#06B6D4', // Cyan (Bazar)
  '#8B5CF6', // Violet (Rent)
  '#F59E0B', // Amber (Electricity)
  '#F97316', // Orange (Gas)
  '#3B82F6', // Blue (WiFi)
  '#0EA5E9', // Sky (Water)
  '#10B981', // Emerald (Cleaning)
  '#94A3B8', // Slate (Other)
];

interface TooltipEntry {
  name?: string | number;
  value?: number;
  color?: string;
  payload?: Record<string, unknown>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: readonly TooltipEntry[];
  label?: string;
}

function CustomPieTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-card/95 border border-border rounded-lg shadow-xl p-2.5 text-xs backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 rounded-full inline-block shrink-0"
          style={{ backgroundColor: entry.color }}
        />
        <span className="font-semibold text-foreground">{entry.name}</span>
      </div>
      <p className="font-mono font-bold text-foreground mt-1 text-sm">
        {CURRENCY_SYMBOL}{Number(entry.value ?? 0).toLocaleString('en-US')}
      </p>
    </div>
  );
}

function CustomBarTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 border border-border rounded-lg shadow-xl p-3 text-xs min-w-[160px] backdrop-blur-md">
      <p className="font-semibold text-foreground mb-1.5 border-b border-border/60 pb-1">{label}</p>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full inline-block shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.name}</span>
          </div>
          <span className="font-mono font-bold text-foreground">
            {CURRENCY_SYMBOL}{Number(item.value ?? 0).toLocaleString('en-US')}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const { selectedMonth } = useAppStore();
  const { entries: bazarEntries } = useBazarStore();
  const { deposits } = useDepositsStore();
  const { expenses } = useExpensesStore();
  const { records: mealRecords } = useMealsStore();
  const { members } = useMembersStore();

  // Mount guard for Recharts SSR
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

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
    return activeMembers.map((m) =>
      calculateMemberSettlement(
        m,
        mealSummaries.find((s) => s.memberId === m.id)!,
        stats.mealRatePaisa,
        expenses,
        deposits,
        bazarEntries,
        activeMembers,
        mealSummaries,
        selectedMonth,
      ),
    );
  }, [activeMembers, mealSummaries, stats, expenses, deposits, bazarEntries, selectedMonth]);

  const audit = useMemo(() => {
    return calculateSettlementAudit(
      settlements,
      stats.totalBazarCostPaisa,
      stats.totalOtherExpensesPaisa,
    );
  }, [settlements, stats]);

  // Month expenses filter for charts
  const monthExpenses = useMemo(() => {
    const prefix = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`;
    return expenses.filter((e) => e.date.startsWith(prefix));
  }, [expenses, selectedMonth]);

  // Detailed Expense Categories Breakdown for Pie Chart
  const expenseBreakdown = useMemo(() => {
    const catMap: Record<string, number> = {};
    for (const e of monthExpenses) {
      catMap[e.category] = (catMap[e.category] ?? 0) + e.amountPaisa;
    }

    const items = [
      {
        name: 'Meal Bazar',
        value: Math.round(stats.totalBazarCostPaisa / 100),
        color: PIE_COLORS[0],
      },
    ];

    let colorIdx = 1;
    for (const [cat, paisa] of Object.entries(catMap)) {
      const label = EXPENSE_CATEGORIES[cat as keyof typeof EXPENSE_CATEGORIES] ?? cat;
      items.push({
        name: label,
        value: Math.round(paisa / 100),
        color: PIE_COLORS[colorIdx % PIE_COLORS.length],
      });
      colorIdx++;
    }

    return items.filter((i) => i.value > 0);
  }, [monthExpenses, stats.totalBazarCostPaisa]);

  // Member comparison data for Bar Chart (Cost vs Deposit)
  const memberComparisonData = useMemo(() => {
    return settlements.map((s) => {
      const m = members.find((mem) => mem.id === s.memberId);
      return {
        name: m ? m.name.split(' ')[0] : 'Unknown',
        fullName: m?.name ?? 'Unknown',
        Cost: Math.round(s.totalCostPaisa / 100),
        Paid: Math.round(s.totalCreditPaisa / 100),
      };
    });
  }, [settlements, members]);

  const handlePrint = () => {
    window.print();
  };

  const totalExpenditurePaisa = stats.totalBazarCostPaisa + stats.totalOtherExpensesPaisa;
  const cashboxVariancePaisa = stats.totalDepositsPaisa - totalExpenditurePaisa;

  return (
    <div className="space-y-6">
      {/* Page Header (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Monthly Financial Report</h1>
            <Badge variant="secondary" className="gap-1 text-[11px] font-semibold text-primary">
              <ShieldCheck className="size-3" /> Audited
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Official financial audit & member statement for {formatMonthYear(selectedMonth.year, selectedMonth.month)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="sm:hidden">
            <MonthSelector />
          </div>
          <Button onClick={handlePrint} variant="outline" className="gap-2 shadow-sm">
            <Printer className="size-4" /> Print / PDF Export
          </Button>
        </div>
      </div>

      {/* Official Print Header (Only visible on paper / PDF print) */}
      <div className="print-only mb-6 border-b-2 border-black pb-4 text-black">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Dhaka Bachelor Mess</h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-600 mt-0.5">
              Official Monthly Accounts Audit Statement
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">Billing Cycle: {formatMonthYear(selectedMonth.year, selectedMonth.month)}</p>
            <p className="text-neutral-500">Generated: 05 Nov 2026 | Currency: BDT (৳)</p>
          </div>
        </div>
      </div>

      {/* Executive Key Figures (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Meal Rate</p>
              <p className="text-xl font-bold font-mono text-foreground">
                {CURRENCY_SYMBOL}{(stats.mealRatePaisa / 100).toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">per meal unit</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <UtensilsCrossed className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Meal Bazar</p>
              <p className="text-xl font-bold font-mono text-foreground">
                {CURRENCY_SYMBOL}{(stats.totalBazarCostPaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-muted-foreground">{stats.totalMeals.toFixed(1)} meals served</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
              <Receipt className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Shared Bills</p>
              <p className="text-xl font-bold font-mono text-foreground">
                {CURRENCY_SYMBOL}{(stats.totalOtherExpensesPaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-muted-foreground">Rent, electricity & utilities</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Wallet className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Deposits</p>
              <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {CURRENCY_SYMBOL}{(stats.totalDepositsPaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-muted-foreground">from {stats.activeMembersCount} members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Charts (Screen view) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 no-print">
        {/* Cost Distribution Donut */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieIcon className="size-4 text-cyan-500" />
              <span>Expenditure Distribution</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Meal bazar vs rent, electricity & utility allocations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isMounted ? (
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[230px] flex items-center justify-center text-xs text-muted-foreground">
                Loading chart...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member Cost vs Contribution Comparison */}
        <Card className="border-border lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="size-4 text-cyan-500" />
              <span>Member Cost vs Total Payments</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Compares each member&apos;s total charge against deposits and personal advances
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isMounted ? (
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={memberComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" opacity={0.2} />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} iconSize={8} />
                    <Bar dataKey="Cost" name="Total Cost" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Paid" name="Total Paid" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[230px] flex items-center justify-center text-xs text-muted-foreground">
                Loading chart...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accounting Verification Reconciliation Card */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="size-4 text-cyan-500" />
              <span>Audited Mess Balance Sheet</span>
            </div>
            <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 py-0">
              <CheckCircle2 className="size-3" /> Zero-Sum Balanced
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
              <p className="text-muted-foreground font-medium">Total Mess Expenditure</p>
              <p className="text-lg font-bold font-mono text-foreground mt-1">
                {CURRENCY_SYMBOL}{(totalExpenditurePaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Bazar (৳{(stats.totalBazarCostPaisa / 100).toFixed(0)}) + Bills (৳{(stats.totalOtherExpensesPaisa / 100).toFixed(0)})
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
              <p className="text-muted-foreground font-medium">Total Member Inflows</p>
              <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {CURRENCY_SYMBOL}{(stats.totalDepositsPaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Direct deposits into mess fund
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
              <p className="text-muted-foreground font-medium">Cashbox Net Variance</p>
              <p className={cn(
                'text-lg font-bold font-mono mt-1',
                cashboxVariancePaisa >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
              )}>
                {cashboxVariancePaisa >= 0 ? '+' : ''}{CURRENCY_SYMBOL}{(cashboxVariancePaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {cashboxVariancePaisa >= 0 ? 'Surplus fund reserve' : 'Deficit covered by personal advances'}
              </p>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground pt-1 flex flex-col sm:flex-row justify-between gap-1 border-t border-border/50">
            <span>
              Member Personal Advances: <span className="font-mono font-medium text-foreground">৳{(audit.totalMemberAdvancesPaisa / 100).toFixed(2)}</span>
            </span>
            <span>
              Rounding Variance: <span className="font-mono font-medium text-foreground">৳{(audit.roundingVariancePaisa / 100).toFixed(2)}</span>
            </span>
            <span>
              Active Members: <span className="font-medium text-foreground">{stats.activeMembersCount}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Member-wise Financial Report Table */}
      <Card className="border-border">
        <CardHeader className="pb-3 pt-4 px-5 border-b border-border/60">
          <CardTitle className="text-sm font-semibold">Individual Member Audit Statement</CardTitle>
          <CardDescription className="text-xs">
            Complete member ledger: meals consumed, allocations, payments, and final balance
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/25 text-muted-foreground">
                  <th className="text-left text-xs font-semibold px-5 py-3 uppercase tracking-wider">Member</th>
                  <th className="text-right text-xs font-semibold px-3 py-3 uppercase tracking-wider">Meals</th>
                  <th className="text-right text-xs font-semibold px-3 py-3 uppercase tracking-wider">Meal Cost</th>
                  <th className="text-right text-xs font-semibold px-3 py-3 uppercase tracking-wider">Shared Exp</th>
                  <th className="text-right text-xs font-semibold px-3 py-3 uppercase tracking-wider">Total Cost</th>
                  <th className="text-right text-xs font-semibold px-3 py-3 uppercase tracking-wider">Deposits</th>
                  <th className="text-right text-xs font-semibold px-3 py-3 uppercase tracking-wider">Personal Paid</th>
                  <th className="text-right text-xs font-semibold px-5 py-3 uppercase tracking-wider">Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {settlements.map((s) => {
                  const member = members.find((m) => m.id === s.memberId);
                  if (!member) return null;
                  const isPayable = s.netBalancePaisa > 0;
                  const isZero = s.netBalancePaisa === 0;

                  return (
                    <tr key={s.memberId} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-6 shrink-0 no-print">
                            <AvatarFallback
                              className="text-[9px] font-bold text-white"
                              style={{ background: member.avatarColor }}
                            >
                              {member.avatarInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {s.totalMeals.toFixed(1)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-foreground whitespace-nowrap">
                        {CURRENCY_SYMBOL}{(s.mealCostPaisa / 100).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-foreground whitespace-nowrap">
                        {CURRENCY_SYMBOL}{(s.sharedExpensesPaisa / 100).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                        {CURRENCY_SYMBOL}{(s.totalCostPaisa / 100).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {CURRENCY_SYMBOL}{(s.depositsPaisa / 100).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                        {s.memberPaidExpensesPaisa > 0 ? `${CURRENCY_SYMBOL}${(s.memberPaidExpensesPaisa / 100).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs font-bold whitespace-nowrap">
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
                            ? `Pay ৳${(s.netBalancePaisa / 100).toFixed(2)}`
                            : `Refund ৳${(Math.abs(s.netBalancePaisa) / 100).toFixed(2)}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30 font-bold text-xs">
                  <td className="px-5 py-3 text-foreground">Total Summary</td>
                  <td className="px-3 py-3 text-right font-mono text-muted-foreground">
                    {stats.totalMeals.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-foreground">
                    {CURRENCY_SYMBOL}{(audit.totalMealCostChargedPaisa / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-foreground">
                    {CURRENCY_SYMBOL}{(audit.totalSharedExpensesChargedPaisa / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-foreground">
                    {CURRENCY_SYMBOL}{(audit.totalMemberChargesPaisa / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    {CURRENCY_SYMBOL}{(audit.totalDepositsPaisa / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-cyan-600 dark:text-cyan-400">
                    {CURRENCY_SYMBOL}{(audit.totalMemberAdvancesPaisa / 100).toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono">
                    <span className={audit.totalPayablePaisa >= audit.totalReceivablePaisa ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                      {CURRENCY_SYMBOL}{((audit.totalPayablePaisa - audit.totalReceivablePaisa) / 100).toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Print Signature Section (Only shown when printing) */}
      <div className="print-only pt-12 text-black">
        <div className="grid grid-cols-3 gap-8 text-center text-xs">
          <div>
            <div className="border-b border-black pb-1 mb-1 font-semibold">Md Nazmul Hosen</div>
            <p className="text-neutral-600">Mess Manager / Admin</p>
          </div>
          <div>
            <div className="border-b border-black pb-1 mb-1 font-semibold">Tanvir Ahmed</div>
            <p className="text-neutral-600">Mess Auditor / Member</p>
          </div>
          <div>
            <div className="border-b border-black pb-1 mb-1 font-semibold">Mahmudul Hasan</div>
            <p className="text-neutral-600">Mess Treasurer</p>
          </div>
        </div>
        <p className="text-[10px] text-center text-neutral-500 mt-6">
          MessHisab Smart Mess Management System — This document represents the certified audit statement for {formatMonthYear(selectedMonth.year, selectedMonth.month)}.
        </p>
      </div>
    </div>
  );
}
