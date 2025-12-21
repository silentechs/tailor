'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bell,
  Calendar,
  CreditCard,
  FileText,
  Globe,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Scissors,
  Settings,
  Users,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { CurrentUser } from '@/lib/direct-current-user';
import { ROLE_PERMISSIONS, Permission } from '@/lib/permissions';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  user?: CurrentUser;
}

export function Sidebar({ className, user, ...props }: SidebarProps) {
  const pathname = usePathname();

  const { data: notificationData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?filter=unread');
      if (!res.ok) return { meta: { unreadCount: 0 } };
      return res.json();
    },
    enabled: !!user,
  });

  const unreadCount = notificationData?.meta?.unreadCount || 0;

  const hasPermission = (permission: Permission) => {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'TAILOR' || user.role === 'SEAMSTRESS') return true;
    if (user.role === 'WORKER') {
      const membership = user.memberships?.[0];
      if (!membership) return false;
      const rolePerms = ROLE_PERMISSIONS[membership.role] || [];
      const customPerms = (membership.permissions as Permission[]) || [];
      return rolePerms.includes(permission) || customPerms.includes(permission);
    }
    return false;
  };

  const allItems = [
    {
      title: 'Business',
      items: [
        { name: 'Overview', href: '/dashboard/business', icon: LayoutDashboard, required: ['payments:read'] },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart, required: ['orders:read'] }, // Approx
      ],
    },
    {
      title: 'Operations',
      items: [
        { name: 'Clients', href: '/dashboard/clients', icon: Users, required: ['clients:read'] },
        { name: 'Orders', href: '/dashboard/orders', icon: FileText, required: ['orders:read'] },
        { name: 'Workshop', href: '/dashboard/workshop', icon: Scissors, required: ['tasks:read'] },
        { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar, required: ['clients:read'] },
        { name: 'Inventory', href: '/dashboard/inventory', icon: Layers, required: ['inventory:read'] },
        { name: 'Equipment', href: '/dashboard/equipment', icon: Wrench, required: ['inventory:read'] },
      ],
    },
    {
      title: 'Finance',
      items: [
        { name: 'Payments', href: '/dashboard/payments', icon: CreditCard, required: ['payments:read'] },
        { name: 'Invoices', href: '/dashboard/invoices', icon: FileText, required: ['invoices:read'] },
      ],
    },
    {
      title: 'Showcase',
      items: [
        { name: 'Portfolio', href: '/dashboard/portfolio', icon: ImageIcon, required: ['settings:write'] }, // Restricted
        { name: 'Public Profile', href: '/dashboard/showcase', icon: Globe, required: ['settings:write'] },
      ],
    },
    {
      title: 'System',
      items: [
        { name: 'Team', href: '/dashboard/team', icon: Users, required: ['workers:manage'] },
        { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare, required: [] }, // Everyone
        { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, required: [] },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings, required: ['settings:read'] },
      ],
    },
  ];

  const sidebarItems = allItems.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.required || item.required.length === 0) return true;
      return item.required.every(p => hasPermission(p as Permission));
    })
  })).filter(group => group.items.length > 0);

  return (
    <div
      data-sidebar
      className={cn('pb-12 min-h-screen w-64 bg-card border-r flex flex-col no-print', className)}
      {...props}
    >
      <div className="py-6 flex flex-col h-full">
        <div className="px-7 mb-8">
          <Link href="/dashboard/business" className="flex items-center gap-2 group">
            <div className="relative h-8 w-8 rounded-lg overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-200">
              <img src="/icon.png" alt="StitchCraft Logo" className="h-full w-full object-cover" />
            </div>
            <h2 className="text-xl font-bold tracking-tight font-heading text-foreground">
              Stitch<span className="text-primary font-black">Craft</span>
            </h2>
          </Link>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-6">
            {sidebarItems.map((group) => (
              <div key={group.title} className="px-3">
                <h3 className="mb-3 px-4 text-[10px] font-black text-muted-foreground/60 tracking-[0.2em] uppercase font-heading">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
                    return (
                      <Button
                        key={item.href}
                        variant="ghost"
                        className={cn(
                          'w-full justify-start h-11 px-4 transition-all duration-200 group relative',
                          isActive
                            ? 'bg-primary/10 text-primary font-bold hover:bg-primary/20'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        )}
                        asChild
                      >
                        <Link href={item.href} className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <item.icon
                              className={cn(
                                'mr-3 h-4 w-4 transition-colors',
                                isActive ? 'text-primary' : 'group-hover:text-foreground'
                              )}
                            />
                            <span className="text-sm">{item.name}</span>
                          </div>

                          {isActive && (
                            <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                          )}

                          {item.name === 'Notifications' && unreadCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="ml-auto bg-red-600 hover:bg-red-700 text-[10px] px-1.5 h-4 min-w-[16px] flex items-center justify-center rounded-full font-black border-none shadow-sm"
                            >
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </Badge>
                          )}
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
