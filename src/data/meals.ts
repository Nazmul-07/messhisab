// ============================================================
// MessHisab — Mock Meal Records (October + November 2026)
// 7 active members, 30 days, breakfast/lunch/dinner
// ============================================================

import type { MealRecord } from '@/lib/types';

const MEAL_MEMBER_IDS = [
  'member-001',
  'member-002',
  'member-003',
  'member-004',
  'member-005',
  'member-006',
  'member-007',
];

type MealPattern = { b: 0 | 0.5 | 1; l: 0 | 0.5 | 1; d: 0 | 0.5 | 1 };

// Realistic varied patterns per member per day
const patterns: MealPattern[] = [
  { b: 1, l: 1, d: 1 },   // full day
  { b: 0, l: 1, d: 1 },   // skip breakfast
  { b: 1, l: 0, d: 1 },   // skip lunch
  { b: 0, l: 0, d: 1 },   // only dinner
  { b: 1, l: 1, d: 0 },   // skip dinner
  { b: 0.5, l: 1, d: 1 }, // half breakfast
  { b: 1, l: 0.5, d: 1 }, // half lunch
  { b: 0, l: 0, d: 0 },   // absent
  { b: 1, l: 1, d: 0.5 }, // half dinner
];

// Deterministic pattern selector for reproducible data
function getPattern(memberIndex: number, dayIndex: number): MealPattern {
  const seed = (memberIndex * 7 + dayIndex * 3) % patterns.length;
  return patterns[seed];
}

let recordId = 1;

function generateMealRecords(year: number, month: number, daysInMonth: number): MealRecord[] {
  const records: MealRecord[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    MEAL_MEMBER_IDS.forEach((memberId, memberIndex) => {
      const p = getPattern(memberIndex, day);
      records.push({
        id: `meal-${String(recordId++).padStart(4, '0')}`,
        messId: 'mess-001',
        date: dateStr,
        memberId,
        breakfast: p.b,
        lunch: p.l,
        dinner: p.d,
        createdAt: `${dateStr}T22:00:00Z`,
        updatedAt: `${dateStr}T22:00:00Z`,
      });
    });
  }
  return records;
}

const octRecords = generateMealRecords(2026, 10, 31);
const novRecords = generateMealRecords(2026, 11, 30); // 30 days of records

export const mockMealRecords: MealRecord[] = [...octRecords, ...novRecords];

