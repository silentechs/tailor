import type { Region, UserRole } from '@prisma/client';
import { z } from 'zod';
import { secureErrorResponse, secureJsonResponse, withSecurity } from '@/lib/api-security';
import { logAudit } from '@/lib/audit-service';
import { createTrackingToken } from '@/lib/client-tracking-service';
import { notifyNewClient } from '@/lib/notification-service';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';
import { formatGhanaPhone, isValidGhanaPhone } from '@/lib/utils';

// Validation schema for creating a client
const createClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().refine((val) => isValidGhanaPhone(val), 'Invalid Ghana phone number'),
  email: z.string().email('Invalid email').optional().nullable(),
  address: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  measurements: z
    .object({
      values: z.record(z.string(), z.any()),
      clientSideId: z.string().optional(),
    })
    .optional(),
  generateTrackingToken: z.boolean().optional().default(false),
});

// GET /api/clients - List all clients for the current organization
export const GET = withSecurity(
  async (request: Request) => {
    try {
      const { organizationId } = await requireOrganization();
      await requirePermission('clients:read', organizationId);

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
      const search = searchParams.get('search') || '';
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // Build where clause
      const where = {
        organizationId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      // Get total count
      const total = await prisma.client.count({ where });

      // Get clients with pagination
      const clients = await prisma.client.findMany({
        where,
        orderBy: { [sortBy]: sortOrder as any },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: {
              orders: true,
              payments: true,
            },
          },
          trackingTokens: {
            where: { isActive: true },
            select: { token: true },
            take: 1,
          },
        },
      });

      return secureJsonResponse({
        success: true,
        data: clients.map((client) => ({
          ...client,
          orderCount: client._count.orders,
          paymentCount: client._count.payments,
          trackingToken: client.trackingTokens[0]?.token || null,
          _count: undefined,
          trackingTokens: undefined,
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error('Get clients error:', error);

      if (error instanceof Error && error.message === 'Unauthorized') {
        return secureErrorResponse('Unauthorized', 401);
      }

      return secureErrorResponse('Failed to fetch clients', 500);
    }
  },
  'clients:list',
  { rateLimit: 'api' }
);

// POST /api/clients - Create a new client
export const POST = withSecurity(
  async (_request: Request, { sanitizedBody }) => {
    try {
      const { user, organizationId } = await requireOrganization();
      await requirePermission('clients:write', organizationId);

      const body = sanitizedBody;

      // Validate input
      const validationResult = createClientSchema.safeParse(body);
      if (!validationResult.success) {
        return secureErrorResponse('Validation failed', 400);
      }

      const data = validationResult.data;
      const formattedPhone = formatGhanaPhone(data.phone);

      // Check if client with same phone already exists for this tailor
      const existingClient = await prisma.client.findUnique({
        where: {
          tailorId_phone: {
            tailorId: user.id,
            phone: formattedPhone,
          },
        },
      });

      if (existingClient) {
        return secureErrorResponse('A client with this phone number already exists', 400);
      }

      // NEW: Check if there is a Global User with this phone number
      const globalUser = await prisma.user.findFirst({
        where: {
          phone: formattedPhone,
          role: 'CLIENT' as UserRole,
        },
      });

      const globalUserWithMeasurements = globalUser as any;

      // Create client with measurement if provided in a transaction
      const client = await prisma.$transaction(async (tx) => {
        // 1. Create client
        const newClient = await tx.client.create({
          data: {
            tailorId: user.id,
            organizationId: organizationId,
            name: globalUser?.name || data.name,
            phone: formattedPhone,
            email: globalUser?.email || data.email,
            address: data.address,
            region: data.region as Region | undefined,
            city: data.city,
            notes: data.notes,
            userId: globalUser?.id,
            profileImage: globalUser?.profileImage || undefined,
          } as any,
        });

        // 2. Create measurement record
        let measurementValues = data.measurements?.values;
        let measurementNotes = 'Initial measurements';

        if (
          (!measurementValues || Object.keys(measurementValues).length === 0) &&
          globalUserWithMeasurements?.measurements
        ) {
          measurementValues = globalUserWithMeasurements.measurements as Record<string, any>;
          measurementNotes = 'Imported from Client Profile';
        }

        if (measurementValues && Object.keys(measurementValues).length > 0) {
          await (tx.clientMeasurement.create as any)({
            data: {
              clientId: newClient.id,
              values: measurementValues,
              clientSideId: data.measurements?.clientSideId,
              notes: measurementNotes,
              isSynced: true,
            },
          });
        }

        return newClient;
      });

      // Generate tracking token if requested
      let trackingInfo = null;
      if (data.generateTrackingToken) {
        trackingInfo = await createTrackingToken(client.id);
      }

      // Create notification
      await notifyNewClient(user.id, client.name);

      // Audit Log
      await logAudit({
        userId: user.id,
        action: 'CLIENT_CREATE',
        resource: 'client',
        resourceId: client.id,
        details: { name: client.name, organizationId },
      });

      return secureJsonResponse(
        {
          success: true,
          data: {
            ...client,
            trackingToken: trackingInfo?.token || null,
            trackingUrl: trackingInfo?.url || null,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Create client error:', error);

      if (error instanceof Error && error.message === 'Unauthorized') {
        return secureErrorResponse('Unauthorized', 401);
      }

      return secureErrorResponse('Failed to create client', 500);
    }
  },
  'clients:create',
  { rateLimit: 'write' }
);
