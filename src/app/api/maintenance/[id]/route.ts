import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

// Validation schema for updating a maintenance record
const updateMaintenanceSchema = z.object({
    type: z.enum(['ROUTINE', 'REPAIR', 'OVERHAUL', 'CALIBRATION']).optional(),
    status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    scheduledDate: z.string().optional().nullable(),
    completedDate: z.string().optional().nullable(),
    description: z.string().min(1).optional(),
    cost: z.number().nonnegative().optional().nullable(),
    notes: z.string().optional().nullable(),
});

// GET /api/maintenance/[id] - Get single maintenance record
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireActiveTailor();
        const { id } = await params;

        const record = await prisma.maintenanceRecord.findFirst({
            where: {
                id,
                tailorId: user.id,
            },
            include: {
                equipment: {
                    select: {
                        id: true,
                        name: true,
                        brand: true,
                        model: true,
                        serialNumber: true,
                    },
                },
            },
        });

        if (!record) {
            return NextResponse.json(
                { success: false, error: 'Maintenance record not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: record,
        });
    } catch (error) {
        console.error('Get maintenance record error:', error);

        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(
            { success: false, error: 'Failed to fetch maintenance record' },
            { status: 500 }
        );
    }
}

// PUT /api/maintenance/[id] - Update maintenance record
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireActiveTailor();
        const { id } = await params;
        const body = await request.json();

        const validationResult = updateMaintenanceSchema.safeParse(body);
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

        // Verify record exists and belongs to tailor
        const existingRecord = await prisma.maintenanceRecord.findFirst({
            where: { id, tailorId: user.id },
        });

        if (!existingRecord) {
            return NextResponse.json(
                { success: false, error: 'Maintenance record not found' },
                { status: 404 }
            );
        }

        const updateData: any = {};
        if (data.type !== undefined) updateData.type = data.type;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.scheduledDate !== undefined) {
            updateData.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
        }
        if (data.completedDate !== undefined) {
            updateData.completedDate = data.completedDate ? new Date(data.completedDate) : null;
        }
        if (data.description !== undefined) updateData.description = data.description;
        if (data.cost !== undefined) updateData.cost = data.cost;
        if (data.notes !== undefined) updateData.notes = data.notes;

        const record = await prisma.maintenanceRecord.update({
            where: { id },
            data: updateData,
            include: {
                equipment: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: record,
        });
    } catch (error) {
        console.error('Update maintenance record error:', error);

        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(
            { success: false, error: 'Failed to update maintenance record' },
            { status: 500 }
        );
    }
}

// DELETE /api/maintenance/[id] - Delete maintenance record
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireActiveTailor();
        const { id } = await params;

        // Verify record exists and belongs to tailor
        const existingRecord = await prisma.maintenanceRecord.findFirst({
            where: { id, tailorId: user.id },
        });

        if (!existingRecord) {
            return NextResponse.json(
                { success: false, error: 'Maintenance record not found' },
                { status: 404 }
            );
        }

        await prisma.maintenanceRecord.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: 'Maintenance record deleted successfully',
        });
    } catch (error) {
        console.error('Delete maintenance record error:', error);

        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(
            { success: false, error: 'Failed to delete maintenance record' },
            { status: 500 }
        );
    }
}
