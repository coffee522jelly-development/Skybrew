<script lang="ts">
  import { onMount } from 'svelte';
  import { agent } from '$lib/api';
  import { appState } from '$lib/store.svelte';
  import Post from './Post.svelte';
  import { RefreshCw, Bell, Search as SearchIcon, X } from 'lucide-svelte';

  let { title = 'Home', type = 'home', initialQuery = '', searchQuery = $bindable(''), onClose } = $props<{
    title?: string,
    type?: 'home' | 'notifications' | 'profile' | 'search' | 'users',
    initialQuery?: string,
    searchQuery?: string,
    onClose?: () => void
  }>();

  let feed = $state<any[]>([]);
  let actors = $state<any[]>([]);
  let error = $state('');
  let isRefreshing = $state(false);

  let loading = $state(true);
  let displayTitle = $state('');

  $effect(() => {
     if (type === 'search' && !searchQuery && initialQuery) {
        searchQuery = initialQuery;
     }
     displayTitle = title;
     loading = type !== 'search';
  });

  async function loadFeed() {
    if (type === 'search' && !searchQuery.trim()) {
      loading = false;
      isRefreshing = false;
      feed = [];
      return;
    }

    try {
      error = '';
      let response;
      if (type === 'home') {
        response = await agent.getTimeline({ limit: 30 });
        feed = response.data.feed;
      } else if (type === 'profile') {
        const actor = appState.session?.handle;
        if (actor) {
           response = await agent.getAuthorFeed({ actor, limit: 30 });
           feed = response.data.feed;
        } else {
           error = 'No session found';
        }
      } else if (type === 'notifications') {
        response = await agent.listNotifications({ limit: 30 });
        feed = response.data.notifications;
      } else if (type === 'search') {
        response = await agent.app.bsky.feed.searchPosts({ q: searchQuery, limit: 30 });
        feed = response.data.posts.map(post => ({ post }));
        displayTitle = `Search: ${searchQuery}`;
      } else if (type === 'users') {
        response = await agent.searchActors({ q: searchQuery, limit: 30 });
        actors = response.data.actors;
        displayTitle = `Users: ${searchQuery}`;
      }
    } catch (err: any) {
      error = `Failed to load ${displayTitle}`;
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

  function handleSearchSubmit(e: Event) {
    e.preventDefault();
    if (searchQuery.trim()) {
      loading = true;
      loadFeed();
    }
  }

  onMount(() => {
    setTimeout(() => {
       if (type !== 'search' || searchQuery.trim()) {
         loadFeed();
       }
    }, 0);

    const interval = setInterval(() => {
      if (!isRefreshing && type !== 'search') {
        loadFeed().catch(() => {});
      }
    }, 30000);

    return () => clearInterval(interval);
  });
</script>

<div class="flex flex-col w-[320px] border-r border-border shrink-0 h-screen bg-background group/col">
  <!-- Header -->
  <div class="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border p-2.5 flex flex-col gap-2">
    <div class="flex justify-between items-center h-6">
      <h2 class="font-semibold text-sm tracking-tight truncate pr-2 flex-1">{displayTitle}</h2>

      <div class="flex items-center gap-1 shrink-0">
        <button
          onclick={refresh}
          disabled={loading || isRefreshing || (type === 'search' && !searchQuery.trim())}
          class="p-1 hover:bg-surface rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} class={isRefreshing ? 'animate-spin text-primary' : ''} />
        </button>
        {#if onClose}
          <button
            onclick={onClose}
            class="p-1 text-secondary hover:text-destructive hover:bg-destructive/10 rounded transition-colors opacity-0 group-hover/col:opacity-100"
            aria-label="Close column"
          >
            <X size={14} />
          </button>
        {/if}
      </div>
    </div>

    <!-- Search Input for Search Column -->
    {#if type === 'search' || type === 'users'}
      <form onsubmit={handleSearchSubmit} class="flex w-full relative">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder={type === 'search' ? 'Search posts...' : 'Search users...'}
          class="w-full pl-7 pr-2 py-1 text-xs border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <SearchIcon size={12} class="absolute left-2.5 top-2 text-secondary" />
      </form>
    {/if}
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto">
    {#if (type === 'search' || type === 'users') && !searchQuery.trim() && feed.length === 0 && actors.length === 0}
      <div class="p-8 flex flex-col items-center justify-center text-secondary h-full text-center space-y-3 opacity-70">
        <SearchIcon size={32} class="text-primary mb-2" />
        <p class="font-semibold text-sm text-foreground">{type === 'search' ? 'Search Posts' : 'Find Users'}</p>
        <p class="text-xs">{type === 'search' ? 'Enter a keyword to search posts.' : 'Enter a name to find users.'}</p>
      </div>
    {:else if loading}
      <div class="p-6 text-center text-secondary text-xs">
        <RefreshCw size={16} class="animate-spin mx-auto mb-2 text-primary" />
        <p>Loading...</p>
      </div>
    {:else if error}
      <div class="p-3 m-3 bg-destructive/10 text-destructive rounded text-center text-xs break-words">
        {error}
        <button onclick={refresh} class="mt-1 underline hover:no-underline block mx-auto">Try again</button>
      </div>
    {:else if feed.length === 0 && actors.length === 0}
      <div class="p-6 text-center text-secondary text-xs">
        No items found.
      </div>
    {:else}
      <div class="flex flex-col">
        {#each actors as actor}
          <div class="p-3 border-b border-border hover:bg-surface/50 transition-colors flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-surface shrink-0 overflow-hidden border border-border">
              {#if actor.avatar}
                <img src={actor.avatar} alt="Avatar" class="w-full h-full object-cover" />
              {/if}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-xs truncate">{actor.displayName || actor.handle}</p>
              <p class="text-[11px] text-secondary truncate">@{actor.handle}</p>
              {#if actor.description}
                <p class="mt-1 text-[11px] break-words line-clamp-2 leading-snug">{actor.description}</p>
              {/if}
            </div>
            <button
              aria-label="Follow or Unfollow" class="px-2.5 py-1 rounded text-[10px] font-bold shrink-0 transition-colors {actor.viewer?.following ? 'bg-surface text-secondary hover:bg-destructive/10 hover:text-destructive before:content-[\'Following\'] hover:before:content-[\'Unfollow\']' : 'bg-primary text-white hover:opacity-90 before:content-[\'Follow\']'}"
              onclick={async () => {
                if (actor.viewer?.following) {
                  await agent.deleteFollow(actor.viewer.following);
                  actor.viewer.following = undefined;
                } else {
                  const res = await agent.follow(actor.did);
                  actor.viewer = actor.viewer || {};
                  actor.viewer.following = res.uri;
                }
                actors = [...actors];
              }}
            >
            </button>
          </div>
        {/each}
        {#each feed as item}
          {#if type === 'notifications'}
             <div class="p-3 border-b border-border hover:bg-surface/50 flex gap-2 text-xs">
                <Bell size={14} class="text-primary shrink-0 mt-0.5" />
                <div class="min-w-0">
                  <span class="font-semibold truncate block">{item.author?.displayName || item.author?.handle}</span>
                  <span class="opacity-80 block truncate">{item.reason}</span>
                  <div class="text-secondary text-[10px] mt-1 leading-tight">Notification format may vary.</div>
                </div>
             </div>
          {:else if item.post}
             <Post post={item.post} />
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</div>
