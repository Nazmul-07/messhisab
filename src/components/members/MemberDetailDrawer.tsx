'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { MemberFormDialog } from './MemberFormDialog';
import { useMembersStore } from '@/stores/members.store';
import { useDepositsStore } from '@/stores/deposits.store';
import { useBazarStore } from '@/stores/bazar.store';
import { formatDate, formatMonthYear } from '@/lib/date-utils';
import { MEMBER_STATUSES } from '@/lib/constants';
import { formatCurrency } from '@/lib/currency';
import type { Member, MemberSettlement, MemberMealSummary, SelectedMonth } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Shield,
  Phone,
  Calendar,
  UserX,
  UserCheck,
  Edit2,
  Trash2,
  Wallet,
  ShoppingBasket,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';

interface MemberDetailDrawerProps {
  member: Member | null;
  onClose: () => void;
  settlement: MemberSettlement | null;
  mealSummary: MemberMealSummary | null;
  selectedMonth: SelectedMonth;
}

export function MemberDetailDrawer({
  member,
  onClose,
  settlement,
  mealSummary,
  selectedMonth,
}: MemberDetailDrawerProps) {
  const { deactivateMember, activateMember, deleteMember } = useMembersStore();
  const { deposits } = useDepositsStore();
  const { entries: bazarEntries } = useBazarStore();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (!member) return null;

  // Member's specific deposits
  const memberDeposits = deposits
    .filter((d) => d.memberId === member.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Member's specific bazar purchases
  const memberBazar = bazarEntries
    .filter((b) => b.paidByMemberId === member.id)
    .sort((a, b) => b.date.localeCompare(a.date));

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
    setDeleteConfirmOpen(false);
    onClose();
  };

  const statRow = (label: string, value: string, valueClass?: string) => (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium text-foreground font-mono', valueClass)}>{value}</span>
    </div>
  );

  return (
    <>
      <Sheet open={!!member} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0 flex flex-col">
          <SheetHeader className="p-6 pb-2 border-b border-border/60">
            <SheetTitle className="sr-only">Member Details</SheetTitle>

            {/* Profile Header */}
            <div className="flex items-start gap-4">
              <Avatar className="size-14 ring-2 ring-border shrink-0">
                <AvatarFallback
                  className="text-lg font-bold text-white shadow-inner"
                  style={{ backgroundColor: member.avatarColor }}
                >
                  {member.avatarInitials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-lg font-bold text-foreground truncate">{member.name}</h2>
                  {member.role === 'admin' && (
                    <Badge variant="secondary" className="gap-1 text-[11px] font-medium text-primary">
                      <Shield className="size-3" /> Admin
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground truncate mt-0.5">{member.email}</p>

                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] capitalize font-medium',
                      member.status === 'active'
                        ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                        : member.status === 'suspended'
                          ? 'border-destructive/30 text-destructive bg-destructive/10'
                          : 'border-border text-muted-foreground bg-muted/40',
                    )}
                  >
                    {MEMBER_STATUSES[member.status]}
                  </Badge>

                  {member.phone && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="size-3" /> {member.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs h-8"
                onClick={() => setEditOpen(true)}
              >
                <Edit2 className="size-3.5" /> Edit Profile
              </Button>

              {member.role !== 'admin' && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'gap-1.5 text-xs h-8',
                    member.status === 'active'
                      ? 'text-amber-500 hover:text-amber-600'
                      : 'text-emerald-500 hover:text-emerald-600',
                  )}
                  onClick={handleToggleStatus}
                >
                  {member.status === 'active' ? (
                    <>
                      <UserX className="size-3.5" /> Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="size-3.5" /> Activate
                    </>
                  )}
                </Button>
              )}

              {member.role !== 'admin' && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:bg-destructive/10 h-8 w-8"
                  onClick={() => setDeleteConfirmOpen(true)}
                  aria-label="Delete member"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </SheetHeader>

          {/* Drawer Body with Tabs */}
          <div className="flex-1 p-6 space-y-5">
            <Tabs defaultValue="balance" className="w-full">
              <TabsList className="w-full grid grid-cols-3 h-9">
                <TabsTrigger value="balance" className="text-xs">
                  Balance
                </TabsTrigger>
                <TabsTrigger value="deposits" className="text-xs">
                  Deposits ({memberDeposits.length})
                </TabsTrigger>
                <TabsTrigger value="bazar" className="text-xs">
                  Bazar ({memberBazar.length})
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Financial Balance */}
              <TabsContent value="balance" className="pt-4 space-y-4">
                {/* Balance Hero Card */}
                {settlement ? (
                  <div
                    className={cn(
                      'p-4 rounded-xl border flex items-center justify-between',
                      settlement.netBalancePaisa > 0
                        ? 'bg-destructive/5 border-destructive/20 text-destructive'
                        : settlement.netBalancePaisa < 0
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                          : 'bg-muted/40 border-border text-muted-foreground',
                    )}
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider">
                        {settlement.netBalancePaisa > 0
                          ? 'Payable Balance'
                          : settlement.netBalancePaisa < 0
                            ? 'Receivable Credit'
                            : 'Settled'}
                      </p>
                      <p className="text-xs opacity-80 mt-0.5">
                        {formatMonthYear(selectedMonth.year, selectedMonth.month)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold font-mono">
                        {settlement.netBalancePaisa > 0 ? '' : settlement.netBalancePaisa < 0 ? '+' : ''}
                        {formatCurrency(Math.abs(settlement.netBalancePaisa))}
                      </p>
                      <span className="text-[10px] font-medium capitalize">
                        Status: {settlement.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-border bg-muted/20 text-center">
                    <p className="text-xs text-muted-foreground">
                      No active financial settlement for inactive members.
                    </p>
                  </div>
                )}

                {/* Monthly Breakdown */}
                {settlement && mealSummary && (
                  <div className="space-y-1 rounded-xl border border-border p-4 bg-card">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <UtensilsCrossed className="size-3.5 text-primary" /> Cost & Credit Breakdown
                    </h3>
                    <div className="divide-y divide-border/60">
                      {statRow('Total Meals', `${mealSummary.totalMeals.toFixed(1)} meals`)}
                      {statRow('Breakfast Count', `${mealSummary.breakfastCount.toFixed(1)}`)}
                      {statRow('Lunch Count', `${mealSummary.lunchCount.toFixed(1)}`)}
                      {statRow('Dinner Count', `${mealSummary.dinnerCount.toFixed(1)}`)}
                      {statRow('Meal Cost', formatCurrency(settlement.mealCostPaisa))}
                      {statRow('Allocated Utilities & Rent', formatCurrency(settlement.sharedExpensesPaisa))}
                      {statRow('Total Gross Cost', formatCurrency(settlement.totalCostPaisa), 'font-bold text-foreground')}
                      {statRow('Total Deposits Paid', `+${formatCurrency(settlement.depositsPaisa)}`, 'text-emerald-500 font-semibold')}
                      {statRow('Member-Paid Expenses', `+${formatCurrency(settlement.memberPaidExpensesPaisa)}`, 'text-emerald-500')}
                    </div>
                  </div>
                )}

                {/* Membership Metadata */}
                <div className="space-y-2 rounded-xl border border-border p-4 bg-muted/10 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="size-3.5" /> Joining Date
                    </span>
                    <span className="font-medium text-foreground">{formatDate(member.joinedAt)}</span>
                  </div>
                  {member.leftAt && (
                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <UserX className="size-3.5 text-destructive" /> Leaving Date
                      </span>
                      <span className="font-medium text-destructive">{formatDate(member.leftAt)}</span>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab 2: Deposits History */}
              <TabsContent value="deposits" className="pt-4 space-y-3">
                {memberDeposits.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl p-6">
                    <Wallet className="size-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                    No deposit records found for this member.
                  </div>
                ) : (
                  <div className="divide-y divide-border/60 border border-border rounded-xl bg-card overflow-hidden">
                    {memberDeposits.map((dep) => (
                      <div key={dep.id} className="p-3 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors">
                        <div>
                          <p className="font-medium text-foreground capitalize flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Via {dep.paymentMethod.replace('_', ' ')}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatDate(dep.date)} {dep.note && `· ${dep.note}`}
                          </p>
                        </div>
                        <span className="font-mono font-semibold text-emerald-500 text-sm">
                          +{formatCurrency(dep.amountPaisa)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: Bazar Purchases */}
              <TabsContent value="bazar" className="pt-4 space-y-3">
                {memberBazar.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl p-6">
                    <ShoppingBasket className="size-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                    No grocery purchases made by this member yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border/60 border border-border rounded-xl bg-card overflow-hidden">
                    {memberBazar.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors">
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="font-medium text-foreground truncate">{item.items}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatDate(item.date)} ·{' '}
                            <span className="capitalize">{item.paymentSource}</span>
                          </p>
                        </div>
                        <span className="font-mono font-semibold text-foreground text-sm shrink-0">
                          {formatCurrency(item.amountPaisa)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <MemberFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        member={member}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Remove Member from Mess"
        description={`Are you sure you want to remove ${member.name}? This will permanently delete their account from the mess database.`}
        confirmLabel="Remove Member"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
