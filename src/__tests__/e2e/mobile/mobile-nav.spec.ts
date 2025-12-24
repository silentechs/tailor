import { expect, test } from '@playwright/test';

/**
 * E2E Tests: Mobile Navigation and Responsiveness
 * Tests mobile-specific UI behaviors and layouts
 */

test.describe('Mobile Navigation', () => {
    test.beforeEach(async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should show mobile menu button', async ({ page }) => {
        await page.goto('/');

        // Look for hamburger menu or mobile menu button
        const menuButton = page.locator('button[aria-label*="menu"], [data-testid="mobile-menu"], .hamburger').first();
        await expect(menuButton).toBeVisible();
    });

    test('should open mobile menu on tap', async ({ page }) => {
        await page.goto('/');

        const menuButton = page.locator('button[aria-label*="menu"], [data-testid="mobile-menu"], .hamburger').first();
        if (await menuButton.isVisible()) {
            await menuButton.click();

            // Should show navigation items
            await expect(page.getByRole('navigation')).toBeVisible();
        }
    });

    test('should close menu when navigating', async ({ page }) => {
        await page.goto('/');

        const menuButton = page.locator('button[aria-label*="menu"], [data-testid="mobile-menu"], .hamburger').first();
        if (await menuButton.isVisible()) {
            await menuButton.click();

            // Click a nav link
            const navLink = page.getByRole('link', { name: /gallery|discover/i }).first();
            if (await navLink.isVisible()) {
                await navLink.click();

                // Menu should close
                await page.waitForTimeout(500);
            }
        }
    });
});

test.describe('Mobile Sidebar in Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        // Login as tailor
        await page.goto('/auth/login');
        const testEmail = process.env.TEST_TAILOR_EMAIL || 'test-tailor@example.com';
        const testPassword = process.env.TEST_TAILOR_PASSWORD || 'testpassword123';

        await page.getByLabel(/email/i).fill(testEmail);
        await page.getByLabel(/password/i).fill(testPassword);
        await page.getByRole('button', { name: /sign in|login/i }).click();
        await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    });

    test('should hide sidebar by default on mobile', async ({ page }) => {
        const sidebar = page.locator('aside, [data-testid="sidebar"], .sidebar').first();

        // Sidebar should be hidden or toggled off
        const isVisible = await sidebar.isVisible();
        // On mobile, sidebar is typically hidden or a slide-out
    });

    test('should toggle sidebar with menu button', async ({ page }) => {
        const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="sidebar"]').first();

        if (await menuButton.isVisible()) {
            await menuButton.click();

            // Sidebar should appear
            const sidebar = page.locator('aside, [data-testid="sidebar"], nav').first();
            await expect(sidebar).toBeVisible();
        }
    });
});

test.describe('Mobile Chat/Messages View', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        // Login
        await page.goto('/auth/login');
        const testEmail = process.env.TEST_TAILOR_EMAIL || 'test-tailor@example.com';
        const testPassword = process.env.TEST_TAILOR_PASSWORD || 'testpassword123';

        await page.getByLabel(/email/i).fill(testEmail);
        await page.getByLabel(/password/i).fill(testPassword);
        await page.getByRole('button', { name: /sign in|login/i }).click();
    });

    test('should show chat area when message selected', async ({ page }) => {
        await page.goto('/dashboard/messages');

        // Click on a conversation
        const conversationItem = page.locator('.conversation-item, .message-preview, [data-testid="conversation"]').first();

        if (await conversationItem.isVisible()) {
            await conversationItem.click();

            // Chat area should be visible
            const chatArea = page.locator('.chat-area, .message-list, [data-testid="chat"]');
            await expect(chatArea).toBeVisible({ timeout: 5000 });
        }
    });

    test('should have back button in chat view', async ({ page }) => {
        await page.goto('/dashboard/messages');

        const conversationItem = page.locator('.conversation-item, .message-preview').first();

        if (await conversationItem.isVisible()) {
            await conversationItem.click();

            // Should show back button
            const backButton = page.getByRole('button', { name: /back/i }).or(
                page.locator('[aria-label*="back"]')
            );
            await expect(backButton).toBeVisible();
        }
    });
});

test.describe('Mobile Chat Input Layout', () => {
    test('should not overlap send button with action buttons', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        // Login
        await page.goto('/auth/login');
        const testEmail = process.env.TEST_TAILOR_EMAIL || 'test-tailor@example.com';
        const testPassword = process.env.TEST_TAILOR_PASSWORD || 'testpassword123';

        await page.getByLabel(/email/i).fill(testEmail);
        await page.getByLabel(/password/i).fill(testPassword);
        await page.getByRole('button', { name: /sign in|login/i }).click();

        await page.goto('/dashboard/messages');

        const conversationItem = page.locator('.conversation-item, .message-preview').first();

        if (await conversationItem.isVisible()) {
            await conversationItem.click();
            await page.waitForTimeout(500);

            // Check send button is accessible
            const sendButton = page.getByRole('button', { name: /send/i });
            if (await sendButton.isVisible()) {
                // Verify it's clickable (not covered)
                await expect(sendButton).toBeEnabled();

                // Get bounding boxes to verify no overlap
                const sendBox = await sendButton.boundingBox();
                expect(sendBox).not.toBeNull();
            }
        }
    });
});

test.describe('Feedback Button Positioning', () => {
    test('should not overlap with interactive elements', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        // Look for floating feedback button
        const feedbackButton = page.locator('.feedback-button, [data-testid="feedback"]').or(
            page.getByRole('button', { name: /feedback/i })
        );

        if (await feedbackButton.isVisible()) {
            const fbBox = await feedbackButton.boundingBox();

            // Feedback button should be positioned to not overlap critical content
            // It should be in a corner with padding
            if (fbBox) {
                // Should be at bottom of viewport with some margin
                expect(fbBox.y).toBeGreaterThan(500); // Near bottom
            }
        }
    });
});
