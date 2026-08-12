<script lang="ts">
  import { agent } from '$lib/api';
  import { RichText } from '@atproto/api';
  import { toast } from 'svelte-sonner';
  import { X } from 'lucide-svelte';

  let { open = $bindable(false) } = $props<{ open?: boolean }>();

  let text = $state('');
  let isLoading = $state(false);

  async function submitPost() {
    if (!text.trim() || isLoading) return;

    isLoading = true;
    try {
      const rt = new RichText({ text: text.trim() });
      await rt.detectFacets(agent);

      await agent.post({
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
      });

      toast.success('投稿しました');
      open = false;
      text = '';
    } catch (e: any) {
      toast.error(e.message || '投稿に失敗しました');
      console.error(e);
    } finally {
      isLoading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      submitPost();
    }
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
    <div class="bg-surface border border-border rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col relative">
      <!-- Header -->
      <div class="flex items-center justify-between p-3 border-b border-border">
        <h2 class="font-bold text-sm">新規投稿</h2>
        <button
          onclick={() => open = false}
          class="p-1 rounded-full hover:bg-destructive/10 text-secondary hover:text-destructive transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <!-- Body -->
      <div class="p-4 flex flex-col gap-3">
        <textarea
          bind:value={text}
          onkeydown={handleKeydown}
          placeholder="今どうしてる？ (Ctrl+Enterで送信)"
          class="w-full bg-background border border-border rounded p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none min-h-[120px]"
          disabled={isLoading}
        ></textarea>
      </div>

      <!-- Footer -->
      <div class="p-3 border-t border-border flex items-center justify-between bg-surface/50">
        <div class="text-xs text-secondary">
          {text.length} 文字
        </div>
        <div class="flex gap-2">
          <button
            onclick={() => open = false}
            disabled={isLoading}
            class="px-4 py-1.5 rounded text-xs border border-border hover:bg-surface transition-colors disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onclick={submitPost}
            disabled={!text.trim() || isLoading}
            class="px-4 py-1.5 rounded text-xs font-bold bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? '送信中...' : '投稿する'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
