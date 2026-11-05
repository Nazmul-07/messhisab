'use client';

import { useMemo } from 'react';
import {
  ShoppingBasket,
  Receipt,
  Wallet,
  UtensilsCrossed,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { useBazarStore } from '@/stores/bazar.store';
import { useMealsStore } from '@/stores/meals.store';
import { useDepositsStore } from '@/stores/deposits.store';
import { useExpensesStore } from '@/stores/expenses.store';
import { useMembersStore } from '@/stores/members.store';
import {
  calculateMonthlyStats,
  calculateMemberSettlement,
  getMemberMealSummary,
} from '@/lib/calculations';
import { formatMonthYear, getMonthDays, dateInMonth } from '@/lib/date-utils';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { StatCard } from '@/components/dashboard/StatCard';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { MealChart } from '@/components/dashboard/MealChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { MemberSummaryTable } from '@/components/dashboard/MemberSummaryTable';
import { MonthSelector } from '@/components/shared/MonthSelector';
import type { Transaction } from '@/lib/types';

export default function DashboardPage() {
  const { selectedMonth } = useAppStore();
  const { entries: bazarEntries } = useBazarStore();
  const { records: mealRecords } = useMealsStore();
  const { deposits } = useDepositsStore();
  const { expenses } = useExpensesStore();
  const { members } = useMembersStore();

  const activeMembers = useMemo(
    () => members.filter((m) => m.status === 'active'),
    [members],
  );

  const stats = useMemo(
    () =>
      calculateMonthlyStats(
        bazarEntries,
        expenses,
        deposits,
        mealRecords,
        activeMembers,
        selectedMonth,
      ),
    [bazarEntries, expenses, deposits, mealRecords, activeMembers, selectedMonth],
  );

  // Meal summaries per member
  const mealSummaries = useMemo(
    () =>
      activeMembers.map((m) =>
        getMemberMealSummary(mealRecords, m.id, selectedMonth),
      ),
    [activeMembers, mealRecords, selectedMonth],
  );

  // Settlements
  const settlements = useMemo(
    () =>
      activeMembers.map((m) =>
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
      ),
    [activeMembers, mealSummaries, stats.mealRatePaisa, expenses, deposits, bazarEntries, selectedMonth],
  );

  // Chart data: aggregate by week
  const days = useMemo(
    () => getMonthDays(selectedMonth.year, selectedMonth.month),
    [selectedMonth.year, selectedMonth.month],
  );

  const weeklyExpenseData = useMemo(() => {
    const weeks: Array<{ day: string; bazar: number; expenses: number }> = [];
    const chunkSize = 7;
    for (let i = 0; i < days.length; i += chunkSize) {
      const chunk = days.slice(i, i + chunkSize);
      const start = chunk[0].substring(5); // MM-DD
      const bazar = bazarEntries
        .filter((e) => chunk.includes(e.date))
        .reduce((s, e) => s + e.amountPaisa, 0);
      const exp = expenses
        .filter((e) => chunk.includes(e.date))
        .reduce((s, e) => s + e.amountPaisa, 0);
      weeks.push({ day: start, bazar, expenses: exp });
    }
    return weeks;
  }, [days, bazarEntries, expenses]);

  // Meal chart: daily totals (every 3 days to avoid crowding)
  const mealChartData = useMemo(
    () =>
      days
        .filter((_, i) => i % 3 === 0)
        .map((date) => ({
          day: date.substring(5),
          meals: mealRecords
            .filter((r) => r.date === date)
            .reduce((s, r) => s + r.breakfast + r.lunch + r.dinner, 0),
        })),
    [days, mealRecords],
  );

  // Recent transactions — combined, sorted newest-first, limit to 10
  const transactions: Transaction[] = useMemo(
    () =>
      [
        ...bazarEntries
          .filter((e) => dateInMonth(e.date, selectedMonth))
          .map((e) => ({
            id: e.id,
            messId: e.messId,
            type: 'bazar' as const,
            description: e.items,
            amountPaisa: e.amountPaisa,
            date: e.date,
            memberId: e.paidByMemberId,
            paymentSource: e.paymentSource,
          })),
        ...deposits
          .filter((d) => dateInMonth(d.date, selectedMonth))
          .map((d) => ({
            id: d.id,
            messId: d.messId,
            type: 'deposit' as const,
            description: `Deposit — ${members.find((m) => m.id === d.memberId)?.name ?? 'Unknown'}`,
            amountPaisa: d.amountPaisa,
            date: d.date,
            memberId: d.memberId,
          })),
        ...expenses
          .filter((e) => dateInMonth(e.date, selectedMonth))
          .map((e) => ({
            id: e.id,
            messId: e.messId,
            type: 'expense' as const,
            description: e.description,
            amountPaisa: e.amountPaisa,
            date: e.date,
            memberId: e.paidByMemberId,
            paymentSource: e.paymentSource,
          })),
      ].sort((a, b) => b.date.localeCompare(a.date)),
    [bazarEntries, deposits, expenses, members, selectedMonth],
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Financial overview for{' '}
            <span className="font-medium text-foreground">
              {formatMonthYear(selectedMonth.year, selectedMonth.month)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthSelector />
        </div>
      </div>

      {/* Stat cards — 2 on mobile, 3 on md, 6 on xl */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Bazar Cost"
          valuePaisa={stats.totalBazarCostPaisa}
          icon={ShoppingBasket}
          iconColor="text-cyan-500"
          iconBg="bg-cyan-500/10"
          subtitle="Grocery purchases"
          compact
        />
        <StatCard
          title="Other Expenses"
          valuePaisa={stats.totalOtherExpensesPaisa}
          icon={Receipt}
          iconColor="text-violet-500"
          iconBg="bg-violet-500/10"
          subtitle="Utilities & bills"
          compact
        />
        <StatCard
          title="Total Deposits"
          valuePaisa={stats.totalDepositsPaisa}
          icon={Wallet}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
          subtitle="Member contributions"
          compact
        />
        <StatCard
          title="Total Meals"
          value={`${stats.totalMeals.toFixed(1)}`}
          icon={UtensilsCrossed}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
          subtitle="Meal units consumed"
        />
        <StatCard
          title="Meal Rate"
          value={`${CURRENCY_SYMBOL}${(stats.mealRatePaisa / 100).toFixed(2)}`}
          icon={TrendingUp}
          iconColor="text-primary"
          iconBg="bg-primary/10"
          subtitle="Per meal unit"
        />
        <StatCard
          title="Active Members"
          value={stats.activeMembersCount}
          icon={Users}
          iconColor="text-pink-500"
          iconBg="bg-pink-500/10"
          subtitle="In this mess"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="min-w-0">
          <ExpenseChart
            data={weeklyExpenseData}
            totalBazarPaisa={stats.totalBazarCostPaisa}
            totalExpensesPaisa={stats.totalOtherExpensesPaisa}
          />
        </div>
        <div className="min-w-0">
          <MealChart
            data={mealChartData}
            totalMeals={stats.totalMeals}
            mealRatePaisa={stats.mealRatePaisa}
          />
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-2">
          <RecentTransactions transactions={transactions} members={members} />
        </div>
        <div className="xl:col-span-3">
          <MemberSummaryTable settlements={settlements} members={members} />
        </div>
      </div>
    </div>
  );
}
