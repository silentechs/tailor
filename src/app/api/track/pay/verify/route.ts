import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack';
import { recordSuccessfulPayment } from '@/lib/payment-service';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const reference = searchParams.get('reference');

        if (!reference) {
            return NextResponse.json({ error: 'Reference required' }, { status: 400 });
        }

        // 1. Verify with Paystack
        const paystackData = await verifyTransaction(reference);

        if (!paystackData.status || paystackData.data.status !== 'success') {
            return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
        }

        const { metadata, amount, paid_at } = paystackData.data;
        const orderId = metadata?.orderId;

        if (!orderId) {
            return NextResponse.json({ error: 'Invalid transaction metadata' }, { status: 400 });
        }

        // 2. Record Payment (atomic + idempotent)
        await recordSuccessfulPayment({
            orderId,
            amount: amount / 100,
            reference,
            method: 'PAYSTACK',
            paidAt: new Date(paid_at || new Date()),
            notes: `Public Tracking Ref: ${reference}`,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Public Verify Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
