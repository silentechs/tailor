import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const confirmSchema = z.object({
    orderId: z.string(),
    amount: z.number(),
    reference: z.string(),
});

export async function POST(req: NextRequest) {
    try {
        const user = await requireUser();
        const body = await req.json();
        const { orderId, amount, reference } = confirmSchema.parse(body);

        if (!reference.startsWith('SIM-REF')) {
            return NextResponse.json({ success: false, error: 'Invalid reference' }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

        // Security check: Ensure order belongs to the user
        // We use linkedClientId for clients
        if (order.clientId !== user.linkedClientId && user.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        // Update order paidAmount
        await prisma.order.update({
            where: { id: orderId },
            data: {
                paidAmount: {
                    increment: amount
                }
            }
        });

        // Record payment
        await prisma.payment.create({
            data: {
                paymentNumber: `PAY-SIM-${Date.now()}`,
                tailorId: order.tailorId,
                clientId: order.clientId,
                orderId: orderId,
                amount: amount,
                method: 'BANK_TRANSFER', // Placeholder for simulation
                status: 'COMPLETED',
                transactionId: reference,
                notes: 'Simulated Paystack Payment',
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Confirm sim error:', error);
        return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
    }
}
