import { redirect } from 'next/navigation';
import type * as React from 'react';
import { getCurrentUser } from '@/lib/direct-current-user';
import { AdminClientLayout } from './AdminClientLayout';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login?callbackUrl=/admin/dashboard');
  }

  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <AdminClientLayout>{children}</AdminClientLayout>;
}
