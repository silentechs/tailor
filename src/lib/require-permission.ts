import { requireUser, type CurrentUser } from './direct-current-user';
import prisma from './prisma';
import { ROLE_PERMISSIONS, type Permission } from './permissions';
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

    // 2. Tailors (Shop Owners) have full access to organizations they own
    if (user.role === 'TAILOR' || user.role === 'SEAMSTRESS') {
        if (!organizationId) {
            // Global tailor action (e.g. creating their first org)
            return { user };
        }

        const org = await prisma.organization.findFirst({
            where: { id: organizationId, ownerId: user.id }
        });

        if (!org) {
            throw new Error('Forbidden: You do not own this organization');
        }

        return { user, organization: org };
    }

    // 3. Workers must be members of the organization and have the required permission
    if (user.role === 'WORKER') {
        if (!organizationId) {
            throw new Error('Organization context required for worker access');
        }

        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId: user.id
                }
            },
            include: { organization: true }
        });

        if (!membership) {
            throw new Error('Forbidden: You are not a member of this organization');
        }

        const effectivePermissions = [
            ...ROLE_PERMISSIONS[membership.role],
            ...(membership.permissions as Permission[]),
        ];

        if (!effectivePermissions.includes(permission)) {
            throw new Error(`Forbidden: Missing permission ${permission}`);
        }

        return { user, organization: membership.organization };
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

    if (user.role === 'TAILOR' || user.role === 'SEAMSTRESS') {
        const org = await prisma.organization.findFirst({
            where: { id: organizationId, ownerId: user.id }
        });
        if (!org) throw new Error('Forbidden');
        return { user, organization: org };
    }

    if (user.role === 'WORKER') {
        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId: user.id
                }
            },
            include: { organization: true }
        });
        if (!membership) throw new Error('Forbidden');
        return { user, organization: membership.organization };
    }

    throw new Error('Forbidden');
}

/**
 * Ensures the user has an active organization and returns its context.
 * Used for general dashboard data fetching where specific workforce permissions aren't yet refined.
 */
export async function requireOrganization(): Promise<{ user: CurrentUser; organizationId: string }> {
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
