'use client';

// ============================================================
// MessHisab — Expenses Page
// KPI cards, category filter, sort, full CRUD with allocation info
// ============================================================

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Receipt,
  Pencil,
  Trash2,
  Users,
  UtensilsCrossed,
  Sliders,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from 'lucide-react';
import { useExpensesStore } from '@/stores/expenses.store';
import { useMembersStore } from '@/stores/members.store';
import { useAppStore } from '@/stores/app.store';
import { dateInMonth, formatDate, formatMonthYear } from '@/lib/date-utils';
import {
  ALLOCATION_METHODS,
  CURRENCY_SYMBOL,
  EXPENSE_CATEGORIES,
  PAYMENT_SOURCES,
} from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { MonthSelector } from '@/components/shared/MonthSelector';
import { ExpenseDialog } from '@/components/expenses/ExpenseDialog';
import type { Expense } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Category meta ────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  rent: '🏠',
  electricity: '⚡',
  gas: '🔥',
  wifi: '📶',
  water: '💧',
  cleaning: '🧹',
  other: '📦',
};

const CATEGORY_COLORS: Record<string, string> = {
  rent: 'border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/5',
  electricity:
    'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5',
  gas: 'border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/5',
  wifi: 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/5',
  water: 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5',
  cleaning:
    'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5',
  other: 'border-slate-500/30 text-slate-600 dark:text-slate-400 bg-slate-500/5',
};

const ALLOCATION_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  equal: Users,
  meal_based: UtensilsCrossed,
  custom: Sliders,
};

type SortField = 'date' | 'amount' | 'category';
type SortDir = 'asc' | 'desc';

