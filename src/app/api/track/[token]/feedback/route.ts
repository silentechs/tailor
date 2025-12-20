
import { NextResponse } from 'next/server';
import {
    submitOrderRating,
    submitSocialMediaConsent,
    validateTrackingToken,
} from '@/lib/client-tracking-service';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const FeedbackSchema = z.object({
    orderId: z.string().min(1),
    rating: z.number().min(0).max(5),
    consent: z.boolean(),
});

type RouteParams = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { token } = await params;
        const body = await request.json();
        const result = FeedbackSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid input' },
                { status: 400 }
            );
        }

        const { orderId, rating, consent } = result.data;

        // Validate token
        const validation = await validateTrackingToken(token);

        if (!validation.valid || !validation.client) {
            return NextResponse.json(
                { success: false, error: validation.error || 'Unauthorized' },
                { status: 401 }
            );
        }

        const client = validation.client;

        // Verify order belongs to client
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                clientId: client.id,
            },
        });

        if (!order) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        // Submit rating if provided
        if (rating > 0) {
            await submitOrderRating(orderId, rating);
        }

        // Submit consent
        await submitSocialMediaConsent(
            client.id,
            orderId,
            consent,
            ['instagram', 'facebook'] // Defaulting to these for now
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Feedback submission error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to submit feedback' },
            { status: 500 }
        );
    }
}
