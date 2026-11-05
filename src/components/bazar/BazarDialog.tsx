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
import { useBazarStore } from '@/stores/bazar.store';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { takaToPaisa } from '@/lib/currency';
import { todayString } from '@/lib/date-utils';
import type { BazarEntry, Member, PaymentSource } from '@/lib/types';
import { toast } from 'sonner';

function createBazarId() {
  return `bazar-${Date.now()}`;
}

const schema = z.object({
  date: z.string().min(1, 'Purchase date is required'),
  items: z.string().min(2, 'Please list the grocery items purchased'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount greater than 0'),
  paidByMemberId: z.string().min(1, 'Select who paid for this purchase'),
  paymentSource: z.enum(['personal', 'cashbox']),
  note: z.string().optional(),
  receiptUrl: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface BazarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: BazarEntry | null;
  members: Member[];
}

export function BazarDialog({ open, onOpenChange, entry, members }: BazarDialogProps) {
  const { addEntry, updateEntry } = useBazarStore();
  const isEdit = !!entry;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: todayString(),
      items: '',
      amount: '',
      paidByMemberId: members[0]?.id ?? '',
      paymentSource: 'personal',
      note: '',
      receiptUrl: '',
    },
  });

  useEffect(() => {
    if (entry) {
      reset({
        date: entry.date,
        items: entry.items,
        amount: (entry.amountPaisa / 100).toFixed(2),
        paidByMemberId: entry.paidByMemberId,
        paymentSource: entry.paymentSource,
        note: entry.note ?? '',
        receiptUrl: entry.receiptUrl ?? '',
      });
    } else {
      reset({
        date: todayString(),
        items: '',
        amount: '',
        paidByMemberId: members[0]?.id ?? '',
        paymentSource: 'personal',
        note: '',
        receiptUrl: '',
      });
    }
  }, [entry, open, members, reset]);

  const onSubmit = (data: FormData) => {
    const amountPaisa = takaToPaisa(Number(data.amount));

    if (isEdit && entry) {
      updateEntry(entry.id, {
        date: data.date,
        items: data.items,
        amountPaisa,
        paidByMemberId: data.paidByMemberId,
        paymentSource: data.paymentSource as PaymentSource,
        note: data.note || undefined,
        receiptUrl: data.receiptUrl || undefined,
      });
      toast.success('Bazar entry updated successfully');
    } else {
      const nowIso = new Date().toISOString();
      addEntry({
        id: createBazarId(),
        messId: 'mess-001',
        date: data.date,
        items: data.items,
        amountPaisa,
        paidByMemberId: data.paidByMemberId,
        paymentSource: data.paymentSource as PaymentSource,
        note: data.note || undefined,
        receiptUrl: data.receiptUrl || undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      toast.success('Grocery purchase recorded');
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Grocery Purchase' : 'Record Grocery Purchase (Bazar)'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Date and Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bazar-date">Purchase Date *</Label>
              <Input id="bazar-date" type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bazar-amount">Amount ({CURRENCY_SYMBOL}) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                  {CURRENCY_SYMBOL}
                </span>
                <Input
                  id="bazar-amount"
                  placeholder="0.00"
                  className="pl-8 font-mono"
                  step="0.01"
                  {...register('amount')}
                />
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
          </div>

          {/* Items Description */}
          <div className="space-y-1.5">
            <Label htmlFor="bazar-items">Items Description *</Label>
            <Input
              id="bazar-items"
              placeholder="e.g. Rice 10kg, Chicken 2kg, Onions, Oil 2L"
              {...register('items')}
            />
            {errors.items && <p className="text-xs text-destructive">{errors.items.message}</p>}
          </div>

          {/* Paid By and Payment Source with Controllers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Paid By *</Label>
              <Controller
                name="paidByMemberId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select member" />
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
              {errors.paidByMemberId && (
                <p className="text-xs text-destructive">{errors.paidByMemberId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Payment Source *</Label>
              <Controller
                name="paymentSource"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal Account (Credited to Member)</SelectItem>
                      <SelectItem value="cashbox">Cashbox Funds (Shared Fund)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.paymentSource && (
                <p className="text-xs text-destructive">{errors.paymentSource.message}</p>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="bazar-note">Note or Receipt Details (optional)</Label>
            <Textarea
              id="bazar-note"
              placeholder="e.g. Purchased from Kawran Bazar, voucher #124"
              rows={2}
              {...register('note')}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Save Changes' : 'Record Purchase'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
