import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';
import { initializeTransaction } from '@/lib/paystack';

const paymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (user.role !== 'CLIENT' || !user.linkedClientId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, amount } = paymentSchema.parse(body);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { tailor: true },
    });

    if (!order || order.clientId !== user.linkedClientId) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const remainingBalance = Number(order.totalAmount) - Number(order.paidAmount);
    if (amount > remainingBalance + 0.01) {
      // small buffer for decimals
      return NextResponse.json(
        { success: false, error: 'Amount exceeds remaining balance' },
        { status: 400 }
      );
    }

    const paystackData = await initializeTransaction({
      email: user.email,
      amount,
      reference: `SC-${order.orderNumber}-${Date.now()}`,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/studio/payments/success`,
      metadata: {
        orderId: order.id,
        clientId: order.clientId,
        tailorId: order.tailorId,
      },
    });

    if (!paystackData.status) {
      throw new Error(paystackData.message || 'Paystack initialization failed');
    }

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
      },
    });
  } catch (error) {
    console.error('Paystack initialize error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
