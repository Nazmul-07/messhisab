// ============================================================
// MessHisab — Financial Calculation Functions
// (Pure functions — no React, no side effects)
// ============================================================

import type {
  BazarEntry,
  Deposit,
  Expense,
  MealRecord,
  Member,
  MemberMealSummary,
  MemberSettlement,
  MonthlyStats,
  SelectedMonth,
} from './types';
import { addPaisa, distributePaisaEqually, dividePaisa } from './currency';

// ─── Date Helpers ─────────────────────────────────────────────

function isSameMonth(dateStr: string, year: number, month: number): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

// ─── Meal Calculations ────────────────────────────────────────

/** Sum all meal units for a member in a given month */
export function getMemberMealSummary(
  records: MealRecord[],
  memberId: string,
  { year, month }: SelectedMonth,
): MemberMealSummary {
  const monthRecords = records.filter(
    (r) => r.memberId === memberId && isSameMonth(r.date, year, month),
  );

  let breakfast = 0, lunch = 0, dinner = 0;
  for (const r of monthRecords) {
    breakfast += r.breakfast;
    lunch += r.lunch;
    dinner += r.dinner;
  }

  return {
    memberId,
    breakfastCount: breakfast,
    lunchCount: lunch,
    dinnerCount: dinner,
    totalMeals: breakfast + lunch + dinner,
  };
}

/** Get total meals for all members in a month */
export function getTotalMeals(
  records: MealRecord[],
  { year, month }: SelectedMonth,
): number {
  return records
    .filter((r) => isSameMonth(r.date, year, month))
    .reduce((sum, r) => sum + r.breakfast + r.lunch + r.dinner, 0);
}

// ─── Bazar Calculations ───────────────────────────────────────

/** Get total bazar cost for a month (paisa) */
export function getTotalBazarCost(
  entries: BazarEntry[],
  { year, month }: SelectedMonth,
): number {
  return entries
    .filter((e) => isSameMonth(e.date, year, month))
    .reduce((sum, e) => addPaisa(sum, e.amountPaisa), 0);
}

// ─── Expense Calculations ─────────────────────────────────────

/** Get total shared expenses for a month (paisa) */
export function getTotalExpenses(
  expenses: Expense[],
  { year, month }: SelectedMonth,
): number {
  return expenses
    .filter((e) => isSameMonth(e.date, year, month))
    .reduce((sum, e) => addPaisa(sum, e.amountPaisa), 0);
}

/** Allocate an expense to members based on allocation method */
export function allocateExpense(
  expense: Expense,
  activeMembers: Member[],
  mealSummaries: MemberMealSummary[],
): Record<string, number> {
  const memberIds = activeMembers.map((m) => m.id);

  if (expense.allocationMethod === 'equal') {
    const shares = distributePaisaEqually(expense.amountPaisa, memberIds.length);
    return Object.fromEntries(memberIds.map((id, i) => [id, shares[i]]));
  }

  if (expense.allocationMethod === 'meal_based') {
    const totalMeals = mealSummaries.reduce((s, ms) => s + ms.totalMeals, 0);
    if (totalMeals === 0) {
      // Fall back to equal split
      const shares = distributePaisaEqually(expense.amountPaisa, memberIds.length);
      return Object.fromEntries(memberIds.map((id, i) => [id, shares[i]]));
    }
    const rawAllocations = mealSummaries.map((ms) => ({
      memberId: ms.memberId,
      share: dividePaisa(expense.amountPaisa * ms.totalMeals, totalMeals),
    }));
    // Fix rounding remainder on first member
    const allocatedTotal = rawAllocations.reduce((s, a) => s + a.share, 0);
    const remainder = expense.amountPaisa - allocatedTotal;
    if (rawAllocations.length > 0) rawAllocations[0].share += remainder;
    return Object.fromEntries(rawAllocations.map((a) => [a.memberId, a.share]));
  }

  if (expense.allocationMethod === 'custom' && expense.customAllocations) {
    return expense.customAllocations;
  }

  return {};
}

