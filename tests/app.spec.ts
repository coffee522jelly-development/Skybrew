import { test, expect } from '@playwright/test';

test('has title and shows login on initial load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Login to Bluesky').or(page.locator('text=Loading Client...'))).toBeVisible();
});

test('login form has required fields', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('text=Login to Bluesky', { timeout: 10000 });
  await expect(page.getByLabel('Handle or Email')).toBeVisible();
  await expect(page.getByLabel('App Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});
