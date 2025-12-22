'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Bell, CheckCircle, Info, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function NotificationsPopover() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['studio', 'notifications'],
    queryFn: async () => {
      const res = await fetch('/api/studio/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return (await res.json()).data;
    },
  });

  const unreadCount = notifications?.filter((n: any) => !n.readAt).length || 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-2xl hover:bg-white/5 relative"
        >
          <Bell className="h-6 w-6 text-zinc-400" />
          {unreadCount > 0 && (
            <span className="absolute top-3 right-3 w-2 h-2 bg-ghana-gold rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-zinc-900 border-white/10 text-white" align="end">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h4 className="font-bold text-sm uppercase tracking-wider">Notifications</h4>
          {unreadCount > 0 && (
            <Badge className="bg-ghana-gold text-ghana-black text-[10px]">{unreadCount} New</Badge>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : notifications?.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">No notifications yet.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications?.map((notification: any) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-white/5 transition-colors',
                    !notification.readAt && 'bg-white/[0.02]'
                  )}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {notification.type === 'SUCCESS' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : notification.type === 'WARNING' ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Info className="h-4 w-4 text-ghana-gold" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{notification.title}</p>
                      <p className="text-xs text-zinc-400 leading-snug">{notification.message}</p>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
