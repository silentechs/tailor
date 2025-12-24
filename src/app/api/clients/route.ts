import type { Region, UserRole } from '@prisma/client';
import { secureErrorResponse, secureJsonResponse, withSecurity } from '@/lib/api-security';
import { logAudit } from '@/lib/audit-service';
import { createTrackingToken } from '@/lib/client-tracking-service';
import { sendClientLinkedEmail } from '@/lib/email-service';
import { notifyNewClient } from '@/lib/notification-service';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';
import { formatGhanaPhone, isValidGhanaPhone } from '@/lib/utils';
import { registry, z as zod } from '@/lib/api-docs';

// Validation schema for creating a client
const createClientSchema = zod.object({
  name: zod.string().min(2, 'Name must be at least 2 characters').openapi({ example: 'John Doe' }),
  phone: zod.string().refine((val) => isValidGhanaPhone(val), 'Invalid Ghana phone number').openapi({ example: '+233201234567' }),
  email: zod.string().email('Invalid email').optional().nullable().openapi({ example: 'john@example.com' }),
  gender: zod.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  address: zod.string().optional().nullable(),
  region: zod.string().optional().nullable(),
  city: zod.string().optional().nullable(),
  notes: zod.string().optional().nullable(),
  measurements: zod
    .object({
      values: zod.record(zod.string(), zod.any()),
      clientSideId: zod.string().optional(),
    })
    .optional(),
  generateTrackingToken: zod.boolean().optional().default(false),
});

// Register the Schema and Paths (guarded for Next.js Dev mode)
try {
  registry.register('Client', createClientSchema);

  // Register the GET route
  registry.registerPath({
    method: 'get',
    path: '/clients',
    summary: 'List all clients',
    description: 'Returns a paginated list of clients for the current organization.',
    security: [{ cookieAuth: [] }, { bearerAuth: [] }],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: zod.object({
              success: zod.boolean(),
              data: zod.array(zod.any()),
              pagination: zod.object({
                page: zod.number(),
                pageSize: zod.number(),
                total: zod.number(),
                totalPages: zod.number(),
              }),
            }),
          },
        },
      },
    },
  });

  // Register the POST route
  registry.registerPath({
    method: 'post',
    path: '/clients',
    summary: 'Create a new client',
    description: 'Creates a new client in the system. Optionally generates a tracking token.',
    security: [{ cookieAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: createClientSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Client created successfully',
        content: {
          'application/json': {
            schema: zod.object({
              success: zod.boolean(),
              data: zod.any(),
            }),
          },
        },
      },
      400: { description: 'Validation failed or client already exists' },
    },
  });
} catch (e) {
  // Ignore already registered error in HMR/Dev
}

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
      const includeArchived = searchParams.get('includeArchived') === 'true';

      // Build where clause
      const where = {
        organizationId,
        // Filter out archived clients by default
        ...(includeArchived ? {} : { isArchived: false }),
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

      // NEW: Check if there is a Global User with this phone or email
      let globalUser = await prisma.user.findFirst({
        where: {
          phone: formattedPhone,
          role: 'CLIENT' as UserRole,
        },
      });

      // If no match by phone, try matching by email
      if (!globalUser && data.email) {
        globalUser = await prisma.user.findFirst({
          where: {
            email: data.email,
            role: 'CLIENT' as UserRole,
          },
        });
      }

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
            gender: data.gender,
            address: data.address,
            region: data.region as Region | undefined,
            city: data.city,
            notes: data.notes,
            userId: globalUser?.id,
            profileImage: globalUser?.profileImage || undefined,
          } as any,
        });

        // 2. Auto-link user's account bidirectionally (so they see data in Studio)
        // Only set if user doesn't already have a linked client (avoid overwriting)
        if (globalUser?.id && !globalUser.linkedClientId) {
          await tx.user.update({
            where: { id: globalUser.id },
            data: { linkedClientId: newClient.id },
          });
        }

        // 3. Create measurement record
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

      // Send email to linked client (if they have an account with email)
      if (globalUser?.email) {
        sendClientLinkedEmail(
          globalUser.email,
          globalUser.name || data.name,
          user.name,
          user.businessName || null
        ).catch(console.error); // Fire-and-forget
      }

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
