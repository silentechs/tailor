'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Scissors, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { cn } from '@/lib/utils';
import { KENTE_PATTERNS } from '@/lib/design-system';
import { fetchApi } from '@/lib/fetch-api';

// Simple phone validation
const phoneRegex = /^(?:\+233|0)[235][0-9]{8}$/;

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(phoneRegex, 'Invalid Ghana phone number (e.g. 024xxxxxxx)'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type UserType = 'tailor' | 'client';

function RegisterContent() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determine initial user type from URL params
  const trackingToken = searchParams.get('token');
  const roleParam = searchParams.get('role');
  const callbackUrl = searchParams.get('callbackUrl');
  const isWorkerRegistration = callbackUrl?.includes('/auth/accept-invitation');

  // If tracking token present → forced client, if role=client param → default to client
  const isInvitedClient = !!trackingToken;
  const initialUserType: UserType = isInvitedClient || roleParam === 'client' ? 'client' : 'tailor';

  const [userType, setUserType] = useState<UserType>(initialUserType);

  const emailParam = searchParams.get('email');

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: emailParam || '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Update email field if param changes
  useEffect(() => {
    if (emailParam) {
      form.setValue('email', emailParam);
    }
  }, [emailParam, form]);

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    try {
      // Determine the registration role
      let role: 'TAILOR' | 'CLIENT' | 'WORKER' = userType === 'client' ? 'CLIENT' : 'TAILOR';
      if (isWorkerRegistration) role = 'WORKER';

      const response = await fetchApi('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          name: values.name,
          phone: values.phone,
          role,
          trackingToken: trackingToken || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          Object.entries(data.details).forEach(([key, messages]) => {
            form.setError(key as any, {
              type: 'server',
              message: (messages as string[]).join(', '),
            });
          });
          throw new Error('Please check the form for errors');
        }
        throw new Error(data.error || 'Registration failed');
      }

      if (role === 'CLIENT') {
        toast.success('Welcome to StitchCraft!', {
          description: 'Your Studio is ready. Redirecting to login...',
        });
      } else {
        toast.success('Account Created!', {
          description: 'Your dashboard is ready. Redirecting to login...',
        });
      }

      // Redirect to Login page
      const callbackParam = searchParams?.get('callbackUrl');
      const loginUrl = new URL('/auth/login', window.location.href);
      if (callbackParam) {
        loginUrl.searchParams.set('callbackUrl', callbackParam);
      }
      loginUrl.searchParams.set('email', values.email);

      router.push(loginUrl.pathname + loginUrl.search);
    } catch (error: any) {
      console.error(error);
      toast.error('Registration Failed', {
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-4">
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ background: KENTE_PATTERNS.heroBackground }}
      />

      <Card className="w-full max-w-md shadow-2xl border-primary/10 relative z-10 overflow-hidden my-8">
        <div className="h-2 w-full bg-gradient-to-r from-[var(--color-ghana-green)] via-[var(--color-ghana-gold)] to-[var(--color-ghana-red)]" />
        <CardHeader className="space-y-4 text-center pt-8">
          <CardTitle className="text-3xl font-heading font-bold text-primary">
            Join StitchCraft
          </CardTitle>

          {/* Role Toggle - Only show if not invited via token or worker */}
          {!isInvitedClient && !isWorkerRegistration && (
            <div className="flex gap-2 p-1.5 bg-muted/50 rounded-2xl">
              <button
                type="button"
                onClick={() => setUserType('tailor')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300',
                  userType === 'tailor'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                )}
              >
                <Scissors className="h-4 w-4" />
                I'm a Tailor
              </button>
              <button
                type="button"
                onClick={() => setUserType('client')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300',
                  userType === 'client'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                )}
              >
                <User className="h-4 w-4" />
                I'm a Client
              </button>
            </div>
          )}

          <CardDescription>
            {userType === 'client'
              ? 'Create your account to discover and save designs'
              : 'Create your tailor profile and grow your business'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Kwame Mensah" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="email@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="024xxxxxxx" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Ghanaian number (+233 or 02...)
                    </FormDescription>
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
                      <PasswordInput placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>

              {/* Info text based on role */}
              {userType === 'tailor' && (
                <p className="text-xs text-center text-muted-foreground">
                  Your profile will be ready instantly after signup.
                </p>
              )}
              {userType === 'client' && (
                <p className="text-xs text-center text-muted-foreground">
                  Your account will be ready instantly after signup.
                </p>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground pb-8">
          <div>
            Already have an account?{' '}
            <Link
              href={
                searchParams?.get('callbackUrl')
                  ? `/auth/login?callbackUrl=${encodeURIComponent(searchParams.get('callbackUrl')!)}${searchParams.get('email') ? `&email=${encodeURIComponent(searchParams.get('email')!)}` : ''}`
                  : `/auth/login${searchParams?.get('email') ? `?email=${encodeURIComponent(searchParams.get('email')!)}` : ''}`
              }
              className="text-primary font-semibold hover:underline"
            >
              Sign In
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          Loading...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
