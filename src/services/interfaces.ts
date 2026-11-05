// ============================================================
// MessHisab — Service Interfaces
// Designed for seamless swapping between Mock & Real APIs
// ============================================================

import type {
  BazarEntry,
  Deposit,
  Expense,
  MealRecord,
  Member,
  MemberSettlement,
  MonthlyStats,
  SelectedMonth,
  Transaction,
} from '@/lib/types';

export interface IMemberService {
  getAllMembers(): Promise<Member[]>;
  getMemberById(id: string): Promise<Member | null>;
  createMember(data: Omit<Member, 'id' | 'joinedAt'>): Promise<Member>;
  updateMember(id: string, updates: Partial<Member>): Promise<Member>;
  deactivateMember(id: string): Promise<void>;
  activateMember(id: string): Promise<void>;
  deleteMember(id: string): Promise<void>;
}

export interface IBazarService {
  getBazarEntries(month?: SelectedMonth): Promise<BazarEntry[]>;
  createBazarEntry(data: Omit<BazarEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<BazarEntry>;
  updateBazarEntry(id: string, data: Partial<BazarEntry>): Promise<BazarEntry>;
  deleteBazarEntry(id: string): Promise<void>;
}

export interface IMealService {
  getMealRecords(month: SelectedMonth): Promise<MealRecord[]>;
  upsertDailyMeal(record: Omit<MealRecord, 'createdAt' | 'updatedAt'>): Promise<MealRecord>;
  bulkUpsertMeals(records: MealRecord[]): Promise<MealRecord[]>;
}

export interface IDepositService {
  getDeposits(month?: SelectedMonth): Promise<Deposit[]>;
  createDeposit(data: Omit<Deposit, 'id' | 'createdAt'>): Promise<Deposit>;
  deleteDeposit(id: string): Promise<void>;
}

export interface IExpenseService {
  getExpenses(month?: SelectedMonth): Promise<Expense[]>;
  createExpense(data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense>;
  updateExpense(id: string, data: Partial<Expense>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;
}

export interface IReportService {
  getMonthlyStats(month: SelectedMonth): Promise<MonthlyStats>;
  getMonthlySettlements(month: SelectedMonth): Promise<MemberSettlement[]>;
  getTransactions(month: SelectedMonth): Promise<Transaction[]>;
}

