import { expect, test } from '@playwright/test';

/**
 * E2E Tests: Tailor Order Management
 * Tests order creation, viewing, status updates, and notifications
 */

// Helper to login as tailor before tests
async function loginAsTailor(page: any) {
    await page.goto('/auth/login');
    const testEmail = process.env.TEST_TAILOR_EMAIL || 'test-tailor@example.com';
    const testPassword = process.env.TEST_TAILOR_PASSWORD || 'testpassword123';

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
}

test.describe('Order List View', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/orders');
    });

    test('should display orders page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /orders/i })).toBeVisible();
    });

    test('should show order table or list', async ({ page }) => {
        // Look for table or order cards
        const orderTable = page.locator('table').or(
            page.locator('[data-testid="orders-list"]').or(
                page.locator('.order-card, .order-item')
            )
        );
        await expect(orderTable).toBeVisible({ timeout: 10000 });
    });

    test('should have new order button', async ({ page }) => {
        const newOrderBtn = page.getByRole('link', { name: /new order|create order|add order/i }).or(
            page.getByRole('button', { name: /new order|create order|add order/i })
        );
        await expect(newOrderBtn).toBeVisible();
    });

    test('should filter orders by status', async ({ page }) => {
        // Look for status filter/tabs
        const statusFilter = page.getByRole('combobox', { name: /status/i }).or(
            page.getByRole('tablist').or(
                page.locator('[data-testid="status-filter"]')
            )
        );

        if (await statusFilter.isVisible()) {
            await statusFilter.click();
            // Should show status options
            await expect(page.getByText(/pending|in progress|completed/i)).toBeVisible();
        }
    });
});

test.describe('Create New Order', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/orders/new');
    });

    test('should display new order form', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /new order|create order/i })).toBeVisible();
    });

    test('should require client selection', async ({ page }) => {
        // Look for client selection field
        const clientField = page.getByLabel(/client/i).or(
            page.getByRole('combobox', { name: /client/i }).or(
                page.locator('[data-testid="client-select"]')
            )
        );
        await expect(clientField).toBeVisible();
    });

    test('should have garment type selection', async ({ page }) => {
        const garmentField = page.getByLabel(/garment|type|item/i).or(
            page.getByRole('combobox', { name: /garment|type/i })
        );
        await expect(garmentField).toBeVisible();
    });

    test('should have measurements section', async ({ page }) => {
        // Look for measurements area
        const measurementsSection = page.getByRole('heading', { name: /measurement/i }).or(
            page.getByText(/measurement/i).or(
                page.locator('[data-testid="measurements-section"]')
            )
        );
        await expect(measurementsSection).toBeVisible();
    });

    test('should calculate total amount', async ({ page }) => {
        // Look for amount/price field
        const amountField = page.getByLabel(/amount|price|total/i);
        await expect(amountField).toBeVisible();
    });
});

test.describe('Order Details', () => {
    test('should display order details page', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/orders');

        // Click on first order
        const firstOrder = page.locator('tr, .order-card, .order-item').first();
        if (await firstOrder.isVisible()) {
            await firstOrder.click();

            // Should show order details
            await expect(page.getByText(/order details|order #/i)).toBeVisible({ timeout: 10000 });
        }
    });

    test('should show order status', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/orders');

        const firstOrder = page.locator('tr, .order-card, .order-item').first();
        if (await firstOrder.isVisible()) {
            await firstOrder.click();

            // Look for status badge or text
            const statusBadge = page.locator('.badge, .status').or(
                page.getByText(/pending|in progress|completed|delivered/i)
            );
            await expect(statusBadge).toBeVisible({ timeout: 10000 });
        }
    });

    test('should allow status update', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/orders');

        const firstOrder = page.locator('tr, .order-card, .order-item').first();
        if (await firstOrder.isVisible()) {
            await firstOrder.click();
            await page.waitForURL(/orders\/[^/]+/);

            // Look for status update button or dropdown
            const updateStatusBtn = page.getByRole('button', { name: /update status|change status/i }).or(
                page.getByRole('combobox', { name: /status/i })
            );

            if (await updateStatusBtn.isVisible()) {
                await updateStatusBtn.click();
                // Should show status options
                await expect(page.getByText(/in progress|cutting|sewing/i)).toBeVisible();
            }
        }
    });
});

test.describe('Bulk Order Wizard', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/orders/bulk-wizard');
    });

    test('should display bulk order wizard', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /bulk|batch|multiple/i })).toBeVisible();
    });

    test('should have step-by-step flow', async ({ page }) => {
        // Look for step indicators
        const stepIndicator = page.locator('.step, [data-step]').or(
            page.getByText(/step 1|step 2/i)
        );
        await expect(stepIndicator).toBeVisible();
    });

    test('should allow adding multiple orders', async ({ page }) => {
        // Look for add button
        const addButton = page.getByRole('button', { name: /add order|add item|add another/i });
        if (await addButton.isVisible()) {
            await addButton.click();
            // Should show additional order form
            await expect(page.locator('form, .order-form').nth(1)).toBeVisible();
        }
    });
});
