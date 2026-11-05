'use client';

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
import { useDepositsStore } from '@/stores/deposits.store';
import { PAYMENT_METHODS, CURRENCY_SYMBOL } from '@/lib/constants';
import { takaToPaisa } from '@/lib/currency';
import { todayString } from '@/lib/date-utils';
import type { Deposit, Member, PaymentMethod } from '@/lib/types';
import { toast } from 'sonner';

function createDepositId() {
  return `dep-${Date.now()}`;
}

const schema = z.object({
  memberId: z.string().min(1, 'Please select a member'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount greater than 0'),
  paymentMethod: z.enum(['cash', 'bkash', 'nagad', 'rocket', 'bank_transfer']),
  date: z.string().min(1, 'Deposit date is required'),
  note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  deposit?: Deposit | null;
}

export function DepositDialog({ open, onOpenChange, members, deposit }: DepositDialogProps) {
  const { addDeposit, updateDeposit } = useDepositsStore();
  const isEdit = !!deposit;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      memberId: members[0]?.id ?? '',
      amount: '',
      paymentMethod: 'bkash',
      date: todayString(),
      note: '',
    },
  });

  useEffect(() => {
    if (deposit) {
      reset({
        memberId: deposit.memberId,
        amount: (deposit.amountPaisa / 100).toFixed(2),
        paymentMethod: deposit.paymentMethod,
        date: deposit.date,
        note: deposit.note ?? '',
      });
    } else {
      reset({
        memberId: members[0]?.id ?? '',
        amount: '',
        paymentMethod: 'bkash',
        date: todayString(),
        note: '',
      });
    }
  }, [deposit, open, members, reset]);

  const onSubmit = (data: FormData) => {
    const amountPaisa = takaToPaisa(Number(data.amount));
    const memberName = members.find((m) => m.id === data.memberId)?.name ?? 'Member';

    if (isEdit && deposit) {
      updateDeposit(deposit.id, {
        memberId: data.memberId,
        amountPaisa,
        paymentMethod: data.paymentMethod as PaymentMethod,
        date: data.date,
        note: data.note || undefined,
      });
      toast.success(`Deposit updated for ${memberName}`);
    } else {
      const nowIso = new Date().toISOString();
      addDeposit({
        id: createDepositId(),
        messId: 'mess-001',
        memberId: data.memberId,
        amountPaisa,
        paymentMethod: data.paymentMethod as PaymentMethod,
        date: data.date,
        note: data.note || undefined,
        createdAt: nowIso,
      });
      toast.success(`Deposit of ${CURRENCY_SYMBOL}${data.amount} recorded for ${memberName}`);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Member Deposit' : 'Add Member Deposit'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Member Selection */}
          <div className="space-y-1.5">
            <Label>Member *</Label>
            <Controller
              name="memberId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select contributing member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} {m.role === 'admin' ? '(Admin)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.memberId && <p className="text-xs text-destructive">{errors.memberId.message}</p>}
          </div>

          {/* Amount and Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dep-amount">Amount ({CURRENCY_SYMBOL}) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                  {CURRENCY_SYMBOL}
                </span>
                <Input
                  id="dep-amount"
                  placeholder="2500"
                  className="pl-8 font-mono"
                  step="0.01"
                  {...register('amount')}
                />
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Payment Method *</Label>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="dep-date">Deposit Date *</Label>
            <Input id="dep-date" type="date" {...register('date')} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="dep-note">Note (optional)</Label>
            <Textarea
              id="dep-note"
              placeholder="e.g. November initial contribution via personal bKash"
              rows={2}
              {...register('note')}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Save Changes' : 'Record Deposit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
