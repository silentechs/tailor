import { NextRequest, NextResponse } from 'next/server';
import { validateTrackingToken } from '@/lib/client-tracking-service';
import { initializeTransaction } from '@/lib/paystack';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const paySchema = z.object({
    orderId: z.string().min(1),
    amount: z.number().positive(),
});

type RouteParams = { params: Promise<{ token: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const { token } = await params;
        const body = await req.json();
        const { orderId, amount } = paySchema.parse(body);

        // 1. Validate Token
        const validation = await validateTrackingToken(token);
        if (!validation.valid) {
            return NextResponse.json({ error: 'Invalid tracking token' }, { status: 401 });
        }

        const { client } = validation;

        // 2. Validate Order belongs to client
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { tailor: true },
        });

        if (!order || order.clientId !== client!.id) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 3. Initialize Paystack
        const paystackData = await initializeTransaction({
            email: client!.email || `client-${client!.id}@stitchcraft.gh`, // Fallback email
            amount,
            reference: `TRACK-${order.orderNumber}-${Date.now()}`,
            callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/track/${token}/success?orderId=${order.id}&amount=${amount}`,
            metadata: {
                orderId: order.id,
                clientId: order.clientId,
                tailorId: order.tailorId,
                trackingToken: token,
            },
        });

        if (!paystackData.status) {
            throw new Error(paystackData.message || 'Payment initialization failed');
        }

        return NextResponse.json({
            success: true,
            data: paystackData.data,
        });
    } catch (error) {
        console.error('Tracking Pay Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
