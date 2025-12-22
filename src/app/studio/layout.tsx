import { redirect } from 'next/navigation';
import type * as React from 'react';
import { getCurrentUser } from '@/lib/direct-current-user';
import { StudioClientContent } from './StudioClientContent';

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login?callbackUrl=/studio');
  }

  // Security: Only CLIENT users should access the Studio
  if (user.role !== 'CLIENT') {
    redirect('/dashboard');
  }

  return <StudioClientContent>{children}</StudioClientContent>;
}
