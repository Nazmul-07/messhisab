// ============================================================
// MessHisab — Centralized TypeScript Types
// ============================================================

// ─── Enums ───────────────────────────────────────────────────

export type MemberStatus = 'active' | 'inactive' | 'suspended';
export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank_transfer';
export type PaymentSource = 'personal' | 'cashbox';
export type MealType = 'breakfast' | 'lunch' | 'dinner';
export type MealUnit = 0 | 0.5 | 1; // 0=no meal, 0.5=half, 1=full
export type ExpenseCategory =
  | 'rent'
  | 'electricity'
  | 'gas'
  | 'wifi'
  | 'water'
  | 'cleaning'
  | 'other';
export type AllocationMethod = 'equal' | 'meal_based' | 'custom';
export type TransactionType = 'bazar' | 'deposit' | 'expense' | 'settlement';
export type SettlementStatus = 'pending' | 'settled' | 'partial';

// ─── Core Entities ───────────────────────────────────────────

export interface Mess {
  id: string;
  name: string;
  address: string;
  currency: 'BDT';
  timezone: 'Asia/Dhaka';
  createdAt: string; // ISO date
  adminId: string;
}

export interface Member {
  id: string;
  messId: string;
  name: string;
  email: string;
  phone?: string;
  avatarInitials: string;
  avatarColor: string;
  role: 'admin' | 'member';
  status: MemberStatus;
  joinedAt: string; // ISO date
  leftAt?: string;  // ISO date
}

export interface BazarEntry {
  id: string;
  messId: string;
  date: string;         // YYYY-MM-DD
  items: string;        // description
  amountPaisa: number;  // integer paisa
  paidByMemberId: string;
  paymentSource: PaymentSource;
  note?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealRecord {
  id: string;
  messId: string;
  date: string;         // YYYY-MM-DD
  memberId: string;
  breakfast: MealUnit;
  lunch: MealUnit;
  dinner: MealUnit;
  createdAt: string;
  updatedAt: string;
}

export interface Deposit {
  id: string;
  messId: string;
  memberId: string;
  amountPaisa: number;  // integer paisa
  paymentMethod: PaymentMethod;
  date: string;         // YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  messId: string;
  category: ExpenseCategory;
  description: string;
  amountPaisa: number;    // integer paisa
  date: string;           // YYYY-MM-DD
  paidByMemberId?: string; // null = paid from cashbox
  paymentSource: PaymentSource;
  allocationMethod: AllocationMethod;
  customAllocations?: Record<string, number>; // memberId -> paisa
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  messId: string;
  type: TransactionType;
  description: string;
  amountPaisa: number;
  date: string;
  memberId?: string;
  paymentSource?: PaymentSource;
  referenceId?: string; // links to bazar/deposit/expense id
}

// ─── Computed / Derived Types ─────────────────────────────────

export interface MemberMealSummary {
  memberId: string;
  totalMeals: number;    // sum of all meal units
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
}

export interface MonthlyStats {
  year: number;
  month: number; // 1-12
  totalBazarCostPaisa: number;
  totalOtherExpensesPaisa: number;
  totalDepositsPaisa: number;
  totalMeals: number;
  mealRatePaisa: number;    // paisa per meal unit
  activeMembersCount: number;
}

export interface MemberSettlement {
  memberId: string;
  totalMeals: number;
  mealCostPaisa: number;
  sharedExpensesPaisa: number;
  totalCostPaisa: number;
  depositsPaisa: number;
  memberPaidExpensesPaisa: number;
  totalCreditPaisa: number;
  netBalancePaisa: number; // positive = payable, negative = receivable
  status: SettlementStatus;
}

export interface DailyMealSummary {
  date: string;
  totalMeals: number;
  memberMeals: Record<string, number>; // memberId -> meal units
}

// ─── UI State Types ───────────────────────────────────────────

export interface SelectedMonth {
  year: number;
  month: number; // 1-12
}

export interface FilterState {
  search: string;
  memberId?: string;
  dateFrom?: string;
  dateTo?: string;
}

