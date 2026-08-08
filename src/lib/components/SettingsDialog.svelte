<script lang="ts">
  import { appState, updateSetting, type Theme } from '$lib/store.svelte';
  import { X } from 'lucide-svelte';

  let { open = $bindable(false) } = $props<{ open: boolean }>();

  function close() {
    open = false;
  }
</script>

{#if open}
  <!-- Backdrop -->
  <div class="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity" role="button" tabindex="0" onclick={close} onkeydown={(e) => e.key === 'Enter' && close()}></div>

  <!-- Dialog -->
  <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] text-sm">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-border flex justify-between items-center bg-surface">
      <h2 class="text-base font-bold tracking-tight">Settings</h2>
      <button onclick={close} class="p-1.5 hover:bg-black/5 rounded transition-colors">
        <X size={16} />
      </button>
    </div>

    <!-- Content -->
    <div class="p-4 overflow-y-auto space-y-6">

      <!-- Theme -->
      <section>
        <h3 class="text-xs font-semibold mb-2 uppercase tracking-wider text-secondary">Theme</h3>
        <div class="grid grid-cols-3 gap-2">
          {#each ['light', 'dark', 'system'] as t}
            <button
              class="px-3 py-1.5 border rounded text-xs capitalize transition-colors {appState.theme === t ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:border-secondary text-secondary'}"
              onclick={() => updateSetting('theme', t as Theme)}
            >
              {t}
            </button>
          {/each}
        </div>
      </section>

      <!-- Typography -->
      <section>
        <h3 class="text-xs font-semibold mb-2 uppercase tracking-wider text-secondary">Typography</h3>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium mb-1" for="font-family">Font Family</label>
            <select
              id="font-family"
              class="w-full px-2 py-1.5 border border-border rounded bg-background text-xs focus:outline-none focus:border-primary"
              value={appState.fontFamily}
              onchange={(e) => updateSetting('fontFamily', e.currentTarget.value)}
            >
              <option value="Inter, Avenir, Helvetica, Arial, sans-serif">System UI (ゴシック)</option>
              <option value="Georgia, serif">System UI (明朝)</option>
              <option value="'Noto Sans JP', sans-serif">Noto Sans JP</option>
              <option value="'Noto Serif JP', serif">Noto Serif JP</option>
              <option value="'Zen Kaku Gothic New', sans-serif">Zen Kaku Gothic New</option>
              <option value="'Zen Maru Gothic', sans-serif">Zen Maru Gothic (丸ゴシック)</option>
              <option value="'BIZ UDGothic', sans-serif">BIZ UDGothic (ユニバーサルデザイン)</option>
              <option value="'BIZ UDMincho', serif">BIZ UDMincho (ユニバーサルデザイン)</option>
              <option value="'M PLUS Rounded 1c', sans-serif">M PLUS Rounded 1c (丸ゴシック)</option>
              <option value="'Sawarabi Gothic', sans-serif">Sawarabi Gothic</option>
              <option value="'Sawarabi Mincho', serif">Sawarabi Mincho</option>
              <option value="'Shippori Mincho', serif">Shippori Mincho</option>
              <option value="'Klee One', cursive">Klee One (手書き風)</option>
              <option value="'Yusei Magic', cursive">Yusei Magic (手書き風)</option>
              <option value="'Hachi Maru Pop', cursive">Hachi Maru Pop (ポップ体)</option>
              <option value="'Mochiy Pop One', sans-serif">Mochiy Pop One (ポップ体)</option>
              <option value="'DotGothic16', monospace">DotGothic16 (ドット絵風)</option>
              <option value="'Rampart One', cursive">Rampart One (ブロック体)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium mb-1" for="font-size">
              Base Font Size: {appState.fontSize}px
            </label>
            <input
              id="font-size"
              type="range"
              min="10"
              max="20"
              value={appState.fontSize}
              oninput={(e) => updateSetting('fontSize', parseInt(e.currentTarget.value))}
              class="w-full accent-primary"
            />
          </div>
        </div>
      </section>

      <!-- Accent Color -->
      <section>
        <h3 class="text-xs font-semibold mb-2 uppercase tracking-wider text-secondary">Accent Color</h3>
        <div class="flex gap-2">
          {#each ['#2563eb', '#16a34a', '#db2777', '#ca8a04', '#9333ea'] as color}
            <button
              class="w-6 h-6 rounded-full border transition-transform hover:scale-110 {appState.primaryColor === color ? 'border-foreground scale-110' : 'border-transparent'}"
              style="background-color: {color};"
              onclick={() => updateSetting('primaryColor', color)}
              aria-label="Set accent color to {color}"
            ></button>
          {/each}
        </div>
      </section>

    </div>
  </div>
{/if}
