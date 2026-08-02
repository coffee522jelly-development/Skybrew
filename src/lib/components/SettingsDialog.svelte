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
  <div role="button" tabindex="0" class="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity" onclick={close} onkeydown={(e) => e.key === "Enter" && close()}></div>

  <!-- Dialog -->
  <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-surface">
      <h2 class="text-xl font-bold">Settings</h2>
      <button onclick={close} class="p-2 hover:bg-black/5 rounded-full transition-colors">
        <X size={20} />
      </button>
    </div>

    <!-- Content -->
    <div class="p-6 overflow-y-auto space-y-8">

      <!-- Theme -->
      <section>
        <h3 class="text-lg font-semibold mb-3">Theme</h3>
        <div class="grid grid-cols-3 gap-3">
          {#each ['light', 'dark', 'system'] as t}
            <button
              class="px-4 py-2 border rounded-md capitalize transition-colors {appState.theme === t ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:border-secondary text-secondary'}"
              onclick={() => updateSetting('theme', t as Theme)}
            >
              {t}
            </button>
          {/each}
        </div>
      </section>

      <!-- Typography -->
      <section>
        <h3 class="text-lg font-semibold mb-3">Typography</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1" for="font-family">Font Family</label>
            <select
              id="font-family"
              class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:border-primary"
              value={appState.fontFamily}
              onchange={(e) => updateSetting('fontFamily', e.currentTarget.value)}
            >
              <option value="Inter, Avenir, Helvetica, Arial, sans-serif">System UI</option>
              <option value="'Noto Sans JP', sans-serif">Noto Sans JP</option>
              <option value="'Zen Kaku Gothic New', sans-serif">Zen Kaku Gothic New</option>
              <option value="Georgia, serif">Serif</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1" for="font-size">
              Base Font Size: {appState.fontSize}px
            </label>
            <input
              id="font-size"
              type="range"
              min="12"
              max="24"
              value={appState.fontSize}
              oninput={(e) => updateSetting('fontSize', parseInt(e.currentTarget.value))}
              class="w-full accent-primary"
            />
          </div>
        </div>
      </section>

      <!-- Accent Color -->
      <section>
        <h3 class="text-lg font-semibold mb-3">Accent Color</h3>
        <div class="flex gap-3">
          {#each ['#2563eb', '#16a34a', '#db2777', '#ca8a04', '#9333ea'] as color}
            <button
              class="w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 {appState.primaryColor === color ? 'border-foreground scale-110' : 'border-transparent'}"
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
