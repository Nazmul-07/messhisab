'use client';

import Link from 'next/link';
import {
  User,
  LogOut,
  Moon,
  Sun,
  Monitor,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/stores/app.store';
import { toast } from 'sonner';

export function ProfileDropdown() {
  const { theme, setTheme } = useAppStore();

  const handleSignOut = () => {
    toast.info('Logged out from MessHisab admin session');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-muted/60 transition-colors border border-transparent hover:border-border text-left outline-none cursor-pointer"
        aria-label="User profile menu"
      >
        <div className="relative">
          <Avatar className="size-7 ring-2 ring-primary/30">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              NH
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 ring-1 ring-background" />
        </div>
        <div className="hidden lg:flex flex-col min-w-0">
          <span className="text-xs font-semibold text-foreground leading-tight">
            Md Nazmul Hosen
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">
            Admin
          </span>
        </div>
        <ChevronDown className="size-3 text-muted-foreground hidden sm:block ml-0.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1">
        <DropdownMenuLabel className="p-2">
          <div className="flex items-start gap-2.5">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                NH
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-foreground truncate">
                  Md Nazmul Hosen
                </span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-primary/30 text-primary">
                  Admin
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground truncate">
                nazmulhosen@gmail.com
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer py-1.5">
            <Link href="/settings" className="flex items-center gap-2 w-full text-xs">
              <User className="size-3.5 text-muted-foreground" />
              <span>Profile Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer py-1.5">
            <Link href="/settings" className="flex items-center gap-2 w-full text-xs">
              <Building2 className="size-3.5 text-muted-foreground" />
              <span>Workspace Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-[10px] uppercase font-semibold text-muted-foreground px-2 py-1">
          Theme Preference
        </DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-1 px-1 py-1">
          <Button
            variant={theme === 'light' ? 'default' : 'ghost'}
            size="xs"
            onClick={() => setTheme('light')}
            className="text-[11px] gap-1 h-6"
          >
            <Sun className="size-3" /> Light
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'ghost'}
            size="xs"
            onClick={() => setTheme('dark')}
            className="text-[11px] gap-1 h-6"
          >
            <Moon className="size-3" /> Dark
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'ghost'}
            size="xs"
            onClick={() => setTheme('system')}
            className="text-[11px] gap-1 h-6"
          >
            <Monitor className="size-3" /> Auto
          </Button>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive cursor-pointer py-1.5 text-xs gap-2"
        >
          <LogOut className="size-3.5" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

