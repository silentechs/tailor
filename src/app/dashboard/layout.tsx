import { redirect } from 'next/navigation';
import type * as React from 'react';
import { getCurrentUser } from '@/lib/direct-current-user';
import { DashboardClientContent } from './DashboardClientContent';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login?callbackUrl=/dashboard');
  }

  // Security: Prevent CLIENT users from accessing the staff dashboard
  if (user.role === 'CLIENT') {
    redirect('/studio');
  }

  return <DashboardClientContent user={user}>{children}</DashboardClientContent>;
}
