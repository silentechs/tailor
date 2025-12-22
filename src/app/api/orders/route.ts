import type { MaterialSourceType, OrderStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { secureErrorResponse, secureJsonResponse, withSecurity } from '@/lib/api-security';
import { logAudit } from '@/lib/audit-service';
import { generateOrderNumber } from '@/lib/invoice-numbering-system';
import { captureError } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';

// Validation schema for creating an order
const createOrderSchema = z
  .object({
    clientId: z.string().min(1, 'Client is required'),
    garmentType: z.enum([
      'KABA_AND_SLIT',
      'DASHIKI',
      'SMOCK_BATAKARI',
      'KAFTAN',
      'AGBADA',
      'COMPLET',
      'KENTE_CLOTH',
      'BOUBOU',
      'SUIT',
      'DRESS',
      'SHIRT',
      'TROUSERS',
      'SKIRT',
      'BLOUSE',
      'OTHER',
    ]),
    garmentDescription: z.string().optional().nullable(),
    styleReference: z.string().optional().nullable(),
    styleNotes: z.string().optional().nullable(),
    quantity: z.number().int().positive().default(1),
    materialSource: z
      .enum(['CLIENT_PROVIDED', 'TAILOR_PROVIDED', 'SPLIT'])
      .default('CLIENT_PROVIDED'),
    materialDetails: z.string().optional().nullable(),
    materialCost: z.number().nonnegative().optional().nullable(),
    laborCost: z.number().nonnegative(),
    totalAmount: z.number().nonnegative().optional(),
    deadline: z.string().optional().nullable(),
    collectionId: z.string().optional().nullable(),
    measurements: z.record(z.string(), z.any()).optional(),
  })
  .refine(
    (data) => {
      if (data.totalAmount !== undefined) {
        const materialCost = data.materialCost || 0;
        const calculatedTotal = data.laborCost + materialCost;
        return Math.abs(data.totalAmount - calculatedTotal) < 0.01;
      }
      return true;
    },
    {
      message: 'totalAmount must equal laborCost + materialCost',
      path: ['totalAmount'],
    }
  );

// GET /api/orders - List all orders for the current organization
export const GET = withSecurity(async (request: Request) => {
  try {
    const { organizationId } = await requireOrganization();
    await requirePermission('orders:read', organizationId);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Prisma.OrderWhereInput = {
      organizationId,
      ...(status && { status: status as OrderStatus }),
      ...(clientId && { clientId }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' as const } },
          { client: { name: { contains: search, mode: 'insensitive' as const } } },
          { garmentDescription: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const total = await prisma.order.count({ where });

    const orders = await prisma.order.findMany({
      where,
      orderBy: { [sortBy]: sortOrder as Prisma.SortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        client: {
          select: { id: true, name: true, phone: true, email: true },
        },
        collection: {
          select: { id: true, name: true },
        },
        _count: {
          select: { payments: true, messages: true },
        },
      },
    });

    return secureJsonResponse({
      success: true,
      data: orders.map((order) => {
        const { _count, ...rest } = order;
        return {
          ...rest,
          paymentCount: _count.payments,
          messageCount: _count.messages,
        };
      }),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    captureError('OrdersAPI:GET', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return secureErrorResponse('Unauthorized', 401);
    }
    return secureErrorResponse('Failed to fetch orders', 500);
  }
}, 'orders:list');

// POST /api/orders - Create a new order
export const POST = withSecurity(
  async (_request: Request, { sanitizedBody }) => {
    try {
      const { user, organizationId } = await requireOrganization();
      await requirePermission('orders:write', organizationId);

      const body = sanitizedBody;

      const validationResult = createOrderSchema.safeParse(body);
      if (!validationResult.success) {
        return secureErrorResponse('Validation failed', 400);
      }

      const data = validationResult.data;

      const client = await prisma.client.findFirst({
        where: { id: data.clientId, organizationId },
      });

      if (!client) {
        return secureErrorResponse('Client not found', 404);
      }

      if (data.collectionId) {
        const collection = await prisma.orderCollection.findFirst({
          where: { id: data.collectionId, organizationId },
        });
        if (!collection) {
          return secureErrorResponse('Order collection not found', 404);
        }
      }

      const orderNumber = await generateOrderNumber(user.id);
      const materialCost = data.materialCost || 0;
      const totalAmount = data.laborCost + materialCost;

      const order = await prisma.$transaction(async (tx) => {
        let measurementId: string | undefined;
        if (data.measurements && Object.keys(data.measurements).length > 0) {
          const measurementRecord = await tx.clientMeasurement.create({
            data: {
              clientId: data.clientId,
              values: data.measurements,
              notes: `Snapshot for Order ${orderNumber}`,
            },
          });
          measurementId = measurementRecord.id;
        }

        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            tailorId: user.id,
            organizationId,
            clientId: data.clientId,
            collectionId: data.collectionId,
            garmentType: data.garmentType,
            garmentDescription: data.garmentDescription,
            styleReference: data.styleReference,
            styleNotes: data.styleNotes,
            quantity: data.quantity,
            materialSource: data.materialSource as MaterialSourceType,
            materialDetails: data.materialDetails,
            materialCost: materialCost,
            laborCost: data.laborCost,
            totalAmount,
            deadline: data.deadline ? new Date(data.deadline) : null,
            status: 'PENDING',
            measurementId,
          },
          include: {
            client: {
              select: { id: true, name: true, phone: true, email: true },
            },
            measurement: true,
          },
        });

        if (data.collectionId) {
          await tx.orderCollection.update({
            where: { id: data.collectionId },
            data: { totalOrders: { increment: 1 } },
          });
        }

        return newOrder;
      });

      // Audit Log
      await logAudit({
        userId: user.id,
        action: 'ORDER_CREATE',
        resource: 'order',
        resourceId: order.id,
        details: { orderNumber: order.orderNumber, clientId: order.clientId, organizationId },
      });

      return secureJsonResponse({ success: true, data: order }, { status: 201 });
    } catch (error) {
      captureError('OrdersAPI:POST', error);
      if (error instanceof Error && error.message === 'Unauthorized') {
        return secureErrorResponse('Unauthorized', 401);
      }
      return secureErrorResponse('Failed to create order', 500);
    }
  },
  'orders:create',
  { rateLimit: 'write' }
);
