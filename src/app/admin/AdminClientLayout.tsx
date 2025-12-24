'use client';

import {
  Activity,
  BarChart3,
  Bell,
  History,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessageSquare,
  Package,
  ShieldCheck,
  Users,
  Wallet,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useCsrf } from '@/hooks/use-csrf';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
  { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Login History', href: '/admin/login-history', icon: History },
  { label: 'Traffic', href: '/admin/traffic', icon: Activity },
  { label: 'Orders', href: '/admin/orders', icon: Package },
  { label: 'Payments', href: '/admin/payments', icon: Wallet },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Messages', href: '/admin/messaging-tracking', icon: MessageSquare },
  { label: 'Feedback', href: '/admin/feedback', icon: MessageCircle },
  { label: 'API Docs', href: '/admin/docs', icon: BookOpen },
];


export function AdminClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Initialize CSRF token
  useCsrf();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/auth/login';
        return;
      }
      // Fallback to GET logout if POST fails
      window.location.href = '/api/auth/logout';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/api/auth/logout';
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-50">
        <div className="p-8 pb-4 flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="font-heading font-black text-xl tracking-tight text-slate-900 uppercase">
            Stitch<span className="text-primary italic">Admin</span>
          </span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  'w-full justify-start h-12 rounded-xl px-4 transition-all group',
                  isActive
                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                )}
                asChild
              >
                <Link href={item.href}>
                  <Icon
                    className={cn(
                      'h-5 w-5 mr-3 transition-transform group-hover:scale-110',
                      isActive ? 'text-primary' : 'text-slate-400'
                    )}
                  />
                  <span className="font-bold">{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 truncate">Platform Admin</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Super Admin
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-500"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        {/* Top Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-10 h-20 flex items-center justify-between z-40">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
            Platform Control Center
          </h2>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5 text-slate-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </Button>
            <div className="h-8 w-[1px] bg-slate-100 mx-2" />
            <Button
              variant="outline"
              className="rounded-xl border-slate-200 text-slate-600 font-bold px-6"
              asChild
            >
              <Link href="/admin/docs">Documentation</Link>
            </Button>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
