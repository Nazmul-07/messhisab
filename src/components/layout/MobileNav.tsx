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
  Building2,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useAppStore } from '@/stores/app.store';
import { useMembersStore } from '@/stores/members.store';
import { mockWorkspaces } from '@/data/mess';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { activeWorkspaceId, theme, setTheme } = useAppStore();
  const { members } = useMembersStore();
  const activeCount = members.filter((m) => m.status === 'active').length;

  const currentWorkspace =
    mockWorkspaces.find((w) => w.id === activeWorkspaceId) ?? mockWorkspaces[0];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="p-0 w-72 bg-sidebar border-sidebar-border flex flex-col justify-between">
        <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>

        <div>
          {/* Brand header */}
          <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground font-black text-sm shrink-0 shadow-sm shadow-primary/30">
              <span className="font-mono text-base font-extrabold">৳</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-sidebar-foreground leading-none">
                MessHisab
              </span>
              <span className="text-[10px] text-muted-foreground leading-none mt-0.5 font-medium">
                Smart Mess & Expense
              </span>
            </div>
          </div>

          {/* Active workspace indicator */}
          <div className="p-3 mx-2 my-2 rounded-lg bg-sidebar-accent/50 border border-sidebar-border/70 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="size-4 text-primary shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-sidebar-foreground truncate">
                  {currentWorkspace.name}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {currentWorkspace.address}
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/30 text-primary shrink-0">
              {currentWorkspace.memberCount} members
            </Badge>
          </div>

          {/* Navigation links */}
          <nav className="overflow-y-auto py-2 px-2 space-y-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              const currentBadge = href === '/members' ? String(activeCount) : badge;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center justify-between h-9 px-3 rounded-lg text-xs font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/25'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="size-4 shrink-0" />
                    <span>{label}</span>
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
        </div>

        {/* Mobile footer with theme switch */}
        <div className="p-3 border-t border-sidebar-border/80 bg-sidebar/50 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Theme</span>
            <div className="flex items-center gap-1">
              <Button
                variant={theme === 'light' ? 'default' : 'ghost'}
                size="icon-xs"
                onClick={() => setTheme('light')}
                className="size-6"
                aria-label="Light mode"
              >
                <Sun className="size-3" />
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'ghost'}
                size="icon-xs"
                onClick={() => setTheme('dark')}
                className="size-6"
                aria-label="Dark mode"
              >
                <Moon className="size-3" />
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'ghost'}
                size="icon-xs"
                onClick={() => setTheme('system')}
                className="size-6"
                aria-label="System mode"
              >
                <Monitor className="size-3" />
              </Button>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground/80 px-1 font-mono flex justify-between">
            <span>Currency: BDT (৳)</span>
            <span>Asia/Dhaka (GMT+6)</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
