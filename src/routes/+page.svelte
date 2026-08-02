<script lang="ts">
  import { onMount } from 'svelte';
  import { appState, initStore } from '$lib/store.svelte';
  import LoginForm from '$lib/components/LoginForm.svelte';
  import Column from '$lib/components/Column.svelte';
  import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  import { Settings, LogOut, Home, Bell, Search, User, X } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';

  let isStoreLoaded = $state(false);
  let isSettingsOpen = $state(false);

  // Manage active columns
  type ColumnDef = { id: string, type: 'home' | 'notifications' | 'profile' | 'search', title: string };
  let columns = $state<ColumnDef[]>([{ id: 'col-1', type: 'home', title: 'Home' }]);

  onMount(async () => {
    await initStore();
    isStoreLoaded = true;
  });

  function handleLogout() {
    appState.session = null;
  }

  function addColumn(type: ColumnDef['type'], title: string) {
    if (type === 'search') {
      toast.info('Search functionality is coming soon!');
      return;
    }

    // Scroll to the end after adding
    columns = [...columns, { id: `col-${Date.now()}`, type, title }];
    setTimeout(() => {
      const container = document.getElementById('columns-container');
      if (container) {
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
      }
    }, 100);
  }

  function removeColumn(id: string) {
    columns = columns.filter(col => col.id !== id);
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
        <span class="hidden md:block ml-3 font-bold text-xl">Skybrew</span>
      </div>

      <div class="flex-1 flex flex-col gap-2 p-2 mt-4">
        <button
          onclick={() => addColumn('home', 'Home')}
          class="flex items-center gap-4 p-3 rounded-full hover:bg-surface text-foreground font-semibold transition-colors"
        >
          <Home size={24} />
          <span class="hidden md:block">Home</span>
        </button>
        <button
          onclick={() => addColumn('search', 'Search')}
          class="flex items-center gap-4 p-3 rounded-full hover:bg-surface transition-colors"
        >
          <Search size={24} />
          <span class="hidden md:block">Search</span>
        </button>
        <button
          onclick={() => addColumn('notifications', 'Notifications')}
          class="flex items-center gap-4 p-3 rounded-full hover:bg-surface transition-colors"
        >
          <Bell size={24} />
          <span class="hidden md:block">Notifications</span>
        </button>
        <button
          onclick={() => addColumn('profile', 'Profile')}
          class="flex items-center gap-4 p-3 rounded-full hover:bg-surface transition-colors"
        >
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
    <main id="columns-container" class="flex-1 flex overflow-x-auto bg-surface relative">
      <div class="flex h-full">
        {#each columns as col (col.id)}
          <div class="relative group">
            <Column type={col.type} title={col.title} />
            <button
              onclick={() => removeColumn(col.id)}
              class="absolute top-4 right-12 p-2 bg-background/80 hover:bg-destructive text-secondary hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm z-20"
              aria-label="Remove column"
            >
              <X size={16} />
            </button>
          </div>
        {/each}
      </div>
    </main>

    <SettingsDialog bind:open={isSettingsOpen} />
  </div>
{/if}
