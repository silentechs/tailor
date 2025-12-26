'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AuthHeaderProps {
    showExplore?: boolean;
}

/**
 * A minimal header for auth pages providing navigation escape routes.
 * Includes a clickable logo (home link) and optional "Explore Gallery" CTA.
 */
export function AuthHeader({ showExplore = true }: AuthHeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 p-4 pointer-events-none">
            <div className="flex items-center justify-between max-w-md mx-auto pointer-events-auto">
                {/* Logo - Always links home */}
                <Link
                    href="/"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <div className="relative h-8 w-8 overflow-hidden rounded-lg shadow-md">
                        <img src="/icon.png" alt="StitchCraft Logo" className="h-full w-full object-cover" />
                    </div>
                    <span className="font-bold font-heading text-sm hidden sm:inline">
                        Stitch<span className="text-primary">Craft</span>
                    </span>
                </Link>

                {/* Explore CTA */}
                {showExplore && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-primary hover:bg-primary/5 text-xs sm:text-sm"
                        asChild
                    >
                        <Link href="/gallery">Explore Gallery</Link>
                    </Button>
                )}
            </div>
        </header>
    );
}
