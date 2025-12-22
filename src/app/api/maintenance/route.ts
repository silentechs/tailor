import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

// Validation schema for creating a maintenance record
const createMaintenanceSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment ID is required'),
  type: z.enum(['ROUTINE', 'REPAIR', 'OVERHAUL', 'CALIBRATION']),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  scheduledDate: z.string().optional().nullable(),
  completedDate: z.string().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  cost: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/maintenance - List all maintenance records
export async function GET(request: Request) {
  try {
    const user = await requireActiveTailor();

    const { searchParams } = new URL(request.url);
    const equipmentId = searchParams.get('equipmentId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: any = {
      tailorId: user.id,
      ...(equipmentId && { equipmentId }),
      ...(type && { type }),
      ...(status && { status }),
    };

    const records = await prisma.maintenanceRecord.findMany({
      where,
      orderBy: { completedDate: 'desc' },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            brand: true,
            model: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('Get maintenance records error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch maintenance records' },
      { status: 500 }
    );
  }
}

// POST /api/maintenance - Create a new maintenance record
export async function POST(request: Request) {
  try {
    const user = await requireActiveTailor();
    const body = await request.json();

    const validationResult = createMaintenanceSchema.safeParse(body);
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

    // Verify equipment exists and belongs to tailor
    const equipment = await prisma.equipment.findFirst({
      where: { id: data.equipmentId, tailorId: user.id },
    });

    if (!equipment) {
      return NextResponse.json({ success: false, error: 'Equipment not found' }, { status: 404 });
    }

    const record = await prisma.maintenanceRecord.create({
      data: {
        tailorId: user.id,
        equipmentId: data.equipmentId,
        type: data.type,
        status: data.status || 'COMPLETED',
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        completedDate: data.completedDate ? new Date(data.completedDate) : new Date(),
        description: data.description,
        cost: data.cost,
        notes: data.notes,
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update equipment status if needed
    if (data.type === 'REPAIR' && data.status === 'COMPLETED') {
      await prisma.equipment.update({
        where: { id: data.equipmentId },
        data: { status: 'ACTIVE' },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: record,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create maintenance record error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create maintenance record' },
      { status: 500 }
    );
  }
}
