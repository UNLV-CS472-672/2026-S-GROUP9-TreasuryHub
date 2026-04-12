import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 20000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('user can log in and reach dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('test@auth.playwright');
    await page.getByPlaceholder('Password').fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/', { timeout: 20000 });
    await expect(page).toHaveURL('/');
  });

  test('logged in user is redirected away from login page', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('test@auth.playwright');
    await page.getByPlaceholder('Password').fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/', { timeout: 20000 });
    await expect(page).toHaveURL('/');

    await page.goto('/login');
    await page.waitForURL('/', { timeout: 20000 });
    await expect(page).toHaveURL('/');
  });

  test('user can sign out', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('test@auth.playwright');
    await page.getByPlaceholder('Password').fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/', { timeout: 20000 });
    await expect(page).toHaveURL('/');

    await page.getByRole('button', { name: /Sign Out/i }).click();
    await page.waitForURL(/\/login/, { timeout: 20000 });
    await expect(page).toHaveURL(/\/login/);
  });

});
