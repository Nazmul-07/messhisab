// ============================================================
// MessHisab — Bazar Store (Zustand)
// ============================================================
'use client';

import { create } from 'zustand';
import type { BazarEntry } from '@/lib/types';
import { mockBazarEntries } from '@/data/bazar';

interface BazarState {
  entries: BazarEntry[];
  addEntry: (entry: BazarEntry) => void;
  updateEntry: (id: string, updates: Partial<BazarEntry>) => void;
  deleteEntry: (id: string) => void;
}

export const useBazarStore = create<BazarState>()((set) => ({
  entries: mockBazarEntries,
  addEntry: (entry) =>
    set((s) => ({ entries: [entry, ...s.entries] })),
  updateEntry: (id, updates) =>
    set((s) => ({
      entries: s.entries.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e,
      ),
    })),
  deleteEntry: (id) =>
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
}));

