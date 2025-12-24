import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { captureInfo, captureWarning, captureError } from '@/lib/logger';
import { recordSuccessfulPayment } from '@/lib/payment-service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const signature = req.headers.get('x-paystack-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        // Verify signature
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (secret && secret !== 'sk_test_mock') {
            const hash = crypto
                .createHmac('sha512', secret)
                .update(JSON.stringify(body))
                .digest('hex');

            if (hash !== signature) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
            }
        }

        // Process internal event
        const event = body.event;

        if (event === 'charge.success') {
            const data = body.data;
            const reference = data.reference;
            const amountPaid = data.amount / 100; // In GHS
            const orderId = data.metadata?.orderId;

            if (!orderId) {
                captureWarning('PaystackWebhook', 'Missing orderId in metadata', { reference });
                return NextResponse.json({ status: 'ignored' });
            }

            // Record payment using service
            await recordSuccessfulPayment({
                orderId,
                amount: amountPaid,
                reference,
                method: 'PAYSTACK',
                paidAt: new Date(data.paid_at || new Date()),
                notes: `Paystack Webhook Ref: ${reference}`,
            });

            captureInfo('PaystackWebhook', 'Processed payment successfully', { orderId, reference, amountPaid });
        }

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        captureError('PaystackWebhook', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
