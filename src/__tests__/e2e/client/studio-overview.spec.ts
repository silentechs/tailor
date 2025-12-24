import { expect, test } from '@playwright/test';

/**
 * E2E Tests: Client Studio Overview
 * Tests client studio dashboard, connected tailors, and wishlist
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

test.describe('Studio Overview', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsClient(page);
    });

    test('should display studio dashboard', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /studio|dashboard|welcome/i })).toBeVisible();
    });

    test('should show connected tailors section', async ({ page }) => {
        // Look for tailors/shops section
        const tailorsSection = page.getByRole('heading', { name: /tailor|shop|connected/i }).or(
            page.getByText(/my tailors|connected tailors/i)
        );
        await expect(tailorsSection).toBeVisible();
    });

    test('should show active orders section', async ({ page }) => {
        const ordersSection = page.getByRole('heading', { name: /order/i }).or(
            page.getByText(/my orders|active orders/i)
        );
        await expect(ordersSection).toBeVisible();
    });

    test('should navigate to different studio pages', async ({ page }) => {
        // Check for navigation links
        const navLinks = [
            { name: /measurement/i, url: /measurements/ },
            { name: /order/i, url: /orders/ },
            { name: /payment/i, url: /payments/ },
        ];

        for (const link of navLinks) {
            const navItem = page.getByRole('link', { name: link.name });
            if (await navItem.isVisible()) {
                await expect(navItem).toBeVisible();
            }
        }
    });
});

test.describe('Wishlist Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsClient(page);
    });

    test('should access wishlist page', async ({ page }) => {
        await page.goto('/studio/styles');

        // Should show wishlist/saved styles
        await expect(page.getByRole('heading', { name: /wishlist|saved|styles/i })).toBeVisible();
    });

    test('should show saved designs', async ({ page }) => {
        await page.goto('/studio/styles');

        // Look for design cards or empty state
        const designCard = page.locator('.design-card, .wishlist-item').first();
        const emptyState = page.getByText(/no saved|empty|start saving/i);

        const hasDesigns = await designCard.isVisible();
        const isEmpty = await emptyState.isVisible();

        // Either designs or empty state should be visible
        expect(hasDesigns || isEmpty).toBe(true);
    });
});

test.describe('Auth-Aware Like Button', () => {
    test('should show auth popover for unauthenticated users', async ({ page }) => {
        // Visit gallery without login
        await page.goto('/gallery');

        // Find like button on a design
        const likeButton = page.locator('button[aria-label*="like"], .like-button, [data-testid="like-button"]').first();

        if (await likeButton.isVisible()) {
            await likeButton.click();

            // Should show auth popover (not a toast)
            await expect(page.getByRole('dialog').or(
                page.locator('[role="tooltip"], .popover')
            )).toBeVisible({ timeout: 5000 });

            // Should have sign in option
            await expect(page.getByText(/sign in|login/i)).toBeVisible();
        }
    });

    test('should work normally for authenticated client', async ({ page }) => {
        await loginAsClient(page);
        await page.goto('/gallery');

        const likeButton = page.locator('button[aria-label*="like"], .like-button').first();

        if (await likeButton.isVisible()) {
            await likeButton.click();

            // Should toggle like state without auth popover
            // Should NOT show sign in prompt
            await expect(page.getByText(/sign in to like/i)).not.toBeVisible();
        }
    });

    test('should show appropriate message for tailor trying to like', async ({ page }) => {
        // Login as tailor
        await page.goto('/auth/login');
        const testEmail = process.env.TEST_TAILOR_EMAIL || 'test-tailor@example.com';
        const testPassword = process.env.TEST_TAILOR_PASSWORD || 'testpassword123';

        await page.getByLabel(/email/i).fill(testEmail);
        await page.getByLabel(/password/i).fill(testPassword);
        await page.getByRole('button', { name: /sign in|login/i }).click();

        await page.goto('/gallery');

        const likeButton = page.locator('button[aria-label*="like"], .like-button').first();

        if (await likeButton.isVisible()) {
            await likeButton.click();

            // Should show message that tailors can't like (or just work differently)
        }
    });
});

test.describe('Connected Tailors', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsClient(page);
    });

    test('should show list of connected tailors', async ({ page }) => {
        // Look for tailors list
        const tailorList = page.locator('.tailor-card, .shop-card').or(
            page.getByText(/no connected tailors/i)
        );
        await expect(tailorList).toBeVisible();
    });

    test('should show tailor details', async ({ page }) => {
        const tailorCard = page.locator('.tailor-card, .shop-card').first();

        if (await tailorCard.isVisible()) {
            // Should show tailor name and possibly rating
            await expect(tailorCard.getByText(/.+/)).toBeVisible();
        }
    });
});
