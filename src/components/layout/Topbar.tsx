'use client';

import { useState } from 'react';
import { Menu, Bell, Sun, Moon, Monitor } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/stores/app.store';
import { MobileNav } from './MobileNav';
import { MonthSelector } from '@/components/shared/MonthSelector';
import { Breadcrumbs } from './Breadcrumbs';
import { ProfileDropdown } from './ProfileDropdown';
import { cn } from '@/lib/utils';

export function Topbar() {
  const { theme, setTheme } = useAppStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <>
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/85 backdrop-blur-md px-4 sm:px-6">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden shrink-0"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open mobile navigation"
          >
            <Menu className="size-4" />
          </Button>

          <div className="min-w-0">
            <Breadcrumbs />
          </div>
        </div>

        {/* Right: Actions, Month Picker, Theme, Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Month selector */}
          <div className="hidden sm:block">
            <MonthSelector />
          </div>

          <div className="h-4 w-px bg-border/70 hidden sm:block" />

          {/* Theme switcher dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Change theme"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                'text-muted-foreground hover:text-foreground cursor-pointer'
              )}
            >
              <ThemeIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer text-xs">
                <Sun className="size-3.5 mr-2" /> Light Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer text-xs">
                <Moon className="size-3.5 mr-2" /> Dark Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer text-xs">
                <Monitor className="size-3.5 mr-2" /> System Sync
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Notifications"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                'relative text-muted-foreground hover:text-foreground cursor-pointer'
              )}
            >
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs font-semibold text-foreground">Notifications</span>
                <span className="text-[10px] text-primary font-medium cursor-pointer">Mark read</span>
              </div>
              <div className="p-3 text-center text-xs text-muted-foreground">
                All settlements & meal logs are up to date.
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-4 w-px bg-border/70" />

          {/* Profile Dropdown */}
          <ProfileDropdown />
        </div>
      </header>
    </>
  );
}
