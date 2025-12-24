/**
 * k6 Load Testing Configuration
 * 
 * Run with: k6 run src/__tests__/load/scenarios/api-stress.js
 * 
 * Prerequisites:
 * - Install k6: brew install k6
 * - Set BASE_URL environment variable or use default
 */

export const options = {
    stages: [
        { duration: '30s', target: 20 },   // Ramp up to 20 users
        { duration: '1m', target: 50 },    // Ramp up to 50 users
        { duration: '2m', target: 100 },   // Sustain 100 users
        { duration: '30s', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% under 500ms, 99% under 1s
        http_req_failed: ['rate<0.01'],                   // Less than 1% failures
        http_reqs: ['rate>50'],                           // At least 50 req/s
    },
    ext: {
        loadimpact: {
            projectID: 0, // Replace with k6 Cloud project ID if using cloud
            name: 'StitchCraft API Stress Test',
        },
    },
};

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

const BASE_URL = __ENV.BASE_URL || 'https://www.stitchcraft.live';

export default function () {
    group('Health Check', () => {
        const res = http.get(`${BASE_URL}/api/health`);
        check(res, {
            'health check returns 200': (r) => r.status === 200,
        });
        errorRate.add(res.status !== 200);
    });

    group('Public Gallery', () => {
        const res = http.get(`${BASE_URL}/api/gallery`);
        check(res, {
            'gallery returns 200': (r) => r.status === 200,
            'gallery response is JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
        });
        errorRate.add(res.status !== 200);
    });

    group('Discover Page', () => {
        const res = http.get(`${BASE_URL}/api/discover`);
        check(res, {
            'discover returns 200': (r) => r.status === 200,
        });
        errorRate.add(res.status !== 200);
    });

    sleep(1);
}

export function handleSummary(data) {
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
        'summary.json': JSON.stringify(data),
    };
}

function textSummary(data, options = {}) {
    const { indent = '' } = options;
    let summary = `
${indent}= StitchCraft Load Test Summary =
${indent}
${indent}Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
${indent}Request Rate: ${(data.metrics.http_reqs?.values?.rate || 0).toFixed(2)} req/s
${indent}
${indent}Response Times:
${indent}  - Avg: ${(data.metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms
${indent}  - P95: ${(data.metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms
${indent}  - P99: ${(data.metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)}ms
${indent}
${indent}Failed Requests: ${(data.metrics.http_req_failed?.values?.rate || 0) * 100}%
${indent}Error Rate: ${(data.metrics.errors?.values?.rate || 0) * 100}%
  `;
    return summary;
}
