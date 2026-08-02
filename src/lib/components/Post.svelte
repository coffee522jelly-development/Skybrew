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

<div class="p-4 border-b border-border hover:bg-surface/50 transition-colors">
  <div class="flex gap-3">
    <!-- Avatar -->
    <img
      src={author.avatar || 'https://via.placeholder.com/48'}
      alt={author.handle}
      class="w-12 h-12 rounded-full object-cover shrink-0"
    />

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-baseline gap-2 mb-1">
        <span class="font-bold truncate text-foreground">{author.displayName || author.handle}</span>
        <span class="text-secondary text-sm truncate">@{author.handle}</span>
        <span class="text-secondary text-sm ml-auto shrink-0">{timeAgo}</span>
      </div>

      <div class="text-foreground leading-relaxed break-words whitespace-pre-wrap mb-3">
        {record.text}
      </div>

      <!-- Images (if any) -->
      {#if embed && embed.$type === 'app.bsky.embed.images#view' && embed.images}
        <div class="grid grid-cols-2 gap-2 mb-3">
          {#each embed.images as image}
            <div class="aspect-square rounded-lg overflow-hidden border border-border">
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
      <div class="flex gap-6 text-secondary">
        <button
          onclick={handleReply}
          class="flex items-center gap-1.5 hover:text-primary transition-colors group"
        >
          <div class="p-1.5 rounded-full group-hover:bg-primary/10">
            <MessageCircle size={18} />
          </div>
          <span class="text-sm">{post.replyCount || 0}</span>
        </button>

        <button
          onclick={toggleRepost}
          disabled={isRepostLoading}
          class="flex items-center gap-1.5 hover:text-success transition-colors group {isReposted ? 'text-success' : ''}"
        >
          <div class="p-1.5 rounded-full group-hover:bg-success/10">
            <Repeat2 size={18} class={isRepostLoading ? 'animate-pulse' : ''} />
          </div>
          <span class="text-sm">{post.repostCount || 0}</span>
        </button>

        <button
          onclick={toggleLike}
          disabled={isLikeLoading}
          class="flex items-center gap-1.5 hover:text-destructive transition-colors group {isLiked ? 'text-destructive' : ''}"
        >
          <div class="p-1.5 rounded-full group-hover:bg-destructive/10">
            <Heart size={18} class="{isLiked ? 'fill-current' : ''} {isLikeLoading ? 'animate-pulse' : ''}" />
          </div>
          <span class="text-sm">{post.likeCount || 0}</span>
        </button>
      </div>
    </div>
  </div>
</div>
