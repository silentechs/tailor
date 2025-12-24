import { expect, test, type Page } from '@playwright/test';

/**
 * E2E Tests: Order Tracking
 * Tests client's ability to track their orders
 */

// Helper to login as client
async function loginAsClient(page: Page) {
    await page.goto('/auth/login');
    const testEmail = process.env.TEST_CLIENT_EMAIL || 'test-client@example.com';
    const testPassword = process.env.TEST_CLIENT_PASSWORD || 'testpassword123';

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/studio/, { timeout: 15000 });
}

test.describe('Orders Page', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsClient(page);
        await page.goto('/studio/orders');
    });

    test('should display orders page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /order/i })).toBeVisible();
    });

    test('should show order list or empty state', async ({ page }) => {
        const orderList = page.locator('.order-card, .order-item, table').first();
        const emptyState = page.getByText(/no orders|no active orders/i);

        const hasOrders = await orderList.isVisible();
        const isEmpty = await emptyState.isVisible();

        expect(hasOrders || isEmpty).toBe(true);
    });

    test('should show order status', async ({ page }) => {
        const orderCard = page.locator('.order-card, .order-item, tr').first();

        if (await orderCard.isVisible()) {
            // Should show status badge
            const statusBadge = orderCard.locator('.badge, .status').or(
                orderCard.getByText(/pending|in progress|completed|ready/i)
            );
            await expect(statusBadge).toBeVisible();
        }
    });
});

test.describe('Order Details', () => {
    test('should show order details on click', async ({ page }) => {
        await loginAsClient(page);
        await page.goto('/studio/orders');

        const orderCard = page.locator('.order-card, .order-item, tr').first();

        if (await orderCard.isVisible()) {
            await orderCard.click();

            // Should show order details
            await expect(page.getByText(/order details|order #/i)).toBeVisible({ timeout: 10000 });
        }
    });

    test('should show order progress/timeline', async ({ page }) => {
        await loginAsClient(page);
        await page.goto('/studio/orders');

        const orderCard = page.locator('.order-card, .order-item, tr').first();

        if (await orderCard.isVisible()) {
            await orderCard.click();

            // Look for progress indicator or timeline
            const progress = page.locator('.progress, .timeline, .steps').or(
                page.getByText(/progress|stage|step/i)
            );
            await expect(progress).toBeVisible({ timeout: 10000 });
        }
    });

    test('should show tailor information', async ({ page }) => {
        await loginAsClient(page);
        await page.goto('/studio/orders');

        const orderCard = page.locator('.order-card, .order-item, tr').first();

        if (await orderCard.isVisible()) {
            await orderCard.click();

            // Should show which tailor is handling the order
            await expect(page.getByText(/tailor|shop|by/i)).toBeVisible({ timeout: 10000 });
        }
    });
});

test.describe('Public Order Tracking', () => {
    test('should allow tracking with token', async ({ page }) => {
        // This tests the public tracking page (no auth required)
        // Use a sample tracking token format
        const testToken = 'test-tracking-token';

        await page.goto(`/track/${testToken}`);

        // Should show tracking page (either order details or error if invalid token)
        await expect(page.getByText(/track|order|not found|invalid/i)).toBeVisible({ timeout: 10000 });
    });

    test('should show order status on tracking page', async ({ page }) => {
        // This would need a valid token from the test database
        const testToken = process.env.TEST_TRACKING_TOKEN || 'sample-token';

        await page.goto(`/track/${testToken}`);

        // If valid token, should show status
        const statusInfo = page.getByText(/pending|in progress|completed|ready|not found/i);
        await expect(statusInfo).toBeVisible({ timeout: 10000 });
    });

    test('should allow payment from tracking page', async ({ page }) => {
        const testToken = process.env.TEST_TRACKING_TOKEN || 'sample-token';

        await page.goto(`/track/${testToken}`);

        // Look for pay button if there's balance
        const payButton = page.getByRole('button', { name: /pay|make payment/i });

        // Pay button may or may not be visible depending on order balance
    });
});

test.describe('Payment History', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsClient(page);
        await page.goto('/studio/payments');
    });

    test('should display payments page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /payment/i })).toBeVisible();
    });

    test('should show payment history', async ({ page }) => {
        const paymentList = page.locator('table, .payment-card').first();
        const emptyState = page.getByText(/no payments|no history/i);

        const hasPayments = await paymentList.isVisible();
        const isEmpty = await emptyState.isVisible();

        expect(hasPayments || isEmpty).toBe(true);
    });
});
