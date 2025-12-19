'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, Globe, Loader2, Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const showcaseSchema = z.object({
  showcaseEnabled: z.boolean(),
  showcaseUsername: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, underscores, and hyphens allowed')
    .or(z.literal('')),
});

type ShowcaseValues = z.infer<typeof showcaseSchema>;

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
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export default function PublicProfilePage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const form = useForm<ShowcaseValues>({
    resolver: zodResolver(showcaseSchema),
    defaultValues: {
      showcaseEnabled: false,
      showcaseUsername: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        showcaseEnabled: user.showcaseEnabled,
        showcaseUsername: user.showcaseUsername || '',
      });
    }
  }, [user, form]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Public profile settings updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });

  const onSubmit = (values: ShowcaseValues) => {
    mutation.mutate(values);
  };

  const publicUrl = user?.showcaseUsername
    ? `${window.location.origin}/showcase/${user.showcaseUsername}`
    : 'Username not set';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('Link copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-heading text-primary">Public Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Public Showcase Settings</CardTitle>
              <CardDescription>
                Manage your public facing portfolio and booking page.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
                <FormField
                  control={form.control}
                  name="showcaseEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg p-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Public Profile</FormLabel>
                        <FormDescription>
                          Allow clients to view your portfolio and contact you via a public link.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="showcaseUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Username</FormLabel>
                      <div className="flex gap-2">
                        <div className="flex items-center px-3 border rounded-l-md bg-muted text-muted-foreground border-r-0 text-sm">
                          stitchcraft.gh/showcase/
                        </div>
                        <FormControl>
                          <Input
                            placeholder="your-business-name"
                            {...field}
                            className="rounded-l-none"
                          />
                        </FormControl>
                      </div>
                      <FormDescription>
                        This will be your unique URL. Only letters, numbers, and hyphens.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {user?.showcaseUsername && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-900 rounded-md border border-blue-100 text-sm">
                  <span className="truncate flex-1 font-mono">{publicUrl}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-blue-100"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-blue-100"
                    asChild
                  >
                    <a
                      href={`/showcase/${user.showcaseUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}

              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Settings
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
