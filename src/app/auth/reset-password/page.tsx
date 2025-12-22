'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle, Eye, EyeOff, Loader2, LockKeyhole, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { fetchApi } from '@/lib/fetch-api';
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

const resetPasswordSchema = z.object({
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<z.infer<typeof resetPasswordSchema>>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    // Validate token on mount
    useEffect(() => {
        async function validateToken() {
            if (!token) {
                setIsValidating(false);
                setError('No reset token provided');
                return;
            }

            try {
                const response = await fetchApi(`/api/auth/reset-password?token=${token}`);
                const data = await response.json();

                if (data.valid) {
                    setIsValid(true);
                } else {
                    setError(data.error || 'Invalid or expired reset link');
                }
            } catch {
                setError('Failed to validate reset link');
            } finally {
                setIsValidating(false);
            }
        }

        validateToken();
    }, [token]);

    async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetchApi('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    password: values.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }

            setIsSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/auth/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    // Loading state
    if (isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Validating reset link...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Invalid token state
    if (!isValid && !isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-4">
                <div
                    className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{ background: KENTE_PATTERNS.heroBackground }}
                />
                <Card className="w-full max-w-md shadow-2xl border-destructive/20 relative z-10 overflow-hidden">
                    <div className="h-2 w-full bg-destructive" />
                    <CardHeader className="space-y-1 text-center pt-8">
                        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="w-8 h-8 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl font-heading font-bold">
                            Invalid Reset Link
                        </CardTitle>
                        <CardDescription className="text-base">
                            {error || 'This password reset link is invalid or has expired.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground">
                            Please request a new password reset link.
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-3 pb-8">
                        <Link href="/auth/forgot-password" className="w-full">
                            <Button className="w-full">Request New Link</Button>
                        </Link>
                        <Link href="/auth/login" className="w-full">
                            <Button variant="outline" className="w-full">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Success state
    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-4">
                <div
                    className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{ background: KENTE_PATTERNS.heroBackground }}
                />
                <Card className="w-full max-w-md shadow-2xl border-primary/10 relative z-10 overflow-hidden">
                    <div className="h-2 w-full bg-gradient-to-r from-[var(--color-ghana-red)] via-[var(--color-ghana-gold)] to-[var(--color-ghana-green)]" />
                    <CardHeader className="space-y-1 text-center pt-8">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-heading font-bold text-primary">
                            Password Reset!
                        </CardTitle>
                        <CardDescription className="text-base">
                            Your password has been successfully updated.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground">
                            Redirecting you to login...
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center pb-8">
                        <Link
                            href="/auth/login"
                            className="text-sm text-primary font-semibold hover:underline"
                        >
                            Click here if not redirected
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Reset form
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-4">
            <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ background: KENTE_PATTERNS.heroBackground }}
            />

            <Card className="w-full max-w-md shadow-2xl border-primary/10 relative z-10 overflow-hidden">
                <div className="h-2 w-full bg-gradient-to-r from-[var(--color-ghana-red)] via-[var(--color-ghana-gold)] to-[var(--color-ghana-green)]" />
                <CardHeader className="space-y-1 text-center pt-8">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <LockKeyhole className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-heading font-bold text-primary">
                        Set New Password
                    </CardTitle>
                    <CardDescription>
                        Create a strong password for your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
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
                                            <div className="relative">
                                                <Input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="text-xs text-muted-foreground space-y-1">
                                <p>Password must contain:</p>
                                <ul className="list-disc list-inside space-y-0.5 ml-1">
                                    <li>At least 8 characters</li>
                                    <li>One uppercase letter</li>
                                    <li>One lowercase letter</li>
                                    <li>One number</li>
                                </ul>
                            </div>

                            {error && (
                                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center pb-8">
                    <Link
                        href="/auth/login"
                        className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
