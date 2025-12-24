/**
 * Payment Burst Stress Test
 * 
 * Simulates a high volume of payment verifications in a short time
 * to test Paystack webhook handling and payment processing capacity.
 * 
 * Run with: k6 run src/__tests__/load/scenarios/payment-burst.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const paymentsProcessed = new Counter('payments_processed');
const paymentErrors = new Rate('payment_errors');
const paymentTime = new Trend('payment_processing_time');

export const options = {
    scenarios: {
        payment_burst: {
            executor: 'constant-arrival-rate',
            rate: 50,           // 50 payment verifications per second
            timeUnit: '1s',
            duration: '1m',     // For 1 minute
            preAllocatedVUs: 100,
            maxVUs: 200,
        },
    },
    thresholds: {
        'payment_processing_time': ['p(95)<1000'],  // 95% under 1s
        'payment_errors': ['rate<0.01'],             // Less than 1% errors
        'http_req_failed': ['rate<0.02'],            // Less than 2% HTTP failures
    },
};

const BASE_URL = __ENV.BASE_URL || 'https://www.stitchcraft.live';

export default function () {
    group('Payment Verification', () => {
        // Simulate Paystack callback verification
        const reference = `test_ref_${__VU}_${__ITER}_${Date.now()}`;

        const startTime = Date.now();

        // Test payment verification endpoint
        const verifyRes = http.get(
            `${BASE_URL}/api/track/pay/verify?reference=${reference}`,
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );

        const duration = Date.now() - startTime;
        paymentTime.add(duration);

        // 400 is expected for invalid reference, 200 for valid
        const isExpectedResponse = check(verifyRes, {
            'payment verify responds': (r) => r.status === 200 || r.status === 400 || r.status === 404,
        });

        if (!isExpectedResponse) {
            paymentErrors.add(1);
        } else {
            paymentErrors.add(0);
            paymentsProcessed.add(1);
        }
    });

    // No sleep - burst test is about maximum throughput
}

// Separate scenario for webhook handling
export function webhookBurst() {
    group('Webhook Processing', () => {
        const webhookPayload = JSON.stringify({
            event: 'charge.success',
            data: {
                reference: `webhook_test_${__VU}_${Date.now()}`,
                amount: 15000,
                currency: 'GHS',
                status: 'success',
                customer: {
                    email: `test${__VU}@example.com`,
                },
            },
        });

        const startTime = Date.now();

        const webhookRes = http.post(
            `${BASE_URL}/api/webhooks/paystack`,
            webhookPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-paystack-signature': 'test-signature', // Would need real signature in prod
                },
            }
        );

        const duration = Date.now() - startTime;
        paymentTime.add(duration);

        check(webhookRes, {
            'webhook accepted or rejected': (r) => r.status === 200 || r.status === 400 || r.status === 401,
        });
    });
}

export function handleSummary(data) {
    const summary = `
= Payment Burst Test Summary =

Payments Processed: ${data.metrics.payments_processed?.values?.count || 0}
Payment Errors: ${((data.metrics.payment_errors?.values?.rate || 0) * 100).toFixed(2)}%

Processing Time:
  - Avg: ${(data.metrics.payment_processing_time?.values?.avg || 0).toFixed(2)}ms
  - P95: ${(data.metrics.payment_processing_time?.values?.['p(95)'] || 0).toFixed(2)}ms
  - P99: ${(data.metrics.payment_processing_time?.values?.['p(99)'] || 0).toFixed(2)}ms

Request Rate: ${(data.metrics.http_reqs?.values?.rate || 0).toFixed(2)} req/s
Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
  `;

    return {
        stdout: summary,
        'payment-burst-summary.json': JSON.stringify(data),
    };
}
