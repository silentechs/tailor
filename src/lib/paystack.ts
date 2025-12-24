import { fetchApi } from './fetch-api';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface PaystackInitializeOptions {
    email: string;
    amount: number; // In GHS
    reference?: string;
    callbackUrl?: string;
    metadata?: Record<string, any>;
}

export async function initializeTransaction(options: PaystackInitializeOptions) {
    if (!PAYSTACK_SECRET_KEY || PAYSTACK_SECRET_KEY === 'sk_test_mock') {
        console.log('PAYSTACK: Simulating transaction initialization');
        return {
            status: true,
            data: {
                authorization_url: `${APP_URL}/studio/payments/success?reference=SIM-REF-${Date.now()}&metadata=${JSON.stringify(options.metadata)}`,
                reference: `SIM-REF-${Date.now()}`,
            },
        };
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: options.email,
            amount: Math.round(options.amount * 100), // convert to pesewas
            currency: 'GHS',
            reference: options.reference,
            callback_url: options.callbackUrl || `${APP_URL}/studio/payments/success`,
            metadata: options.metadata,
        }),
    });

    const data = await response.json();
    return data;
}

export async function verifyTransaction(reference: string) {
    if (!PAYSTACK_SECRET_KEY || PAYSTACK_SECRET_KEY === 'sk_test_mock') {
        if (reference.startsWith('SIM-REF-')) {
            return {
                status: true,
                data: {
                    status: 'success',
                    reference,
                    amount: 1000, // mock value
                    metadata: {},
                    paid_at: new Date().toISOString(),
                },
            };
        }
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
    });

    const data = await response.json();
    return data;
}
