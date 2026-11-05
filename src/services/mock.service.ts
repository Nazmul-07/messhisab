// ============================================================
// MessHisab — Mock Services Implementation
// Implements IMemberService, IBazarService, etc.
// ============================================================

import type {
  IBazarService,
  IMemberService,
  IReportService,
} from './interfaces';
import type {
  BazarEntry,
  Member,
  MemberSettlement,
  MonthlyStats,
  SelectedMonth,
  Transaction,
} from '@/lib/types';
import { mockMembers } from '@/data/members';
import { mockBazarEntries } from '@/data/bazar';
import { mockMealRecords } from '@/data/meals';
import { mockDeposits } from '@/data/deposits';
import { mockExpenses } from '@/data/expenses';
import { dateInMonth } from '@/lib/date-utils';
import {
  calculateMonthlyStats,
  calculateMemberSettlement,
  getMemberMealSummary,
} from '@/lib/calculations';

export class MockMemberService implements IMemberService {
  private members = [...mockMembers];

  async getAllMembers(): Promise<Member[]> {
    return [...this.members];
  }

  async getMemberById(id: string): Promise<Member | null> {
    return this.members.find((m) => m.id === id) ?? null;
  }

  async createMember(data: Omit<Member, 'id' | 'joinedAt'>): Promise<Member> {
    const newMember: Member = {
      ...data,
      id: `member-${Date.now()}`,
      joinedAt: new Date().toISOString().split('T')[0],
    };
    this.members.push(newMember);
    return newMember;
  }

  async updateMember(id: string, updates: Partial<Member>): Promise<Member> {
    const idx = this.members.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Member not found');
    this.members[idx] = { ...this.members[idx], ...updates };
    return this.members[idx];
  }

  async deactivateMember(id: string): Promise<void> {
    await this.updateMember(id, {
      status: 'inactive',
      leftAt: new Date().toISOString().split('T')[0],
    });
  }

  async activateMember(id: string): Promise<void> {
    await this.updateMember(id, {
      status: 'active',
      leftAt: undefined,
    });
  }

  async deleteMember(id: string): Promise<void> {
    this.members = this.members.filter((m) => m.id !== id);
  }
}

export class MockBazarService implements IBazarService {
  private entries = [...mockBazarEntries];

  async getBazarEntries(month?: SelectedMonth): Promise<BazarEntry[]> {
    if (!month) return [...this.entries];
    return this.entries.filter((e) => dateInMonth(e.date, month));
  }

  async createBazarEntry(data: Omit<BazarEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<BazarEntry> {
    const newEntry: BazarEntry = {
      ...data,
      id: `bazar-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.entries.unshift(newEntry);
    return newEntry;
  }

  async updateBazarEntry(id: string, data: Partial<BazarEntry>): Promise<BazarEntry> {
    const idx = this.entries.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Bazar entry not found');
    this.entries[idx] = {
      ...this.entries[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.entries[idx];
  }

  async deleteBazarEntry(id: string): Promise<void> {
    this.entries = this.entries.filter((e) => e.id !== id);
  }
}

export class MockReportService implements IReportService {
  constructor(
    private memberService: IMemberService,
    private bazarService: IBazarService,
  ) {}

  async getMonthlyStats(month: SelectedMonth): Promise<MonthlyStats> {
    const members = await this.memberService.getAllMembers();
    const active = members.filter((m) => m.status === 'active');
    const bazar = await this.bazarService.getBazarEntries(month);
    return calculateMonthlyStats(bazar, mockExpenses, mockDeposits, mockMealRecords, active, month);
  }

  async getMonthlySettlements(month: SelectedMonth): Promise<MemberSettlement[]> {
    const members = await this.memberService.getAllMembers();
    const active = members.filter((m) => m.status === 'active');
    const bazar = await this.bazarService.getBazarEntries(month);
    const stats = calculateMonthlyStats(bazar, mockExpenses, mockDeposits, mockMealRecords, active, month);

    const mealSummaries = active.map((m) => getMemberMealSummary(mockMealRecords, m.id, month));

    return active.map((m) =>
      calculateMemberSettlement(
        m,
        mealSummaries.find((s) => s.memberId === m.id)!,
        stats.mealRatePaisa,
        mockExpenses,
        mockDeposits,
        bazar,
        active,
        mealSummaries,
        month,
      ),
    );
  }

  async getTransactions(month: SelectedMonth): Promise<Transaction[]> {
    const bazar = await this.bazarService.getBazarEntries(month);
    const list: Transaction[] = [];

    for (const b of bazar) {
      list.push({
        id: b.id,
        messId: b.messId,
        type: 'bazar',
        description: b.items,
        amountPaisa: b.amountPaisa,
        date: b.date,
        memberId: b.paidByMemberId,
        paymentSource: b.paymentSource,
      });
    }

    for (const d of mockDeposits) {
      if (dateInMonth(d.date, month)) {
        list.push({
          id: d.id,
          messId: d.messId,
          type: 'deposit',
          description: `Deposit via ${d.paymentMethod}`,
          amountPaisa: d.amountPaisa,
          date: d.date,
          memberId: d.memberId,
        });
      }
    }

    for (const e of mockExpenses) {
      if (dateInMonth(e.date, month)) {
        list.push({
          id: e.id,
          messId: e.messId,
          type: 'expense',
          description: e.description,
          amountPaisa: e.amountPaisa,
          date: e.date,
          memberId: e.paidByMemberId,
          paymentSource: e.paymentSource,
        });
      }
    }

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }
}

export const memberService = new MockMemberService();
export const bazarService = new MockBazarService();
export const reportService = new MockReportService(memberService, bazarService);

