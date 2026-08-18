<script lang="ts">
  import { agent } from '$lib/api';
  import { saveDraft, deleteDraft, appState, type PostDraft } from '$lib/store.svelte';
  import { RichText } from '@atproto/api';
  import { toast } from 'svelte-sonner';
  import { X, Image as ImageIcon, Bookmark, Trash2, FileText } from 'lucide-svelte';

  let { open = $bindable(false) } = $props<{ open?: boolean }>();

  type ImageItem = {
    file?: File;
    dataUrl: string;
    alt: string;
  };

  let text = $state('');
  let images = $state<ImageItem[]>([]);
  let currentDraftId = $state<string | null>(null);
  let isDraftsModalOpen = $state(false);
  let isLoading = $state(false);
  let fileInput = $state<HTMLInputElement | null>(null);

  function dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  async function handleSaveDraft() {
    if (!text.trim() && images.length === 0) return;
    const id = currentDraftId || `draft-${Date.now()}`;
    await saveDraft({
      id,
      text,
      images: images.map(img => ({ dataUrl: img.dataUrl, alt: img.alt })),
    });
    currentDraftId = id;
    toast.success('下書きを保存しました');
  }

  function loadDraft(draft: PostDraft) {
    text = draft.text;
    images = draft.images.map((img, i) => ({
      dataUrl: img.dataUrl,
      alt: img.alt,
      file: dataURLtoFile(img.dataUrl, `draft_img_${i}.png`)
    }));
    currentDraftId = draft.id;
    isDraftsModalOpen = false;
    toast.info('下書きを読み込みました');
  }

  async function handleDeleteDraft(id: string, e: MouseEvent) {
    e.stopPropagation();
    await deleteDraft(id);
    if (currentDraftId === id) {
      currentDraftId = null;
    }
    toast.info('下書きを削除しました');
  }

  function resetForm() {
    text = '';
    images = [];
    currentDraftId = null;
  }

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
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const fileToUpload = img.file || dataURLtoFile(img.dataUrl, `upload_${i}.png`);
          const res = await agent.uploadBlob(fileToUpload, { encoding: fileToUpload.type });
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

      if (currentDraftId) {
        await deleteDraft(currentDraftId);
      }

      toast.success('投稿しました');
      open = false;
      resetForm();
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
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={() => isDraftsModalOpen = true}
            class="flex items-center gap-1 text-xs text-secondary hover:text-primary px-2 py-1 rounded hover:bg-background transition-colors"
          >
            <FileText size={14} />
            <span>下書き ({appState.drafts.length})</span>
          </button>
          <button
            onclick={() => open = false}
            class="p-1 rounded-full hover:bg-destructive/10 text-secondary hover:text-destructive transition-colors"
          >
            <X size={16} />
          </button>
        </div>
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
            type="button"
            onclick={handleSaveDraft}
            disabled={(!text.trim() && images.length === 0) || isLoading}
            class="flex items-center gap-1 px-3 py-1.5 rounded text-xs border border-border hover:bg-surface transition-colors disabled:opacity-40"
            title="下書き保存"
          >
            <Bookmark size={14} />
            <span>下書き保存</span>
          </button>
          <button
            onclick={() => open = false}
            disabled={isLoading}
            class="px-3 py-1.5 rounded text-xs border border-border hover:bg-surface transition-colors disabled:opacity-50"
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

    <!-- Drafts Modal -->
    {#if isDraftsModalOpen}
      <div class="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
        <div class="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md p-4 flex flex-col gap-3 max-h-[80vh]">
          <div class="flex items-center justify-between border-b border-border pb-2">
            <h3 class="font-bold text-sm">保存された下書き</h3>
            <button onclick={() => isDraftsModalOpen = false} class="p-1 text-secondary hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto flex flex-col gap-2 my-1">
            {#if appState.drafts.length === 0}
              <p class="text-xs text-secondary text-center py-6">保存された下書きはありません。</p>
            {:else}
              {#each appState.drafts as draft (draft.id)}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  onclick={() => loadDraft(draft)}
                  class="p-2.5 rounded border border-border bg-background hover:border-primary cursor-pointer flex items-start justify-between group transition-colors"
                >
                  <div class="flex-1 pr-2">
                    <p class="text-xs text-foreground line-clamp-2">{draft.text || '(画像のみの投稿)'}</p>
                    <div class="flex items-center gap-2 mt-1.5 text-[10px] text-secondary">
                      <span>{new Date(draft.updatedAt).toLocaleString('ja-JP')}</span>
                      {#if draft.images.length > 0}
                        <span>• 画像 {draft.images.length} 枚</span>
                      {/if}
                    </div>
                  </div>
                  <button
                    onclick={(e) => handleDeleteDraft(draft.id, e)}
                    class="p-1 text-secondary hover:text-destructive opacity-80 group-hover:opacity-100 transition-opacity"
                    title="削除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
