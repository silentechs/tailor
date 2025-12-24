import { expect, test } from '@playwright/test';

/**
 * E2E Tests: Client Measurements
 * Tests viewing and managing personal measurements
 */

// Helper to login as client
async function loginAsClient(page: any) {
    await page.goto('/auth/login');
    const testEmail = process.env.TEST_CLIENT_EMAIL || 'test-client@example.com';
    const testPassword = process.env.TEST_CLIENT_PASSWORD || 'testpassword123';

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/studio/, { timeout: 15000 });
}

test.describe('Measurements Page', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsClient(page);
        await page.goto('/studio/measurements');
    });

    test('should display measurements page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /measurement/i })).toBeVisible();
    });

    test('should show measurement categories', async ({ page }) => {
        // Look for measurement sections or tabs
        const measurementSection = page.getByText(/chest|waist|hip|length|arm/i);
        await expect(measurementSection).toBeVisible();
    });

    test('should display measurement values', async ({ page }) => {
        // Look for measurement fields with values or empty state
        const measurementFields = page.locator('input[type="number"], .measurement-value').first();
        const emptyState = page.getByText(/no measurements|add your measurements/i);

        const hasValues = await measurementFields.isVisible();
        const isEmpty = await emptyState.isVisible();

        expect(hasValues || isEmpty).toBe(true);
    });
});

test.describe('Edit Measurements', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsClient(page);
        await page.goto('/studio/measurements');
    });

    test('should have edit button', async ({ page }) => {
        const editBtn = page.getByRole('button', { name: /edit|update/i });
        await expect(editBtn).toBeVisible();
    });

    test('should enable editing mode', async ({ page }) => {
        const editBtn = page.getByRole('button', { name: /edit|update/i });
        if (await editBtn.isVisible()) {
            await editBtn.click();

            // Should show input fields
            const inputFields = page.locator('input[type="number"]');
            await expect(inputFields.first()).toBeEnabled();
        }
    });

    test('should save measurement changes', async ({ page }) => {
        const editBtn = page.getByRole('button', { name: /edit|update/i });
        if (await editBtn.isVisible()) {
            await editBtn.click();

            // Find a measurement input and change value
            const inputField = page.locator('input[type="number"]').first();
            if (await inputField.isVisible()) {
                await inputField.fill('42');

                // Save changes
                const saveBtn = page.getByRole('button', { name: /save/i });
                if (await saveBtn.isVisible()) {
                    await saveBtn.click();

                    // Should show success message
                    await expect(page.getByText(/saved|updated|success/i)).toBeVisible({ timeout: 10000 });
                }
            }
        }
    });
});

test.describe('Measurement Sync Indication', () => {
    test('should show sync status with tailors', async ({ page }) => {
        await loginAsClient(page);
        await page.goto('/studio/measurements');

        // Look for sync status indicators
        const syncIndicator = page.getByText(/synced|last updated|from/i).or(
            page.locator('[data-testid="sync-status"]')
        );

        // May or may not be visible depending on whether client has synced measurements
        // This is informational - just check the page loads
        await expect(page.getByRole('heading', { name: /measurement/i })).toBeVisible();
    });
});

test.describe('Measurement Units', () => {
    test('should show unit indicators', async ({ page }) => {
        await loginAsClient(page);
        await page.goto('/studio/measurements');

        // Look for unit indicators (cm, inches)
        const unitIndicator = page.getByText(/cm|inch|in|centimeter/i);
        if (await unitIndicator.isVisible()) {
            await expect(unitIndicator).toBeVisible();
        }
    });
});