// ─── Deposit Calculations ─────────────────────────────────────

/** Get total deposits for a month per member */
export function getMemberDeposits(
  deposits: Deposit[],
  memberId: string,
  { year, month }: SelectedMonth,
): number {
  return deposits
    .filter((d) => d.memberId === memberId && isSameMonth(d.date, year, month))
    .reduce((sum, d) => addPaisa(sum, d.amountPaisa), 0);
}

/** Get total deposits for a month */
export function getTotalDeposits(
  deposits: Deposit[],
  { year, month }: SelectedMonth,
): number {
  return deposits
    .filter((d) => isSameMonth(d.date, year, month))
    .reduce((sum, d) => addPaisa(sum, d.amountPaisa), 0);
}

// ─── Meal Rate ────────────────────────────────────────────────

/**
 * Meal Rate = Total Bazar Cost / Total Meals (paisa per meal unit)
 * Rent and utilities are NOT included.
 */
export function calculateMealRate(
  totalBazarCostPaisa: number,
  totalMeals: number,
): number {
  return dividePaisa(totalBazarCostPaisa, totalMeals);
}

// ─── Settlement ───────────────────────────────────────────────

/**
 * Full settlement calculation for a member in a given month.
 *
 * Net Balance = Total Cost − Total Credit
 *   (+) = member owes money (payable)
 *   (−) = member is owed money (receivable)
 */
export function calculateMemberSettlement(
  member: Member,
  mealSummary: MemberMealSummary,
  mealRatePaisa: number,
  expenses: Expense[],
  deposits: Deposit[],
  bazarEntries: BazarEntry[],
  activeMembers: Member[],
  allMealSummaries: MemberMealSummary[],
  selectedMonth: SelectedMonth,
): MemberSettlement {
  // 1. Meal cost
  const mealCostPaisa = Math.round(mealSummary.totalMeals * mealRatePaisa);

  // 2. Allocated shared expenses
  const monthExpenses = expenses.filter((e) =>
    isSameMonth(e.date, selectedMonth.year, selectedMonth.month),
  );
  let sharedExpensesPaisa = 0;
  for (const expense of monthExpenses) {
    const allocations = allocateExpense(expense, activeMembers, allMealSummaries);
    sharedExpensesPaisa += allocations[member.id] ?? 0;
  }

  const totalCostPaisa = mealCostPaisa + sharedExpensesPaisa;

  // 3. Credits: deposits
  const depositsPaisa = getMemberDeposits(deposits, member.id, selectedMonth);

  // 4. Credits: member-paid bazar (personal payment source)
  const memberPaidBazarPaisa = bazarEntries
    .filter(
      (e) =>
        e.paidByMemberId === member.id &&
        e.paymentSource === 'personal' &&
        isSameMonth(e.date, selectedMonth.year, selectedMonth.month),
    )
    .reduce((sum, e) => addPaisa(sum, e.amountPaisa), 0);

  // 5. Credits: member-paid expenses (personal payment source)
  const memberPaidExpensesPaisa = monthExpenses
    .filter(
      (e) => e.paidByMemberId === member.id && e.paymentSource === 'personal',
    )
    .reduce((sum, e) => addPaisa(sum, e.amountPaisa), 0);

  const memberPaidTotal = memberPaidBazarPaisa + memberPaidExpensesPaisa;
  const totalCreditPaisa = depositsPaisa + memberPaidTotal;

  const netBalancePaisa = totalCostPaisa - totalCreditPaisa;

  let status: MemberSettlement['status'] = 'pending';
  if (netBalancePaisa === 0) status = 'settled';
  else if (Math.abs(netBalancePaisa) < totalCostPaisa * 0.5) status = 'partial';

  return {
    memberId: member.id,
    totalMeals: mealSummary.totalMeals,
    mealCostPaisa,
    sharedExpensesPaisa,
    totalCostPaisa,
    depositsPaisa,
    memberPaidExpensesPaisa: memberPaidTotal,
    totalCreditPaisa,
    netBalancePaisa,
    status,
  };
}

