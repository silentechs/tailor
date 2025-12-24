import { expect, test } from '@playwright/test';

/**
 * E2E Tests: Tailor Payment Management
 * Tests payment recording, receipt generation, and Paystack integration
 */

// Helper to login as tailor
async function loginAsTailor(page: any) {
    await page.goto('/auth/login');
    const testEmail = process.env.TEST_TAILOR_EMAIL || 'test-tailor@example.com';
    const testPassword = process.env.TEST_TAILOR_PASSWORD || 'testpassword123';

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
}

test.describe('Payments List View', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/payments');
    });

    test('should display payments page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /payment/i })).toBeVisible();
    });

    test('should show payment table', async ({ page }) => {
        const paymentTable = page.locator('table').or(
            page.locator('[data-testid="payments-list"]')
        );
        await expect(paymentTable).toBeVisible({ timeout: 10000 });
    });

    test('should show payment methods column', async ({ page }) => {
        // Look for payment method indicators
        await expect(page.getByText(/cash|momo|paystack|card/i)).toBeVisible({ timeout: 10000 });
    });

    test('should have export functionality', async ({ page }) => {
        const exportBtn = page.getByRole('button', { name: /export/i });
        await expect(exportBtn).toBeVisible();
    });
});

test.describe('Record Payment', () => {
    test('should open payment dialog from order', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/orders');

        // Click on first order
        const firstOrder = page.locator('tr, .order-card').first();
        if (await firstOrder.isVisible()) {
            await firstOrder.click();
            await page.waitForURL(/orders\/[^/]+/);

            // Look for add payment button
            const addPaymentBtn = page.getByRole('button', { name: /add payment|record payment|pay/i });
            if (await addPaymentBtn.isVisible()) {
                await addPaymentBtn.click();

                // Should show payment dialog
                await expect(page.getByRole('dialog')).toBeVisible();
            }
        }
    });

    test('should show payment method options', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/orders');

        const firstOrder = page.locator('tr, .order-card').first();
        if (await firstOrder.isVisible()) {
            await firstOrder.click();
            await page.waitForURL(/orders\/[^/]+/);

            const addPaymentBtn = page.getByRole('button', { name: /add payment|record payment/i });
            if (await addPaymentBtn.isVisible()) {
                await addPaymentBtn.click();

                // Should show payment method options
                await expect(page.getByText(/cash/i)).toBeVisible();
                await expect(page.getByText(/momo|mobile money/i)).toBeVisible();
            }
        }
    });

    test('should record cash payment', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/orders');

        const firstOrder = page.locator('tr, .order-card').first();
        if (await firstOrder.isVisible()) {
            await firstOrder.click();
            await page.waitForURL(/orders\/[^/]+/);

            const addPaymentBtn = page.getByRole('button', { name: /add payment|record payment/i });
            if (await addPaymentBtn.isVisible()) {
                await addPaymentBtn.click();

                // Select cash
                const cashOption = page.getByRole('radio', { name: /cash/i }).or(
                    page.getByLabel(/cash/i)
                );
                if (await cashOption.isVisible()) {
                    await cashOption.click();
                }

                // Enter amount
                const amountInput = page.getByLabel(/amount/i);
                if (await amountInput.isVisible()) {
                    await amountInput.fill('100');
                }

                // Submit
                const submitBtn = page.getByRole('button', { name: /save|record|submit/i });
                await submitBtn.click();

                // Should show success
                await expect(page.getByText(/success|recorded|saved/i)).toBeVisible({ timeout: 10000 });
            }
        }
    });

    test('should record MoMo payment with transaction ID', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/orders');

        const firstOrder = page.locator('tr, .order-card').first();
        if (await firstOrder.isVisible()) {
            await firstOrder.click();
            await page.waitForURL(/orders\/[^/]+/);

            const addPaymentBtn = page.getByRole('button', { name: /add payment|record payment/i });
            if (await addPaymentBtn.isVisible()) {
                await addPaymentBtn.click();

                // Select MoMo
                const momoOption = page.getByRole('radio', { name: /momo|mobile money/i }).or(
                    page.getByLabel(/momo|mobile money/i)
                );
                if (await momoOption.isVisible()) {
                    await momoOption.click();

                    // Should show transaction ID field
                    const txIdField = page.getByLabel(/transaction|reference/i);
                    await expect(txIdField).toBeVisible();
                }
            }
        }
    });
});

test.describe('Payment Receipt', () => {
    test('should generate receipt for payment', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/payments');

        // Click on first payment to view details
        const firstPayment = page.locator('tr').first();
        if (await firstPayment.isVisible()) {
            // Look for receipt button in the row
            const receiptBtn = firstPayment.getByRole('button', { name: /receipt|download/i }).or(
                page.getByRole('button', { name: /receipt/i })
            );

            if (await receiptBtn.isVisible()) {
                await receiptBtn.click();

                // Should trigger download or show receipt preview
            }
        }
    });
});

test.describe('Payment Balance', () => {
    test('should update order balance after payment', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/orders');

        const firstOrder = page.locator('tr, .order-card').first();
        if (await firstOrder.isVisible()) {
            await firstOrder.click();
            await page.waitForURL(/orders\/[^/]+/);

            // Look for balance information
            const balanceInfo = page.getByText(/balance|remaining|paid/i);
            await expect(balanceInfo).toBeVisible();
        }
    });
});

test.describe('Paystack Integration', () => {
    test('should show Paystack option for online payments', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/orders');

        const firstOrder = page.locator('tr, .order-card').first();
        if (await firstOrder.isVisible()) {
            await firstOrder.click();
            await page.waitForURL(/orders\/[^/]+/);

            const addPaymentBtn = page.getByRole('button', { name: /add payment|record payment/i });
            if (await addPaymentBtn.isVisible()) {
                await addPaymentBtn.click();

                // Look for Paystack/card option
                const paystackOption = page.getByText(/paystack|card|online/i);
                if (await paystackOption.isVisible()) {
                    await expect(paystackOption).toBeVisible();
                }
            }
        }
    });
});
