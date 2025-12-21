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
  role: 'ADMIN' | 'TAILOR' | 'SEAMSTRESS' | 'WORKER' | 'CLIENT';
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  notifyEmail: boolean;
  notifySms: boolean;
  showcaseEnabled: boolean;
  showcaseUsername: string | null;
  createdAt: Date;
  linkedClientId?: string | null;
  memberships?: {
    id: string;
    role: string;
    permissions: string[];
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession() as any;

  if (!session?.user) {
    return null;
  }

  return session.user as any as CurrentUser;
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

export async function requireOrganization(): Promise<{ user: CurrentUser; organizationId: string }> {
  const user = await requireUser();

  // 1. Get organization from memberships
  const membership = user.memberships?.[0];
  if (membership) {
    return { user, organizationId: membership.organization.id };
  }

  // 2. Fallback to owned organization for TAILORs who might not have membership yet
  // (though our migration script should have created memberships)
  const ownedOrg = (user as any).ownedOrganizations?.[0];
  if (ownedOrg) {
    return { user, organizationId: ownedOrg.id };
  }

  throw new Error('Organization context required');
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

export async function requireClient(): Promise<CurrentUser> {
  const user = await requireUser();

  if (user.role !== 'CLIENT') {
    throw new Error('Forbidden');
  }

  return user;
}
