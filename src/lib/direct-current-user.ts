import { getSession } from './direct-auth';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  businessName: string | null;
  businessAddress: string | null;
  region: string | null;
  city: string | null;
  profileImage: string | null;
  bio: string | null;
  role: 'ADMIN' | 'TAILOR' | 'SEAMSTRESS';
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  notifyEmail: boolean;
  notifySms: boolean;
  showcaseEnabled: boolean;
  showcaseUsername: string | null;
  createdAt: Date;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  return session.user as CurrentUser;
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();

  if (user.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }

  return user;
}

export async function requireActiveTailor(): Promise<CurrentUser> {
  const user = await requireUser();

  if (user.role !== 'TAILOR' && user.role !== 'SEAMSTRESS') {
    throw new Error('Forbidden');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('Account not active');
  }

  return user;
}
