import { type NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';
import { verifyTransaction } from '@/lib/paystack';
import { recordSuccessfulPayment } from '@/lib/payment-service';

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

    const paystackData = await verifyTransaction(reference);

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    const { metadata, amount, paid_at } = paystackData.data;
    const orderId = metadata?.orderId;

    if (!orderId) {
      console.error('Missing orderId in metadata', paystackData);
      // Attempt to find via reference if previously failed?
      // Ideally metadata is robust. For now, fail safe.
      return NextResponse.json(
        { success: false, error: 'Invalid transaction metadata' },
        { status: 400 }
      );
    }

    // Record payment using service
    await recordSuccessfulPayment({
      orderId,
      amount: amount / 100,
      reference,
      method: 'PAYSTACK',
      paidAt: new Date(paid_at || new Date()),
      notes: `Paystack Verified Ref: ${reference}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
