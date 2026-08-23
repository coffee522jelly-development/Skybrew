<script lang="ts">
  import { agent } from '$lib/api';
  import { toast } from 'svelte-sonner';
  import { X, UserPen } from 'lucide-svelte';

  let { open = $bindable(false), profileData, onUpdated }: { open?: boolean; profileData?: any; onUpdated?: () => void } = $props();

  let displayName = $state('');
  let description = $state('');
  let isLoading = $state(false);

  $effect(() => {
    if (open && profileData) {
      displayName = profileData.displayName || '';
      description = profileData.description || '';
    }
  });

  async function handleSave(e: Event) {
    e.preventDefault();
    if (isLoading) return;

    isLoading = true;
    try {
      await agent.upsertProfile(async (existing) => {
        return {
          ...existing,
          displayName: displayName.trim(),
          description: description.trim(),
        };
      });

      toast.success('プロフィールを更新しました');
      open = false;
      onUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'プロフィールの更新に失敗しました');
      console.error(err);
    } finally {
      isLoading = false;
    }
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
    <div class="bg-surface border border-border rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-3 border-b border-border">
        <div class="flex items-center gap-1.5 font-bold text-sm">
          <UserPen size={16} class="text-primary" />
          <span>プロフィール編集</span>
        </div>
        <button
          onclick={() => open = false}
          class="p-1 rounded-full hover:bg-destructive/10 text-secondary hover:text-destructive transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <!-- Form -->
      <form onsubmit={handleSave} class="p-4 flex flex-col gap-3">
        <div>
          <label for="edit-display-name" class="block text-xs font-semibold mb-1 text-secondary">表示名</label>
          <input
            id="edit-display-name"
            type="text"
            bind:value={displayName}
            placeholder="表示名を入力..."
            class="w-full px-3 py-1.5 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isLoading}
          />
        </div>

        <div>
          <label for="edit-description" class="block text-xs font-semibold mb-1 text-secondary">自己紹介 (Bio)</label>
          <textarea
            id="edit-description"
            bind:value={description}
            placeholder="自己紹介文を入力..."
            rows="4"
            class="w-full p-2.5 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            disabled={isLoading}
          ></textarea>
        </div>

        <!-- Footer Buttons -->
        <div class="flex justify-end gap-2 mt-2 pt-2 border-t border-border">
          <button
            type="button"
            onclick={() => open = false}
            disabled={isLoading}
            class="px-3 py-1.5 rounded text-xs border border-border hover:bg-surface transition-colors disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isLoading}
            class="px-4 py-1.5 rounded text-xs font-bold bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? '保存中...' : '保存する'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
