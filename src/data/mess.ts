// ============================================================
// MessHisab — Mock Workspaces Data
// ============================================================

import type { Mess } from '@/lib/types';

export interface WorkspaceItem extends Mess {
  memberCount: number;
  role: 'admin' | 'member';
}

export const mockWorkspaces: WorkspaceItem[] = [
  {
    id: 'mess-001',
    name: 'Dhaka Bachelor Mess',
    address: 'House 42, Road 11, Dhanmondi, Dhaka',
    currency: 'BDT',
    timezone: 'Asia/Dhaka',
    createdAt: '2024-01-01',
    adminId: 'member-001',
    memberCount: 8,
    role: 'admin',
  },
  {
    id: 'mess-002',
    name: 'Mirpur DOHS Flat 5A',
    address: 'Avenue 3, Mirpur DOHS, Dhaka',
    currency: 'BDT',
    timezone: 'Asia/Dhaka',
    createdAt: '2025-06-15',
    adminId: 'member-002',
    memberCount: 5,
    role: 'member',
  },
  {
    id: 'mess-003',
    name: 'Uttara Sector 7 Student Mess',
    address: 'Road 14, Sector 7, Uttara, Dhaka',
    currency: 'BDT',
    timezone: 'Asia/Dhaka',
    createdAt: '2025-11-01',
    adminId: 'member-001',
    memberCount: 6,
    role: 'admin',
  },
];

export const mockMess: Mess = mockWorkspaces[0];
