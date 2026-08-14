import { BskyAgent } from '@atproto/api';

export const agent = new BskyAgent({
  service: 'https://bsky.social',
});

if (typeof window !== 'undefined') {
  (window as any).agent = agent;
}
