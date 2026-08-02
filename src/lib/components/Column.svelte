<script lang="ts">
  import { onMount } from 'svelte';
  import { agent } from '$lib/api';
  import { appState } from '$lib/store.svelte';
  import Post from './Post.svelte';
  import { RefreshCw, Bell } from 'lucide-svelte';

  const { title = 'Home', type = 'home' } = $props<{ title?: string, type?: 'home' | 'notifications' | 'profile' }>();

  let feed = $state<any[]>([]);
  let loading = $state(true);
  let error = $state('');
  let isRefreshing = $state(false);

  async function loadFeed() {
    try {
      error = '';
      let response;
      if (type === 'home') {
        response = await agent.getTimeline({ limit: 30 });
        feed = response.data.feed;
      } else if (type === 'profile') {
        // Need actor parameter for profile, use current session handle
        const actor = appState.session?.handle;
        if (actor) {
           response = await agent.getAuthorFeed({ actor, limit: 30 });
           feed = response.data.feed;
        } else {
           error = 'No session found';
        }
      } else if (type === 'notifications') {
        response = await agent.listNotifications({ limit: 30 });
        // Notifications API returns 'notifications' instead of 'feed'
        feed = response.data.notifications;
      }
    } catch (err: any) {
      error = `Failed to load ${title}`;
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

    // Simple polling
    const interval = setInterval(() => {
      if (!isRefreshing) {
        // Silent refresh in background
        loadFeed().catch(() => {});
      }
    }, 30000);

    return () => clearInterval(interval);
  });
</script>

<div class="flex flex-col w-[320px] border-r border-border shrink-0 h-screen bg-background">
  <!-- Header -->
  <div class="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border p-2.5 flex justify-between items-center">
    <h2 class="font-semibold text-sm tracking-tight">{title}</h2>
    <button
      onclick={refresh}
      disabled={loading || isRefreshing}
      class="p-1.5 hover:bg-surface rounded transition-colors disabled:opacity-50"
    >
      <RefreshCw size={14} class={isRefreshing ? 'animate-spin text-primary' : ''} />
    </button>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto scrollbar-thin">
    {#if loading}
      <div class="p-6 text-center text-secondary text-xs">
        <RefreshCw size={16} class="animate-spin mx-auto mb-2 text-primary" />
        <p>Loading {title}...</p>
      </div>
    {:else if error}
      <div class="p-3 m-3 bg-destructive/10 text-destructive rounded text-center text-xs">
        {error}
        <button onclick={refresh} class="mt-1 underline hover:no-underline">Try again</button>
      </div>
    {:else if feed.length === 0}
      <div class="p-6 text-center text-secondary text-xs">
        No items found.
      </div>
    {:else}
      <div class="flex flex-col">
        {#each feed as item}
          {#if type === 'notifications'}
            <!-- Minimal notification renderer -->
             <div class="p-3 border-b border-border hover:bg-surface/50 flex gap-2 text-xs">
                <Bell size={14} class="text-primary shrink-0 mt-0.5" />
                <div>
                  <span class="font-semibold">{item.author?.displayName || item.author?.handle}</span>
                  <span class="ml-1 opacity-80">{item.reason}</span>
                  <div class="text-secondary text-[10px] mt-1 leading-tight">Notification format may vary.</div>
                </div>
             </div>
          {:else if item.post}
             <!-- Home and Profile feeds use the standard post renderer -->
             <Post post={item.post} />
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  /* Custom scrollbar for columns */
  .scrollbar-thin::-webkit-scrollbar {
    width: 4px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: var(--border);
    border-radius: 4px;
  }
  .scrollbar-thin:hover::-webkit-scrollbar-thumb {
    background-color: var(--secondary);
  }
</style>
