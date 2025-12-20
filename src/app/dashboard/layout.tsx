'use client';

import type * as React from 'react';
import { FAB } from '@/components/navigation/fab';
import { MobileNav } from '@/components/navigation/mobile-nav';
import { Sidebar } from '@/components/navigation/sidebar';
import { Topbar } from '@/components/navigation/topbar';
import { useOfflineSync } from '@/hooks/use-offline-sync';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Initialize background sync
  useOfflineSync();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:block w-64 fixed inset-y-0 z-50 shadow-sm" />

      {/* Main Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen pb-20 md:pb-0 transition-all duration-300 ease-in-out">
        <Topbar />

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Floating Action Button */}
      <FAB />
    </div>
  );
}
