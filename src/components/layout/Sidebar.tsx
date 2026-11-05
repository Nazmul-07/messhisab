'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShoppingBasket,
  UtensilsCrossed,
  Wallet,
  Receipt,
  ArrowLeftRight,
  BarChart3,
  Scale,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app.store';
import { useMembersStore } from '@/stores/members.store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { WorkspaceSelector } from './WorkspaceSelector';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/bazar', label: 'Bazar', icon: ShoppingBasket },
  { href: '/meals', label: 'Meals', icon: UtensilsCrossed },
  { href: '/deposits', label: 'Deposits', icon: Wallet },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settlements', label: 'Settlements', icon: Scale },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const { members } = useMembersStore();
  const activeCount = members.filter((m) => m.status === 'active').length;

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out shrink-0 select-none z-20',
        sidebarOpen ? 'w-60' : 'w-16',
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-3.5 h-14 border-b border-sidebar-border shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground font-black text-sm shrink-0 shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform">
            <span className="font-mono text-base font-extrabold">৳</span>
          </div>
          {sidebarOpen && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-sidebar-foreground leading-none">
                  MessHisab
                </span>
                <span className="size-1.5 rounded-full bg-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground leading-none mt-0.5 font-medium">
                Smart Mess & Expense
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Workspace Selector Bar */}
      <div className="p-2 border-b border-sidebar-border/60">
        <WorkspaceSelector collapsed={!sidebarOpen} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          const currentBadge = href === '/members' ? String(activeCount) : badge;

          if (!sidebarOpen) {
            return (
              <Tooltip key={href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center justify-center size-10 rounded-lg transition-all relative group',
                        active
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/25'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      )}
                    >
                      <Icon className="size-4" />
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-primary-foreground" />
                      )}
                    </Link>
                  }
                />
                <TooltipContent side="right" className="text-xs font-medium">
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center justify-between h-9 px-3 rounded-lg text-xs font-medium transition-all group',
                active
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/25'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={cn('size-4 shrink-0 transition-transform group-hover:scale-105', active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                <span className="truncate">{label}</span>
              </div>
              {currentBadge && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold',
                    active
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {currentBadge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Collapse Bar */}
      <div className="p-2 border-t border-sidebar-border/80 flex items-center justify-between">
        {sidebarOpen && (
          <div className="flex items-center gap-1.5 px-2 text-[10px] text-muted-foreground font-mono">
            <span>BDT (৳)</span>
            <span>·</span>
            <span>Asia/Dhaka</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn('text-muted-foreground hover:text-foreground', !sidebarOpen && 'w-full')}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
