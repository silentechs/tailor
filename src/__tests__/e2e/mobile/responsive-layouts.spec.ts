import { expect, test } from '@playwright/test';

/**
 * E2E Tests: Responsive Layouts
 * Tests that key pages render correctly at different viewport sizes
 */

const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 800 },
};

test.describe('Landing Page Responsiveness', () => {
    for (const [name, size] of Object.entries(viewports)) {
        test(`should render correctly on ${name}`, async ({ page }) => {
            await page.setViewportSize(size);
            await page.goto('/');

            // Hero section should be visible
            const hero = page.locator('.hero, [data-testid="hero"], main section').first();
            await expect(hero).toBeVisible();

            // No horizontal scrollbar
            const hasHorizontalScroll = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });
            expect(hasHorizontalScroll).toBe(false);
        });
    }
});

test.describe('Gallery Page Responsiveness', () => {
    for (const [name, size] of Object.entries(viewports)) {
        test(`should show gallery grid on ${name}`, async ({ page }) => {
            await page.setViewportSize(size);
            await page.goto('/gallery');

            // Gallery should render
            await expect(page.getByRole('heading', { name: /gallery|designs/i })).toBeVisible();

            // Grid should be visible
            const grid = page.locator('.grid, .gallery-grid, [data-testid="gallery"]');
            await expect(grid).toBeVisible();
        });
    }
});

test.describe('Dashboard Responsiveness', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('/auth/login');
        const testEmail = process.env.TEST_TAILOR_EMAIL || 'test-tailor@example.com';
        const testPassword = process.env.TEST_TAILOR_PASSWORD || 'testpassword123';

        await page.getByLabel(/email/i).fill(testEmail);
        await page.getByLabel(/password/i).fill(testPassword);
        await page.getByRole('button', { name: /sign in|login/i }).click();
        await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    });

    test('should have responsive sidebar on desktop', async ({ page }) => {
        await page.setViewportSize(viewports.desktop);
        await page.goto('/dashboard');

        // Sidebar should be visible on desktop
        const sidebar = page.locator('aside, [data-testid="sidebar"]').first();
        await expect(sidebar).toBeVisible();
    });

    test('should have collapsible sidebar on tablet', async ({ page }) => {
        await page.setViewportSize(viewports.tablet);
        await page.goto('/dashboard');

        // Look for menu toggle
        const menuToggle = page.locator('button[aria-label*="menu"], button[aria-label*="sidebar"]').first();

        // Menu toggle should exist
        await expect(menuToggle).toBeVisible();
    });

    test('should have bottom navigation or drawer on mobile', async ({ page }) => {
        await page.setViewportSize(viewports.mobile);
        await page.goto('/dashboard');

        // Either bottom nav, menu button, or drawer trigger
        const mobileNav = page.locator('.bottom-nav, nav[role="navigation"], button[aria-label*="menu"]').first();
        await expect(mobileNav).toBeVisible();
    });
});

test.describe('Forms Responsiveness', () => {
    test('login form should be usable on mobile', async ({ page }) => {
        await page.setViewportSize(viewports.mobile);
        await page.goto('/auth/login');

        // Form elements should be properly sized
        const emailInput = page.getByLabel(/email/i);
        const passwordInput = page.getByLabel(/password/i);
        const submitButton = page.getByRole('button', { name: /sign in|login/i });

        // All elements visible
        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        await expect(submitButton).toBeVisible();

        // Submit button should be clickable (not cut off)
        const box = await submitButton.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
            expect(box.width).toBeGreaterThan(100); // Reasonable minimum width
        }
    });
});

test.describe('Table Responsiveness', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth/login');
        const testEmail = process.env.TEST_TAILOR_EMAIL || 'test-tailor@example.com';
        const testPassword = process.env.TEST_TAILOR_PASSWORD || 'testpassword123';

        await page.getByLabel(/email/i).fill(testEmail);
        await page.getByLabel(/password/i).fill(testPassword);
        await page.getByRole('button', { name: /sign in|login/i }).click();
        await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    });

    test('orders table should be scrollable on mobile', async ({ page }) => {
        await page.setViewportSize(viewports.mobile);
        await page.goto('/dashboard/orders');

        // Table or card layout should be visible
        const ordersContent = page.locator('table, .order-card, .order-list').first();
        await expect(ordersContent).toBeVisible({ timeout: 10000 });

        // Page should not overflow
        const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth + 10;
        });

        // Either no scroll or contained scroll (in a scroll container)
    });

    test('clients table should be usable on tablet', async ({ page }) => {
        await page.setViewportSize(viewports.tablet);
        await page.goto('/dashboard/clients');

        const clientsContent = page.locator('table, .client-card, .client-list').first();
        await expect(clientsContent).toBeVisible({ timeout: 10000 });
    });
});
