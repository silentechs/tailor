import type { OrderStatus, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrganization } from '@/lib/require-permission';
import { generateOrderNumber } from '@/lib/invoice-numbering-system';
import prisma from '@/lib/prisma';

// Validation schema for creating an order
const createOrderSchema = z.object({
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
  deadline: z.string().optional().nullable(),
  collectionId: z.string().optional().nullable(),
  measurements: z.record(z.string(), z.any()).optional(),
});

// GET /api/orders - List all orders for the current organization
export async function GET(request: Request) {
  try {
    const { user, organizationId } = await requireOrganization();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
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

    // Get total count
    const total = await prisma.order.count({ where });

    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where,
      orderBy: { [sortBy]: sortOrder as Prisma.SortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            payments: true,
            messages: true,
          },
        },
      },
    });

    return NextResponse.json({
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
    console.error('Get orders error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/orders - Create a new order
export async function POST(request: Request) {
  try {
    const { user, organizationId } = await requireOrganization();
    const body = await request.json();

    // Validate input
    const validationResult = createOrderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify client belongs to this organization
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        organizationId,
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    // Verify collection if provided
    if (data.collectionId) {
      const collection = await prisma.orderCollection.findFirst({
        where: {
          id: data.collectionId,
          organizationId,
        },
      });

      if (!collection) {
        return NextResponse.json(
          { success: false, error: 'Order collection not found' },
          { status: 404 }
        );
      }
    }

    // Generate order number
    const orderNumber = await generateOrderNumber(user.id);

    // Calculate total
    const materialCost = data.materialCost || 0;
    const totalAmount = data.laborCost + materialCost;

    // Create order with measurement snapshot in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create measurement record if provided
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

      // 2. Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          tailorId: user.id, // Keep as owner for primary relation if needed, but scoping is by org
          organizationId,
          clientId: data.clientId,
          collectionId: data.collectionId,
          garmentType: data.garmentType,
          garmentDescription: data.garmentDescription,
          styleReference: data.styleReference,
          styleNotes: data.styleNotes,
          quantity: data.quantity,
          materialSource: data.materialSource,
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
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          measurement: true,
        },
      });

      // 3. Update collection count if part of a collection
      if (data.collectionId) {
        await tx.orderCollection.update({
          where: { id: data.collectionId },
          data: {
            totalOrders: { increment: 1 },
          },
        });
      }

      return newOrder;
    });

    return NextResponse.json(
      {
        success: true,
        data: order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create order error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}
