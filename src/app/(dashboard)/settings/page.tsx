'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  User,
  Palette,
  Globe,
  Save,
  Check,
} from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { mockMess } from '@/data/mess';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

const messSchema = z.object({
  name: z.string().min(2, 'Mess name must be at least 2 characters'),
  address: z.string().min(5, 'Address is required'),
});

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number required'),
});

type MessFormData = z.infer<typeof messSchema>;
type ProfileFormData = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { theme, setTheme } = useAppStore();

  const [messInfo, setMessInfo] = useState({
    name: mockMess.name,
    address: mockMess.address,
  });

  const [profileInfo, setProfileInfo] = useState({
    fullName: 'Md Nazmul Hosen',
    email: 'nazmulhosen@gmail.com',
    phone: '01711-234567',
  });

  const {
    register: registerMess,
    handleSubmit: handleSubmitMess,
    formState: { errors: messErrors, isSubmitting: isSubmittingMess },
  } = useForm<MessFormData>({
    resolver: zodResolver(messSchema),
    defaultValues: messInfo,
  });

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileInfo,
  });

  const onSaveMess = (data: MessFormData) => {
    setMessInfo(data);
    toast.success('Mess workspace settings updated');
  };

  const onSaveProfile = (data: ProfileFormData) => {
    setProfileInfo(data);
    toast.success('Admin profile updated');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage workspace settings, mess configuration, and personal preferences
        </p>
      </div>

      {/* Mess Information */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            <div>
              <CardTitle className="text-base font-semibold">Mess Workspace</CardTitle>
              <CardDescription>Details about your shared household or hostel workspace</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitMess(onSaveMess)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="messName">Mess Name</Label>
              <Input id="messName" {...registerMess('name')} />
              {messErrors.name && (
                <p className="text-xs text-destructive">{messErrors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="messAddress">Mess Address</Label>
              <Textarea id="messAddress" rows={2} {...registerMess('address')} />
              {messErrors.address && (
                <p className="text-xs text-destructive">{messErrors.address.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmittingMess} className="gap-2">
              <Save className="size-4" /> Save Mess Info
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Admin Profile */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="size-5 text-primary" />
            <div>
              <CardTitle className="text-base font-semibold">Admin Profile</CardTitle>
              <CardDescription>Your personal manager identity and contact info</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitProfile(onSaveProfile)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" {...registerProfile('fullName')} />
                {profileErrors.fullName && (
                  <p className="text-xs text-destructive">{profileErrors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...registerProfile('email')} />
                {profileErrors.email && (
                  <p className="text-xs text-destructive">{profileErrors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" {...registerProfile('phone')} />
              {profileErrors.phone && (
                <p className="text-xs text-destructive">{profileErrors.phone.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmittingProfile} className="gap-2">
              <Save className="size-4" /> Update Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Regional & Financial Preferences */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="size-5 text-primary" />
            <div>
              <CardTitle className="text-base font-semibold">Regional & Accounting Standards</CardTitle>
              <CardDescription>Default currency, timezone, and calendar settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Base Currency</Label>
              <Input value="BDT (৳) — Bangladeshi Taka" disabled className="bg-muted/50" />
              <p className="text-[11px] text-muted-foreground">Monetary precision: Integer Paisa (৳1 = 100 Paisa)</p>
            </div>

            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Input value="Asia/Dhaka (GMT+6)" disabled className="bg-muted/50" />
              <p className="text-[11px] text-muted-foreground">Standardized meal cycles cut off at 23:59 Asia/Dhaka</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance & Theme */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-primary" />
            <div>
              <CardTitle className="text-base font-semibold">Appearance</CardTitle>
              <CardDescription>Switch between light and dark modes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Interface Theme</Label>
            <div className="flex items-center gap-3">
              {(['dark', 'light', 'system'] as const).map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={theme === t ? 'default' : 'outline'}
                  size="sm"
                  className="capitalize gap-1.5"
                  onClick={() => {
                    setTheme(t);
                    toast.success(`Theme switched to ${t}`);
                  }}
                >
                  {theme === t && <Check className="size-3.5" />}
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

