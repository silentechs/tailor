import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET as getDashboardStats } from '@/app/api/dashboard/stats/route';
import prisma from '@/lib/prisma';
import * as requirePermissionLib from '@/lib/require-permission';

// Mock the require-permission module to control auth behavior
vi.mock('@/lib/require-permission', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/require-permission')>();
  return {
    ...actual,
    requireOrganization: vi.fn(),
    requirePermission: vi.fn(),
  };
});

describe('Tenancy and Data Isolation', () => {
  const ORG_ID = 'org-123';
  const USER_ID = 'user-worker';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Stats API Isolation', () => {
    it('should return 0 financial stats if worker lacks payments:read permission', async () => {
      // Mock requireOrganization to return our org
      vi.mocked(requirePermissionLib.requireOrganization).mockResolvedValue({
        user: { id: USER_ID, memberships: [{ organization: { id: ORG_ID } }] } as any,
        organizationId: ORG_ID,
      });

      // Mock requirePermission to fail for payments:read
      vi.mocked(requirePermissionLib.requirePermission).mockImplementation(async (perm: string) => {
        if (perm === 'payments:read') {
          throw new Error('Forbidden: Missing permission payments:read');
        }
        return { user: { id: USER_ID } } as any;
      });

      // Mock other prisma calls to return empty/basic data
      vi.mocked(prisma.client.count).mockResolvedValue(5);
      vi.mocked(prisma.order.count).mockResolvedValue(10);
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);
      vi.mocked(prisma.order.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.notification.count).mockResolvedValue(0);

      const response = await getDashboardStats();
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.revenue.thisMonth).toBe(0);
      expect(body.data.revenue.thisWeek).toBe(0);
      expect(body.data.revenue.today).toBe(0);
      
      // Ensure we didn't call aggregate for payments if permission failed
      expect(prisma.payment.aggregate).not.toHaveBeenCalled();
    });

    it('should correctly scope all queries to organizationId', async () => {
      vi.mocked(requirePermissionLib.requireOrganization).mockResolvedValue({
        user: { id: USER_ID } as any,
        organizationId: ORG_ID,
      });
      vi.mocked(requirePermissionLib.requirePermission).mockResolvedValue({ user: { id: USER_ID } } as any);

      // Mock prisma calls to avoid errors
      vi.mocked(prisma.client.count).mockResolvedValue(0);
      vi.mocked(prisma.order.count).mockResolvedValue(0);
      vi.mocked(prisma.payment.aggregate).mockResolvedValue({ _sum: { amount: null } } as any);
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);
      vi.mocked(prisma.order.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.payment.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.notification.count).mockResolvedValue(0);
      vi.mocked(prisma.order.aggregate).mockResolvedValue({ _avg: { totalAmount: null } } as any);

      await getDashboardStats();

      // Check if prisma calls include organizationId in where clause
      expect(prisma.client.count).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ organizationId: ORG_ID })
      }));
      expect(prisma.order.count).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ organizationId: ORG_ID })
      }));
    });
  });
});

