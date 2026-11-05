// ============================================================
// MessHisab — Application Constants
// ============================================================

export const APP_NAME = 'MessHisab';
export const APP_TAGLINE = 'Smart Mess & Expense Management';

export const CURRENCY_SYMBOL = '৳';
export const CURRENCY_CODE = 'BDT';
export const TIMEZONE = 'Asia/Dhaka';
export const PAISA_PER_TAKA = 100;

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;

export const PAYMENT_METHODS = {
  cash: 'Cash',
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  bank_transfer: 'Bank Transfer',
} as const;

export const PAYMENT_SOURCES = {
  personal: 'Personal',
  cashbox: 'Cashbox',
} as const;

export const EXPENSE_CATEGORIES = {
  rent: 'Rent',
  electricity: 'Electricity',
  gas: 'Gas',
  wifi: 'WiFi',
  water: 'Water',
  cleaning: 'Cleaning',
  other: 'Other',
} as const;

export const ALLOCATION_METHODS = {
  equal: 'Equal Split',
  meal_based: 'Meal-Based',
  custom: 'Custom',
} as const;

export const MEMBER_STATUSES = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
} as const;

export const AVATAR_COLORS = [
  '#06B6D4', // cyan
  '#8B5CF6', // violet
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#3B82F6', // blue
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
] as const;

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/members', label: 'Members', icon: 'Users' },
  { href: '/bazar', label: 'Bazar', icon: 'ShoppingBasket' },
  { href: '/meals', label: 'Meals', icon: 'UtensilsCrossed' },
  { href: '/deposits', label: 'Deposits', icon: 'Wallet' },
  { href: '/expenses', label: 'Expenses', icon: 'Receipt' },
  { href: '/transactions', label: 'Transactions', icon: 'ArrowLeftRight' },
  { href: '/reports', label: 'Reports', icon: 'BarChart3' },
  { href: '/settlements', label: 'Settlements', icon: 'Scale' },
  { href: '/settings', label: 'Settings', icon: 'Settings' },
] as const;

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

