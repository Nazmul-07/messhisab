'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/date-utils';
import type { MealRecord, MealUnit, Member } from '@/lib/types';
import {
  Shield,
  CheckCheck,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, parseISO, addDays, subDays } from 'date-fns';

interface MealDayEditorProps {
  initialDate: string;
  members: Member[];
  records: MealRecord[];
  onClose: () => void;
  onSaveDay: (records: MealRecord[]) => void;
  onDeleteDay?: (date: string) => void;
}

export function MealDayEditor({
  initialDate,
  members,
  records,
  onClose,
  onSaveDay,
  onDeleteDay,
}: MealDayEditorProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);

  // Active members only for meal recording
  const activeMembers = members.filter((m) => m.status === 'active');

  // Load existing records for currentDate into local state
  const loadDayState = (targetDate: string) => {
    const initial: Record<
      string,
      { breakfast: MealUnit; lunch: MealUnit; dinner: MealUnit; id?: string }
    > = {};

    for (const m of activeMembers) {
      const existing = records.find((r) => r.memberId === m.id && r.date === targetDate);
      initial[m.id] = {
        breakfast: existing?.breakfast ?? 0,
        lunch: existing?.lunch ?? 0,
        dinner: existing?.dinner ?? 0,
        id: existing?.id,
      };
    }
    return initial;
  };

  const [dayRecords, setDayRecords] = useState(() => loadDayState(currentDate));

  // Change date handler
  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    setDayRecords(loadDayState(newDate));
  };

  const stepDate = (days: number) => {
    const d = parseISO(currentDate);
    const updated = days > 0 ? addDays(d, days) : subDays(d, Math.abs(days));
    handleDateChange(format(updated, 'yyyy-MM-dd'));
  };

  // Cycle slot: 0 -> 1 -> 0.5 -> 0
  const cycleMeal = (memberId: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    setDayRecords((prev) => {
      const current = prev[memberId]?.[mealType] ?? 0;
      const next: MealUnit = current === 0 ? 1 : current === 1 ? 0.5 : 0;
      return {
        ...prev,
        [memberId]: {
          ...prev[memberId],
          [mealType]: next,
        },
      };
    });
  };

  const setRowForMember = (memberId: string, unit: MealUnit) => {
    setDayRecords((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        breakfast: unit,
        lunch: unit,
        dinner: unit,
      },
    }));
  };

  const markAllMembers = (unit: MealUnit) => {
    setDayRecords((prev) => {
      const next = { ...prev };
      for (const m of activeMembers) {
        next[m.id] = {
          ...next[m.id],
          breakfast: unit,
          lunch: unit,
          dinner: unit,
        };
      }
      return next;
    });
  };

  const handleSave = () => {
    const recordsToSave: MealRecord[] = activeMembers.map((m) => {
      const entry = dayRecords[m.id] || { breakfast: 0, lunch: 0, dinner: 0 };
      const now = new Date().toISOString();
      return {
        id: entry.id || `meal-${Date.now()}-${m.id}`,
        messId: 'mess-001',
        date: currentDate,
        memberId: m.id,
        breakfast: entry.breakfast,
        lunch: entry.lunch,
        dinner: entry.dinner,
        createdAt: now,
        updatedAt: now,
      };
    });

    onSaveDay(recordsToSave);
    toast.success(`Meals recorded for ${formatDate(currentDate)}`);
    onClose();
  };

  const handleDeleteDay = () => {
    if (onDeleteDay) {
      onDeleteDay(currentDate);
      toast.success(`Meals cleared for ${formatDate(currentDate)}`);
      onClose();
    }
  };

  const getPillClass = (val: MealUnit) => {
    if (val === 1) {
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25 font-bold';
    }
    if (val === 0.5) {
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25 font-bold';
    }
    return 'bg-muted/40 text-muted-foreground/60 border-border/80 hover:bg-muted font-medium';
  };

  const totalDayMeals = Object.values(dayRecords).reduce(
    (s, r) => s + (r.breakfast + r.lunch + r.dinner),
    0,
  );

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card border-border">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                <UtensilsCrossed className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <span>Daily Meal Record Entry</span>
                  <Badge variant="secondary" className="gap-1 text-[10px] text-primary">
                    <Shield className="size-3" /> Admin Only
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Record breakfast, lunch, and dinner with half-meal (0.5) support
                </p>
              </div>
            </div>

            {/* Date Switcher */}
            <div className="flex items-center gap-1.5 border border-border rounded-lg p-1 bg-card">
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                onClick={() => stepDate(-1)}
                title="Previous day"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Input
                type="date"
                value={currentDate}
                onChange={(e) => e.target.value && handleDateChange(e.target.value)}
                className="h-7 w-32 text-xs border-none font-mono"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                onClick={() => stepDate(1)}
                title="Next day"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Quick Day Bulk Bar */}
          <div className="flex items-center justify-between pt-3 text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Day Total:</span>
              <span className="font-mono font-bold text-foreground text-sm">
                {totalDayMeals.toFixed(1)} meals
              </span>
              <span className="text-muted-foreground">({activeMembers.length} members)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[11px] gap-1"
                onClick={() => markAllMembers(1)}
              >
                <CheckCheck className="size-3" /> All Full (1.0)
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-muted-foreground gap-1"
                onClick={() => markAllMembers(0)}
              >
                <RotateCcw className="size-3" /> Clear All (0)
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Member Rows */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
          <div className="border border-border/80 rounded-xl divide-y divide-border/60 bg-card overflow-hidden">
            {activeMembers.map((member) => {
              const rec = dayRecords[member.id] || { breakfast: 0, lunch: 0, dinner: 0 };
              const memberDailyTotal = rec.breakfast + rec.lunch + rec.dinner;

              return (
                <div
                  key={member.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                >
                  {/* Member identity */}
                  <div className="flex items-center gap-2.5 min-w-[160px]">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback
                        className="text-xs font-bold text-white"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {member.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {member.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        Day Total: <span className="font-bold text-foreground">{memberDailyTotal.toFixed(1)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Meal Pills (Breakfast, Lunch, Dinner) */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Breakfast */}
                    <button
                      type="button"
                      onClick={() => cycleMeal(member.id, 'breakfast')}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-lg border transition-all text-center min-w-[76px]',
                        getPillClass(rec.breakfast),
                      )}
                      title="Click to cycle: Full (1) -> Half (0.5) -> None (0)"
                    >
                      <span className="block text-[9px] uppercase tracking-wider font-semibold opacity-70">
                        Breakfast
                      </span>
                      {rec.breakfast === 1 ? '1.0 Full' : rec.breakfast === 0.5 ? '½ Half' : '0 None'}
                    </button>

                    {/* Lunch */}
                    <button
                      type="button"
                      onClick={() => cycleMeal(member.id, 'lunch')}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-lg border transition-all text-center min-w-[76px]',
                        getPillClass(rec.lunch),
                      )}
                      title="Click to cycle: Full (1) -> Half (0.5) -> None (0)"
                    >
                      <span className="block text-[9px] uppercase tracking-wider font-semibold opacity-70">
                        Lunch
                      </span>
                      {rec.lunch === 1 ? '1.0 Full' : rec.lunch === 0.5 ? '½ Half' : '0 None'}
                    </button>

                    {/* Dinner */}
                    <button
                      type="button"
                      onClick={() => cycleMeal(member.id, 'dinner')}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-lg border transition-all text-center min-w-[76px]',
                        getPillClass(rec.dinner),
                      )}
                      title="Click to cycle: Full (1) -> Half (0.5) -> None (0)"
                    >
                      <span className="block text-[9px] uppercase tracking-wider font-semibold opacity-70">
                        Dinner
                      </span>
                      {rec.dinner === 1 ? '1.0 Full' : rec.dinner === 0.5 ? '½ Half' : '0 None'}
                    </button>

                    {/* Quick Row Helpers */}
                    <div className="flex items-center gap-1 pl-2 border-l border-border/60">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-7 text-[10px] text-muted-foreground hover:text-emerald-500 font-mono"
                        onClick={() => setRowForMember(member.id, 1)}
                        title="Set all meals to 1.0 (Full day)"
                      >
                        All 1
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-7 text-[10px] text-muted-foreground hover:text-destructive font-mono"
                        onClick={() => setRowForMember(member.id, 0)}
                        title="Set all meals to 0 (Absent)"
                      >
                        All 0
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border/60 bg-muted/20 flex sm:justify-between items-center gap-2">
          {onDeleteDay && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 text-xs gap-1.5"
              onClick={handleDeleteDay}
            >
              <Trash2 className="size-3.5" /> Clear Date Records
            </Button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave} className="text-xs">
              Save Daily Meals
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
