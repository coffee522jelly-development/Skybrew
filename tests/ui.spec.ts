import { test, expect } from '@playwright/test';

// Mocking session and api is tricky in e2e without a proper setup,
// but we can test that the login form handles UI interactions.
test('Login form displays loading state on submit', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('text=Login to Bluesky', { timeout: 10000 });

  await page.getByLabel('Handle or Email').fill('test@test.com');
  await page.getByLabel('App Password').fill('password');

  // Intercept the API call to delay it, ensuring we see the loading state
  await page.route('**/xrpc/com.atproto.server.createSession', async route => {
    // delay for 1 second
    await new Promise(r => setTimeout(r, 1000));
    await route.abort(); // force fail
  });

  const submitButton = page.getByRole('button', { name: 'Login' });
  await submitButton.click();

  // Button text changes to "Logging in..."
  await expect(page.getByRole('button', { name: 'Logging in...' })).toBeVisible();

  // Wait for error state
  await expect(page.locator('text=Login failed').or(page.locator('text=Failed to fetch'))).toBeVisible();
});
