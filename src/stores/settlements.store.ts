// ============================================================
// MessHisab — Settlements Store (Zustand with persist)
// Manages month closing lifecycle, audit records, & payment statuses
// ============================================================
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SettlementStatus } from '@/lib/types';

export interface MonthClosingRecord {
  monthKey: string; // e.g. "2026-10"
  closedAt: string; // ISO date string
  closedByMemberName: string;
  totalPayablePaisa: number;
  totalReceivablePaisa: number;
  roundingVariancePaisa: number;
  note?: string;
}

interface SettlementsState {
  // Closed months keys: e.g. ["2026-10"]
  closedMonths: string[];
  // History of closing records by monthKey
  closingRecords: Record<string, MonthClosingRecord>;
  // Member settlement status overrides per month: [monthKey]: { [memberId]: SettlementStatus }
  memberPaymentStatuses: Record<string, Record<string, SettlementStatus>>;

  // Actions
  isMonthClosed: (monthKey: string) => boolean;
  getClosingRecord: (monthKey: string) => MonthClosingRecord | undefined;
  getMemberStatus: (monthKey: string, memberId: string) => SettlementStatus | undefined;
  setMemberPaymentStatus: (
    monthKey: string,
    memberId: string,
    status: SettlementStatus,
  ) => void;
  closeMonth: (
    monthKey: string,
    record: Omit<MonthClosingRecord, 'monthKey' | 'closedAt'>,
  ) => void;
  reopenMonth: (monthKey: string) => void;
}

export const useSettlementsStore = create<SettlementsState>()(
  persist(
    (set, get) => ({
      // October 2026 is pre-finalized for realistic historical audit
      closedMonths: ['2026-10'],
      closingRecords: {
        '2026-10': {
          monthKey: '2026-10',
          closedAt: '2026-10-31T23:59:59Z',
          closedByMemberName: 'Md Nazmul Hosen (Admin)',
          totalPayablePaisa: 1250000,
          totalReceivablePaisa: 1250000,
          roundingVariancePaisa: 0,
          note: 'October 2026 accounts fully balanced and audited.',
        },
      },
      memberPaymentStatuses: {
        '2026-10': {
          'member-001': 'settled',
          'member-002': 'settled',
          'member-003': 'settled',
          'member-004': 'settled',
          'member-005': 'settled',
          'member-006': 'settled',
          'member-007': 'settled',
        },
      },

      isMonthClosed: (monthKey) => get().closedMonths.includes(monthKey),

      getClosingRecord: (monthKey) => get().closingRecords[monthKey],

      getMemberStatus: (monthKey, memberId) =>
        get().memberPaymentStatuses[monthKey]?.[memberId],

      setMemberPaymentStatus: (monthKey, memberId, status) =>
        set((s) => ({
          memberPaymentStatuses: {
            ...s.memberPaymentStatuses,
            [monthKey]: {
              ...(s.memberPaymentStatuses[monthKey] ?? {}),
              [memberId]: status,
            },
          },
        })),

      closeMonth: (monthKey, record) =>
        set((s) => {
          const newClosed = s.closedMonths.includes(monthKey)
            ? s.closedMonths
            : [...s.closedMonths, monthKey];

          const newRecord: MonthClosingRecord = {
            ...record,
            monthKey,
            closedAt: new Date().toISOString(),
          };

          return {
            closedMonths: newClosed,
            closingRecords: {
              ...s.closingRecords,
              [monthKey]: newRecord,
            },
          };
        }),

      reopenMonth: (monthKey) =>
        set((s) => {
          const nextRecords = { ...s.closingRecords };
          delete nextRecords[monthKey];
          return {
            closedMonths: s.closedMonths.filter((m) => m !== monthKey),
            closingRecords: nextRecords,
          };
        }),
    }),
    {
      name: 'messhisab-settlements',
    },
  ),
);

