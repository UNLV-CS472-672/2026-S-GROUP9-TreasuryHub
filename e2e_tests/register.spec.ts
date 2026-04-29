import { test, expect } from '@playwright/test';

test.describe('Registration', () => {

    test('unauthenticated user can reach register page', async ({ page }) => {
        await page.goto('/register');
        await expect(page).toHaveURL(/\/register/);
    });

    test('passwords not matching shows error', async ({ page }) => {
        await page.goto('/register');

        await page.getByPlaceholder('Display Name').fill('Test User');
        await page.getByPlaceholder('Email').fill('test@register.playwright');
        await page.getByPlaceholder('Password', { exact: true }).fill('password123');
        await page.getByPlaceholder('Confirm Password').fill('differentpassword');
        await page.getByRole('button', { name: 'Register' }).click();

        await expect(page.getByText('Passwords do not match')).toBeVisible();
    });

    test('register link is visible on login page', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByRole('link', { name: /register/i })).toBeVisible();
    });

    test('user can register and is redirected', async ({ page, browserName }) => {
        await page.goto('/register');

        await page.getByPlaceholder('Display Name').fill('Test Register User');
        // Registering users w/ browsername, since they are running parallel, 
        // and all trying to create the same user, causing tests to fail
        await page.getByPlaceholder('Email').fill(`test.${browserName}@register.playwright`);
        await page.getByPlaceholder('Password', { exact: true }).fill('123456');
        await page.getByPlaceholder('Confirm Password').fill('123456');
        await page.getByRole('button', { name: 'Register' }).click();

        await page.waitForURL('/');
        await expect(page).toHaveURL('/');
    });

});