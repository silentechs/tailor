import { type NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    // This endpoint is part of the client portal flow; require a linked CLIENT session.
    if (user.role !== 'CLIENT' || !user.linkedClientId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ success: false, error: 'Reference required' }, { status: 400 });
    }

    // Verify with Paystack
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return NextResponse.json(
        { success: false, error: 'Payment configuration missing' },
        { status: 500 }
      );
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
      },
    });

    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    const { metadata, amount } = verifyData.data;
    const orderId = metadata?.orderId;

    if (!orderId) {
      console.error('Missing orderId in metadata', verifyData);
      // Attempt to find via reference if previously failed?
      // Ideally metadata is robust. For now, fail safe.
      return NextResponse.json(
        { success: false, error: 'Invalid transaction metadata' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // SECURITY: Ensure the order belongs to the current client (avoid cross-client payment attribution)
    if (order.clientId !== user.linkedClientId) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Idempotency check: if payment already recorded
    const existingPayment = await prisma.payment.findFirst({
      where: { transactionId: reference },
    });

    if (existingPayment) {
      return NextResponse.json({ success: true, message: 'Payment already recorded' });
    }

    // Update DB
    const paidAmount = amount / 100; // Paystack is in lowest currency unit (pesewas)

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          paidAmount: { increment: paidAmount },
        },
      }),
      prisma.payment.create({
        data: {
          paymentNumber: `PAY-${Date.now()}`,
          tailorId: order.tailorId,
          organizationId: order.organizationId ?? undefined,
          clientId: order.clientId,
          orderId: order.id,
          amount: paidAmount,
          method: 'PAYSTACK', // Correct enum value
          status: 'COMPLETED',
          transactionId: reference,
          notes: `Paystack Ref: ${reference}`,
          paidAt: new Date(verifyData.data.paid_at || new Date()),
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
