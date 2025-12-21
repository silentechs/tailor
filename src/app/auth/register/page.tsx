'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { KENTE_PATTERNS } from '@/lib/design-system';

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

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const trackingToken = searchParams?.get('token');
  const isClientRegistration = !!trackingToken;

  const emailParam = searchParams?.get('email');

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

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          name: values.name,
          phone: values.phone,
          role: isClientRegistration ? 'CLIENT' : 'TAILOR',
          trackingToken: trackingToken || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          Object.entries(data.details).forEach(([key, messages]) => {
            form.setError(key as any, {
              type: 'server',
              message: (messages as string[]).join(', ')
            });
          });
          throw new Error('Please check the form for errors');
        }
        throw new Error(data.error || 'Registration failed');
      }

      if (isClientRegistration) {
        toast.success('Registration Successful!', {
          description: 'Your account is linked and ready. Please sign in to access your Studio.',
        });
      } else {
        toast.success('Account Created!', {
          description: 'Your account is pending approval. Please check your email.',
        });
      }

      // Redirect to Login page to authenticate
      // Pass the callbackUrl so they are returned to the correct place (e.g. Accept Invitation) after logging in
      const callbackParam = searchParams?.get('callbackUrl');
      const loginUrl = new URL('/auth/login', window.location.href);
      if (callbackParam) {
        loginUrl.searchParams.set('callbackUrl', callbackParam);
      }
      loginUrl.searchParams.set('email', values.email); // Pre-fill email on login page too

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
        <CardHeader className="space-y-1 text-center pt-8">
          <CardTitle className="text-3xl font-heading font-bold text-primary">
            {isClientRegistration ? 'Join the Studio' : 'Join StitchCraft'}
          </CardTitle>
          <CardDescription>
            {isClientRegistration ? 'Access your private tailoring portal' : 'Create your tailor profile'}
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
                      <Input placeholder="tailor@example.com" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
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
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground pb-8">
          <div>
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
