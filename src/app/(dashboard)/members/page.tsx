'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  UserX,
  Shield,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { useMembersStore } from '@/stores/members.store';
import { useDepositsStore } from '@/stores/deposits.store';
import { useBazarStore } from '@/stores/bazar.store';
import { useMealsStore } from '@/stores/meals.store';
import { useExpensesStore } from '@/stores/expenses.store';
import { useAppStore } from '@/stores/app.store';
import {
  calculateMemberSettlement,
  getMemberMealSummary,
  calculateMonthlyStats,
} from '@/lib/calculations';
import { formatDate, formatMonthYear } from '@/lib/date-utils';
import { CURRENCY_SYMBOL, MEMBER_STATUSES } from '@/lib/constants';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { MemberDetailDrawer } from '@/components/members/MemberDetailDrawer';
import { MemberFormDialog } from '@/components/members/MemberFormDialog';
import type { Member } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  suspended: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function MembersPage() {
  const router = useRouter();
  const { selectedMonth } = useAppStore();
  const { members, deleteMember, deactivateMember, activateMember } = useMembersStore();
  const { deposits } = useDepositsStore();
  const { entries: bazarEntries } = useBazarStore();
  const { records: mealRecords } = useMealsStore();
  const { expenses } = useExpensesStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<Member | null>(null);

  // Financial calculations for active members
  const activeMembers = members.filter((m) => m.status === 'active');
  const mealSummaries = activeMembers.map((m) =>
    getMemberMealSummary(mealRecords, m.id, selectedMonth),
  );
  const stats = calculateMonthlyStats(
    bazarEntries,
    expenses,
    deposits,
    mealRecords,
    activeMembers,
    selectedMonth,
  );

  const getSettlement = (member: Member) => {
    if (member.status !== 'active') return null;
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
  };

  // Filtered members list
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        (m.phone && m.phone.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchesRole = roleFilter === 'all' || m.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [members, search, statusFilter, roleFilter]);

  const handleDeleteMember = () => {
    if (!deleteConfirmMember) return;
    deleteMember(deleteConfirmMember.id);
    toast.success(`${deleteConfirmMember.name} has been removed`);
    setDeleteConfirmMember(null);
    if (selectedMember?.id === deleteConfirmMember.id) {
      setSelectedMember(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your mess members, contact details, and financial balances
          </p>
        </div>

        <Button
          onClick={() => {
            setEditMember(null);
            setFormOpen(true);
          }}
          className="gap-2 shadow-xs"
        >
          <Plus className="size-4" /> Add Member
        </Button>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/60 bg-card p-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Members
          </p>
          <p className="text-2xl font-bold text-foreground mt-1 font-mono">{members.length}</p>
        </Card>
        <Card className="border-border/60 bg-card p-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Active Members
          </p>
          <p className="text-2xl font-bold text-emerald-500 mt-1 font-mono">
            {activeMembers.length}
          </p>
        </Card>
        <Card className="border-border/60 bg-card p-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Current Meal Rate
          </p>
          <p className="text-2xl font-bold text-cyan-500 mt-1 font-mono">
            {CURRENCY_SYMBOL}{(stats.mealRatePaisa / 100).toFixed(2)}
          </p>
        </Card>
        <Card className="border-border/60 bg-card p-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Meals Consumed
          </p>
          <p className="text-2xl font-bold text-foreground mt-1 font-mono">
            {stats.totalMeals.toFixed(1)}
          </p>
        </Card>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Filters & View Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? 'all')}>
            <SelectTrigger className="h-9 w-28 text-xs">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/20">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon-sm"
              className="size-7"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon-sm"
              className="size-7"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
            >
              <List className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No members found"
          description="Try adjusting your search query or status filter."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setRoleFilter('all');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((member) => {
            const settlement = getSettlement(member);
            return (
              <Card
                key={member.id}
                className="border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 group relative flex flex-col justify-between"
              >
                <CardContent className="p-5">
                  {/* Card Header with Avatar & Options */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      onClick={() => setSelectedMember(member)}
                    >
                      <Avatar className="size-11 shrink-0 ring-1 ring-border">
                        <AvatarFallback
                          className="text-sm font-bold text-white shadow-xs"
                          style={{ backgroundColor: member.avatarColor }}
                        >
                          {member.avatarInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {member.name}
                          </p>
                          {member.role === 'admin' && (
                            <Shield className="size-3.5 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    {/* Action Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground cursor-pointer transition-colors outline-none"
                        aria-label="Member options"
                      >
                        <MoreVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedMember(member)}>
                          Quick Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/members/${member.id}`)}>
                          Open Profile Page
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditMember(member);
                            setFormOpen(true);
                          }}
                        >
                          Edit Profile
                        </DropdownMenuItem>
                        {member.role !== 'admin' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                if (member.status === 'active') {
                                  deactivateMember(member.id);
                                  toast.success(`${member.name} deactivated`);
                                } else {
                                  activateMember(member.id);
                                  toast.success(`${member.name} activated`);
                                }
                              }}
                            >
                              {member.status === 'active' ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteConfirmMember(member)}
                            >
                              Remove Member
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Details section */}
                  <div
                    className="mt-4 space-y-2.5 pt-3 border-t border-border/60 cursor-pointer"
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Status</span>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] h-5 capitalize font-medium', STATUS_BADGE[member.status])}
                      >
                        {MEMBER_STATUSES[member.status]}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Joined</span>
                      <span className="text-foreground font-medium">{formatDate(member.joinedAt)}</span>
                    </div>

                    {member.phone && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="text-foreground">{member.phone}</span>
                      </div>
                    )}

                    {/* Balance */}
                    {settlement && (
                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                        <span className="text-muted-foreground">
                          Balance ({formatMonthYear(selectedMonth.year, selectedMonth.month)})
                        </span>
                        <span
                          className={cn(
                            'font-mono font-semibold',
                            settlement.netBalancePaisa > 0
                              ? 'text-destructive'
                              : settlement.netBalancePaisa < 0
                                ? 'text-emerald-500'
                                : 'text-muted-foreground',
                          )}
                        >
                          {settlement.netBalancePaisa > 0
                            ? `Owes ${CURRENCY_SYMBOL}${(settlement.netBalancePaisa / 100).toFixed(0)}`
                            : settlement.netBalancePaisa < 0
                              ? `Gets ${CURRENCY_SYMBOL}${Math.abs(settlement.netBalancePaisa / 100).toFixed(0)}`
                              : 'Settled'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card className="border-border/60 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20">
                  <th className="text-left text-[11px] font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-3 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-3 uppercase tracking-wider hidden sm:table-cell">
                    Contact
                  </th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-3 uppercase tracking-wider hidden md:table-cell">
                    Joined Date
                  </th>
                  <th className="text-right text-[11px] font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="text-right text-[11px] font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((member) => {
                  const settlement = getSettlement(member);
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedMember(member)}
                    >
                      {/* Member Info */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8 shrink-0">
                            <AvatarFallback
                              className="text-xs font-bold text-white"
                              style={{ backgroundColor: member.avatarColor }}
                            >
                              {member.avatarInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground text-sm truncate">
                                {member.name}
                              </span>
                              {member.role === 'admin' && (
                                <Shield className="size-3 text-primary shrink-0" />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground block truncate">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] h-5 capitalize font-medium', STATUS_BADGE[member.status])}
                        >
                          {MEMBER_STATUSES[member.status]}
                        </Badge>
                      </td>

                      {/* Contact */}
                      <td className="px-3 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                        {member.phone || '—'}
                      </td>

                      {/* Joined Date */}
                      <td className="px-3 py-3 text-xs text-muted-foreground hidden md:table-cell">
                        {formatDate(member.joinedAt)}
                      </td>

                      {/* Balance */}
                      <td className="px-4 py-3 text-right">
                        {settlement ? (
                          <span
                            className={cn(
                              'font-mono text-xs font-semibold tabular-nums',
                              settlement.netBalancePaisa > 0
                                ? 'text-destructive'
                                : settlement.netBalancePaisa < 0
                                  ? 'text-emerald-500'
                                  : 'text-muted-foreground',
                            )}
                          >
                            {settlement.netBalancePaisa > 0 ? 'Owes ' : settlement.netBalancePaisa < 0 ? 'Gets ' : ''}
                            {CURRENCY_SYMBOL}{Math.abs(settlement.netBalancePaisa / 100).toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-7"
                            onClick={() => {
                              setEditMember(member);
                              setFormOpen(true);
                            }}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          {member.role !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7 text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteConfirmMember(member)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Member Detail Drawer */}
      <MemberDetailDrawer
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        settlement={selectedMember ? getSettlement(selectedMember) : null}
        mealSummary={
          selectedMember
            ? mealSummaries.find((s) => s.memberId === selectedMember.id) ?? null
            : null
        }
        selectedMonth={selectedMonth}
      />

      {/* Add / Edit Dialog */}
      <MemberFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        member={editMember}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirmMember}
        onOpenChange={(v) => !v && setDeleteConfirmMember(null)}
        title="Remove Member"
        description={`Are you sure you want to remove ${deleteConfirmMember?.name}? This action cannot be undone.`}
        confirmLabel="Remove Member"
        variant="destructive"
        onConfirm={handleDeleteMember}
      />
    </div>
  );
}
