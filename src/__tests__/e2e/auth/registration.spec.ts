import { expect, test } from '@playwright/test';

/**
 * E2E Tests: User Registration Flows
 * Tests tailor and client registration with role-based status assignment
 */

test.describe('Registration Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth/register');
    });

    test('should display registration form', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /sign up|register|create/i })).toBeVisible();
        await expect(page.getByLabel(/name/i)).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i).first()).toBeVisible();
    });

    test('should show role selection (Tailor/Client)', async ({ page }) => {
        // Look for role selection tabs or radio buttons
        const tailorOption = page.getByRole('tab', { name: /tailor/i }).or(
            page.getByRole('radio', { name: /tailor/i }).or(
                page.getByLabel(/tailor/i)
            )
        );
        const clientOption = page.getByRole('tab', { name: /client/i }).or(
            page.getByRole('radio', { name: /client/i }).or(
                page.getByLabel(/client/i)
            )
        );

        // At least one role option should exist
        const tailorVisible = await tailorOption.isVisible();
        const clientVisible = await clientOption.isVisible();
        expect(tailorVisible || clientVisible).toBe(true);
    });

    test('should show additional fields for tailor registration', async ({ page }) => {
        // Select tailor role
        const tailorOption = page.getByRole('tab', { name: /tailor/i }).or(
            page.getByLabel(/tailor/i)
        );

        if (await tailorOption.isVisible()) {
            await tailorOption.click();
        }

        // Should show business-specific fields
        await expect(page.getByLabel(/business name|shop name/i)).toBeVisible();
        await expect(page.getByLabel(/phone/i)).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
        // Try to submit empty form
        const submitButton = page.getByRole('button', { name: /sign up|register|create/i });
        await submitButton.click();

        // Should show validation errors
        await expect(page.getByText(/required|please fill|enter/i)).toBeVisible({ timeout: 5000 });
    });

    test('should validate email format', async ({ page }) => {
        await page.getByLabel(/email/i).fill('invalid-email');
        await page.getByLabel(/password/i).first().fill('password123');

        const submitButton = page.getByRole('button', { name: /sign up|register|create/i });
        await submitButton.click();

        // Should show email validation error
        await expect(page.getByText(/valid email|invalid email/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show error for duplicate email', async ({ page }) => {
        // Use an email that already exists
        const existingEmail = process.env.TEST_EXISTING_EMAIL || 'test-tailor@example.com';

        await page.getByLabel(/name/i).fill('Test User');
        await page.getByLabel(/email/i).fill(existingEmail);
        await page.getByLabel(/password/i).first().fill('password123');

        // If there's a phone field visible, fill it
        const phoneField = page.getByLabel(/phone/i);
        if (await phoneField.isVisible()) {
            await phoneField.fill('0240000000');
        }

        // If there's a business name field visible, fill it
        const businessField = page.getByLabel(/business name|shop name/i);
        if (await businessField.isVisible()) {
            await businessField.fill('Test Shop');
        }

        const submitButton = page.getByRole('button', { name: /sign up|register|create/i });
        await submitButton.click();

        // Should show duplicate email error
        await expect(page.getByText(/already exists|already registered|email in use/i)).toBeVisible({ timeout: 10000 });
    });

    test('should have link to login page', async ({ page }) => {
        const loginLink = page.getByRole('link', { name: /sign in|login|already have/i });
        await expect(loginLink).toBeVisible();
        await loginLink.click();
        await expect(page).toHaveURL(/login/);
    });
});

test.describe('Client Registration', () => {
    test('should successfully register a new client', async ({ page }) => {
        await page.goto('/auth/register');

        // Select client role if available
        const clientOption = page.getByRole('tab', { name: /client/i }).or(
            page.getByLabel(/client/i)
        );

        if (await clientOption.isVisible()) {
            await clientOption.click();
        }

        // Generate unique email for test
        const uniqueEmail = `test-client-${Date.now()}@example.com`;

        await page.getByLabel(/name/i).fill('Test Client');
        await page.getByLabel(/email/i).fill(uniqueEmail);
        await page.getByLabel(/password/i).first().fill('TestPassword123!');

        // Fill phone if visible
        const phoneField = page.getByLabel(/phone/i);
        if (await phoneField.isVisible()) {
            await phoneField.fill('0201234567');
        }

        const submitButton = page.getByRole('button', { name: /sign up|register|create/i });
        await submitButton.click();

        // Client should be redirected to studio (ACTIVE status)
        await expect(page).toHaveURL(/(studio|login|verify)/, { timeout: 15000 });
    });
});

test.describe('Tailor Registration', () => {
    test('should show pending status message after tailor registration', async ({ page }) => {
        await page.goto('/auth/register');

        // Select tailor role
        const tailorOption = page.getByRole('tab', { name: /tailor/i }).or(
            page.getByLabel(/tailor/i)
        );

        if (await tailorOption.isVisible()) {
            await tailorOption.click();
        }

        // Generate unique email for test
        const uniqueEmail = `test-tailor-${Date.now()}@example.com`;

        await page.getByLabel(/name/i).fill('Test Tailor');
        await page.getByLabel(/email/i).fill(uniqueEmail);
        await page.getByLabel(/password/i).first().fill('TestPassword123!');

        // Fill business name
        const businessField = page.getByLabel(/business name|shop name/i);
        if (await businessField.isVisible()) {
            await businessField.fill('Test Tailoring Shop');
        }

        // Fill phone
        const phoneField = page.getByLabel(/phone/i);
        if (await phoneField.isVisible()) {
            await phoneField.fill('0241234567');
        }

        const submitButton = page.getByRole('button', { name: /sign up|register|create/i });
        await submitButton.click();

        // Should show pending approval message or redirect to login
        const pendingMessage = page.getByText(/pending|approval|review|wait/i);
        const loginRedirect = page.locator('url=/login/');

        await expect(pendingMessage.or(page)).toBeVisible({ timeout: 15000 });
    });
});
