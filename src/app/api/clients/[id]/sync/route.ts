import { NextResponse } from 'next/server';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/clients/[id]/sync - Sync measurements from User profile to Client profile
export async function POST(_request: Request, { params }: RouteParams) {
    try {
        const user = await requireActiveTailor();
        const { id } = await params;

        // 1. Get the Client record
        const client = await prisma.client.findFirst({
            where: {
                id,
                tailorId: user.id,
            },
            include: {
                user: true, // Include the linked User
            },
        });

        if (!client) {
            return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
        }

        if (!client.userId || !client.user) {
            return NextResponse.json(
                { success: false, error: 'Client is not linked to a user account' },
                { status: 400 }
            );
        }

        const startUserMeasurements = client.user.measurements as Record<string, any>;

        if (!startUserMeasurements || Object.keys(startUserMeasurements).length === 0) {
            return NextResponse.json(
                { success: false, error: 'User has no measurements to sync' },
                { status: 400 }
            );
        }

        // 2. Create or Update ClientMeasurement
        // We create a new snapshot to keep history
        const measurement = await prisma.clientMeasurement.create({
            data: {
                clientId: client.id,
                values: startUserMeasurements,
                notes: 'Synced from Client Profile',
                isSynced: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Measurements synced successfully',
            data: measurement,
        });
    } catch (error) {
        console.error('Sync measurements error:', error);
        if (error instanceof Error && error.message === 'Forbidden') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json(
            { success: false, error: 'Failed to sync measurements' },
            { status: 500 }
        );
    }
}
