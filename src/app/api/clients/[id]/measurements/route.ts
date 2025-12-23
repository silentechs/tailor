import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/clients/[id]/measurements - Get last measurement for client
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireActiveTailor();
    const { id } = await params;

    const measurement = await prisma.clientMeasurement.findFirst({
      where: {
        clientId: id,
        client: {
          tailorId: user.id,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        template: {
          select: {
            name: true,
            garmentType: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: measurement,
    });
  } catch (error) {
    console.error('Get client measurements error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client measurements' },
      { status: 500 }
    );
  }
}

const createMeasurementSchema = z.object({
  values: z.record(z.string(), z.any()),
  notes: z.string().optional(),
  templateId: z.string().optional(),
});

// POST /api/clients/[id]/measurements - Create new measurement for client
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireActiveTailor();
    const { id } = await params;
    const body = await request.json();

    const validation = createMeasurementSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Verify client belongs to tailor
    const client = await prisma.client.findFirst({
      where: {
        id,
        tailorId: user.id,
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    const { values, notes, templateId } = validation.data;

    // Create new measurement record
    const measurement = await prisma.clientMeasurement.create({
      data: {
        clientId: id,
        values,
        notes,
        templateId,
      },
    });

    return NextResponse.json({
      success: true,
      data: measurement,
    });
  } catch (error) {
    console.error('Create client measurement error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create measurement' },
      { status: 500 }
    );
  }
}
