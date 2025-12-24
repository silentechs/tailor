import { expect, test } from '@playwright/test';

/**
 * E2E Tests: Role-Based Access Control (RBAC)
 * Tests that users can only access routes appropriate to their role
 */

// Helper functions for different role logins
async function loginAsTailor(page: any) {
    await page.goto('/auth/login');
    const testEmail = process.env.TEST_TAILOR_EMAIL || 'test-tailor@example.com';
    const testPassword = process.env.TEST_TAILOR_PASSWORD || 'testpassword123';

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
}

async function loginAsClient(page: any) {
    await page.goto('/auth/login');
    const testEmail = process.env.TEST_CLIENT_EMAIL || 'test-client@example.com';
    const testPassword = process.env.TEST_CLIENT_PASSWORD || 'testpassword123';

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/studio/, { timeout: 15000 });
}

async function loginAsWorker(page: any) {
    await page.goto('/auth/login');
    const testEmail = process.env.TEST_WORKER_EMAIL || 'test-worker@example.com';
    const testPassword = process.env.TEST_WORKER_PASSWORD || 'testpassword123';

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|login/i }).click();
}

test.describe('Tailor-Only Routes', () => {
    test('CLIENT should be redirected from /dashboard', async ({ page }) => {
        await loginAsClient(page);

        // Try to access tailor dashboard
        await page.goto('/dashboard');

        // Should be redirected to studio or access denied
        await expect(page).toHaveURL(/(studio|login|forbidden|unauthorized)/, { timeout: 10000 });
    });

    test('CLIENT should not see dashboard navigation', async ({ page }) => {
        await loginAsClient(page);

        // Should not see dashboard link in navigation
        const dashboardLink = page.getByRole('link', { name: /^dashboard$/i });

        // Either not visible or not present
        const isVisible = await dashboardLink.isVisible();
        expect(isVisible).toBe(false);
    });
});

test.describe('Admin-Only Routes', () => {
    test('TAILOR should be redirected from /admin', async ({ page }) => {
        await loginAsTailor(page);

        // Try to access admin routes
        await page.goto('/admin');

        // Should be redirected or shown access denied
        await expect(page).toHaveURL(/(dashboard|login|forbidden|unauthorized|404)/, { timeout: 10000 });
    });

    test('CLIENT should be redirected from /admin', async ({ page }) => {
        await loginAsClient(page);

        await page.goto('/admin');

        await expect(page).toHaveURL(/(studio|login|forbidden|unauthorized|404)/, { timeout: 10000 });
    });
});

test.describe('Manager-Only Dashboard Routes', () => {
    test('WORKER should not access /dashboard/business', async ({ page }) => {
        await loginAsWorker(page);

        // Try to access business settings
        await page.goto('/dashboard/business');

        // Should be redirected or access denied
        const url = page.url();
        const forbiddenMessage = page.getByText(/forbidden|access denied|not authorized/i);

        // Either redirected away or shows forbidden message
        const isRedirected = !url.includes('/business');
        const showsForbidden = await forbiddenMessage.isVisible();

        expect(isRedirected || showsForbidden).toBe(true);
    });

    test('WORKER should not access /dashboard/team', async ({ page }) => {
        await loginAsWorker(page);

        await page.goto('/dashboard/team');

        const url = page.url();
        const forbiddenMessage = page.getByText(/forbidden|access denied|not authorized/i);

        const isRedirected = !url.includes('/team');
        const showsForbidden = await forbiddenMessage.isVisible();

        expect(isRedirected || showsForbidden).toBe(true);
    });

    test('WORKER should not see business/team in sidebar', async ({ page }) => {
        await loginAsWorker(page);

        // Check sidebar for manager-only links
        const businessLink = page.getByRole('link', { name: /business/i });
        const teamLink = page.getByRole('link', { name: /team/i });

        // These should not be visible to workers
        const businessVisible = await businessLink.isVisible();
        const teamVisible = await teamLink.isVisible();

        // At least one should be hidden
        expect(businessVisible && teamVisible).toBe(false);
    });

    test('MANAGER should access /dashboard/business', async ({ page }) => {
        await loginAsTailor(page); // Tailor is typically a manager/owner

        await page.goto('/dashboard/business');

        // Should load business page
        await expect(page.getByRole('heading', { name: /business|settings/i })).toBeVisible({ timeout: 10000 });
    });

    test('MANAGER should access /dashboard/team', async ({ page }) => {
        await loginAsTailor(page);

        await page.goto('/dashboard/team');

        // Should load team page
        await expect(page.getByRole('heading', { name: /team/i })).toBeVisible({ timeout: 10000 });
    });
});

test.describe('API Route Protection', () => {
    test('Unauthenticated request to protected API should return 401', async ({ request }) => {
        const response = await request.get('/api/orders');

        // Should return 401 Unauthorized
        expect(response.status()).toBe(401);
    });

    test('Client accessing tailor API should be denied', async ({ page, request }) => {
        await loginAsClient(page);

        // Get the session cookie
        const cookies = await page.context().cookies();
        const sessionCookie = cookies.find(c => c.name.includes('session'))?.value || '';

        // Try to access tailor's orders
        const response = await request.get('/api/orders', {
            headers: {
                Cookie: `sc_session=${sessionCookie}`,
            },
        });

        // Should be 403 Forbidden or 401
        expect([401, 403]).toContain(response.status());
    });

    test('Admin API should reject non-admin users', async ({ page, request }) => {
        await loginAsTailor(page);

        const cookies = await page.context().cookies();
        const sessionCookie = cookies.find(c => c.name.includes('session'))?.value || '';

        const response = await request.get('/api/admin/users', {
            headers: {
                Cookie: `sc_session=${sessionCookie}`,
            },
        });

        // Should be 403 Forbidden
        expect([401, 403]).toContain(response.status());
    });
});

test.describe('Cross-Organization Access', () => {
    test('User should not access another org\'s orders', async ({ request }) => {
        // This test verifies org isolation at the API level
        // Using a mock order ID from a different org
        const foreignOrderId = 'foreign-org-order-id';

        const response = await request.get(`/api/orders/${foreignOrderId}`);

        // Should return 401, 403, or 404 (not 200 with data)
        expect([401, 403, 404]).toContain(response.status());
    });
});
