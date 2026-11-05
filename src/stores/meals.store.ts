// ============================================================
// MessHisab — Meals Store (Zustand)
// ============================================================
'use client';

import { create } from 'zustand';
import type { MealRecord } from '@/lib/types';
import { mockMealRecords } from '@/data/meals';

interface MealsState {
  records: MealRecord[];
  upsertRecord: (record: MealRecord) => void;
  bulkUpsertRecords: (records: MealRecord[]) => void;
  deleteRecord: (id: string) => void;
  deleteDayRecords: (date: string) => void;
  resetMemberDay: (memberId: string, date: string) => void;
}

export const useMealsStore = create<MealsState>()((set) => ({
  records: mockMealRecords,
  upsertRecord: (record) =>
    set((s) => {
      // Prevent duplicates by composite key (memberId + date) or id
      const existingIdx = s.records.findIndex(
        (r) => r.id === record.id || (r.memberId === record.memberId && r.date === record.date),
      );
      if (existingIdx !== -1) {
        const next = [...s.records];
        next[existingIdx] = {
          ...next[existingIdx],
          ...record,
          id: next[existingIdx].id, // preserve stable id
          updatedAt: new Date().toISOString(),
        };
        return { records: next };
      }
      return { records: [...s.records, record] };
    }),
  bulkUpsertRecords: (newRecords) =>
    set((s) => {
      const recordsMap = new Map<string, MealRecord>();
      // seed with current
      for (const r of s.records) {
        recordsMap.set(`${r.memberId}:${r.date}`, r);
      }
      // merge new
      for (const nr of newRecords) {
        const existing = recordsMap.get(`${nr.memberId}:${nr.date}`);
        recordsMap.set(`${nr.memberId}:${nr.date}`, {
          ...nr,
          id: existing?.id ?? nr.id,
          updatedAt: new Date().toISOString(),
        });
      }
      return { records: Array.from(recordsMap.values()) };
    }),
  deleteRecord: (id) =>
    set((s) => ({ records: s.records.filter((r) => r.id !== id) })),
  deleteDayRecords: (date) =>
    set((s) => ({ records: s.records.filter((r) => r.date !== date) })),
  resetMemberDay: (memberId, date) =>
    set((s) => ({
      records: s.records.map((r) =>
        r.memberId === memberId && r.date === date
          ? { ...r, breakfast: 0, lunch: 0, dinner: 0, updatedAt: new Date().toISOString() }
          : r,
      ),
    })),
}));

