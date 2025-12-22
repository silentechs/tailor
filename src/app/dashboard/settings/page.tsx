'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Globe, Loader2, Save, Share2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { MeasurementTemplateManager } from '@/components/settings/measurement-template-manager';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchApi } from '@/lib/fetch-api';

async function getProfile() {
  const res = await fetchApi('/api/auth/me');
  if (!res.ok) throw new Error('Failed to fetch profile');
  const data = await res.json();
  return data.user;
}

async function updateProfile(data: any) {
  const res = await fetchApi('/api/auth/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  // Local state for settings
  const [notifyEmail, setNotifyEmail] = useState(user?.notifyEmail ?? true);
  const [notifySms, setNotifySms] = useState(user?.notifySms ?? true);

  // Update local state when user data loads
  useState(() => {
    if (user) {
      setNotifyEmail(user.notifyEmail);
      setNotifySms(user.notifySms);
    }
  });

  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Max 5MB.');
      return;
    }

    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetchApi('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();

      // Update profile with new image
      await updateProfile({ profileImage: data.url });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile photo updated');
    } catch (_error) {
      toast.error('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleProfileSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    mutation.mutate(data);
  };

  const handleNotificationSave = () => {
    mutation.mutate({
      notifyEmail,
      notifySms,
    });
  };

  const handlePasswordUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;

    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    mutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-heading text-primary">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 lg:w-[600px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notif</TabsTrigger>
          <TabsTrigger value="showcase">Showcase</TabsTrigger>
          <TabsTrigger value="measurements">Tools</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <form onSubmit={handleProfileSave}>
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and business profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.profileImage} />
                    <AvatarFallback className="text-xl">{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                    >
                      {isUploadingPhoto ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">Max 5MB, JPG/PNG</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" defaultValue={user?.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue={user?.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      defaultValue={user?.businessName}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" defaultValue={user?.phone} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / Description</Label>
                  <Input
                    id="bio"
                    name="bio"
                    defaultValue={user?.bio}
                    placeholder="Tell clients about your craft..."
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={mutation.isPending}>
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
        </TabsContent>

        <TabsContent value="showcase" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Public Showcase
              </CardTitle>
              <CardDescription>
                Turn your portfolio into a public website to share with clients and on social media.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your portfolio visible to everyone.
                  </p>
                </div>
                <Switch
                  checked={user?.showcaseEnabled}
                  onCheckedChange={(checked) => mutation.mutate({ showcaseEnabled: checked })}
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="showcaseUsername">Showcase Username</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        stitchcraft.gh/
                      </span>
                      <Input
                        id="showcaseUsername"
                        name="showcaseUsername"
                        className="pl-[105px]"
                        defaultValue={user?.showcaseUsername}
                        placeholder="your-business-name"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        const input = document.getElementById(
                          'showcaseUsername'
                        ) as HTMLInputElement;
                        mutation.mutate({ showcaseUsername: input.value });
                      }}
                      disabled={mutation.isPending}
                    >
                      Update
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Only letters, numbers, and hyphens. At least 3 characters.
                  </p>
                </div>

                {user?.showcaseUsername && (
                  <div className="p-4 bg-slate-50 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Your Live Link
                      </p>
                      <p className="text-sm font-mono font-bold text-primary">
                        {origin}/showcase/{user.showcaseUsername}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/showcase/${user.showcaseUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${origin}/showcase/${user.showcaseUsername}`
                          );
                          toast.success('Showcase link copied!');
                        }}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="measurements" className="space-y-6 mt-6">
          <MeasurementTemplateManager />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose how you want to be notified.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new orders and payments.
                  </p>
                </div>
                <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get SMS alerts for urgent updates.
                  </p>
                </div>
                <Switch checked={notifySms} onCheckedChange={setNotifySms} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleNotificationSave} disabled={mutation.isPending}>
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <form onSubmit={handlePasswordUpdate}>
            <Card>
              <CardHeader>
                <CardTitle>Password & Security</CardTitle>
                <CardDescription>Manage your password and account security.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" name="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" name="newPassword" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" variant="outline" disabled={mutation.isPending}>
                  Update Password
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>You are currently on the Free Plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-secondary/20 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-bold text-primary">Free Tier</p>
                  <p className="text-sm text-muted-foreground">
                    Basic features for individual tailors.
                  </p>
                </div>
                <Button onClick={() => toast.info('Pro plan coming soon!')}>Upgrade to Pro</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
