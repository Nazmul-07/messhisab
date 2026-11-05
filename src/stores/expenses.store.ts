// ============================================================
// MessHisab — Expenses Store (Zustand)
// ============================================================
'use client';

import { create } from 'zustand';
import type { Expense } from '@/lib/types';
import { mockExpenses } from '@/data/expenses';

interface ExpensesState {
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
}

export const useExpensesStore = create<ExpensesState>()((set) => ({
  expenses: mockExpenses,
  addExpense: (expense) =>
    set((s) => ({ expenses: [expense, ...s.expenses] })),
  updateExpense: (id, updates) =>
    set((s) => ({
      expenses: s.expenses.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e,
      ),
    })),
  deleteExpense: (id) =>
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
}));

