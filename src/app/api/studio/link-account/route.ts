import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

const linkSchema = z.object({
    token: z.string().min(1, "Tracking token is required"),
});

export async function POST(req: NextRequest) {
    try {
        const user = await requireUser();

        // Parse body
        const body = await req.json();
        const { token } = linkSchema.parse(body);

        // Find the tracking token
        const trackingToken = await prisma.clientTrackingToken.findUnique({
            where: { token },
            include: { client: true }
        });

        if (!trackingToken) {
            return NextResponse.json(
                { success: false, error: 'Invalid tracking token' },
                { status: 404 }
            );
        }

        if (!trackingToken.isActive) {
            return NextResponse.json(
                { success: false, error: 'Tracking token is inactive' },
                { status: 400 }
            );
        }

        // Link the user to the client
        // Updating both legacy and new fields for compatibility
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: {
                    linkedClientId: trackingToken.clientId,
                    role: UserRole.CLIENT,
                }
            }),
            prisma.client.update({
                where: { id: trackingToken.clientId },
                data: {
                    userId: user.id
                }
            }),
            prisma.clientTrackingToken.update({
                where: { id: trackingToken.id },
                data: {
                    lastUsedAt: new Date()
                }
            })
        ]);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Link account error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
        }
        return NextResponse.json(
            { success: false, error: 'Failed to link account' },
            { status: 500 }
        );
    }
}
