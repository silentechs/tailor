import { type CurrentUser, requireUser } from './direct-current-user';
import { type Permission, ROLE_PERMISSIONS } from './permissions';
import prisma from './prisma';
// import { Organization } from '@prisma/client';

/**
 * Ensures the current user has the required permission for a specific organization.
 *
 * @param permission The permission to check
 * @param organizationId The organization to check against (optional for global actions)
 * @returns The user and organization context
 * @throws Error if unauthorized or insufficient permissions
 */
export async function requirePermission(
  permission: Permission,
  organizationId?: string
): Promise<{ user: CurrentUser; organization?: any }> {
  const user = await requireUser();

  // 1. Admins bypass all checks
  if (user.role === 'ADMIN') {
    const org = organizationId
      ? await prisma.organization.findUnique({ where: { id: organizationId } })
      : undefined;
    return { user, organization: org || undefined };
  }

  // 2. If organization context is provided, check ownership or membership
  if (organizationId) {
    // Check if user is the owner
    const ownedOrg = await prisma.organization.findFirst({
      where: { id: organizationId, ownerId: user.id },
    });

    if (ownedOrg) {
      return { user, organization: ownedOrg };
    }

    // Check if user is a member
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: user.id,
        },
      },
      include: { organization: true },
    });

    if (membership) {
      const effectivePermissions = [
        ...ROLE_PERMISSIONS[membership.role],
        ...(membership.permissions as Permission[]),
      ];

      if (effectivePermissions.includes(permission)) {
        return { user, organization: membership.organization };
      }
      
      throw new Error(`Forbidden: Missing permission ${permission}`);
    }

    throw new Error('Forbidden: You are not authorized for this organization');
  }

  // 3. No organization context provided
  // Tailors/Seamstresses can perform global actions (like creating their first org)
  if (user.role === 'TAILOR' || user.role === 'SEAMSTRESS') {
    return { user };
  }

  // Workers must always have an organization context
  if (user.role === 'WORKER') {
    throw new Error('Organization context required for worker access');
  }

  // 4. Clients do not have workforce permissions
  throw new Error('Forbidden: Insufficient role');
}

/**
 * Helper to check if a user belongs to an organization without specific permission checks.
 */
export async function requireOrgMember(organizationId: string) {
  const user = await requireUser();

  if (user.role === 'ADMIN') return { user };

  // Check ownership
  const ownedOrg = await prisma.organization.findFirst({
    where: { id: organizationId, ownerId: user.id },
  });
  if (ownedOrg) return { user, organization: ownedOrg };

  // Check membership
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: user.id,
      },
    },
    include: { organization: true },
  });

  if (membership) {
    return { user, organization: membership.organization };
  }

  throw new Error('Forbidden');
}

/**
 * Ensures the user has an active organization and returns its context.
 * Used for general dashboard data fetching where specific workforce permissions aren't yet refined.
 */
export async function requireOrganization(): Promise<{
  user: CurrentUser;
  organizationId: string;
}> {
  const user = await requireUser();

  // 1. Get organization from memberships
  const membership = user.memberships?.[0];
  if (membership) {
    return { user, organizationId: membership.organization.id };
  }

  // 2. Fallback to owned organization for TAILORs
  const ownedOrg = (user as any).ownedOrganizations?.[0];
  if (ownedOrg) {
    return { user, organizationId: ownedOrg.id };
  }

  throw new Error('Unauthorized');
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return user;
}
