import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

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
    const user = await requireActiveTailor();
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const appointments = await prisma.appointment.findMany({
      where: {
        tailorId: user.id,
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
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveTailor();
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
        startTime: new Date(validation.data.startTime),
        endTime: new Date(validation.data.endTime),
      },
      include: {
        client: true,
        order: true,
      },
    });

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
      { success: false, error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
