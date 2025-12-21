import type { Region } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';
import { formatGhanaPhone, isValidGhanaPhone } from '@/lib/utils';

// Validation schema for updating a client
const updateClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z
    .string()
    .refine((val) => isValidGhanaPhone(val), 'Invalid Ghana phone number')
    .optional(),
  email: z.string().email('Invalid email').optional().nullable(),
  address: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  profileImage: z.string().optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/clients/[id] - Get a single client
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireActiveTailor();
    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: {
        id,
        tailorId: user.id,
      },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            garmentType: true,
            status: true,
            totalAmount: true,
            paidAmount: true,
            deadline: true,
            createdAt: true,
          },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
          take: 10,
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            method: true,
            status: true,
            paidAt: true,
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
        trackingTokens: {
          where: { isActive: true },
          select: {
            token: true,
            createdAt: true,
            lastUsedAt: true,
          },
        },
        socialConsents: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        clientMeasurements: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    // Calculate totals
    const totalOrders = await prisma.order.count({
      where: { clientId: id },
    });

    const totalPaid = await prisma.payment.aggregate({
      where: { clientId: id, status: 'COMPLETED' },
      _sum: { amount: true },
    });

    const totalOwed = await prisma.order.aggregate({
      where: { clientId: id },
      _sum: { totalAmount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...client,
        stats: {
          totalOrders,
          totalPaid: totalPaid._sum.amount || 0,
          totalOwed: totalOwed._sum.totalAmount || 0,
          balance: Number(totalOwed._sum.totalAmount || 0) - Number(totalPaid._sum.amount || 0),
        },
        activeTrackingToken: client.trackingTokens[0] || null,
        latestConsent: client.socialConsents[0] || null,
        measurements: client.clientMeasurements[0]?.values || {},
        trackingTokens: undefined,
        socialConsents: undefined,
        clientMeasurements: undefined,
      },
    });
  } catch (error) {
    console.error('Get client error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: 'Failed to fetch client' }, { status: 500 });
  }
}

// PUT /api/clients/[id] - Update a client
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await requireActiveTailor();
    const { id } = await params;
    const body = await request.json();

    // Verify client belongs to this tailor
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        tailorId: user.id,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    // Validate input
    const validationResult = updateClientSchema.safeParse(body);
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

    // If phone is being changed, check for duplicates
    if (data.phone) {
      const formattedPhone = formatGhanaPhone(data.phone);
      const duplicateClient = await prisma.client.findFirst({
        where: {
          tailorId: user.id,
          phone: formattedPhone,
          id: { not: id },
        },
      });

      if (duplicateClient) {
        return NextResponse.json(
          {
            success: false,
            error: 'A client with this phone number already exists',
          },
          { status: 400 }
        );
      }

      data.phone = formattedPhone;
    }

    // Update client
    const client = await prisma.client.update({
      where: { id },
      data: {
        ...data,
        region: data.region as Region | undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error('Update client error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: 'Failed to update client' }, { status: 500 });
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireActiveTailor();
    const { id } = await params;

    // Verify client belongs to this tailor
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        tailorId: user.id,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    // Check if client has orders (soft delete might be better)
    const orderCount = await prisma.order.count({
      where: { clientId: id },
    });

    if (orderCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete client with ${orderCount} orders. Consider archiving instead.`,
        },
        { status: 400 }
      );
    }

    // Delete client (cascades to tokens, sessions)
    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    console.error('Delete client error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: 'Failed to delete client' }, { status: 500 });
  }
}
