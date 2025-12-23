import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerUser } from '@/lib/direct-auth';
import * as currentUser from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';
import { GET as getDashboardStatsHandler } from '@/app/api/dashboard/stats/route';
import { GET as getOrderHandler } from '@/app/api/orders/[id]/route';

// Mock bcrypt to avoid actual hashing overhead
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
  hash: vi.fn().mockResolvedValue('hashed_password'),
}));

// Mock requires that we might not need entirely but depend on internal calls
vi.mock('@/lib/direct-current-user', () => ({
  requireUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));

describe('Business Critical Rules', () => {
  describe('Registration Rules', () => {
    it('should create TAILOR users with PENDING status', async () => {
      // Setup
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // No existing email
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        role: 'TAILOR',
        status: 'PENDING',
      } as any);

      // Execute
      await registerUser({
        email: 'test@tailor.com',
        password: 'password123',
        name: 'Test Tailor',
        role: 'TAILOR',
        phone: '0240000000',
        businessName: 'Tailor Shop',
      });

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'TAILOR',
            status: 'PENDING',
          }),
        })
      );
    });

    it('should create CLIENT users with ACTIVE status', async () => {
      // Setup
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '2',
        role: 'CLIENT',
        status: 'ACTIVE',
      } as any);

      // Execute
      await registerUser({
        email: 'test@client.com',
        password: 'password123',
        name: 'Test Client',
        role: 'CLIENT',
      });

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'CLIENT',
            status: 'ACTIVE',
          }),
        })
      );
    });
  });

  describe('Permission Rules (requirePermission)', () => {
    const ORG_ID = 'org-123';

    // Reset mocks
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should allow OWNER (Tailor) unrestricted access to their org', async () => {
      // Setup: Current user is a Tailor who owns the org
      vi.mocked(currentUser.requireUser).mockResolvedValue({
        id: 'user-tailor',
        role: 'TAILOR',
      } as any);

      // Mock DB: Confirm they own it
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({
        id: ORG_ID,
        ownerId: 'user-tailor',
      } as any);

      // Execute & Assert
      await expect(requirePermission('orders:write', ORG_ID)).resolves.not.toThrow();
    });

    it('should allow WORKER if they have the specific permission', async () => {
      // Setup: Current user is a Worker
      vi.mocked(currentUser.requireUser).mockResolvedValue({
        id: 'user-worker',
        role: 'WORKER',
      } as any);

      // Mock DB: Worker is NOT an owner
      vi.mocked(prisma.organization.findFirst).mockResolvedValue(null);

      // Mock DB: They are a member with 'orders:read' permission
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({
        userId: 'user-worker',
        organizationId: ORG_ID,
        role: 'WORKER',
        permissions: ['orders:read'], // Explicit permission granted
        organization: { id: ORG_ID },
      } as any);

      // Execute & Assert
      // 1. Should Pass for orders:read
      await expect(requirePermission('orders:read', ORG_ID)).resolves.not.toThrow();
    });

    it('should DENY WORKER if they lack the specific permission', async () => {
      // Setup: Current user is a Worker
      vi.mocked(currentUser.requireUser).mockResolvedValue({
        id: 'user-worker',
        role: 'WORKER',
      } as any);

      // Mock DB: Worker is NOT an owner
      vi.mocked(prisma.organization.findFirst).mockResolvedValue(null);

      // Mock DB: They are a member with ONLY 'orders:read'
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({
        userId: 'user-worker',
        organizationId: ORG_ID,
        role: 'WORKER',
        permissions: ['orders:read'],
        organization: { id: ORG_ID },
      } as any);

      // Execute & Assert
      // 2. Should Fail for orders:write
      await expect(requirePermission('orders:write', ORG_ID)).rejects.toThrow(/Forbidden/);
    });

    it('should DENY WORKER if they are not a member of the org', async () => {
      // Setup: Current user is a Worker
      vi.mocked(currentUser.requireUser).mockResolvedValue({
        id: 'user-worker',
        role: 'WORKER',
      } as any);

      // Mock DB: Worker is NOT an owner
      vi.mocked(prisma.organization.findFirst).mockResolvedValue(null);

      // Mock DB: Return null (no membership found)
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue(null);

      // Execute & Assert
      await expect(requirePermission('orders:read', ORG_ID)).rejects.toThrow(/Forbidden/);
    });
  });

  describe('Organization Isolation (Cross-Org Access)', () => {
    const ORG_A = 'org-a-123';
    const ORG_B = 'org-b-456';

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should DENY access when user tries to access a different org', async () => {
      // Setup: User belongs to ORG_A but tries to access ORG_B
      vi.mocked(currentUser.requireUser).mockResolvedValue({
        id: 'user-member',
        role: 'TAILOR',
        memberships: [{ organization: { id: ORG_A, name: 'Org A', slug: 'org-a' } }],
      } as any);

      // Mock DB: User is NOT owner of ORG_B
      vi.mocked(prisma.organization.findFirst).mockResolvedValue(null);
      // Mock DB: User is NOT a member of ORG_B
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue(null);

      // Execute & Assert: Cross-org access should be denied
      await expect(requirePermission('orders:read', ORG_B)).rejects.toThrow(/Forbidden/);
    });

    it('should ALLOW access when user accesses their own org', async () => {
      // Setup: User belongs to ORG_A and accesses ORG_A
      vi.mocked(currentUser.requireUser).mockResolvedValue({
        id: 'user-member',
        role: 'TAILOR',
        memberships: [{ organization: { id: ORG_A, name: 'Org A', slug: 'org-a' } }],
      } as any);

      // Mock DB: User owns ORG_A
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({
        id: ORG_A,
        ownerId: 'user-member',
      } as any);

      // Execute & Assert: Same-org access should be allowed
      await expect(requirePermission('orders:read', ORG_A)).resolves.not.toThrow();
    });
  });

  describe('Dashboard Empty State Handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return valid response for new tailor with no data (empty state)', async () => {
      // Setup: New tailor with org membership but no data
      vi.mocked(currentUser.requireUser).mockResolvedValue({
        id: 'new-tailor',
        role: 'TAILOR',
        memberships: [
          {
            id: 'membership-1',
            role: 'MANAGER',
            permissions: [],
            organization: { id: 'org-new', name: 'New Shop', slug: 'new-shop' },
          },
        ],
      } as any);

      // Mock DB: Return org ownership
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({
        id: 'org-new',
        ownerId: 'new-tailor',
      } as any);

      // Execute: requireOrganization should succeed
      const result = await requireOrganization();

      // Assert: Returns valid organization context even with no data
      expect(result).toHaveProperty('organizationId', 'org-new');
      expect(result).toHaveProperty('user');
    });

    it('should return safe empty dashboard stats for worker without financial access', async () => {
      const ORG_ID = 'org-empty';

      vi.mocked(currentUser.requireUser).mockResolvedValue({
        id: 'worker-1',
        role: 'WORKER',
        memberships: [
          {
            id: 'membership-1',
            role: 'WORKER',
            permissions: [],
            organization: { id: ORG_ID, name: 'Empty Org', slug: 'empty-org' },
          },
        ],
      } as any);

      vi.mocked(prisma.organization.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({
        userId: 'worker-1',
        organizationId: ORG_ID,
        role: 'WORKER',
        permissions: [],
        organization: { id: ORG_ID },
      } as any);

      // Empty org data
      vi.mocked(prisma.client.count).mockResolvedValue(0 as any);
      vi.mocked(prisma.order.count).mockResolvedValue(0 as any);
      vi.mocked(prisma.order.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.order.groupBy).mockResolvedValue([] as any);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.notification.count).mockResolvedValue(0 as any);

      const res = await getDashboardStatsHandler();
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.data.overview.totalClients).toBe(0);
      expect(json.data.overview.totalOrders).toBe(0);
      expect(json.data.revenue.thisMonth).toBe(0);
      expect(json.data.revenueTrend).toHaveLength(6);
    });

    it('should allow WORKER with orders:read to access dashboard stats', async () => {
      const ORG_ID = 'org-test';

      // Setup: Worker with orders:read permission
      vi.mocked(currentUser.requireUser).mockResolvedValue({
        id: 'worker-user',
        role: 'WORKER',
        memberships: [
          {
            id: 'membership-1',
            role: 'WORKER',
            permissions: [],
            organization: { id: ORG_ID, name: 'Test Shop', slug: 'test-shop' },
          },
        ],
      } as any);

      // Mock DB: Not owner
      vi.mocked(prisma.organization.findFirst).mockResolvedValue(null);

      // Mock DB: Is a member with WORKER role (has orders:read by default)
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({
        userId: 'worker-user',
        organizationId: ORG_ID,
        role: 'WORKER',
        permissions: [],
        organization: { id: ORG_ID },
      } as any);

      // Execute & Assert: WORKER can access orders:read (needed for dashboard)
      await expect(requirePermission('orders:read', ORG_ID)).resolves.not.toThrow();
    });

    it('should DENY WORKER without payments:read from accessing financial data', async () => {
      const ORG_ID = 'org-test';

      // Setup: Worker without payments:read permission
      vi.mocked(currentUser.requireUser).mockResolvedValue({
        id: 'worker-user',
        role: 'WORKER',
      } as any);

      // Mock DB: Not owner
      vi.mocked(prisma.organization.findFirst).mockResolvedValue(null);

      // Mock DB: Is a member with WORKER role (lacks payments:read)
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({
        userId: 'worker-user',
        organizationId: ORG_ID,
        role: 'WORKER',
        permissions: [],
        organization: { id: ORG_ID },
      } as any);

      // Execute & Assert: WORKER cannot access payments:read
      await expect(requirePermission('payments:read', ORG_ID)).rejects.toThrow(/Forbidden/);
    });
  });

  describe('API Route Isolation (Cross-Org)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return 404 when accessing an order outside the current org', async () => {
      const ORG_A = 'org-a';

      vi.mocked(currentUser.requireUser).mockResolvedValue({
        id: 'worker-1',
        role: 'WORKER',
        memberships: [
          {
            id: 'membership-1',
            role: 'WORKER',
            permissions: [],
            organization: { id: ORG_A, name: 'Org A', slug: 'org-a' },
          },
        ],
      } as any);

      vi.mocked(prisma.organization.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({
        userId: 'worker-1',
        organizationId: ORG_A,
        role: 'WORKER',
        permissions: [],
        organization: { id: ORG_A },
      } as any);

      // Order is not in this org (or doesn't exist)
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null as any);

      const res = await getOrderHandler(new Request('http://localhost'), {
        params: Promise.resolve({ id: 'order-foreign' }),
      } as any);

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/not found/i);
    });
  });
});
