import { BskyAgent } from '@atproto/api';

export const agent: BskyAgent =
  typeof window !== 'undefined' && (window as any).agent
    ? (window as any).agent
    : new BskyAgent({ service: 'https://bsky.social' });

if (typeof window !== 'undefined') {
  (window as any).agent = agent;
}
