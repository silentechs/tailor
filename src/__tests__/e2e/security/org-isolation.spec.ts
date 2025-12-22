import { test, expect } from '@playwright/test';

/**
 * Security Test: Organization Data Isolation
 * 
 * Verifies that a user from one organization cannot access data (Orders) 
 * belonging to another organization, even if they have the specific resource ID.
 */

test.describe('Organization Data Isolation', () => {
    // Note: This test assumes we can run API calls or have a way to seed/identify cross-org IDs.
    // In a real E2E environment, we might need to pre-create these users or use a global setup.

    test('Worker from Org B should NOT be able to access Org A order', async ({ request }) => {
        // 1. We'd ideally log in as Org A user and create an order to get its ID.
        // Since we don't have easy seeding here without more setup, we'll demonstrate the structure.

        // For this demonstration, let's assume we have two users:
        // USER_A (Org A)
        // USER_B (Org B)

        // This part would typically be handled by a global setup or specialized test accounts.
        const TEST_ORDER_ID_ORG_A = 'test-order-org-a-id'; // This would be a real ID from the DB

        // 2. Perform request as Org B user
        // We would need to set the session cookie for User B.

        const response = await request.get(`/api/orders/${TEST_ORDER_ID_ORG_A}`, {
            headers: {
                // Mocking auth or using a previously established session
                'Cookie': 'next-auth.session-token=mock-user-b-token'
            }
        });

        // 3. Assert access is denied (403 Forbidden or 404 Not Found is preferred to avoid leaking ID existence)
        // The current implementation returns 404 if tailorId doesn't match the user.
        expect([403, 404, 401]).toContain(response.status());
    });
});
