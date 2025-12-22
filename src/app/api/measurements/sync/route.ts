import { z } from 'zod';
import { secureErrorResponse, secureJsonResponse, withSecurity } from '@/lib/api-security';
import { logAudit } from '@/lib/audit-service';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';

const syncSchema = z.object({
  measurements: z.array(
    z.object({
      clientSideId: z.string(),
      clientId: z.string(),
      templateId: z.string().optional().nullable(),
      values: z.record(z.string(), z.any()),
      notes: z.string().optional().nullable(),
      sketch: z.string().optional().nullable(),
      createdAt: z.number(),
    })
  ),
});

export const POST = withSecurity(
  async (_request: Request, { sanitizedBody }) => {
    try {
      const { user, organizationId } = await requireOrganization();
      // Batch sync needs write permission
      await requirePermission('clients:write', organizationId);

      const body = sanitizedBody;
      const validation = syncSchema.safeParse(body);

      if (!validation.success) {
        return secureErrorResponse('Invalid data', 400);
      }

      const { measurements } = validation.data;
      const results = [];

      for (const m of measurements) {
        try {
          // SECURITY: Verify client belongs to this organization before syncing
          const client = await prisma.client.findFirst({
            where: {
              id: m.clientId,
              organizationId,
            },
          });

          if (!client) {
            console.warn(
              `Attempt to sync measurement for unauthorized client ${m.clientId} by user ${user.id}`
            );
            results.push({
              clientSideId: m.clientSideId,
              status: 'error',
              error: 'Unauthorized client',
            });
            continue;
          }

          // Upsert based on clientSideId to prevent duplicates
          const record = await prisma.clientMeasurement.upsert({
            where: { clientSideId: m.clientSideId },
            update: {
              values: m.values,
              notes: m.notes,
              sketch: m.sketch,
            },
            create: {
              clientSideId: m.clientSideId,
              clientId: m.clientId,
              templateId: m.templateId,
              values: m.values,
              notes: m.notes,
              sketch: m.sketch,
              createdAt: new Date(m.createdAt),
              isSynced: true,
            },
          });
          results.push({ clientSideId: m.clientSideId, serverId: record.id, status: 'synced' });
        } catch (err) {
          console.error(`Failed to sync measurement ${m.clientSideId}:`, err);
          results.push({ clientSideId: m.clientSideId, status: 'error', error: 'Internal error' });
        }
      }

      if (results.some((r) => r.status === 'synced')) {
        await logAudit({
          userId: user.id,
          action: 'MEASUREMENT_SYNC',
          resource: 'measurement',
          details: { count: results.filter((r) => r.status === 'synced').length, organizationId },
        });
      }

      return secureJsonResponse({ success: true, results });
    } catch (error) {
      console.error('Batch sync error:', error);
      return secureErrorResponse('Internal Server Error', 500);
    }
  },
  'measurements:sync',
  { rateLimit: 'write' }
);
