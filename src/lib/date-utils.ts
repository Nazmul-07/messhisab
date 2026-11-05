// ============================================================
// MessHisab — Date Utilities
// ============================================================

import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { MONTHS } from './constants';
import type { SelectedMonth } from './types';

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd MMM yyyy');
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'dd MMM');
}

export function formatMonthYear(year: number, month: number): string {
  return `${MONTHS[month - 1]} ${year}`;
}

export function getMonthDays(year: number, month: number): string[] {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'));
}

export function getCurrentMonth(): SelectedMonth {
  return { year: 2026, month: 11 };
}

export function previousMonth({ year, month }: SelectedMonth): SelectedMonth {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export function nextMonth({ year, month }: SelectedMonth): SelectedMonth {
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

export function isCurrentMonth({ year, month }: SelectedMonth): boolean {
  return year === 2026 && month === 11;
}

export function dateInMonth(dateStr: string, { year, month }: SelectedMonth): boolean {
  const d = parseISO(dateStr);
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

export function todayString(): string {
  return '2026-11-05';
}

