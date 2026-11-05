'use client';

// ============================================================
// MessHisab — Member Detail Page (/members/[id])
// Comprehensive member profile, financial balances, meal history,
// deposits, personal bazar purchases, & status management
// ============================================================

import { Suspense, use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Shield,
  Phone,
  Mail,
  Calendar,
  Wallet,
  UtensilsCrossed,
  Edit2,
  Trash2,
  UserX,
  UserCheck,
  Receipt,
  Scale,
} from 'lucide-react';
import { useMembersStore } from '@/stores/members.store';
import { useDepositsStore } from '@/stores/deposits.store';
import { useBazarStore } from '@/stores/bazar.store';
import { useMealsStore } from '@/stores/meals.store';
import { useExpensesStore } from '@/stores/expenses.store';
import { useAppStore } from '@/stores/app.store';
import {
  calculateMonthlyStats,
  calculateMemberSettlement,
  getMemberMealSummary,
} from '@/lib/calculations';
import { formatDate, formatMonthYear } from '@/lib/date-utils';
import { CURRENCY_SYMBOL, MEMBER_STATUSES, PAYMENT_METHODS, PAYMENT_SOURCES } from '@/lib/constants';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { MemberFormDialog } from '@/components/members/MemberFormDialog';
import { MonthSelector } from '@/components/shared/MonthSelector';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

