'use client';

import { MessageSquarePlus } from 'lucide-react';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { FeedbackDialog } from './feedback-dialog';

interface FeedbackButtonProps {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  } | null;
  variant?: 'floating' | 'inline' | 'minimal';
  className?: string;
  label?: string;
}

export function FeedbackButton({
  user,
  variant = 'floating',
  className,
  label = 'Feedback',
}: FeedbackButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);

  // Hide button when scrolling down, show when scrolling up (for floating variant)
  React.useEffect(() => {
    if (variant !== 'floating') return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY.current || currentScrollY < 100);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [variant]);

  if (variant === 'floating') {
    return (
      <>
        <AnimatePresence>
          {isVisible && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className={cn(
                      'fixed bottom-safe-fab right-4 z-50 md:right-6 translate-y-[-4.5rem] md:translate-y-0',
                      className
                    )}
                  >
                    <Button
                      onClick={() => setOpen(true)}
                      size="lg"
                      className={cn(
                        'h-14 w-14 rounded-2xl shadow-lg shadow-primary/25',
                        'bg-primary hover:bg-primary/90 text-white',
                        'transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30',
                        'group'
                      )}
                    >
                      <MessageSquarePlus className="h-6 w-6 transition-transform group-hover:rotate-12" />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent
                  side="left"
                  className="bg-slate-900 text-white border-none rounded-xl px-4 py-2 font-bold"
                >
                  Share Feedback
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </AnimatePresence>

        <FeedbackDialog open={open} onOpenChange={setOpen} user={user} />
      </>
    );
  }

  if (variant === 'minimal') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={cn(
            'text-sm font-medium text-muted-foreground hover:text-primary transition-colors',
            className
          )}
        >
          {label}
        </button>
        <FeedbackDialog open={open} onOpenChange={setOpen} user={user} />
      </>
    );
  }

  // Inline variant
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className={cn(
          'h-10 rounded-xl font-bold gap-2 border-slate-200 hover:border-primary hover:text-primary',
          className
        )}
      >
        <MessageSquarePlus className="h-4 w-4" />
        {label}
      </Button>
      <FeedbackDialog open={open} onOpenChange={setOpen} user={user} />
    </>
  );
}

