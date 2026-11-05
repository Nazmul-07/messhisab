'use client';

import { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Shield,
  Calendar as CalendarIcon,
  Table as TableIcon,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useMealsStore } from '@/stores/meals.store';
import { useMembersStore } from '@/stores/members.store';
import { useBazarStore } from '@/stores/bazar.store';
import { useAppStore } from '@/stores/app.store';
import { getMonthDays, formatMonthYear, todayString, formatDate } from '@/lib/date-utils';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { formatCurrency } from '@/lib/currency';
import { calculateMealRate, getTotalBazarCost } from '@/lib/calculations';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonthSelector } from '@/components/shared/MonthSelector';
import { MealDayEditor } from '@/components/meals/MealDayEditor';
import type { MealRecord } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

function MealUnitBadge({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-muted-foreground/30 text-xs font-mono">—</span>;
  }
  if (value % 1 !== 0) {
    return (
      <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded">
        {value.toFixed(1)}
      </span>
    );
  }
  return (
    <span className="font-mono text-xs font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded">
      {value.toFixed(1)}
    </span>
  );
}

export default function MealsPage() {
  const { selectedMonth } = useAppStore();
  const { records, bulkUpsertRecords, deleteDayRecords } = useMealsStore();
  const { members } = useMembersStore();
  const { entries: bazarEntries } = useBazarStore();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'calendar' | 'summary'>('matrix');

  const activeMembers = useMemo(
    () => members.filter((m) => m.status === 'active'),
    [members],
  );
  const allDays = useMemo(
    () => getMonthDays(selectedMonth.year, selectedMonth.month),
    [selectedMonth.year, selectedMonth.month],
  );

  // Pagination for matrix days (show 10 days window for clean responsiveness)
  const [dayOffset, setDayOffset] = useState(0);
  const pageSize = 12;
  const matrixDays = allDays.slice(dayOffset, dayOffset + pageSize);

  // Fast composite lookup (memberId:date)
  const recordMap = useMemo(() => {
    const map = new Map<string, MealRecord>();
    for (const r of records) {
      map.set(`${r.memberId}:${r.date}`, r);
    }
    return map;
  }, [records]);

  // Total meals across entire month
  const monthPrefix = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`;
  const totalMonthMeals = useMemo(() => {
    return records
      .filter((r) => r.date.startsWith(monthPrefix))
      .reduce((s, r) => s + (r.breakfast + r.lunch + r.dinner), 0);
  }, [records, monthPrefix]);

  // Dynamic Meal Rate
  const totalBazarCost = getTotalBazarCost(bazarEntries, selectedMonth);
  const mealRatePaisa = calculateMealRate(totalBazarCost, totalMonthMeals);

  // Per-member monthly totals
  const memberMonthlyStats = useMemo(() => {
    return activeMembers.map((m) => {
      const monthRecs = records.filter(
        (r) => r.memberId === m.id && r.date.startsWith(monthPrefix),
      );
      let b = 0,
        l = 0,
        d = 0;
      for (const r of monthRecs) {
        b += r.breakfast;
        l += r.lunch;
        d += r.dinner;
      }
      const total = b + l + d;
      const mealCostPaisa = Math.round(total * mealRatePaisa);
      return { member: m, breakfast: b, lunch: l, dinner: d, totalMeals: total, mealCostPaisa };
    });
  }, [activeMembers, records, monthPrefix, mealRatePaisa]);

  // Daily totals map
  const dailyTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of allDays) {
      const sum = activeMembers.reduce((s, m) => {
        const r = recordMap.get(`${m.id}:${d}`);
        return s + (r ? r.breakfast + r.lunch + r.dinner : 0);
      }, 0);
      map.set(d, sum);
    }
    return map;
  }, [allDays, activeMembers, recordMap]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Daily Meal Tracking</h1>
            <Badge variant="secondary" className="gap-1 text-[11px] font-medium text-primary">
              <Shield className="size-3" /> Admin Managed
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Log breakfast, lunch, and dinner records for{' '}
            <span className="font-semibold text-foreground">
              {formatMonthYear(selectedMonth.year, selectedMonth.month)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <MonthSelector />
          <Button
            onClick={() => setSelectedDate(todayString())}
            className="gap-2 shadow-xs"
          >
            <Plus className="size-4" /> Record Today&apos;s Meals
          </Button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Month Meals
            </p>
            <UtensilsCrossed className="size-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground mt-1.5">
            {totalMonthMeals.toFixed(1)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Across {allDays.length} days
          </p>
        </Card>

        <Card className="border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Current Meal Rate
            </p>
            <span className="text-xs font-mono font-bold text-primary">BDT</span>
          </div>
          <p className="text-2xl font-bold font-mono text-cyan-500 dark:text-cyan-400 mt-1.5">
            {CURRENCY_SYMBOL}{(mealRatePaisa / 100).toFixed(2)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Total Bazar ÷ Total Meals
          </p>
        </Card>

        <Card className="border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Daily Average
            </p>
            <CalendarIcon className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-500 mt-1.5">
            {allDays.length > 0 ? (totalMonthMeals / allDays.length).toFixed(1) : '0'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Meals per day across mess
          </p>
        </Card>

        <Card className="border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Active Diners
            </p>
            <Users className="size-4 text-pink-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground mt-1.5">
            {activeMembers.length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Eligible mess members
          </p>
        </Card>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'matrix' | 'calendar' | 'summary')}>
          <TabsList className="grid grid-cols-3 h-9 w-80">
            <TabsTrigger value="matrix" className="text-xs gap-1.5">
              <TableIcon className="size-3.5" /> Daily Matrix
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs gap-1.5">
              <CalendarIcon className="size-3.5" /> Calendar View
            </TabsTrigger>
            <TabsTrigger value="summary" className="text-xs gap-1.5">
              <Users className="size-3.5" /> Member Stats
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Matrix Window Navigator */}
        {activeTab === 'matrix' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">
              Days {dayOffset + 1}–{Math.min(dayOffset + pageSize, allDays.length)} of {allDays.length}
            </span>
            <div className="flex items-center border border-border rounded-lg p-0.5 bg-card">
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                disabled={dayOffset === 0}
                onClick={() => setDayOffset((prev) => Math.max(0, prev - pageSize))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                disabled={dayOffset + pageSize >= allDays.length}
                onClick={() => setDayOffset((prev) => Math.min(allDays.length - 1, prev + pageSize))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: Daily Matrix */}
      {activeTab === 'matrix' && (
        <Card className="border-border/60 bg-card overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-border/60 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Daily Meal Matrix (B/L/D)</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click on any column header or cell to record or edit that date&apos;s meal entries
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20">
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider sticky left-0 bg-card z-10 shadow-xs min-w-[150px]">
                      Member
                    </th>
                    {matrixDays.map((date) => {
                      const d = parseISO(date);
                      const isToday = date === todayString();
                      return (
                        <th
                          key={date}
                          onClick={() => setSelectedDate(date)}
                          className={cn(
                            'text-center px-2 py-2 cursor-pointer transition-colors border-r border-border/40 hover:bg-muted/40 min-w-[58px]',
                            isToday && 'bg-primary/10',
                          )}
                          title={`Click to edit meals for ${formatDate(date)}`}
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              {format(d, 'EEE')}
                            </span>
                            <span className={cn('text-xs font-bold font-mono', isToday && 'text-primary')}>
                              {format(d, 'd')}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                    <th className="text-right text-[11px] font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider min-w-[90px]">
                      Total Meals
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {activeMembers.map((member) => {
                    const stats = memberMonthlyStats.find((s) => s.member.id === member.id);
                    return (
                      <tr key={member.id} className="hover:bg-muted/20 transition-colors group">
                        {/* Sticky Member Column */}
                        <td className="px-4 py-2.5 sticky left-0 bg-card z-10 shadow-xs border-r border-border/40">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="size-6 shrink-0">
                              <AvatarFallback
                                className="text-[10px] font-bold text-white"
                                style={{ backgroundColor: member.avatarColor }}
                              >
                                {member.avatarInitials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-xs text-foreground truncate">
                              {member.name}
                            </span>
                          </div>
                        </td>

                        {/* Day Cells */}
                        {matrixDays.map((date) => {
                          const r = recordMap.get(`${member.id}:${date}`);
                          const dayTotal = r ? r.breakfast + r.lunch + r.dinner : 0;
                          return (
                            <td
                              key={date}
                              onClick={() => setSelectedDate(date)}
                              className="px-2 py-2 text-center cursor-pointer hover:bg-muted/30 transition-colors border-r border-border/40"
                              title={`${member.name} on ${date}: B:${r?.breakfast ?? 0}, L:${r?.lunch ?? 0}, D:${r?.dinner ?? 0}`}
                            >
                              <MealUnitBadge value={dayTotal} />
                            </td>
                          );
                        })}

                        {/* Total Meals */}
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-sm text-foreground">
                          {stats?.totalMeals.toFixed(1) ?? '0.0'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Day Total Footer */}
                <tfoot>
                  <tr className="border-t-2 border-border/80 bg-muted/30">
                    <td className="px-4 py-2.5 sticky left-0 bg-muted/40 z-10 font-bold text-xs uppercase text-muted-foreground shadow-xs">
                      Daily Total
                    </td>
                    {matrixDays.map((date) => {
                      const total = dailyTotals.get(date) ?? 0;
                      return (
                        <td
                          key={date}
                          onClick={() => setSelectedDate(date)}
                          className="px-2 py-2 text-center cursor-pointer hover:bg-muted/50 font-mono font-bold text-xs text-foreground border-r border-border/40"
                        >
                          {total > 0 ? total.toFixed(1) : '—'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5 text-right font-mono font-extrabold text-sm text-primary">
                      {totalMonthMeals.toFixed(1)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VIEW 2: Calendar View */}
      {activeTab === 'calendar' && (
        <Card className="border-border/60 bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Interactive Month Calendar</h3>
              <p className="text-xs text-muted-foreground">
                Click any day cell to record, edit, or clear meals
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2.5 rounded-full bg-emerald-500 inline-block" /> Active Days
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2.5 rounded-full bg-muted-foreground/30 inline-block" /> No Meals
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-[11px] font-semibold text-muted-foreground py-1.5 uppercase"
              >
                {day}
              </div>
            ))}

            {/* Empty offset days for month start */}
            {Array.from({ length: parseISO(allDays[0]).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 sm:h-24 rounded-lg bg-muted/10 opacity-30" />
            ))}

            {/* Days of Month */}
            {allDays.map((date) => {
              const d = parseISO(date);
              const dayMeals = dailyTotals.get(date) ?? 0;
              const isToday = date === todayString();

              return (
                <div
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'h-20 sm:h-24 p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group',
                    isToday
                      ? 'border-primary ring-1 ring-primary bg-primary/5'
                      : dayMeals > 0
                        ? 'border-border/80 bg-card hover:border-primary/50 hover:shadow-xs'
                        : 'border-border/40 bg-muted/10 opacity-70 hover:opacity-100',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'size-6 rounded-full flex items-center justify-center text-xs font-mono font-bold',
                        isToday
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground group-hover:text-primary',
                      )}
                    >
                      {format(d, 'd')}
                    </span>
                    {dayMeals > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 h-4 font-mono font-medium border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                      >
                        Active
                      </Badge>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-bold font-mono text-foreground">
                      {dayMeals > 0 ? `${dayMeals.toFixed(1)}` : '0'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">meals</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* VIEW 3: Member Summaries */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {memberMonthlyStats.map(({ member, breakfast, lunch, dinner, totalMeals, mealCostPaisa }) => {
            const sharePct = totalMonthMeals > 0 ? ((totalMeals / totalMonthMeals) * 100).toFixed(1) : '0';
            return (
              <Card key={member.id} className="border-border/60 bg-card p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-11 ring-1 ring-border">
                      <AvatarFallback
                        className="text-sm font-bold text-white shadow-xs"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {member.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                    {sharePct}% of Mess
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/20 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Breakfast</p>
                    <p className="text-sm font-bold font-mono text-foreground mt-0.5">{breakfast.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Lunch</p>
                    <p className="text-sm font-bold font-mono text-foreground mt-0.5">{lunch.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Dinner</p>
                    <p className="text-sm font-bold font-mono text-foreground mt-0.5">{dinner.toFixed(1)}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-muted-foreground">Total Units Consumed</p>
                    <p className="font-mono font-bold text-base text-foreground mt-0.5">
                      {totalMeals.toFixed(1)} meals
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Estimated Meal Cost</p>
                    <p className="font-mono font-bold text-base text-cyan-500 dark:text-cyan-400 mt-0.5">
                      {formatCurrency(mealCostPaisa)}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Daily Meal Editor Dialog */}
      {selectedDate && (
        <MealDayEditor
          initialDate={selectedDate}
          members={members}
          records={records}
          onClose={() => setSelectedDate(null)}
          onSaveDay={(newRecords) => {
            bulkUpsertRecords(newRecords);
            setSelectedDate(null);
          }}
          onDeleteDay={(date) => {
            deleteDayRecords(date);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
}
