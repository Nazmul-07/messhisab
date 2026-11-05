// ============================================================
// MessHisab — Members Store (Zustand)
// ============================================================
'use client';

import { create } from 'zustand';
import type { Member } from '@/lib/types';
import { mockMembers } from '@/data/members';

interface MembersState {
  members: Member[];
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deactivateMember: (id: string) => void;
  activateMember: (id: string) => void;
  deleteMember: (id: string) => void;
}

export const useMembersStore = create<MembersState>()((set) => ({
  members: mockMembers,
  addMember: (member) =>
    set((s) => ({ members: [...s.members, member] })),
  updateMember: (id, updates) =>
    set((s) => ({
      members: s.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  deactivateMember: (id) =>
    set((s) => ({
      members: s.members.map((m) =>
        m.id === id
          ? { ...m, status: 'inactive', leftAt: new Date().toISOString().split('T')[0] }
          : m,
      ),
    })),
  activateMember: (id) =>
    set((s) => ({
      members: s.members.map((m) =>
        m.id === id ? { ...m, status: 'active', leftAt: undefined } : m,
      ),
    })),
  deleteMember: (id) =>
    set((s) => ({ members: s.members.filter((m) => m.id !== id) })),
}));

