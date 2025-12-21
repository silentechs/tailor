import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

const claimClientSchema = z.object({
    token: z.string().min(1, 'Token is required'),
});

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'CLIENT') {
            return NextResponse.json({ success: false, error: 'Only client accounts can claim client records' }, { status: 403 });
        }

        const body = await req.json();
        const { token } = claimClientSchema.parse(body);

        const tracking = await prisma.clientTrackingToken.findUnique({
            where: { token },
            include: {
                client: {
                    include: { user: { select: { id: true } } }
                }
            },
        });

        if (!tracking || !tracking.isActive) {
            return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 });
        }

        if (tracking.client.user) {
            return NextResponse.json({ success: false, error: 'This client record is already linked' }, { status: 400 });
        }

        if (user.linkedClientId) {
            return NextResponse.json({ success: false, error: 'Your account is already linked to a client record' }, { status: 400 });
        }

        // Perform linkage (User owns the relation via linkedClientId)
        await prisma.user.update({
            where: { id: user.id },
            data: { linkedClientId: tracking.clientId },
        });

        return NextResponse.json({
            success: true,
            message: 'Client record linked successfully',
            clientId: tracking.clientId
        });

    } catch (error) {
        console.error('Claim client error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: 'Failed to claim client record' }, { status: 500 });
    }
}
