import { test, expect } from '@playwright/test';

test('thread column opening, closing and reopening test', async ({ page }) => {
  const mockSession = {
    did: 'did:plc:user1',
    handle: 'alice.bsky.social',
    accessJwt: 'mock-access-token',
    refreshJwt: 'mock-refresh-token',
    email: 'alice@example.com'
  };

  const mockPost = {
    uri: 'at://did:plc:user1/app.bsky.feed.post/100',
    cid: 'bafy100',
    author: { handle: 'alice.bsky.social', displayName: 'Alice' },
    record: {
      text: 'スレッド動作確認用ポスト',
      createdAt: new Date().toISOString()
    },
    replyCount: 1,
    repostCount: 0,
    likeCount: 2
  };

  const mockThread = {
    $type: 'app.bsky.feed.defs#threadViewPost',
    post: mockPost,
    replies: [
      {
        $type: 'app.bsky.feed.defs#threadViewPost',
        post: {
          uri: 'at://did:plc:user1/app.bsky.feed.post/101',
          cid: 'bafy101',
          author: { handle: 'bob.bsky.social', displayName: 'Bob' },
          record: { text: '返信テストです', createdAt: new Date().toISOString() },
          replyCount: 0,
          repostCount: 0,
          likeCount: 1
        }
      }
    ]
  };

  await page.addInitScript(({ session, post, thread }) => {
    localStorage.setItem('skybrew_session', JSON.stringify(session));
    localStorage.setItem('skybrew_savedAccounts', JSON.stringify([session]));

    (window as any).agent = {
      session: session,
      resumeSession: async () => ({ data: session }),
      getTimeline: async () => ({ data: { feed: [{ post }] } }),
      getPostThread: async () => ({ data: { thread } }),
      getProfile: async () => ({ data: { did: session.did, handle: session.handle } }),
      listNotifications: async () => ({ data: { notifications: [] } }),
    };
  }, { session: mockSession, post: mockPost, thread: mockThread });

  await page.goto('/');

  // 1. Click post to open thread column first time
  await page.click('text=スレッド動作確認用ポスト');
  await expect(page.locator('text=返信テストです')).toBeVisible();
  await page.screenshot({ path: '/home/jules/verification/screenshots/thread_open_1.png' });

  // 2. Close thread column
  await page.locator('div[id^="col-thread"]').locator('button[aria-label="Close column"]').click({ force: true });
  await page.waitForTimeout(300);

  // 3. Re-click post to open thread column second time
  await page.click('text=スレッド動作確認用ポスト');
  await expect(page.locator('text=返信テストです')).toBeVisible();
  await page.screenshot({ path: '/home/jules/verification/screenshots/thread_open_2.png' });

  // 4. Close and re-open third time
  await page.locator('div[id^="col-thread"]').locator('button[aria-label="Close column"]').click({ force: true });
  await page.waitForTimeout(300);
  await page.click('text=スレッド動作確認用ポスト');
  await expect(page.locator('text=返信テストです')).toBeVisible();
  await page.screenshot({ path: '/home/jules/verification/screenshots/thread_open_3.png' });
});
