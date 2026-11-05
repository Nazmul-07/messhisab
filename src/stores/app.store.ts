// ============================================================
// MessHisab — Global App Store (Zustand)
// ============================================================
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SelectedMonth } from '@/lib/types';

interface AppState {
  selectedMonth: SelectedMonth;
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  activeWorkspaceId: string;
  setSelectedMonth: (month: SelectedMonth) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveWorkspaceId: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedMonth: { year: 2026, month: 11 },
      theme: 'dark',
      sidebarOpen: true,
      activeWorkspaceId: 'mess-001',
      setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
      setTheme: (theme) => set({ theme }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setActiveWorkspaceId: (activeWorkspaceId) => set({ activeWorkspaceId }),
    }),
    {
      name: 'messhisab-app',
      partialize: (s) => ({
        selectedMonth: s.selectedMonth,
        theme: s.theme,
        activeWorkspaceId: s.activeWorkspaceId,
      }),
    },
  ),
);

