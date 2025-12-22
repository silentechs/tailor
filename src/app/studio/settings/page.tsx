'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Lock, Save, User } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

async function getProfile() {
  const res = await fetch('/api/auth/me');
  if (!res.ok) throw new Error('Failed to fetch profile');
  const data = await res.json();
  return data.user;
}

async function updateProfile(data: any) {
  const res = await fetch('/api/auth/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update profile');
  }
  return res.json();
}

export default function StudioSettingsPage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({ queryKey: ['profile'], queryFn: getProfile });

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Remove empty password fields if they are blank
    if (!data.currentPassword || !data.newPassword) {
      delete data.currentPassword;
      delete data.newPassword;
    }

    mutation.mutate(data);
  };

  if (isLoading)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ghana-gold" />
      </div>
    );

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">
          Account Settings
        </h1>
        <p className="text-zinc-400">Manage your profile and security.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Card */}
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <User className="h-5 w-5 text-ghana-gold" />
              Personal Details
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Your contact information shared with tailors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-2 border-white/10">
                <AvatarImage src={user?.profileImage} />
                <AvatarFallback className="text-2xl font-black bg-ghana-gold text-ghana-black">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg">{user?.name}</h3>
                <p className="text-sm text-zinc-400">{user?.email}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-400">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={user?.name}
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-zinc-400">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={user?.phone}
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Lock className="h-5 w-5 text-ghana-gold" />
              Security
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Update your password to keep your account safe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-zinc-400">
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-zinc-400">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-white/10 pt-6">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-ghana-gold text-ghana-black font-bold hover:bg-ghana-gold/90 ml-auto"
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