function MemberDetailContent({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { selectedMonth } = useAppStore();
  const { members, deactivateMember, activateMember, deleteMember } = useMembersStore();
  const { deposits } = useDepositsStore();
  const { entries: bazarEntries } = useBazarStore();
  const { records: mealRecords } = useMealsStore();
  const { expenses } = useExpensesStore();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const member = members.find((m) => m.id === id);

  // Financial calculations
  const activeMembers = useMemo(
    () => members.filter((m) => m.status === 'active'),
    [members],
  );

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

  const settlement = useMemo(() => {
    if (!member || member.status !== 'active') return null;
    const ms = mealSummaries.find((s) => s.memberId === member.id);
    if (!ms) return null;
    return calculateMemberSettlement(
      member,
      ms,
      stats.mealRatePaisa,
      expenses,
      deposits,
      bazarEntries,
      activeMembers,
      mealSummaries,
      selectedMonth,
    );
  }, [member, mealSummaries, stats, expenses, deposits, bazarEntries, activeMembers, selectedMonth]);

  const memberMealSummary = useMemo(() => {
    if (!member) return null;
    return getMemberMealSummary(mealRecords, member.id, selectedMonth);
  }, [member, mealRecords, selectedMonth]);

  // Member's specific deposits
  const memberDeposits = useMemo(() => {
    if (!member) return [];
    return deposits
      .filter((d) => d.memberId === member.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [member, deposits]);

  // Member's specific bazar purchases
  const memberBazar = useMemo(() => {
    if (!member) return [];
    return bazarEntries
      .filter((b) => b.paidByMemberId === member.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [member, bazarEntries]);

  if (!member) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link
            href="/members"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5 text-xs text-muted-foreground')}
          >
            <ChevronLeft className="size-4" /> Back to Members
          </Link>
        </div>
        <EmptyState
          icon={UserX}
          title="Member not found"
          description="The requested member profile could not be located in this mess workspace."
          action={
            <Link href="/members" className={buttonVariants()}>
              View All Members
            </Link>
          }
        />
      </div>
    );
  }

  const handleToggleStatus = () => {
    if (member.status === 'active') {
      deactivateMember(member.id);
      toast.success(`${member.name} has been deactivated`);
    } else {
      activateMember(member.id);
      toast.success(`${member.name} has been activated`);
    }
  };

  const handleDelete = () => {
    deleteMember(member.id);
    toast.success(`${member.name} has been removed from mess`);
    router.push('/members');
  };

  const isPayable = settlement && settlement.netBalancePaisa > 0;
  const isZero = settlement && settlement.netBalancePaisa === 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/members"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 w-fit gap-1.5 text-xs text-muted-foreground hover:text-foreground')}
        >
          <ChevronLeft className="size-4" /> Back to Members Directory
        </Link>
        <div className="flex items-center gap-2">
          <MonthSelector />
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 ring-4 ring-primary/20 shrink-0">
                <AvatarFallback
                  className="text-xl font-bold text-white"
                  style={{ background: member.avatarColor }}
                >
                  {member.avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                    {member.name}
                  </h1>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs capitalize font-medium',
                      member.status === 'active'
                        ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                        : member.status === 'inactive'
                        ? 'border-border text-muted-foreground bg-muted/40'
                        : 'border-destructive/30 text-destructive bg-destructive/10',
                    )}
                  >
                    {MEMBER_STATUSES[member.status]}
                  </Badge>
                  {member.role === 'admin' && (
                    <Badge variant="secondary" className="gap-1 text-xs text-primary font-semibold">
                      <Shield className="size-3" /> Mess Admin
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3.5" /> {member.email}
                  </span>
                  {member.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5" /> {member.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" /> Joined {formatDate(member.joinedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                className="gap-1.5 text-xs h-8"
              >
                <Edit2 className="size-3.5" /> Edit Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                className="gap-1.5 text-xs h-8"
              >
                {member.status === 'active' ? (
                  <>
                    <UserX className="size-3.5 text-amber-500" /> Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="size-3.5 text-emerald-500" /> Activate
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                className="gap-1.5 text-xs h-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3.5" /> Remove
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Cycle Stats */}
      {settlement && memberMealSummary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-border">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                <span>Meals ({formatMonthYear(selectedMonth.year, selectedMonth.month)})</span>
                <UtensilsCrossed className="size-3.5 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold font-mono text-foreground">
                {settlement.totalMeals.toFixed(1)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                B: {memberMealSummary.breakfastCount} · L: {memberMealSummary.lunchCount} · D: {memberMealSummary.dinnerCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                <span>Total Charge</span>
                <Receipt className="size-3.5 text-violet-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold font-mono text-foreground">
                {CURRENCY_SYMBOL}{(settlement.totalCostPaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Meal: ৳{(settlement.mealCostPaisa / 100).toFixed(0)} · Bills: ৳{(settlement.sharedExpensesPaisa / 100).toFixed(0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                <span>Total Paid</span>
                <Wallet className="size-3.5 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {CURRENCY_SYMBOL}{(settlement.totalCreditPaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Deposits: ৳{(settlement.depositsPaisa / 100).toFixed(0)} · Personal: ৳{(settlement.memberPaidExpensesPaisa / 100).toFixed(0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                <span>Net Balance</span>
                <Scale className="size-3.5 text-cyan-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p
                className={cn(
                  'text-2xl font-bold font-mono',
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
                  ? `Due ৳${(settlement.netBalancePaisa / 100).toFixed(2)}`
                  : `Refund ৳${(Math.abs(settlement.netBalancePaisa) / 100).toFixed(2)}`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Status: <span className="font-semibold capitalize">{settlement.status}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-border">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            This member is currently inactive. No active meal or billing calculations apply for this month.
          </CardContent>
        </Card>
      )}

      {/* Tabbed Activity History */}
      <Tabs defaultValue="deposits" className="w-full">
        <TabsList className="grid grid-cols-2 max-w-sm">
          <TabsTrigger value="deposits">
            Deposits ({memberDeposits.length})
          </TabsTrigger>
          <TabsTrigger value="bazar">
            Bazar Purchases ({memberBazar.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Deposits */}
        <TabsContent value="deposits" className="mt-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Deposits History</CardTitle>
              <CardDescription className="text-xs">
                All direct funds submitted by {member.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {memberDeposits.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No deposits recorded for this member.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs uppercase">
                        <th className="text-left px-5 py-2.5">Date</th>
                        <th className="text-left px-3 py-2.5">Payment Method</th>
                        <th className="text-left px-3 py-2.5">Note</th>
                        <th className="text-right px-5 py-2.5">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {memberDeposits.map((d) => (
                        <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(d.date)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <Badge variant="outline" className="capitalize text-xs">
                              {PAYMENT_METHODS[d.paymentMethod] ?? d.paymentMethod}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground max-w-xs truncate">
                            {d.note || '—'}
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            +{CURRENCY_SYMBOL}{(d.amountPaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Bazar Purchases */}
        <TabsContent value="bazar" className="mt-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Bazar Purchases Made</CardTitle>
              <CardDescription className="text-xs">
                Grocery purchases made by {member.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {memberBazar.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No bazar purchases recorded by this member.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs uppercase">
                        <th className="text-left px-5 py-2.5">Date</th>
                        <th className="text-left px-3 py-2.5">Items</th>
                        <th className="text-left px-3 py-2.5">Payment Source</th>
                        <th className="text-right px-5 py-2.5">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {memberBazar.map((b) => (
                        <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(b.date)}
                          </td>
                          <td className="px-3 py-3 text-sm font-medium text-foreground max-w-xs truncate">
                            {b.items}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs capitalize',
                                b.paymentSource === 'personal'
                                  ? 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400'
                                  : 'border-border text-muted-foreground',
                              )}
                            >
                              {PAYMENT_SOURCES[b.paymentSource]}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-foreground whitespace-nowrap">
                            {CURRENCY_SYMBOL}{(b.amountPaisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Member Dialog */}
      <MemberFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        member={member}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Remove ${member.name}?`}
        description={`Are you sure you want to remove ${member.name} from the mess? All their historical meal and deposit logs will remain preserved in audit records.`}
        confirmLabel="Remove Member"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function MemberDetailPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <MemberDetailContent {...props} />
    </Suspense>
  );
}
