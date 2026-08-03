<script lang="ts">
  import { onMount } from 'svelte';
  import { appState, initStore } from '$lib/store.svelte';
  import LoginForm from '$lib/components/LoginForm.svelte';
  import Column from '$lib/components/Column.svelte';
  import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  import { Settings, LogOut, Home, Bell, Search, User, X, Plus } from 'lucide-svelte';

  let isStoreLoaded = $state(false);
  let isSettingsOpen = $state(false);

  // Manage active columns state
  type ColumnType = 'home' | 'search' | 'notifications' | 'profile';
  type ColumnDef = { id: string, type: ColumnType, title: string, query?: string };

  // Start with all standard columns visible by default
  let columns = $state<ColumnDef[]>([
    { id: 'col-home', type: 'home', title: 'Home' },
    { id: 'col-search-default', type: 'search', title: 'Search' },
    { id: 'col-notifications', type: 'notifications', title: 'Notifications' },
    { id: 'col-profile', type: 'profile', title: 'Profile' }
  ]);

  // Derived state to easily check if a standard column type (non-search) is active
  let activeTypes = $derived(new Set(columns.filter(c => c.type !== 'search').map(c => c.type)));

  onMount(async () => {
    await initStore();
    isStoreLoaded = true;
  });

  function handleLogout() {
    appState.session = null;
  }

  function toggleColumn(type: 'home' | 'notifications' | 'profile', title: string) {
    if (activeTypes.has(type)) {
      // Remove it
      columns = columns.filter(col => col.type !== type);
    } else {
      // Add it and scroll to the end
      columns = [...columns, { id: `col-${type}-${Date.now()}`, type, title }];
      scrollToEnd();
    }
  }

  function addSearchColumn() {
    columns = [...columns, { id: `col-search-${Date.now()}`, type: 'search', title: 'Search' }];
    scrollToEnd();
  }

  function scrollToEnd() {
    setTimeout(() => {
      const container = document.getElementById('columns-container');
      if (container) {
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
      }
    }, 100);
  }

  // Allow closing via the X button on the column itself
  function removeColumn(id: string) {
    columns = columns.filter(col => col.id !== id);
  }
</script>

{#if !isStoreLoaded}
  <div class="flex h-screen items-center justify-center bg-background text-primary">
    <p class="text-sm font-bold animate-pulse">Loading Client...</p>
  </div>
{:else if !appState.session}
  <LoginForm />
{:else}
  <div class="flex h-screen overflow-hidden bg-surface text-sm">
    <!-- Sidebar / Nav -->
    <nav class="w-14 md:w-48 border-r border-border flex flex-col bg-background shrink-0 transition-all duration-300">
      <div class="p-3 flex items-center justify-center md:justify-start">
        <div class="w-6 h-6 rounded bg-primary text-white flex items-center justify-center font-bold text-xs">B</div>
        <span class="hidden md:block ml-2 font-bold text-sm tracking-wide">Skybrew</span>
      </div>

      <div class="flex-1 flex flex-col gap-1 p-2 mt-2">
        <button
          onclick={() => toggleColumn('home', 'Home')}
          class="flex items-center gap-3 p-2 rounded transition-colors {activeTypes.has('home') ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-surface text-secondary'}"
        >
          <Home size={16} />
          <span class="hidden md:block text-xs">Home</span>
        </button>

        <!-- Search behaves differently: it always adds a new search column -->
        <button
          onclick={addSearchColumn}
          class="flex items-center gap-3 p-2 rounded hover:bg-surface text-secondary transition-colors group"
        >
          <Search size={16} />
          <span class="hidden md:block text-xs flex-1 text-left">Search</span>
          <Plus size={12} class="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button
          onclick={() => toggleColumn('notifications', 'Notifications')}
          class="flex items-center gap-3 p-2 rounded transition-colors {activeTypes.has('notifications') ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-surface text-secondary'}"
        >
          <Bell size={16} />
          <span class="hidden md:block text-xs">Notifications</span>
        </button>
        <button
          onclick={() => toggleColumn('profile', 'Profile')}
          class="flex items-center gap-3 p-2 rounded transition-colors {activeTypes.has('profile') ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-surface text-secondary'}"
        >
          <User size={16} />
          <span class="hidden md:block text-xs">Profile</span>
        </button>
      </div>

      <div class="p-2 border-t border-border flex flex-col gap-1">
        <button
          onclick={() => isSettingsOpen = true}
          class="flex items-center gap-2 p-2 rounded hover:bg-surface transition-colors w-full text-secondary"
        >
          <Settings size={14} />
          <span class="hidden md:block text-xs font-medium">Settings</span>
        </button>
        <button
          onclick={handleLogout}
          class="flex items-center gap-2 p-2 rounded hover:bg-destructive/10 text-destructive transition-colors w-full"
        >
          <LogOut size={14} />
          <span class="hidden md:block text-xs font-medium">Logout</span>
        </button>
      </div>
    </nav>

    <!-- Main Content Area (Columns) -->
    <main id="columns-container" class="flex-1 flex overflow-x-auto bg-surface relative">
      <div class="flex h-full">
        {#each columns as col (col.id)}
          <div class="relative group">
            <Column type={col.type} title={col.title} initialQuery={col.query} />
            <button
              onclick={() => removeColumn(col.id)}
              class="absolute top-2 right-8 p-1 bg-background/80 hover:bg-destructive text-secondary hover:text-white rounded opacity-0 group-hover:opacity-100 transition-all shadow-sm z-20"
              aria-label="Remove column"
            >
              <X size={12} />
            </button>
          </div>
        {/each}
      </div>
    </main>

    <SettingsDialog bind:open={isSettingsOpen} />
  </div>
{/if}
