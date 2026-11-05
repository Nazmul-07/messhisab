'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app.store';
import { previousMonth, nextMonth, isCurrentMonth } from '@/lib/date-utils';
import { MONTHS } from '@/lib/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useAppStore();
  const { year, month } = selectedMonth;

  const handlePrev = () => setSelectedMonth(previousMonth(selectedMonth));
  const handleNext = () => setSelectedMonth(nextMonth(selectedMonth));
  const isCurrent = isCurrentMonth(selectedMonth);

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" onClick={handlePrev} aria-label="Previous month">
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex items-center gap-1">
        <Select
          value={String(month)}
          onValueChange={(v) => v && setSelectedMonth({ year, month: Number(v) })}
        >
          <SelectTrigger className="h-7 w-28 text-xs border-none bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((name, i) => (
              <SelectItem key={i + 1} value={String(i + 1)} className="text-xs">
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(year)}
          onValueChange={(v) => v && setSelectedMonth({ month, year: Number(v) })}
        >
          <SelectTrigger className="h-7 w-16 text-xs border-none bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026, 2027].map((y) => (
              <SelectItem key={y} value={String(y)} className="text-xs">
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleNext}
        disabled={isCurrent}
        aria-label="Next month"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

