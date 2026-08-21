<script lang="ts">
  import { onMount } from 'svelte';
  import { agent } from '$lib/api';
  import { TrendingUp, TrendingDown, Minus, RefreshCw, BarChart2, Hash, Tag } from 'lucide-svelte';

  let { query = '', onSelectKeyword }: { query: string; onSelectKeyword?: (word: string) => void } = $props();

  let isLoading = $state(false);
  let hourlyCounts = $state<number[]>(new Array(24).fill(0));
  let topKeywords = $state<{ word: string; count: number; isHashtag: boolean }[]>([]);
  let recentCount = $state(0);
  let prev24Count = $state(0);
  let percentChange = $state(0);
  let totalSampled = $state(0);

  async function analyze() {
    if (!query.trim()) return;
    isLoading = true;

    try {
      // Fetch up to 100 recent posts for the search query
      const res = await agent.app.bsky.feed.searchPosts({ q: query.trim(), limit: 100 });
      const posts = res.data.posts || [];
      totalSampled = posts.length;

      const now = new Date().getTime();
      const oneHourMs = 3600 * 1000;
      const buckets = new Array(24).fill(0);

      let countLast1h = 0;
      let count24hAgo = 0;

      for (const post of posts) {
        const record = post.record as any;
        const createdAt = record?.createdAt ? new Date(record.createdAt).getTime() : now;
        const diffMs = now - createdAt;
        const diffHours = Math.floor(diffMs / oneHourMs);

        if (diffHours >= 0 && diffHours < 24) {
          // Index 23 is current hour (0-1h ago), Index 0 is 23-24h ago
          const bucketIndex = 23 - diffHours;
          buckets[bucketIndex] = (buckets[bucketIndex] || 0) + 1;
        }

        if (diffMs <= oneHourMs) {
          countLast1h++;
        } else if (diffMs >= 23 * oneHourMs && diffMs <= 24 * oneHourMs) {
          count24hAgo++;
        }
      }

      hourlyCounts = buckets;
      recentCount = countLast1h;
      prev24Count = count24hAgo;

      if (prev24Count === 0) {
        percentChange = recentCount > 0 ? 100 : 0;
      } else {
        percentChange = Math.round(((recentCount - prev24Count) / prev24Count) * 100);
      }

      // Extract Frequent Keywords & Hashtags
      const wordMap = new Map<string, number>();
      const stopWords = new Set(['https', 'http', 'com', 'org', 'the', 'and', 'for', 'this', 'that', 'with', 'from', 'have', 'there', 'what', 'your', 'about', 'https:', 'http:']);
      const currentQueryLower = query.toLowerCase();

      for (const post of posts) {
        const text = (post.record as any)?.text || '';
        if (!text) continue;

        // Extract Hashtags
        const hashtags = text.match(/#[\w\u3040-\u30ff\u4e00-\u9faf]+/g) || [];
        for (const tag of hashtags) {
          const lowerTag = tag.toLowerCase();
          if (lowerTag !== currentQueryLower) {
            wordMap.set(tag, (wordMap.get(tag) || 0) + 1);
          }
        }

        // Extract Word tokens (>2 chars)
        const tokens = text.split(/[\s,.:;!?"'()\[\]{}／＼〜～、。「」『』・\n\r\t]+/);
        for (const token of tokens) {
          const cleanToken = token.trim();
          const lowerToken = cleanToken.toLowerCase();
          if (
            cleanToken.length >= 2 &&
            !cleanToken.startsWith('#') &&
            !cleanToken.startsWith('http') &&
            !stopWords.has(lowerToken) &&
            lowerToken !== currentQueryLower
          ) {
            wordMap.set(cleanToken, (wordMap.get(cleanToken) || 0) + 1);
          }
        }
      }

      const sortedWords = Array.from(wordMap.entries())
        .map(([word, count]) => ({
          word,
          count,
          isHashtag: word.startsWith('#')
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      topKeywords = sortedWords;
    } catch (err) {
      console.error('Failed to calculate search analytics:', err);
    } finally {
      isLoading = false;
    }
  }

  $effect(() => {
    if (query) {
      analyze();
    }
  });

  let maxBucket = $derived(Math.max(...hourlyCounts, 1));
</script>

<div class="p-2.5 bg-surface/60 border-b border-border text-xs flex flex-col gap-2">
  <!-- Analytics Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-1.5 font-bold text-foreground">
      <BarChart2 size={14} class="text-primary" />
      <span>検索分析 (直近24時間)</span>
    </div>
    <button
      onclick={analyze}
      disabled={isLoading}
      class="p-1 hover:bg-surface rounded text-secondary transition-colors disabled:opacity-50"
      title="分析を再計算"
    >
      <RefreshCw size={12} class={isLoading ? 'animate-spin text-primary' : ''} />
    </button>
  </div>

  {#if isLoading}
    <div class="py-3 text-center text-secondary text-[11px] animate-pulse">
      データを集計中...
    </div>
  {:else if totalSampled === 0}
    <div class="py-2 text-center text-secondary text-[11px]">
      分析可能な投稿データが見つかりませんでした。
    </div>
  {:else}
    <!-- Key Metrics Grid -->
    <div class="grid grid-cols-2 gap-2 bg-background/50 p-2 rounded border border-border/50">
      <div>
        <div class="text-[10px] text-secondary">直近1時間の件数</div>
        <div class="text-base font-bold text-foreground leading-tight">{recentCount} <span class="text-[10px] font-normal text-secondary">件</span></div>
      </div>
      <div>
        <div class="text-[10px] text-secondary">24時間前比較</div>
        <div class="flex items-center gap-1 text-xs font-bold mt-0.5">
          {#if percentChange > 0}
            <span class="text-success flex items-center gap-0.5">
              <TrendingUp size={13} />
              +{percentChange}%
            </span>
          {:else if percentChange < 0}
            <span class="text-destructive flex items-center gap-0.5">
              <TrendingDown size={13} />
              {percentChange}%
            </span>
          {:else}
            <span class="text-secondary flex items-center gap-0.5">
              <Minus size={13} />
              0%
            </span>
          {/if}
          <span class="text-[10px] font-normal text-secondary">({prev24Count}件/時)</span>
        </div>
      </div>
    </div>

    <!-- Hourly Distribution Chart -->
    <div class="flex flex-col gap-1 mt-1">
      <div class="flex justify-between text-[10px] text-secondary">
        <span>24時間前</span>
        <span>投稿ボリューム分布</span>
        <span>現在</span>
      </div>
      <div class="h-12 flex items-end gap-1 pt-1 pb-0.5 px-1 bg-background/40 rounded border border-border/40">
        {#each hourlyCounts as count, i}
          <div
            class="flex-1 bg-primary/70 hover:bg-primary rounded-t-sm transition-all relative group"
            style="height: {Math.max((count / maxBucket) * 100, 8)}%;"
          >
            <!-- Tooltip -->
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-foreground text-background text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap z-20 pointer-events-none shadow-md">
              {24 - i}時間前: {count}件
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Top Frequent Keywords & Hashtags -->
    {#if topKeywords.length > 0}
      <div class="flex flex-col gap-1 mt-1.5 pt-1.5 border-t border-border/40">
        <div class="text-[10px] font-semibold text-secondary flex items-center gap-1">
          <Tag size={10} class="text-primary" />
          <span>関連キーワード・ハッシュタグ</span>
        </div>
        <div class="flex flex-wrap gap-1 mt-0.5">
          {#each topKeywords as kw}
            <button
              onclick={() => onSelectKeyword?.(kw.word)}
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors border {kw.isHashtag ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 font-medium' : 'bg-background border-border text-foreground hover:bg-surface hover:border-primary/50'}"
              title="{kw.word} で検索"
            >
              {#if kw.isHashtag}
                <Hash size={10} />
              {/if}
              <span>{kw.word}</span>
              <span class="text-[9px] text-secondary">({kw.count})</span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>
