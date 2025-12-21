'use client';

import type * as React from 'react';
import { FAB } from '@/components/navigation/fab';
import { MobileNav } from '@/components/navigation/mobile-nav';
import { Sidebar } from '@/components/navigation/sidebar';
import { Topbar } from '@/components/navigation/topbar';
import { useOfflineSync } from '@/hooks/use-offline-sync';

import { CurrentUser } from '@/lib/direct-current-user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function DashboardClientContent({ children, user }: { children: React.ReactNode; user: CurrentUser }) {
    // Initialize background sync
    useOfflineSync();

    // Check if worker needs to join an organization
    const needsToJoin = user.role === 'WORKER' && (!user.memberships || user.memberships.length === 0);

    return (
        <div className="flex min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <Sidebar className="hidden md:block w-64 fixed inset-y-0 z-50 shadow-sm" user={user} />

            {/* Main Content */}
            <div className="flex-1 md:pl-64 flex flex-col min-h-screen pb-20 md:pb-0 transition-all duration-300 ease-in-out">
                <Topbar />

                <main className="flex-1 p-4 md:p-8 overflow-x-hidden w-full max-w-[1600px] mx-auto">
                    {needsToJoin && (
                        <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-800">
                            <AlertTitle className="font-bold text-lg">Action Required: Join your Team</AlertTitle>
                            <AlertDescription className="mt-2 flex flex-col gap-4">
                                <p>
                                    You have registered but have not yet joined an organization.
                                    Please check your email for the invitation link or ask your administrator to invite you again.
                                </p>
                                <div className="flex gap-2">
                                    <Button asChild variant="outline" className="bg-white hover:bg-red-100 border-red-200 text-red-700">
                                        <Link href="/auth/login">Back to Sign In (to re-trigger invite)</Link>
                                    </Button>
                                    {/* Ideally we would list pending invites here if we fetched them */}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                    {children}
                </main>
            </div>

            {/* Mobile Navigation */}
            <MobileNav user={user} />

            {/* Floating Action Button */}
            <FAB />
        </div>
    );
}
