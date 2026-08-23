<script lang="ts">
  import { onMount } from 'svelte';
  import { appState, initStore } from '$lib/store.svelte';
  import LoginForm from '$lib/components/LoginForm.svelte';
  import Column from '$lib/components/Column.svelte';
  import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  import Composer from '$lib/components/Composer.svelte';
  import { switchAccount, removeAccountSession } from '$lib/store.svelte';
  import { Settings, LogOut, Home, Bell, Search, User, X, Plus, Users, Feather, UserCheck, UserPlus, ChevronUp, TrendingUp } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';

  let isStoreLoaded = $state(false);
  let isSettingsOpen = $state(false);
  let isComposerOpen = $state(false);
  let isAccountMenuOpen = $state(false);
  let isAddingAccount = $state(false);

  // Manage active columns state
  type ColumnType = 'home' | 'search' | 'users' | 'notifications' | 'profile' | 'thread' | 'trends';
  type ColumnDef = { id: string, type: ColumnType, title: string, query?: string, uri?: string };

  // Start with all standard columns visible by default
  let columns = $state<ColumnDef[]>([
    { id: 'col-home', type: 'home', title: 'Home', query: '' },
    { id: 'col-search-default', type: 'search', title: 'Search', query: '' },
    { id: 'col-notifications', type: 'notifications', title: 'Notifications', query: '' },
    { id: 'col-profile', type: 'profile', title: 'Profile', query: '' }
  ]);

  // Derived state to easily check if a standard column type (non-search) is active
  let activeTypes = $derived(new Set(columns.filter(c => c.type !== 'search').map(c => c.type)));
  let searchColumns = $derived(columns.filter(c => c.type === 'search'));
  let usersColumns = $derived(columns.filter(c => c.type === 'users'));

  onMount(async () => {
    await initStore();
    isStoreLoaded = true;
  });

  async function handleLogout() {
    appState.session = null;
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__?.invoke) {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load('settings.json', { autoSave: true });
        await store.set('session', null);
      }
    } catch(e) {
      console.error(e);
    }
  }

  function toggleColumn(type: 'home' | 'notifications' | 'profile' | 'trends', title: string) {
    if (activeTypes.has(type)) {
      // Remove it
      columns = columns.filter(col => col.type !== type);
    } else {
      // Add it and scroll to the end
      columns = [...columns, { id: `col-${type}-${Date.now()}`, type, title, query: '' }];
      scrollToEnd();
    }
  }

  function openSearchWithQuery(query: string) {
    const existing = columns.find(c => c.type === 'search' && c.query === query);
    if (existing) {
      scrollToColumn(existing.id);
    } else {
      columns = [...columns, { id: `col-search-${Date.now()}`, type: 'search', title: `Search: ${query}`, query }];
      scrollToEnd();
    }
  }

  function addSearchColumn() {
    columns = [...columns, { id: `col-search-${Date.now()}`, type: 'search', title: 'Search', query: '' }];
    scrollToEnd();
  }

  function addUsersColumn() {
    columns = [...columns, { id: `col-users-${Date.now()}`, type: 'users', title: 'Find Users', query: '' }];
    scrollToEnd();
  }

  function openProfile(handle: string) {
    // Check if a profile column for this handle already exists
    const existing = columns.find(c => c.type === 'profile' && c.query === handle);
    if (existing) {
      scrollToColumn(existing.id);
    } else {
      columns = [...columns, { id: `col-profile-${Date.now()}`, type: 'profile', title: handle, query: handle }];
      scrollToEnd();
    }
  }

  function openThread(uri: string) {
    const existing = columns.find(c => c.type === 'thread' && c.uri === uri);
    if (existing) {
      scrollToColumn(existing.id);
    } else {
      const id = `col-thread-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      columns = [...columns, { id, type: 'thread', title: 'Thread', uri, query: '' }];
      scrollToEnd();
    }
  }

  function scrollToEnd() {
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

  function scrollToColumn(id: string) {
    const colElement = document.getElementById(id);
    if (colElement) {
       colElement.scrollIntoView({ behavior: 'smooth', inline: 'start' });
    }
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

      <div class="flex-1 flex flex-col gap-1 p-2 mt-2 overflow-y-auto">
        <button
          onclick={() => isComposerOpen = true}
          class="flex items-center justify-center md:justify-start gap-3 p-2 mb-2 rounded bg-primary text-white hover:opacity-90 transition-opacity font-bold shadow-sm"
        >
          <Feather size={16} />
          <span class="hidden md:block text-xs">Post</span>
        </button>

        <button
          onclick={() => toggleColumn('home', 'Home')}
          class="flex items-center gap-3 p-2 rounded transition-colors {activeTypes.has('home') ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-surface text-secondary'}"
        >
          <Home size={16} />
          <span class="hidden md:block text-xs">Home</span>
        </button>

        <button
          onclick={() => toggleColumn('trends', 'Trends')}
          class="flex items-center gap-3 p-2 rounded transition-colors {activeTypes.has('trends') ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-surface text-secondary'}"
        >
          <TrendingUp size={16} />
          <span class="hidden md:block text-xs">Trends</span>
        </button>

        <!-- Search base button -->
        <button
          onclick={addSearchColumn}
          class="flex items-center gap-3 p-2 rounded hover:bg-surface text-secondary transition-colors group"
        >
          <Search size={16} />
          <span class="hidden md:block text-xs flex-1 text-left">Search</span>
          <Plus size={12} class="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <!-- Nested active Search columns -->
        {#if searchColumns.length > 0}
          <div class="hidden md:flex flex-col gap-0.5 ml-7 mb-1 border-l border-border pl-2">
            {#each searchColumns as sCol}
              <div class="flex items-center group/scol rounded hover:bg-surface">
                 <button
                   class="flex-1 text-left px-2 py-1 text-[11px] text-secondary truncate"
                   onclick={() => scrollToColumn(sCol.id)}
                 >
                   {sCol.query ? sCol.query : '(New Search)'}
                 </button>
                 <button
                   onclick={() => removeColumn(sCol.id)}
                   class="p-1 text-secondary hover:text-destructive opacity-0 group-hover/scol:opacity-100 transition-opacity"
                 >
                   <X size={10} />
                 </button>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Users base button -->
        <button
          onclick={addUsersColumn}
          class="flex items-center gap-3 p-2 rounded hover:bg-surface text-secondary transition-colors group"
        >
          <Users size={16} />
          <span class="hidden md:block text-xs flex-1 text-left">Users</span>
          <Plus size={12} class="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <!-- Nested active Users columns -->
        {#if usersColumns.length > 0}
          <div class="hidden md:flex flex-col gap-0.5 ml-7 mb-1 border-l border-border pl-2">
            {#each usersColumns as uCol}
              <div class="flex items-center group/ucol rounded hover:bg-surface">
                 <button
                   class="flex-1 text-left px-2 py-1 text-[11px] text-secondary truncate"
                   onclick={() => scrollToColumn(uCol.id)}
                 >
                   {uCol.query ? uCol.query : '(Find Users)'}
                 </button>
                 <button
                   onclick={() => removeColumn(uCol.id)}
                   class="p-1 text-secondary hover:text-destructive opacity-0 group-hover/ucol:opacity-100 transition-opacity"
                 >
                   <X size={10} />
                 </button>
              </div>
            {/each}
          </div>
        {/if}

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

      <div class="p-2 border-t border-border flex flex-col gap-1 relative">
        <!-- Account Switcher Popover -->
        {#if isAccountMenuOpen}
          <div class="absolute bottom-full left-2 mb-2 w-56 bg-surface border border-border rounded-lg shadow-xl p-2 z-50 flex flex-col gap-1 text-xs">
            <div class="px-2 py-1 font-bold text-secondary text-[11px] border-b border-border mb-1">
              アカウント切替
            </div>
            {#each appState.savedAccounts as acc}
              <div class="flex items-center justify-between p-1.5 rounded hover:bg-background transition-colors {appState.session?.did === acc.did ? 'bg-primary/10 font-bold text-primary' : ''}">
                <button
                  class="flex-1 text-left truncate mr-2"
                  onclick={async () => {
                    if (appState.session?.did !== acc.did) {
                      const ok = await switchAccount(acc.did);
                      if (ok) toast.success(`@${acc.handle} に切り替えました`);
                      else toast.error('アカウント切り替えに失敗しました');
                    }
                    isAccountMenuOpen = false;
                  }}
                >
                  @{acc.handle}
                </button>
                <button
                  onclick={async (e) => {
                    e.stopPropagation();
                    await removeAccountSession(acc.did);
                    toast.info(`@${acc.handle} を削除しました`);
                  }}
                  class="p-1 hover:text-destructive text-secondary"
                  title="アカウント解除"
                >
                  <X size={12} />
                </button>
              </div>
            {/each}

            <button
              onclick={() => {
                isAddingAccount = true;
                isAccountMenuOpen = false;
              }}
              class="flex items-center gap-2 p-1.5 mt-1 rounded border border-dashed border-border hover:bg-background text-primary font-medium w-full text-left"
            >
              <UserPlus size={14} />
              <span>アカウントを追加</span>
            </button>
          </div>
        {/if}

        <!-- Current Account Button -->
        <button
          onclick={() => isAccountMenuOpen = !isAccountMenuOpen}
          class="flex items-center justify-between p-2 rounded hover:bg-surface transition-colors w-full text-secondary"
          title="アカウント切り替え"
        >
          <div class="flex items-center gap-2 truncate">
            <UserCheck size={14} class="text-primary shrink-0" />
            <span class="hidden md:block text-xs font-semibold truncate">
              @{appState.session?.handle || 'Account'}
            </span>
          </div>
          <ChevronUp size={12} class="hidden md:block shrink-0 opacity-60" />
        </button>

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
          <div id={col.id} class="h-full shrink-0">
            <!-- Bind query so sidebar updates automatically when user types in column -->
            <Column
              type={col.type}
              title={col.title}
              bind:searchQuery={col.query}
              uri={col.uri}
              onClose={() => removeColumn(col.id)}
              onOpenProfile={openProfile}
              onOpenThread={openThread}
              onOpenSearch={openSearchWithQuery}
            />
          </div>
        {/each}
      </div>
    </main>

    <SettingsDialog bind:open={isSettingsOpen} />
    <Composer bind:open={isComposerOpen} />

    {#if isAddingAccount}
      <div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
        <LoginForm onCancel={() => isAddingAccount = false} />
      </div>
    {/if}
  </div>
{/if}
