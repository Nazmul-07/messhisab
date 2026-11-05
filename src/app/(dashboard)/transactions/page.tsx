'use client';

// ============================================================
// MessHisab — Transactions Page
// Combined ledger: Bazar + Deposits + Expenses
// Features: search, type/member/source filter, date range, sort, pagination
// No double-counting: each record appears exactly once as its source type
// ============================================================

import { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingBasket,
  Receipt,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { useBazarStore } from '@/stores/bazar.store';
import { useDepositsStore } from '@/stores/deposits.store';
import { useExpensesStore } from '@/stores/expenses.store';
import { useMembersStore } from '@/stores/members.store';
import { useAppStore } from '@/stores/app.store';
import { dateInMonth, formatDate, formatMonthYear } from '@/lib/date-utils';
import { CURRENCY_SYMBOL, EXPENSE_CATEGORIES, PAYMENT_SOURCES } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { MonthSelector } from '@/components/shared/MonthSelector';
import type { Transaction, TransactionType } from '@/lib/types';
import { cn } from '@/lib/utils';

// ─── Extended transaction (enriched from source records) ───────
interface RichTransaction extends Transaction {
  categoryLabel?: string;
  sortKey: string; // date:createdAt for stable sort
}

// ─── Type config ──────────────────────────────────────────────
interface TypeConfig {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  badgeClass: string;
  kpiClass: string;
  sign: 1 | -1; // +1 = inflow, -1 = outflow
}

const TYPE_CONFIG: Record<TransactionType, TypeConfig> = {
  bazar: {
    label: 'Bazar',
    Icon: ShoppingBasket,
    badgeClass:
      'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/5',
    kpiClass: 'text-cyan-600 dark:text-cyan-400',
    sign: -1,
  },
  deposit: {
    label: 'Deposit',
    Icon: ArrowDownLeft,
    badgeClass:
      'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5',
    kpiClass: 'text-emerald-600 dark:text-emerald-400',
    sign: 1,
  },
  expense: {
    label: 'Expense',
    Icon: Receipt,
    badgeClass:
      'border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/5',
    kpiClass: 'text-violet-600 dark:text-violet-400',
    sign: -1,
  },
  settlement: {
    label: 'Settlement',
    Icon: ArrowUpRight,
    badgeClass:
      'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5',
    kpiClass: 'text-amber-600 dark:text-amber-400',
    sign: 1,
  },
};

type SortField = 'date' | 'amount' | 'type';
type SortDir = 'asc' | 'desc';
const PAGE_SIZE = 20;

// Module-level sort indicator — not a React component (no state/hooks)
function renderSortIcon(
  field: SortField,
  activeSortField: SortField,
  activeSortDir: SortDir,
) {
  if (activeSortField !== field)
    return <ArrowUpDown className="size-3 opacity-40" />;
  return activeSortDir === 'asc' ? (
    <ArrowUp className="size-3 text-primary" />
  ) : (
    <ArrowDown className="size-3 text-primary" />
  );
}

// ─── Page Component ───────────────────────────────────────────
export default function TransactionsPage() {
  const { selectedMonth } = useAppStore();
  const { entries: bazarEntries } = useBazarStore();
  const { deposits } = useDepositsStore();
  const { expenses } = useExpensesStore();
  const { members } = useMembersStore();

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sort
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Pagination
  const [page, setPage] = useState(1);

  // ─── Build combined transaction list ──────────────────────
  const allTransactions = useMemo<RichTransaction[]>(() => {
    const list: RichTransaction[] = [];

    // 1. Bazar purchases (outflow)
    for (const b of bazarEntries) {
      if (dateInMonth(b.date, selectedMonth)) {
        list.push({
          id: b.id,
          messId: b.messId,
          type: 'bazar',
          description: b.items,
          amountPaisa: b.amountPaisa,
          date: b.date,
          memberId: b.paidByMemberId,
          paymentSource: b.paymentSource,
          referenceId: b.id,
          categoryLabel: 'Grocery',
          sortKey: `${b.date}:${b.createdAt}`,
        });
      }
    }

    // 2. Deposits (inflow)
    for (const d of deposits) {
      if (dateInMonth(d.date, selectedMonth)) {
        list.push({
          id: d.id,
          messId: d.messId,
          type: 'deposit',
          description: `Deposit via ${
            d.paymentMethod === 'bank_transfer'
              ? 'Bank Transfer'
              : d.paymentMethod.charAt(0).toUpperCase() +
                d.paymentMethod.slice(1)
          }${d.note ? ` — ${d.note}` : ''}`,
          amountPaisa: d.amountPaisa,
          date: d.date,
          memberId: d.memberId,
          referenceId: d.id,
          categoryLabel: 'Member Deposit',
          sortKey: `${d.date}:${d.createdAt}`,
        });
      }
    }

    // 3. Shared expenses (outflow)
    for (const e of expenses) {
      if (dateInMonth(e.date, selectedMonth)) {
        list.push({
          id: e.id,
          messId: e.messId,
          type: 'expense',
          description: e.description,
          amountPaisa: e.amountPaisa,
          date: e.date,
          memberId: e.paidByMemberId,
          paymentSource: e.paymentSource,
          referenceId: e.id,
          categoryLabel:
            EXPENSE_CATEGORIES[
              e.category as keyof typeof EXPENSE_CATEGORIES
            ] ?? e.category,
          sortKey: `${e.date}:${e.createdAt}`,
        });
      }
    }

    return list;
  }, [bazarEntries, deposits, expenses, selectedMonth]);

  // ─── KPIs ─────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalDeposits = allTransactions
      .filter((t) => t.type === 'deposit')
      .reduce((s, t) => s + t.amountPaisa, 0);
    const totalBazar = allTransactions
      .filter((t) => t.type === 'bazar')
      .reduce((s, t) => s + t.amountPaisa, 0);
    const totalExpenses = allTransactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amountPaisa, 0);
    const totalOutflow = totalBazar + totalExpenses;
    return { totalDeposits, totalBazar, totalExpenses, totalOutflow };
  }, [allTransactions]);

  // ─── Filter + Sort + Paginate ──────────────────────────────
  const filtered = useMemo(() => {
    let list = allTransactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (memberFilter !== 'all' && tx.memberId !== memberFilter) return false;
      if (
        sourceFilter !== 'all' &&
        tx.type !== 'deposit' &&
        tx.paymentSource !== sourceFilter
      )
        return false;
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo && tx.date > dateTo) return false;
      const memberName =
        members.find((m) => m.id === tx.memberId)?.name ?? '';
      const text =
        `${tx.description} ${tx.type} ${memberName} ${tx.categoryLabel ?? ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.sortKey.localeCompare(b.sortKey);
      else if (sortField === 'amount') cmp = a.amountPaisa - b.amountPaisa;
      else if (sortField === 'type') cmp = a.type.localeCompare(b.type);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [
    allTransactions,
    typeFilter,
    memberFilter,
    sourceFilter,
    dateFrom,
    dateTo,
    search,
    members,
    sortField,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const filteredTotal = filtered.reduce(
    (s, t) => s + (TYPE_CONFIG[t.type].sign * t.amountPaisa),
    0,
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const handleFilterChange = <T,>(setter: (v: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };


  const getMemberName = (id?: string) => {
    if (!id) return 'Cashbox';
    return members.find((m) => m.id === id)?.name ?? 'Unknown';
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setMemberFilter('all');
    setSourceFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasFilters =
    search ||
    typeFilter !== 'all' ||
    memberFilter !== 'all' ||
    sourceFilter !== 'all' ||
    dateFrom ||
    dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Transactions
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatMonthYear(selectedMonth.year, selectedMonth.month)} ·
            Complete ledger of all monetary activities
          </p>
        </div>
        <div className="sm:hidden">
          <MonthSelector />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Activity className="size-3.5" /> Total Records
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-foreground">
              {allTransactions.length}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              All transaction types
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="size-3.5" /> Total Inflow
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {CURRENCY_SYMBOL}
              {(kpis.totalDeposits / 100).toLocaleString('en-US', {
                minimumFractionDigits: 0,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Member deposits
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <TrendingDown className="size-3.5" /> Total Outflow
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
              {CURRENCY_SYMBOL}
              {(kpis.totalOutflow / 100).toLocaleString('en-US', {
                minimumFractionDigits: 0,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bazar + expenses
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Wallet className="size-3.5" /> Net Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p
              className={cn(
                'text-xl font-bold font-mono tabular-nums',
                kpis.totalDeposits >= kpis.totalOutflow
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {kpis.totalDeposits >= kpis.totalOutflow ? '+' : ''}
              {CURRENCY_SYMBOL}
              {(
                (kpis.totalDeposits - kpis.totalOutflow) /
                100
              ).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inflow minus outflow
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Type summary pills */}
      <div className="flex flex-wrap gap-2">
        {(['bazar', 'deposit', 'expense'] as TransactionType[]).map((type) => {
          const cfg = TYPE_CONFIG[type];
          const count = allTransactions.filter((t) => t.type === type).length;
          const total = allTransactions
            .filter((t) => t.type === type)
            .reduce((s, t) => s + t.amountPaisa, 0);
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() =>
                handleFilterChange(
                  setTypeFilter,
                  typeFilter === type ? 'all' : type,
                )
              }
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                cfg.badgeClass,
                typeFilter === type
                  ? 'ring-2 ring-offset-1 ring-current scale-105'
                  : 'opacity-80 hover:opacity-100',
              )}
            >
              <cfg.Icon className="size-3" />
              <span>{cfg.label}</span>
              <span className="font-mono opacity-75">
                {CURRENCY_SYMBOL}
                {(total / 100).toLocaleString()}
              </span>
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="size-4 text-muted-foreground shrink-0" />

            <Select
              value={typeFilter}
              onValueChange={(v) =>
                handleFilterChange(setTypeFilter, v ?? 'all')
              }
            >
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bazar">Bazar Purchases</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="expense">Shared Expenses</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={memberFilter}
              onValueChange={(v) =>
                handleFilterChange(setMemberFilter, v ?? 'all')
              }
            >
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="All Members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sourceFilter}
              onValueChange={(v) =>
                handleFilterChange(setSourceFilter, v ?? 'all')
              }
            >
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="All Sources" />
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

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground h-9 px-2"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Date range row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Date range:</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="h-8 w-36 text-xs"
            placeholder="From"
          />
          <span className="text-muted-foreground text-xs">→</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="h-8 w-36 text-xs"
            placeholder="To"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No transactions found"
              description={
                allTransactions.length === 0
                  ? 'No monetary activity recorded for this month yet.'
                  : 'No transactions match your current filters.'
              }
              action={
                hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
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
                          onClick={() => toggleSort('type')}
                        >
                          Type {renderSortIcon('type', sortField, sortDir)}
                        </button>
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3 uppercase tracking-wider hidden sm:table-cell">
                        Member
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3 uppercase tracking-wider hidden md:table-cell">
                        Source
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">
                        <button
                          className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                          onClick={() => toggleSort('amount')}
                        >
                          Amount {renderSortIcon('amount', sortField, sortDir)}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pageItems.map((tx) => {
                      const cfg = TYPE_CONFIG[tx.type];
                      const isInflow = cfg.sign === 1;

                      return (
                        <tr
                          key={`${tx.type}-${tx.id}`}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-5 py-3 text-muted-foreground whitespace-nowrap text-xs">
                            {formatDate(tx.date)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs gap-1 py-0.5',
                                cfg.badgeClass,
                              )}
                            >
                              <cfg.Icon className="size-3" />
                              {cfg.label}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 max-w-xs">
                            <p className="font-medium text-foreground truncate">
                              {tx.description}
                            </p>
                            {tx.categoryLabel && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {tx.categoryLabel}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-3 hidden sm:table-cell whitespace-nowrap">
                            <span className="text-sm text-muted-foreground">
                              {getMemberName(tx.memberId)}
                            </span>
                          </td>
                          <td className="px-3 py-3 hidden md:table-cell whitespace-nowrap">
                            {tx.paymentSource ? (
                              <span className="text-xs text-muted-foreground capitalize">
                                {PAYMENT_SOURCES[
                                  tx.paymentSource as keyof typeof PAYMENT_SOURCES
                                ] ?? tx.paymentSource}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/50">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                            <span
                              className={
                                isInflow
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-foreground'
                              }
                            >
                              {isInflow ? '+' : ''}
                              {CURRENCY_SYMBOL}
                              {(tx.amountPaisa / 100).toLocaleString(
                                'en-US',
                                { minimumFractionDigits: 2 },
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-muted/20">
                      <td
                        colSpan={3}
                        className="px-5 py-3 text-xs font-semibold text-muted-foreground"
                      >
                        {filtered.length < allTransactions.length ? (
                          <>
                            {filtered.length} of {allTransactions.length}{' '}
                            transactions
                          </>
                        ) : (
                          <>{filtered.length} transactions</>
                        )}
                      </td>
                      <td
                        colSpan={2}
                        className="hidden md:table-cell"
                      />
                      <td className="px-5 py-3 text-right font-mono font-bold tabular-nums">
                        <span
                          className={
                            filteredTotal >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {filteredTotal >= 0 ? '+' : ''}
                          {CURRENCY_SYMBOL}
                          {(Math.abs(filteredTotal) / 100).toLocaleString(
                            'en-US',
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-5 py-3">
                  <p className="text-xs text-muted-foreground">
                    Page {safePage} of {totalPages} ·{' '}
                    {(safePage - 1) * PAGE_SIZE + 1}–
                    {Math.min(safePage * PAGE_SIZE, filtered.length)} of{' '}
                    {filtered.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>

                    {/* Page number pills */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let p: number;
                      if (totalPages <= 5) {
                        p = i + 1;
                      } else if (safePage <= 3) {
                        p = i + 1;
                      } else if (safePage >= totalPages - 2) {
                        p = totalPages - 4 + i;
                      } else {
                        p = safePage - 2 + i;
                      }
                      return (
                        <Button
                          key={p}
                          variant={p === safePage ? 'default' : 'outline'}
                          size="icon-sm"
                          onClick={() => setPage(p)}
                          className="min-w-[2rem] text-xs"
                        >
                          {p}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
