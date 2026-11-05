'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Wallet,
  Trash2,
  Pencil,
  FilterX,
  CreditCard,
  Users,
  Calendar,
} from 'lucide-react';
import { useDepositsStore } from '@/stores/deposits.store';
import { useMembersStore } from '@/stores/members.store';
import { useAppStore } from '@/stores/app.store';
import { dateInMonth, formatDate, formatMonthYear } from '@/lib/date-utils';
import { PAYMENT_METHODS } from '@/lib/constants';
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
import { DepositDialog } from '@/components/deposits/DepositDialog';
import { MonthSelector } from '@/components/shared/MonthSelector';
import type { Deposit, PaymentMethod } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const METHOD_BADGES: Record<PaymentMethod, string> = {
  bkash: 'border-pink-500/30 text-pink-600 dark:text-pink-400 bg-pink-500/10',
  nagad: 'border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10',
  rocket: 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10',
  cash: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  bank_transfer: 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10',
};

export default function DepositsPage() {
  const { selectedMonth } = useAppStore();
  const { deposits, deleteDeposit } = useDepositsStore();
  const { members } = useMembersStore();

  const [search, setSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDeposit, setEditDeposit] = useState<Deposit | null>(null);
  const [deleteConfirmDeposit, setDeleteConfirmDeposit] = useState<Deposit | null>(null);

  const activeMembers = members.filter((m) => m.status === 'active');

  // Month-filtered deposits
  const monthDeposits = useMemo(() => {
    return deposits.filter((d) => dateInMonth(d.date, selectedMonth));
  }, [deposits, selectedMonth]);

  // Filtered deposits
  const filtered = useMemo(() => {
    return monthDeposits.filter((d) => {
      const member = members.find((m) => m.id === d.memberId);
      const matchesSearch =
        (member?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        d.paymentMethod.toLowerCase().includes(search.toLowerCase()) ||
        (d.note ?? '').toLowerCase().includes(search.toLowerCase());

      const matchesMember = memberFilter === 'all' || d.memberId === memberFilter;
      const matchesMethod = methodFilter === 'all' || d.paymentMethod === methodFilter;

      const matchesFrom = !dateFrom || d.date >= dateFrom;
      const matchesTo = !dateTo || d.date <= dateTo;

      return matchesSearch && matchesMember && matchesMethod && matchesFrom && matchesTo;
    });
  }, [monthDeposits, members, search, memberFilter, methodFilter, dateFrom, dateTo]);

  // Aggregate stats
  const totalPaisa = filtered.reduce((acc, d) => acc + d.amountPaisa, 0);
  const contributingCount = new Set(filtered.map((d) => d.memberId)).size;

  // Member-wise monthly deposit breakdown
  const memberDepositSummary = useMemo(() => {
    return activeMembers.map((m) => {
      const memberDeps = monthDeposits.filter((d) => d.memberId === m.id);
      const totalPaisa = memberDeps.reduce((acc, d) => acc + d.amountPaisa, 0);
      return { member: m, totalPaisa, count: memberDeps.length };
    });
  }, [activeMembers, monthDeposits]);

  const getMember = (id: string) => members.find((m) => m.id === id);

  const handleDelete = () => {
    if (!deleteConfirmDeposit) return;
    deleteDeposit(deleteConfirmDeposit.id);
    toast.success('Deposit record deleted');
    setDeleteConfirmDeposit(null);
  };

  const hasActiveFilters =
    search !== '' || memberFilter !== 'all' || methodFilter !== 'all' || dateFrom !== '' || dateTo !== '';

  const clearFilters = () => {
    setSearch('');
    setMemberFilter('all');
    setMethodFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Member Deposits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track member advance contributions and fund credits for{' '}
            <span className="font-semibold text-foreground">
              {formatMonthYear(selectedMonth.year, selectedMonth.month)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <MonthSelector />
          <Button
            onClick={() => {
              setEditDeposit(null);
              setDialogOpen(true);
            }}
            className="gap-2 shadow-xs"
          >
            <Plus className="size-4" /> Add Deposit
          </Button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Month Deposits
            </p>
            <Wallet className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-500 mt-1.5">
            {formatCurrency(totalPaisa)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {filtered.length} deposit transactions
          </p>
        </Card>

        <Card className="border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Contributing Diners
            </p>
            <Users className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground mt-1.5">
            {contributingCount} / {activeMembers.length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Active members contributed
          </p>
        </Card>

        <Card className="border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Average Deposit
            </p>
            <CreditCard className="size-4 text-violet-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground mt-1.5">
            {filtered.length > 0 ? formatCurrency(Math.round(totalPaisa / filtered.length)) : '৳0.00'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Per transaction
          </p>
        </Card>

        <Card className="border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              All-Time Deposits
            </p>
            <Calendar className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground mt-1.5">
            {formatCurrency(deposits.reduce((acc, d) => acc + d.amountPaisa, 0))}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Total historical pool
          </p>
        </Card>
      </div>

      {/* Member-wise Deposit Progress Cards */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Member Contribution Status ({formatMonthYear(selectedMonth.year, selectedMonth.month)})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
          {memberDepositSummary.map(({ member, totalPaisa, count }) => (
            <Card
              key={member.id}
              onClick={() => setMemberFilter(member.id)}
              className={cn(
                'border-border/60 bg-card p-3 cursor-pointer hover:border-primary/50 transition-all group',
                memberFilter === member.id && 'ring-1 ring-primary border-primary bg-primary/5',
              )}
            >
              <div className="flex items-center gap-2">
                <Avatar className="size-6 shrink-0">
                  <AvatarFallback
                    className="text-[10px] font-bold text-white"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.avatarInitials}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {member.name.split(' ')[0]}
                </p>
              </div>
              <p className="text-sm font-bold font-mono text-emerald-500 mt-2">
                {formatCurrency(totalPaisa)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {count > 0 ? `${count} deposit${count > 1 ? 's' : ''}` : 'No deposit'}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search member, method, or note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Filters */}
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

          {/* Payment Method Filter */}
          <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v ?? 'all')}>
            <SelectTrigger className="h-9 w-36 text-xs">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range */}
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

          {/* Clear Button */}
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
              icon={Wallet}
              title="No deposits found"
              description={
                hasActiveFilters
                  ? 'No deposit transactions match your search or date criteria.'
                  : `No member deposits recorded for ${formatMonthYear(selectedMonth.year, selectedMonth.month)}.`
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Reset Filters
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setEditDeposit(null);
                      setDialogOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Plus className="size-4" /> Record First Deposit
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
                      Member
                    </th>
                    <th className="text-right text-[11px] font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider hidden sm:table-cell">
                      Payment Method
                    </th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider hidden md:table-cell">
                      Note / Reference
                    </th>
                    <th className="text-right text-[11px] font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((d) => {
                    const member = getMember(d.memberId);
                    return (
                      <tr key={d.id} className="hover:bg-muted/30 transition-colors group">
                        {/* Date */}
                        <td className="px-5 py-3 text-muted-foreground whitespace-nowrap text-xs font-mono">
                          {formatDate(d.date)}
                        </td>

                        {/* Member */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {member ? (
                            <div className="flex items-center gap-2.5">
                              <Avatar className="size-6 shrink-0 ring-1 ring-border/60">
                                <AvatarFallback
                                  className="text-[10px] font-bold text-white"
                                  style={{ backgroundColor: member.avatarColor }}
                                >
                                  {member.avatarInitials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-foreground text-xs">{member.name}</p>
                                <p className="text-[10px] text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-emerald-500 whitespace-nowrap text-sm">
                          +{formatCurrency(d.amountPaisa)}
                        </td>

                        {/* Method */}
                        <td className="px-4 py-3 hidden sm:table-cell whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] font-medium capitalize', METHOD_BADGES[d.paymentMethod])}
                          >
                            {PAYMENT_METHODS[d.paymentMethod] || d.paymentMethod}
                          </Badge>
                        </td>

                        {/* Note */}
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell max-w-xs truncate">
                          {d.note || '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditDeposit(d);
                                setDialogOpen(true);
                              }}
                              aria-label="Edit deposit"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteConfirmDeposit(d)}
                              aria-label="Delete deposit"
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
      <DepositDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        members={members}
        deposit={editDeposit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteConfirmDeposit}
        onOpenChange={(v) => !v && setDeleteConfirmDeposit(null)}
        title="Delete Deposit Record"
        description={`Are you sure you want to delete the deposit of ${deleteConfirmDeposit ? formatCurrency(deleteConfirmDeposit.amountPaisa) : ''} for ${getMember(deleteConfirmDeposit?.memberId ?? '')?.name}? This will reduce the member's credit balance.`}
        confirmLabel="Delete Deposit"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
