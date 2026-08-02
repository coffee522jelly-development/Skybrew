<script lang="ts">
  import { agent } from '$lib/api';
  import { updateSetting } from '$lib/store.svelte';

  let identifier = $state('');
  let password = $state('');
  let error = $state('');
  let isLoading = $state(false);

  async function handleLogin(e: Event) {
    e.preventDefault();
    isLoading = true;
    error = '';

    try {
      const { data } = await agent.login({ identifier, password });
      await updateSetting('session', data);
    } catch (err: any) {
      error = err.message || 'Login failed';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="flex flex-col items-center justify-center min-h-screen p-4">
  <div class="w-full max-w-sm p-6 bg-surface rounded-lg shadow-xl border">
    <div class="flex justify-center mb-4">
       <div class="w-10 h-10 rounded bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">B</div>
    </div>
    <h2 class="text-xl font-bold mb-5 text-center tracking-tight">Skybrew</h2>

    {#if error}
      <div class="mb-4 p-2 bg-destructive/10 text-destructive rounded text-xs">
        {error}
      </div>
    {/if}

    <form onsubmit={handleLogin} class="space-y-3">
      <div>
        <label for="identifier" class="block text-xs font-semibold mb-1 text-secondary">Handle or Email</label>
        <input
          id="identifier"
          type="text"
          bind:value={identifier}
          placeholder="e.g. user.bsky.social"
          required
          class="w-full px-3 py-1.5 text-sm border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
        />
      </div>

      <div>
        <label for="password" class="block text-xs font-semibold mb-1 text-secondary">App Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          required
          class="w-full px-3 py-1.5 text-sm border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        class="w-full py-1.5 px-4 mt-2 bg-primary text-white text-sm rounded shadow hover:opacity-90 disabled:opacity-50 transition-all font-semibold tracking-wide"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  </div>
</div>