// ─── Monthly Stats ────────────────────────────────────────────

export function calculateMonthlyStats(
  bazarEntries: BazarEntry[],
  expenses: Expense[],
  deposits: Deposit[],
  mealRecords: MealRecord[],
  activeMembers: Member[],
  selectedMonth: SelectedMonth,
): MonthlyStats {
  const totalBazarCostPaisa = getTotalBazarCost(bazarEntries, selectedMonth);
  const totalOtherExpensesPaisa = getTotalExpenses(expenses, selectedMonth);
  const totalDepositsPaisa = getTotalDeposits(deposits, selectedMonth);
  const totalMeals = getTotalMeals(mealRecords, selectedMonth);
  const mealRatePaisa = calculateMealRate(totalBazarCostPaisa, totalMeals);

  return {
    year: selectedMonth.year,
    month: selectedMonth.month,
    totalBazarCostPaisa,
    totalOtherExpensesPaisa,
    totalDepositsPaisa,
    totalMeals,
    mealRatePaisa,
    activeMembersCount: activeMembers.filter((m) => m.status === 'active').length,
  };
}

// ─── Settlement Audit & Rounding Reconciliation ────────────────

export interface SettlementAudit {
  totalPayablePaisa: number;
  totalReceivablePaisa: number;
  totalMealCostChargedPaisa: number;
  totalSharedExpensesChargedPaisa: number;
  totalMemberChargesPaisa: number;
  totalDepositsPaisa: number;
  totalMemberAdvancesPaisa: number;
  totalCreditsPaisa: number;
  netEquilibriumPaisa: number;
  roundingVariancePaisa: number;
}

export function calculateSettlementAudit(
  settlements: MemberSettlement[],
  totalBazarCostPaisa: number,
  totalOtherExpensesPaisa: number,
): SettlementAudit {
  let totalPayablePaisa = 0;
  let totalReceivablePaisa = 0;
  let totalMealCostChargedPaisa = 0;
  let totalSharedExpensesChargedPaisa = 0;
  let totalMemberChargesPaisa = 0;
  let totalDepositsPaisa = 0;
  let totalMemberAdvancesPaisa = 0;
  let totalCreditsPaisa = 0;
  let netEquilibriumPaisa = 0;

  for (const s of settlements) {
    if (s.netBalancePaisa > 0) {
      totalPayablePaisa += s.netBalancePaisa;
    } else if (s.netBalancePaisa < 0) {
      totalReceivablePaisa += Math.abs(s.netBalancePaisa);
    }
    totalMealCostChargedPaisa += s.mealCostPaisa;
    totalSharedExpensesChargedPaisa += s.sharedExpensesPaisa;
    totalMemberChargesPaisa += s.totalCostPaisa;
    totalDepositsPaisa += s.depositsPaisa;
    totalMemberAdvancesPaisa += s.memberPaidExpensesPaisa;
    totalCreditsPaisa += s.totalCreditPaisa;
    netEquilibriumPaisa += s.netBalancePaisa;
  }

  const actualExpenditurePaisa = totalBazarCostPaisa + totalOtherExpensesPaisa;
  const roundingVariancePaisa = actualExpenditurePaisa - totalMemberChargesPaisa;

  return {
    totalPayablePaisa,
    totalReceivablePaisa,
    totalMealCostChargedPaisa,
    totalSharedExpensesChargedPaisa,
    totalMemberChargesPaisa,
    totalDepositsPaisa,
    totalMemberAdvancesPaisa,
    totalCreditsPaisa,
    netEquilibriumPaisa,
    roundingVariancePaisa,
  };
}


