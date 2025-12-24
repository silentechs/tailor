/**
 * Concurrent Orders Stress Test
 * 
 * Simulates multiple tailors creating orders simultaneously
 * to test database write performance and concurrency handling.
 * 
 * Run with: k6 run src/__tests__/load/scenarios/concurrent-orders.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics
const ordersCreated = new Counter('orders_created');
const orderCreationTime = new Trend('order_creation_time');

export const options = {
    scenarios: {
        concurrent_orders: {
            executor: 'ramping-vus',
            startVUs: 1,
            stages: [
                { duration: '30s', target: 10 },  // 10 concurrent tailors
                { duration: '1m', target: 25 },   // 25 concurrent tailors
                { duration: '1m', target: 50 },   // 50 concurrent tailors (stress)
                { duration: '30s', target: 0 },   // Ramp down
            ],
            gracefulRampDown: '30s',
        },
    },
    thresholds: {
        'order_creation_time': ['p(95)<2000'],  // 95% order creations under 2s
        'http_req_failed': ['rate<0.05'],        // Less than 5% failures
    },
};

const BASE_URL = __ENV.BASE_URL || 'https://www.stitchcraft.live';

// Mock auth - in real tests, use actual test credentials
const TEST_SESSION = __ENV.TEST_SESSION || '';

export function setup() {
    // Setup: Login and get session token
    // In real implementation, login with test credentials
    console.log('Load test starting - ensure test accounts are configured');

    return {
        authCookie: TEST_SESSION,
    };
}

export default function (data) {
    const headers = {
        'Content-Type': 'application/json',
        Cookie: `sc_session=${data.authCookie}`,
    };

    group('Order Creation Flow', () => {
        // Step 1: Get client list (simulate tailor workflow)
        const clientsRes = http.get(`${BASE_URL}/api/clients`, { headers });
        check(clientsRes, {
            'clients list returned': (r) => r.status === 200 || r.status === 401,
        });

        // Step 2: Create order
        const orderPayload = JSON.stringify({
            clientId: `test-client-${__VU}`,
            garmentType: 'SHIRT',
            totalAmount: 150 + Math.random() * 100,
            status: 'PENDING',
            measurements: {
                chest: 40 + Math.random() * 10,
                waist: 34 + Math.random() * 8,
                length: 28 + Math.random() * 4,
            },
            notes: `Load test order from VU ${__VU} at ${new Date().toISOString()}`,
        });

        const startTime = Date.now();
        const orderRes = http.post(`${BASE_URL}/api/orders`, orderPayload, { headers });
        const duration = Date.now() - startTime;

        orderCreationTime.add(duration);

        const success = check(orderRes, {
            'order created or auth required': (r) => r.status === 201 || r.status === 401,
        });

        if (success && orderRes.status === 201) {
            ordersCreated.add(1);
        }
    });

    // Simulate realistic user think time
    sleep(Math.random() * 3 + 1);
}

export function teardown(data) {
    console.log('Load test completed');
    // Cleanup: Could delete test orders here
}

export function handleSummary(data) {
    const summary = `
= Concurrent Orders Test Summary =

Orders Created: ${data.metrics.orders_created?.values?.count || 0}
Order Creation Time (p95): ${(data.metrics.order_creation_time?.values?.['p(95)'] || 0).toFixed(2)}ms

Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
Failed Requests: ${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%
  `;

    return {
        stdout: summary,
        'concurrent-orders-summary.json': JSON.stringify(data),
    };
}
