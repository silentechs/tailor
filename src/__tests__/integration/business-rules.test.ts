import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerUser } from '@/lib/direct-auth';
import * as currentUser from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

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

      // Mock DB: Return null (no membership found)
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue(null);

      // Execute & Assert
      await expect(requirePermission('orders:read', ORG_ID)).rejects.toThrow(/Forbidden/);
    });
  });
});
