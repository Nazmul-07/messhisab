'use client';

// ============================================================
// MessHisab — Expense Dialog (Add / Edit)
// Supports: equal, meal-based, and custom per-member allocation
// ============================================================

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useExpensesStore } from '@/stores/expenses.store';
import {
  EXPENSE_CATEGORIES,
  PAYMENT_SOURCES,
} from '@/lib/constants';
import { takaToPaisa } from '@/lib/currency';
import { todayString } from '@/lib/date-utils';
import type {
  AllocationMethod,
  Expense,
  ExpenseCategory,
  Member,
  PaymentSource,
} from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Users,
  UtensilsCrossed,
  Sliders,
  InfoIcon,
} from 'lucide-react';

// ─── ID factory (outside render, no Date.now() in JSX) ────────
function createExpenseId(): string {
  return `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Zod Schema ───────────────────────────────────────────────
const schema = z
  .object({
    category: z.enum([
      'rent',
      'electricity',
      'gas',
      'wifi',
      'water',
      'cleaning',
      'other',
    ]),
    description: z.string().min(2, 'Description required (min 2 chars)'),
    amount: z
      .string()
      .refine(
        (v) => !isNaN(Number(v)) && Number(v) > 0,
        'Enter a valid positive amount',
      ),
    date: z.string().min(1, 'Date is required'),
    paymentSource: z.enum(['personal', 'cashbox']),
    paidByMemberId: z.string().optional(),
    allocationMethod: z.enum(['equal', 'meal_based', 'custom']),
    note: z.string().optional(),
    // Custom allocation — array of { memberId, share (taka string) }
    customAllocations: z
      .array(
        z.object({
          memberId: z.string(),
          share: z.string(),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentSource === 'personal' && !data.paidByMemberId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paidByMemberId'],
        message: 'Select who paid personally',
      });
    }
    if (data.allocationMethod === 'custom' && data.customAllocations) {
      const total = data.customAllocations.reduce(
        (s, a) => s + (Number(a.share) || 0),
        0,
      );
      const amount = Number(data.amount) || 0;
      if (Math.abs(total - amount) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customAllocations'],
          message: `Custom allocations must sum to ৳${amount.toFixed(2)} (currently ৳${total.toFixed(2)})`,
        });
      }
    }
  });

type FormData = z.infer<typeof schema>;

// ─── Category icons mapping ────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  rent: '🏠',
  electricity: '⚡',
  gas: '🔥',
  wifi: '📶',
  water: '💧',
  cleaning: '🧹',
  other: '📦',
};

// ─── Props ────────────────────────────────────────────────────
interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  members: Member[];
}

// ─── Component ────────────────────────────────────────────────
export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  members,
}: ExpenseDialogProps) {
  const { addExpense, updateExpense } = useExpensesStore();
  const isEdit = !!expense;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(null, members),
  });

  const paymentSource = watch('paymentSource');
  const allocationMethod = watch('allocationMethod');
  const amountStr = watch('amount');
  const customAllocs = watch('customAllocations');
  const totalAmount = Number(amountStr) || 0;

  // Rehydrate form when dialog opens or expense changes
  useEffect(() => {
    reset(buildDefaults(expense, members));
  }, [expense, open, reset, members]);

  // When allocation method switches to custom, seed each member's share equally
  useEffect(() => {
    if (allocationMethod === 'custom' && members.length > 0) {
      const perMember =
        totalAmount > 0
          ? (totalAmount / members.length).toFixed(2)
          : '0';
      setValue(
        'customAllocations',
        members.map((m) => ({ memberId: m.id, share: perMember })),
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allocationMethod]);

  // Running total for custom allocation
  const customTotal = (customAllocs ?? []).reduce(
    (s, a) => s + (Number(a.share) || 0),
    0,
  );
  const customDiff = totalAmount - customTotal;

  const onSubmit = (data: FormData) => {
    const amountPaisa = takaToPaisa(Number(data.amount));

    // Build customAllocations map (paisa)
    const customAllocMap: Record<string, number> | undefined =
      data.allocationMethod === 'custom' && data.customAllocations
        ? Object.fromEntries(
            data.customAllocations.map((a) => [
              a.memberId,
              takaToPaisa(Number(a.share) || 0),
            ]),
          )
        : undefined;

    const payload: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
      messId: 'mess-001',
      category: data.category as ExpenseCategory,
      description: data.description,
      amountPaisa,
      date: data.date,
      paymentSource: data.paymentSource as PaymentSource,
      paidByMemberId:
        data.paymentSource === 'personal' ? data.paidByMemberId : undefined,
      allocationMethod: data.allocationMethod as AllocationMethod,
      customAllocations: customAllocMap,
      note: data.note || undefined,
    };

    if (isEdit) {
      updateExpense(expense.id, {
        ...payload,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Expense updated');
    } else {
      const now = new Date().toISOString();
      addExpense({
        id: createExpenseId(),
        ...payload,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('Expense recorded');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Shared Expense' : 'Add Shared Expense'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-1">
          {/* Row 1: Category + Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) =>
                      field.onChange((v as ExpenseCategory) ?? 'rent')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <span>{CATEGORY_ICONS[key]}</span>
                            {label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Amount (৳) *</Label>
              <Input
                id="exp-amount"
                placeholder="14000"
                {...register('amount')}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-description">Description *</Label>
            <Input
              id="exp-description"
              placeholder="House rent, DESCO electricity bill, cook salary..."
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Row 2: Date + Allocation Method */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="exp-date">Date *</Label>
              <Input id="exp-date" type="date" {...register('date')} />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Allocation Method *</Label>
              <Controller
                control={control}
                name="allocationMethod"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) =>
                      field.onChange((v as AllocationMethod) ?? 'equal')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">
                        <span className="flex items-center gap-2">
                          <Users className="size-3.5" /> Equal Split
                        </span>
                      </SelectItem>
                      <SelectItem value="meal_based">
                        <span className="flex items-center gap-2">
                          <UtensilsCrossed className="size-3.5" /> Meal-Based
                        </span>
                      </SelectItem>
                      <SelectItem value="custom">
                        <span className="flex items-center gap-2">
                          <Sliders className="size-3.5" /> Custom
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Allocation method hints */}
          {allocationMethod === 'meal_based' && (
            <div className="flex items-start gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2.5 text-xs text-blue-700 dark:text-blue-300">
              <InfoIcon className="size-3.5 mt-0.5 shrink-0" />
              Each member&apos;s share is proportional to their total meals for the
              month. Members with zero meals pay nothing.
            </div>
          )}

          {/* Custom allocation grid */}
          {allocationMethod === 'custom' && (
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Custom Member Allocations
                </Label>
                <span
                  className={cn(
                    'text-xs font-mono font-semibold',
                    Math.abs(customDiff) < 0.01
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-destructive',
                  )}
                >
                  {Math.abs(customDiff) < 0.01
                    ? '✓ Balanced'
                    : customDiff > 0
                    ? `৳${customDiff.toFixed(2)} remaining`
                    : `৳${Math.abs(customDiff).toFixed(2)} over`}
                </span>
              </div>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(errors.customAllocations as any)?.message && (
                <p className="text-xs text-destructive">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(errors.customAllocations as any).message}
                </p>
              )}
              <div className="space-y-2">
                {members.map((member, index) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                  >
                    <input
                      type="hidden"
                      value={member.id}
                      {...register(`customAllocations.${index}.memberId` as const)}
                    />
                    <Avatar className="size-7 shrink-0">
                      <AvatarFallback
                        className="text-[10px] font-bold text-white"
                        style={{ background: member.avatarColor }}
                      >
                        {member.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium text-foreground truncate">
                      {member.name}
                    </span>
                    <div className="flex items-center gap-1 w-28">
                      <span className="text-muted-foreground text-xs">৳</span>
                      <Input
                        className="h-7 text-sm text-right font-mono"
                        placeholder="0"
                        {...register(
                          `customAllocations.${index}.share` as const,
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>Total allocated</span>
                <span className="font-mono font-semibold">
                  ৳{customTotal.toFixed(2)} / ৳{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <Separator />

          {/* Payment source + payer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Paid From *</Label>
              <Controller
                control={control}
                name="paymentSource"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) =>
                      field.onChange((v as PaymentSource) ?? 'cashbox')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_SOURCES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {paymentSource === 'personal' && (
              <div className="space-y-1.5">
                <Label>Paid By *</Label>
                <Controller
                  control={control}
                  name="paidByMemberId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(v) => field.onChange(v ?? '')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.paidByMemberId && (
                  <p className="text-xs text-destructive">
                    {errors.paidByMemberId.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-note">Note (optional)</Label>
            <Textarea
              id="exp-note"
              placeholder="Receipt number, remarks..."
              rows={2}
              {...register('note')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Update Expense' : 'Save Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ──────────────────────────────────────────────────
function buildDefaults(
  expense: Expense | null,
  members: Member[],
): FormData {
  if (expense) {
    return {
      category: expense.category,
      description: expense.description,
      amount: (expense.amountPaisa / 100).toFixed(2),
      date: expense.date,
      paymentSource: expense.paymentSource,
      paidByMemberId: expense.paidByMemberId ?? '',
      allocationMethod: expense.allocationMethod,
      note: expense.note ?? '',
      customAllocations:
        expense.allocationMethod === 'custom' && expense.customAllocations
          ? members.map((m) => ({
              memberId: m.id,
              share: (
                (expense.customAllocations?.[m.id] ?? 0) / 100
              ).toFixed(2),
            }))
          : members.map((m) => ({ memberId: m.id, share: '0' })),
    };
  }
  return {
    category: 'rent',
    description: '',
    amount: '',
    date: todayString(),
    paymentSource: 'cashbox',
    paidByMemberId: '',
    allocationMethod: 'equal',
    note: '',
    customAllocations: members.map((m) => ({ memberId: m.id, share: '0' })),
  };
}
