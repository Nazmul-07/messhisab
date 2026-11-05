'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMembersStore } from '@/stores/members.store';
import { AVATAR_COLORS } from '@/lib/constants';
import { todayString } from '@/lib/date-utils';
import type { Member } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const memberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'member']),
  status: z.enum(['active', 'inactive', 'suspended']),
  avatarColor: z.string().min(1, 'Color is required'),
  joinedAt: z.string().min(1, 'Joining date is required'),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member | null;
}

export function MemberFormDialog({ open, onOpenChange, member }: MemberFormDialogProps) {
  const { addMember, updateMember, members } = useMembersStore();
  const isEdit = !!member;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'member',
      status: 'active',
      avatarColor: AVATAR_COLORS[0],
      joinedAt: todayString(),
    },
  });

  const selectedColor = watch('avatarColor');
  const selectedRole = watch('role');
  const selectedStatus = watch('status');

  useEffect(() => {
    if (member) {
      reset({
        name: member.name,
        email: member.email,
        phone: member.phone ?? '',
        role: member.role,
        status: member.status,
        avatarColor: member.avatarColor,
        joinedAt: member.joinedAt,
      });
    } else {
      const colorIndex = members.length % AVATAR_COLORS.length;
      reset({
        name: '',
        email: '',
        phone: '',
        role: 'member',
        status: 'active',
        avatarColor: AVATAR_COLORS[colorIndex],
        joinedAt: todayString(),
      });
    }
  }, [member, open, members.length, reset]);

  const onSubmit = (data: MemberFormData) => {
    const initials = data.name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    if (isEdit && member) {
      updateMember(member.id, {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        role: data.role,
        status: data.status,
        avatarColor: data.avatarColor,
        avatarInitials: initials,
        joinedAt: data.joinedAt,
      });
      toast.success(`${data.name}'s details updated`);
    } else {
      const newId = `member-${String(Date.now()).slice(-4)}`;
      addMember({
        id: newId,
        messId: 'mess-001',
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        avatarInitials: initials,
        avatarColor: data.avatarColor,
        role: data.role,
        status: data.status,
        joinedAt: data.joinedAt,
      });
      toast.success(`${data.name} added to the mess`);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Member Profile' : 'Add New Member'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="member-name">Full Name *</Label>
            <Input
              id="member-name"
              placeholder="e.g. Rafiqul Islam"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="member-email">Email Address *</Label>
            <Input
              id="member-email"
              type="email"
              placeholder="e.g. rafiq@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="member-phone">Phone Number</Label>
            <Input
              id="member-phone"
              placeholder="e.g. 01711-234567"
              {...register('phone')}
            />
          </div>

          {/* Role & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select
                value={selectedRole}
                onValueChange={(v) => setValue('role', v as 'admin' | 'member')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select
                value={selectedStatus}
                onValueChange={(v) =>
                  setValue('status', v as 'active' | 'inactive' | 'suspended')
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Joining Date */}
          <div className="space-y-1.5">
            <Label htmlFor="member-joined">Joining Date *</Label>
            <Input id="member-joined" type="date" {...register('joinedAt')} />
            {errors.joinedAt && (
              <p className="text-xs text-destructive">{errors.joinedAt.message}</p>
            )}
          </div>

          {/* Avatar Color Picker */}
          <div className="space-y-1.5">
            <Label>Avatar Color</Label>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('avatarColor', color)}
                  className={cn(
                    'size-7 rounded-full flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                    selectedColor === color && 'ring-2 ring-foreground ring-offset-2',
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                >
                  {selectedColor === color && <Check className="size-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

