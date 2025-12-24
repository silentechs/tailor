import { expect, test } from '@playwright/test';

/**
 * E2E Tests: Authentication Flows
 * Tests login, logout, and session persistence for tailors and clients
 */

test.describe('Login Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth/login');
    });

    test('should display login form', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.getByLabel(/email/i).fill('invalid@example.com');
        await page.getByLabel(/password/i).fill('wrongpassword');
        await page.getByRole('button', { name: /sign in|login/i }).click();

        // Wait for error message
        await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 10000 });
    });

    test('should redirect to dashboard after tailor login', async ({ page }) => {
        // Use test credentials - these should be set up in test environment
        const testEmail = process.env.TEST_TAILOR_EMAIL || 'test-tailor@example.com';
        const testPassword = process.env.TEST_TAILOR_PASSWORD || 'testpassword123';

        await page.getByLabel(/email/i).fill(testEmail);
        await page.getByLabel(/password/i).fill(testPassword);

        // Click and wait for navigation
        await Promise.all([
            page.waitForURL(/dashboard|studio/, { timeout: 20000 }),
            page.getByRole('button', { name: /sign in/i }).click(),
        ]);

        // Should be on dashboard
        await expect(page).toHaveURL(/dashboard/);
    });

    test('should redirect to studio after client login', async ({ page }) => {
        const testEmail = process.env.TEST_CLIENT_EMAIL || 'test-client@example.com';
        const testPassword = process.env.TEST_CLIENT_PASSWORD || 'testpassword123';

        await page.getByLabel(/email/i).fill(testEmail);
        await page.getByLabel(/password/i).fill(testPassword);

        // Click and wait for navigation
        await Promise.all([
            page.waitForURL(/studio|dashboard/, { timeout: 20000 }),
            page.getByRole('button', { name: /sign in/i }).click(),
        ]);

        // Should redirect to studio
        await expect(page).toHaveURL(/studio/);
    });

    test('should have link to registration', async ({ page }) => {
        const registerLink = page.getByRole('link', { name: /sign up|register|create account/i });
        await expect(registerLink).toBeVisible();
        await registerLink.click();
        await expect(page).toHaveURL(/register/);
    });

    test('should have link to forgot password', async ({ page }) => {
        const forgotLink = page.getByRole('link', { name: /forgot|reset password/i });
        await expect(forgotLink).toBeVisible();
    });
});

test.describe('Logout Flow', () => {
    test('should clear session on logout', async ({ page, context }) => {
        // First login
        await page.goto('/auth/login');
        const testEmail = process.env.TEST_TAILOR_EMAIL || 'test-tailor@example.com';
        const testPassword = process.env.TEST_TAILOR_PASSWORD || 'testpassword123';

        await page.getByLabel(/email/i).fill(testEmail);
        await page.getByLabel(/password/i).fill(testPassword);

        // Click and wait for navigation
        await Promise.all([
            page.waitForURL(/dashboard|studio/, { timeout: 20000 }),
            page.getByRole('button', { name: /sign in/i }).click(),
        ]);

        // Find and click logout
        // Look for user menu or logout button
        const userMenu = page.locator('[data-testid="user-menu"], [aria-label*="user"], button:has-text("logout")').first();
        if (await userMenu.isVisible()) {
            await userMenu.click();
        }

        const logoutButton = page.getByRole('button', { name: /logout|sign out/i }).or(
            page.getByRole('menuitem', { name: /logout|sign out/i })
        );

        if (await logoutButton.isVisible()) {
            await logoutButton.click();
        }

        // Should be redirected to login or home
        await expect(page).toHaveURL(/(login|auth|\/)/, { timeout: 10000 });

        // Verify session is cleared - accessing dashboard should redirect to login
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/login|auth/, { timeout: 10000 });
    });
});

test.describe('Session Persistence', () => {
    test('should maintain session across page refresh', async ({ page }) => {
        // Login first
        await page.goto('/auth/login');
        const testEmail = process.env.TEST_TAILOR_EMAIL || 'test-tailor@example.com';
        const testPassword = process.env.TEST_TAILOR_PASSWORD || 'testpassword123';

        await page.getByLabel(/email/i).fill(testEmail);
        await page.getByLabel(/password/i).fill(testPassword);

        // Click and wait for navigation
        await Promise.all([
            page.waitForURL(/dashboard|studio/, { timeout: 20000 }),
            page.getByRole('button', { name: /sign in/i }).click(),
        ]);

        // Refresh the page
        await page.reload();

        // Should still be on dashboard
        await expect(page).toHaveURL(/dashboard/);
    });
});
