<script lang="ts">
  import { onMount } from 'svelte';
  import { appState, initStore } from '$lib/store.svelte';
  import LoginForm from '$lib/components/LoginForm.svelte';
  import Column from '$lib/components/Column.svelte';
  import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  import { Settings, LogOut, Home, Bell, Search, User } from 'lucide-svelte';

  let isStoreLoaded = $state(false);
  let isSettingsOpen = $state(false);

  onMount(async () => {
    await initStore();
    isStoreLoaded = true;
  });

  function handleLogout() {
    // In a real app, we'd also clear the store
    appState.session = null;
  }
</script>

{#if !isStoreLoaded}
  <div class="flex h-screen items-center justify-center bg-background text-primary">
    <p class="text-xl font-bold animate-pulse">Loading Client...</p>
  </div>
{:else if !appState.session}
  <LoginForm />
{:else}
  <div class="flex h-screen overflow-hidden bg-surface">
    <!-- Sidebar / Nav -->
    <nav class="w-16 md:w-64 border-r border-border flex flex-col bg-background shrink-0 transition-all duration-300">
      <div class="p-4 flex items-center justify-center md:justify-start">
        <div class="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold text-xl">B</div>
        <span class="hidden md:block ml-3 font-bold text-xl">SkyDeck</span>
      </div>

      <div class="flex-1 flex flex-col gap-2 p-2 mt-4">
        <button class="flex items-center gap-4 p-3 rounded-full hover:bg-surface text-primary font-semibold transition-colors">
          <Home size={24} />
          <span class="hidden md:block">Home</span>
        </button>
        <button class="flex items-center gap-4 p-3 rounded-full hover:bg-surface transition-colors">
          <Search size={24} />
          <span class="hidden md:block">Explore</span>
        </button>
        <button class="flex items-center gap-4 p-3 rounded-full hover:bg-surface transition-colors">
          <Bell size={24} />
          <span class="hidden md:block">Notifications</span>
        </button>
        <button class="flex items-center gap-4 p-3 rounded-full hover:bg-surface transition-colors">
          <User size={24} />
          <span class="hidden md:block">Profile</span>
        </button>
      </div>

      <div class="p-4 border-t border-border flex flex-col gap-2">
        <button
          onclick={() => isSettingsOpen = true}
          class="flex items-center gap-3 p-2 rounded-lg hover:bg-surface transition-colors w-full"
        >
          <Settings size={20} class="text-secondary" />
          <span class="hidden md:block text-sm font-medium">Settings</span>
        </button>
        <button
          onclick={handleLogout}
          class="flex items-center gap-3 p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors w-full"
        >
          <LogOut size={20} />
          <span class="hidden md:block text-sm font-medium">Logout</span>
        </button>
      </div>
    </nav>

    <!-- Main Content Area (Columns) -->
    <main class="flex-1 flex overflow-x-auto bg-surface relative">
      <!-- Columns Container -->
      <div class="flex h-full">
        <Column title="Home" />
        <!-- Can add more columns here like Notifications, specific feeds, etc. -->
      </div>
    </main>

    <SettingsDialog bind:open={isSettingsOpen} />
  </div>
{/if}
