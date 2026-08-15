<script lang="ts">
  import { agent } from '$lib/api';
  import { RichText } from '@atproto/api';
  import { toast } from 'svelte-sonner';
  import { X, Image as ImageIcon } from 'lucide-svelte';

  let { open = $bindable(false) } = $props<{ open?: boolean }>();

  type ImageItem = {
    file: File;
    dataUrl: string;
    alt: string;
  };

  let text = $state('');
  let images = $state<ImageItem[]>([]);
  let isLoading = $state(false);
  let fileInput = $state<HTMLInputElement | null>(null);

  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    if (!target.files) return;

    const files = Array.from(target.files);
    const availableSlots = 4 - images.length;
    if (availableSlots <= 0) {
      toast.error('画像は最大4枚まで追加できます');
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);
    for (const file of filesToProcess) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          images = [...images, { file, dataUrl: event.target.result as string, alt: '' }];
        }
      };
      reader.readAsDataURL(file);
    }

    if (fileInput) fileInput.value = '';
  }

  function removeImage(index: number) {
    images = images.filter((_, i) => i !== index);
  }

  async function submitPost() {
    if ((!text.trim() && images.length === 0) || isLoading) return;

    isLoading = true;
    try {
      const rt = new RichText({ text: text.trim() });
      await rt.detectFacets(agent);

      let embed: any = undefined;
      if (images.length > 0) {
        const uploadedImages = [];
        for (const img of images) {
          const res = await agent.uploadBlob(img.file, { encoding: img.file.type });
          uploadedImages.push({
            image: res.data.blob,
            alt: img.alt || ''
          });
        }
        embed = {
          $type: 'app.bsky.embed.images',
          images: uploadedImages
        };
      }

      await agent.post({
        text: rt.text,
        facets: rt.facets,
        embed,
        createdAt: new Date().toISOString(),
      });

      toast.success('投稿しました');
      open = false;
      text = '';
      images = [];
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

        <!-- Image Previews -->
        {#if images.length > 0}
          <div class="grid grid-cols-2 gap-2 mt-1">
            {#each images as img, i}
              <div class="relative group aspect-video rounded overflow-hidden border border-border bg-background">
                <img src={img.dataUrl} alt="Preview" class="w-full h-full object-cover" />
                <button
                  type="button"
                  onclick={() => removeImage(i)}
                  class="absolute top-1 right-1 p-1 bg-black/60 hover:bg-destructive text-white rounded-full transition-colors"
                  aria-label="Remove image"
                >
                  <X size={12} />
                </button>
                <input
                  type="text"
                  bind:value={img.alt}
                  placeholder="ALTテキストを追加..."
                  class="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 text-[10px] bg-black/70 text-white rounded focus:outline-none focus:bg-black/90"
                />
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="p-3 border-t border-border flex items-center justify-between bg-surface/50">
        <div class="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            multiple
            bind:this={fileInput}
            onchange={handleFileSelect}
            class="hidden"
          />
          <button
            type="button"
            onclick={() => fileInput?.click()}
            disabled={isLoading || images.length >= 4}
            class="p-1.5 rounded hover:bg-surface text-secondary hover:text-primary transition-colors disabled:opacity-40"
            title="画像を添付 (最大4枚)"
          >
            <ImageIcon size={18} />
          </button>
          <span class="text-xs text-secondary">
            {text.length} 文字
          </span>
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
            disabled={(!text.trim() && images.length === 0) || isLoading}
            class="px-4 py-1.5 rounded text-xs font-bold bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? '送信中...' : '投稿する'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
