import { NextResponse } from 'next/server';
import { z } from 'zod';
import { notifyAppointmentCreated, notifyClientAppointmentCreated } from '@/lib/notification-service';
import prisma from '@/lib/prisma';
import { requireOrganization, requirePermission } from '@/lib/require-permission';

const appointmentSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  orderId: z.string().optional().nullable(),
  type: z.enum(['CONSULTATION', 'MEASUREMENT', 'FITTING', 'COLLECTION', 'REPAIR']),
  startTime: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), { message: 'Invalid start time' }),
  endTime: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), { message: 'Invalid end time' }),
  notes: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { organizationId } = await requireOrganization();
    await requirePermission('orders:read', organizationId);

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const appointments = await prisma.appointment.findMany({
      where: {
        organizationId,
        ...(start && end
          ? {
            startTime: {
              gte: new Date(start),
              lte: new Date(end),
            },
          }
          : {}),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            garmentType: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch appointments',
      },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user, organizationId } = await requireOrganization();
    await requirePermission('orders:write', organizationId);
    const body = await request.json();

    const validation = appointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        ...validation.data,
        tailorId: user.id,
        organizationId,
        startTime: new Date(validation.data.startTime),
        endTime: new Date(validation.data.endTime),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            userId: true,
          },
        },
        order: true,
      },
    });

    // Send notification (Email/SMS) to tailor
    await notifyAppointmentCreated(
      user.id,
      appointment.client.phone,
      appointment.client.email || null,
      appointment.client.name,
      appointment.type,
      appointment.startTime,
      appointment.location || undefined,
      appointment.notes || undefined
    );

    // Send in-app notification to client if they have a linked account
    if (appointment.client.userId) {
      const dateStr = appointment.startTime.toLocaleDateString();
      const timeStr = appointment.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await notifyClientAppointmentCreated(
        appointment.client.userId,
        appointment.type,
        dateStr,
        timeStr,
        user.businessName || user.name,
        appointment.location || undefined
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: appointment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create appointment',
      },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