// Module-level sort indicator — not a React component (no state/hooks)
function renderSortIcon(
  field: SortField,
  activeSortField: SortField,
  activeSortDir: SortDir,
  className?: string,
) {
  if (activeSortField !== field)
    return <ArrowUpDown className={cn('size-3 opacity-40', className)} />;
  return activeSortDir === 'asc' ? (
    <ArrowUp className={cn('size-3 text-primary', className)} />
  ) : (
    <ArrowDown className={cn('size-3 text-primary', className)} />
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function ExpensesPage() {
  const { selectedMonth } = useAppStore();
  const { expenses, deleteExpense } = useExpensesStore();
  const { members } = useMembersStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [allocFilter, setAllocFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeMembers = useMemo(
    () => members.filter((m) => m.status === 'active'),
    [members],
  );

  const monthExpenses = useMemo(
    () => expenses.filter((e) => dateInMonth(e.date, selectedMonth)),
    [expenses, selectedMonth],
  );

  // KPI calculations
  const totalPaisa = monthExpenses.reduce((s, e) => s + e.amountPaisa, 0);
  const cashboxTotal = monthExpenses
    .filter((e) => e.paymentSource === 'cashbox')
    .reduce((s, e) => s + e.amountPaisa, 0);
  const personalTotal = monthExpenses
    .filter((e) => e.paymentSource === 'personal')
    .reduce((s, e) => s + e.amountPaisa, 0);

  // Category breakdown
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of monthExpenses) {
      map[e.category] = (map[e.category] ?? 0) + e.amountPaisa;
    }
    return map;
  }, [monthExpenses]);

  const topCategory = Object.entries(categoryTotals).sort(
    ([, a], [, b]) => b - a,
  )[0];

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = monthExpenses.filter((e) => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter)
        return false;
      if (sourceFilter !== 'all' && e.paymentSource !== sourceFilter)
        return false;
      if (allocFilter !== 'all' && e.allocationMethod !== allocFilter)
        return false;
      const payer =
        members.find((m) => m.id === e.paidByMemberId)?.name ?? '';
      const text =
        `${e.description} ${e.category} ${payer} ${e.allocationMethod}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'amount') cmp = a.amountPaisa - b.amountPaisa;
      else if (sortField === 'category')
        cmp = a.category.localeCompare(b.category);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [
    monthExpenses,
    categoryFilter,
    sourceFilter,
    allocFilter,
    search,
    members,
    sortField,
    sortDir,
  ]);

  const filteredTotal = filtered.reduce((s, e) => s + e.amountPaisa, 0);

  const handleDelete = () => {
    if (!deleteId) return;
    deleteExpense(deleteId);
    toast.success('Expense deleted');
    setDeleteId(null);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('desc');
    }
  };


  const getPayerLabel = (expense: Expense) => {
    if (expense.paymentSource === 'cashbox') return 'Cashbox';
    const m = members.find((m) => m.id === expense.paidByMemberId);
    return m ? m.name : 'Personal';
  };

  const openAdd = () => {
    setEditExpense(null);
    setDialogOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditExpense(expense);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Shared Expenses
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatMonthYear(selectedMonth.year, selectedMonth.month)} ·
            Rent, utilities & shared bills
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="sm:hidden">
            <MonthSelector />
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="size-4" /> Add Expense
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold font-mono tabular-nums text-foreground">
              {CURRENCY_SYMBOL}
              {(totalPaisa / 100).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {monthExpenses.length} records
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              From Cashbox
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold font-mono tabular-nums text-foreground">
              {CURRENCY_SYMBOL}
              {(cashboxTotal / 100).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalPaisa > 0
                ? `${((cashboxTotal / totalPaisa) * 100).toFixed(0)}% of total`
                : '—'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Personal Advances
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold font-mono tabular-nums text-cyan-600 dark:text-cyan-400">
              {CURRENCY_SYMBOL}
              {(personalTotal / 100).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Member-paid, credited back
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Top Category
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {topCategory ? (
              <>
                <p className="text-xl font-bold text-foreground flex items-center gap-1.5">
                  <span>{CATEGORY_ICONS[topCategory[0]] ?? '📦'}</span>
                  <span>
                    {
                      EXPENSE_CATEGORIES[
                        topCategory[0] as keyof typeof EXPENSE_CATEGORIES
                      ]
                    }
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {CURRENCY_SYMBOL}
                  {(topCategory[1] / 100).toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-xl font-bold text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown pills */}
      {monthExpenses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, paisa]) => (
              <button
                key={cat}
                onClick={() =>
                  setCategoryFilter((prev) => (prev === cat ? 'all' : cat))
                }
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all',
                  CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other,
                  categoryFilter === cat
                    ? 'ring-2 ring-offset-1 ring-current scale-105'
                    : 'opacity-80 hover:opacity-100',
                )}
              >
                <span>{CATEGORY_ICONS[cat] ?? '📦'}</span>
                <span>
                  {
                    EXPENSE_CATEGORIES[
                      cat as keyof typeof EXPENSE_CATEGORIES
                    ] ?? cat
                  }
                </span>
                <span className="font-mono opacity-75">
                  {CURRENCY_SYMBOL}
                  {(paisa / 100).toLocaleString()}
                </span>
              </button>
            ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="size-4 text-muted-foreground shrink-0" />

          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v ?? 'all')}
          >
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {CATEGORY_ICONS[key]} {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sourceFilter}
            onValueChange={(v) => setSourceFilter(v ?? 'all')}
          >
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {Object.entries(PAYMENT_SOURCES).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={allocFilter}
            onValueChange={(v) => setAllocFilter(v ?? 'all')}
          >
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Allocation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {Object.entries(ALLOCATION_METHODS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses found"
              description={
                monthExpenses.length === 0
                  ? 'Add rent, electricity, WiFi and other shared bills for this month.'
                  : 'No expenses match your current filters.'
              }
              action={
                monthExpenses.length === 0 ? (
                  <Button onClick={openAdd} className="gap-2">
                    <Plus className="size-4" /> Add Expense
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => toggleSort('date')}
                      >
                        Date {renderSortIcon('date', sortField, sortDir)}
                      </button>
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3 uppercase tracking-wider">
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => toggleSort('category')}
                      >
                        Category {renderSortIcon('category', sortField, sortDir)}
                      </button>
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-3 py-3 uppercase tracking-wider">
                      <button
                        className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                        onClick={() => toggleSort('amount')}
                      >
                        Amount {renderSortIcon('amount', sortField, sortDir)}
                      </button>
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3 uppercase tracking-wider hidden sm:table-cell">
                      Paid By
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3 uppercase tracking-wider hidden md:table-cell">
                      Allocation
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((expense) => {
                    const AllocIcon =
                      ALLOCATION_ICONS[expense.allocationMethod] ?? Users;
                    return (
                      <tr
                        key={expense.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-5 py-3 text-muted-foreground whitespace-nowrap text-xs">
                          {formatDate(expense.date)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs gap-1 py-0.5 capitalize',
                              CATEGORY_COLORS[expense.category] ??
                                CATEGORY_COLORS.other,
                            )}
                          >
                            <span>
                              {CATEGORY_ICONS[expense.category] ?? '📦'}
                            </span>
                            {EXPENSE_CATEGORIES[
                              expense.category as keyof typeof EXPENSE_CATEGORIES
                            ] ?? expense.category}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium text-foreground">
                            {expense.description}
                          </p>
                          {expense.note && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {expense.note}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums text-foreground whitespace-nowrap">
                          {CURRENCY_SYMBOL}
                          {(expense.amountPaisa / 100).toLocaleString(
                            'en-US',
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell whitespace-nowrap">
                          <span
                            className={cn(
                              'text-xs font-medium',
                              expense.paymentSource === 'personal'
                                ? 'text-cyan-600 dark:text-cyan-400'
                                : 'text-muted-foreground',
                            )}
                          >
                            {getPayerLabel(expense)}
                          </span>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell whitespace-nowrap">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <AllocIcon className="size-3" />
                            {ALLOCATION_METHODS[
                              expense.allocationMethod as keyof typeof ALLOCATION_METHODS
                            ] ?? expense.allocationMethod}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEdit(expense)}
                              aria-label="Edit"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(expense.id)}
                              aria-label="Delete"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-muted/20">
                    <td
                      colSpan={3}
                      className="px-5 py-3 text-sm font-semibold text-foreground"
                    >
                      {filtered.length < monthExpenses.length
                        ? `Showing ${filtered.length} of ${monthExpenses.length} expenses`
                        : `Total (${filtered.length} expenses)`}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold tabular-nums text-foreground">
                      {CURRENCY_SYMBOL}
                      {(filteredTotal / 100).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={editExpense}
        members={activeMembers}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete Expense"
        description="This shared expense will be permanently removed. Member settlements and reports will be recalculated."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
