<script lang="ts">
  import { formatDistanceToNow } from 'date-fns';
  import { Heart, MessageCircle, Repeat2 } from 'lucide-svelte';
  import { agent } from '$lib/api';
  import { toast } from 'svelte-sonner';

  let { post = $bindable() } = $props<{ post: any }>();

  let author = $derived(post.author);
  let record = $derived(post.record);
  let embed = $derived(post.embed);

  let createdAt = $derived(record.createdAt ? new Date(record.createdAt) : new Date());
  let timeAgo = $derived(formatDistanceToNow(createdAt, { addSuffix: true }));

  let isLiked = $derived(!!post.viewer?.like);
  let isReposted = $derived(!!post.viewer?.repost);
  let isLikeLoading = $state(false);
  let isRepostLoading = $state(false);

  async function toggleLike() {
    if (isLikeLoading) return;
    isLikeLoading = true;
    try {
      if (isLiked) {
        await agent.deleteLike(post.viewer.like);
        post.viewer.like = undefined;
        post.likeCount = Math.max(0, (post.likeCount || 1) - 1);
      } else {
        const res = await agent.like(post.uri, post.cid);
        if (!post.viewer) post.viewer = {};
        post.viewer.like = res.uri;
        post.likeCount = (post.likeCount || 0) + 1;
      }
    } catch (e) {
      toast.error('Failed to update like status');
      console.error(e);
    } finally {
      isLikeLoading = false;
    }
  }

  async function toggleRepost() {
    if (isRepostLoading) return;
    isRepostLoading = true;
    try {
      if (isReposted) {
        await agent.deleteRepost(post.viewer.repost);
        post.viewer.repost = undefined;
        post.repostCount = Math.max(0, (post.repostCount || 1) - 1);
      } else {
        const res = await agent.repost(post.uri, post.cid);
        if (!post.viewer) post.viewer = {};
        post.viewer.repost = res.uri;
        post.repostCount = (post.repostCount || 0) + 1;
      }
    } catch (e) {
      toast.error('Failed to update repost status');
      console.error(e);
    } finally {
      isRepostLoading = false;
    }
  }

  function handleReply() {
    toast.info('Reply feature is under construction');
  }
</script>

<div class="p-3 border-b border-border hover:bg-surface/50 transition-colors text-xs">
  <div class="flex gap-2.5">
    <!-- Avatar -->
    <img
      src={author.avatar || 'https://via.placeholder.com/48'}
      alt={author.handle}
      class="w-8 h-8 rounded-full object-cover shrink-0"
    />

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-baseline gap-1.5 mb-0.5">
        <span class="font-bold truncate text-foreground">{author.displayName || author.handle}</span>
        <span class="text-secondary opacity-80 truncate">@{author.handle}</span>
        <span class="text-secondary opacity-60 ml-auto shrink-0 text-[10px]">{timeAgo}</span>
      </div>

      <div class="text-foreground leading-snug break-words whitespace-pre-wrap mb-2">
        {record.text}
      </div>

      <!-- Images (if any) -->
      {#if embed && embed.$type === 'app.bsky.embed.images#view' && embed.images}
        <div class="grid grid-cols-2 gap-1 mb-2">
          {#each embed.images as image}
            <div class="aspect-square rounded overflow-hidden border border-border">
              <img
                src={image.thumb}
                alt={image.alt || 'Post image'}
                class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          {/each}
        </div>
      {/if}

      <!-- Actions -->
      <div class="flex gap-4 text-secondary mt-1">
        <button
          onclick={handleReply}
          class="flex items-center gap-1 hover:text-primary transition-colors group"
        >
          <div class="p-1 rounded group-hover:bg-primary/10">
            <MessageCircle size={14} />
          </div>
          <span class="text-[10px]">{post.replyCount || 0}</span>
        </button>

        <button
          onclick={toggleRepost}
          disabled={isRepostLoading}
          class="flex items-center gap-1 hover:text-success transition-colors group {isReposted ? 'text-success' : ''}"
        >
          <div class="p-1 rounded group-hover:bg-success/10">
            <Repeat2 size={14} class={isRepostLoading ? 'animate-pulse' : ''} />
          </div>
          <span class="text-[10px]">{post.repostCount || 0}</span>
        </button>

        <button
          onclick={toggleLike}
          disabled={isLikeLoading}
          class="flex items-center gap-1 hover:text-destructive transition-colors group {isLiked ? 'text-destructive' : ''}"
        >
          <div class="p-1 rounded group-hover:bg-destructive/10">
            <Heart size={14} class="{isLiked ? 'fill-current' : ''} {isLikeLoading ? 'animate-pulse' : ''}" />
          </div>
          <span class="text-[10px]">{post.likeCount || 0}</span>
        </button>
      </div>
    </div>
  </div>
</div>
