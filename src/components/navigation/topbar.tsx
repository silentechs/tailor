'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from './breadcrumb';
import { CommandMenu } from './command-menu';
import { UserNav } from './user-nav';

export function Topbar() {
  const { data: notificationData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?filter=unread');
      if (!res.ok) return { meta: { unreadCount: 0 } };
      return res.json();
    },
  });

  const unreadCount = notificationData?.meta?.unreadCount || 0;

  return (
    <header data-topbar className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
      <div className="flex h-16 items-center px-4 md:px-8">
        <div className="flex items-center gap-4 flex-1">
          {/* Mobile Logo */}
          <Link href="/dashboard/business" className="flex items-center gap-2 md:hidden group">
            <div className="relative h-8 w-8 rounded-lg overflow-hidden shadow-md">
              <img src="/icon.png" alt="StitchCraft Logo" className="h-full w-full object-cover" />
            </div>
            <span className="font-bold text-sm tracking-tight">StitchCraft</span>
          </Link>

          <div className="hidden md:block">
            <Breadcrumb />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center max-w-md px-4">
          <CommandMenu />
        </div>

        <div className="flex items-center justify-end flex-1 gap-4">
          <Button variant="ghost" size="icon" className="relative hover:bg-muted" asChild>
            <Link href="/dashboard/notifications">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center rounded-full border-2 border-background px-1 text-[10px] font-bold"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Link>
          </Button>
          <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
