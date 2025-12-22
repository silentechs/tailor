'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { fetchApi } from '@/lib/fetch-api';
import { captureError } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { KENTE_PATTERNS } from '@/lib/design-system';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: emailParam || '',
      password: '',
    },
  });

  // Update email field if param changes
  useEffect(() => {
    if (emailParam) {
      form.setValue('email', emailParam);
    }
  }, [emailParam, form]);

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const response = await fetchApi('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      toast.success('Welcome back!', {
        description: 'You have successfully logged in.',
      });

      const callbackUrl = searchParams.get('callbackUrl');
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push(data.redirectPath || '/dashboard/business');
      }
      router.refresh();
    } catch (error: any) {
      captureError('LoginPage', error);
      toast.error('Login Failed', {
        description: error.message || 'Please check your credentials and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-4">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ background: KENTE_PATTERNS.heroBackground }}
      />

      <Card className="w-full max-w-md shadow-2xl border-primary/10 relative z-10 overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-[var(--color-ghana-red)] via-[var(--color-ghana-gold)] to-[var(--color-ghana-green)]" />
        <CardHeader className="space-y-1 text-center pt-8">
          <CardTitle className="text-3xl font-heading font-bold text-primary">
            StitchCraft
          </CardTitle>
          <CardDescription>Enter your credentials to access the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="tailor@stitchcraft.gh" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center text-sm text-muted-foreground pb-8">
          <div className="flex items-center justify-between w-full text-xs px-2">
            <Link
              href={
                searchParams.get('callbackUrl')
                  ? `/auth/register?callbackUrl=${encodeURIComponent(searchParams.get('callbackUrl')!)}${searchParams.get('email') ? `&email=${encodeURIComponent(searchParams.get('email')!)}` : ''}`
                  : `/auth/register${searchParams.get('email') ? `?email=${encodeURIComponent(searchParams.get('email')!)}` : ''}`
              }
              className="text-primary font-semibold hover:underline"
            >
              Create Account
            </Link>
            <Link
              href="/auth/forgot-password"
              className="text-primary font-semibold hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
