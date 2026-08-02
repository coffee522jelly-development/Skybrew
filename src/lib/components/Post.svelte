<script lang="ts">
  import { formatDistanceToNow } from 'date-fns';
  import { Heart, MessageCircle, Repeat2 } from 'lucide-svelte';

  let { post } = $props<{ post: any }>();

  // Extract necessary data, handling potential undefined structures gracefully
  let author = $derived(post.author);
  let record = $derived(post.record);
  let embed = $derived(post.embed);

  let createdAt = $derived(record.createdAt ? new Date(record.createdAt) : new Date());
  let timeAgo = $derived(formatDistanceToNow(createdAt, { addSuffix: true }));
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
        <button class="flex items-center gap-1.5 hover:text-primary transition-colors group">
          <div class="p-1.5 rounded-full group-hover:bg-primary/10">
            <MessageCircle size={18} />
          </div>
          <span class="text-sm">{post.replyCount || 0}</span>
        </button>

        <button class="flex items-center gap-1.5 hover:text-success transition-colors group">
          <div class="p-1.5 rounded-full group-hover:bg-success/10">
            <Repeat2 size={18} />
          </div>
          <span class="text-sm">{post.repostCount || 0}</span>
        </button>

        <button class="flex items-center gap-1.5 hover:text-destructive transition-colors group">
          <div class="p-1.5 rounded-full group-hover:bg-destructive/10">
            <Heart size={18} />
          </div>
          <span class="text-sm">{post.likeCount || 0}</span>
        </button>
      </div>
    </div>
  </div>
</div>
