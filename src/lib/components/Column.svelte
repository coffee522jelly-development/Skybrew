<script lang="ts">
  import { onMount } from 'svelte';
  import { agent } from '$lib/api';
  import Post from './Post.svelte';
  import { RefreshCw } from 'lucide-svelte';

  const { title = 'Home' } = $props<{ title?: string }>();

  let feed = $state<any[]>([]);
  let loading = $state(true);
  let error = $state('');
  let isRefreshing = $state(false);

  async function loadFeed() {
    try {
      error = '';
      const response = await agent.getTimeline({ limit: 30 });
      feed = response.data.feed;
    } catch (err: any) {
      error = 'Failed to load timeline';
      console.error(err);
    } finally {
      loading = false;
      isRefreshing = false;
    }
  }

  async function refresh() {
    isRefreshing = true;
    await loadFeed();
  }

  onMount(() => {
    loadFeed();

    // Simple polling for real-time feel (every 30s)
    const interval = setInterval(() => {
      if (!isRefreshing) {
        // Silent refresh in background, could be optimized to only fetch new
        agent.getTimeline({ limit: 30 }).then(response => {
             // Basic naive merge to avoid flicker if nothing changed,
             // in a real app we'd prepend new items
             feed = response.data.feed;
        }).catch(() => {});
      }
    }, 30000);

    return () => clearInterval(interval);
  });
</script>

<div class="flex flex-col w-[400px] border-r border-border shrink-0 h-screen bg-background">
  <!-- Header -->
  <div class="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4 flex justify-between items-center">
    <h2 class="font-bold text-lg">{title}</h2>
    <button
      onclick={refresh}
      disabled={loading || isRefreshing}
      class="p-2 hover:bg-surface rounded-full transition-colors disabled:opacity-50"
    >
      <RefreshCw size={18} class={isRefreshing ? 'animate-spin text-primary' : ''} />
    </button>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto scrollbar-thin">
    {#if loading}
      <div class="p-8 text-center text-secondary">
        <RefreshCw size={24} class="animate-spin mx-auto mb-2 text-primary" />
        <p>Loading {title}...</p>
      </div>
    {:else if error}
      <div class="p-4 m-4 bg-destructive/10 text-destructive rounded-lg text-center">
        {error}
        <button onclick={refresh} class="mt-2 text-sm underline hover:no-underline">Try again</button>
      </div>
    {:else if feed.length === 0}
      <div class="p-8 text-center text-secondary">
        No posts found.
      </div>
    {:else}
      <div class="flex flex-col">
        {#each feed as item (item.post.uri)}
          <Post post={item.post} />
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  /* Custom scrollbar for columns */
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: var(--border);
    border-radius: 20px;
  }
  .scrollbar-thin:hover::-webkit-scrollbar-thumb {
    background-color: var(--secondary);
  }
</style>
