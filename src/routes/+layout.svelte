<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { appState } from '$lib/store.svelte';

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

  // Apply custom CSS variables for typography and colors
  $effect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--font-family-base', appState.fontFamily);
      root.style.setProperty('--font-size-base', `${appState.fontSize}px`);
      root.style.setProperty('--primary', appState.primaryColor);
    }
  });
</script>

{@render children()}
