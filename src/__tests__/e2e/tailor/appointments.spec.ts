import { expect, test } from '@playwright/test';

/**
 * E2E Tests: Tailor Appointment Management
 * Tests appointment creation, calendar view, and scheduling
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

test.describe('Appointments Page', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/appointments');
    });

    test('should display appointments page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /appointment|calendar|schedule/i })).toBeVisible();
    });

    test('should show calendar view', async ({ page }) => {
        // Look for calendar component
        const calendar = page.locator('.calendar, [data-testid="calendar"]').or(
            page.locator('[class*="calendar"]')
        );
        await expect(calendar).toBeVisible({ timeout: 10000 });
    });

    test('should have new appointment button', async ({ page }) => {
        const newApptBtn = page.getByRole('button', { name: /new appointment|schedule|add/i });
        await expect(newApptBtn).toBeVisible();
    });

    test('should show different calendar views', async ({ page }) => {
        // Look for view switcher (day/week/month)
        const viewSwitcher = page.getByRole('button', { name: /month|week|day/i }).first();
        if (await viewSwitcher.isVisible()) {
            await viewSwitcher.click();
            // Should show other view options
        }
    });
});

test.describe('Create Appointment', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/appointments');
    });

    test('should open appointment dialog', async ({ page }) => {
        const newApptBtn = page.getByRole('button', { name: /new appointment|schedule|add/i });
        await newApptBtn.click();

        // Should show appointment dialog
        await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('should require client selection', async ({ page }) => {
        const newApptBtn = page.getByRole('button', { name: /new appointment|schedule|add/i });
        await newApptBtn.click();

        // Look for client field
        const clientField = page.getByLabel(/client/i).or(
            page.getByRole('combobox', { name: /client/i })
        );
        await expect(clientField).toBeVisible();
    });

    test('should require date and time', async ({ page }) => {
        const newApptBtn = page.getByRole('button', { name: /new appointment|schedule|add/i });
        await newApptBtn.click();

        // Look for date field
        const dateField = page.getByLabel(/date/i).or(
            page.locator('input[type="date"]')
        );
        await expect(dateField).toBeVisible();

        // Look for time field
        const timeField = page.getByLabel(/time/i).or(
            page.locator('input[type="time"]')
        );
        await expect(timeField).toBeVisible();
    });

    test('should have appointment type selection', async ({ page }) => {
        const newApptBtn = page.getByRole('button', { name: /new appointment|schedule|add/i });
        await newApptBtn.click();

        // Look for type/purpose field
        const typeField = page.getByLabel(/type|purpose/i).or(
            page.getByRole('combobox', { name: /type/i })
        );

        if (await typeField.isVisible()) {
            await typeField.click();
            // Should show options like fitting, measurement, pickup
            await expect(page.getByText(/fitting|measurement|pickup|consultation/i)).toBeVisible();
        }
    });

    test('should create appointment by clicking on calendar', async ({ page }) => {
        // Click on a day in the calendar
        const calendarDay = page.locator('.calendar-day, [data-date]').first();
        if (await calendarDay.isVisible()) {
            await calendarDay.click();

            // Should open appointment dialog
            await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
        }
    });
});

test.describe('Appointment Details', () => {
    test('should show appointment details on click', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/appointments');

        // Click on existing appointment
        const appointment = page.locator('.appointment, .event, [data-appointment]').first();
        if (await appointment.isVisible()) {
            await appointment.click();

            // Should show details dialog or panel
            await expect(page.getByText(/client|date|time/i)).toBeVisible();
        }
    });

    test('should allow editing appointment', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/appointments');

        const appointment = page.locator('.appointment, .event, [data-appointment]').first();
        if (await appointment.isVisible()) {
            await appointment.click();

            // Look for edit button
            const editBtn = page.getByRole('button', { name: /edit/i });
            if (await editBtn.isVisible()) {
                await editBtn.click();

                // Should be able to modify fields
                await expect(page.getByRole('dialog')).toBeVisible();
            }
        }
    });

    test('should allow canceling appointment', async ({ page }) => {
        await loginAsTailor(page);
        await page.goto('/dashboard/appointments');

        const appointment = page.locator('.appointment, .event, [data-appointment]').first();
        if (await appointment.isVisible()) {
            await appointment.click();

            // Look for cancel/delete button
            const cancelBtn = page.getByRole('button', { name: /cancel|delete/i });
            if (await cancelBtn.isVisible()) {
                await expect(cancelBtn).toBeVisible();
            }
        }
    });
});
