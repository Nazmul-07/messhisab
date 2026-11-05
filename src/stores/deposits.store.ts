// ============================================================
// MessHisab — Deposits Store (Zustand)
// ============================================================
'use client';

import { create } from 'zustand';
import type { Deposit } from '@/lib/types';
import { mockDeposits } from '@/data/deposits';

interface DepositsState {
  deposits: Deposit[];
  addDeposit: (deposit: Deposit) => void;
  updateDeposit: (id: string, updates: Partial<Deposit>) => void;
  deleteDeposit: (id: string) => void;
}

export const useDepositsStore = create<DepositsState>()((set) => ({
  deposits: mockDeposits,
  addDeposit: (deposit) =>
    set((s) => ({ deposits: [deposit, ...s.deposits] })),
  updateDeposit: (id, updates) =>
    set((s) => ({
      deposits: s.deposits.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),
  deleteDeposit: (id) =>
    set((s) => ({ deposits: s.deposits.filter((d) => d.id !== id) })),
}));

