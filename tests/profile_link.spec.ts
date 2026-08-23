import { test, expect } from '@playwright/test';

test('profile edit dialog and external link card UI test', async ({ page }) => {
  const mockSession = {
    did: 'did:plc:user1',
    handle: 'alice.bsky.social',
    accessJwt: 'mock-access-token',
    refreshJwt: 'mock-refresh-token',
    email: 'alice@example.com'
  };

  const mockProfile = {
    did: 'did:plc:user1',
    handle: 'alice.bsky.social',
    displayName: 'Alice',
    description: 'Skybrew開発者です。',
    followersCount: 10,
    followsCount: 20
  };

  const mockPost = {
    uri: 'at://did:plc:user1/app.bsky.feed.post/100',
    cid: 'bafy100',
    author: { handle: 'alice.bsky.social', displayName: 'Alice' },
    record: {
      text: '新しいアップデートをリリースしました！',
      createdAt: new Date().toISOString()
    },
    embed: {
      $type: 'app.bsky.embed.external#view',
      external: {
        uri: 'https://bsky.app',
        title: 'Bluesky Social',
        description: 'An open social network built on AT Protocol.',
        thumb: 'https://via.placeholder.com/300x150'
      }
    },
    replyCount: 1,
    repostCount: 2,
    likeCount: 5
  };

  await page.addInitScript(({ session, profile, post }) => {
    localStorage.setItem('skybrew_session', JSON.stringify(session));
    localStorage.setItem('skybrew_savedAccounts', JSON.stringify([session]));

    (window as any).agent = {
      session: session,
      resumeSession: async () => ({ data: session }),
      getTimeline: async () => ({ data: { feed: [{ post }] } }),
      getAuthorFeed: async () => ({ data: { feed: [{ post }] } }),
      getProfile: async () => ({ data: profile }),
      listNotifications: async () => ({ data: { notifications: [] } }),
      upsertProfile: async () => ({ uri: 'at://did:plc:user1/app.bsky.actor.profile/self' })
    };
  }, { session: mockSession, profile: mockProfile, post: mockPost });

  await page.goto('/');

  // 1. External link card screenshot
  await expect(page.locator('text=Bluesky Social').first()).toBeVisible();
  await page.screenshot({ path: '/home/jules/verification/screenshots/external_link_card.png' });

  // 2. Open Profile Edit Dialog
  await page.click('button:has-text("プロフィールを編集")');
  await expect(page.locator('text=プロフィール編集')).toBeVisible();
  await page.screenshot({ path: '/home/jules/verification/screenshots/edit_profile_dialog.png' });
});
