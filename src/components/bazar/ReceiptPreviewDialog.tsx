'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/currency';
import type { BazarEntry, Member } from '@/lib/types';
import { ShoppingBasket, Receipt, Printer, CheckCircle, Calendar, User, CreditCard } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ReceiptPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: BazarEntry | null;
  paidByMember?: Member | null;
}

export function ReceiptPreviewDialog({
  open,
  onOpenChange,
  entry,
  paidByMember,
}: ReceiptPreviewDialogProps) {
  if (!entry) return null;

  const handlePrint = () => {
    window.print();
  };

  const itemsList = entry.items.split(',').map((item) => item.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border-border">
        <DialogHeader className="p-6 pb-4 bg-muted/30 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                <Receipt className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Grocery Purchase Receipt</DialogTitle>
                <p className="text-xs text-muted-foreground font-mono">Ref: {entry.id}</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                entry.paymentSource === 'personal'
                  ? 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10'
                  : 'border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/10'
              }
            >
              {entry.paymentSource === 'personal' ? 'Personal Account' : 'Cashbox Funds'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Amount Callout */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/60 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              Total Amount Paid
            </p>
            <p className="text-3xl font-bold font-mono text-foreground mt-1 tracking-tight">
              {formatCurrency(entry.amountPaisa)}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <CheckCircle className="size-3.5 text-emerald-500" />
              Verified Transaction
            </p>
          </div>

          {/* Transaction Metadata */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5" /> Purchase Date
              </span>
              <span className="font-medium text-foreground">{formatDate(entry.date)}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <User className="size-3.5" /> Paid By Member
              </span>
              <div className="flex items-center gap-1.5">
                {paidByMember && (
                  <Avatar className="size-5">
                    <AvatarFallback
                      className="text-[9px] font-bold text-white"
                      style={{ backgroundColor: paidByMember.avatarColor }}
                    >
                      {paidByMember.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <span className="font-medium text-foreground">
                  {paidByMember?.name ?? 'Unknown Member'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="size-3.5" /> Payment Source
              </span>
              <span className="font-medium capitalize text-foreground">
                {entry.paymentSource} Payment
              </span>
            </div>
          </div>

          <Separator />

          {/* Itemized List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShoppingBasket className="size-3.5 text-cyan-500" /> Purchased Grocery Items
            </h4>
            <div className="rounded-lg border border-border/60 bg-card p-3 space-y-1.5">
              {itemsList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1">
                  <span className="text-foreground flex items-center gap-2">
                    <span className="size-1 rounded-full bg-cyan-500" />
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {entry.note && (
              <p className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-border/40 italic">
                Note: {entry.note}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t border-border/60 flex sm:justify-between items-center">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer className="size-3.5" /> Print Receipt
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
