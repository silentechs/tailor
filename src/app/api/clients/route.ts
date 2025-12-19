import type { Region } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createTrackingToken } from '@/lib/client-tracking-service';
import { requireActiveTailor } from '@/lib/direct-current-user';
import { notifyNewClient } from '@/lib/notification-service';
import prisma from '@/lib/prisma';
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
  measurements: z.record(z.string(), z.any()).optional(),
  generateTrackingToken: z.boolean().optional().default(false),
});

// GET /api/clients - List all clients for the current tailor
export async function GET(request: Request) {
  try {
    const user = await requireActiveTailor();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where = {
      tailorId: user.id,
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
      orderBy: { [sortBy]: sortOrder },
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

    return NextResponse.json({
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST /api/clients - Create a new client
export async function POST(request: Request) {
  try {
    const user = await requireActiveTailor();
    const body = await request.json();

    // Validate input
    const validationResult = createClientSchema.safeParse(body);
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
      return NextResponse.json(
        {
          success: false,
          error: 'A client with this phone number already exists',
        },
        { status: 400 }
      );
    }

    // Create client with measurement if provided in a transaction
    const client = await prisma.$transaction(async (tx) => {
      // 1. Create client
      const newClient = await tx.client.create({
        data: {
          tailorId: user.id,
          name: data.name,
          phone: formattedPhone,
          email: data.email,
          address: data.address,
          region: data.region as Region | undefined,
          city: data.city,
          notes: data.notes,
        },
      });

      // 2. Create measurement record if provided
      if (data.measurements && Object.keys(data.measurements).length > 0) {
        await tx.clientMeasurement.create({
          data: {
            clientId: newClient.id,
            values: data.measurements,
            notes: 'Initial measurements',
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

    return NextResponse.json(
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: 'Failed to create client' }, { status: 500 });
  }
}
