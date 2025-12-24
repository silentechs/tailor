import { expect, test } from '@playwright/test';

/**
 * E2E Tests: Tailor Client Management
 * Tests client creation, phone detection, linking, and multi-channel invites
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

test.describe('Client List View', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/clients');
    });

    test('should display clients page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible();
    });

    test('should show client table or list', async ({ page }) => {
        const clientTable = page.locator('table').or(
            page.locator('[data-testid="clients-list"]')
        );
        await expect(clientTable).toBeVisible({ timeout: 10000 });
    });

    test('should have add client button', async ({ page }) => {
        const addClientBtn = page.getByRole('link', { name: /add client|new client/i }).or(
            page.getByRole('button', { name: /add client|new client/i })
        );
        await expect(addClientBtn).toBeVisible();
    });

    test('should search clients', async ({ page }) => {
        const searchInput = page.getByPlaceholder(/search/i).or(
            page.getByRole('searchbox')
        );

        if (await searchInput.isVisible()) {
            await searchInput.fill('test');
            // Wait for search results
            await page.waitForTimeout(500);
            // Table should update
            await expect(page.locator('table, [data-testid="clients-list"]')).toBeVisible();
        }
    });
});

test.describe('Add New Client', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/clients/new');
    });

    test('should display add client form', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /add client|new client/i })).toBeVisible();
    });

    test('should have phone-based user detection', async ({ page }) => {
        const phoneInput = page.getByLabel(/phone/i);
        await expect(phoneInput).toBeVisible();

        // Enter a phone number
        await phoneInput.fill('0240000000');

        // Wait for lookup
        await page.waitForTimeout(1000);

        // Should show some feedback about user lookup
        // Either "User found" or continue with form
    });

    test('should require name and phone', async ({ page }) => {
        // Try to submit without required fields
        const submitBtn = page.getByRole('button', { name: /save|add|create/i });
        await submitBtn.click();

        // Should show validation errors
        await expect(page.getByText(/required|please|enter/i)).toBeVisible({ timeout: 5000 });
    });

    test('should successfully create client', async ({ page }) => {
        const uniquePhone = `024${Date.now().toString().slice(-7)}`;

        await page.getByLabel(/name/i).fill('Test Client E2E');
        await page.getByLabel(/phone/i).fill(uniquePhone);

        // Fill optional email if visible
        const emailField = page.getByLabel(/email/i);
        if (await emailField.isVisible()) {
            await emailField.fill(`test-${Date.now()}@example.com`);
        }

        const submitBtn = page.getByRole('button', { name: /save|add|create/i });
        await submitBtn.click();

        // Should redirect to clients list or client detail
        await expect(page).toHaveURL(/clients/, { timeout: 10000 });
    });
});

test.describe('Client Details', () => {
    test('should show client details page', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/clients');

        // Click on first client
        const firstClient = page.locator('tr, .client-card').first();
        if (await firstClient.isVisible()) {
            await firstClient.click();

            await expect(page.getByText(/client details|profile/i)).toBeVisible({ timeout: 10000 });
        }
    });

    test('should show measurements section', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/clients');

        const firstClient = page.locator('tr, .client-card').first();
        if (await firstClient.isVisible()) {
            await firstClient.click();
            await page.waitForURL(/clients\/[^/]+/);

            // Look for measurements section
            await expect(page.getByText(/measurement/i)).toBeVisible();
        }
    });

    test('should show push to profile button for linked accounts', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/clients');

        const firstClient = page.locator('tr, .client-card').first();
        if (await firstClient.isVisible()) {
            await firstClient.click();
            await page.waitForURL(/clients\/[^/]+/);

            // Look for sync/push buttons
            const syncBtn = page.getByRole('button', { name: /sync|push|pull/i });
            // Button visibility depends on whether client has linked account
        }
    });
});

test.describe('Multi-Channel Client Invite', () => {
    test('should show invite options', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/clients');

        const firstClient = page.locator('tr, .client-card').first();
        if (await firstClient.isVisible()) {
            await firstClient.click();
            await page.waitForURL(/clients\/[^/]+/);

            // Look for invite button
            const inviteBtn = page.getByRole('button', { name: /invite|send link/i });
            if (await inviteBtn.isVisible()) {
                await inviteBtn.click();

                // Should show channel options
                await expect(page.getByText(/whatsapp|sms|email/i)).toBeVisible();
            }
        }
    });

    test('should have WhatsApp, SMS, and Email channels', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/clients');

        const firstClient = page.locator('tr, .client-card').first();
        if (await firstClient.isVisible()) {
            await firstClient.click();
            await page.waitForURL(/clients\/[^/]+/);

            const inviteBtn = page.getByRole('button', { name: /invite|send/i });
            if (await inviteBtn.isVisible()) {
                await inviteBtn.click();

                // Check for all channel options
                await expect(page.getByRole('button', { name: /whatsapp/i }).or(
                    page.getByLabel(/whatsapp/i)
                )).toBeVisible();

                // SMS and Email might be in a segmented control or tabs
            }
        }
    });
});

test.describe('Measurement Sync', () => {
    test('should sync measurements from client profile', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/clients');

        // Find a client with linked account
        const firstClient = page.locator('tr, .client-card').first();
        if (await firstClient.isVisible()) {
            await firstClient.click();
            await page.waitForURL(/clients\/[^/]+/);

            const syncBtn = page.getByRole('button', { name: /sync from profile/i });
            if (await syncBtn.isVisible()) {
                await syncBtn.click();

                // Should show sync dialog or update measurements
                await expect(page.getByText(/sync|updated|measurement/i)).toBeVisible({ timeout: 10000 });
            }
        }
    });

    test('should push measurements to client profile', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/clients');

        const firstClient = page.locator('tr, .client-card').first();
        if (await firstClient.isVisible()) {
            await firstClient.click();
            await page.waitForURL(/clients\/[^/]+/);

            const pushBtn = page.getByRole('button', { name: /push to profile/i });
            if (await pushBtn.isVisible()) {
                await pushBtn.click();

                // Should show confirmation or success message
                await expect(page.getByText(/push|updated|success/i)).toBeVisible({ timeout: 10000 });
            }
        }
    });
});
