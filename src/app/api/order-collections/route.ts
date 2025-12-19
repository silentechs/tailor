import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/utils';

// Validation schema for creating an order within a collection
const createOrderInCollectionSchema = z.object({
  clientId: z.string(),
  garmentType: z.string(),
  garmentDescription: z.string().optional(),
  styleReference: z.string().optional().nullable(),
  styleNotes: z.string().optional().nullable(),
  quantity: z.number().default(1),
  materialSource: z
    .enum(['CLIENT_PROVIDED', 'TAILOR_PROVIDED', 'SPLIT'])
    .default('CLIENT_PROVIDED'),
  materialDetails: z.string().optional().nullable(),
  materialCost: z.number().optional().nullable(),
  laborCost: z.number(),
  totalAmount: z.number(),
  paidAmount: z.number().default(0),
  deadline: z.string().optional().nullable(),
  measurements: z.record(z.string(), z.any()).optional().nullable(),
});

// Validation schema for creating a collection
const createCollectionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  orders: z.array(createOrderInCollectionSchema).optional(),
});

// GET /api/order-collections - List all collections
export async function GET(request: Request) {
  try {
    const user = await requireActiveTailor();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const where = { tailorId: user.id };

    const total = await prisma.orderCollection.count({ where });

    const collections = await prisma.orderCollection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: collections,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get collections error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

// POST /api/order-collections - Create a new collection
export async function POST(request: Request) {
  try {
    const user = await requireActiveTailor();
    const body = await request.json();

    const validationResult = createCollectionSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error);
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

    // Use transaction to create collection and orders
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Collection
      const collection = await tx.orderCollection.create({
        data: {
          tailorId: user.id,
          name: data.name,
          description: data.description,
          deadline: data.deadline ? new Date(data.deadline) : null,
          totalOrders: data.orders?.length || 0,
        },
      });

      // 2. Create Orders if any
      if (data.orders && data.orders.length > 0) {
        for (const orderData of data.orders) {
          // Generate unique order number
          let orderNumber = generateOrderNumber();
          let isUnique = false;
          while (!isUnique) {
            const existing = await tx.order.findUnique({ where: { orderNumber } });
            if (!existing) isUnique = true;
            else orderNumber = generateOrderNumber();
          }

          // 2.2 Create measurement record if provided
          let measurementId: string | undefined;
          if (orderData.measurements && Object.keys(orderData.measurements as object).length > 0) {
            const measurementRecord = await tx.clientMeasurement.create({
              data: {
                clientId: orderData.clientId,
                values: orderData.measurements as any,
                notes: `Snapshot for Order ${orderNumber} (Collection: ${data.name})`,
              },
            });
            measurementId = measurementRecord.id;
          }

          await tx.order.create({
            data: {
              tailorId: user.id,
              clientId: orderData.clientId,
              collectionId: collection.id,
              orderNumber,
              garmentType: orderData.garmentType as any,
              garmentDescription: orderData.garmentDescription,
              styleReference: orderData.styleReference,
              styleNotes: orderData.styleNotes,
              quantity: orderData.quantity,
              materialSource: orderData.materialSource,
              materialDetails: orderData.materialDetails,
              materialCost: orderData.materialCost ? Number(orderData.materialCost) : null,
              laborCost: Number(orderData.laborCost),
              totalAmount: Number(orderData.totalAmount),
              paidAmount: Number(orderData.paidAmount),
              deadline: orderData.deadline
                ? new Date(orderData.deadline)
                : data.deadline
                  ? new Date(data.deadline)
                  : null,
              measurementId,
              status: 'PENDING',
            },
          });
        }
      }

      return collection;
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create collection error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}
