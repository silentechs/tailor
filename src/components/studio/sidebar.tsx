'use client';

import {
  Compass,
  HelpCircle,
  History,
  Images,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Palette,
  Ruler,
  Settings,
  ShoppingBag,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/studio' },
  { icon: ShoppingBag, label: 'My Orders', href: '/studio/orders' },
  { icon: Ruler, label: 'Measurements', href: '/studio/measurements' },
  { icon: Palette, label: 'My Designs', href: '/studio/designs' },
  { icon: Star, label: 'Style Hub', href: '/studio/styles' },
  { icon: History, label: 'Payments', href: '/studio/payments' },
  { icon: MessageSquare, label: 'Messages', href: '/studio/messages' },
];

const discoverItems = [
  { icon: Compass, label: 'Find Designers', href: '/discover' },
  { icon: Images, label: 'Design Gallery', href: '/gallery' },
];

export function StudioSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn('flex flex-col h-full bg-ghana-black text-white p-6', className)}>
      <Link href="/" className="flex items-center gap-3 mb-12 px-2 hover:opacity-80 transition-opacity">
        <div className="h-10 w-10 bg-ghana-gold rounded-xl flex items-center justify-center font-black text-ghana-black text-xl">
          SC
        </div>
        <span className="text-xl font-bold tracking-tighter">STUDIO</span>
      </Link>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'group flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300',
                  isActive
                    ? 'bg-white/10 text-ghana-gold shadow-lg shadow-black/20'
                    : 'hover:bg-white/5 text-zinc-400 hover:text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-300',
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  )}
                />
                <span className="font-bold tracking-wide">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-ghana-gold" />}
              </div>
            </Link>
          );
        })}

        {/* Discover Section */}
        <div className="pt-6 mt-6 border-t border-white/10">
          <p className="px-4 mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            Discover
          </p>
          {discoverItems.map((item) => (
            <Link key={item.href} href={item.href} target="_blank">
              <div className="group flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 hover:bg-white/5 text-zinc-400 hover:text-white">
                <item.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                <span className="font-bold tracking-wide">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </nav>

      <div className="pt-8 mt-8 border-t border-white/10 space-y-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 text-zinc-400 hover:text-white hover:bg-white/5 rounded-2xl py-6"
          asChild
        >
          <Link href="/studio/help">
            <HelpCircle className="h-5 w-5" />
            <span className="font-bold">Help Center</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 text-zinc-400 hover:text-white hover:bg-white/5 rounded-2xl py-6"
          asChild
        >
          <Link href="/studio/settings">
            <Settings className="h-5 w-5" />
            <span className="font-bold">Settings</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 text-zinc-400 hover:text-destructive hover:bg-destructive/10 rounded-2xl py-6"
          onClick={async () => {
            try {
              await fetch('/api/auth/logout');
              window.location.href = '/auth/login';
            } catch (error) {
              console.error('Logout failed', error);
            }
          }}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-bold">Log Out</span>
        </Button>
      </div>
    </div>
  );
}

