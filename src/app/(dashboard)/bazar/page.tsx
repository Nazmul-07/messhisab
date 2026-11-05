'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ShoppingBasket,
  Trash2,
  Receipt,
  FilterX,
  CreditCard,
  Wallet,
  Calendar,
  Pencil,
} from 'lucide-react';
import { useBazarStore } from '@/stores/bazar.store';
import { useMembersStore } from '@/stores/members.store';
import { useAppStore } from '@/stores/app.store';
import { dateInMonth, formatDate, formatMonthYear } from '@/lib/date-utils';
import { PAYMENT_SOURCES } from '@/lib/constants';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
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
import { BazarDialog } from '@/components/bazar/BazarDialog';
import { ReceiptPreviewDialog } from '@/components/bazar/ReceiptPreviewDialog';
import type { BazarEntry } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function BazarPage() {
  const { selectedMonth } = useAppStore();
  const { entries, deleteEntry } = useBazarStore();
  const { members } = useMembersStore();

  const [search, setSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<BazarEntry | null>(null);
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<BazarEntry | null>(null);
  const [receiptEntry, setReceiptEntry] = useState<BazarEntry | null>(null);

  // Month-filtered base list
  const monthEntries = useMemo(() => {
    return entries.filter((e) => dateInMonth(e.date, selectedMonth));
  }, [entries, selectedMonth]);

  // Applied filters
  const filtered = useMemo(() => {
    return monthEntries.filter((e) => {
      const member = members.find((m) => m.id === e.paidByMemberId);
      const matchesSearch =
        e.items.toLowerCase().includes(search.toLowerCase()) ||
        (e.note && e.note.toLowerCase().includes(search.toLowerCase())) ||
        (member && member.name.toLowerCase().includes(search.toLowerCase()));

      const matchesMember = memberFilter === 'all' || e.paidByMemberId === memberFilter;
      const matchesSource = sourceFilter === 'all' || e.paymentSource === sourceFilter;

      const matchesFrom = !dateFrom || e.date >= dateFrom;
      const matchesTo = !dateTo || e.date <= dateTo;

      return matchesSearch && matchesMember && matchesSource && matchesFrom && matchesTo;
    });
  }, [monthEntries, members, search, memberFilter, sourceFilter, dateFrom, dateTo]);

  // Aggregate stats
  const totalPaisa = filtered.reduce((s, e) => s + e.amountPaisa, 0);
  const personalPaisa = filtered
    .filter((e) => e.paymentSource === 'personal')
    .reduce((s, e) => s + e.amountPaisa, 0);
  const cashboxPaisa = filtered
    .filter((e) => e.paymentSource === 'cashbox')
    .reduce((s, e) => s + e.amountPaisa, 0);

  const getMember = (id: string) => members.find((m) => m.id === id);

  const handleDelete = () => {
    if (!deleteConfirmEntry) return;
    deleteEntry(deleteConfirmEntry.id);
    toast.success('Bazar entry deleted successfully');
    setDeleteConfirmEntry(null);
  };

  const hasActiveFilters =
    search !== '' || memberFilter !== 'all' || sourceFilter !== 'all' || dateFrom !== '' || dateTo !== '';

  const clearFilters = () => {
    setSearch('');
    setMemberFilter('all');
    setSourceFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Grocery & Bazar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Log and review grocery purchases for{' '}
            <span className="font-semibold text-foreground">
              {formatMonthYear(selectedMonth.year, selectedMonth.month)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <MonthSelector />
          <Button
            onClick={() => {
              setEditEntry(null);
              setDialogOpen(true);
            }}
            className="gap-2 shadow-xs"
          >
            <Plus className="size-4" /> Add Purchase
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Bazar Cost
            </p>
            <ShoppingBasket className="size-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground mt-1.5">
            {formatCurrency(totalPaisa)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {filtered.length} purchases recorded
          </p>
        </Card>

        <Card className="border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Personal-Paid
            </p>
            <CreditCard className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-500 mt-1.5">
            {formatCurrency(personalPaisa)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Credited to members in settlement
          </p>
        </Card>

        <Card className="border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Cashbox-Paid
            </p>
            <Wallet className="size-4 text-violet-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-violet-500 mt-1.5">
            {formatCurrency(cashboxPaisa)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Directly from shared cashbox
          </p>
        </Card>

        <Card className="border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Avg per Purchase
            </p>
            <Calendar className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground mt-1.5">
            {filtered.length > 0 ? formatCurrency(Math.round(totalPaisa / filtered.length)) : '৳0.00'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Across {filtered.length} trips
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search items, notes, or purchaser..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Member Filter */}
          <Select value={memberFilter} onValueChange={(v) => setMemberFilter(v ?? 'all')}>
            <SelectTrigger className="h-9 w-36 text-xs">
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

          {/* Payment Source Filter */}
          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v ?? 'all')}>
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="cashbox">Cashbox</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 w-32 text-xs"
              title="From date"
            />
            <span>to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 w-32 text-xs"
              title="To date"
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
            >
              <FilterX className="size-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <Card className="border-border/60 bg-card overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={ShoppingBasket}
              title="No grocery purchases found"
              description={
                hasActiveFilters
                  ? 'No entries match your search or date criteria.'
                  : `No bazar purchases recorded for ${formatMonthYear(selectedMonth.year, selectedMonth.month)}.`
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Reset Filters
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setEditEntry(null);
                      setDialogOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Plus className="size-4" /> Record First Purchase
                  </Button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20">
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">
                      Grocery Items
                    </th>
                    <th className="text-right text-[11px] font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider hidden sm:table-cell">
                      Paid By
                    </th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-3 uppercase tracking-wider hidden md:table-cell">
                      Source
                    </th>
                    <th className="text-center text-[11px] font-semibold text-muted-foreground px-3 py-3 uppercase tracking-wider">
                      Receipt
                    </th>
                    <th className="text-right text-[11px] font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((entry) => {
                    const member = getMember(entry.paidByMemberId);
                    return (
                      <tr key={entry.id} className="hover:bg-muted/30 transition-colors group">
                        {/* Date */}
                        <td className="px-5 py-3 text-muted-foreground whitespace-nowrap text-xs font-mono">
                          {formatDate(entry.date)}
                        </td>

                        {/* Items */}
                        <td className="px-4 py-3 max-w-xs sm:max-w-md">
                          <p className="font-semibold text-foreground text-sm leading-snug">
                            {entry.items}
                          </p>
                          {entry.note && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {entry.note}
                            </p>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-foreground whitespace-nowrap text-sm">
                          {formatCurrency(entry.amountPaisa)}
                        </td>

                        {/* Paid By */}
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {member ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="size-6 shrink-0 ring-1 ring-border/60">
                                <AvatarFallback
                                  className="text-[10px] font-bold text-white"
                                  style={{ backgroundColor: member.avatarColor }}
                                >
                                  {member.avatarInitials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-xs text-foreground truncate">
                                {member.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Payment Source */}
                        <td className="px-3 py-3 hidden md:table-cell">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] font-medium capitalize',
                              entry.paymentSource === 'personal'
                                ? 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10'
                                : 'border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/10',
                            )}
                          >
                            {PAYMENT_SOURCES[entry.paymentSource]}
                          </Badge>
                        </td>

                        {/* Receipt Preview Button */}
                        <td className="px-3 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-cyan-500"
                            onClick={() => setReceiptEntry(entry)}
                          >
                            <Receipt className="size-3.5" />
                            <span className="hidden xl:inline">View</span>
                          </Button>
                        </td>

                        {/* Edit and Delete Actions */}
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditEntry(entry);
                                setDialogOpen(true);
                              }}
                              aria-label="Edit purchase"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteConfirmEntry(entry)}
                              aria-label="Delete purchase"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <BazarDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editEntry}
        members={members}
      />

      {/* Receipt Preview Dialog */}
      <ReceiptPreviewDialog
        open={!!receiptEntry}
        onOpenChange={(v) => !v && setReceiptEntry(null)}
        entry={receiptEntry}
        paidByMember={receiptEntry ? getMember(receiptEntry.paidByMemberId) : null}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteConfirmEntry}
        onOpenChange={(v) => !v && setDeleteConfirmEntry(null)}
        title="Delete Grocery Purchase"
        description={`Are you sure you want to delete the purchase "${deleteConfirmEntry?.items}" for ${deleteConfirmEntry ? formatCurrency(deleteConfirmEntry.amountPaisa) : ''}? This will adjust the mess meal rate and settlements accordingly.`}
        confirmLabel="Delete Purchase"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
