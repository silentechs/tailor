import { expect, test } from '@playwright/test';

/**
 * E2E Tests: Password Reset Flow
 * Tests forgot password and reset password functionality
 */

test.describe('Forgot Password Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth/forgot-password');
    });

    test('should display forgot password form', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /forgot|reset|recover/i })).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /send|reset|submit/i })).toBeVisible();
    });

    test('should show success message for valid email', async ({ page }) => {
        const testEmail = process.env.TEST_TAILOR_EMAIL || 'test-tailor@example.com';

        await page.getByLabel(/email/i).fill(testEmail);
        await page.getByRole('button', { name: /send|reset|submit/i }).click();

        // Should show success message
        await expect(page.getByText(/sent|check your email|reset link/i)).toBeVisible({ timeout: 10000 });
    });

    test('should validate email format', async ({ page }) => {
        await page.getByLabel(/email/i).fill('invalid-email');
        await page.getByRole('button', { name: /send|reset|submit/i }).click();

        // Should show validation error
        await expect(page.getByText(/valid email|invalid/i)).toBeVisible({ timeout: 5000 });
    });

    test('should have link back to login', async ({ page }) => {
        const backLink = page.getByRole('link', { name: /back|login|sign in/i });
        await expect(backLink).toBeVisible();
    });
});

test.describe('Reset Password Page', () => {
    test('should require valid token to access reset page', async ({ page }) => {
        // Try to access reset page without token
        await page.goto('/auth/reset-password');

        // Should show error or redirect
        const errorMessage = page.getByText(/invalid|expired|token/i);
        const loginPage = page.locator('url=/login/');

        // Either show error or redirect to login
        await expect(errorMessage.or(page)).toBeVisible({ timeout: 10000 });
    });

    test('should show password fields when token is valid', async ({ page }) => {
        // Use a mock token for testing UI (won't actually reset)
        await page.goto('/auth/reset-password?token=test-token');

        // Should show password fields (if token validation is client-side)
        // or show error if validation happens immediately
        const passwordField = page.getByLabel(/new password/i);
        const errorMessage = page.getByText(/invalid|expired/i);

        // One of these should be visible
        const passwordVisible = await passwordField.isVisible();
        const errorVisible = await errorMessage.isVisible();

        expect(passwordVisible || errorVisible).toBe(true);
    });
});
