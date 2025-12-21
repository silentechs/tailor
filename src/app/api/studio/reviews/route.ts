import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const reviewSchema = z.object({
    orderId: z.string().min(1),
    rating: z.number().min(1).max(5),
    review: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const user = await requireUser();
        if (user.role !== 'CLIENT' || !user.linkedClientId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { orderId, rating, review } = reviewSchema.parse(body);

        // Verify order belongs to client and is DELIVERED
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order || order.clientId !== user.linkedClientId) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }

        if (order.status as string !== 'DELIVERED') {
            return NextResponse.json({ success: false, error: 'Feedback can only be provided for delivered orders' }, { status: 400 });
        }

        // Create or update review
        // Use findFirst then create/update as a fallback if types are stale
        const existingRating = await prisma.orderRating.findFirst({
            where: { orderId }
        });

        let orderRating;
        if (existingRating) {
            orderRating = await (prisma.orderRating as any).update({
                where: { id: existingRating.id },
                data: {
                    rating,
                    review,
                    updatedAt: new Date(),
                },
            });
        } else {
            orderRating = await (prisma.orderRating as any).create({
                data: {
                    orderId,
                    rating,
                    review,
                    clientId: user.linkedClientId,
                    tailorId: order.tailorId,
                }
            });
        }

        return NextResponse.json({ success: true, data: orderRating });

    } catch (error) {
        console.error('Submit review error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
    }
}
