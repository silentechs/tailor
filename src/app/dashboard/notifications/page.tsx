'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  CreditCard,
  Loader2,
  Mail,
  MessageSquare,
  MoreVertical,
  ShoppingBag,
  Smartphone,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { fetchApi } from '@/lib/fetch-api';
import { cn, formatDate } from '@/lib/utils';

async function getNotifications(filter: string = 'all') {
  const res = await fetchApi(`/api/notifications?filter=${filter}`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => getNotifications(filter),
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchApi(`/api/notifications/${id}`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchApi(`/api/notifications`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to mark all as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchApi(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete notification');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const notifications = data?.data || [];
  const unreadCount = data?.meta?.unreadCount || 0;

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER_UPDATE':
        return <ShoppingBag className="h-4 w-4 text-blue-500" />;
      case 'PAYMENT_RECEIVED':
        return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case 'NEW_CLIENT':
        return <UserPlus className="h-4 w-4 text-orange-500" />;
      case 'NEW_MESSAGE':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'APPOINTMENT_REMINDER':
        return <Calendar className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-primary flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="rounded-full px-2 h-6 min-w-[24px] flex items-center justify-center"
              >
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Stay updated on your business activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          className="rounded-full"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          className="rounded-full"
          onClick={() => setFilter('unread')}
        >
          Unread
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
              <p className="text-sm text-muted-foreground mt-4 font-medium">Loading updates...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notif: any) => (
                <div
                  key={notif.id}
                  className={cn(
                    'p-4 sm:p-6 flex gap-4 transition-colors hover:bg-slate-50/50',
                    !notif.isRead && 'bg-primary/[0.02]'
                  )}
                >
                  <div
                    className={cn(
                      'h-10 w-10 min-w-[40px] rounded-full flex items-center justify-center shadow-sm border',
                      !notif.isRead ? 'bg-white border-primary/20' : 'bg-slate-50 border-slate-100'
                    )}
                  >
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3
                        className={cn(
                          'text-sm font-bold leading-none',
                          !notif.isRead ? 'text-slate-900' : 'text-slate-600'
                        )}
                      >
                        {notif.title}
                      </h3>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {!notif.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/5 px-2"
                          onClick={() => markReadMutation.mutate(notif.id)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Mark as read
                        </Button>
                      )}
                      {notif.smsSent && (
                        <Badge
                          variant="outline"
                          className="h-5 text-[9px] font-black bg-emerald-50 text-emerald-600 border-emerald-100 uppercase py-0 leading-none"
                        >
                          <Smartphone className="h-2.5 w-2.5 mr-1" />
                          SMS Sent
                        </Badge>
                      )}
                      {notif.emailSent && (
                        <Badge
                          variant="outline"
                          className="h-5 text-[9px] font-black bg-blue-50 text-blue-600 border-blue-100 uppercase py-0 leading-none"
                        >
                          <Mail className="h-2.5 w-2.5 mr-1" />
                          Email Sent
                        </Badge>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive flex items-center gap-2 cursor-pointer"
                        onClick={() => deleteMutation.mutate(notif.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <Bell className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold font-heading">No notifications</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                When your business has activity, we'll notify you here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
