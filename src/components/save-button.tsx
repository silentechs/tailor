'use client';

import { Heart, LogIn, Sparkles, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface SaveButtonProps {
    portfolioItemId: string;
    className?: string;
    iconClassName?: string;
    size?: 'sm' | 'default' | 'icon';
}

export function SaveButton({
    portfolioItemId,
    className,
    iconClassName,
    size = 'icon',
}: SaveButtonProps) {
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showAuthPopover, setShowAuthPopover] = useState(false);
    const pathname = usePathname();

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/studio/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ portfolioItemId }),
            });
            const data = await res.json();

            // Role-based restriction (logged in but not a client)
            if (res.status === 403) {
                toast.info('Style Hub is for clients. Share this design instead!');
                return;
            }

            // Not authenticated
            if (res.status === 401) {
                setShowAuthPopover(true);
                return;
            }

            if (res.status === 500 && !data.success) {
                toast.error('Something went wrong. Please try again.');
                return;
            }

            if (data.action === 'added') {
                setIsSaved(true);
                toast.success('Saved to Style Hub!');
            } else if (data.action === 'removed') {
                setIsSaved(false);
                toast.info('Removed from Style Hub');
            }
        } catch {
            // Network error or not authenticated - assume auth issue
            setShowAuthPopover(true);
        } finally {
            setIsLoading(false);
        }
    };

    const returnUrl = encodeURIComponent(pathname);

    return (
        <Popover open={showAuthPopover} onOpenChange={setShowAuthPopover}>
            <PopoverTrigger asChild>
                <Button
                    size={size}
                    variant="ghost"
                    className={cn(
                        'transition-all duration-300',
                        isSaved && 'text-red-500',
                        className
                    )}
                    onClick={handleSave}
                    disabled={isLoading}
                >
                    <Heart
                        className={cn(
                            'transition-all duration-300',
                            isSaved && 'fill-current',
                            isLoading && 'animate-pulse',
                            iconClassName
                        )}
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-72 p-0 rounded-2xl border-none shadow-2xl overflow-hidden"
                align="end"
                sideOffset={8}
            >
                {/* Decorative header */}
                <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-white">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        <span className="font-bold">Save Your Inspirations</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 bg-background">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Sign in to save this design to your personal Style Hub and build your fashion collection.
                    </p>

                    <div className="grid gap-2">
                        <Button asChild className="w-full rounded-xl font-bold" size="lg">
                            <Link href={`/auth/login?callbackUrl=${returnUrl}`}>
                                <LogIn className="h-4 w-4 mr-2" />
                                Sign In
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="w-full rounded-xl font-medium"
                            size="lg"
                        >
                            <Link href={`/auth/register?role=client&callbackUrl=${returnUrl}`}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create Free Account
                            </Link>
                        </Button>
                    </div>

                    <p className="text-[10px] text-center text-muted-foreground/70">
                        Join thousands of fashion enthusiasts
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
}
