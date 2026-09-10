import { test, expect } from '@playwright/test';

test('sentiment analysis meter and keyword radar node map UI test', async ({ page }) => {
  const mockSession = {
    did: 'did:plc:user1',
    handle: 'alice.bsky.social',
    accessJwt: 'mock-access-token',
    refreshJwt: 'mock-refresh-token',
    email: 'alice@example.com'
  };

  const mockFeed = [
    {
      post: {
        uri: 'at://did:plc:user1/app.bsky.feed.post/1',
        cid: 'bafy1',
        author: { handle: 'alice.bsky.social', displayName: 'Alice' },
        record: {
          text: 'Skybrewの感情分析とキーワードレーダー機能が最高で神！ #Skybrew #Svelte',
          createdAt: new Date().toISOString()
        },
        replyCount: 0,
        repostCount: 0,
        likeCount: 5
      }
    },
    {
      post: {
        uri: 'at://did:plc:user2/app.bsky.feed.post/2',
        cid: 'bafy2',
        author: { handle: 'bob.bsky.social', displayName: 'Bob' },
        record: {
          text: 'Skybrew開発が楽しいし感動的！ #Skybrew #Svelte',
          createdAt: new Date().toISOString()
        },
        replyCount: 1,
        repostCount: 2,
        likeCount: 10
      }
    }
  ];

  await page.addInitScript(({ session, feed }) => {
    localStorage.setItem('skybrew_session', JSON.stringify(session));
    localStorage.setItem('skybrew_savedAccounts', JSON.stringify([session]));

    (window as any).agent = {
      session: session,
      resumeSession: async () => ({ data: session }),
      getTimeline: async () => ({ data: { feed } }),
      getProfile: async () => ({ data: { did: session.did, handle: session.handle } }),
      listNotifications: async () => ({ data: { notifications: [] } }),
      app: {
        bsky: {
          feed: {
            searchPosts: async () => ({ data: { posts: feed.map(f => f.post) } })
          }
        }
      }
    };
  }, { session: mockSession, feed: mockFeed });

  await page.goto('/');

  // 1. Open Search Column & Analytics
  await page.click('button[title="分析ビューを切り替え"]');

  // 2. Fill Search input
  await page.fill('input[placeholder*="Search posts"]', 'Skybrew');
  await page.press('input[placeholder*="Search posts"]', 'Enter');

  // 3. Verify Sentiment Status and Radar Node Map
  await expect(page.locator('text=ポジティブ優勢')).toBeVisible();
  await expect(page.locator('text=キーワード相関レーダー (ノードマップ)')).toBeVisible();

  await page.screenshot({ path: '/home/jules/verification/screenshots/sentiment_radar.png' });
});
