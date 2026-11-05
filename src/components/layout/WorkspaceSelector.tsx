'use client';

import { useState } from 'react';
import {
  Building2,
  Check,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { mockWorkspaces, type WorkspaceItem } from '@/data/mess';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface WorkspaceSelectorProps {
  collapsed?: boolean;
}

export function WorkspaceSelector({ collapsed = false }: WorkspaceSelectorProps) {
  const { activeWorkspaceId, setActiveWorkspaceId } = useAppStore();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>(mockWorkspaces);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newMessName, setNewMessName] = useState('');
  const [newMessAddress, setNewMessAddress] = useState('');

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];

  const handleSelectWorkspace = (workspace: WorkspaceItem) => {
    setActiveWorkspaceId(workspace.id);
    toast.success(`Switched to workspace: ${workspace.name}`);
  };

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessName.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    const newWs: WorkspaceItem = {
      id: `mess-00${workspaces.length + 1}`,
      name: newMessName.trim(),
      address: newMessAddress.trim() || 'Dhaka, Bangladesh',
      currency: 'BDT',
      timezone: 'Asia/Dhaka',
      createdAt: '2026-11-05',
      adminId: 'member-001',
      memberCount: 1,
      role: 'admin',
    };

    setWorkspaces((prev) => [...prev, newWs]);
    setActiveWorkspaceId(newWs.id);
    setNewMessName('');
    setNewMessAddress('');
    setCreateDialogOpen(false);
    toast.success(`Created workspace: ${newWs.name}`);
  };

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center justify-center size-9 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-xs hover:bg-primary/20 transition-colors cursor-pointer outline-none"
          title={activeWorkspace.name}
          aria-label={activeWorkspace.name}
        >
          {activeWorkspace.name.substring(0, 2).toUpperCase()}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Switch Workspace
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.map((ws) => (
            <DropdownMenuItem
              key={ws.id}
              onClick={() => handleSelectWorkspace(ws)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-medium text-sm truncate">{ws.name}</span>
                <span className="text-[11px] text-muted-foreground truncate">{ws.address}</span>
              </div>
              {ws.id === activeWorkspace.id && (
                <Check className="size-4 text-primary shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setCreateDialogOpen(true)}
            className="text-primary cursor-pointer gap-2"
          >
            <Plus className="size-4" /> Create Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors border border-sidebar-border bg-sidebar-accent/30 text-left outline-none cursor-pointer"
          aria-label="Select mess workspace"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center size-8 rounded-md bg-primary text-primary-foreground font-bold text-xs shrink-0 shadow-sm shadow-primary/20">
              <Building2 className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-xs text-foreground truncate leading-tight">
                {activeWorkspace.name}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-muted-foreground truncate max-w-[110px]">
                  {activeWorkspace.address}
                </span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-primary/30 text-primary">
                  {activeWorkspace.memberCount}
                </Badge>
              </div>
            </div>
          </div>
          <ChevronDown className="size-3.5 text-muted-foreground shrink-0 ml-1" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Your Mess Workspaces
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.map((ws) => (
            <DropdownMenuItem
              key={ws.id}
              onClick={() => handleSelectWorkspace(ws)}
              className="flex items-center justify-between cursor-pointer py-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-6 rounded bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                  {ws.name[0]}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-xs truncate leading-none">{ws.name}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[140px]">
                    {ws.address}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                  {ws.memberCount}m
                </Badge>
                {ws.id === activeWorkspace.id && (
                  <Check className="size-3.5 text-primary" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setCreateDialogOpen(true)}
            className="text-primary cursor-pointer gap-2 py-2"
          >
            <Plus className="size-4" /> Add New Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Mess Workspace</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateWorkspace} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Mess / Household Name *</Label>
              <Input
                id="ws-name"
                placeholder="e.g. Dhanmondi Lake View Mess"
                value={newMessName}
                onChange={(e) => setNewMessName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-address">Address *</Label>
              <Input
                id="ws-address"
                placeholder="e.g. House 12, Road 4, Dhanmondi, Dhaka"
                value={newMessAddress}
                onChange={(e) => setNewMessAddress(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Workspace</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

