import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

const pushMeasurementsSchema = z.object({
    values: z.record(z.string(), z.any()),
    unit: z.enum(['CM', 'INCH']).default('CM'),
});

// POST /api/clients/[id]/push-to-profile - Push tailor's measurements to client's global profile
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const user = await requireActiveTailor();
        const { id } = await params;
        const body = await request.json();

        const validation = pushMeasurementsSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid data' },
                { status: 400 }
            );
        }

        // Get the client and verify ownership
        // Cast to any to bypass stale Prisma types
        const client = (await prisma.client.findFirst({
            where: {
                id,
                tailorId: user.id,
            } as any,
            include: {
                user: true,
            } as any,
        })) as any;

        if (!client) {
            return NextResponse.json(
                { success: false, error: 'Client not found' },
                { status: 404 }
            );
        }

        if (!client.userId || !client.user) {
            return NextResponse.json(
                { success: false, error: 'Client does not have a linked user account' },
                { status: 400 }
            );
        }

        const { values, unit } = validation.data;

        // Update the User's global measurements profile
        const updatedUser = (await prisma.user.update({
            where: { id: client.userId },
            data: {
                measurements: {
                    values,
                    unit,
                    updatedAt: new Date().toISOString(),
                },
            } as any,
        })) as any;

        // Also create a local measurement record to keep history
        await prisma.clientMeasurement.create({
            data: {
                clientId: id,
                values,
                unit,
                notes: `Pushed to client profile by ${user.name || 'tailor'}`,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Measurements pushed to client profile successfully',
            data: {
                clientId: id,
                userId: client.userId,
                measurements: updatedUser.measurements,
            },
        });
    } catch (error) {
        console.error('Push to profile error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to push measurements to profile' },
            { status: 500 }
        );
    }
}
