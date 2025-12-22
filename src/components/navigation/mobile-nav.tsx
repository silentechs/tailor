'use client';

import { CreditCard, LayoutDashboard, Menu, Scissors, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { CurrentUser } from '@/lib/direct-current-user';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';

export function MobileNav({ user }: { user?: CurrentUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = [
    { name: 'Home', href: '/dashboard/business', icon: LayoutDashboard },
    { name: 'Orders', href: '/dashboard/orders', icon: Scissors },
    { name: 'Clients', href: '/dashboard/clients', icon: Users },
    { name: 'Finance', href: '/dashboard/payments', icon: CreditCard },
  ];

  return (
    <div
      data-mobile-nav
      className="fixed bottom-0 left-0 right-0 border-t bg-white dark:bg-zinc-950 px-1 py-2 md:hidden z-[100] pb-[env(safe-area-inset-bottom)] no-print shadow-[0_-4px_12px_rgba(0,0,0,0.1)]"
    >
      <div className="flex justify-evenly items-center max-w-md mx-auto">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard/business' && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center p-1.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              )}
            >
              <item.icon className="h-5 w-5 mb-0.5" />
              {item.name}
            </Link>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex flex-col items-center justify-center p-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Menu className="h-5 w-5 mb-0.5" />
              Menu
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <span className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </span>
            <Sidebar className="border-none w-full block h-full" user={user} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
