import { test, expect } from '@playwright/test';

test('multi-account menu and draft features UI test', async ({ page }) => {
  const mockSession = {
    did: 'did:plc:user1',
    handle: 'alice.bsky.social',
    accessJwt: 'mock-access-token',
    refreshJwt: 'mock-refresh-token',
    email: 'alice@example.com'
  };

  const mockAccounts = [
    mockSession,
    {
      did: 'did:plc:user2',
      handle: 'bob.bsky.social',
      accessJwt: 'mock-access-token-2',
      refreshJwt: 'mock-refresh-token-2',
      email: 'bob@example.com'
    }
  ];

  await page.route('https://bsky.social/xrpc/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSession)
    });
  });

  await page.addInitScript(({ session, accounts }) => {
    localStorage.setItem('skybrew_session', JSON.stringify(session));
    localStorage.setItem('skybrew_savedAccounts', JSON.stringify(accounts));
  }, { session: mockSession, accounts: mockAccounts });

  await page.goto('/');

  // 1. Verify account switcher popover
  await page.waitForSelector('button[title="アカウント切り替え"]');
  await page.click('button[title="アカウント切り替え"]');
  await page.waitForSelector('text=アカウント切替');
  await page.screenshot({ path: '/home/jules/verification/screenshots/account_menu.png' });

  // 2. Test Composer and Drafts
  await page.click('button:has-text("Post")');
  await page.fill('textarea[placeholder*="今どうしてる？"]', 'これは下書きテストのメッセージです。');
  await page.click('button:has-text("下書き保存")');

  // Verify draft count button text
  await expect(page.locator('button:has-text("下書き (1)")')).toBeVisible();
  await page.screenshot({ path: '/home/jules/verification/screenshots/draft_saved.png' });

  // Open Drafts modal
  await page.click('button:has-text("下書き (1)")');
  await page.waitForSelector('text=保存された下書き');
  await page.screenshot({ path: '/home/jules/verification/screenshots/drafts_modal.png' });
});
