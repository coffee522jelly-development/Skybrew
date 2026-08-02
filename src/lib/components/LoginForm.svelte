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

<div class="flex flex-col items-center justify-center min-h-screen">
  <div class="w-full max-w-md p-8 bg-surface rounded-xl shadow-lg border">
    <h2 class="text-2xl font-bold mb-6 text-center text-primary">Login to Bluesky</h2>

    {#if error}
      <div class="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
        {error}
      </div>
    {/if}

    <form onsubmit={handleLogin} class="space-y-4">
      <div>
        <label for="identifier" class="block text-sm font-medium mb-1">Handle or Email</label>
        <input
          id="identifier"
          type="text"
          bind:value={identifier}
          placeholder="e.g. user.bsky.social"
          required
          class="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium mb-1">App Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          required
          class="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        class="w-full py-2 px-4 bg-primary text-white rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  </div>
</div>
