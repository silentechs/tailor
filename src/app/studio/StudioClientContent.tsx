'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Menu, Search, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { FeedbackButton } from '@/components/feedback';
import { NotificationsPopover } from '@/components/studio/notifications-popover';
import { StudioSidebar } from '@/components/studio/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCsrf } from '@/hooks/use-csrf';

export function StudioClientContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [queryClient] = React.useState(() => new QueryClient());

  // Initialize CSRF token
  useCsrf();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-zinc-950 text-white font-body selection:bg-ghana-gold selection:text-ghana-black">
        {/* Desktop Sidebar */}
        <StudioSidebar className="hidden lg:block w-80 fixed inset-y-0 z-50 border-r border-white/5" />

        {/* Main Content */}
        <div className="flex-1 lg:pl-80 flex flex-col min-h-screen relative overflow-x-hidden">
          {/* Abstract Background Elements */}
          <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-ghana-gold/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

          {/* Top Header */}
          <header className="sticky top-0 z-40 h-24 flex items-center justify-between px-8 lg:px-12 backdrop-blur-md bg-zinc-950/50 border-b border-white/5">
            <div className="flex items-center gap-4 lg:gap-8 flex-1 max-w-xl">
              {/* Mobile Menu Trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden text-white hover:bg-white/10"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="p-0 bg-ghana-black border-r border-white/10 w-80"
                >
                  <StudioSidebar />
                </SheetContent>
              </Sheet>
              <div className="relative w-full group hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-ghana-gold transition-colors" />
                <Input
                  placeholder="Search orders, payments, styles..."
                  className="bg-white/5 border-none h-12 pl-12 rounded-2xl text-lg placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const query = e.currentTarget.value;
                      if (query) router.push(`/studio/orders?search=${query}`);
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 ml-8">
              <NotificationsPopover />
              <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                <User className="h-6 w-6 text-zinc-400" />
              </div>
            </div>
          </header>

          {/* Dynamic Canvas */}
          <main className="flex-1 p-8 lg:p-12 z-10">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>

          {/* Footer info or copyright for studio */}
          <footer className="h-20 flex items-center justify-center text-zinc-600 text-sm font-bold uppercase tracking-widest border-t border-white/5">
            &copy; {new Date().getFullYear()} StitchCraft Studio &bull; Private Portal
          </footer>

          {/* Feedback Button - Client role */}
          <FeedbackButton
            user={undefined} // User context will be fetched from session in the dialog
            variant="floating"
            className="[&>button]:bg-white/10 [&>button]:hover:bg-white/20 [&>button]:text-white [&>button]:border [&>button]:border-white/10"
          />
        </div>
      </div>
    </QueryClientProvider>
  );
}
