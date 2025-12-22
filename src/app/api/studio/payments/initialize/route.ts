import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

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

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    // If no secret, we'll simulate or return error
    if (!paystackSecret || paystackSecret === 'sk_test_mock') {
      console.log('SIMULATING PAYSTACK INITIALIZATION');
      // Mock response
      return NextResponse.json({
        success: true,
        data: {
          authorization_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/studio/payments/success?reference=SIM-REF-${Date.now()}&orderId=${orderId}&amount=${amount}`,
          reference: `SIM-REF-${Date.now()}`,
        },
      });
    }

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(amount * 100), // convert to pesewas
        currency: 'GHS',
        reference: `SC-${order.orderNumber}-${Date.now()}`,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/studio/payments/success`,
        metadata: {
          orderId: order.id,
          clientId: order.clientId,
          tailorId: order.tailorId,
        },
      }),
    });

    const data = await res.json();

    if (!data.status) {
      throw new Error(data.message || 'Paystack initialization failed');
    }

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: data.data.authorization_url,
        reference: data.data.reference,
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
