'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, ShieldCheck, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import { Suspense } from 'react';

function AcceptInvitationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [isAccepted, setIsAccepted] = useState(false);

    // 1. Validate Invitation
    const { data: inviteData, isLoading: isValidating, error: validateError } = useQuery({
        queryKey: ['invitations', 'validate', token],
        queryFn: async () => {
            if (!token) throw new Error('No token provided');
            const res = await fetch(`/api/invitations/accept?token=${token}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Invalid invitation');
            }
            return res.json();
        },
        enabled: !!token,
        retry: false,
    });

    // 2. Accept Invitation Mutation
    const acceptMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/invitations/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            if (!res.ok) {
                const err = await res.json();
                if (res.status === 401) {
                    // Redirect to Register by default, as most invitees are new users
                    // We can pre-fill their email from the invitation data if available
                    // Note: inviteData is available in closure scope
                    const email = inviteData?.data?.email;
                    const target = email
                        ? `/auth/register?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(window.location.href)}`
                        : `/auth/register?callbackUrl=${encodeURIComponent(window.location.href)}`;

                    router.push(target);
                    return;
                }
                throw new Error(err.error || 'Failed to join organization');
            }
            return res.json();
        },
        onSuccess: (data) => {
            if (!data) return;
            toast.success(data.message);
            setIsAccepted(true);
            setTimeout(() => {
                router.push('/dashboard/business');
            }, 3000);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    if (isValidating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-muted/30">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Validating your invitation...</p>
            </div>
        );
    }

    if (validateError || !token) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 bg-muted/30">
                <Card className="w-full max-w-md shadow-2xl border-none rounded-3xl overflow-hidden">
                    <CardHeader className="bg-destructive/10 text-center py-8">
                        <div className="mx-auto h-16 w-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4">
                            <Loader2 className="h-8 w-8 text-destructive rotate-45" />
                        </div>
                        <CardTitle className="text-2xl font-black font-heading text-destructive">Invitation Invalid</CardTitle>
                        <CardDescription className="text-base">
                            {validateError instanceof Error ? validateError.message : 'This invitation link is invalid or has expired.'}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center py-6">
                        <Button asChild variant="outline" className="rounded-full px-8">
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const invitation = inviteData?.data;

    if (isAccepted) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 bg-muted/30">
                <Card className="w-full max-w-md shadow-2xl border-none rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-500">
                    <CardHeader className="bg-primary/10 text-center py-10">
                        <div className="mx-auto h-20 w-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <CheckCircle2 className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-black font-heading text-primary">Success!</CardTitle>
                        <CardDescription className="text-lg font-medium">
                            You are now a member of <span className="text-foreground">{invitation.organization.name}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-8">
                        <p className="text-muted-foreground">Redirecting you to your dashboard...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <Card className="w-full max-w-lg shadow-2xl border-none rounded-[2.5rem] overflow-hidden bg-background/80 backdrop-blur-xl">
                <CardHeader className="text-center pt-12 pb-6 px-10">
                    <div className="mx-auto h-24 w-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-8 rotate-3 shadow-inner">
                        <UserPlus className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-4xl font-black font-heading tracking-tight mb-2">You're Invited!</CardTitle>
                    <CardDescription className="text-xl font-medium">
                        Join <span className="text-foreground font-black underline decoration-primary/30 decoration-4 underline-offset-4">{invitation.organization.name}</span> on StitchCraft.
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-10 pb-10">
                    <div className="bg-muted/30 rounded-3xl p-6 space-y-4 border border-muted-foreground/5">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-background shadow-sm flex items-center justify-center font-bold text-primary text-xl">
                                {invitation.invitedBy.name[0]}
                            </div>
                            <div>
                                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Invited By</p>
                                <p className="font-bold text-lg">{invitation.invitedBy.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-background shadow-sm flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Your Role</p>
                                <p className="font-bold text-lg">{invitation.role}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 px-10 pb-12">
                    {acceptMutation.error && (
                        <div className="w-full p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                            <div className="h-2 w-2 rounded-full bg-destructive shrink-0" />
                            {acceptMutation.error.message}
                        </div>
                    )}
                    <Button
                        className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 animate-pulse hover:animate-none group"
                        onClick={() => acceptMutation.mutate()}
                        disabled={acceptMutation.isPending}
                    >
                        {acceptMutation.isPending ? (
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        ) : (
                            'Accept Invitation & Join Team'
                        )}
                    </Button>
                    <p className="text-sm text-center text-muted-foreground font-medium">
                        By joining, you agree to the organization's rules and terms.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function AcceptInvitationPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-muted/30">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Loading invitation...</p>
            </div>
        }>
            <AcceptInvitationContent />
        </Suspense>
    );
}
