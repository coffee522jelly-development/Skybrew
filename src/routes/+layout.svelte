<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { appState } from '$lib/store.svelte';
  import { Toaster } from 'svelte-sonner';

  let { children } = $props();

  // Apply theme class (dark/light) to document body
  $effect(() => {
    if (typeof window !== 'undefined') {
      const isDark =
        appState.theme === 'dark' ||
        (appState.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  });

  // Convert hex to rgb format for Tailwind opacity support
  function hexToRgb(hex: string) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return `${r} ${g} ${b}`;
  }

  // Apply custom CSS variables for typography and colors
  $effect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--font-family-base', appState.fontFamily);
      root.style.setProperty('--font-size-base', `${appState.fontSize}px`);
      // Update the root font-size so that tailwind's rem-based text classes scale accordingly
      root.style.fontSize = `${appState.fontSize}px`;
      // Important: save as RGB values for tailwind
      if (appState.primaryColor.startsWith('#')) {
        root.style.setProperty('--primary', hexToRgb(appState.primaryColor));
      } else {
        // Fallback or handle pre-converted values
        root.style.setProperty('--primary', appState.primaryColor);
      }
    }
  });
</script>

{@render children()}
<Toaster richColors position="bottom-right" theme={appState.theme === 'system' ? 'system' : appState.theme} />
