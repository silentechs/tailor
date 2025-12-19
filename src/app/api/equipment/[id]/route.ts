import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

// Validation schema for updating equipment
const updateEquipmentSchema = z.object({
    name: z.string().min(1).optional(),
    brand: z.string().optional().nullable(),
    model: z.string().optional().nullable(),
    serialNumber: z.string().optional().nullable(),
    purchaseDate: z.string().optional().nullable(),
    status: z.enum(['ACTIVE', 'MAINTENANCE', 'BROKEN', 'RETIRED']).optional(),
});

// GET /api/equipment/[id] - Get single equipment
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireActiveTailor();
        const { id } = await params;

        const equipment = await prisma.equipment.findFirst({
            where: {
                id,
                tailorId: user.id,
            },
            include: {
                maintenance: {
                    orderBy: { completedDate: 'desc' },
                    take: 10,
                },
            },
        });

        if (!equipment) {
            return NextResponse.json(
                { success: false, error: 'Equipment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: equipment,
        });
    } catch (error) {
        console.error('Get equipment error:', error);

        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(
            { success: false, error: 'Failed to fetch equipment' },
            { status: 500 }
        );
    }
}

// PUT /api/equipment/[id] - Update equipment
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireActiveTailor();
        const { id } = await params;
        const body = await request.json();

        const validationResult = updateEquipmentSchema.safeParse(body);
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
        const existingEquipment = await prisma.equipment.findFirst({
            where: { id, tailorId: user.id },
        });

        if (!existingEquipment) {
            return NextResponse.json(
                { success: false, error: 'Equipment not found' },
                { status: 404 }
            );
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.brand !== undefined) updateData.brand = data.brand;
        if (data.model !== undefined) updateData.model = data.model;
        if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber;
        if (data.purchaseDate !== undefined) {
            updateData.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
        }
        if (data.status !== undefined) updateData.status = data.status;

        const equipment = await prisma.equipment.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            data: equipment,
        });
    } catch (error) {
        console.error('Update equipment error:', error);

        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(
            { success: false, error: 'Failed to update equipment' },
            { status: 500 }
        );
    }
}

// DELETE /api/equipment/[id] - Delete equipment
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireActiveTailor();
        const { id } = await params;

        // Verify equipment exists and belongs to tailor
        const existingEquipment = await prisma.equipment.findFirst({
            where: { id, tailorId: user.id },
        });

        if (!existingEquipment) {
            return NextResponse.json(
                { success: false, error: 'Equipment not found' },
                { status: 404 }
            );
        }

        // Delete associated maintenance records first
        await prisma.maintenanceRecord.deleteMany({
            where: { equipmentId: id },
        });

        await prisma.equipment.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: 'Equipment deleted successfully',
        });
    } catch (error) {
        console.error('Delete equipment error:', error);

        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(
            { success: false, error: 'Failed to delete equipment' },
            { status: 500 }
        );
    }
}
