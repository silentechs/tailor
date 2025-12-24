import { PaymentMethod } from '@prisma/client';
import prisma from './prisma';

export interface RecordPaymentParams {
    orderId: string;
    amount: number;
    reference: string;
    method: PaymentMethod;
    paidAt?: Date;
    notes?: string;
}

export async function recordSuccessfulPayment(params: RecordPaymentParams) {
    const { orderId, amount, reference, method, paidAt = new Date(), notes } = params;

    // Idempotency check: if payment already recorded
    const existingPayment = await prisma.payment.findFirst({
        where: { transactionId: reference },
    });

    if (existingPayment) {
        return { success: true, alreadyRecorded: true };
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order) {
        throw new Error('Order not found');
    }

    // Atomically update order and create payment record
    return await prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: {
                paidAmount: { increment: amount },
            },
        });

        const payment = await tx.payment.create({
            data: {
                paymentNumber: `PAY-${Date.now()}`,
                tailorId: order.tailorId,
                organizationId: order.organizationId ?? undefined,
                clientId: order.clientId,
                orderId: order.id,
                amount: amount,
                method: method,
                status: 'COMPLETED',
                transactionId: reference,
                notes: notes || `${method} Payment: ${reference}`,
                paidAt,
            },
        });

        return { success: true, order: updatedOrder, payment };
    });
}
